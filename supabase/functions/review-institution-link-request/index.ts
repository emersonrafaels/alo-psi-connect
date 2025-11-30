import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewRequestBody {
  requestId: string;
  action: 'approve' | 'reject';
  reviewNotes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user has admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error checking user roles:', rolesError);
      throw new Error('Error verifying permissions');
    }

    const hasAdminRole = userRoles?.some(
      (r) => r.role === 'admin' || r.role === 'super_admin'
    );

    if (!hasAdminRole) {
      throw new Error('Insufficient permissions. Admin role required.');
    }

    const { requestId, action, reviewNotes }: ReviewRequestBody = await req.json();

    console.log('Processing review request:', { requestId, action, reviewNotes });

    // Fetch the request details
    const { data: request, error: fetchError } = await supabase
      .from('institution_link_requests')
      .select(`
        *,
        profiles!inner (
          nome,
          email,
          user_id
        ),
        educational_institutions!inner (
          name
        ),
        tenants (
          name,
          admin_email
        )
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      console.error('Error fetching request:', fetchError);
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request has already been reviewed');
    }

    console.log('Request details:', request);

    // Update request status
    const { error: updateError } = await supabase
      .from('institution_link_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        review_notes: reviewNotes || null,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      throw new Error('Failed to update request status');
    }

    // If approved, create the actual link
    if (action === 'approve') {
      if (request.user_type === 'paciente') {
        // Create patient-institution link
        const { error: linkError } = await supabase
          .from('patient_institutions')
          .insert({
            patient_id: request.patient_id,
            institution_id: request.institution_id,
            enrollment_status: request.enrollment_type || 'student',
            enrollment_date: new Date().toISOString(),
          });

        if (linkError) {
          console.error('Error creating patient link:', linkError);
          throw new Error('Failed to create patient-institution link');
        }

        console.log('Patient-institution link created successfully');
      } else if (request.user_type === 'profissional') {
        // Create professional-institution link
        const { error: linkError } = await supabase
          .from('professional_institutions')
          .insert({
            professional_id: request.professional_id,
            institution_id: request.institution_id,
            relationship_type: request.relationship_type || 'employee',
            is_active: true,
            start_date: new Date().toISOString(),
          });

        if (linkError) {
          console.error('Error creating professional link:', linkError);
          throw new Error('Failed to create professional-institution link');
        }

        console.log('Professional-institution link created successfully');
      }
    }

    // Send email notification to user
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const userEmail = request.profiles.email;
      const userName = request.profiles.nome;
      const institutionName = request.educational_institutions.name;
      const tenantName = request.tenants?.name || 'Rede Bem Estar';
      const tenantEmail = request.tenants?.admin_email || 'alopsi.host@gmail.com';

      const emailSubject =
        action === 'approve'
          ? `Solicitação de vínculo aprovada - ${tenantName}`
          : `Solicitação de vínculo não aprovada - ${tenantName}`;

      const emailHtml =
        action === 'approve'
          ? `
        <h2>Solicitação Aprovada! 🎉</h2>
        <p>Olá, ${userName}!</p>
        <p>Sua solicitação de vínculo com <strong>${institutionName}</strong> foi aprovada.</p>
        <p>Agora você tem acesso aos benefícios e recursos desta instituição na plataforma ${tenantName}.</p>
        ${reviewNotes ? `<p><strong>Observações:</strong><br/>${reviewNotes}</p>` : ''}
        <p>Qualquer dúvida, entre em contato conosco.</p>
        <p>Atenciosamente,<br/>Equipe ${tenantName}</p>
      `
          : `
        <h2>Solicitação Não Aprovada</h2>
        <p>Olá, ${userName}!</p>
        <p>Infelizmente, sua solicitação de vínculo com <strong>${institutionName}</strong> não foi aprovada neste momento.</p>
        ${reviewNotes ? `<p><strong>Motivo:</strong><br/>${reviewNotes}</p>` : ''}
        <p>Se você tiver dúvidas ou acredita que houve um engano, entre em contato conosco.</p>
        <p>Atenciosamente,<br/>Equipe ${tenantName}</p>
      `;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${tenantName} <${tenantEmail}>`,
            to: [userEmail],
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to send email:', errorText);
        } else {
          console.log('Email notification sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't throw - email is not critical
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in review-institution-link-request:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
