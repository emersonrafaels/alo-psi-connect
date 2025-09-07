import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MagicLinkRequest {
  email: string;
  agendamentoId?: string;
  type: 'account_creation' | 'appointment_access';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, agendamentoId, type }: MagicLinkRequest = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (type === 'account_creation') {
      // Magic link para criação de conta após pagamento
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: `${supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '')}.vercel.app/auth-callback?type=signup&redirect_to=/profile`
        }
      });

      if (error) throw error;

      const emailResponse = await resend.emails.send({
        from: "Agendamentos <noreply@yourdomain.com>",
        to: [email],
        subject: "✨ Crie sua conta em 1 clique!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🎉 Pagamento aprovado!</h2>
            <p>Seu agendamento foi confirmado com sucesso.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">💡 Crie sua conta para:</h3>
              <ul style="margin: 10px 0;">
                <li>📅 Ver histórico de agendamentos</li>
                <li>📝 Reagendar consultas facilmente</li>
                <li>🧾 Acessar recibos e notas</li>
                <li>⚡ Agendamento mais rápido no futuro</li>
              </ul>
            </div>
            
            <a href="${data.properties?.action_link}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              🚀 Criar minha conta agora
            </a>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Este link é válido por 24 horas e pode ser usado apenas uma vez.
            </p>
          </div>
        `,
      });

      console.log("Account creation magic link sent:", emailResponse);
      
    } else if (type === 'appointment_access' && agendamentoId) {
      // Magic link para acesso específico ao agendamento
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      
      // Salvar token na base de dados
      const { error: tokenError } = await supabase
        .from('agendamento_tokens')
        .insert({
          token,
          agendamento_id: agendamentoId,
          email,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (tokenError) throw tokenError;

      const accessUrl = `${supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '')}.vercel.app/agendamento/${token}`;

      const emailResponse = await resend.emails.send({
        from: "Agendamentos <noreply@yourdomain.com>",
        to: [email],
        subject: "🔗 Acesse seu agendamento",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">📅 Seu Agendamento</h2>
            <p>Acesse os detalhes do seu agendamento através do link abaixo:</p>
            
            <a href="${accessUrl}" 
               style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              📋 Ver meu agendamento
            </a>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                💡 <strong>Dica:</strong> Crie uma conta para gerenciar todos os seus agendamentos em um só lugar!
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Este link é válido por 24 horas. Para mais segurança, ele pode ser usado apenas uma vez.
            </p>
          </div>
        `,
      });

      console.log("Appointment access magic link sent:", emailResponse);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-magic-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);