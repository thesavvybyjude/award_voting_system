import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VoteSelection } from "@/types";

export async function POST(req: Request) {
  try {
    const { transactionId, pin } = (await req.json()) as {
      transactionId: string;
      pin: string;
    };

    if (!pin || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Missing transaction ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("status", "pending")
      .eq("payment_provider", "manual")
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found or already processed" }, { status: 404 });
    }

    const selections = transaction.vote_selections as VoteSelection[];
    if (!selections || selections.length === 0) {
      return NextResponse.json({ success: false, error: "No vote selections found" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update({ 
        status: "success", 
        approved_at: new Date().toISOString() 
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return NextResponse.json({ success: false, error: "Failed to approve transaction" }, { status: 500 });
    }

    const voteRows = selections.map((sel) => ({
      transaction_id: transactionId,
      category_id: sel.categoryId,
      nominee_id: sel.nomineeId,
      vote_count: sel.votes,
    }));

    const { error: votesError } = await supabase
      .from("votes")
      .insert(voteRows);

    if (votesError) {
      console.error("Error inserting votes:", votesError);
      return NextResponse.json({ success: false, error: "Failed to record votes" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve transaction error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}