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

    const { postId, sessionId, referrer, deviceType, timeSpent, completedReading } = await req.json();

    const UUID = /^[0-9a-f-]{36}$/i;
    if (!postId || !sessionId || !UUID.test(String(postId)) || String(sessionId).length > 100) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: postId and sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reader identity comes from the session token, never from the request body.
    let userId: string | null = null;
    const auth = req.headers.get('Authorization') ?? '';
    if (auth.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(auth.slice(7));
      userId = data?.user?.id ?? null;
    }

    // Only published posts count, and each browser session counts once per post.
    const { data: post } = await supabase.from('blog_posts').select('id, slug, status').eq('id', postId).maybeSingle();
    if (!post || post.status !== 'published') {
      return new Response(JSON.stringify({ success: true, skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: seen } = await supabase.from('blog_post_views_tracking').select('id')
      .eq('post_id', postId).eq('session_id', String(sessionId)).limit(1);
    const firstView = !seen?.length;

    if (firstView) {
      const { error: insertError } = await supabase
        .from('blog_post_views_tracking')
        .insert({
          post_id: postId,
          session_id: String(sessionId),
          user_id: userId,
          referrer: referrer ? String(referrer).slice(0, 500) : null,
          device_type: deviceType ? String(deviceType).slice(0, 30) : null,
          time_spent: Math.max(0, Math.min(Number(timeSpent) || 0, 86400)),
          completed_reading: completedReading === true,
        });
      if (insertError) {
        console.error('[Track View] Error inserting tracking:', insertError);
        throw insertError;
      }
      const { error: updateError } = await supabase.rpc('increment_post_views', { post_slug: post.slug });
      if (updateError) console.error('[Track View] Error updating views count:', updateError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Track View] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao registrar visualização' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
