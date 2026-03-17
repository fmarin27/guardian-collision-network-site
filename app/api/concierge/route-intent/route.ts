// src/app/api/concierge/route-intent/route.ts
import { NextResponse } from "next/server";

type RouterResult = {
  branch:
    | "BR-COCKPIT-1-ACCIDENT"
    | "BR-COCKPIT-2-DAMAGE-FIX"
    | "BR-COCKPIT-3-TIPS"
    | "BR-COCKPIT-4-ADVICE"
    | "BR-COCKPIT-5-PAYMENT"
    | "BR-COCKPIT-6-SPECIAL"
    | "BR-ESTIMATE"
    | "BR-FORMS"
    | "BR-INFO-GENERAL"
    | "UNKNOWN";
  confidence: number;
  handoff_recommended: boolean;
  handoff_urgency: "low" | "normal" | "high";
  manager_summary: string;
  clarifying_question: string | null;
  extracted: {
    accident_related: boolean | null;
    safe_to_drive: boolean | null;

    wants_estimate: boolean | null;
    needs_forms: boolean | null;

    payment_uncertain: boolean | null;
    insurance_claim_mentioned: boolean | null;

    vehicle_info: string | null;
    damage_area: string | null;

    special_service: string | null;

    preferred_contact: "call" | "text" | "chat" | null;
    phone: string | null;
    name: string | null;
  };
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function buildBase(): RouterResult {
  return {
    branch: "UNKNOWN",
    confidence: 0.0,
    handoff_recommended: false,
    handoff_urgency: "normal",
    manager_summary: "New message received (not yet classified).",
    clarifying_question: "Are you dealing with an accident/insurance claim, or do you just need a repair estimate?",
    extracted: {
      accident_related: null,
      safe_to_drive: null,
      wants_estimate: null,
      needs_forms: null,
      payment_uncertain: null,
      insurance_claim_mentioned: null,
      vehicle_info: null,
      damage_area: null,
      special_service: null,
      preferred_contact: null,
      phone: null,
      name: null,
    },
  };
}

function detectIntent(messageRaw: string): RouterResult {
  const message = (messageRaw || "").trim();
  const lower = message.toLowerCase();

  const res = buildBase();

  if (!message) {
    res.confidence = 0.0;
    res.manager_summary = "Empty message.";
    res.clarifying_question =
      "How can we help today — accident/insurance, damage repair/estimate, forms/paperwork, or general questions?";
    return res;
  }

  // Quick keyword buckets (MOCK ONLY — will be replaced with AI later)
  const accidentWords = ["accident", "crash", "hit", "rear-ended", "rear ended", "t-bone", "tbone", "collision", "insurance claim", "claim"];
  const formsWords = ["form", "paperwork", "authorization", "direction to pay", "designated representative", "dismantle", "signature", "sign"];
  const estimateWords = ["estimate", "quote", "how much", "price", "cost", "appraisal"];
  const paymentWords = ["pay", "payment", "deductible", "financing", "cash", "credit", "can't afford", "not sure how to pay"];
  const adviceWords = ["advice", "what should i do", "help me", "recommend", "what do you think", "is it safe"];
  const tipsWords = ["tips", "info", "learn", "guide", "how it works", "insurance tips"];
  const specialWords = ["calibration", "adas", "diagnostic", "scan", "ceramic", "ppf", "wrap", "detailing", "paint correction", "tint", "special service"];

  const hasAny = (arr: string[]) => arr.some((w) => lower.includes(w));

  // Priority: accident -> forms -> payment -> estimate -> advice -> tips -> special -> general
  if (hasAny(accidentWords)) {
    res.branch = "BR-COCKPIT-1-ACCIDENT";
    res.confidence = 0.9;
    res.extracted.accident_related = true;
    res.extracted.insurance_claim_mentioned = lower.includes("insurance") || lower.includes("claim") ? true : null;
    res.handoff_recommended = true;
    res.handoff_urgency = lower.includes("tow") || lower.includes("not drivable") ? "high" : "normal";
    res.manager_summary = `Accident-related message: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
    res.clarifying_question = null;
    return res;
  }

  if (hasAny(formsWords)) {
    res.branch = "BR-FORMS";
    res.confidence = 0.9;
    res.extracted.needs_forms = true;
    res.handoff_recommended = true;
    res.handoff_urgency = "normal";
    res.manager_summary = `Forms/paperwork request: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
    res.clarifying_question = null;
    return res;
  }

  if (hasAny(paymentWords)) {
    res.branch = "BR-COCKPIT-5-PAYMENT";
    res.confidence = 0.85;
    res.extracted.payment_uncertain = true;
    res.handoff_recommended = true;
    res.handoff_urgency = "normal";
    res.manager_summary = `Payment/coverage uncertainty: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
    res.clarifying_question = null;
    return res;
  }

  if (hasAny(estimateWords)) {
    res.branch = "BR-ESTIMATE";
    res.confidence = 0.85;
    res.extracted.wants_estimate = true;
    res.handoff_recommended = false;
    res.handoff_urgency = "low";
    res.manager_summary = `Estimate/quote request: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
    res.clarifying_question = null;
    return res;
  }

  if (hasAny(adviceWords)) {
    res.branch = "BR-COCKPIT-4-ADVICE";
    res.confidence = 0.8;
    res.handoff_recommended = true;
    res.handoff_urgency = "normal";
    res.manager_summary = `Wants professional advice: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
    res.clarifying_question = null;
    return res;
  }

  if (hasAny(tipsWords)) {
    res.branch = "BR-COCKPIT-3-TIPS";
    res.confidence = 0.75;
    res.handoff_recommended = false;
    res.handoff_urgency = "low";
    res.manager_summary = `Looking for tips/info: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
    res.clarifying_question = null;
    return res;
  }

  if (hasAny(specialWords)) {
    res.branch = "BR-COCKPIT-6-SPECIAL";
    res.confidence = 0.75;
    res.extracted.special_service = "special service mentioned";
    res.handoff_recommended = false;
    res.handoff_urgency = "low";
    res.manager_summary = `Special service inquiry: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
    res.clarifying_question = null;
    return res;
  }

  // Default: general info
  res.branch = "BR-INFO-GENERAL";
  res.confidence = 0.7;
  res.handoff_recommended = false;
  res.handoff_urgency = "low";
  res.manager_summary = `General inquiry: "${message.slice(0, 120)}"${message.length > 120 ? "…" : ""}`;
  res.clarifying_question = null;

  // Enforce your rule: if confidence < 0.70 -> UNKNOWN + clarifying question
  if (res.confidence < 0.7) {
    res.branch = "UNKNOWN";
    res.clarifying_question =
      "Are you dealing with an accident/insurance claim, or do you just need a repair estimate?";
  }

  res.confidence = clamp01(res.confidence);
  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message : "";

    const result = detectIntent(message);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "route-intent failed",
      },
      { status: 500 }
    );
  }
}
