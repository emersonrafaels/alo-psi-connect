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
  GraduationCap,
  Wrench,
  FileSpreadsheet,
  TrendingUp,
  Video,
  Database
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

const adminMenuGroups = [
  {
    label: 'Visão Geral',
    items: [
      {
        title: 'Dashboard',
        url: '/admin',
        icon: Home,
        requiredRole: 'admin' as const
      },
      {
        title: 'Analytics',
        url: '/admin/analytics',
        icon: BarChart3,
        requiredRole: 'admin' as const
      }
    ]
  },
  {
    label: 'Gestão de Pessoas',
    items: [
      {
        title: 'Usuários',
        url: '/admin/users',
        icon: Users,
        requiredRole: 'admin' as const
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
        title: 'Importação em Massa',
        url: '/admin/bulk-import',
        icon: FileSpreadsheet,
        requiredRole: 'admin' as const
      }
    ]
  },
  {
    label: 'Operações',
    items: [
      {
        title: 'Agendamentos',
        url: '/admin/appointments',
        icon: Calendar,
        requiredRole: 'admin' as const
      },
      {
        title: 'Encontros',
        url: '/admin/encontros',
        icon: Users,
        requiredRole: 'admin' as const
      },
      {
        title: 'Financeiro',
        url: '/admin/financial',
        icon: DollarSign,
        requiredRole: 'admin' as const
      }
    ]
  },
  {
    label: 'Conteúdo',
    items: [
      {
        title: 'Publicações',
        url: '/admin/blog',
        icon: FileText,
        requiredRole: null
      },
      {
        title: 'Curadoria',
        url: '/admin/blog/curation',
        icon: Star,
        requiredRole: null
      },
      {
        title: 'Análises do Blog',
        url: '/admin/blog-analytics',
        icon: TrendingUp,
        requiredRole: null
      }
    ]
  },
  {
    label: 'Configurações',
    items: [
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
      }
    ]
  },
  {
    label: 'Sistema',
    items: [
      {
        title: 'Manutenção',
        url: '/admin/system',
        icon: Wrench,
        requiredRole: 'super_admin' as const
      },
      {
        title: 'Testes',
        url: '/admin/tests',
        icon: FlaskConical,
        requiredRole: 'super_admin' as const
      },
      {
        title: 'Google Calendar',
        url: '/admin/google-calendar-tests',
        icon: Video,
        requiredRole: 'super_admin' as const
      },
      {
        title: 'Dados Demo',
        url: '/admin/demo-data',
        icon: Database,
        requiredRole: 'super_admin' as const
      }
    ]
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

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarContent>
        {adminMenuGroups.map((group) => {
          const visibleItems = group.items.filter(item => 
            !item.requiredRole || hasRole(item.requiredRole as any)
          );
          
          if (visibleItems.length === 0) return null;
          
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
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
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
};