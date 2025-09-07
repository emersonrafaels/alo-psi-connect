import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, User, LogOut, Settings, Calendar } from "lucide-react"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useUserProfile } from "@/hooks/useUserProfile"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { profile } = useUserProfile()

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Sobre", href: "/sobre" },
    { name: "Profissionais", href: "/profissionais" },
    { name: "Blog", href: "/blog" },
    { name: "Trabalhe Conosco", href: "/trabalhe-conosco" },
    { name: "Agendar Consulta", href: "https://alo-psi-connect.lovable.app/profissionais" },
    { name: "Contato", href: "/contato" },
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
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">AP</span>
            </div>
            <span className="text-xl font-bold">Alô, Psi!</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm hover:text-accent transition-colors",
                  isActive(item.href) && "text-accent font-medium"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile?.foto_perfil_url} alt={profile?.nome || user.email || ''} />
                      <AvatarFallback className="text-xs">
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
                    <div className="font-medium">{profile?.nome || user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/agendamentos')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Meus Agendamentos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                  className="border-accent text-primary dark:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigate('/cadastro/tipo-usuario')}
                >
                  Cadastrar
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => navigate('/auth')}
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
              <div className="flex flex-col space-y-2 pt-4 border-t border-primary-foreground/20">
                <div className="flex justify-center pb-2">
                  <ThemeToggle />
                </div>
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
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        navigate('/cadastro/tipo-usuario');
                        setIsMenuOpen(false);
                      }}
                    >
                      Cadastrar
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
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
    </header>
  )
}

export default Header