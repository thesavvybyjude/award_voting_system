import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SUPREME_PIN } from "@/lib/default-config";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin");
    const id = searchParams.get("id");

    if (!pin) {
      return NextResponse.json({ success: false, error: "PIN required" }, { status: 401 });
    }

    const supremePin = process.env.ADMIN_SUPREME_PIN || ADMIN_SUPREME_PIN;
    if (pin !== supremePin) {
      return NextResponse.json({ success: false, error: "Unauthorized: Supreme access required" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing transaction ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("status", "pending")
      .eq("payment_provider", "manual");

    if (deleteError) {
      console.error("Error deleting pending transaction:", deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete pending transaction error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}