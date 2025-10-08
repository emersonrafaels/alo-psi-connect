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

    const { postId, sessionId, userId, referrer, deviceType, timeSpent, completedReading } = await req.json();

    if (!postId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: postId and sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Track View] Post: ${postId}, Session: ${sessionId}, User: ${userId || 'anonymous'}`);

    // Inserir registro de visualização
    const { error: insertError } = await supabase
      .from('blog_post_views_tracking')
      .insert({
        post_id: postId,
        session_id: sessionId,
        user_id: userId || null,
        referrer: referrer || null,
        device_type: deviceType || null,
        time_spent: timeSpent || 0,
        completed_reading: completedReading || false,
      });

    if (insertError) {
      console.error('[Track View] Error inserting tracking:', insertError);
      throw insertError;
    }

    // Incrementar contador de views no post
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ views_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', postId);

    if (updateError) {
      console.error('[Track View] Error updating views count:', updateError);
    }

    console.log(`[Track View] Successfully tracked view for post ${postId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Track View] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
