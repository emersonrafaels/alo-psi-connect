import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const MEDCOS_ADMIN_EMAIL = 'medcos.host@gmail.com';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterSignupRequest {
  email: string;
  nome?: string;
  tenantId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome, tenantId }: NewsletterSignupRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from("newsletter_subscriptions")
      .select("email, ativo")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing subscription:", checkError);
      throw new Error("Erro ao verificar inscrição existente");
    }

    let insertResult;
    if (existing) {
      if (existing.ativo) {
        return new Response(
          JSON.stringify({ 
            message: "Este email já está inscrito no newsletter!",
            already_subscribed: true 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from("newsletter_subscriptions")
          .update({ ativo: true, nome: nome || null })
          .eq("email", email);

        if (updateError) {
          console.error("Error reactivating subscription:", updateError);
          throw new Error("Erro ao reativar inscrição");
        }
      }
    } else {
      // Insert new subscription
      const { error: insertError } = await supabase
        .from("newsletter_subscriptions")
        .insert([{ email, nome: nome || null }]);

      if (insertError) {
        console.error("Error inserting subscription:", insertError);
        throw new Error("Erro ao salvar inscrição");
      }
    }

    // Buscar email administrativo do tenant
    let adminEmail = 'redebemestar1@gmail.com'; // fallback padrão
    let tenantName = 'Rede Bem Estar';

    if (tenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('admin_email, name, slug')
        .eq('id', tenantId)
        .single();
      
      if (tenant?.admin_email) {
        adminEmail = tenant.admin_email;
      }
      if (tenant?.name) {
        tenantName = tenant.name;
        
        // Normalizar nome para MEDCOS em uppercase
        if (tenant?.slug === 'medcos') {
          tenantName = 'MEDCOS';
        }
      }
    }

    // Send welcome email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    try {
      const emailResponse = await resend.emails.send({
        from: "Alô, Psi <noreply@redebemestar.com.br>",
        to: [email],
        subject: "Bem-vindo ao Newsletter - Alô, Psi",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Bem-vindo ao Newsletter Alô Psi</title>
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
                  <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">🎉 Bem-vindo ao Newsletter!</h2>
                  
                  <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">
                    ${nome ? `Olá, ${nome}! ` : ''}Obrigado por se inscrever em nosso newsletter. Estamos felizes em tê-lo(a) conosco!
                  </p>
                  
                  <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #1e40af;">
                    <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📬 O que você receberá:</h3>
                    <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Dicas de saúde mental e bem-estar</li>
                      <li>Informações sobre nossos profissionais</li>
                      <li>Novidades sobre serviços e tratamentos</li>
                      <li>Conteúdo exclusivo para assinantes</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.instagram.com/alopsi.br/" 
                       style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);">
                      📱 Siga-nos no Instagram
                    </a>
                  </div>
                  
                  <div style="background-color: #e0f2fe; padding: 20px; border-radius: 6px; border-left: 4px solid #0891b2; margin: 30px 0;">
                    <p style="margin: 0; font-size: 14px; color: #0f4c5c;">
                      <strong>💡 Dica:</strong> Adicione nosso email (${Deno.env.get("RESEND_FROM_EMAIL") || "noreply@alopsi.com.br"}) aos seus contatos para não perder nenhuma novidade!
                    </p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                    <strong>Alô, Psi</strong> - Cuidando da sua saúde mental
                  </p>
                  <p style="margin: 0 0 15px 0; font-size: 13px; color: #9ca3af;">
                    R. Joaquim Távora, 1240 - Vila Mariana, São Paulo - SP
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    Enviado com 💙 pela equipe do Alô, Psi
                  </p>
                </div>
                
              </div>
            </body>
          </html>
        `,
      });

      console.log("Welcome email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the subscription if email fails
    }

    // Send notification email to admin
    try {
      await resend.emails.send({
        from: `Newsletter ${tenantName} <noreply@redebemestar.com.br>`,
        to: [adminEmail],
        cc: adminEmail !== MEDCOS_ADMIN_EMAIL ? [MEDCOS_ADMIN_EMAIL] : [],
        subject: "Nova inscrição no newsletter",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Nova inscrição no newsletter</h2>
            <p><strong>Email:</strong> ${email}</p>
            ${nome ? `<p><strong>Nome:</strong> ${nome}</p>` : ''}
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        `,
      });
    } catch (notificationError) {
      console.error("Error sending notification email:", notificationError);
    }

    return new Response(
      JSON.stringify({ 
        message: "Inscrição realizada com sucesso! Verifique seu email.",
        success: true 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in newsletter signup:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);