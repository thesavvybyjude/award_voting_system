import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SUPREME_PIN } from "@/lib/default-config";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin");

    if (!pin) {
      return NextResponse.json({ success: false, error: "PIN required" }, { status: 401 });
    }

    const supremePin = process.env.ADMIN_SUPREME_PIN || ADMIN_SUPREME_PIN;
    if (pin !== supremePin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Supreme access required" }, { status: 401 });
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