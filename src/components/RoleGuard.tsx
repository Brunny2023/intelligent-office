import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { isPathAllowed, roleLanding } from "@/lib/roleNav";

/**
 * Keeps each role inside the surfaces they are meant to use. Roles are only
 * enforced once resolved — users without a role yet (fresh sign-up / onboarding)
 * pass through untouched.
 */
const RoleGuard = ({ children }: { children: React.ReactNode }) => {
  const { role, loading } = useUserRole();
  const { isPlatformAdmin, loading: paLoading } = usePlatformAdmin();
  const location = useLocation();

  if (loading || paLoading || !role || isPlatformAdmin) return <>{children}</>;

  if (!isPathAllowed(role, location.pathname)) {
    return <Navigate to={roleLanding(role)} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
