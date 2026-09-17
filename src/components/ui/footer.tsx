import { Button } from "@/components/ui/button";
import { GlobalCacheButton } from "./global-cache-button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { getLuminance, hexToHSL, isHexColor } from "@/utils/colorHelpers";
import { MapPin, Phone, Instagram, Facebook, Twitter, Linkedin, Users, FileText, Heart, MessageCircleIcon, Mail } from "lucide-react";

const REDE_BEM_ESTAR_LOGO_LIGHT_BG = 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_1.png';
const REDE_BEM_ESTAR_LOGO_DARK_BG = 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_2.png';
const MEDCOS_LOGO = 'https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/logo/logo_medcos.png';

const getDefaultFooterLogoUrl = (slug: string, isDarkBackground: boolean) => {
  if (slug === 'medcos') {
    return MEDCOS_LOGO;
  }

  return isDarkBackground ? REDE_BEM_ESTAR_LOGO_DARK_BG : REDE_BEM_ESTAR_LOGO_LIGHT_BG;
};

const Footer = () => {
  const {
    isAdmin
  } = useAdminAuth();
  const {
    tenant
  } = useTenant();
  const { resolvedTheme } = useTheme();
  const tenantSlug = tenant?.slug || 'alopsi';
  const [footerLogoIndex, setFooterLogoIndex] = useState(0);
  const [footerLogoFailed, setFooterLogoFailed] = useState(false);

  const isDarkMode = resolvedTheme === 'dark';
  const footerBgColor = isDarkMode
    ? tenant?.footer_bg_color_dark || '280 63% 16%'
    : tenant?.footer_bg_color_light || '280 63% 34%';
  const footerBgHsl = isHexColor(footerBgColor) ? hexToHSL(footerBgColor) : footerBgColor;
  const isFooterBackgroundDark = getLuminance(footerBgHsl) <= 0.5;

  const footerLogoCandidates = useMemo(() => {
    const configuredLogos = isFooterBackgroundDark
      ? [tenant?.footer_logo_url_dark, tenant?.footer_logo_url, tenant?.logo_url_dark, tenant?.logo_url]
      : [tenant?.footer_logo_url, tenant?.footer_logo_url_dark, tenant?.logo_url, tenant?.logo_url_dark];

    return [...configuredLogos, getDefaultFooterLogoUrl(tenantSlug, isFooterBackgroundDark)]
      .filter((url): url is string => Boolean(url))
      .filter((url, index, urls) => urls.indexOf(url) === index);
  }, [isFooterBackgroundDark, tenant, tenantSlug]);

  const footerLogoUrl = footerLogoCandidates[footerLogoIndex];

  useEffect(() => {
    setFooterLogoIndex(0);
    setFooterLogoFailed(false);
  }, [tenant?.id, footerLogoCandidates]);

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
  
  const usefulLinks = [{
    name: "Sobre Nós",
    href: buildTenantPath(tenantSlug, "/sobre"),
    icon: Users,
    enabled: true
  }, {
    name: "Nossos Profissionais",
    href: buildTenantPath(tenantSlug, "/profissionais"),
    icon: Heart,
    enabled: professionalsEnabled
  }, {
    name: "Blog",
    href: buildTenantPath(tenantSlug, "/blog"),
    icon: FileText,
    enabled: blogEnabled
  }].filter(link => link.enabled);
  const navigationLinks = [{
    name: "Home",
    href: buildTenantPath(tenantSlug, "/"),
    enabled: true
  }, {
    name: "Profissionais",
    href: buildTenantPath(tenantSlug, "/profissionais"),
    enabled: professionalsEnabled
  }, {
    name: "Contato",
    href: buildTenantPath(tenantSlug, "/contato"),
    enabled: true
  }, {
    name: "Práticas",
    href: buildTenantPath(tenantSlug, "/praticas"),
    enabled: true
  }, {
    name: "Blog",
    href: buildTenantPath(tenantSlug, "/blog"),
    enabled: blogEnabled
  }].filter(link => link.enabled);
  const links = {
    useful: usefulLinks,
    navigation: navigationLinks
  };
  return <footer className="bg-[hsl(var(--footer-bg))] text-[hsl(var(--footer-text))]">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

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
            {isAdmin && <li>
                <GlobalCacheButton variant="minimal" className="text-sm opacity-80 hover:opacity-100 text-primary-foreground" />
              </li>}
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
              {tenant?.contact_address && <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{tenant.contact_address}</p>
                </div>}
              {tenant?.cnpj && <p>CNPJ: {tenant.cnpj}</p>}
              {tenant?.contact_phone && <div className="flex items-center gap-2">
                  <MessageCircleIcon className="w-4 h-4" />
                  <a href={`tel:${tenant.contact_phone}`} className="hover:opacity-100 transition-opacity">
                    {tenant.contact_phone}
                  </a>
                </div>}
              {(tenant?.contact_email || true) && <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${tenant?.contact_email && tenant.contact_email !== 'contato@alopsi.com.br' ? tenant.contact_email : 'redebemestar1@gmail.com'}`} className="hover:opacity-100 transition-opacity">
                    {tenant?.contact_email && tenant.contact_email !== 'contato@alopsi.com.br' ? tenant.contact_email : 'redebemestar1@gmail.com'}
                  </a>
                </div>}
            </div>
          </div>

          {/* Redes Sociais */}
          {(tenant?.social_instagram || tenant?.social_facebook || tenant?.social_linkedin) && <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
              <div className="flex gap-3">
                {tenant?.social_instagram && <a href={tenant.social_instagram} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                    <Instagram className="w-5 h-5" />
                  </a>}
                {tenant?.social_facebook && <a href={tenant.social_facebook} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                    <Facebook className="w-5 h-5" />
                  </a>}
                {tenant?.social_linkedin && <a href={tenant.social_linkedin} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                    <Linkedin className="w-5 h-5" />
                  </a>}
              </div>
            </div>}
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm opacity-60">Copyright © {tenant?.name || 'Rede Bem-Estar'} | Todos os direitos reservados</p>
          {footerLogoUrl && !footerLogoFailed ? (
            <img
              src={footerLogoUrl}
              alt={tenant?.name || 'Rede Bem-Estar'}
              className="h-12 w-auto mt-4 md:mt-0 opacity-80"
              onError={() => {
                if (footerLogoIndex + 1 < footerLogoCandidates.length) {
                  setFooterLogoIndex(prev => prev + 1);
                  return;
                }

                setFooterLogoFailed(true);
              }}
            />
          ) : (
            <span className="text-lg font-semibold mt-4 md:mt-0 opacity-80">
              {tenant?.name || 'Rede Bem-Estar'}
            </span>
          )}
        </div>
      </div>
    </footer>;
};
export { Footer };
export default Footer;