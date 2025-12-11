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

    // Fetch the request details with tenant info
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
          name,
          type,
          has_partnership
        ),
        tenants (
          name,
          admin_email,
          primary_color,
          logo_url,
          slug
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
            enrollment_status: request.enrollment_type || 'enrolled',
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

      // Create user_tenants link to ensure user has access to the tenant
      if (request.tenant_id && request.profile_id) {
        const { error: tenantLinkError } = await supabase
          .from('user_tenants')
          .upsert({
            user_id: request.profile_id, // user_tenants.user_id references profiles.id
            tenant_id: request.tenant_id,
            is_primary: false
          }, { onConflict: 'user_id,tenant_id' });
          
        if (tenantLinkError) {
          console.error('Error creating user-tenant link:', tenantLinkError);
          // Don't fail - it's less critical than the institutional link
        } else {
          console.log('User-tenant link created/updated successfully');
        }
      }
    }

    // Send email notification to user with tenant branding
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const userEmail = request.profiles.email;
      const userName = request.profiles.nome;
      const institutionName = request.educational_institutions.name;
      let tenantName = request.tenants?.name || 'Rede Bem Estar';
      const tenantEmail = request.tenants?.admin_email || 'alopsi.host@gmail.com';
      const tenantColor = request.tenants?.primary_color || '#7c3aed';
      const tenantLogo = request.tenants?.logo_url || '';
      const tenantSlug = request.tenants?.slug || '';

      // Normalizar nome para MEDCOS em uppercase
      if (tenantSlug === 'medcos') {
        tenantName = 'MEDCOS';
      }

      const statusLabel = action === 'approve' ? 'Aprovada' : 'Não Aprovada';
      const statusColor = action === 'approve' ? '#22c55e' : '#ef4444';
      const statusIcon = action === 'approve' ? '✅' : '❌';

      const emailSubject = `Solicitação de vínculo ${statusLabel.toLowerCase()} - ${tenantName}`;

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
              ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 50px; margin-bottom: 16px;" />` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${tenantName}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">${statusIcon}</div>
                <h2 style="color: ${statusColor}; margin: 0; font-size: 28px;">Solicitação ${statusLabel}!</h2>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Olá, <strong>${userName}</strong>!
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${action === 'approve' 
                  ? `Sua solicitação de vínculo com <strong>${institutionName}</strong> foi <span style="color: ${statusColor}; font-weight: bold;">aprovada</span>! Agora você tem acesso aos benefícios e recursos desta instituição na plataforma.`
                  : `Infelizmente, sua solicitação de vínculo com <strong>${institutionName}</strong> <span style="color: ${statusColor}; font-weight: bold;">não foi aprovada</span> neste momento.`
                }
              </p>
              
              ${reviewNotes ? `
                <div style="background-color: #f9fafb; border-left: 4px solid ${tenantColor}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">
                    ${action === 'approve' ? 'Observações:' : 'Motivo:'}
                  </p>
                  <p style="margin: 0; color: #6b7280; white-space: pre-wrap;">${reviewNotes}</p>
                </div>
              ` : ''}
              
              ${action === 'approve' ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="https://alopsi.com.br${tenantSlug ? `/${tenantSlug}` : ''}/perfil" 
                     style="display: inline-block; background-color: ${tenantColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Acessar Meu Perfil
                  </a>
                </div>
              ` : `
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Se você tiver dúvidas ou acredita que houve um engano, entre em contato conosco respondendo a este email.
                </p>
              `}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Atenciosamente,<br/>
                <strong>Equipe ${tenantName}</strong>
              </p>
              <p style="margin: 16px 0 0 0; color: #d1d5db; font-size: 12px;">
                Este é um email automático. Por favor, não responda diretamente.
              </p>
            </div>
          </div>
        </body>
        </html>
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
          console.log('Email notification sent successfully to user');
        }
      } catch (emailError) {
        console.error('Error sending email to user:', emailError);
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
