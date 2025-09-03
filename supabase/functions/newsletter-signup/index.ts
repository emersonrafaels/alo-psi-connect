import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterSignupRequest {
  email: string;
  nome?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome }: NewsletterSignupRequest = await req.json();

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

    // Send welcome email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    try {
      const emailResponse = await resend.emails.send({
        from: "Alopsi <alopsi.host@gmail.com>",
        to: [email],
        subject: "Bem-vindo(a) ao Newsletter da Alopsi!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">Bem-vindo(a) ao Newsletter da Alopsi!</h1>
              <p style="color: #666; font-size: 16px;">Obrigado por se inscrever em nosso newsletter</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #1e293b; margin-bottom: 15px;">O que você receberá:</h2>
              <ul style="color: #475569; line-height: 1.6;">
                <li>Dicas de saúde mental e bem-estar</li>
                <li>Informações sobre nossos profissionais</li>
                <li>Novidades sobre serviços e tratamentos</li>
                <li>Conteúdo exclusivo para assinantes</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <p style="color: #666; margin-bottom: 20px;">
                ${nome ? `Olá, ${nome}! ` : ''}Estamos felizes em tê-lo(a) conosco.
              </p>
              <a href="https://www.instagram.com/medcos_br/" 
                 style="background: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Siga-nos no Instagram
              </a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px;">
                Alopsi - Cuidando da sua saúde mental<br>
                R. Joaquim Távora, 1240 - Vila Mariana, São Paulo - SP
              </p>
            </div>
          </div>
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
        from: "Newsletter Alopsi <alopsi.host@gmail.com>",
        to: ["alopsi.host@gmail.com"],
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