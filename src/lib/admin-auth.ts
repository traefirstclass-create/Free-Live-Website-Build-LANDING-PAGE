import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bvp_admin";

function expectedToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) throw new Error("ADMIN_PASSWORD must be set (8+ characters)");
  const secret = process.env.ADMIN_SESSION_SECRET ?? pw;
  return createHmac("sha256", secret).update(`admin:${pw}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passwordMatches(input: string) {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return pw.length >= 8 && safeEqual(input, pw);
}

export function sessionToken() {
  return expectedToken();
}

export async function isAdmin() {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!value && safeEqual(value, expectedToken());
}
