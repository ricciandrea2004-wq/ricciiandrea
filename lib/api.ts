// Helpers for the JSON API under /api/v1: one response shape and bearer-token checks.
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getStore, type Store } from "./store";

export type ApiErrorCode =
  | "unauthorized"
  | "not_configured"
  | "bad_request"
  | "not_found"
  | "conflict"
  | "internal";

const NO_STORE = { "Cache-Control": "no-store" };

export function ok<T>(data: T, store: Store, status = 200) {
  return NextResponse.json({ ok: true, data, meta: { store: store.kind } }, { status, headers: NO_STORE });
}

export function fail(status: number, code: ApiErrorCode, message: string, details?: Record<string, string>) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: NO_STORE },
  );
}

function sameSecret(given: string, expected: string) {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// Checks "Authorization: Bearer <token>" against an environment variable. Without the variable
// the route is closed (503), so a missing setting never leaves it open.
export function checkBearer(request: Request, envName: "COMPETIA_API_TOKEN" | "CRON_SECRET") {
  const expected = process.env[envName];
  if (!expected) return fail(503, "not_configured", `L'API non è configurata: manca ${envName}.`);
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !sameSecret(match[1].trim(), expected)) {
    return fail(401, "unauthorized", "Token mancante o non valido.");
  }
  return null;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function withStore(handler: (store: Store) => Promise<Response>) {
  const store = getStore();
  try {
    return await handler(store);
  } catch (err) {
    console.error("api", err);
    return fail(500, "internal", "Errore interno. Riprova più tardi.");
  }
}
