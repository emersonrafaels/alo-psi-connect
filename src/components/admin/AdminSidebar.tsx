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
  FileText
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
    requiredRole: null
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: BarChart3,
    requiredRole: null
  },
  {
    title: 'Usuários',
    url: '/admin/users',
    icon: Users,
    requiredRole: null
  },
  {
    title: 'Profissionais',
    url: '/admin/professionals',
    icon: UserCheck,
    requiredRole: null
  },
  {
    title: 'Agendamentos',
    url: '/admin/appointments',
    icon: Calendar,
    requiredRole: null
  },
  {
    title: 'Financeiro',
    url: '/admin/financial',
    icon: DollarSign,
    requiredRole: 'admin'
  },
  {
    title: 'Configurações',
    url: '/admin/configuracoes',
    icon: Settings,
    requiredRole: 'admin'
  },
  {
    title: 'Roles',
    url: '/admin/roles',
    icon: Shield,
    requiredRole: 'super_admin'
  },
  {
    title: 'Blog',
    url: '/admin/blog',
    icon: FileText,
    requiredRole: null
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