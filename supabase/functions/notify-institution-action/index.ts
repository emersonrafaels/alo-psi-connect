import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { getBccEmails } from "../_shared/get-bcc-emails.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotifyRequest {
  action_type: 'student_triaged' | 'triage_in_progress' | 'triage_resolved' | 'triage_reopened' | 'note_created' | 'note_deleted';
  institution_id: string;
  metadata: Record<string, any>;
}

const ACTION_LABELS: Record<string, { subject: string; buildBody: (m: Record<string, any>) => string }> = {
  student_triaged: {
    subject: '🔔 Aluno Triado',
    buildBody: (m) => `O aluno <strong>${m.student_name || 'N/A'}</strong> foi triado com nível de risco <strong>${m.risk_level || 'N/A'}</strong> e prioridade <strong>${m.priority || 'N/A'}</strong>.${m.recommended_action ? `<br/>Ação recomendada: ${m.recommended_action}` : ''}`,
  },
  triage_in_progress: {
    subject: '🔄 Triagem Em Andamento',
    buildBody: (m) => `A triagem do aluno <strong>${m.student_name || 'N/A'}</strong> foi movida para <strong>Em Andamento</strong>.`,
  },
  triage_resolved: {
    subject: '✅ Triagem Concluída',
    buildBody: (m) => `A triagem do aluno <strong>${m.student_name || 'N/A'}</strong> foi <strong>concluída/resolvida</strong>.`,
  },
  triage_reopened: {
    subject: '🔁 Triagem Reaberta',
    buildBody: (m) => `A triagem do aluno <strong>${m.student_name || 'N/A'}</strong> foi <strong>reaberta</strong>.`,
  },
  note_created: {
    subject: '📝 Nova Nota Institucional',
    buildBody: (m) => `Uma nova nota "<strong>${m.note_title || 'N/A'}</strong>" foi criada na instituição <strong>${m.institution_name || 'N/A'}</strong>.`,
  },
  note_deleted: {
    subject: '🗑️ Nota Institucional Excluída',
    buildBody: (m) => `A nota "<strong>${m.note_title || 'N/A'}</strong>" foi excluída da instituição <strong>${m.institution_name || 'N/A'}</strong>.`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: NotifyRequest = await req.json();
    const { action_type, institution_id, metadata } = body;

    if (!action_type || !institution_id) {
      return new Response(JSON.stringify({ error: 'Missing action_type or institution_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const actionConfig = ACTION_LABELS[action_type];
    if (!actionConfig) {
      return new Response(JSON.stringify({ error: 'Unknown action_type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch institution admins
    const { data: adminUsers } = await supabase
      .from('institution_users')
      .select('user_id')
      .eq('institution_id', institution_id)
      .eq('role', 'admin')
      .eq('is_active', true);

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No active admins found for institution', institution_id);
      return new Response(JSON.stringify({ success: true, sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminUserIds = adminUsers.map(a => a.user_id);

    // Fetch admin emails & tenant info in parallel
    const [profilesResult, institutionResult] = await Promise.all([
      supabase.from('profiles').select('user_id, email, nome').in('user_id', adminUserIds),
      supabase.from('educational_institutions').select('name').eq('id', institution_id).single(),
    ]);

    const adminEmails = (profilesResult.data || [])
      .map(p => p.email)
      .filter((e): e is string => !!e && e.includes('@'));

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(JSON.stringify({ success: true, sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const institutionName = institutionResult.data?.name || 'Instituição';

    // Get tenant_id from institution_users for BCC
    const tenantId = adminUsers[0] ? (await supabase.from('institution_users').select('tenant_id').eq('institution_id', institution_id).limit(1).single()).data?.tenant_id : null;

    // Fetch tenant branding & BCC
    let tenantBranding = { name: 'Rede Bem Estar', logo_url: '', primary_color: '#4F46E5' };
    if (tenantId) {
      const { data: tenant } = await supabase.from('tenants').select('name, logo_url, primary_color').eq('id', tenantId).single();
      if (tenant) {
        tenantBranding = {
          name: tenant.name || tenantBranding.name,
          logo_url: tenant.logo_url || '',
          primary_color: tenant.primary_color || tenantBranding.primary_color,
        };
      }
    }

    const bccEmails = await getBccEmails(supabase, tenantId);

    // Build email
    const enrichedMetadata = { ...metadata, institution_name: institutionName };
    const emailBody = actionConfig.buildBody(enrichedMetadata);
    const subject = `${actionConfig.subject} - ${institutionName}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    ${tenantBranding.logo_url ? `<div style="text-align: center; margin-bottom: 24px;"><img src="${tenantBranding.logo_url}" alt="${tenantBranding.name}" style="max-height: 48px;" /></div>` : ''}
    <div style="border-left: 4px solid ${tenantBranding.primary_color}; padding-left: 16px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${subject}</h2>
    </div>
    <div style="color: #374151; font-size: 15px; line-height: 1.6;">
      ${emailBody}
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      Esta é uma notificação automática do sistema ${tenantBranding.name}. Não responda a este email.
    </p>
  </div>
</body>
</html>`;

    // Send email
    const emailPayload: any = {
      from: `${tenantBranding.name} <noreply@redebemestar.com.br>`,
      to: adminEmails,
      subject,
      html: htmlContent,
    };
    if (bccEmails.length > 0) {
      emailPayload.bcc = bccEmails;
    }

    const { error: sendError } = await resend.emails.send(emailPayload);

    if (sendError) {
      console.error('Error sending email:', sendError);
      return new Response(JSON.stringify({ success: false, error: sendError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`✅ Notification sent for ${action_type} to ${adminEmails.length} admin(s)`);
    return new Response(JSON.stringify({ success: true, sent: adminEmails.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
