export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  sendWhatsAppTemplate,
  WhatsAppGraphError,
} from "@/app/lib/whatsappSend";

const SITE_CODE = "GCN";
const SITE_NAME = "Guardian Collision Network";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const sessionId = String(body?.sessionId || "").trim();
    const liveText = String(body?.liveText || body?.text || "").trim();
    const sourceSite = String(body?.sourceSite || SITE_CODE).trim() || SITE_CODE;
    const brandLabel = String(body?.brandLabel || SITE_NAME).trim() || SITE_NAME;

    if (!sessionId || !liveText) {
      return NextResponse.json(
        { ok: false, error: "Missing sessionId or liveText" },
        { status: 400 }
      );
    }

    const to = (process.env.MANAGER_WA_ID || "").trim();
    if (!to) {
      return NextResponse.json(
        { ok: false, error: "Missing MANAGER_WA_ID" },
        { status: 500 }
      );
    }

    console.log("whatsapp notify -> to:", to, "session:", sessionId, "sourceSite:", sourceSite);

    const templateName = (process.env.WHATSAPP_NOTIFY_TEMPLATE || "").trim();
    const lang = (process.env.WHATSAPP_TEMPLATE_LANG || "en_US").trim();

    if (!templateName) {
      return NextResponse.json(
        { ok: false, error: "Missing WHATSAPP_NOTIFY_TEMPLATE" },
        { status: 500 }
      );
    }

    console.log("whatsapp notify -> using template:", {
      templateName,
      lang,
      brandLabel,
      sourceSite,
    });

    await sendWhatsAppTemplate(to, templateName, {
      languageCode: lang,
      bodyParams: [sessionId, liveText],
    });

    return NextResponse.json({
      ok: true,
      mode: "template",
      sourceSite,
      brandLabel,
    });
  } catch (err) {
    if (err instanceof WhatsAppGraphError) {
      console.error("notify route error:", err);
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          code: err.code,
          subcode: err.subcode,
        },
        { status: 500 }
      );
    }

    console.error("notify route error:", err);
    return NextResponse.json(
      { ok: false, error: String((err as any)?.message || err) },
      { status: 500 }
    );
  }
}
