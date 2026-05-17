import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_PRICE_NAIRA } from "@/lib/awards.config";
import type { VoteSelection } from "@/types";

type Provider = "paystack" | "flutterwave" | "manual";

type VerifyResult = { success: true; data?: unknown; error?: string } | { success: false; data?: unknown; error: string };

async function verifyPaystack(reference: string, expectedAmount: number): Promise<VerifyResult> {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return { success: false, error: "Paystack not configured" };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      return { success: false, error: "Payment not successful" };
    }

    const paidAmount = data.data.amount / 100;
    if (paidAmount < expectedAmount) {
      return { success: false, error: "Amount mismatch" };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Paystack verification error:", err);
    return { success: false, error: "Verification failed" };
  }
}

async function verifyFlutterwave(transactionId: string, reference: string, expectedAmount: number): Promise<VerifyResult> {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!publicKey || !secretKey) {
    return { success: false, error: "Flutterwave not configured" };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Flutterwave = require("flutterwave-node-v3");
    const flw = new Flutterwave(publicKey, secretKey);
    
    const response = await flw.Transaction.verify({ id: transactionId.toString(), tx_ref: reference });
    console.log("Flutterwave verification result:", JSON.stringify(response));

    if (response.data.status !== "successful") {
      return { success: false, error: "Payment not successful" };
    }

    const paidAmount = parseFloat(response.data.amount);
    if (paidAmount < expectedAmount) {
      return { success: false, error: "Amount mismatch" };
    }

    return { success: true, data: response.data };
  } catch (err) {
    console.error("Flutterwave verification error:", err);
    return { success: false, error: "Verification failed: " + (err instanceof Error ? err.message : "Unknown error") };
  }
}

export async function POST(req: Request) {
  try {
    const { reference, transactionId, selections, provider, skipVerification } = (await req.json()) as {
      reference: string;
      transactionId: string;
      selections: VoteSelection[];
      provider?: Provider;
      skipVerification?: boolean;
    };

    if (!reference || !selections || selections.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing reference or selections" },
        { status: 400 }
      );
    }

    const totalVotes = selections.reduce((sum, s) => sum + s.votes, 0);
    const expectedAmountNaira = totalVotes * VOTE_PRICE_NAIRA;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Missing payment provider" },
        { status: 400 }
      );
    }

    const paymentProvider = provider;

    let verifyResult: VerifyResult = { success: true };

    // Handle manual/free votes (no payment verification needed)
    if (paymentProvider === "manual") {
      console.log("Processing manual votes - no payment verification needed");
      verifyResult = { success: true };
    } else if (!skipVerification) {
      // Skip verification if Flutterwave already confirmed success
      if (paymentProvider === "paystack") {
        verifyResult = await verifyPaystack(reference, expectedAmountNaira);
      } else {
        if (!transactionId) {
          return NextResponse.json(
            { success: false, error: "Missing transactionId for Flutterwave" },
            { status: 400 }
          );
        }
        verifyResult = await verifyFlutterwave(transactionId, reference, expectedAmountNaira);
      }
    } else {
      console.log("Skipping verification - Flutterwave confirmed success");
    }

    if (!verifyResult.success) {
      console.error("Payment verification failed:", verifyResult.error);
      const supabase = createAdminClient();
      await supabase.from("transactions").insert({
        reference,
        amount_total: expectedAmountNaira * 100,
        total_votes: totalVotes,
        status: "failed",
        payment_provider: paymentProvider,
        paystack_response: verifyResult.data,
      });
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (err) {
      console.error("Failed to create supabase client:", err);
      return NextResponse.json(
        { success: false, error: "Database configuration error" },
        { status: 500 }
      );
    }

    const existing = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .eq("status", "success")
      .single();

    if (existing.data) {
      return NextResponse.json({ success: true, transactionId: existing.data.id });
    }

    const isManualVotes = paymentProvider === "manual";
    const amountTotal = isManualVotes ? 0 : expectedAmountNaira * 100;

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        reference,
        amount_total: amountTotal,
        total_votes: totalVotes,
        status: "success",
        payment_provider: isManualVotes ? "manual" : paymentProvider,
        paystack_response: verifyResult.data,
      })
      .select("id")
      .single();

    if (txError) {
      console.error("Transaction insert error:", txError);
      return NextResponse.json(
        { success: false, error: "Failed to record transaction: " + txError.message },
        { status: 500 }
      );
    }

    if (!transaction) {
      console.error("Transaction insert returned no data");
      return NextResponse.json(
        { success: false, error: "Failed to record transaction" },
        { status: 500 }
      );
    }

    const voteRows = selections.map((sel) => ({
      transaction_id: transaction.id,
      category_id: sel.categoryId,
      nominee_id: sel.nomineeId,
      vote_count: sel.votes,
    }));

    const { error: votesError } = await supabase
      .from("votes")
      .insert(voteRows);

    if (votesError) {
      console.error("Votes insert error:", votesError);
      return NextResponse.json(
        { success: false, error: "Failed to record votes: " + votesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}