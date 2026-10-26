import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { PortalSidebar, PortalMobileNav, buildPortalNav } from './PortalSidebar';

const PATH_TO_ID: Array<[string, string]> = [
  ['/portal-institucional/alunos', 'students-page'],
  ['/portal-institucional/profissionais', 'professionals-page'],
  ['/portal-institucional/apoios', 'supports-page'],
];

/** Keeps the portal side menu on portal sub-pages. */
export function PortalPageShell({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const build = (p: string) => buildTenantPath(tenant?.slug, p);
  const items = buildPortalNav(build, false);
  const active = PATH_TO_ID.find(([p]) => pathname.includes(p))?.[1] ?? '';
  const onSelect = (id: string) =>
    navigate(id === 'overview' ? build('/portal-institucional') : `${build('/portal-institucional')}?tab=${id}`);

  return (
    <div className="container mx-auto px-4 pt-6">
      <div className="flex gap-6 items-start">
        <PortalSidebar items={items} active={active} onSelect={onSelect} />
        <div className="flex-1 min-w-0 [&>.container]:max-w-none [&>.container]:px-0 [&>.container]:pt-0">
          <PortalMobileNav items={items} active={active} onSelect={onSelect} />
          {children}
        </div>
      </div>
    </div>
  );
}
