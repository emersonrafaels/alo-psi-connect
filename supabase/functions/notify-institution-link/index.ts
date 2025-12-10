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

interface NotifyInstitutionLinkRequest {
  userEmail: string;
  userName: string;
  institutionName: string;
  role: 'admin' | 'viewer' | 'student' | 'professional';
  tenantId?: string;
  isNewUser?: boolean;
  temporaryPassword?: string;
}

function generateInstitutionLinkEmailHTML(
  tenantName: string,
  tenantColor: string,
  tenantLogo: string | null,
  userName: string,
  userEmail: string,
  institutionName: string,
  role: string,
  homepageUrl: string,
  loginUrl: string,
  isNewUser: boolean = false,
  temporaryPassword?: string
): string {
  const primaryColor = tenantColor.startsWith('#') ? tenantColor : `hsl(${tenantColor})`;
  
  let roleLabel = '';
  let permissions = '';
  
  switch(role) {
    case 'admin':
      roleLabel = 'Administrador';
      permissions = `
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li>Gerenciar cupons de desconto</li>
          <li>Visualizar e gerenciar alunos vinculados</li>
          <li>Acessar relatórios e estatísticas</li>
          <li>Gerenciar outros usuários da instituição</li>
        </ul>
      `;
      break;
    case 'viewer':
      roleLabel = 'Visualizador';
      permissions = `
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li>Visualizar cupons disponíveis</li>
          <li>Visualizar alunos vinculados</li>
          <li>Acessar relatórios e estatísticas</li>
        </ul>
      `;
      break;
    case 'student':
      roleLabel = 'Estudante/Paciente';
      permissions = `
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li>Utilizar cupons de desconto exclusivos</li>
          <li>Agendar consultas com profissionais parceiros</li>
          <li>Acessar recursos educacionais da instituição</li>
          <li>Receber ofertas e benefícios especiais</li>
        </ul>
      `;
      break;
    case 'professional':
      roleLabel = 'Profissional Parceiro';
      permissions = `
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li>Receber agendamentos de alunos da instituição</li>
          <li>Visualizar cupons aplicáveis aos seus serviços</li>
          <li>Gerenciar sua agenda e disponibilidade</li>
          <li>Acessar relatórios de atendimentos</li>
        </ul>
      `;
      break;
  }

  // Seção de credenciais para novos usuários
  const credentialsSection = isNewUser && temporaryPassword ? `
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
      <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #92400e;">🔑 Seus dados de acesso:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; color: #4b5563; font-size: 14px;">Email:</td>
          <td style="padding: 5px 0; font-weight: bold; color: #1f2937; font-size: 14px;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #4b5563; font-size: 14px;">Senha:</td>
          <td style="padding: 5px 0; font-weight: bold; color: #1f2937; font-size: 14px; font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px; text-transform: none; letter-spacing: normal;">${temporaryPassword}</td>
        </tr>
      </table>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #92400e;">
        ⚠️ Por segurança, recomendamos que você altere sua senha após o primeiro acesso.
      </p>
    </div>
  ` : '';

  // Dica para usuários existentes (não mostra se for novo usuário com credenciais)
  const loginTipSection = !isNewUser ? `
    <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 4px solid #0284c7; margin: 30px 0;">
      <p style="margin: 0; font-size: 14px; color: #075985;">
        <strong>💡 Dica:</strong> Faça login na plataforma com o mesmo email (${userEmail}) para acessar o portal institucional.
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vinculado à ${institutionName} - ${tenantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 40px 20px; text-align: center;">
            ${tenantLogo 
              ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;" />` 
              : `<h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${tenantName}</h1>`
            }
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Portal Institucional</p>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: ${primaryColor}; margin: 0 0 20px 0; font-size: 24px;">🎓 Você foi vinculado a uma instituição!</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">Olá, <strong>${userName}</strong>!</p>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">
              Você foi adicionado como <strong>${roleLabel}</strong> da instituição <strong>${institutionName}</strong> na plataforma ${tenantName}.
            </p>
            
            ${credentialsSection}
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid ${primaryColor};">
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #4b5563; font-weight: bold;">📋 Como ${roleLabel}, você pode:</p>
              ${permissions}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="display: inline-block; background: ${primaryColor}; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); margin-right: 10px;">🔑 Fazer Login</a>
              <a href="${homepageUrl}" style="display: inline-block; background: transparent; color: ${primaryColor}; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; border: 2px solid ${primaryColor};">🌐 Conhecer a Plataforma</a>
            </div>
            
            <p style="margin: 15px 0; font-size: 13px; color: #6b7280; text-align: center;">
              📌 Após fazer login, acesse o <strong>Portal Institucional</strong> pelo menu do usuário.
            </p>
            
            ${loginTipSection}
            
            <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">Se você não esperava esta mensagem ou tem dúvidas, entre em contato com a administração da instituição.</p>
            <div style="border-top: 2px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                Atenciosamente,<br>
                <strong style="color: ${primaryColor};">Equipe ${tenantName}</strong>
              </p>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Este é um email automático, por favor não responda.<br>
              © ${new Date().getFullYear()} ${tenantName}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userEmail, 
      userName, 
      institutionName, 
      role, 
      tenantId,
      isNewUser = false,
      temporaryPassword
    }: NotifyInstitutionLinkRequest = await req.json();

    console.log('📧 Enviando notificação de vínculo institucional:', {
      userEmail,
      userName,
      institutionName,
      role,
      tenantId,
      isNewUser,
      hasPassword: !!temporaryPassword
    });

    // Buscar dados do tenant
    let tenantName = 'Alopsi';
    let tenantColor = '#8B5CF6';
    let tenantLogo: string | null = null;
    let tenantSlug = 'alopsi';

    if (tenantId) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('name, primary_color, logo_url, slug')
        .eq('id', tenantId)
        .single();

      if (!tenantError && tenant) {
        tenantName = tenant.name;
        tenantColor = tenant.primary_color || tenantColor;
        tenantLogo = tenant.logo_url;
        tenantSlug = tenant.slug;
      }
    }

    // URL base
    const baseUrl = Deno.env.get("APP_BASE_URL") || "https://alopsi.com.br";
    
    // URL de login baseada no tenant
    const loginUrl = tenantSlug === 'alopsi' 
      ? `${baseUrl}/auth`
      : `${baseUrl}/${tenantSlug}/auth`;
    
    // URL da homepage do tenant
    const homepageUrl = tenantSlug === 'alopsi' 
      ? baseUrl
      : `${baseUrl}/${tenantSlug}`;

    // Gerar HTML do email
    const emailHtml = generateInstitutionLinkEmailHTML(
      tenantName,
      tenantColor,
      tenantLogo,
      userName,
      userEmail,
      institutionName,
      role,
      homepageUrl,
      loginUrl,
      isNewUser,
      temporaryPassword
    );

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: `${tenantName} <noreply@redebemestar.com.br>`,
      to: [userEmail],
      subject: `🎓 Você foi vinculado à ${institutionName}`,
      html: emailHtml,
    });

    console.log('✅ Email enviado com sucesso:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao enviar email de notificação:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
