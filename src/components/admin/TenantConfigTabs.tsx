import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface TenantConfigTabsProps {
  formData: any;
  setFormData: (data: any) => void;
}

const LabelWithTooltip = ({ htmlFor, label, tooltip }: { htmlFor: string; label: string; tooltip: string }) => (
  <div className="flex items-center gap-2">
    <Label htmlFor={htmlFor}>{label}</Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);

export const ContactConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <TooltipProvider>
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="contact_phone" 
            label="Telefone" 
            tooltip="Telefone exibido no rodapé e página de contato. Formato: (11) 99999-9999"
          />
        <Input
          id="contact_phone"
          value={formData.contact_phone || ""}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
        </div>
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="contact_whatsapp" 
            label="WhatsApp" 
            tooltip="Número para botão flutuante de WhatsApp. Formato: 5511999999999 (código país + DDD + número)"
          />
        <Input
          id="contact_whatsapp"
          value={formData.contact_whatsapp || ""}
          onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
          placeholder="5511999999999"
        />
      </div>
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="contact_email" 
          label="Email de Contato" 
          tooltip="Email exibido no rodapé e usado em formulários de contato"
        />
      <Input
        id="contact_email"
        type="email"
        value={formData.contact_email || ""}
        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
        placeholder="contato@exemplo.com.br"
      />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="contact_address" 
          label="Endereço" 
          tooltip="Endereço completo exibido no rodapé do site"
        />
      <Textarea
        id="contact_address"
        value={formData.contact_address || ""}
        onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
        placeholder="Rua Exemplo, 123 - São Paulo, SP"
        rows={2}
      />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="cnpj" 
            label="CNPJ" 
            tooltip="CNPJ da empresa exibido no rodapé (apenas informativo)"
          />
        <Input
          id="cnpj"
          value={formData.cnpj || ""}
          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          placeholder="00.000.000/0000-00"
        />
        </div>
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="razao_social" 
            label="Razão Social" 
            tooltip="Nome legal da empresa exibido no rodapé"
          />
        <Input
          id="razao_social"
          value={formData.razao_social || ""}
          onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
          placeholder="Nome da Empresa LTDA"
        />
      </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Redes Sociais</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="social_instagram" 
              label="Instagram" 
              tooltip="URL do perfil no Instagram. Aparece como ícone no rodapé"
            />
          <Input
            id="social_instagram"
            value={formData.social_instagram || ""}
            onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
            placeholder="https://instagram.com/usuario"
          />
          </div>
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="social_facebook" 
              label="Facebook" 
              tooltip="URL da página no Facebook. Aparece como ícone no rodapé"
            />
          <Input
            id="social_facebook"
            value={formData.social_facebook || ""}
            onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
            placeholder="https://facebook.com/pagina"
          />
          </div>
        </div>
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="social_linkedin" 
            label="LinkedIn" 
            tooltip="URL da página no LinkedIn. Aparece como ícone no rodapé"
          />
        <Input
          id="social_linkedin"
          value={formData.social_linkedin || ""}
          onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
          placeholder="https://linkedin.com/company/empresa"
          />
        </div>
      </div>
    </div>
  </TooltipProvider>
);

export const FooterConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <TooltipProvider>
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-semibold">Cores do Footer - Modo Claro</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="footer_bg_color_light" 
              label="Cor de Fundo" 
              tooltip="Cor de fundo do rodapé quando o tema claro está ativo"
            />
          <div className="flex gap-2">
            <Input
              id="footer_bg_color_light"
              type="color"
              value={formData.footer_bg_color_light || "#ffffff"}
              onChange={(e) => setFormData({ ...formData, footer_bg_color_light: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.footer_bg_color_light || "#ffffff"}
              onChange={(e) => setFormData({ ...formData, footer_bg_color_light: e.target.value })}
              placeholder="#ffffff"
            />
            </div>
          </div>
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="footer_text_color_light" 
              label="Cor do Texto" 
              tooltip="Cor do texto e ícones no rodapé no tema claro"
            />
          <div className="flex gap-2">
            <Input
              id="footer_text_color_light"
              type="color"
              value={formData.footer_text_color_light || "#000000"}
              onChange={(e) => setFormData({ ...formData, footer_text_color_light: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.footer_text_color_light || "#000000"}
              onChange={(e) => setFormData({ ...formData, footer_text_color_light: e.target.value })}
              placeholder="#000000"
            />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Cores do Footer - Modo Escuro</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="footer_bg_color_dark" 
              label="Cor de Fundo" 
              tooltip="Cor de fundo do rodapé quando o tema escuro está ativo"
            />
          <div className="flex gap-2">
            <Input
              id="footer_bg_color_dark"
              type="color"
              value={formData.footer_bg_color_dark || "#1a1a1a"}
              onChange={(e) => setFormData({ ...formData, footer_bg_color_dark: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.footer_bg_color_dark || "#1a1a1a"}
              onChange={(e) => setFormData({ ...formData, footer_bg_color_dark: e.target.value })}
              placeholder="#1a1a1a"
            />
            </div>
          </div>
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="footer_text_color_dark" 
              label="Cor do Texto" 
              tooltip="Cor do texto e ícones no rodapé no tema escuro"
            />
          <div className="flex gap-2">
            <Input
              id="footer_text_color_dark"
              type="color"
              value={formData.footer_text_color_dark || "#ffffff"}
              onChange={(e) => setFormData({ ...formData, footer_text_color_dark: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.footer_text_color_dark || "#ffffff"}
              onChange={(e) => setFormData({ ...formData, footer_text_color_dark: e.target.value })}
              placeholder="#ffffff"
            />
            </div>
          </div>
        </div>
      </div>

      <Card className="p-4 bg-muted">
        <h5 className="font-semibold mb-2">Preview</h5>
        <div 
          className="p-4 rounded"
          style={{
            backgroundColor: formData.footer_bg_color_light || "#ffffff",
            color: formData.footer_text_color_light || "#000000"
          }}
        >
          <p className="text-sm">Footer Preview (Light Mode)</p>
        </div>
      </Card>
    </div>
  </TooltipProvider>
);

export const ModulesConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => {
  const modules = [
    { key: 'blog', label: 'Blog' },
    { key: 'mood_diary', label: 'Diário de Humor' },
    { key: 'ai_assistant', label: 'Assistente IA' },
    { key: 'professionals', label: 'Profissionais' },
    { key: 'appointments', label: 'Agendamentos' }
  ];

  const handleModuleToggle = (moduleKey: string, checked: boolean) => {
    setFormData({
      ...formData,
      modules_enabled: {
        ...(formData.modules_enabled || {}),
        [moduleKey]: checked
      }
    });
  };

  const moduleTooltips: Record<string, string> = {
    blog: "Habilita/desabilita o módulo de blog. Quando desabilitado, remove links do menu e bloqueia acesso às páginas de blog",
    mood_diary: "Habilita/desabilita o diário de humor para pacientes. Remove menu e funcionalidades relacionadas quando desabilitado",
    ai_assistant: "Habilita/desabilita o chat com assistente de IA. Remove botão de acesso quando desabilitado",
    professionals: "Habilita/desabilita listagem e perfis de profissionais. Remove menu 'Profissionais' quando desabilitado",
    appointments: "Habilita/desabilita sistema de agendamento de consultas. Remove funcionalidades de booking quando desabilitado"
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Módulos Habilitados</h4>
          <p className="text-sm text-muted-foreground">
            Controle quais funcionalidades estão disponíveis neste tenant
          </p>
          
          {modules.map(module => (
            <div key={module.key} className="flex items-center space-x-3 p-3 rounded-lg border">
              <Checkbox
                id={`module_${module.key}`}
                checked={formData.modules_enabled?.[module.key] !== false}
                onCheckedChange={(checked) => handleModuleToggle(module.key, checked as boolean)}
              />
              <Label htmlFor={`module_${module.key}`} className="cursor-pointer flex-1">
                {module.label}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{moduleTooltips[module.key]}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export const CTAConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <TooltipProvider>
    <div className="space-y-6">
      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="cta_primary_text" 
          label="Texto do CTA Primário" 
          tooltip="Texto do botão principal no header e CTAs primários em toda aplicação. Ex: 'Agendar Consulta', 'Encontrar Psicólogo'"
        />
      <Input
        id="cta_primary_text"
        value={formData.cta_primary_text || ""}
        onChange={(e) => setFormData({ ...formData, cta_primary_text: e.target.value })}
          placeholder="Encontrar Psicólogo"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="cta_secondary_text" 
          label="Texto do CTA Secundário" 
          tooltip="Texto de botões secundários e links de ação. Ex: 'Saiba Mais', 'Ver Detalhes'"
        />
      <Input
        id="cta_secondary_text"
        value={formData.cta_secondary_text || ""}
        onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
          placeholder="Saiba Mais"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="hero_cta_text" 
          label="Texto do CTA Hero" 
          tooltip="Texto do botão de destaque no banner principal da página inicial"
        />
      <Input
        id="hero_cta_text"
        value={formData.hero_cta_text || ""}
        onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
          placeholder="Comece Agora"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="welcome_message" 
          label="Mensagem de Boas-Vindas" 
          tooltip="Mensagem exibida no primeiro login do usuário ou modal de boas-vindas"
        />
      <Textarea
        id="welcome_message"
        value={formData.welcome_message || ""}
        onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
          placeholder="Bem-vindo ao nosso sistema!"
          rows={3}
          />
      </div>
    </div>
  </TooltipProvider>
);

export const TypographyConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <TooltipProvider>
    <div className="space-y-6">
      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="font_family_headings" 
          label="Fonte dos Títulos" 
          tooltip="Fonte aplicada em todos os títulos (h1, h2, h3, etc). Use fontes do Google Fonts. Ex: 'Playfair Display', serif"
        />
      <Input
        id="font_family_headings"
        value={formData.font_family_headings || ""}
        onChange={(e) => setFormData({ ...formData, font_family_headings: e.target.value })}
          placeholder="'Playfair Display', serif"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="font_family_body" 
          label="Fonte do Corpo" 
          tooltip="Fonte aplicada em todo texto do corpo, parágrafos e labels. Ex: 'Inter', sans-serif"
        />
      <Input
        id="font_family_body"
        value={formData.font_family_body || ""}
        onChange={(e) => setFormData({ ...formData, font_family_body: e.target.value })}
          placeholder="'Inter', sans-serif"
          />
      </div>

      <Card className="p-4 bg-muted">
        <h5 className="font-semibold mb-4" style={{ fontFamily: formData.font_family_headings || 'inherit' }}>
          Preview do Título
        </h5>
        <p style={{ fontFamily: formData.font_family_body || 'inherit' }}>
          Este é um exemplo de texto do corpo com a fonte selecionada. Lorem ipsum dolor sit amet.
        </p>
      </Card>
    </div>
  </TooltipProvider>
);

export const SEOConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <TooltipProvider>
    <div className="space-y-6">
      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="meta_keywords" 
          label="Keywords (separadas por vírgula)" 
          tooltip="Palavras-chave para SEO (meta tag). Separe por vírgula. Ex: psicologia, terapia online, saúde emocional"
        />
      <Textarea
        id="meta_keywords"
        value={formData.meta_keywords || ""}
        onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
          placeholder="psicologia, terapia online, saúde emocional"
          rows={2}
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="social_share_image" 
          label="Imagem de Compartilhamento Social" 
          tooltip="Imagem exibida ao compartilhar links nas redes sociais (Open Graph). Recomendado: 1200x630px"
        />
      <Input
        id="social_share_image"
        value={formData.social_share_image || ""}
        onChange={(e) => setFormData({ ...formData, social_share_image: e.target.value })}
          placeholder="https://exemplo.com/og-image.jpg"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="google_analytics_id" 
          label="Google Analytics ID" 
          tooltip="ID do Google Analytics para rastreamento de visitantes. Formato: G-XXXXXXXXXX"
        />
      <Input
        id="google_analytics_id"
        value={formData.google_analytics_id || ""}
        onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })}
          placeholder="G-XXXXXXXXXX"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="google_tag_manager_id" 
          label="Google Tag Manager ID" 
          tooltip="ID do Google Tag Manager para gerenciamento de tags. Formato: GTM-XXXXXXX"
        />
      <Input
        id="google_tag_manager_id"
        value={formData.google_tag_manager_id || ""}
        onChange={(e) => setFormData({ ...formData, google_tag_manager_id: e.target.value })}
          placeholder="GTM-XXXXXXX"
          />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="terms_url" 
            label="URL dos Termos de Uso" 
            tooltip="URL da página de termos de uso. Aparece no rodapé. Ex: /termos-de-uso"
          />
        <Input
          id="terms_url"
          value={formData.terms_url || ""}
          onChange={(e) => setFormData({ ...formData, terms_url: e.target.value })}
            placeholder="/termos-de-uso"
            />
        </div>
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="privacy_url" 
            label="URL da Política de Privacidade" 
            tooltip="URL da política de privacidade. Aparece no rodapé. Ex: /privacidade"
          />
        <Input
          id="privacy_url"
          value={formData.privacy_url || ""}
          onChange={(e) => setFormData({ ...formData, privacy_url: e.target.value })}
            placeholder="/privacidade"
            />
        </div>
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="favicon_url" 
          label="Favicon URL" 
          tooltip="URL do ícone do site (favicon). Aparece na aba do navegador. Formato: .png, .ico ou .svg"
        />
        <Input
          id="favicon_url"
          value={formData.favicon_url || ""}
          onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
          placeholder="https://exemplo.com/favicon.ico"
        />
      </div>
    </div>
  </TooltipProvider>
);

export const EmailConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <TooltipProvider>
    <div className="space-y-6">
      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="email_sender_name" 
          label="Nome do Remetente" 
          tooltip="Nome exibido como remetente em emails automáticos enviados pelo sistema"
        />
      <Input
        id="email_sender_name"
        value={formData.email_sender_name || ""}
        onChange={(e) => setFormData({ ...formData, email_sender_name: e.target.value })}
          placeholder="AloPsi"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="email_sender_email" 
          label="Email do Remetente" 
          tooltip="Endereço de email usado como remetente em notificações automáticas"
        />
      <Input
        id="email_sender_email"
          type="email"
          value={formData.email_sender_email || ""}
          onChange={(e) => setFormData({ ...formData, email_sender_email: e.target.value })}
          placeholder="contato@exemplo.com.br"
          />
      </div>

      <div className="space-y-2">
        <LabelWithTooltip 
          htmlFor="email_support_email" 
          label="Email de Suporte" 
          tooltip="Email exibido para contato de suporte. Aparece em rodapé e emails"
        />
      <Input
        id="email_support_email"
          type="email"
          value={formData.email_support_email || ""}
          onChange={(e) => setFormData({ ...formData, email_support_email: e.target.value })}
          placeholder="suporte@exemplo.com.br"
          />
      </div>
    </div>
  </TooltipProvider>
);

export const BookingConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <TooltipProvider>
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="booking_min_hours_notice" 
            label="Antecedência Mínima (horas)" 
            tooltip="Horas mínimas necessárias entre agendamento e consulta. Ex: 24 = agendamento com 1 dia de antecedência"
          />
        <Input
          id="booking_min_hours_notice"
          type="number"
            value={formData.booking_min_hours_notice || 24}
            onChange={(e) => setFormData({ ...formData, booking_min_hours_notice: parseInt(e.target.value) })}
            min="1"
            />
        </div>

        <div className="space-y-2">
          <LabelWithTooltip 
            htmlFor="booking_max_days_ahead" 
            label="Dias Máximo de Antecedência" 
            tooltip="Quantos dias no futuro o usuário pode agendar. Ex: 30 = pode agendar até daqui 1 mês"
          />
        <Input
          id="booking_max_days_ahead"
          type="number"
            value={formData.booking_max_days_ahead || 30}
            onChange={(e) => setFormData({ ...formData, booking_max_days_ahead: parseInt(e.target.value) })}
            min="1"
            />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Métodos de Pagamento</h4>
        <div className="flex items-center space-x-3 p-3 rounded-lg border">
          <Checkbox
            id="payment_mercadopago"
            checked={formData.payment_methods?.mercadopago !== false}
            onCheckedChange={(checked) => setFormData({
              ...formData,
              payment_methods: { ...formData.payment_methods, mercadopago: checked }
            })}
          />
          <Label htmlFor="payment_mercadopago" className="cursor-pointer flex-1">
            Mercado Pago
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Habilita pagamento via Mercado Pago no processo de agendamento</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-lg border">
          <Checkbox
            id="payment_stripe"
            checked={formData.payment_methods?.stripe === true}
            onCheckedChange={(checked) => setFormData({
              ...formData,
              payment_methods: { ...formData.payment_methods, stripe: checked }
            })}
          />
          <Label htmlFor="payment_stripe" className="cursor-pointer flex-1">
            Stripe
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Habilita pagamento via Stripe no processo de agendamento</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  </TooltipProvider>
);
