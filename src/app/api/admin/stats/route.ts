import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SUPREME_PIN } from "@/lib/default-config";
import { awardsConfig } from "@/lib/awards.config";

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
      .select("amount_total, total_votes")
      .eq("status", "success");

    const totalAmount = (txStats || []).reduce(
      (sum, tx) => sum + tx.amount_total,
      0
    );
    const totalVoters = txStats?.length || 0;

    // Total votes from votes table (for accuracy)
    const { data: voteData } = await supabase
      .from("votes")
      .select("category_id, nominee_id, vote_count");

    const totalVotes = (voteData || []).reduce(
      (sum, v) => sum + v.vote_count,
      0
    );

    // ── Per-category results ────────────────────────────────────

    // Aggregate votes per nominee
    const nomineeVotes: Record<string, number> = {};
    (voteData || []).forEach((v) => {
      const key = `${v.category_id}:${v.nominee_id}`;
      nomineeVotes[key] = (nomineeVotes[key] || 0) + v.vote_count;
    });

    // Map to category results using config
    const categoryResults = awardsConfig
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        nominees: cat.nominees
          .map((nom) => ({
            nomineeId: nom.id,
            nomineeName: nom.name,
            totalVotes: nomineeVotes[`${cat.id}:${nom.id}`] || 0,
          }))
          .sort((a, b) => b.totalVotes - a.totalVotes),
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalVotes,
        totalAmount,
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
