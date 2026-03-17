export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";

type WAWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }>;
        // ✅ Delivery receipts, failures, read events, etc.
        statuses?: Array<{
          id?: string; // wamid...
          status?: string; // sent | delivered | read | failed
          timestamp?: string; // unix seconds string
          recipient_id?: string; // wa_id of recipient
          conversation?: any;
          pricing?: any;
          errors?: Array<{
            code?: number;
            title?: string;
            message?: string;
            error_data?: any;
          }>;
        }>;
      };
      field?: string;
    }>;
  }>;
};

function getValue(body: WAWebhookBody) {
  return body.entry?.[0]?.changes?.[0]?.value;
}

function pickInbound(body: WAWebhookBody) {
  const value = getValue(body);
  const msg = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (!msg?.from || !msg?.id) return null;

  return {
    from: msg.from, // wa_id of sender (manager, in our setup)
    waMessageId: msg.id,
    waTimestamp: msg.timestamp ? Number(msg.timestamp) : null,
    type: msg.type ?? "unknown",
    text: msg.text?.body ?? "",
    contactName: contact?.profile?.name ?? "WhatsApp",
  };
}

function logStatuses(body: WAWebhookBody) {
  const value = getValue(body);
  const statuses = value?.statuses;

  if (!Array.isArray(statuses) || statuses.length === 0) return;

  for (const s of statuses) {
    const status = s.status ?? "unknown";
    const id = s.id ?? "(no id)";
    const recipient = s.recipient_id ?? "(no recipient)";
    const ts = s.timestamp ? Number(s.timestamp) : null;

    const base = {
      status,
      id,
      recipient_id: recipient,
      timestamp: ts,
    };

    if (status === "failed") {
      console.log("WA STATUS FAILED:", {
        ...base,
        errors: s.errors ?? [],
      });
    } else {
      console.log("WA STATUS:", base);
    }
  }
}

// Meta verification (GET)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Inbound messages + delivery statuses (POST)
export async function POST(req: NextRequest) {
  let body: WAWebhookBody;

  try {
    body = (await req.json()) as WAWebhookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // ✅ Always log delivery/read/failed receipts if present
  try {
    logStatuses(body);
  } catch (e: any) {
    console.error("WA status logging error:", e?.message ?? e);
  }

  const picked = pickInbound(body);
  if (!picked) return NextResponse.json({ ok: true });

  // Only text for now
  if (picked.type !== "text") {
    console.log("WA inbound (non-text):", { from: picked.from, type: picked.type });
    return NextResponse.json({ ok: true });
  }

  const managerWa = (process.env.MANAGER_WA_ID || "").trim();

  try {
    const db = adminDb();
    const sessions = db.collection("conciergeSessions");

    // We ONLY expect messages from the manager's WhatsApp in this setup.
    if (!managerWa || picked.from !== managerWa) {
      console.log("WA inbound ignored (not manager):", { from: picked.from });
      return NextResponse.json({ ok: true });
    }

    // Expect reply like: "UAB-9848 your message here"
    const match = picked.text.match(/\bUAB-([A-Z0-9]{3,6})\b/i);
    if (!match) {
      console.log("WA manager reply missing code, ignored:", { text: picked.text });
      return NextResponse.json({ ok: true });
    }

    const code = match[1].toUpperCase();
    const cleaned = picked.text.replace(match[0], "").trim();

    // ✅ Option A: session doc id is "UAB-AB12"
    let sessionId: string | null = null;

    // try doc-id first
    const byId = await sessions.doc(`UAB-${code}`).get();
    if (byId.exists) {
      sessionId = byId.id;
    } else {
      // fallback to legacy mapping if you still have older sessions
      const q = await sessions.where("sessionCode", "==", code).limit(1).get();
      if (!q.empty) sessionId = q.docs[0].id;
    }

    if (!sessionId) {
      console.log("WA manager reply code not found:", { code });
      return NextResponse.json({ ok: true });
    }

    // Add message as MANAGER (shows up in manager inbox + website chat)
    await sessions.doc(sessionId).collection("messages").add({
      who: "manager",
      text: cleaned || "(empty)",
      via: "whatsapp",
      waMessageId: picked.waMessageId,
      waTimestamp: picked.waTimestamp,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update session last activity
    await sessions.doc(sessionId).set(
      {
        lastMessageAt: FieldValue.serverTimestamp(),
        status: "live",
      },
      { merge: true }
    );

    console.log("WA manager → session ok:", { sessionId, code, text: cleaned });
  } catch (err: any) {
    console.error("WA webhook error:", err?.message ?? err);
  }

  return NextResponse.json({ ok: true });
}