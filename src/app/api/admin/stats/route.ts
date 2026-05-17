import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SUPREME_PIN } from "@/lib/default-config";
import { awardsConfig, isFreeCategory } from "@/lib/awards.config";

export async function GET(req: Request) {
  try {
    const pin = req.headers.get("x-admin-pin");
    if (!pin) {
      return NextResponse.json({ success: false, error: "PIN required" }, { status: 401 });
    }

    const adminPin = process.env.ADMIN_PIN;
    const supremePin = process.env.ADMIN_SUPREME_PIN || ADMIN_SUPREME_PIN;

    if (pin !== adminPin && pin !== supremePin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // ── Aggregate stats ─────────────────────────────────────────

    // Total successful transactions
    const { data: txStats } = await supabase
      .from("transactions")
      .select("amount_total, total_votes, payment_provider")
      .eq("status", "success");

    const totalAmount = (txStats || []).reduce(
      (sum, tx) => sum + tx.amount_total,
      0
    );
    const totalVoters = txStats?.length || 0;

    // Separate paid vs free transactions
    const paidTx = (txStats || []).filter(tx => tx.payment_provider !== "manual");
    const freeTx = (txStats || []).filter(tx => tx.payment_provider === "manual");
    const paidVoters = paidTx.length;
    const freeVoters = freeTx.length;

    // Total votes from votes table (for accuracy)
    // Join with transactions to know which are free vs paid
    const { data: voteData } = await supabase
      .from("votes")
      .select("category_id, nominee_id, vote_count, transaction_id");

    const { data: allTransactions } = await supabase
      .from("transactions")
      .select("id, payment_provider")
      .eq("status", "success");

    const txProviderMap = new Map(
      (allTransactions || []).map(tx => [tx.id, tx.payment_provider])
    );

    const totalVotes = (voteData || []).reduce(
      (sum, v) => sum + v.vote_count,
      0
    );

    // Separate free vs paid votes
    let freeVotes = 0;
    let paidVotes = 0;
    const nomineeVotes: Record<string, number> = {};
    const nomineeFreeVotes: Record<string, number> = {};
    const nomineePaidVotes: Record<string, number> = {};

    (voteData || []).forEach((v) => {
      const provider = txProviderMap.get(v.transaction_id);
      const isFree = provider === "manual";

      const key = `${v.category_id}:${v.nominee_id}`;
      nomineeVotes[key] = (nomineeVotes[key] || 0) + v.vote_count;

      if (isFree || isFreeCategory(v.category_id)) {
        nomineeFreeVotes[key] = (nomineeFreeVotes[key] || 0) + v.vote_count;
        freeVotes += v.vote_count;
      } else {
        nomineePaidVotes[key] = (nomineePaidVotes[key] || 0) + v.vote_count;
        paidVotes += v.vote_count;
      }
    });

    // Map to category results using config
    const categoryResults = awardsConfig
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        isFree: isFreeCategory(cat.id),
        nominees: cat.nominees
          .map((nom) => ({
            nomineeId: nom.id,
            nomineeName: nom.name,
            totalVotes: nomineeVotes[`${cat.id}:${nom.id}`] || 0,
            freeVotes: nomineeFreeVotes[`${cat.id}:${nom.id}`] || 0,
            paidVotes: nomineePaidVotes[`${cat.id}:${nom.id}`] || 0,
          }))
          .sort((a, b) => b.totalVotes - a.totalVotes),
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalVotes,
        freeVotes,
        paidVotes,
        totalAmount,
        paidVoters,
        freeVoters,
        totalVoters,
        categoryResults,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
