import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSafeApplicationOrigin,
  getSessionCookieOptions,
  isApplicationOriginAllowed,
  isAdminEmailAllowed,
  OAUTH_NONCE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signAdminSession,
} from "@/lib/auth/session";
import { exchangeAuthorizationCode, getManusIdentity } from "@/lib/auth/manus-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OAuthState = z.object({
  redirectUri: z.string().min(1).max(1024),
  nonce: z.string().min(32).max(128),
}).strict();

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseState(value: string | null) {
  if (!value || value.length > 4096 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    const parsedJson = JSON.parse(Buffer.from(value, "base64").toString("utf8")) as unknown;
    const parsed = OAuthState.safeParse(parsedJson);
    if (!parsed.success) return null;

    const callback = new URL(parsed.data.redirectUri);
    const origin = getSafeApplicationOrigin(callback.origin);
    if (
      !origin ||
      !isApplicationOriginAllowed(origin) ||
      callback.pathname !== "/api/auth/callback" ||
      callback.search ||
      callback.hash ||
      callback.toString() !== parsed.data.redirectUri
    ) {
      return null;
    }

    return { redirectUri: parsed.data.redirectUri, origin, nonce: parsed.data.nonce };
  } catch {
    return null;
  }
}

function redirectToLogin(origin: string, reason: string): NextResponse {
  const url = new URL("/admin/login", origin);
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "no-store" } });
}

function clearNonce(response: NextResponse, origin: string) {
  response.cookies.set(OAUTH_NONCE_COOKIE_NAME, "", {
    ...getSessionCookieOptions(origin, 0),
    expires: new Date(0),
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = parseState(url.searchParams.get("state"));
  if (!state) {
    return NextResponse.json({ error: "invalid_oauth_state" }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const responseNonce = request.cookies.get(OAUTH_NONCE_COOKIE_NAME)?.value;
  if (!responseNonce || !constantTimeEqual(responseNonce, state.nonce)) {
    const response = NextResponse.json({ error: "oauth_state_expired" }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
    clearNonce(response, state.origin);
    return response;
  }

  const providerError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (providerError || !code || code.length > 4096) {
    const response = redirectToLogin(state.origin, "oauth_failed");
    clearNonce(response, state.origin);
    return response;
  }

  const accessToken = await exchangeAuthorizationCode(code, state.redirectUri);
  if (!accessToken) {
    const response = redirectToLogin(state.origin, "oauth_failed");
    clearNonce(response, state.origin);
    return response;
  }

  const identity = await getManusIdentity(accessToken);
  if (!identity) {
    const response = redirectToLogin(state.origin, "identity_failed");
    clearNonce(response, state.origin);
    return response;
  }

  if (!isAdminEmailAllowed(identity.email)) {
    const response = redirectToLogin(state.origin, "not_authorized");
    clearNonce(response, state.origin);
    return response;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const token = signAdminSession({
      openId: identity.openId,
      email: identity.email,
      ...(identity.name ? { name: identity.name } : {}),
      origin: state.origin,
      exp: now + SESSION_MAX_AGE_SECONDS,
    });
    const response = NextResponse.redirect(new URL("/admin", state.origin), {
      status: 303,
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(state.origin));
    clearNonce(response, state.origin);
    return response;
  } catch {
    const response = redirectToLogin(state.origin, "oauth_unavailable");
    clearNonce(response, state.origin);
    return response;
  }
}
