import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const MEDCOS_ADMIN_EMAIL = 'medcos.host@gmail.com';
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SuggestThemeRequest {
  email: string;
  nome?: string;
  tema: string;
  descricao?: string;
  tenantId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome, tema, descricao, tenantId }: SuggestThemeRequest = await req.json();

    console.log("[suggest-session-theme] Processing suggestion:", { email, tema, tenantId });

    // Validate input
    if (!email || !tema || !tenantId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email, tema e tenant são obrigatórios" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("name, admin_email, logo_url, primary_color")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error("[suggest-session-theme] Tenant fetch error:", tenantError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro ao buscar informações do tenant" 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Save suggestion to database
    const { error: insertError } = await supabase
      .from("group_session_theme_suggestions")
      .insert({
        email,
        nome: nome || null,
        tema,
        descricao: descricao || null,
        tenant_id: tenantId,
        status: "pending"
      });

    if (insertError) {
      console.error("[suggest-session-theme] Database insert error:", insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro ao salvar sugestão" 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send confirmation email to user
    try {
      await resend.emails.send({
        from: `${tenant.name} <${tenant.admin_email}>`,
        to: [email],
        subject: `Sua sugestão foi recebida - ${tenant.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${tenant.logo_url ? `<img src="${tenant.logo_url}" alt="${tenant.name}" style="width: 150px; margin-bottom: 20px;">` : ''}
            <h1 style="color: ${tenant.primary_color || '#4338ca'};">Obrigado pela sua sugestão!</h1>
            <p>Olá${nome ? ` ${nome}` : ''},</p>
            <p>Recebemos sua sugestão de tema para um encontro em grupo:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Tema sugerido:</strong> ${tema}</p>
              ${descricao ? `<p style="margin: 10px 0 0 0;"><strong>Descrição:</strong> ${descricao}</p>` : ''}
            </div>
            <p>Sua sugestão está sendo analisada pela nossa equipe e em breve poderemos incluí-la em nossa programação de encontros.</p>
            <p>Fique atento ao seu email para receber notificações sobre nossos próximos encontros!</p>
            <p>Atenciosamente,<br><strong>${tenant.name}</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[suggest-session-theme] User email error:", emailError);
    }

    // Send notification to admin
    try {
      const adminEmail = tenant.admin_email || 'alopsi.host@gmail.com';
      await resend.emails.send({
        from: `${tenant.name} <noreply@redebemestar.com.br>`,
        to: [adminEmail],
        cc: adminEmail !== MEDCOS_ADMIN_EMAIL ? [MEDCOS_ADMIN_EMAIL] : [],
        subject: `Nova Sugestão de Tema - Encontros ${tenant.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: ${tenant.primary_color || '#4338ca'};">Nova Sugestão de Tema</h1>
            <p>Uma nova sugestão de tema foi recebida:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>De:</strong> ${nome || 'Não informado'} (${email})</p>
              <p style="margin: 10px 0 0 0;"><strong>Tema:</strong> ${tema}</p>
              ${descricao ? `<p style="margin: 10px 0 0 0;"><strong>Descrição:</strong> ${descricao}</p>` : ''}
              <p style="margin: 10px 0 0 0;"><strong>Tenant:</strong> ${tenant.name}</p>
            </div>
            <p>Acesse o painel administrativo para gerenciar esta sugestão.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[suggest-session-theme] Admin email error:", emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Sugestão enviada com sucesso! Obrigado por contribuir." 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[suggest-session-theme] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Erro inesperado ao processar sugestão" 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
