// Checks for the email endpoints: a shared secret for crons and internal events, and the
// Standard Webhooks signature that Supabase puts on its "Send Email" auth hook.
import { createHmac, timingSafeEqual } from "node:crypto";

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** `Authorization: Bearer <secret>`. With the secret unset the endpoint stays closed. */
export function bearerOk(request: Request, secret: string | undefined) {
  if (!secret) return false;
  return same(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
}

/**
 * Standard Webhooks (https://www.standardwebhooks.com), as used by Supabase Auth hooks.
 * The secret looks like "v1,whsec_<base64>"; the signature header lists "v1,<base64>" values.
 */
export function standardWebhookOk(headers: Headers, body: string, secret: string | undefined, now = Date.now()) {
  if (!secret) return false;
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^v1,/, "").replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return signatures.split(" ").some((s) => same(s.replace(/^v1,/, ""), expected));
}
