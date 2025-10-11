import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendConfirmationRequest {
  email: string;
}

// Helper para gerar email HTML dinâmico baseado no tenant
function generateConfirmationEmailHTML(
  tenantName: string,
  tenantColor: string,
  tenantLogo: string | null,
  recipientName: string,
  confirmationUrl: string,
  isProfessional: boolean = false
): string {
  const primaryColor = tenantColor.startsWith('#') ? tenantColor : `hsl(${tenantColor})`;
  const welcomeTitle = isProfessional ? '🎉 Bem-vindo à nossa equipe!' : `Bem-vindo ao ${tenantName}!`;
  const welcomeMessage = isProfessional
    ? `Obrigado por se cadastrar como profissional! Sua conta foi criada com sucesso em nossa plataforma. Estamos muito felizes em tê-lo(a) conosco!`
    : `Obrigado por se cadastrar! Para ativar sua conta, confirme seu email clicando no botão abaixo:`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu email - ${tenantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 40px 20px; text-align: center;">
            ${tenantLogo 
              ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;" />` 
              : `<h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${tenantName}</h1>`
            }
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Conectando você ao cuidado mental</p>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: ${primaryColor}; margin: 0 0 20px 0; font-size: 24px;">${welcomeTitle}</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">Olá, <strong>${recipientName}</strong>!</p>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">${welcomeMessage}</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid ${primaryColor};">
              <p style="margin: 0; font-size: 16px; color: #4b5563;">Para começar a utilizar todos os recursos da plataforma, confirme seu email clicando no botão abaixo:</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px ${primaryColor}33;">✅ Confirmar Email</a>
            </div>
            <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #a16207;"><strong>⏰ Importante:</strong> Este link expira em 24 horas por segurança.</p>
            </div>
            <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">Se você não solicitou este cadastro, pode ignorar este email com segurança.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #6b7280; margin: 0; font-size: 13px;">Enviado com 💙 pela equipe do <strong>${tenantName}</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Email confirmation resend request received");
    
    const { email }: ResendConfirmationRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Check if user exists and get their confirmation status
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar usuário" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error('User not found for email:', email);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { 
          status: 404, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Check if user is already confirmed
    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          message: "Email já confirmado",
          alreadyConfirmed: true 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Detectar tenant do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, nome')
      .eq('user_id', user.id)
      .single();

    let tenantSlug = 'alopsi';
    let tenantData: any = null;

    if (profile?.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, slug, logo_url, primary_color')
        .eq('id', profile.tenant_id)
        .single();

      if (tenant) {
        tenantData = tenant;
        tenantSlug = tenant.slug;
      }
    }

    // Fallback para tenant padrão
    if (!tenantData) {
      const { data: defaultTenant } = await supabase
        .from('tenants')
        .select('id, name, slug, logo_url, primary_color')
        .eq('slug', 'alopsi')
        .single();
      
      tenantData = defaultTenant || {
        name: 'Alô, Psi',
        slug: 'alopsi',
        logo_url: null,
        primary_color: '#1e40af'
      };
    }

    // Generate unique confirmation token
    const confirmationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Invalidate any existing tokens for this user first
    await supabase
      .from('email_confirmation_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // Store new token in database
    const { error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .insert({
        user_id: user.id,
        email: email,
        token: confirmationToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('Error storing confirmation token:', tokenError);
      throw tokenError;
    }

    // Gerar URL de confirmação com prefixo do tenant
    const baseUrl = Deno.env.get("APP_BASE_URL") || "https://alopsi.com.br";
    const tenantPath = tenantSlug === 'medcos' ? '/medcos' : '';
    const confirmationUrl = `${baseUrl}${tenantPath}/auth?confirm=true&token=${confirmationToken}`;
    
    console.log('Generated confirmation URL:', confirmationUrl);

    // Send custom email via Resend
    const emailResponse = await resend.emails.send({
      from: `${tenantData.name} <noreply@alopsi.com.br>`,
      to: [email],
      subject: `Confirme seu email - ${tenantData.name}`,
      html: generateConfirmationEmailHTML(
        tenantData.name,
        tenantData.primary_color,
        tenantData.logo_url,
        profile?.nome || 'Usuário',
        confirmationUrl,
        false
      )
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log('Custom confirmation email sent successfully for:', email);

    return new Response(
      JSON.stringify({ 
        message: "Email de confirmação reenviado com sucesso!" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in resend-email-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor. Tente novamente." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);