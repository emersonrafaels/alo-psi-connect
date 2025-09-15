import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

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

    // Generate unique confirmation token
    const confirmationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    const { error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .insert({
        user_id: user.id,
        email: email,
        token: confirmationToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Error storing confirmation token:', tokenError);
      throw tokenError;
    }

    // Create confirmation URL
    const confirmationUrl = `${Deno.env.get("APP_BASE_URL") || "https://alopsi.com.br"}/confirm-email?token=${confirmationToken}`;

    // Send custom email via Resend
    const emailResponse = await resend.emails.send({
      from: "Alô, Psi <noreply@alopsi.com.br>",
      to: [email],
      subject: "Confirme seu email - Alô Psi",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Confirme seu email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Alô, Psi</h1>
                <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Plataforma de Saúde Mental</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Confirme seu email</h2>
                
                <p style="color: #6b7280; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                  Obrigado por se cadastrar na Alô Psi! Para começar a usar nossa plataforma, confirme seu endereço de email clicando no botão abaixo:
                </p>
                
                <!-- Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);">
                    Confirmar Email
                  </a>
                </div>
                
                <p style="color: #9ca3af; margin: 25px 0 0 0; font-size: 14px; line-height: 1.5;">
                  Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                  <a href="${confirmationUrl}" style="color: #6366f1; word-break: break-all;">${confirmationUrl}</a>
                </p>
                
                <p style="color: #9ca3af; margin: 20px 0 0 0; font-size: 14px;">
                  Este link expira em 24 horas por motivos de segurança.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 25px 30px; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                  Se você não solicitou este email, pode ignorá-lo com segurança.
                </p>
                <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 13px;">
                  © 2024 Alô Psi - Todos os direitos reservados
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
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