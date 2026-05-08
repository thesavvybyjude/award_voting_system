import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_PRICE_NAIRA } from "@/lib/awards.config";
import type { VoteSelection } from "@/types";

export async function POST(req: Request) {
  try {
    const { selections, payerName, payerPhone } = (await req.json()) as {
      selections: VoteSelection[];
      payerName?: string;
      payerPhone?: string;
    };

    if (!selections || selections.length === 0) {
      return NextResponse.json(
        { success: false, error: "No selections provided" },
        { status: 400 }
      );
    }

    const totalVotes = selections.reduce((sum, s) => sum + s.votes, 0);
    const expectedAmountNaira = totalVotes * VOTE_PRICE_NAIRA;

    const reference = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const supabase = createAdminClient();

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        reference,
        amount_total: expectedAmountNaira * 100,
        total_votes: totalVotes,
        status: "pending",
        payment_provider: "manual",
        vote_selections: selections,
        payer_name: payerName || null,
        payer_phone: payerPhone || null,
      })
      .select("id")
      .single();

    if (txError) {
      console.error("Manual transaction insert error:", txError);
      return NextResponse.json(
        { success: false, error: "Failed to create transaction: " + txError.message },
        { status: 500 }
      );
    }

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference,
    });
  } catch (error) {
    console.error("Create manual transaction error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}