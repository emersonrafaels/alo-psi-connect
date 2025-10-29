import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalCacheButton } from "./global-cache-button";
import { useNewsletter } from "@/hooks/useNewsletter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { useState } from "react";
import { Mail, MapPin, Phone, Instagram, Facebook, Twitter, Linkedin, Users, Calendar, FileText, MessageCircle, Heart, MessageCircleIcon } from "lucide-react";

const Footer = () => {
  const { isAdmin } = useAdminAuth();
  const { tenant } = useTenant();
  const {
    subscribe,
    isLoading
  } = useNewsletter();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  
  const tenantSlug = tenant?.slug || 'alopsi';
  
  // Helper function to build footer links with tenant context
  const buildFooterLink = (customUrl: string | null | undefined, defaultPath: string) => {
    // If it's an external URL, don't prefix with tenant path
    if (customUrl && (customUrl.startsWith('http://') || customUrl.startsWith('https://'))) {
      return customUrl;
    }
    // Otherwise, use buildTenantPath
    return buildTenantPath(tenantSlug, customUrl || defaultPath);
  };
  
  // Check if modules are enabled
  const blogEnabled = useModuleEnabled('blog');
  const professionalsEnabled = useModuleEnabled('professionals');
  const appointmentsEnabled = useModuleEnabled('appointments');
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
  const usefulLinks = [
    {
      name: "Sobre Nós",
      href: buildTenantPath(tenantSlug, "/sobre"),
      icon: Users,
      enabled: true
    },
    {
      name: "Nossos Profissionais",
      href: buildTenantPath(tenantSlug, "/profissionais"),
      icon: Heart,
      enabled: professionalsEnabled
    },
    {
      name: "Agendar Consulta",
      href: buildTenantPath(tenantSlug, "/profissionais"),
      icon: Calendar,
      enabled: appointmentsEnabled
    },
    {
      name: "Blog",
      href: buildTenantPath(tenantSlug, "/blog"),
      icon: FileText,
      enabled: blogEnabled
    }
  ].filter(link => link.enabled);

  const navigationLinks = [
    {
      name: "Home",
      href: buildTenantPath(tenantSlug, "/"),
      enabled: true
    },
    {
      name: "Profissionais",
      href: buildTenantPath(tenantSlug, "/profissionais"),
      enabled: professionalsEnabled
    },
    {
      name: "Agendar",
      href: buildTenantPath(tenantSlug, "/profissionais"),
      enabled: appointmentsEnabled
    },
    {
      name: "Contato",
      href: buildTenantPath(tenantSlug, "/contato"),
      enabled: true
    },
    {
      name: "Blog",
      href: buildTenantPath(tenantSlug, "/blog"),
      enabled: blogEnabled
    }
  ].filter(link => link.enabled);
  
  const links = {
    useful: usefulLinks,
    navigation: navigationLinks
  };
  return <footer className="bg-gray-800 text-primary-foreground">
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
                <a href={buildFooterLink(tenant?.privacy_url, "/politica-privacidade")} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href={buildFooterLink(tenant?.terms_url, "/termos-servico")} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
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
              {tenant?.contact_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{tenant.contact_address}</p>
                </div>
              )}
              {tenant?.cnpj && (
                <p>CNPJ: {tenant.cnpj}</p>
              )}
              {tenant?.contact_phone && (
                <div className="flex items-center gap-2">
                  <MessageCircleIcon className="w-4 h-4" />
                  <a href={`tel:${tenant.contact_phone}`} className="hover:opacity-100 transition-opacity">
                    {tenant.contact_phone}
                  </a>
                </div>
              )}
              {tenant?.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${tenant.contact_email}`} className="hover:opacity-100 transition-opacity">
                    {tenant.contact_email}
                  </a>
                </div>
              )}
              
              {/* Trabalhe Conosco */}
              <div className="pt-2 border-t border-primary-foreground/20">
                <a 
                  href={buildTenantPath(tenantSlug, '/trabalhe-conosco')} 
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Trabalhe Conosco
                </a>
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          {(tenant?.social_instagram || tenant?.social_facebook || tenant?.social_linkedin) && (
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
              <div className="flex gap-3">
                {tenant?.social_instagram && (
                  <a href={tenant.social_instagram} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {tenant?.social_facebook && (
                  <a href={tenant.social_facebook} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {tenant?.social_linkedin && (
                  <a href={tenant.social_linkedin} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm opacity-60">Copyright © {tenant?.name || 'Alô, Psi!'} | Todos os direitos reservados</p>
          <div className="w-16 h-16 bg-accent rounded-full mt-4 md:mt-0"></div>
        </div>
      </div>
    </footer>;
};

export { Footer };
export default Footer;