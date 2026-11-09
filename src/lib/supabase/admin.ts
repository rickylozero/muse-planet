import "server-only";

import { createClient } from "@supabase/supabase-js";

function getProjectOrigin(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname.replace(/\/+$/, "");

    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (path !== "" && path !== "/rest/v1")
    ) {
      return null;
    }

    // Supabase JS adds /rest/v1 itself. Accept a pasted REST base URL but
    // pass only its origin to avoid a duplicated /rest/v1 path.
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Creates a privileged client for trusted server-side operations only.
 * Never import this module from a Client Component or expose its key in a response.
 */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY &&
      process.env.SUPABASE_URL &&
      getProjectOrigin(process.env.SUPABASE_URL),
  );
}

export function createSupabaseAdminClient() {
  const rawUrl = process.env.SUPABASE_URL;
  const projectOrigin = rawUrl ? getProjectOrigin(rawUrl) : null;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!projectOrigin || !secretKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(projectOrigin, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
