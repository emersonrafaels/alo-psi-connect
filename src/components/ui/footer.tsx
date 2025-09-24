import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalCacheButton } from "./global-cache-button";
import { useNewsletter } from "@/hooks/useNewsletter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState } from "react";
import { Mail, MapPin, Phone, Instagram, Facebook, Twitter, Linkedin, Users, Calendar, FileText, MessageCircle, Heart, MessageCircleIcon } from "lucide-react";
const Footer = () => {
  const { isAdmin } = useAdminAuth();
  const {
    subscribe,
    isLoading
  } = useNewsletter();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const success = await subscribe({
      email,
      nome: nome || undefined
    });
    if (success) {
      setEmail("");
      setNome("");
    }
  };
  const links = {
    useful: [{
      name: "Sobre Nós",
      href: "/about",
      icon: Users
    }, {
      name: "Nossos Profissionais",
      href: "/professionals",
      icon: Heart
    }, {
      name: "Agendar Consulta",
      href: "/appointment",
      icon: Calendar
    }, {
      name: "Blog",
      href: "/blog",
      icon: FileText
    }, {
      name: "Trabalhe Conosco",
      href: "/work-with-us",
      icon: MessageCircle
    }],
    navigation: [{
      name: "Home",
      href: "/"
    }, {
      name: "Profissionais",
      href: "/professionals"
    }, {
      name: "Agendar",
      href: "/appointment"
    }, {
      name: "Contato",
      href: "/contact"
    }, {
      name: "Blog",
      href: "/blog"
    }]
  };
  return <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Newsletter
            </h3>
            <p className="text-sm opacity-80 mb-4">
              Receba dicas de saúde mental e novidades sobre nossos serviços diretamente no seu email.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input type="text" placeholder="Seu nome (opcional)" value={nome} onChange={e => setNome(e.target.value)} className="bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
              <div className="flex gap-2">
                <Input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
                <Button type="submit" variant="accent" size="sm" disabled={isLoading || !email}>
                  {isLoading ? "..." : "→"}
                </Button>
              </div>
            </form>
          </div>

          {/* Links Úteis */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Links úteis</h3>
            <ul className="space-y-2">
              {links.useful.map((link, index) => {
              const IconComponent = link.icon;
              return <li key={index}>
                    <a href={link.href} className="text-sm opacity-80 hover:opacity-100 transition-opacity flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {link.name}
                    </a>
                  </li>;
            })}
            {isAdmin && (
              <li>
                <GlobalCacheButton variant="minimal" className="text-sm opacity-80 hover:opacity-100 text-primary-foreground" />
              </li>
            )}
            </ul>
          </div>

          {/* Navegação */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2">
              {links.navigation.map((link, index) => <li key={index}>
                  <a href={link.href} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                    {link.name}
                  </a>
                </li>)}
              <li>
                <a href="/politica-privacidade" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="/termos-servico" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Termos de Serviço
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contato
            </h3>
            <div className="space-y-3 text-sm opacity-80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>R. Joaquim Távora, 1240 - Vila Mariana, São Paulo - SP, 04015-013</p>
              </div>
              <p>CNPJ: 12.345.678/0001-90, Brasil</p>
              <div className="flex items-center gap-2">
                <MessageCircleIcon className="w-4 h-4" />
                <a href="tel:+5511947994163" className="hover:opacity-100 transition-opacity">(11) 97587-2447</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:alopsi.host@gmail.com" className="hover:opacity-100 transition-opacity">
                  alopsi.host@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              <a href="https://www.instagram.com/medcos_br/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                Siga-nos
              </a>
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Array.from({
              length: 6
            }).map((_, index) => <a key={index} href="https://www.instagram.com/medcos_br/" target="_blank" rel="noopener noreferrer" className="aspect-square bg-teal rounded-md hover:opacity-80 transition-opacity cursor-pointer" />)}
            </div>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/medcos_br/" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm opacity-60">Copyright © Alô, Psi! | Todos os direitos reservados</p>
          <div className="w-16 h-16 bg-accent rounded-full mt-4 md:mt-0"></div>
        </div>
      </div>
    </footer>;
};

export { Footer };
export default Footer;