import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshGoogleToken(refreshToken: string) {
  try {
    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) return { success: false };
    const data = await response.json();
    return { success: true, access_token: data.access_token };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false };
  }
}

async function syncUserCalendar(profile: any, supabaseClient: any): Promise<number> {
  console.log(`[Sync] Iniciando sincronização para usuário ${profile.user_id}`);
  
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    let accessToken = profile.google_calendar_token;
    
    // Fetch calendar busy periods
    let calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: now.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          items: [{ id: 'primary' }]
        })
      }
    );

    // Handle token expiration
    if (calendarResponse.status === 401 && profile.google_calendar_refresh_token) {
      console.log(`[Sync] Token expirado para ${profile.user_id}, renovando...`);
      const refreshResult = await refreshGoogleToken(profile.google_calendar_refresh_token);
      
      if (refreshResult.success) {
        accessToken = refreshResult.access_token;
        
        // Update token in database
        await supabaseClient
          .from('profiles')
          .update({ google_calendar_token: accessToken })
          .eq('user_id', profile.user_id);

        // Retry with new token
        calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/freeBusy`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timeMin: now.toISOString(),
              timeMax: thirtyDaysFromNow.toISOString(),
              items: [{ id: 'primary' }]
            })
          }
        );
      } else {
        throw new Error('Falha ao renovar token');
      }
    }

    if (!calendarResponse.ok) {
      throw new Error(`Google Calendar API error: ${calendarResponse.status}`);
    }

    const calendarData = await calendarResponse.json();
    const busyPeriods = calendarData.calendars?.primary?.busy || [];

    console.log(`[Sync] ${busyPeriods.length} períodos ocupados encontrados para ${profile.user_id}`);

    // Save busy periods to database
    let savedCount = 0;
    for (const busyPeriod of busyPeriods) {
      const eventId = `freebusy_${new Date(busyPeriod.start).getTime()}_${new Date(busyPeriod.end).getTime()}`;
      
      const { error } = await supabaseClient
        .from('google_calendar_events')
        .upsert({
          user_id: profile.user_id,
          event_id: eventId,
          title: 'Ocupado',
          start_time: busyPeriod.start,
          end_time: busyPeriod.end,
          is_busy: true,
        }, {
          onConflict: 'user_id,event_id'
        });

      if (!error) savedCount++;
    }

    console.log(`[Sync] ${savedCount} eventos salvos para ${profile.user_id}`);
    return savedCount;
  } catch (error: any) {
    console.error(`[Sync] Erro ao sincronizar ${profile.user_id}:`, error.message);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[Cron] Iniciando execução do cron job de sincronização Google Calendar');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    // Verify authentication if request has auth header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => ['admin', 'super_admin'].includes(r.role));

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Permission denied. Admin access required.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if auto-sync is enabled
    const { data: config } = await supabaseClient
      .from('system_configurations')
      .select('value')
      .eq('category', 'google_calendar')
      .eq('key', 'auto_sync_enabled')
      .maybeSingle();

    const autoSyncEnabled = config?.value === 'true' || config?.value === true;

    if (!autoSyncEnabled) {
      console.log('[Cron] Auto-sync está desabilitado, pulando execução');
      return new Response(JSON.stringify({ 
        skipped: true, 
        reason: 'Auto-sync desabilitado' 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all professionals with Google Calendar connected
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('user_id, google_calendar_token, google_calendar_refresh_token')
      .not('google_calendar_token', 'is', null)
      .eq('tipo_usuario', 'profissional');

    console.log(`[Cron] Encontrados ${profiles?.length || 0} profissionais para sincronizar`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Sync each professional
    for (const profile of profiles || []) {
      try {
        await syncUserCalendar(profile, supabaseClient);
        successCount++;
      } catch (error: any) {
        console.error(`[Cron] Erro ao sincronizar ${profile.user_id}:`, error);
        errorCount++;
        errors.push(`${profile.user_id}: ${error.message}`);
      }
    }

    // Update last sync timestamp
    await supabaseClient
      .from('system_configurations')
      .upsert({
        category: 'google_calendar',
        key: 'last_sync_timestamp',
        value: new Date().toISOString(),
        description: 'Timestamp da última sincronização',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'category,key'
      });

    // Update statistics
    await supabaseClient
      .from('system_configurations')
      .upsert({
        category: 'google_calendar',
        key: 'sync_statistics',
        value: JSON.stringify({
          last_run: new Date().toISOString(),
          success_count: successCount,
          error_count: errorCount,
          total_profiles: profiles?.length || 0,
          errors: errors.slice(0, 5) // Only keep last 5 errors
        }),
        description: 'Estatísticas das sincronizações',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'category,key'
      });

    console.log(`[Cron] Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`);

    return new Response(JSON.stringify({
      success: true,
      synced: successCount,
      errors: errorCount,
      total: profiles?.length || 0,
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Cron] Erro fatal no cron job:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
