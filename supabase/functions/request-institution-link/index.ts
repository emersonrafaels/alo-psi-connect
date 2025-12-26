import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestInstitutionLinkRequest {
  institutionId: string;
  requestMessage?: string;
  userType: 'paciente' | 'profissional';
  tenantId: string;
  relationshipType?: 'employee' | 'consultant' | 'supervisor' | 'intern';
  enrollmentType?: 'student' | 'alumni' | 'employee';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      institutionId,
      requestMessage,
      userType,
      tenantId,
      relationshipType,
      enrollmentType,
    }: RequestInstitutionLinkRequest = await req.json();

    console.log('Processing institution link request:', {
      userId: user.id,
      institutionId,
      userType,
      tenantId,
    });

    const [profileData, tenantData, institutionData] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('tenants').select('admin_email, name, primary_color, logo_url, slug').eq('id', tenantId).single(),
      supabaseClient.from('educational_institutions').select('name, type, has_partnership').eq('id', institutionId).single(),
    ]);

    if (!profileData.data || !tenantData.data || !institutionData.data) {
      throw new Error('Required data not found');
    }

    const profile = profileData.data;
    const tenant = tenantData.data;
    const institution = institutionData.data;

    // Normalizar nome para MEDCOS em uppercase
    let normalizedTenantName = tenant.name;
    if (tenant.slug === 'medcos') {
      normalizedTenantName = 'MEDCOS';
    }

    let professionalId = null;
    let patientId = null;

    if (userType === 'profissional') {
      const { data: profData } = await supabaseClient
        .from('profissionais')
        .select('id')
        .eq('profile_id', profile.id)
        .single();
      professionalId = profData?.id;
    } else if (userType === 'paciente') {
      const { data: patientData } = await supabaseClient
        .from('pacientes')
        .select('id')
        .eq('profile_id', profile.id)
        .single();
      patientId = patientData?.id;
    }

    const { data: existingRequest } = await supabaseClient
      .from('institution_link_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('institution_id', institutionId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ 
          error: 'Você já possui uma solicitação pendente para esta instituição',
          requestId: existingRequest.id 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: newRequest, error: requestError } = await supabaseClient
      .from('institution_link_requests')
      .insert({
        user_id: user.id,
        profile_id: profile.id,
        institution_id: institutionId,
        tenant_id: tenantId,
        user_type: userType,
        request_message: requestMessage,
        professional_id: professionalId,
        relationship_type: relationshipType,
        patient_id: patientId,
        enrollment_type: enrollmentType,
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating request:', requestError);
      throw requestError;
    }

    console.log('Request created successfully:', newRequest.id);

    // Fetch institution admins to notify
    const { data: institutionAdmins } = await supabaseClient
      .from('institution_users')
      .select(`
        id,
        user_id,
        profiles!inner (
          email,
          nome
        )
      `)
      .eq('institution_id', institutionId)
      .eq('role', 'admin')
      .eq('is_active', true);

    const adminEmail = tenant.admin_email || 'redebemestar1@gmail.com';
    const tenantColor = tenant.primary_color || '#7c3aed';
    const tenantLogo = tenant.logo_url || '';
    const tenantSlug = tenant.slug || '';
    const userTypeLabel = userType === 'paciente' ? 'Paciente/Aluno' : 'Profissional';
    
    const relationshipLabels: Record<string, string> = {
      employee: 'Funcionário',
      consultant: 'Consultor',
      supervisor: 'Supervisor',
      intern: 'Estagiário',
    };

    const enrollmentLabels: Record<string, string> = {
      student: 'Estudante',
      alumni: 'Ex-Aluno',
      employee: 'Funcionário',
    };
    
    // Enhanced email template with tenant branding
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: ${tenantColor}; padding: 24px; text-align: center;">
            ${tenantLogo ? `<img src="${tenantLogo}" alt="${normalizedTenantName}" style="max-height: 50px; margin-bottom: 16px;" />` : ''}
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${normalizedTenantName}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
              <h2 style="color: #374151; margin: 0; font-size: 24px;">Nova Solicitação de Vínculo</h2>
            </div>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
              Um usuário solicitou vínculo com uma instituição educacional.
            </p>
            
            <!-- Request Details Card -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 18px;">Detalhes da Solicitação</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tipo de usuário:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${userTypeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nome:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${profile.nome}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${profile.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Instituição:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
                    ${institution.name}
                    ${institution.has_partnership ? '<span style="background-color: #8b5cf6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">Parceira</span>' : ''}
                  </td>
                </tr>
                ${relationshipType ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tipo de vínculo:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${relationshipLabels[relationshipType]}</td>
                </tr>
                ` : ''}
                ${enrollmentType ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tipo de matrícula:</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${enrollmentLabels[enrollmentType]}</td>
                </tr>
                ` : ''}
              </table>
              
              ${requestMessage ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Mensagem do usuário:</p>
                  <div style="background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #374151; font-size: 14px; white-space: pre-wrap;">${requestMessage}</p>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://redebemestar.com.br/admin/instituicoes" 
                 style="display: inline-block; background-color: ${tenantColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Revisar Solicitação
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">
              Esta é uma notificação automática do sistema <strong>${normalizedTenantName}</strong>.
            </p>
            <p style="margin: 16px 0 0 0; color: #d1d5db; font-size: 12px;">
              Acesse o painel administrativo para aprovar ou rejeitar esta solicitação.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to tenant admin
    const emailResponse = await resend.emails.send({
      from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
      to: [adminEmail],
      subject: `Nova Solicitação de Vínculo Institucional - ${institution.name}`,
      html: emailHtml,
    });

    console.log('Email sent to tenant admin:', emailResponse);

    // Send to institution admins if any exist
    if (institutionAdmins && institutionAdmins.length > 0) {
      const institutionAdminEmails = institutionAdmins
        .map((admin: any) => admin.profiles?.email)
        .filter((email: string | undefined) => email && email !== adminEmail);

      if (institutionAdminEmails.length > 0) {
        try {
          await resend.emails.send({
            from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
            to: institutionAdminEmails,
            subject: `Nova Solicitação de Vínculo - ${institution.name}`,
            html: emailHtml,
          });
          console.log('Email sent to institution admins:', institutionAdminEmails);
        } catch (instEmailError) {
          console.error('Failed to send to institution admins:', instEmailError);
          // Don't throw - this is not critical
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId: newRequest.id,
        message: 'Solicitação enviada com sucesso. Em breve analisaremos seu pedido.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in request-institution-link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
