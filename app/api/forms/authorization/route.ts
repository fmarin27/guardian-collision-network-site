import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

type ClaimType = "out_of_pocket" | "insurance" | null;

type RepairAuthForm = {
  fullName?: string;
  address?: string;
  townCity?: string;
  zip?: string;
  phone?: string;
  email?: string;
  year?: string;
  make?: string;
  model?: string;
  plate?: string;
  agree?: boolean;
  signatureDataUrl?: string; // data:image/png;base64,...
};

type DirectionToPayForm = {
  fullName?: string;
  insurerName?: string;
  year?: string;
  make?: string;
  model?: string;
  claimNumber?: string;
  date?: string;
  agree?: boolean;
  signatureDataUrl?: string; // data:image/png;base64,...
};

type DesignatedRepForm = {
  fullName?: string;
  insurerName?: string;
  year?: string;
  make?: string;
  model?: string;
  plate?: string;
  claimNumber?: string;
  date?: string;
  agree?: boolean;
  signatureDataUrl?: string; // data:image/png;base64,...
};

type EstimateDismantleForm = {
  fullName?: string;
  year?: string;
  make?: string;
  model?: string;
  plate?: string;
  date?: string;
  agree?: boolean;
  signatureDataUrl?: string; // data:image/png;base64,...
};

type PacketAllForm = {
  repairAuth?: RepairAuthForm;
  // new naming (preferred)
  directionToPay?: DirectionToPayForm;
  designatedRep?: DesignatedRepForm;
  estimateDismantle?: EstimateDismantleForm;
  // old naming (fallback so button works even if frontend still sends dtp/dr/est)
  dtp?: DirectionToPayForm;
  dr?: DesignatedRepForm;
  est?: EstimateDismantleForm;
};

type Body = {
  sessionId?: string;
  claimType?: ClaimType;
  kind?:
    | "repair_authorization"
    | "direction_to_pay"
    | "designated_representative"
    | "estimate_dismantling"
    | "packet_all_4";
  form?: RepairAuthForm | DirectionToPayForm | DesignatedRepForm | EstimateDismantleForm;
  packet?: PacketAllForm;
};

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

function yyyyMmDd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mmddyyyy(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear());
  return `${mm}/${dd}/${yy}`;
}

function dataUrlToBytes(dataUrl: string) {
  const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!m) throw new Error("Invalid signature data.");
  return Buffer.from(m[2], "base64");
}

async function readTemplateFromFillableFolder(candidates: string[]) {
  const base = path.join(process.cwd(), "public", "forms", "fillable");
  for (const name of candidates) {
    const p = path.join(base, name);
    try {
      await fs.access(p);
      return { bytes: await fs.readFile(p), used: name };
    } catch {
      // continue
    }
  }
  throw new Error(
    `Template PDF not found. Put one of these in /public/forms/fillable: ${candidates.join(", ")}`
  );
}

function drawFittedText(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: any,
  size: number,
  color = rgb(0, 0, 0)
) {
  const cleaned = safeStr(text);
  if (!cleaned) return;

  let fontSize = size;
  while (fontSize > 8) {
    const w = font.widthOfTextAtSize(cleaned, fontSize);
    if (w <= maxWidth) break;
    fontSize -= 0.5;
  }
  page.drawText(cleaned, { x, y, size: fontSize, font, color });
}

function drawTextInRect(
  page: any,
  text: string,
  r: { x: number; y: number; w: number; h: number },
  font: any,
  fontSize = 11,
  padX = 4
) {
  const t = safeStr(text);
  if (!t) return;
  const baselineY = r.y + (r.h - fontSize) / 2 + 2;
  drawFittedText(page, t, r.x + padX, baselineY, r.w - padX * 2, font, fontSize);
}

async function drawSignatureInRect(
  pdfDoc: PDFDocument,
  page: any,
  sigDataUrl: string,
  r: { x: number; y: number; w: number; h: number },
  pad = 2
) {
  const sigBytes = dataUrlToBytes(sigDataUrl);
  const sigImg = await pdfDoc.embedPng(sigBytes);

  const targetW = Math.max(1, r.w - pad * 2);
  const targetH = Math.max(1, r.h + 10);

  const scale = Math.min(targetW / sigImg.width, targetH / sigImg.height);
  const w = sigImg.width * scale;
  const h = sigImg.height * scale;

  page.drawImage(sigImg, {
    x: r.x + (r.w - w) / 2,
    y: r.y + (r.h - h) / 2 - 3,
    width: w,
    height: h,
  });
}

// =========================
// EMAIL (SHOP COPY)
// =========================

function envBool(v: string | undefined, fallback = false) {
  if (v == null) return fallback;
  const t = v.trim().toLowerCase();
  if (t === "1" || t === "true" || t === "yes" || t === "y") return true;
  if (t === "0" || t === "false" || t === "no" || t === "n") return false;
  return fallback;
}

function getMailTo() {
  return process.env.FORMS_NOTIFY_TO?.trim() || "fernando@ultimateautobody.com";
}

function getMailFrom() {
  // Can be "Ultimate Auto Body <forms@ultimateautobody.com>" or just an address
  return process.env.FORMS_FROM_EMAIL?.trim() || getMailTo();
}

function canSendEmail() {
  return (
    !!process.env.FORMS_SMTP_HOST &&
    !!process.env.FORMS_SMTP_PORT &&
    !!process.env.FORMS_SMTP_USER &&
    !!process.env.FORMS_SMTP_PASS
  );
}

async function sendShopEmail(opts: {
  sessionId: string;
  claimType: ClaimType;
  kind: NonNullable<Body["kind"]>;
  fullName: string;
  customerEmail?: string;
  filename: string;
  pdfBytes: Uint8Array;
}) {
  if (!canSendEmail()) {
    // Don’t block PDF download if SMTP isn’t configured yet.
    console.warn("[forms-email] SMTP env vars missing — skipping email.");
    return { sent: false, skipped: true as const, error: "" };
  }

  const host = process.env.FORMS_SMTP_HOST!;
  const port = Number(process.env.FORMS_SMTP_PORT!);
  const secure = envBool(process.env.FORMS_SMTP_SECURE, port === 465);
  const user = process.env.FORMS_SMTP_USER!;
  const pass = process.env.FORMS_SMTP_PASS!;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const to = getMailTo();
  const from = getMailFrom();

  const subject = `UAB Forms: ${opts.kind.replace(/_/g, " ")} — ${opts.fullName} — ${mmddyyyy(
    new Date()
  )}`;

  const lines: string[] = [];
  lines.push(`A new form PDF was generated on the website.`);
  lines.push(``);
  lines.push(`Kind: ${opts.kind}`);
  lines.push(`Claim type: ${opts.claimType ?? "unknown"}`);
  lines.push(`Customer name: ${opts.fullName}`);
  if (opts.customerEmail) lines.push(`Customer email: ${opts.customerEmail}`);
  lines.push(`Session ID: ${opts.sessionId}`);
  lines.push(`Date: ${mmddyyyy(new Date())}`);
  lines.push(``);
  lines.push(`Attached: ${opts.filename}`);

  await transporter.sendMail({
    from,
    to,
    subject,
    text: lines.join("\n"),
    attachments: [
      {
        filename: opts.filename,
        content: Buffer.from(opts.pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });

  return { sent: true, skipped: false as const, error: "" };
}

// -------------------- Repair Authorization --------------------

async function readRepairAuthorizationTemplate() {
  return readTemplateFromFillableFolder([
    "UAB-Repair-Authorization-Fillable.pdf",
    "UAB-Repair-Authorization.pdf",
    "RepairAuthorization.pdf",
    "repair-authorization.pdf",
    "authorization-form.pdf",
  ]);
}

async function generateRepairAuthorizationPdf(claimType: ClaimType, form: RepairAuthForm) {
  const { bytes: templateBytes } = await readRepairAuthorizationTemplate();

  // Out of pocket => only page 1
  let pdfDoc: PDFDocument;
  if (claimType === "out_of_pocket") {
    const src = await PDFDocument.load(templateBytes);
    const out = await PDFDocument.create();
    const [p0] = await out.copyPages(src, [0]);
    out.addPage(p0);
    pdfDoc = out;
  } else {
    pdfDoc = await PDFDocument.load(templateBytes);
  }

  const page1 = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const HEADER_Y_NUDGE = 10;
  const BOTTOM_Y_NUDGE = -14;

  const fullName = safeStr(form.fullName);
  const phone = safeStr(form.phone);

  const yName = 707 + HEADER_Y_NUDGE;
  const yAddr = 684 + HEADER_Y_NUDGE;
  const yTown = 660 + HEADER_Y_NUDGE;
  const yZip = 637 + HEADER_Y_NUDGE;
  const yPhone = 613 + HEADER_Y_NUDGE;

  // Left side
  drawFittedText(page1, fullName, 125, yName, 160, font, 11);
  drawFittedText(page1, safeStr(form.address), 155, yAddr, 130, font, 11);
  drawFittedText(page1, safeStr(form.townCity), 145, yTown, 140, font, 11);
  drawFittedText(page1, safeStr(form.zip), 125, yZip, 155, font, 11);
  drawFittedText(page1, phone, 125, yPhone, 160, font, 11);

  // Right side
  drawFittedText(page1, safeStr(form.year), 360, yName, 140, font, 11);
  drawFittedText(page1, safeStr(form.make), 360, yAddr, 140, font, 11);
  drawFittedText(page1, safeStr(form.model), 360, yTown, 145, font, 11);
  drawFittedText(page1, safeStr(form.plate), 370, yZip, 135, font, 11);
  drawFittedText(page1, safeStr(form.email), 370, yPhone, 135, font, 10);

  // Signature + Date
  const sigUrl = safeStr(form.signatureDataUrl);
  if (!sigUrl) throw new Error("Missing signature.");
  const sigBytes = dataUrlToBytes(sigUrl);
  const sigImg = await pdfDoc.embedPng(sigBytes);

  const desiredSigWidth = 240;
  const scale = desiredSigWidth / sigImg.width;
  const sigW = sigImg.width * scale;
  const sigH = sigImg.height * scale;

  const SIG_Y_BASE = 132;
  const sigY = SIG_Y_BASE + BOTTOM_Y_NUDGE;

  page1.drawImage(sigImg, {
    x: 80,
    y: sigY,
    width: sigW,
    height: Math.min(sigH, 55),
  });

  const dateStr = mmddyyyy(new Date());
  const DATE_Y_OFFSET_FROM_SIG = 18;

  drawFittedText(page1, dateStr, 360, sigY + DATE_Y_OFFSET_FROM_SIG, 150, font, 11);

  return await pdfDoc.save();
}

// -------------------- Direction to Pay --------------------
const DTP_RECT = {
  dtp_1: { x: 248.0, y: 673.5, w: 141.5, h: 20.5 },
  dtp_2: { x: 222.0, y: 597.5, w: 184.5, h: 20.5 },
  dtp_3: { x: 120.0, y: 574.5, w: 185.5, h: 19.5 },
  dtp_4: { x: 218.0, y: 513.5, w: 256.5, h: 19.5 },
  dtp_5: { x: 196.0, y: 475.5, w: 256.5, h: 19.5 },
  dtp_6: { x: 215.0, y: 282.5, w: 196.5, h: 19.5 },
  dtp_7: { x: 448.0, y: 282.5, w: 70.5, h: 19.5 },
} as const;

async function readDirectionToPayTemplate() {
  return readTemplateFromFillableFolder([
    "UAB-Direction-to-Pay-Fillable.pdf",
    "UAB-Direction-to-Pay.pdf",
    "direction-to-pay.pdf",
  ]);
}

async function generateDirectionToPayPdf(form: DirectionToPayForm) {
  const { bytes: templateBytes } = await readDirectionToPayTemplate();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];

  const date = safeStr(form.date) || yyyyMmDd();
  drawTextInRect(page, date, DTP_RECT.dtp_1, helv, 11);
  drawTextInRect(page, safeStr(form.fullName), DTP_RECT.dtp_2, helv, 11);
  drawTextInRect(page, safeStr(form.insurerName), DTP_RECT.dtp_3, helv, 11);

  const ymm = [safeStr(form.year), safeStr(form.make), safeStr(form.model)].filter(Boolean).join(" ");
  drawTextInRect(page, ymm, DTP_RECT.dtp_4, helv, 11);

  drawTextInRect(page, safeStr(form.claimNumber), DTP_RECT.dtp_5, helv, 11);

  const sigUrl = safeStr(form.signatureDataUrl);
  if (!sigUrl) throw new Error("Missing signature.");
  await drawSignatureInRect(pdfDoc, page, sigUrl, DTP_RECT.dtp_6);

  drawTextInRect(page, date, DTP_RECT.dtp_7, helv, 11);

  return await pdfDoc.save();
}

// -------------------- Designated Representative --------------------
const DR_RECT = {
  dr_1: { x: 107.0, y: 517.5, w: 219.5, h: 21.5 },
  dr_2: { x: 187.0, y: 491.5, w: 135.5, h: 20.5 },
  dr_3: { x: 111.0, y: 464.5, w: 213.5, h: 20.5 },
  dr_4: { x: 114.0, y: 437.5, w: 213.5, h: 20.5 },
  dr_5: { x: 107.0, y: 262.5, w: 207.5, h: 21.5 },
  dr_6: { x: 348.0, y: 262.5, w: 87.5, h: 21.5 },
} as const;

async function readDesignatedRepTemplate() {
  return readTemplateFromFillableFolder([
    "UAB-Designated-Representative-Fillable.pdf",
    "UAB-Designated-Representative.pdf",
    "designated-representative.pdf",
  ]);
}

async function generateDesignatedRepPdf(form: DesignatedRepForm) {
  const { bytes: templateBytes } = await readDesignatedRepTemplate();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];

  const date = safeStr(form.date) || yyyyMmDd();

  drawTextInRect(page, safeStr(form.fullName), DR_RECT.dr_1, helv, 11);
  drawTextInRect(page, safeStr(form.insurerName), DR_RECT.dr_2, helv, 11);
  drawTextInRect(page, safeStr(form.claimNumber), DR_RECT.dr_3, helv, 11);

  const vehicle = [safeStr(form.year), safeStr(form.make), safeStr(form.model), safeStr(form.plate)]
    .filter(Boolean)
    .join(" ");
  drawTextInRect(page, vehicle, DR_RECT.dr_4, helv, 11);

  const sigUrl = safeStr(form.signatureDataUrl);
  if (!sigUrl) throw new Error("Missing signature.");
  await drawSignatureInRect(pdfDoc, page, sigUrl, DR_RECT.dr_5);

  drawTextInRect(page, date, DR_RECT.dr_6, helv, 11);

  return await pdfDoc.save();
}

// -------------------- Estimate & Dismantling --------------------
async function readEstimateDismantleTemplate() {
  return readTemplateFromFillableFolder([
    "UAB-Authorization-Estimate-Dismantling-Fillable.pdf",
    "UAB-Authorization-Estimate-Dismantling.pdf",
    "authorization-estimate-dismantling.pdf",
  ]);
}

async function generateEstimateDismantlePdf(form: EstimateDismantleForm) {
  const { bytes: templateBytes } = await readEstimateDismantleTemplate();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPages()[0];

  const date = safeStr(form.date) || yyyyMmDd();

  drawFittedText(page, safeStr(form.fullName), 120, 528, 260, helv, 12);

  const sigUrl = safeStr(form.signatureDataUrl);
  if (!sigUrl) throw new Error("Missing signature.");
  const sigBytes = dataUrlToBytes(sigUrl);
  const sigImg = await pdfDoc.embedPng(sigBytes);

  const sigBox = { x: 270, y: 418, w: 220, h: 44 };
  const sigScale = Math.min(sigBox.w / sigImg.width, sigBox.h / sigImg.height);
  const sigW = sigImg.width * sigScale;
  const sigH = sigImg.height * sigScale;

  page.drawImage(sigImg, {
    x: sigBox.x + (sigBox.w - sigW) / 2,
    y: sigBox.y + (sigBox.h - sigH) / 2,
    width: sigW,
    height: sigH,
  });

  drawFittedText(page, date, 510, 426, 95, helv, 11);

  drawFittedText(page, safeStr(form.year), 145, 388, 80, helv, 11);
  drawFittedText(page, safeStr(form.make), 255, 388, 120, helv, 11);
  drawFittedText(page, safeStr(form.model), 370, 388, 120, helv, 11);
  drawFittedText(page, safeStr(form.plate), 500, 388, 95, helv, 11);

  return await pdfDoc.save();
}

// -------------------- Packet merge --------------------
async function mergePdfs(buffers: Uint8Array[]) {
  const out = await PDFDocument.create();
  for (const b of buffers) {
    const src = await PDFDocument.load(b);
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((p) => out.addPage(p));
  }
  return await out.save();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const claimType = (body.claimType ?? null) as ClaimType;
    const kind = (body.kind ?? "repair_authorization") as NonNullable<Body["kind"]>;
    const sessionId = safeStr(body.sessionId) || `sess_${Date.now()}`;

    // Helper to email + return pdf response
    const respondPdf = async (pdfBytes: Uint8Array, filename: string, fullName: string, customerEmail?: string) => {
      let emailSent = "0";
      try {
        const r = await sendShopEmail({
          sessionId,
          claimType,
          kind,
          fullName: fullName || "Unknown",
          customerEmail,
          filename,
          pdfBytes,
        });
        emailSent = r.sent ? "1" : "0";
      } catch (e: any) {
        console.error("[forms-email] failed:", e?.message || e);
        emailSent = "0";
      }

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "no-store",
          "X-UAB-Email-Sent": emailSent,
        },
      });
    };

    if (kind === "packet_all_4") {
      const p = body.packet;
      if (!p?.repairAuth) throw new Error("Missing packet data.");

      const directionToPay = p.directionToPay ?? p.dtp;
      const designatedRep = p.designatedRep ?? p.dr;
      const estimateDismantle = p.estimateDismantle ?? p.est;

      if (!directionToPay || !designatedRep || !estimateDismantle) {
        throw new Error("Missing packet data.");
      }

      const repairPdf = await generateRepairAuthorizationPdf(claimType, p.repairAuth);
      const dtpPdf = await generateDirectionToPayPdf(directionToPay);
      const drPdf = await generateDesignatedRepPdf(designatedRep);
      const estPdf = await generateEstimateDismantlePdf(estimateDismantle);

      const merged = await mergePdfs([repairPdf, dtpPdf, drPdf, estPdf]);

      const fullName = safeStr(p.repairAuth.fullName) || "Unknown";
      const filename = `UAB-Forms-Packet-All-4-${fullName.replace(/\s+/g, "-")}-${yyyyMmDd()}.pdf`;
      const customerEmail = safeStr(p.repairAuth.email);

      return respondPdf(merged, filename, fullName, customerEmail);
    }

    const form = (body.form ?? {}) as any;

    if (kind === "repair_authorization") {
      const f = form as RepairAuthForm;
      if (!safeStr(f.fullName)) throw new Error("Missing name.");
      if (!safeStr(f.phone)) throw new Error("Missing phone.");
      if (!f.agree) throw new Error("Agreement required.");
      if (!safeStr(f.signatureDataUrl)) throw new Error("Missing signature.");

      const pdfBytes = await generateRepairAuthorizationPdf(claimType, f);

      const fullName = safeStr(f.fullName) || "Unknown";
      const filename = `UAB-Repair-Authorization-${fullName.replace(/\s+/g, "-")}-${yyyyMmDd()}.pdf`;
      const customerEmail = safeStr(f.email);

      return respondPdf(pdfBytes, filename, fullName, customerEmail);
    }

    if (kind === "direction_to_pay") {
      const f = form as DirectionToPayForm;
      if (!safeStr(f.fullName)) throw new Error("Missing name.");
      if (!safeStr(f.insurerName)) throw new Error("Missing insurance company.");
      if (!f.agree) throw new Error("Agreement required.");
      if (!safeStr(f.signatureDataUrl)) throw new Error("Missing signature.");

      const pdfBytes = await generateDirectionToPayPdf(f);

      const fullName = safeStr(f.fullName) || "Unknown";
      const filename = `UAB-Direction-to-Pay-${fullName.replace(/\s+/g, "-")}-${yyyyMmDd()}.pdf`;

      return respondPdf(pdfBytes, filename, fullName);
    }

    if (kind === "designated_representative") {
      const f = form as DesignatedRepForm;
      if (!safeStr(f.fullName)) throw new Error("Missing name.");
      if (!safeStr(f.insurerName)) throw new Error("Missing insurance company.");
      if (!f.agree) throw new Error("Agreement required.");
      if (!safeStr(f.signatureDataUrl)) throw new Error("Missing signature.");

      const pdfBytes = await generateDesignatedRepPdf(f);

      const fullName = safeStr(f.fullName) || "Unknown";
      const filename = `UAB-Designated-Representative-${fullName.replace(/\s+/g, "-")}-${yyyyMmDd()}.pdf`;

      return respondPdf(pdfBytes, filename, fullName);
    }

    if (kind === "estimate_dismantling") {
      const f = form as EstimateDismantleForm;
      if (!safeStr(f.fullName)) throw new Error("Missing name.");
      if (!f.agree) throw new Error("Agreement required.");
      if (!safeStr(f.signatureDataUrl)) throw new Error("Missing signature.");

      const pdfBytes = await generateEstimateDismantlePdf(f);

      const fullName = safeStr(f.fullName) || "Unknown";
      const filename = `UAB-Authorization-Estimate-Dismantling-${fullName.replace(/\s+/g, "-")}-${yyyyMmDd()}.pdf`;

      return respondPdf(pdfBytes, filename, fullName);
    }

    return NextResponse.json({ error: "Unknown form kind." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate PDF" }, { status: 500 });
  }
}
