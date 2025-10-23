import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Settings,
  Shield,
  Home,
  FileText,
  Star,
  Building2,
  FlaskConical,
  GraduationCap
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const adminMenuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: Home,
    requiredRole: 'admin' as const // Apenas admins/super_admins
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: BarChart3,
    requiredRole: 'admin' as const // Apenas admins (analytics gerais da plataforma)
  },
  {
    title: 'Usuários',
    url: '/admin/users',
    icon: Users,
    requiredRole: 'admin' as const // Apenas admins/super_admins
  },
  {
    title: 'Profissionais',
    url: '/admin/professionals',
    icon: UserCheck,
    requiredRole: 'admin' as const
  },
  {
    title: 'Instituições',
    url: '/admin/instituicoes',
    icon: GraduationCap,
    requiredRole: 'admin' as const
  },
  {
    title: 'Agendamentos',
    url: '/admin/appointments',
    icon: Calendar,
    requiredRole: 'admin' as const
  },
  {
    title: 'Financeiro',
    url: '/admin/financial',
    icon: DollarSign,
    requiredRole: 'admin' as const
  },
  {
    title: 'Configurações',
    url: '/admin/configuracoes',
    icon: Settings,
    requiredRole: 'admin' as const
  },
  {
    title: 'Roles',
    url: '/admin/roles',
    icon: Shield,
    requiredRole: 'super_admin' as const
  },
  {
    title: 'Tenants',
    url: '/admin/tenants',
    icon: Building2,
    requiredRole: 'super_admin' as const
  },
  {
    title: 'Testes',
    url: '/admin/tests',
    icon: FlaskConical,
    requiredRole: 'super_admin' as const
  },
  {
    title: 'Blog',
    url: '/admin/blog',
    icon: FileText,
    requiredRole: null // Autores e admins podem ver
  }
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { hasRole } = useAdminAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const filteredItems = adminMenuItems.filter(item => {
    if (!item.requiredRole) return true;
    return hasRole(item.requiredRole as any);
  });

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className={({ isActive: navIsActive }) =>
                        navIsActive || isActive(item.url)
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};