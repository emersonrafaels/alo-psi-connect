import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const PENDING_HOURS_THRESHOLD = 48; // Hours after which to send reminder
const MAX_REMINDERS_PER_REQUEST = 3; // Maximum reminders to send per request

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[remind-pending-link-requests] Starting reminder job...');

    // Calculate threshold timestamp
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - PENDING_HOURS_THRESHOLD);

    // Fetch pending requests older than threshold
    const { data: pendingRequests, error: fetchError } = await supabase
      .from('institution_link_requests')
      .select(`
        id,
        created_at,
        user_type,
        metadata,
        profiles!inner (
          nome,
          email
        ),
        educational_institutions!inner (
          name,
          type
        ),
        tenants (
          name,
          admin_email,
          primary_color,
          logo_url,
          slug
        )
      `)
      .eq('status', 'pending')
      .lt('created_at', thresholdDate.toISOString())
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[remind-pending-link-requests] Error fetching pending requests:', fetchError);
      throw fetchError;
    }

    console.log(`[remind-pending-link-requests] Found ${pendingRequests?.length || 0} pending requests older than ${PENDING_HOURS_THRESHOLD}h`);

    if (!pendingRequests || pendingRequests.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending requests to remind',
          remindersSkipped: 0,
          remindersSent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let remindersSent = 0;
    let remindersSkipped = 0;

    // Group requests by tenant for batching
    const requestsByTenant = new Map<string, typeof pendingRequests>();
    
    for (const request of pendingRequests) {
      const tenantId = request.tenants?.slug || 'default';
      const existing = requestsByTenant.get(tenantId) || [];
      existing.push(request);
      requestsByTenant.set(tenantId, existing);
    }

    // Process each tenant's pending requests
    for (const [tenantSlug, requests] of requestsByTenant) {
      const tenant = requests[0].tenants;
      const adminEmail = tenant?.admin_email || 'alopsi.host@gmail.com';
      let tenantName = tenant?.name || 'Rede Bem Estar';
      const tenantColor = tenant?.primary_color || '#7c3aed';
      const tenantLogo = tenant?.logo_url || '';

      // Normalizar nome para MEDCOS em uppercase
      if (tenant?.slug === 'medcos') {
        tenantName = 'MEDCOS';
      }

      // Check reminder count for each request
      const requestsToRemind = requests.filter((req: any) => {
        const metadata = req.metadata || {};
        const reminderCount = metadata.reminder_count || 0;
        return reminderCount < MAX_REMINDERS_PER_REQUEST;
      });

      if (requestsToRemind.length === 0) {
        remindersSkipped += requests.length;
        continue;
      }

      // Build summary email for this tenant
      const requestsTable = requestsToRemind.map((req: any) => {
        const createdAt = new Date(req.created_at);
        const hoursAgo = Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
        const userTypeLabel = req.user_type === 'paciente' ? 'Paciente/Aluno' : 'Profissional';
        
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${req.profiles.nome}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${userTypeLabel}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${req.educational_institutions.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #ef4444; font-weight: 600;">${hoursAgo}h atrás</td>
          </tr>
        `;
      }).join('');

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: ${tenantColor}; padding: 24px; text-align: center;">
              ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 50px; margin-bottom: 16px;" />` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${tenantName}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
                <h2 style="color: #374151; margin: 0; font-size: 24px;">Lembrete: Solicitações Pendentes</h2>
              </div>
              
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  <strong>⚠️ Atenção:</strong> Existem <strong>${requestsToRemind.length}</strong> solicitação(ões) de vínculo institucional aguardando revisão há mais de ${PENDING_HOURS_THRESHOLD} horas.
                </p>
              </div>
              
              <!-- Requests Table -->
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: ${tenantColor}; color: #ffffff;">
                      <th style="padding: 12px; text-align: left; font-weight: 600;">Solicitante</th>
                      <th style="padding: 12px; text-align: left; font-weight: 600;">Tipo</th>
                      <th style="padding: 12px; text-align: left; font-weight: 600;">Instituição</th>
                      <th style="padding: 12px; text-align: left; font-weight: 600;">Tempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${requestsTable}
                  </tbody>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://alopsi.com.br${tenantSlug !== 'default' ? `/${tenantSlug}` : ''}/admin/instituicoes" 
                   style="display: inline-block; background-color: ${tenantColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Revisar Solicitações
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Este é um lembrete automático do sistema <strong>${tenantName}</strong>.
              </p>
              <p style="margin: 16px 0 0 0; color: #d1d5db; font-size: 12px;">
                Enviamos lembretes a cada ${PENDING_HOURS_THRESHOLD} horas para solicitações pendentes (máximo de ${MAX_REMINDERS_PER_REQUEST} lembretes por solicitação).
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: `${tenantName} <noreply@redebemestar.com.br>`,
          to: [adminEmail],
          subject: `⏰ Lembrete: ${requestsToRemind.length} solicitação(ões) pendente(s) - ${tenantName}`,
          html: emailHtml,
        });

        console.log(`[remind-pending-link-requests] Reminder sent to ${adminEmail} for ${requestsToRemind.length} requests`);

        // Update reminder count for each request
        for (const req of requestsToRemind) {
          const currentMetadata = req.metadata || {};
          const newReminderCount = (currentMetadata.reminder_count || 0) + 1;
          
          await supabase
            .from('institution_link_requests')
            .update({
              metadata: {
                ...currentMetadata,
                reminder_count: newReminderCount,
                last_reminder_at: new Date().toISOString(),
              },
            })
            .eq('id', req.id);
        }

        remindersSent += requestsToRemind.length;
      } catch (emailError) {
        console.error(`[remind-pending-link-requests] Failed to send reminder to ${adminEmail}:`, emailError);
      }
    }

    console.log(`[remind-pending-link-requests] Job completed. Sent: ${remindersSent}, Skipped: ${remindersSkipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reminder job completed`,
        remindersSent,
        remindersSkipped,
        totalPending: pendingRequests.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[remind-pending-link-requests] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
