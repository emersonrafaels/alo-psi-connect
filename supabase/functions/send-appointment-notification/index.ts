import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  agendamento: {
    id: string;
    nome_paciente: string;
    email_paciente: string;
    telefone_paciente: string;
    data_consulta: string;
    horario: string;
    valor: number;
    observacoes?: string;
    profissionais: {
      display_name: string;
      user_email: string;
      profissao: string;
      telefone: string;
    };
  };
  paymentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agendamento, paymentId }: NotificationRequest = await req.json();
    
    console.log('Sending appointment notification:', agendamento.id);

    // Format date and time for email
    const dataFormatada = new Date(agendamento.data_consulta).toLocaleDateString('pt-BR');
    const horarioFormatado = agendamento.horario.substring(0, 5); // Remove seconds
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(agendamento.valor);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          🎉 Nova Consulta Agendada - Pagamento Confirmado
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">📋 Informações da Consulta</h3>
          <p><strong>ID do Agendamento:</strong> ${agendamento.id}</p>
          <p><strong>Data:</strong> ${dataFormatada}</p>
          <p><strong>Horário:</strong> ${horarioFormatado}</p>
          <p><strong>Valor:</strong> ${valorFormatado}</p>
          <p><strong>Status:</strong> Pagamento Confirmado ✅</p>
          <p><strong>ID do Pagamento:</strong> ${paymentId}</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">👤 Dados do Paciente</h3>
          <p><strong>Nome:</strong> ${agendamento.nome_paciente}</p>
          <p><strong>Email:</strong> ${agendamento.email_paciente}</p>
          <p><strong>Telefone:</strong> ${agendamento.telefone_paciente}</p>
          ${agendamento.observacoes ? `<p><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ''}
        </div>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">👨‍⚕️ Profissional</h3>
          <p><strong>Nome:</strong> ${agendamento.profissionais.display_name}</p>
          <p><strong>Profissão:</strong> ${agendamento.profissionais.profissao}</p>
          <p><strong>Email:</strong> ${agendamento.profissionais.user_email}</p>
          <p><strong>Telefone:</strong> ${agendamento.profissionais.telefone}</p>
        </div>

        <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <h4 style="color: #15803d; margin-top: 0;">✅ Próximos Passos</h4>
          <ul style="color: #166534;">
            <li>O paciente receberá uma confirmação por email</li>
            <li>Entre em contato com o paciente para confirmar detalhes</li>
            <li>Prepare-se para a consulta na data e horário agendados</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Email enviado automaticamente pelo sistema Alopsi<br>
            Data: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Alopsi <noreply@alopsi.com>",
      to: ["alopsi.host@gmail.com"],
      subject: `🎉 Nova Consulta Agendada - ${agendamento.profissionais.display_name} - ${dataFormatada}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-appointment-notification function:", error);
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