import "server-only";

export type ManusIdentity = {
  openId: string;
  email: string;
  name?: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getOAuthApiUrl(method: string): string | null {
  const rawBase = process.env.MANUS_OAUTH_API_URL;
  if (!rawBase) return null;

  try {
    const base = new URL(rawBase);
    if (base.protocol !== "https:" || base.username || base.password) return null;
    const prefix = base.pathname.replace(/\/+$/, "");
    return `${base.origin}${prefix}/webdev.v1.WebDevAuthPublicService/${method}`;
  } catch {
    return null;
  }
}

export function getManusProjectId(): string | null {
  return process.env.MANUS_PROJECT_ID || null;
}

export function getManusAuthorizationUrl(
  redirectUri: string,
  state: string,
): string | null {
  const appId = getManusProjectId();
  const rawPortal = process.env.MANUS_OAUTH_PORTAL_URL;
  if (!appId || !rawPortal) return null;

  try {
    const portal = new URL(rawPortal);
    if (portal.protocol !== "https:" || portal.username || portal.password) return null;
    portal.pathname = `${portal.pathname.replace(/\/+$/, "")}/app-auth`;
    portal.search = "";
    portal.hash = "";
    portal.searchParams.set("appId", appId);
    portal.searchParams.set("redirectUri", redirectUri);
    portal.searchParams.set("state", state);
    portal.searchParams.set("responseType", "code");
    return portal.toString();
  } catch {
    return null;
  }
}

async function postJson(url: string, body: JsonRecord): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) {
      console.error("[auth] Manus OAuth request failed", { status: response.status });
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    console.error("[auth] Manus OAuth request could not be completed.");
    return null;
  }
}

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
): Promise<string | null> {
  const endpoint = getOAuthApiUrl("ExchangeToken");
  const appId = getManusProjectId();
  if (!endpoint || !appId) return null;

  const result = await postJson(endpoint, {
    clientId: appId,
    grantType: "authorization_code",
    code,
    redirectUri,
  });

  if (!isRecord(result) || typeof result.accessToken !== "string") return null;
  return result.accessToken;
}

export async function getManusIdentity(accessToken: string): Promise<ManusIdentity | null> {
  const endpoint = getOAuthApiUrl("GetUserInfo");
  if (!endpoint) return null;

  const result = await postJson(endpoint, { accessToken });
  if (
    !isRecord(result) ||
    typeof result.openId !== "string" ||
    typeof result.email !== "string" ||
    !result.email.trim()
  ) {
    return null;
  }

  return {
    openId: result.openId,
    email: result.email.trim(),
    ...(typeof result.name === "string" ? { name: result.name } : {}),
  };
}
