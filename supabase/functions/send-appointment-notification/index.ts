import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const MEDCOS_ADMIN_EMAIL = 'medcos.host@gmail.com';
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
  meetLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agendamento, paymentId, meetLink }: NotificationRequest = await req.json();
    
    console.log('Sending appointment notifications:', agendamento.id);

    // Initialize Supabase client to fetch tenant info
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar tenant_id do profissional através de professional_tenants
    let adminEmail = 'alopsi.host@gmail.com'; // fallback padrão
    let tenantName = 'Alô, Psi';

    const { data: professionalTenant } = await supabase
      .from('professional_tenants')
      .select(`
        tenant_id,
        tenants!inner (
          admin_email,
          name,
          slug
        )
      `)
      .eq('professional_id', agendamento.professional_id)
      .single();

    if (professionalTenant?.tenants?.admin_email) {
      adminEmail = professionalTenant.tenants.admin_email;
    }
    if (professionalTenant?.tenants?.name) {
      tenantName = professionalTenant.tenants.name;
      
      // Normalizar nome para MEDCOS em uppercase
      const tenantSlug = professionalTenant.tenants?.slug;
      if (tenantSlug === 'medcos') {
        tenantName = 'MEDCOS';
      }
    }

    // Format date and time for email
    const dataFormatada = new Date(agendamento.data_consulta).toLocaleDateString('pt-BR');
    const horarioFormatado = agendamento.horario.substring(0, 5); // Remove seconds
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(agendamento.valor);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nova Consulta Agendada</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${tenantName}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Conectando você ao cuidado mental</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">🎉 Nova Consulta Agendada</h2>
              
              <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <p style="margin: 0; font-size: 16px; color: #15803d;">
                  <strong>✅ Pagamento Confirmado</strong> - A consulta foi agendada com sucesso!
                </p>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📋 Informações da Consulta</h3>
                <p style="margin: 5px 0; color: #4b5563;"><strong>ID:</strong> ${agendamento.id}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Data:</strong> ${dataFormatada}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Horário:</strong> ${horarioFormatado}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Valor:</strong> ${valorFormatado}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>ID do Pagamento:</strong> ${paymentId}</p>
              </div>

              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2;">
                <h3 style="color: #0891b2; margin: 0 0 15px 0; font-size: 18px;">👤 Dados do Paciente</h3>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Nome:</strong> ${agendamento.nome_paciente}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${agendamento.email_paciente}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Telefone:</strong> ${agendamento.telefone_paciente}</p>
                ${agendamento.observacoes ? `<p style="margin: 10px 0 5px 0; color: #4b5563;"><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ''}
              </div>

              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">👨‍⚕️ Profissional Responsável</h3>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Nome:</strong> ${agendamento.profissionais.display_name}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Profissão:</strong> ${agendamento.profissionais.profissao}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${agendamento.profissionais.user_email}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Telefone:</strong> ${agendamento.profissionais.telefone}</p>
              </div>

              <div style="background-color: #fef3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #0891b2;">
                <h4 style="color: #a16207; margin: 0 0 15px 0; font-size: 16px;">📋 Próximos Passos</h4>
                <ul style="color: #a16207; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>O paciente receberá uma confirmação por email</li>
                  <li>Entre em contato com o paciente para confirmar detalhes</li>
                  <li>Prepare-se para a consulta na data e horário agendados</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                Email enviado automaticamente pelo sistema <strong>${tenantName}</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Data: ${new Date().toLocaleString('pt-BR')}
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;

    // Send internal notification email
    const internalEmailResponse = await resend.emails.send({
      from: `${tenantName} <noreply@redebemestar.com.br>`,
      to: [adminEmail],
      cc: adminEmail !== MEDCOS_ADMIN_EMAIL ? [MEDCOS_ADMIN_EMAIL] : [],
      subject: `🎉 Nova Consulta Agendada - ${agendamento.profissionais.display_name} - ${dataFormatada}`,
      html: emailHtml,
    });

    // Send email to professional
    const professionalEmailHtml = createProfessionalEmail(agendamento, dataFormatada, horarioFormatado, valorFormatado, paymentId, meetLink, tenantName);
    const professionalEmailResponse = await resend.emails.send({
      from: `${tenantName} <noreply@redebemestar.com.br>`,
      to: [agendamento.profissionais.user_email],
      subject: `📅 Nova Consulta Agendada - ${agendamento.nome_paciente} - ${dataFormatada} às ${horarioFormatado}`,
      html: professionalEmailHtml,
    });

    // Send email to patient
    const patientEmailHtml = createPatientEmail(agendamento, dataFormatada, horarioFormatado, valorFormatado, meetLink, tenantName);
    const patientEmailResponse = await resend.emails.send({
      from: `${tenantName} <noreply@redebemestar.com.br>`,
      to: [agendamento.email_paciente],
      subject: `✅ Consulta Confirmada - ${agendamento.profissionais.display_name} - ${dataFormatada} às ${horarioFormatado}`,
      html: patientEmailHtml,
    });

    console.log("All emails sent successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      emails: {
        internal: internalEmailResponse.data?.id,
        professional: professionalEmailResponse.data?.id,
        patient: patientEmailResponse.data?.id
      }
    }), {
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

// Professional email template
function createProfessionalEmail(agendamento: any, dataFormatada: string, horarioFormatado: string, valorFormatado: string, paymentId: string, meetLink?: string, tenantName: string = 'Alô, Psi') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Consulta Agendada</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${tenantName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Nova consulta agendada para você!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">👋 Olá, Dr(a). ${agendamento.profissionais.display_name}!</h2>
            
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0; font-size: 16px; color: #15803d;">
                <strong>✅ Você tem uma nova consulta confirmada!</strong>
              </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📅 Detalhes da Consulta</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Data:</strong> ${dataFormatada}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Horário:</strong> ${horarioFormatado}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Valor:</strong> ${valorFormatado}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>ID do Agendamento:</strong> ${agendamento.id}</p>
            </div>

            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2;">
              <h3 style="color: #0891b2; margin: 0 0 15px 0; font-size: 18px;">👤 Dados do Paciente</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Nome:</strong> ${agendamento.nome_paciente}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${agendamento.email_paciente}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Telefone:</strong> ${agendamento.telefone_paciente}</p>
              ${agendamento.observacoes ? `<p style="margin: 10px 0 5px 0; color: #4b5563;"><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ''}
            </div>

            ${meetLink ? `
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <h3 style="color: #22c55e; margin: 0 0 15px 0; font-size: 18px;">🎥 Link da Reunião</h3>
                <p style="margin: 5px 0; color: #4b5563;">A consulta será realizada via Google Meet:</p>
                <a href="${meetLink}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                  Entrar na Reunião
                </a>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                  💡 Dica: Este link estará disponível também no seu Google Calendar
                </p>
              </div>
            ` : ''}

            <div style="background-color: #fef3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h4 style="color: #a16207; margin: 0 0 15px 0; font-size: 16px;">📋 Próximos Passos</h4>
              <ul style="color: #a16207; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Este evento foi automaticamente adicionado ao seu Google Calendar</li>
                <li>Entre em contato com o paciente se necessário</li>
                <li>Prepare-se para a consulta na data e horário agendados</li>
                <li>Acesse a reunião através do link do Google Meet</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
              Email enviado automaticamente pelo sistema <strong>${tenantName}</strong>
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Data: ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
          
        </div>
      </body>
    </html>
  `;
}

// Patient email template
function createPatientEmail(agendamento: any, dataFormatada: string, horarioFormatado: string, valorFormatado: string, meetLink?: string, tenantName: string = 'Alô, Psi') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Consulta Confirmada</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${tenantName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sua consulta foi confirmada!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">🎉 Olá, ${agendamento.nome_paciente}!</h2>
            
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0; font-size: 16px; color: #15803d;">
                <strong>✅ Sua consulta foi confirmada com sucesso!</strong>
              </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📅 Detalhes da sua Consulta</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Data:</strong> ${dataFormatada}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Horário:</strong> ${horarioFormatado}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Valor Pago:</strong> ${valorFormatado}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Número do Agendamento:</strong> ${agendamento.id}</p>
            </div>

            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">👨‍⚕️ Seu Profissional</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Nome:</strong> ${agendamento.profissionais.display_name}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Profissão:</strong> ${agendamento.profissionais.profissao}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${agendamento.profissionais.user_email}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Telefone:</strong> ${agendamento.profissionais.telefone}</p>
            </div>

            ${meetLink ? `
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <h3 style="color: #22c55e; margin: 0 0 15px 0; font-size: 18px;">🎥 Link da Consulta Online</h3>
                <p style="margin: 5px 0; color: #4b5563;">Sua consulta será realizada via Google Meet. Clique no link abaixo na hora marcada:</p>
                <a href="${meetLink}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                  Entrar na Consulta
                </a>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                  💡 Dica: Este link também foi enviado para o seu email e está no convite do Google Calendar
                </p>
              </div>
            ` : ''}

            <div style="background-color: #fef3cd; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h4 style="color: #a16207; margin: 0 0 15px 0; font-size: 16px;">📝 Instruções Importantes</h4>
              <ul style="color: #a16207; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Certifique-se de ter uma conexão estável de internet</li>
                <li>Teste seu microfone e câmera antes da consulta</li>
                <li>Busque um ambiente reservado e silencioso</li>
                <li>Tenha em mãos eventuais documentos ou exames</li>
                <li>Em caso de imprevistos, entre em contato antecipadamente</li>
              </ul>
            </div>

            <div style="background-color: #e0e7ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #6366f1;">
              <h4 style="color: #4338ca; margin: 0 0 15px 0; font-size: 16px;">📞 Precisa Reagendar ou tem Dúvidas?</h4>
              <p style="color: #4338ca; margin: 0;">
                Entre em contato diretamente com seu profissional:<br>
                <strong>Email:</strong> ${agendamento.profissionais.user_email}<br>
                <strong>Telefone:</strong> ${agendamento.profissionais.telefone}
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
              Obrigado por escolher a <strong>${tenantName}</strong> para cuidar da sua saúde emocional! 💙
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Data: ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
          
        </div>
      </body>
    </html>
  `;
}

serve(handler);