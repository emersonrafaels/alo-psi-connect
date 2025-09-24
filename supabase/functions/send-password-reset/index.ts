import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Password reset request received");
    
    const { email }: PasswordResetRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error("Error checking user:", userError);
      throw userError;
    }

    const userExists = userData.users.find(user => user.email === email);
    if (!userExists) {
      // Por segurança, retornamos sucesso mesmo se o usuário não existir
      return new Response(
        JSON.stringify({ message: "Se o email existir, você receberá instruções de recuperação." }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Gerar token de recuperação
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token no banco
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userExists.id,
        token,
        email,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error("Error saving reset token:", tokenError);
      throw tokenError;
    }

    // Criar link de recuperação
    const baseUrl = Deno.env.get("APP_BASE_URL") || "https://alopsi.com.br";
    const resetLink = `${baseUrl}/auth?reset=true&token=${token}`;

    // Enviar email com template personalizado
    const emailResponse = await resend.emails.send({
      from: "Alô, Psi <noreply@alopsi.com.br>",
      to: [email],
      subject: "Recuperação de senha - Alô, Psi",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de senha</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Alô, Psi</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Conectando você ao cuidado mental</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 20px;">
                <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">Recuperação de senha</h2>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">
                  Olá! Recebemos uma solicitação para redefinir a senha da sua conta no Alô, Psi.
                </p>
                
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #4b5563;">
                  Clique no botão abaixo para criar uma nova senha:
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);">
                    Redefinir senha
                  </a>
                </div>
                
                <p style="margin: 30px 0 20px 0; font-size: 14px; color: #6b7280;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:
                </p>
                
                <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #1e40af; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #4b5563; word-break: break-all;">
                    ${resetLink}
                  </p>
                </div>
                
                <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #0891b2; margin: 30px 0;">
                  <p style="margin: 0; font-size: 14px; color: #a16207;">
                    <strong>⚠️ Importante:</strong> Este link expira em 1 hora por segurança.
                  </p>
                </div>
                
                <p style="margin: 30px 0 20px 0; font-size: 14px; color: #6b7280;">
                  Se você não solicitou esta alteração, pode ignorar este email com segurança. Sua senha atual permanecerá inalterada.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                  Enviado com 💙 pela equipe do <strong>Alô, Psi</strong>
                </p>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  Este é um email automático, não responda esta mensagem.
                </p>
              </div>
              
            </div>
          </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Password reset email sent successfully to:", email);

    return new Response(
      JSON.stringify({ 
        message: "Email de recuperação enviado com sucesso!",
        emailId: emailResponse.data?.id 
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
    console.error("Error in send-password-reset function:", error);
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