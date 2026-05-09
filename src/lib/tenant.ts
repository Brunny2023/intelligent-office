const ROOT_DOMAIN = "globaloffice.cloud";

/**
 * Extract the tenant subdomain from the current hostname.
 * Returns null when running on the apex domain, www, localhost,
 * Lovable preview/staging hosts, or any non-tenant host.
 */
export function getTenantSlug(hostname: string = window.location.hostname): string | null {
  if (!hostname) return null;
  const host = hostname.toLowerCase();

  // Local dev / preview / staging — no tenant scoping
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  ) {
    return null;
  }

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null;

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = host.slice(0, -1 - ROOT_DOMAIN.length);
    if (!sub || sub === "www") return null;
    // Only the leftmost label is treated as the tenant
    return sub.split(".")[0];
  }

  return null;
}

export function buildTenantUrl(slug: string): string {
  return `https://${slug}.${ROOT_DOMAIN}`;
}

export const TENANT_ROOT_DOMAIN = ROOT_DOMAIN;