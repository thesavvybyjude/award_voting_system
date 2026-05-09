import { NextResponse } from "next/server";
import { ADMIN_SUPREME_PIN } from "@/lib/default-config";

export async function POST(req: Request) {
  try {
    const { pin } = (await req.json()) as { pin: string };

    if (!pin) {
      return NextResponse.json(
        { valid: false, error: "PIN required" },
        { status: 400 }
      );
    }

    const supremePin = process.env.ADMIN_SUPREME_PIN || ADMIN_SUPREME_PIN;
    const adminPin = process.env.ADMIN_PIN;

    if (pin === supremePin) {
      return NextResponse.json({ valid: true, role: "supreme" });
    }

    if (pin === adminPin) {
      return NextResponse.json({ valid: true, role: "admin" });
    }

    return NextResponse.json({ valid: false });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
