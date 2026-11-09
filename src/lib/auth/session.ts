import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "webdev_app_session";
export const OAUTH_NONCE_COOKIE_NAME = "mzp_oauth_nonce";
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export type AdminSession = {
  appId: string;
  openId: string;
  email: string;
  name?: string;
  exp: number;
  origin?: string;
};

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "none";
  path: string;
  maxAge: number;
};

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function getSigningKey(): string | null {
  return process.env.MANUS_JWT_SECRET || null;
}

function getAppId(): string | null {
  return process.env.MANUS_PROJECT_ID || null;
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isAdminEmailAllowed(email: string): boolean {
  const allowlist = process.env.CMS_ADMIN_EMAILS;
  if (!allowlist) return false;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const allowedEmails = allowlist
    .split(/[;,\n]/)
    .map(normalizeEmail)
    .filter(Boolean);
  return allowedEmails.includes(normalizedEmail);
}

export function getSafeApplicationOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    const isLocalHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const isHttps = url.protocol === "https:";

    if (
      (!isHttps && !isLocalHttp) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.origin !== value
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function isApplicationOriginAllowed(value: string): boolean {
  const safeOrigin = getSafeApplicationOrigin(value);
  if (!safeOrigin) return false;

  const configuredOrigins = (process.env.CMS_ALLOWED_ORIGINS || "")
    .split(/[;,\n]/)
    .map((origin) => getSafeApplicationOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));
  return configuredOrigins.includes(safeOrigin);
}

export function getVerifiedApplicationOrigin(
  request: NextRequest,
  candidate: string,
): string | null {
  const safeCandidate = getSafeApplicationOrigin(candidate);
  if (!safeCandidate || !isApplicationOriginAllowed(safeCandidate)) return null;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return null;

  let refererOrigin: string | null = null;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      refererOrigin = getSafeApplicationOrigin(new URL(referer).origin);
    } catch {
      return null;
    }
    if (refererOrigin !== safeCandidate) return null;
  }

  const headerOrigin = getSafeApplicationOrigin(request.headers.get("origin") ?? "");
  if (headerOrigin === safeCandidate) return safeCandidate;
  if (fetchSite === "same-origin") return safeCandidate;

  return refererOrigin === safeCandidate ? safeCandidate : null;
}

export function getSessionCookieOptions(
  origin: string,
  maxAge = SESSION_MAX_AGE_SECONDS,
): CookieOptions {
  const safeOrigin = getSafeApplicationOrigin(origin);
  const secure = safeOrigin ? new URL(safeOrigin).protocol === "https:" : true;

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge,
  };
}

export function signAdminSession(
  identity: Omit<AdminSession, "appId" | "exp"> & { exp?: number },
): string {
  const secret = getSigningKey();
  const appId = getAppId();
  if (!secret || !appId) throw new Error("Application authentication is unavailable.");

  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      ...identity,
      appId,
      iat: now,
      exp: identity.exp ?? now + SESSION_MAX_AGE_SECONDS,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
}

export function getAdminSessionFromToken(token: string | undefined): AdminSession | null {
  const secret = getSigningKey();
  const expectedAppId = getAppId();
  if (!token || token.length > 12_000 || !secret || !expectedAppId) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as unknown;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as unknown;
    if (!isJsonRecord(header) || header.alg !== "HS256" || !isJsonRecord(payload)) {
      return null;
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest("base64url");
    if (!constantTimeTextEqual(parts[2], expectedSignature)) return null;

    const openId = typeof payload.openId === "string" ? payload.openId : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : undefined;
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    const origin = typeof payload.origin === "string" ? payload.origin : undefined;
    const now = Math.floor(Date.now() / 1000);

    if (
      payload.appId !== expectedAppId ||
      !openId ||
      !email ||
      !Number.isFinite(exp) ||
      exp <= now ||
      !isAdminEmailAllowed(email) ||
      (origin !== undefined && !isApplicationOriginAllowed(origin))
    ) {
      return null;
    }

    return {
      appId: expectedAppId,
      openId,
      email: normalizeEmail(email),
      ...(name ? { name } : {}),
      exp,
      ...(origin ? { origin } : {}),
    };
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return getAdminSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function getRequestAdmin(request: NextRequest): AdminSession | null {
  return getAdminSessionFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function isSameSessionOrigin(session: AdminSession, request: NextRequest): boolean {
  if (!session.origin) return false;
  return getVerifiedApplicationOrigin(request, session.origin) === session.origin;
}
