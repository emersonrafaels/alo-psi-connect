import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointment_ids } = await req.json();
    
    if (!appointment_ids || !Array.isArray(appointment_ids)) {
      return new Response(
        JSON.stringify({ error: 'appointment_ids array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];
    
    for (const appointmentId of appointment_ids) {
      console.log(`[Generate Meeting Links] Processando agendamento: ${appointmentId}`);
      
      // Buscar dados completos do agendamento
      const { data: appointment, error } = await supabase
        .from('agendamentos')
        .select(`
          id, nome_paciente, email_paciente, telefone_paciente,
          data_consulta, horario, valor, observacoes, tenant_id, professional_id
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        console.error(`[Generate Meeting Links] Erro ao buscar agendamento ${appointmentId}:`, error);
        results.push({ 
          id: appointmentId, 
          success: false, 
          error: 'Agendamento não encontrado' 
        });
        continue;
      }

      console.log(`[Generate Meeting Links] Dados do agendamento:`, {
        id: appointment.id,
        professional_id: appointment.professional_id,
        tenant_id: appointment.tenant_id,
        data_consulta: appointment.data_consulta,
        horario: appointment.horario
      });

      // Buscar profissional separadamente
      const { data: professional, error: profError } = await supabase
        .from('profissionais')
        .select('display_name, user_email, profissao, telefone, tempo_consulta, profile_id')
        .eq('id', appointment.professional_id)
        .single();

      if (profError || !professional) {
        console.error(`[Generate Meeting Links] Erro ao buscar profissional ${appointment.professional_id}:`, profError);
        results.push({ 
          id: appointmentId, 
          success: false, 
          error: 'Profissional não encontrado' 
        });
        continue;
      }

      console.log(`[Generate Meeting Links] Dados do profissional:`, {
        name: professional.display_name,
        email: professional.user_email,
        profile_id: professional.profile_id
      });

      console.log(`[Generate Meeting Links] Chamando create-calendar-event para ${appointmentId}`);
      
      // Chamar create-calendar-event internamente
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/create-calendar-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ 
            agendamento: {
              ...appointment,
              profissionais: professional
            }
          })
        }
      );

      const responseText = await response.text();
      console.log(`[Generate Meeting Links] Resposta do create-calendar-event (status ${response.status}):`, responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Generate Meeting Links] Erro ao parsear resposta:`, parseError);
        results.push({ 
          id: appointmentId, 
          success: false, 
          error: `Resposta inválida do create-calendar-event: ${responseText}` 
        });
        continue;
      }
      
      if (result.success && result.meetLink) {
        console.log(`[Generate Meeting Links] ✅ Link gerado: ${result.meetLink}`);
        
        // Atualizar meeting_link no agendamento
        const { error: updateError } = await supabase
          .from('agendamentos')
          .update({ meeting_link: result.meetLink })
          .eq('id', appointmentId);
          
        if (updateError) {
          console.error(`[Generate Meeting Links] Erro ao atualizar agendamento ${appointmentId}:`, updateError);
          results.push({ 
            id: appointmentId, 
            success: false, 
            error: 'Erro ao salvar link no banco' 
          });
        } else {
          results.push({ 
            id: appointmentId, 
            success: true, 
            meetLink: result.meetLink 
          });
        }
      } else {
        console.error(`[Generate Meeting Links] ❌ Falha ao gerar link para ${appointmentId}:`, result.error);
        results.push({ 
          id: appointmentId, 
          success: false, 
          error: result.error || 'Erro ao gerar link do Meet' 
        });
      }
    }

    console.log(`[Generate Meeting Links] Processamento completo. Sucessos: ${results.filter(r => r.success).length}/${results.length}`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: results.length,
      succeeded: results.filter(r => r.success).length,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Generate Meeting Links] Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
