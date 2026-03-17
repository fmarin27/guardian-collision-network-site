export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { Storage } from "@google-cloud/storage";
import crypto from "crypto";
import nodemailer from "nodemailer";

const SITE_CODE = "GCN";
const SITE_NAME = "Guardian Collision Network";

// --- types -----------------------------------------------------

type Incoming = { payload: any; files: File[] };

type StoredAttachment = {
  name: string;
  url: string;
  contentType?: string;
  size?: number;
  path?: string;
  kind?: string;
  uploadedAt?: string;
};

type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

// --- helpers ---------------------------------------------------

function safeJsonParse(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function parseIncoming(req: NextRequest): Promise<Incoming> {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();

    const payloadRaw = (form.get("payload") ?? form.get("data") ?? form.get("json")) as unknown;
    const payload = safeJsonParse(payloadRaw) || { raw: payloadRaw ?? null };

    const files = form.getAll("files");
    const uploads = form.getAll("uploads");
    const attachments = form.getAll("attachments");

    const all = [...files, ...uploads, ...attachments].filter((x) => x instanceof File) as File[];
    return { payload, files: all };
  }

  const payload = await req.json().catch(() => ({}));
  return { payload, files: [] };
}

function shortCodeFromSessionId(sessionId: string) {
  const clean = (sessionId || "").replace(/[^a-zA-Z0-9]/g, "");
  return (clean.slice(-4) || "0000").toUpperCase();
}

function envBool(v: string | undefined, fallback = false) {
  if (v == null) return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase().trim());
}

function envInt(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function titleizeKey(key: string) {
  return key
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatValue(v: any): string {
  if (v === null || v === undefined) return "(blank)";
  if (typeof v === "string") return v.trim() === "" ? "(blank)" : v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    if (v.length === 0) return "(none)";
    return v
      .map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x)))
      .join(", ");
  }
  if (typeof v === "object") {
    try {
      const s = JSON.stringify(v);
      return s.length > 800 ? "(complex value omitted)" : s;
    } catch {
      return "(complex value omitted)";
    }
  }
  return String(v);
}

function displayAnswer(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") {
    const t = v.trim();
    if (!t || t === "(blank)" || t === "default" || t === "unknown") return "";
    return t;
  }
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.map(displayAnswer).filter(Boolean).join(", ");
  return String(v);
}

function firstFilled(...vals: any[]) {
  for (const v of vals) {
    const t = displayAnswer(v);
    if (t) return t;
  }
  return "";
}

function humanIntent(intent: string, answers: Record<string, any>) {
  if (displayAnswer(answers?.intakeStartedIn)) return displayAnswer(answers.intakeStartedIn);
  if (displayAnswer(answers?.serviceRequested)) return "Special Services";
  if (displayAnswer(answers?.accidentScenario) || intent === "accident") return "Accident Help";
  if (intent === "estimate") return "Damage / Estimate Request";
  if (intent === "insurance") return "Insurance / Forms Help";
  return "Website Intake";
}

function buildIntakeSummary(answers: Record<string, any>, payload: any, attachments: StoredAttachment[]) {
  const lines: string[] = [];
  const started = humanIntent(String(payload?.intent || payload?.branch || ""), answers || {});
  const goal = firstFilled(answers?.customerGoal, answers?.helpSummary, answers?.serviceRequested ? `Asked about ${answers.serviceRequested}` : "");
  const finalRoute = firstFilled(
    answers?.finalRoute,
    answers?.contactPreference === "call"
      ? "Manager call requested"
      : answers?.contactPreference === "text"
      ? "Website text handoff"
      : answers?.serviceScheduleRequested === "yes"
      ? "Scheduling follow-up requested"
      : "Manager follow-up requested"
  );
  const path = firstFilled(answers?.intakePath, answers?.accidentScenario, answers?.serviceRequested);
  const vehicleInfo = firstFilled(answers?.vehicleInfo, answers?.vinValue, answers?.vinAnswer);
  const serviceRequested = firstFilled(answers?.serviceRequested);
  const serviceDetails = firstFilled(answers?.serviceDetails, answers?.serviceCustomRequest);
  const callback = firstFilled(answers?.callbackNumber);
  const customerName = firstFilled(answers?.customerName, "Customer");

  lines.push(`Customer Name: ${customerName}`);
  if (callback) lines.push(`Callback Number: ${callback}`);
  lines.push(`Intake Started In: ${started}`);
  if (goal) lines.push(`Customer Goal: ${goal}`);
  if (path) lines.push(`Path Taken: ${path}`);
  if (finalRoute) lines.push(`Final Route: ${finalRoute}`);
  if (serviceRequested) lines.push(`Service Requested: ${serviceRequested}`);
  if (serviceDetails) lines.push(`Service Details: ${serviceDetails}`);
  if (displayAnswer(answers?.serviceScheduleRequested)) lines.push(`Schedule Requested: ${displayAnswer(answers.serviceScheduleRequested)}`);
  if (vehicleInfo) lines.push(`Vehicle Info: ${vehicleInfo}`);
  if (displayAnswer(answers?.accidentScenario)) lines.push(`Accident Type: ${displayAnswer(answers.accidentScenario)}`);
  if (displayAnswer(answers?.vehicleStatus)) lines.push(`Vehicle Status: ${displayAnswer(answers.vehicleStatus)}`);
  if (displayAnswer(answers?.towDetails)) lines.push(`Tow Details: ${displayAnswer(answers.towDetails)}`);
  if (displayAnswer(answers?.claimNumber)) lines.push(`Claim Number: ${displayAnswer(answers.claimNumber)}`);
  if (displayAnswer(answers?.fullCoverage)) lines.push(`Full Coverage: ${displayAnswer(answers.fullCoverage)}`);
  if (displayAnswer(answers?.contactedInsurance)) lines.push(`Contacted Insurance: ${displayAnswer(answers.contactedInsurance)}`);
  if (displayAnswer(answers?.designatedRep)) lines.push(`Designated Representative Help: ${displayAnswer(answers.designatedRep)}`);
  if (displayAnswer(answers?.havePhotos)) lines.push(`Photos Available: ${displayAnswer(answers.havePhotos)}`);
  if (attachments?.length) lines.push(`Attachments Included: ${attachments.length}`);
  return lines.join("\n");
}

function buildIntakeQA(answers: Record<string, any>) {
  const excludeKeys = new Set([
    "files",
    "uploads",
    "attachments",
    "packet",
    "packet_all_4",
    "pdf",
    "pdfBase64",
    "base64",
    "signature",
    "sig",
    "drawnSignature",
    "signedPdf",
    "forms",
    "formData",
    "repairAuthForm",
    "directionToPayForm",
    "designatedRepForm",
    "authEstimateDismantleForm",
  ]);

  const lines: string[] = [];
  const keys = Object.keys(answers || {}).sort((a, b) => a.localeCompare(b));

  for (const k of keys) {
    if (excludeKeys.has(k)) continue;

    const lower = k.toLowerCase();
    if (lower.includes("base64") || lower.includes("signature") || lower.includes("pdf") || lower.includes("packet")) {
      continue;
    }

    lines.push(`${titleizeKey(k)}: ${formatValue((answers as any)[k])}`);
  }

  return lines.join("\n");
}

function normalizeAttachmentName(name: string) {
  return String(name || "upload").replace(/[^\w.\-()]/g, "_");
}

function attachmentKey(a: Partial<StoredAttachment>) {
  if (a.path) return `path:${a.path}`;
  return `name:${String(a.name || "").toLowerCase()}|size:${String(a.size || 0)}|url:${String(a.url || "")}`;
}

function dedupeAttachments(items: StoredAttachment[]) {
  const out: StoredAttachment[] = [];
  const seen = new Set<string>();

  for (const item of items || []) {
    if (!item || !item.name || !item.url) continue;
    const key = attachmentKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function getStorageBucketName() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET_NAME;
  if (!bucketName) throw new Error("Missing FIREBASE_STORAGE_BUCKET_NAME");
  return bucketName;
}

function getStorageClient() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY_JSON");

  const trimmed = raw.trim();
  return trimmed.startsWith("{")
    ? new Storage({ credentials: JSON.parse(trimmed) })
    : new Storage({ keyFilename: trimmed });
}

async function uploadToFirebaseStorage(sessionId: string, file: File, kind?: string): Promise<StoredAttachment> {
  const bucketName = getStorageBucketName();
  const storage = getStorageClient();

  const token = crypto.randomUUID();
  const safeName = normalizeAttachmentName(file.name || "upload");
  const objectPath = `conciergeUploads/${sessionId}/${Date.now()}_${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const bucket = storage.bucket(bucketName);
  const obj = bucket.file(objectPath);

  await obj.save(buf, {
    resumable: false,
    contentType: file.type || "application/octet-stream",
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token,
        kind: kind || "",
      },
    },
  });

  const encodedPath = encodeURIComponent(objectPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

  return {
    name: file.name || "upload",
    url,
    contentType: file.type || "application/octet-stream",
    size: file.size || 0,
    path: objectPath,
    kind: kind || undefined,
    uploadedAt: new Date().toISOString(),
  };
}

async function downloadStoredAttachment(att: StoredAttachment): Promise<EmailAttachment | null> {
  if (!att?.path || !att?.name) return null;

  const bucketName = getStorageBucketName();
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const obj = bucket.file(att.path);

  const [exists] = await obj.exists();
  if (!exists) return null;

  const [buf] = await obj.download();

  return {
    filename: att.name,
    content: buf,
    contentType: att.contentType || "application/octet-stream",
  };
}

async function filesToEmailAttachments(files: File[]): Promise<EmailAttachment[]> {
  const out: EmailAttachment[] = [];

  for (const f of files || []) {
    if (!f || !f.size) continue;
    out.push({
      filename: f.name || "attachment",
      contentType: f.type || "application/octet-stream",
      content: Buffer.from(await f.arrayBuffer()),
    });
  }

  return out;
}

async function storedToEmailAttachments(stored: StoredAttachment[]): Promise<EmailAttachment[]> {
  const out: EmailAttachment[] = [];

  for (const att of stored || []) {
    try {
      const downloaded = await downloadStoredAttachment(att);
      if (downloaded) out.push(downloaded);
    } catch (err) {
      console.error("stored attachment download failed:", { name: att?.name, path: att?.path, err });
    }
  }

  return out;
}

function dedupeEmailAttachments(items: EmailAttachment[]) {
  const out: EmailAttachment[] = [];
  const seen = new Set<string>();

  for (const item of items || []) {
    if (!item?.filename || !item?.content) continue;
    const hash = crypto.createHash("sha1").update(item.content).digest("hex");
    const key = `${String(item.filename).toLowerCase()}|${item.content.length}|${hash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

async function sendIntakeSummaryEmail(args: {
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
  to?: string;
}) {
  const to = args.to || process.env.FORMS_NOTIFY_TO_GCN || process.env.FORMS_NOTIFY_TO;
  const from = process.env.FORMS_FROM_EMAIL;

  const host = process.env.FORMS_SMTP_HOST;
  const port = envInt(process.env.FORMS_SMTP_PORT, 465);
  const secure = envBool(process.env.FORMS_SMTP_SECURE, port === 465);
  const user = process.env.FORMS_SMTP_USER;
  const pass = process.env.FORMS_SMTP_PASS;

  if (!to) throw new Error("Missing FORMS_NOTIFY_TO");
  if (!from) throw new Error("Missing FORMS_FROM_EMAIL");
  if (!host) throw new Error("Missing FORMS_SMTP_HOST");
  if (!user) throw new Error("Missing FORMS_SMTP_USER");
  if (!pass) throw new Error("Missing FORMS_SMTP_PASS");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    to,
    from,
    subject: args.subject,
    text: args.text,
    attachments: (args.attachments || []).map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
}

// Optional / best-effort. This should never break intake completion.
async function sendManagerWhatsApp(text: string) {
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const to = (process.env.MANAGER_WA_ID || "").trim();

  if (!phoneNumberId || !token || !to) {
    console.log("intake WA skipped: missing env vars");
    return null;
  }

  const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const raw = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    throw new Error(`WhatsApp send failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

function isUploadOnlyPayload(payload: any) {
  return Boolean(
    payload?.uploadOnly ||
      payload?.mode === "upload" ||
      payload?.branch === "upload" ||
      payload?.intent === "upload" ||
      (payload?.kind && !payload?.answers && !payload?.liveText && !payload?.text)
  );
}

// --- route ------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { payload, files } = await parseIncoming(req);

    const sessionId = String(payload?.sessionId || "").trim();
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing payload.sessionId" }, { status: 400 });
    }

    const code = shortCodeFromSessionId(sessionId);
    const db = adminDb();
    const sessionRef = db.collection("conciergeSessions").doc(sessionId);

    // Live chat ping mode
    const liveText = String(payload?.liveText || payload?.text || "").trim();
    if (liveText) {
      await sessionRef.set(
        {
          sessionCode: code,
          sourceSite: payload?.sourceSite || SITE_CODE,
          brandLabel: payload?.brandLabel || SITE_NAME,
          lastMessageAt: FieldValue.serverTimestamp(),
          status: "LIVE",
        },
        { merge: true }
      );

      try {
        await sendManagerWhatsApp(`[${payload?.sourceSite || SITE_CODE}] ${code} ${liveText}`);
      } catch (e) {
        console.error("live WA failed:", e);
      }

      return NextResponse.json({ ok: true, mode: "live" });
    }

    // Upload-only save path
    if (isUploadOnlyPayload(payload)) {
      const uploadKind = String(payload?.kind || payload?.uploadKind || "upload").trim() || "upload";
      const uploaded = dedupeAttachments(
        await Promise.all(
          (files || [])
            .filter((f) => f && f.size)
            .map((f) => uploadToFirebaseStorage(sessionId, f, uploadKind))
        )
      );

      const snap = await sessionRef.get();
      const existing = Array.isArray(snap.data()?.attachments) ? (snap.data()?.attachments as StoredAttachment[]) : [];
      const merged = dedupeAttachments([...existing, ...uploaded]);

      await sessionRef.set(
        {
          sessionCode: code,
          sourceSite: payload?.sourceSite || SITE_CODE,
          brandLabel: payload?.brandLabel || SITE_NAME,
          lastMessageAt: FieldValue.serverTimestamp(),
          attachments: merged,
          uploadKinds: FieldValue.arrayUnion(uploadKind),
          latestUploadKind: uploadKind,
          latestUploadAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (uploaded.length) {
        await sessionRef.collection("messages").add({
          who: "user",
          text:
            `Upload received: ${uploadKind}\n` +
            uploaded.map((a) => `- ${a.name}: ${a.url}`).join("\n"),
          createdAt: FieldValue.serverTimestamp(),
          via: "website",
          kind: uploadKind,
        });
      }

      return NextResponse.json({
        ok: true,
        mode: "upload-only",
        sessionId,
        code,
        kind: uploadKind,
        attachments: uploaded.map((a) => ({ name: a.name, url: a.url, kind: a.kind })),
      });
    }

    // Intake completion path
    const answers = payload?.answers || payload?.form || {};
    const intent = payload?.intent || payload?.branch || "concierge";
    const sourceSite = String(payload?.sourceSite || SITE_CODE).trim() || SITE_CODE;
    const brandLabel = String(payload?.brandLabel || SITE_NAME).trim() || SITE_NAME;

    const customerName = String(
      answers?.customerName || answers?.name || "Customer"
    ).trim();
    const helpSummary = String(
      answers?.helpSummary || answers?.other || ""
    ).trim();
    const callbackNumber = String(
      answers?.callbackNumber || answers?.phone || ""
    ).trim();
    const vehicleInfo = String(
      answers?.vehicleInfo || answers?.vinValue || answers?.yearMakeModel || ""
    ).trim();
    const vinValue = String(
      answers?.vinValue || answers?.vehicleInfo || answers?.vin || answers?.yearMakeModel || ""
    ).trim();
    const havePhotos = String(answers?.havePhotos || "").trim();

    const newlyUploaded = dedupeAttachments(
      await Promise.all(
        (files || [])
          .filter((f) => f && f.size)
          .map((f) => uploadToFirebaseStorage(sessionId, f))
      )
    );

    const existingSnap = await sessionRef.get();
    const existingAttachments = Array.isArray(existingSnap.data()?.attachments)
      ? (existingSnap.data()?.attachments as StoredAttachment[])
      : [];

    const allAttachments = dedupeAttachments([...existingAttachments, ...newlyUploaded]);

    // Only send intake notifications once per session.
    const shouldNotify = await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      const already = snap.exists && !!snap.data()?.intakeNotifiedAt;
      if (already) return false;

      tx.set(sessionRef, { intakeNotifiedAt: FieldValue.serverTimestamp() }, { merge: true });
      return true;
    });

    await sessionRef.set(
      {
        sessionCode: code,
        sourceSite,
        brandLabel,
        topic: intent,
        intent,
        branch: payload?.branch || payload?.mode || "unknown",
        step: payload?.step || "done",

        customerName,
        helpSummary,
        callbackNumber,
        vinAnswer: vinValue,
        photoAnswer: havePhotos,

        managerJoined: false,
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),

        wa_id: null,
        attachments: allAttachments,
        answers,
      },
      { merge: true }
    );

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef);
      const current = snap.data()?.status;
      if (current === "LIVE") return;
      if (!current) tx.set(sessionRef, { status: "WAITING" }, { merge: true });
    });

    const introLines: string[] = [];
    if (helpSummary) introLines.push(helpSummary);
    if (vehicleInfo) introLines.push(`Vehicle: ${vehicleInfo}`);
    if (callbackNumber) introLines.push(`Callback: ${callbackNumber}`);

    if (allAttachments.length) {
      introLines.push("Attachments:");
      for (const a of allAttachments) introLines.push(`- ${a.name}: ${a.url}`);
    }

    const introText = introLines.join("\n").trim() || "(New intake submitted)";

    await sessionRef.collection("messages").add({
      who: "user",
      text: introText,
      createdAt: FieldValue.serverTimestamp(),
      via: "website",
    });

    const linkLines =
      allAttachments.length > 0
        ? "\nLinks:\n" + allAttachments.map((a) => `${a.name}: ${a.url}`).join("\n")
        : "";

    const waMsg =
      `[${sourceSite}-${code}] New website chat\n` +
      `${customerName}\n` +
      `${helpSummary || "(no summary)"}\n` +
      (vinValue ? `VIN: ${vinValue}\n` : "") +
      (callbackNumber ? `Call/Text: ${callbackNumber}\n` : "") +
      (allAttachments.length ? `Attachments: ${allAttachments.length}\n` : "") +
      linkLines +
      `\nReply like: ${sourceSite}-${code} your message`;

    const qaText = buildIntakeQA(answers);
    const emailSubject = `[${sourceSite}] Intake Summary: ${sourceSite}-${code} (${customerName})`;
    const emailText =
      `Brand: ${brandLabel}\n` +
      `Source Site: ${sourceSite}\n` +
      `Session: ${sourceSite}-${code}\n` +
      `Customer: ${customerName}\n` +
      (callbackNumber ? `Call/Text: ${callbackNumber}\n` : "") +
      (vinValue ? `VIN: ${vinValue}\n` : "") +
      `\n--- Intake Q/A ---\n` +
      `${qaText || "(no intake answers found)"}\n` +
      (allAttachments.length
        ? `\n--- Attachments (links) ---\n${allAttachments.map((a) => `- ${a.name}: ${a.url}`).join("\n")}\n`
        : "");

    const currentEmailAttachments = dedupeEmailAttachments(await filesToEmailAttachments(files));

    const currentKeys = new Set(
      currentEmailAttachments.map((a) => `${a.filename.toLowerCase()}|${a.content.length}`)
    );

    const storedOnly = allAttachments.filter(
      (a) => !currentKeys.has(`${String(a.name || "").toLowerCase()}|${String(a.size || 0)}`)
    );

    const storedEmailAttachments = dedupeEmailAttachments(await storedToEmailAttachments(storedOnly));
    const emailAttachments = dedupeEmailAttachments([...currentEmailAttachments, ...storedEmailAttachments]);

    if (shouldNotify) {
      try {
        await sendIntakeSummaryEmail({
          subject: emailSubject,
          text: emailText,
          attachments: emailAttachments,
        });
        console.log("intake email sent:", {
          sessionId,
          code,
          sourceSite,
          currentAttachments: currentEmailAttachments.length,
          storedAttachments: storedEmailAttachments.length,
          totalAttachments: emailAttachments.length,
        });
      } catch (e) {
        console.error("intake email failed:", e);
      }

      try {
        await sendManagerWhatsApp(waMsg);
      } catch (e) {
        console.error("intake WA failed:", e);
      }
    } else {
      console.log("intake notify skipped (already notified):", { sessionId, code, sourceSite });
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      code,
      attachments: allAttachments.map((a) => ({ name: a.name, url: a.url, kind: a.kind })),
    });
  } catch (err: any) {
    console.error("concierge/notify error:", err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}