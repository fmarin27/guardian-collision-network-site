// src/lib/concierge/routerSchema.ts
export const ROUTER_SCHEMA_V1 = {
  type: "object",
  additionalProperties: false,
  required: [
    "branch",
    "confidence",
    "handoff_recommended",
    "handoff_urgency",
    "manager_summary",
    "extracted",
    "clarifying_question",
  ],
  properties: {
    branch: {
      type: "string",
      enum: [
        "BR-COCKPIT-1-ACCIDENT",
        "BR-COCKPIT-2-DAMAGE-FIX",
        "BR-COCKPIT-3-TIPS",
        "BR-COCKPIT-4-ADVICE",
        "BR-COCKPIT-5-PAYMENT",
        "BR-COCKPIT-6-SPECIAL",
        "BR-ESTIMATE",
        "BR-FORMS",
        "BR-INFO-GENERAL",
        "UNKNOWN",
      ],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },

    handoff_recommended: { type: "boolean" },
    handoff_urgency: { type: "string", enum: ["low", "normal", "high"] },

    manager_summary: { type: "string", minLength: 1, maxLength: 280 },

    clarifying_question: {
      type: ["string", "null"],
      maxLength: 160,
      description:
        "Ask ONLY if branch is UNKNOWN or confidence is low. Otherwise null.",
    },

    extracted: {
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {
        accident_related: { type: ["boolean", "null"] },
        safe_to_drive: { type: ["boolean", "null"] },

        wants_estimate: { type: ["boolean", "null"] },
        needs_forms: { type: ["boolean", "null"] },

        payment_uncertain: { type: ["boolean", "null"] },
        insurance_claim_mentioned: { type: ["boolean", "null"] },

        vehicle_info: { type: ["string", "null"], maxLength: 120 },
        damage_area: { type: ["string", "null"], maxLength: 120 },

        special_service: { type: ["string", "null"], maxLength: 120 },

        preferred_contact: {
          type: ["string", "null"],
          enum: ["call", "text", "chat", null],
        },
        phone: { type: ["string", "null"], maxLength: 30 },
        name: { type: ["string", "null"], maxLength: 80 },
      },
    },
  },
} as const;
