import { cookies } from "next/headers";
import { LAST_SEEN_COOKIE, sessionCookieOptions } from "./session";

/** Starts the idle clock; call it right after every successful sign-in. */
export async function markSignedIn() {
  (await cookies()).set(LAST_SEEN_COOKIE, String(Math.floor(Date.now() / 1000)), sessionCookieOptions);
}

export async function clearSignedIn() {
  (await cookies()).delete(LAST_SEEN_COOKIE);
}
