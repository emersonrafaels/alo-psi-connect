import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Sobre", href: "/sobre" },
    { name: "Blog", href: "/blog" },
    { name: "Trabalhe Conosco", href: "/trabalhe-conosco" },
    { name: "Agendar Consulta", href: "/agendar" },
    { name: "Contato", href: "/contato" },
  ]

  const isActive = (path: string) => location.pathname === path

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
            <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              Cadastrar
            </Button>
            <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Entrar
            </Button>
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
                <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  Cadastrar
                </Button>
                <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Entrar
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header