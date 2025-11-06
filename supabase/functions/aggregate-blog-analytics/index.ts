import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: roles, error: rolesError } = await supabase
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

    // Parse request body for parameters
    const { mode, include_today } = await req.json().catch(() => ({ mode: 'incremental', include_today: false }));

    console.log(`[Aggregate Analytics] Starting aggregation in ${mode} mode...`);

    let datesToProcess: string[] = [];

    if (mode === 'full') {
      // Get first and last view dates from tracking table
      const { data: dateRange, error: rangeError } = await supabase
        .from('blog_post_views_tracking')
        .select('viewed_at')
        .order('viewed_at', { ascending: true })
        .limit(1);

      if (rangeError) {
        console.error('[Aggregate Analytics] Error fetching date range:', rangeError);
        throw rangeError;
      }

      if (!dateRange || dateRange.length === 0) {
        console.log('[Aggregate Analytics] No views found to process');
        return new Response(
          JSON.stringify({ success: true, processed_posts: 0, processed_days: 0, message: 'No views to process' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const firstDate = new Date(dateRange[0].viewed_at);
      const lastDate = include_today ? new Date() : new Date(Date.now() - 86400000); // Yesterday if not including today

      // Generate array of dates to process
      const currentDate = new Date(firstDate);
      currentDate.setHours(0, 0, 0, 0);
      const endDate = new Date(lastDate);
      endDate.setHours(0, 0, 0, 0);

      while (currentDate <= endDate) {
        datesToProcess.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`[Aggregate Analytics] Processing ${datesToProcess.length} days from ${datesToProcess[0]} to ${datesToProcess[datesToProcess.length - 1]}`);
    } else {
      // Incremental mode: process yesterday only
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      datesToProcess = [yesterday.toISOString().split('T')[0]];
      console.log(`[Aggregate Analytics] Processing data for ${datesToProcess[0]}`);
    }

    // Process each date
    const allUpdates = new Set<string>();
    let totalViews = 0;

    for (const dateStr of datesToProcess) {
      // Buscar todos os posts com visualizações neste dia
      const { data: views, error: viewsError } = await supabase
        .from('blog_post_views_tracking')
        .select('post_id, session_id, time_spent, completed_reading')
        .gte('viewed_at', `${dateStr}T00:00:00Z`)
        .lt('viewed_at', `${dateStr}T23:59:59Z`);

      if (viewsError) {
        console.error(`[Aggregate Analytics] Error fetching views for ${dateStr}:`, viewsError);
        continue;
      }

      if (!views || views.length === 0) {
        console.log(`[Aggregate Analytics] No views found for ${dateStr}`);
        continue;
      }

      totalViews += views.length;
      console.log(`[Aggregate Analytics] Found ${views.length} views for ${dateStr}`);

      // Agrupar por post_id
      const postMetrics: Record<string, {
        views_count: number;
        unique_visitors: Set<string>;
        total_time_spent: number;
        completed_count: number;
      }> = {};

      views.forEach(view => {
        if (!postMetrics[view.post_id]) {
          postMetrics[view.post_id] = {
            views_count: 0,
            unique_visitors: new Set(),
            total_time_spent: 0,
            completed_count: 0,
          };
        }

        postMetrics[view.post_id].views_count += 1;
        postMetrics[view.post_id].unique_visitors.add(view.session_id);
        postMetrics[view.post_id].total_time_spent += view.time_spent || 0;
        if (view.completed_reading) {
          postMetrics[view.post_id].completed_count += 1;
        }
      });

      // Inserir ou atualizar analytics diários
      for (const [postId, metrics] of Object.entries(postMetrics)) {
        const avgTimeSpent = metrics.total_time_spent / metrics.views_count;
        const completionRate = (metrics.completed_count / metrics.views_count) * 100;

        const { error: upsertError } = await supabase
          .from('blog_analytics_daily')
          .upsert({
            post_id: postId,
            date: dateStr,
            views_count: metrics.views_count,
            unique_visitors: metrics.unique_visitors.size,
            avg_time_spent: Math.round(avgTimeSpent),
            completion_rate: Math.round(completionRate * 100) / 100,
          }, {
            onConflict: 'post_id,date'
          });

        if (upsertError) {
          console.error(`[Aggregate Analytics] Error upserting analytics for post ${postId} on ${dateStr}:`, upsertError);
        } else {
          allUpdates.add(postId);
        }
      }

      console.log(`[Aggregate Analytics] Processed ${Object.keys(postMetrics).length} posts for ${dateStr}`);
    }

    console.log(`[Aggregate Analytics] Successfully aggregated ${allUpdates.size} unique posts across ${datesToProcess.length} days`);

    // Limpar dados de tracking antigos (> 90 dias)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { error: deleteError } = await supabase
      .from('blog_post_views_tracking')
      .delete()
      .lt('viewed_at', ninetyDaysAgo.toISOString());

    if (deleteError) {
      console.error('[Aggregate Analytics] Error deleting old tracking data:', deleteError);
    } else {
      console.log('[Aggregate Analytics] Cleaned up old tracking data (>90 days)');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_posts: allUpdates.size,
        processed_days: datesToProcess.length,
        total_views: totalViews,
        mode: mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Aggregate Analytics] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
