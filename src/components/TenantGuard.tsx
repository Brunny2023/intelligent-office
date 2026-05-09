import { useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { getTenantSlug, buildTenantUrl } from "@/lib/tenant";

/**
 * When the app is served from a tenant subdomain (e.g. broadman.globaloffice.cloud),
 * ensure the signed-in user actually belongs to that tenant. If they belong to a
 * different org, redirect them to their own subdomain. If they have no org yet,
 * leave them where they are (Onboarding flow handles it).
 */
const TenantGuard = ({ children }: { children: React.ReactNode }) => {
  const { org, loading } = useOrganization();

  useEffect(() => {
    if (loading) return;
    const urlSlug = getTenantSlug();
    if (!urlSlug || !org) return;
    if (org.slug && org.slug !== urlSlug) {
      window.location.href = `${buildTenantUrl(org.slug)}${window.location.pathname}`;
    }
  }, [loading, org]);

  return <>{children}</>;
};

export default TenantGuard;