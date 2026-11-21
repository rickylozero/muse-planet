import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  isAdminEmailAllowed,
  isApplicationOriginAllowed,
  signAdminSession,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    const accessToken = body.accessToken?.trim();

    if (!accessToken) {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "oauth_unavailable" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user || !data.user.email) {
      const detail = error?.message || "no_email";
      return NextResponse.json({ error: `identity_failed_${detail}` }, { status: 401 });
    }

    if (!isAdminEmailAllowed(data.user.email)) {
      return NextResponse.json({ error: "not_authorized" }, { status: 403 });
    }

    const candidateOrigin = request.headers.get("origin") || request.nextUrl.origin;
    const verifiedOrigin = isApplicationOriginAllowed(candidateOrigin)
      ? candidateOrigin
      : undefined;

    const token = signAdminSession({
      openId: data.user.id,
      email: data.user.email,
      name:
        (data.user.user_metadata?.full_name as string | undefined) ||
        (data.user.user_metadata?.user_name as string | undefined),
      ...(verifiedOrigin ? { origin: verifiedOrigin } : {}),
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(verifiedOrigin ?? request.nextUrl.origin),
    );
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `server_error_${message}` }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin") || request.nextUrl.origin;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    "",
    getSessionCookieOptions(origin, 0),
  );
  return response;
}
