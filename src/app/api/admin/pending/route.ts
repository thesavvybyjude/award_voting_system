import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin");

    if (!pin || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .eq("payment_provider", "manual")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending transactions:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error("Admin pending error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}