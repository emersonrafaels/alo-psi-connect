import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getBccEmails } from "../_shared/get-bcc-emails.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-CANCEL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting auto-cancellation process");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get appointments that are pending payment and older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: appointmentsToCancel, error: fetchError } = await supabaseClient
      .from('agendamentos')
      .select(`
        id,
        nome_paciente,
        email_paciente,
        data_consulta,
        horario,
        created_at,
        mercado_pago_preference_id,
        profissionais:professional_id (
          display_name,
          profissao
        )
      `)
      .eq('status', 'pendente')
      .eq('payment_status', 'pending_payment')
      .lt('created_at', twentyFourHoursAgo);

    if (fetchError) {
      logStep("Error fetching appointments", { error: fetchError });
      throw fetchError;
    }

    logStep("Found appointments to cancel", { count: appointmentsToCancel?.length || 0 });

    if (!appointmentsToCancel || appointmentsToCancel.length === 0) {
      logStep("No appointments to cancel");
      return new Response(JSON.stringify({ 
        message: "No appointments to cancel",
        cancelled_count: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Cancel each appointment and send notification email
    const cancelResults = await Promise.all(
      appointmentsToCancel.map(async (appointment) => {
        try {
          // Update appointment status to cancelled
          const { error: updateError } = await supabaseClient
            .from('agendamentos')
            .update({ 
              status: 'cancelado',
              payment_status: 'failed',
              observacoes: `Cancelado automaticamente por falta de pagamento após 24h. Cancelado em: ${new Date().toISOString()}`
            })
            .eq('id', appointment.id);

          if (updateError) {
            logStep("Error updating appointment", { appointmentId: appointment.id, error: updateError });
            return { success: false, appointmentId: appointment.id, error: updateError };
          }

          // Send cancellation email
          try {
            const professionalName = (appointment.profissionais as any)?.display_name || 'Profissional';
            const appointmentDate = new Date(appointment.data_consulta).toLocaleDateString('pt-BR');
            const appointmentTime = appointment.horario;

            await resend.emails.send({
              from: "Agendamentos <noreply@redebemestar.com.br>",
              to: [appointment.email_paciente],
              subject: "Agendamento Cancelado - Falta de Pagamento",
              html: `
                <h2>Agendamento Cancelado</h2>
                <p>Olá ${appointment.nome_paciente},</p>
                <p>Seu agendamento foi cancelado automaticamente devido à falta de pagamento dentro do prazo de 24 horas.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>Detalhes do Agendamento Cancelado:</h3>
                  <p><strong>Profissional:</strong> ${professionalName}</p>
                  <p><strong>Data:</strong> ${appointmentDate}</p>
                  <p><strong>Horário:</strong> ${appointmentTime}</p>
                </div>
                
                <p>Você pode fazer um novo agendamento a qualquer momento através do nosso site.</p>
                <p>Em caso de dúvidas, entre em contato conosco.</p>
                
                <p>Atenciosamente,<br>Equipe de Agendamentos</p>
              `,
            });

            logStep("Email sent successfully", { appointmentId: appointment.id, email: appointment.email_paciente });
          } catch (emailError) {
            logStep("Error sending email", { appointmentId: appointment.id, error: emailError });
            // Don't fail the cancellation if email fails
          }

          return { success: true, appointmentId: appointment.id };
        } catch (error) {
          logStep("Error processing appointment", { appointmentId: appointment.id, error });
          return { success: false, appointmentId: appointment.id, error };
        }
      })
    );

    const successCount = cancelResults.filter(result => result.success).length;
    const failureCount = cancelResults.filter(result => !result.success).length;

    logStep("Auto-cancellation completed", { 
      totalProcessed: appointmentsToCancel.length,
      successCount,
      failureCount 
    });

    return new Response(JSON.stringify({
      message: "Auto-cancellation process completed",
      total_processed: appointmentsToCancel.length,
      cancelled_count: successCount,
      failed_count: failureCount,
      results: cancelResults
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in auto-cancel process", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});