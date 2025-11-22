import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
      supabaseClient.from('tenants').select('admin_email, name').eq('id', tenantId).single(),
      supabaseClient.from('educational_institutions').select('name, type').eq('id', institutionId).single(),
    ]);

    if (!profileData.data || !tenantData.data || !institutionData.data) {
      throw new Error('Required data not found');
    }

    const profile = profileData.data;
    const tenant = tenantData.data;
    const institution = institutionData.data;

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

    const adminEmail = tenant.admin_email || 'alopsi.host@gmail.com';
    const userTypeLabel = userType === 'paciente' ? 'Paciente' : 'Profissional';
    
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
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nova Solicitação de Vínculo Institucional</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #666;">Detalhes da Solicitação</h3>
          
          <p><strong>Tipo de usuário:</strong> ${userTypeLabel}</p>
          <p><strong>Nome:</strong> ${profile.nome}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Instituição solicitada:</strong> ${institution.name}</p>
          
          ${relationshipType ? `<p><strong>Tipo de vínculo:</strong> ${relationshipLabels[relationshipType]}</p>` : ''}
          ${enrollmentType ? `<p><strong>Tipo de matrícula:</strong> ${enrollmentLabels[enrollmentType]}</p>` : ''}
          
          ${requestMessage ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <strong>Mensagem do usuário:</strong>
              <p style="white-space: pre-wrap;">${requestMessage}</p>
            </div>
          ` : ''}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Para analisar e aprovar/rejeitar esta solicitação, acesse o painel administrativo da plataforma.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
        
        <p style="color: #999; font-size: 12px;">
          Esta é uma notificação automática do sistema ${tenant.name}.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `${tenant.name} <onboarding@resend.dev>`,
      to: [adminEmail],
      subject: `Nova Solicitação de Vínculo Institucional - ${institution.name}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

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
