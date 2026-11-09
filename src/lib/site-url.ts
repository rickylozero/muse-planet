export function getCanonicalSiteUrl(): URL | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured || configured.trim() !== configured) return undefined;

  try {
    const candidate = new URL(configured);
    const isHttps = candidate.protocol === "https:";
    const hasCredentials = Boolean(candidate.username || candidate.password);
    const hostname = candidate.hostname.toLowerCase();
    const isPreviewOrLocalHost =
      hostname.endsWith(".manus.computer") ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local");
    const isOriginOnly =
      (candidate.pathname === "" || candidate.pathname === "/") &&
      candidate.search === "" &&
      candidate.hash === "";

    if (!isHttps || hasCredentials || isPreviewOrLocalHost || !isOriginOnly) {
      return undefined;
    }
    return new URL(`${candidate.origin}/`);
  } catch {
    return undefined;
  }
}
