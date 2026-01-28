import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Menu, X, User, LogOut, Settings, Calendar, Shield, Briefcase, FileText, Stethoscope, Heart, Building2, Users } from "lucide-react"
import { GlobalCacheButton } from "@/components/ui/global-cache-button"
import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { useUserType } from "@/hooks/useUserType"
import { useAuthorRole } from "@/hooks/useAuthorRole"
import { useTenant } from "@/hooks/useTenant"
import { useUserRole } from "@/hooks/useUserRole"
import { TenantBranding } from "@/components/TenantBranding"
import { buildTenantPath, getTenantSlugFromPath } from "@/utils/tenantHelpers"
import { UnderConstructionModal } from "@/components/UnderConstructionModal"
import { supabase } from "@/integrations/supabase/client"
import { Tenant } from "@/types/tenant"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showConstructionModal, setShowConstructionModal] = useState(false)
  const [targetTenant, setTargetTenant] = useState<Tenant | null>(null)
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, signOut } = useAuth()
  const { profile } = useUserProfile()
  const { isAdmin } = useAdminAuth()
  const { isProfessional } = useUserType()
  const { isAuthor } = useAuthorRole()
  const { tenant } = useTenant()
  const { hasRole: isInstitutionAdmin, loading: institutionAdminLoading } = useUserRole('institution_admin')

  // Usar o slug da URL para navegação (sempre consistente com a rota atual)
  const tenantSlug = getTenantSlugFromPath(location.pathname)

  // Fetch all active tenants for the switcher
  useEffect(() => {
    const fetchTenants = async () => {
      const { data } = await supabase
        .from('tenants')
        .select('id, slug, name, logo_url, logo_url_dark, cross_tenant_navigation_warning_enabled, cross_tenant_navigation_warning_title, cross_tenant_navigation_warning_message')
        .eq('is_active', true)
      if (data) setAllTenants(data as unknown as Tenant[])
    }
    fetchTenants()
  }, [])

  // Find the other tenant for the switcher
  const otherTenant = allTenants.find(t => t.slug !== tenantSlug)
  
  // Theme-aware logo selection for switcher
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'

  // Fetch target tenant config when needed
  const handleTenantNavigation = async (targetSlug: string, targetPath: string) => {
    const { data: targetTenantData } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', targetSlug)
      .eq('is_active', true)
      .single()

    if (targetTenantData?.cross_tenant_navigation_warning_enabled) {
      setTargetTenant(targetTenantData as unknown as Tenant)
      setShowConstructionModal(true)
    } else {
      navigate(targetPath)
    }
  }

  const navigation = [
    { name: "Home", href: buildTenantPath(tenantSlug, '/') },
    { name: "Sobre", href: buildTenantPath(tenantSlug, '/sobre') },
    { name: "Profissionais", href: buildTenantPath(tenantSlug, '/profissionais') },
    { name: "Encontros", href: buildTenantPath(tenantSlug, '/encontros') },
    { name: "Diário Emocional", href: buildTenantPath(tenantSlug, loading ? '/diario-emocional/experiencia' : (user ? '/diario-emocional' : '/diario-emocional/experiencia')) },
    { name: "Blog", href: buildTenantPath(tenantSlug, '/blog') },
    { name: "Contato", href: buildTenantPath(tenantSlug, '/contato') },
  ]

  const isActive = (path: string) => location.pathname === path

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b shadow-sm" 
      style={{ 
        backgroundColor: 'hsl(var(--header-bg))',
        color: 'hsl(var(--header-text))'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 md:h-20 gap-4">
          {/* Logo Principal */}
          <div className="flex-shrink-0">
            <TenantBranding />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 flex-grow justify-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive(item.href) 
                    ? "text-accent font-semibold" 
                    : "hover:text-accent"
                )}
                style={{ color: isActive(item.href) ? undefined : 'inherit' }}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {/* Logo Secundário (Outro Tenant) - Dinâmico */}
            {otherTenant && (() => {
              const switcherLogoUrl = isDarkMode && otherTenant.logo_url_dark 
                ? otherTenant.logo_url_dark 
                : otherTenant.logo_url;
              return (
                <button 
                  onClick={() => handleTenantNavigation(otherTenant.slug, otherTenant.slug === 'alopsi' ? '/' : `/${otherTenant.slug}`)}
                  className="flex items-center bg-background hover:bg-muted rounded-lg px-3 py-2 transition-colors cursor-pointer shadow-md border border-border"
                  title={`Ir para ${otherTenant.name}`}
                >
                  <img 
                    src={switcherLogoUrl || '/placeholder.svg'}
                    alt={otherTenant.name}
                    className="h-8 w-auto object-contain"
                  />
                </button>
              );
            })()}
            
            {/* Separador Visual */}
            <div className="h-8 w-px bg-border opacity-30" />
            
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile?.foto_perfil_url} alt={profile?.nome || user.email || ''} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(profile?.nome || user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">
                    {profile?.nome?.split(' ')[0] || user.email}
                  </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{profile?.nome || user.email}</div>
                    <div className="flex items-center gap-1">
                      {isInstitutionAdmin && !institutionAdminLoading ? (
                        <Badge variant="outline" className="flex items-center gap-1 shrink-0 border-purple-500 text-purple-700 dark:text-purple-300">
                          <Building2 className="h-3 w-3" />
                          <span className="text-xs">Instituição</span>
                        </Badge>
                      ) : profile?.tipo_usuario === 'profissional' ? (
                        <Badge variant="default" className="flex items-center gap-1 shrink-0">
                          <Stethoscope className="h-3 w-3" />
                          <span className="text-xs">Pro</span>
                        </Badge>
                      ) : profile?.tipo_usuario === 'paciente' ? (
                        <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                          <Heart className="h-3 w-3" />
                          <span className="text-xs">Paciente</span>
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                  <DropdownMenuSeparator />
                {isInstitutionAdmin && !institutionAdminLoading ? (
                  <DropdownMenuItem onClick={() => navigate(buildTenantPath(tenantSlug, '/portal-institucional'))}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Minha Instituição
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => navigate(buildTenantPath(tenantSlug, '/agendamentos'))}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Meus Agendamentos
                  </DropdownMenuItem>
                )}
                  <DropdownMenuItem onClick={() => navigate(buildTenantPath(tenantSlug, '/meus-encontros'))}>
                    <Users className="h-4 w-4 mr-2" />
                    Meus Encontros
                  </DropdownMenuItem>
                  {isProfessional && (
                    <DropdownMenuItem onClick={() => navigate(buildTenantPath(tenantSlug, '/professional-profile'))}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Área Profissional
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate(buildTenantPath(tenantSlug, '/perfil'))}>
                    <Settings className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  {isAuthor && (
                    <DropdownMenuItem onClick={() => navigate('/admin/blog')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerenciar Blog
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Acessar Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <GlobalCacheButton variant="minimal" className="w-full justify-start p-0 h-auto" />
                  )}
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
                <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/cadastro/tipo-usuario'))}
                  title="Criar uma nova conta gratuita"
                >
                  Cadastrar
                </Button>
                <Button 
                  variant="tenant-primary" 
                  size="sm" 
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'))}
                  title="Acessar sua conta existente"
                >
                  Entrar
                </Button>
                </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-sm hover:text-accent transition-colors",
                    isActive(item.href) && "text-accent font-medium"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <>
                   <Link
                    to={buildTenantPath(tenantSlug, '/agendamentos')}
                    className="text-sm hover:text-accent transition-colors flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    Meus Agendamentos
                  </Link>
                  <Link
                    to={buildTenantPath(tenantSlug, '/meus-encontros')}
                    className="text-sm hover:text-accent transition-colors flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    Meus Encontros
                  </Link>
                  {isProfessional && (
                    <Link
                      to={buildTenantPath(tenantSlug, '/professional-profile')}
                      className="text-sm hover:text-accent transition-colors flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Briefcase className="h-4 w-4" />
                      Área Profissional
                    </Link>
                  )}
                  <Link
                    to={buildTenantPath(tenantSlug, '/perfil')}
                    className="text-sm hover:text-accent transition-colors flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  {isAuthor && (
                    <Link
                      to="/admin/blog"
                      className="text-sm hover:text-accent transition-colors flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      Gerenciar Blog
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-sm hover:text-accent transition-colors flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Acessar Admin
                    </Link>
                  )}
                </>
              )}
                <div className="flex flex-col space-y-2 pt-4 border-t border-primary-foreground/20">
                <div className="flex justify-center pb-2">
                  <ThemeToggle />
                </div>
                {isAdmin && (
                  <div className="flex justify-center pb-2">
                    <GlobalCacheButton variant="minimal" />
                  </div>
                )}
                {user ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                ) : (
                 <>
  <Button
    variant="outline"
    size="sm"
    className="
      border-[hsl(var(--accent))]
      text-[hsl(var(--accent))]
      hover:bg-[hsl(var(--accent))]
      hover:text-[hsl(var(--accent-foreground))]
    "
    onClick={() => navigate(buildTenantPath(tenantSlug, '/cadastro/tipo-usuario'))}
    title="Criar uma nova conta gratuita"
  >
    Cadastrar
  </Button>

  <Button
    variant="tenant-primary"
    size="sm"
    onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'))}
    title="Acessar sua conta existente"
  >
    Entrar
  </Button>
</>

                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Under Construction Modal */}
      <UnderConstructionModal
        open={showConstructionModal}
        onOpenChange={setShowConstructionModal}
        title={targetTenant?.cross_tenant_navigation_warning_title}
        message={targetTenant?.cross_tenant_navigation_warning_message}
        tenantName={targetTenant?.name || ''}
      />
    </header>
  )
}

export default Header