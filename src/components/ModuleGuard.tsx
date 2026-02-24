import { Navigate } from "react-router-dom";
import { useModuleEnabled, ModuleName } from "@/hooks/useModuleEnabled";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import { getTenantSlugFromPath } from "@/utils/tenantHelpers";
import { useLocation } from "react-router-dom";

interface ModuleGuardProps {
  module: ModuleName;
  children: React.ReactNode;
}

export const ModuleGuard = ({ module, children }: ModuleGuardProps) => {
  const enabled = useModuleEnabled(module);
  const location = useLocation();
  const tenantSlug = getTenantSlugFromPath(location.pathname);

  if (!enabled) {
    return <Navigate to={buildTenantPath(tenantSlug, '/')} replace />;
  }

  return <>{children}</>;
};
