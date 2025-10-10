import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

interface TenantConfigTabsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const ContactConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="contact_phone">Telefone</Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone || ""}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_whatsapp">WhatsApp</Label>
        <Input
          id="contact_whatsapp"
          value={formData.contact_whatsapp || ""}
          onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
          placeholder="5511999999999"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="contact_email">Email de Contato</Label>
      <Input
        id="contact_email"
        type="email"
        value={formData.contact_email || ""}
        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
        placeholder="contato@exemplo.com.br"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="contact_address">Endereço</Label>
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
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          value={formData.cnpj || ""}
          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          placeholder="00.000.000/0000-00"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="razao_social">Razão Social</Label>
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
          <Label htmlFor="social_instagram">Instagram</Label>
          <Input
            id="social_instagram"
            value={formData.social_instagram || ""}
            onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
            placeholder="https://instagram.com/usuario"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="social_facebook">Facebook</Label>
          <Input
            id="social_facebook"
            value={formData.social_facebook || ""}
            onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
            placeholder="https://facebook.com/pagina"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="social_linkedin">LinkedIn</Label>
        <Input
          id="social_linkedin"
          value={formData.social_linkedin || ""}
          onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
          placeholder="https://linkedin.com/company/empresa"
        />
      </div>
    </div>
  </div>
);

export const FooterConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <h4 className="font-semibold">Cores do Footer - Modo Claro</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="footer_bg_color_light">Cor de Fundo</Label>
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
          <Label htmlFor="footer_text_color_light">Cor do Texto</Label>
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
          <Label htmlFor="footer_bg_color_dark">Cor de Fundo</Label>
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
          <Label htmlFor="footer_text_color_dark">Cor do Texto</Label>
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

  return (
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
          </div>
        ))}
      </div>
    </div>
  );
};

export const CTAConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="cta_primary_text">Texto do CTA Primário</Label>
      <Input
        id="cta_primary_text"
        value={formData.cta_primary_text || ""}
        onChange={(e) => setFormData({ ...formData, cta_primary_text: e.target.value })}
        placeholder="Encontrar Psicólogo"
      />
      <p className="text-xs text-muted-foreground">Usado no header e botões principais</p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="cta_secondary_text">Texto do CTA Secundário</Label>
      <Input
        id="cta_secondary_text"
        value={formData.cta_secondary_text || ""}
        onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
        placeholder="Saiba Mais"
      />
      <p className="text-xs text-muted-foreground">Usado em botões secundários</p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="hero_cta_text">Texto do CTA Hero</Label>
      <Input
        id="hero_cta_text"
        value={formData.hero_cta_text || ""}
        onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
        placeholder="Comece Agora"
      />
      <p className="text-xs text-muted-foreground">Usado no banner principal da home</p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="welcome_message">Mensagem de Boas-Vindas</Label>
      <Textarea
        id="welcome_message"
        value={formData.welcome_message || ""}
        onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
        placeholder="Bem-vindo ao nosso sistema!"
        rows={3}
      />
    </div>
  </div>
);

export const TypographyConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="font_family_headings">Fonte dos Títulos</Label>
      <Input
        id="font_family_headings"
        value={formData.font_family_headings || ""}
        onChange={(e) => setFormData({ ...formData, font_family_headings: e.target.value })}
        placeholder="'Playfair Display', serif"
      />
      <p className="text-xs text-muted-foreground">
        Use fontes do Google Fonts (ex: 'Roboto', sans-serif)
      </p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="font_family_body">Fonte do Corpo</Label>
      <Input
        id="font_family_body"
        value={formData.font_family_body || ""}
        onChange={(e) => setFormData({ ...formData, font_family_body: e.target.value })}
        placeholder="'Inter', sans-serif"
      />
      <p className="text-xs text-muted-foreground">
        Fonte usada no texto geral do site
      </p>
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
);

export const SEOConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="meta_keywords">Keywords (separadas por vírgula)</Label>
      <Textarea
        id="meta_keywords"
        value={formData.meta_keywords || ""}
        onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
        placeholder="psicologia, terapia online, saúde mental"
        rows={2}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="social_share_image">Imagem de Compartilhamento Social</Label>
      <Input
        id="social_share_image"
        value={formData.social_share_image || ""}
        onChange={(e) => setFormData({ ...formData, social_share_image: e.target.value })}
        placeholder="https://exemplo.com/og-image.jpg"
      />
      <p className="text-xs text-muted-foreground">
        Imagem exibida ao compartilhar nas redes sociais (1200x630px)
      </p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
      <Input
        id="google_analytics_id"
        value={formData.google_analytics_id || ""}
        onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })}
        placeholder="G-XXXXXXXXXX"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
      <Input
        id="google_tag_manager_id"
        value={formData.google_tag_manager_id || ""}
        onChange={(e) => setFormData({ ...formData, google_tag_manager_id: e.target.value })}
        placeholder="GTM-XXXXXXX"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="terms_url">URL dos Termos de Uso</Label>
        <Input
          id="terms_url"
          value={formData.terms_url || ""}
          onChange={(e) => setFormData({ ...formData, terms_url: e.target.value })}
          placeholder="/termos-de-uso"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="privacy_url">URL da Política de Privacidade</Label>
        <Input
          id="privacy_url"
          value={formData.privacy_url || ""}
          onChange={(e) => setFormData({ ...formData, privacy_url: e.target.value })}
          placeholder="/privacidade"
        />
      </div>
    </div>
  </div>
);

export const EmailConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="email_sender_name">Nome do Remetente</Label>
      <Input
        id="email_sender_name"
        value={formData.email_sender_name || ""}
        onChange={(e) => setFormData({ ...formData, email_sender_name: e.target.value })}
        placeholder="AloPsi"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="email_sender_email">Email do Remetente</Label>
      <Input
        id="email_sender_email"
        type="email"
        value={formData.email_sender_email || ""}
        onChange={(e) => setFormData({ ...formData, email_sender_email: e.target.value })}
        placeholder="contato@exemplo.com.br"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="email_support_email">Email de Suporte</Label>
      <Input
        id="email_support_email"
        type="email"
        value={formData.email_support_email || ""}
        onChange={(e) => setFormData({ ...formData, email_support_email: e.target.value })}
        placeholder="suporte@exemplo.com.br"
      />
    </div>
  </div>
);

export const BookingConfigTab = ({ formData, setFormData }: TenantConfigTabsProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="booking_min_hours_notice">Antecedência Mínima (horas)</Label>
        <Input
          id="booking_min_hours_notice"
          type="number"
          value={formData.booking_min_hours_notice || 24}
          onChange={(e) => setFormData({ ...formData, booking_min_hours_notice: parseInt(e.target.value) })}
          min="1"
        />
        <p className="text-xs text-muted-foreground">
          Horas mínimas de antecedência para agendamento
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking_max_days_ahead">Dias Máximo de Antecedência</Label>
        <Input
          id="booking_max_days_ahead"
          type="number"
          value={formData.booking_max_days_ahead || 30}
          onChange={(e) => setFormData({ ...formData, booking_max_days_ahead: parseInt(e.target.value) })}
          min="1"
        />
        <p className="text-xs text-muted-foreground">
          Quantos dias à frente o usuário pode agendar
        </p>
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
        <Label htmlFor="payment_mercadopago" className="cursor-pointer">
          Mercado Pago
        </Label>
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
        <Label htmlFor="payment_stripe" className="cursor-pointer">
          Stripe
        </Label>
      </div>
    </div>
  </div>
);
