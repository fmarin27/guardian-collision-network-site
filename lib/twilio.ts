import Twilio from "twilio";

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getTwilioClient() {
  const accountSid = required("TWILIO_ACCOUNT_SID");
  const authToken = required("TWILIO_AUTH_TOKEN");
  return Twilio(accountSid, authToken);
}

export function getTwilioNumbers() {
  const from = required("TWILIO_FROM_NUMBER");
  const to = required("MANAGER_TO_NUMBER");
  return { from, to };
}
