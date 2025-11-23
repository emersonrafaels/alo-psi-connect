import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  emailType: string;
  recipientEmail: string;
  tenantId: string;
  variables: Record<string, any>;
  customHtml?: string;
}

// Default email templates
const emailTemplates: Record<string, (vars: any) => { subject: string; html: string }> = {
  confirmation_patient: (vars) => ({
    subject: `[TESTE] Confirme seu email - ${vars.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
            <div style="background: ${vars.tenantColor}; padding: 40px 20px; text-align: center;">
              ${vars.tenantLogo ? `<img src="${vars.tenantLogo}" alt="${vars.tenantName}" style="max-width: 200px;">` : `<h1 style="color: white; margin: 0;">${vars.tenantName}</h1>`}
            </div>
            <div style="padding: 40px 20px;">
              <h2>Olá, ${vars.recipientName}!</h2>
              <p>Bem-vindo à ${vars.tenantName}! Para confirmar seu cadastro, clique no botão abaixo:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${vars.confirmationUrl}" style="display: inline-block; background: ${vars.tenantColor}; color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Confirmar Email
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Se você não solicitou este cadastro, ignore este email.</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Enviado por <strong>${vars.tenantName}</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  password_reset: (vars) => ({
    subject: `[TESTE] Redefinir senha - ${vars.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px;">
            <div style="background: ${vars.tenantColor}; padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Redefinir Senha</h1>
            </div>
            <div style="padding: 40px 20px;">
              <p>Olá, ${vars.recipientName}!</p>
              <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${vars.resetUrl}" style="display: inline-block; background: ${vars.tenantColor}; color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Redefinir Senha
                </a>
              </div>
              <p style="color: #ef4444; font-size: 14px;">Este link expira em 1 hora.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),
  
  appointment_notification: (vars) => ({
    subject: `[TESTE] Confirmação de Agendamento - ${vars.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px;">
            <div style="background: ${vars.tenantColor}; padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Agendamento Confirmado</h1>
            </div>
            <div style="padding: 40px 20px;">
              <p>Olá, ${vars.recipientName}!</p>
              <p>Seu agendamento foi confirmado com sucesso:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Profissional:</strong> ${vars.professionalName}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> ${vars.appointmentDate}</p>
                <p style="margin: 5px 0;"><strong>Horário:</strong> ${vars.appointmentTime}</p>
                <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${vars.appointmentPrice}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  newsletter_confirmation: (vars) => ({
    subject: `[TESTE] Confirmação de Newsletter - ${vars.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px;">
            <div style="padding: 40px 20px;">
              <h2>Obrigado por se inscrever, ${vars.recipientName}!</h2>
              <p>Você agora faz parte da nossa newsletter e receberá conteúdos exclusivos da ${vars.tenantName}.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }),

  institution_link_request: (vars) => ({
    subject: `[TESTE] Solicitação de Vínculo Institucional - ${vars.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px;">
            <div style="padding: 40px 20px;">
              <h2>Nova Solicitação de Vínculo</h2>
              <p><strong>${vars.recipientName}</strong> solicitou vínculo com a instituição <strong>${vars.institutionName}</strong>.</p>
              <p><strong>Mensagem:</strong> ${vars.requestMessage || 'Nenhuma mensagem adicional.'}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${vars.portalUrl}" style="display: inline-block; background: ${vars.tenantColor}; color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Revisar Solicitação
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  })
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // First, verify user with their JWT token using anon key
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { authorization: authHeader }
      }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is super_admin
    const { data: roles } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['super_admin']);

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized - Super admin only");
    }

    // Now use service role key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { emailType, recipientEmail, tenantId, variables, customHtml }: TestEmailRequest = await req.json();

    // Validate required fields
    if (!emailType || !recipientEmail || !tenantId) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error("Invalid email format");
    }

    // Fetch tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error("Tenant not found");
    }

    // Merge tenant data into variables
    const emailVariables = {
      tenantName: tenant.name,
      tenantColor: tenant.primary_color || '#0ea5e9',
      tenantLogo: tenant.logo_url,
      recipientEmail,
      ...variables
    };

    // Generate email content
    let emailContent;
    if (customHtml) {
      // Use custom HTML
      emailContent = {
        subject: `[TESTE] ${emailType} - ${tenant.name}`,
        html: customHtml
      };
    } else if (emailTemplates[emailType]) {
      // Use default template
      emailContent = emailTemplates[emailType](emailVariables);
    } else {
      throw new Error(`Unknown email type: ${emailType}`);
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `${tenant.name} <noreply@redebemestar.com.br>`,
      to: [recipientEmail],
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log('[Send Test Email] Email sent:', emailResponse);

    // Log the test
    const { error: logError } = await supabase
      .from('email_test_logs')
      .insert({
        tested_by: user.id,
        email_type: emailType,
        recipient_email: recipientEmail,
        tenant_id: tenantId,
        variables: emailVariables,
        custom_html: customHtml || null,
        resend_email_id: emailResponse.data?.id || null,
        status: 'sent',
        error_message: null
      });

    if (logError) {
      console.error('[Send Test Email] Error logging:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
        message: 'Test email sent successfully'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('[Send Test Email] Error:', error);

    // Try to log failed attempt
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          global: { headers: { authorization: authHeader } }
        });
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const body = await req.json();
          await supabase.from('email_test_logs').insert({
            tested_by: user.id,
            email_type: body.emailType || 'unknown',
            recipient_email: body.recipientEmail || 'unknown',
            tenant_id: body.tenantId || null,
            variables: body.variables || {},
            custom_html: body.customHtml || null,
            status: 'failed',
            error_message: error.message
          });
        }
      }
    } catch (logError) {
      console.error('[Send Test Email] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);
