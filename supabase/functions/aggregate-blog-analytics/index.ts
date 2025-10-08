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

    console.log('[Aggregate Analytics] Starting daily aggregation...');

    // Calcular data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`[Aggregate Analytics] Processing data for ${yesterdayStr}`);

    // Buscar todos os posts com visualizações ontem
    const { data: views, error: viewsError } = await supabase
      .from('blog_post_views_tracking')
      .select('post_id, session_id, time_spent, completed_reading')
      .gte('viewed_at', `${yesterdayStr}T00:00:00Z`)
      .lt('viewed_at', `${yesterdayStr}T23:59:59Z`);

    if (viewsError) {
      console.error('[Aggregate Analytics] Error fetching views:', viewsError);
      throw viewsError;
    }

    console.log(`[Aggregate Analytics] Found ${views?.length || 0} views to process`);

    // Agrupar por post_id
    const postMetrics: Record<string, {
      views_count: number;
      unique_visitors: Set<string>;
      total_time_spent: number;
      completed_count: number;
    }> = {};

    views?.forEach(view => {
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
    const updates = [];
    for (const [postId, metrics] of Object.entries(postMetrics)) {
      const avgTimeSpent = metrics.total_time_spent / metrics.views_count;
      const completionRate = (metrics.completed_count / metrics.views_count) * 100;

      const { error: upsertError } = await supabase
        .from('blog_analytics_daily')
        .upsert({
          post_id: postId,
          date: yesterdayStr,
          views_count: metrics.views_count,
          unique_visitors: metrics.unique_visitors.size,
          avg_time_spent: Math.round(avgTimeSpent),
          completion_rate: Math.round(completionRate * 100) / 100,
        }, {
          onConflict: 'post_id,date'
        });

      if (upsertError) {
        console.error(`[Aggregate Analytics] Error upserting analytics for post ${postId}:`, upsertError);
      } else {
        updates.push(postId);
      }
    }

    console.log(`[Aggregate Analytics] Successfully aggregated ${updates.length} posts`);

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
        processed_posts: updates.length,
        date: yesterdayStr 
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
