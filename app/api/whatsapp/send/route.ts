export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppText } from "@/app/lib/whatsappSend";

export async function POST(req: NextRequest) {
  const { to, text } = await req.json();

  if (!to || !text) {
    return NextResponse.json({ ok: false, error: "Missing to/text" }, { status: 400 });
  }

  try {
    const result = await sendWhatsAppText(String(to), String(text));
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Send failed" }, { status: 500 });
  }
}