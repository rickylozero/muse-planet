import { NextRequest, NextResponse } from "next/server";
import {
  getRequestAdmin,
  getSessionCookieOptions,
  isSameSessionOrigin,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = getRequestAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!isSameSessionOrigin(admin, request)) {
    return NextResponse.json({ error: "origin_forbidden" }, {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const cookieOptions = getSessionCookieOptions(admin.origin ?? "https://invalid.example", 0);
  const response = NextResponse.json({ ok: true }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions,
    expires: new Date(0),
  });
  return response;
}
