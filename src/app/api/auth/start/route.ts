import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getVerifiedApplicationOrigin,
  getSessionCookieOptions,
  OAUTH_NONCE_COOKIE_NAME,
} from "@/lib/auth/session";
import { getManusAuthorizationUrl } from "@/lib/auth/manus-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const StartBody = z.object({ origin: z.string().min(1).max(512) }).strict();

export async function POST(request: NextRequest) {
  const responseHeaders = { "Cache-Control": "no-store" };
  const rawBody = await request.text().catch(() => "");
  if (!rawBody || rawBody.length > 2048) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: responseHeaders });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: responseHeaders });
  }

  const parsed = StartBody.safeParse(body);
  const safeBodyOrigin = parsed.success
    ? getVerifiedApplicationOrigin(request, parsed.data.origin)
    : null;
  if (!safeBodyOrigin) {
    return NextResponse.json({ error: "origin_mismatch" }, { status: 403, headers: responseHeaders });
  }

  const nonce = randomBytes(32).toString("base64url");
  const redirectUri = new URL("/api/auth/callback", safeBodyOrigin).toString();
  const state = Buffer.from(JSON.stringify({ redirectUri, nonce }), "utf8").toString("base64");
  const authorizationUrl = getManusAuthorizationUrl(redirectUri, state);

  if (!authorizationUrl) {
    return NextResponse.json({ error: "oauth_unavailable" }, { status: 503, headers: responseHeaders });
  }

  const response = NextResponse.json({ authorizationUrl }, { headers: responseHeaders });
  response.cookies.set(OAUTH_NONCE_COOKIE_NAME, nonce, {
    ...getSessionCookieOptions(safeBodyOrigin, 10 * 60),
    httpOnly: true,
  });
  return response;
}
