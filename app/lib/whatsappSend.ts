type GraphErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
    error_data?: any;
  };
};

export class WhatsAppGraphError extends Error {
  code?: number;
  subcode?: number;
  payload?: any;

  constructor(message: string, opts?: { code?: number; subcode?: number; payload?: any }) {
    super(message);
    this.name = "WhatsAppGraphError";
    this.code = opts?.code;
    this.subcode = opts?.subcode;
    this.payload = opts?.payload;
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function graphPost(body: any) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId) throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID");
  if (!token) throw new Error("Missing WHATSAPP_ACCESS_TOKEN");

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  const data = safeJsonParse(raw) ?? raw;

  if (!res.ok) {
    const payload = (typeof data === "object" ? (data as GraphErrorPayload) : null) ?? null;
    const code = payload?.error?.code;
    const subcode = payload?.error?.error_subcode;
    const msg = payload?.error?.message || `WhatsApp send failed: ${res.status}`;

    throw new WhatsAppGraphError(
      `${msg} (status ${res.status})`,
      { code, subcode, payload: data }
    );
  }

  return data;
}

export async function sendWhatsAppText(toWaId: string, text: string) {
  const data: any = await graphPost({
    messaging_product: "whatsapp",
    to: toWaId,
    type: "text",
    text: { body: text },
  });

  const msgId = data?.messages?.[0]?.id;
  console.log("sendWhatsAppText ok:", { to: toWaId, msgId });

  return data;
}

export async function sendWhatsAppTemplate(
  toWaId: string,
  templateName: string,
  opts?: {
    languageCode?: string; // e.g. "en_US"
    bodyParams?: string[]; // maps to {{1}}, {{2}}, etc.
  }
) {
  const languageCode = opts?.languageCode || "en_US";
  const bodyParams = opts?.bodyParams || [];

  const components =
    bodyParams.length > 0
      ? [
          {
            type: "body",
            parameters: bodyParams.map((t) => ({ type: "text", text: String(t) })),
          },
        ]
      : undefined;

  const data: any = await graphPost({
    messaging_product: "whatsapp",
    to: toWaId,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  });

  const msgId = data?.messages?.[0]?.id;
  console.log("sendWhatsAppTemplate ok:", { to: toWaId, msgId, templateName });

  return data;
}