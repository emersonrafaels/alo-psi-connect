import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('[Scheduled Posts] Verificando posts agendados...');

    // Chamar a função do banco de dados
    const { error: functionError } = await supabaseAdmin.rpc('publish_scheduled_posts');

    if (functionError) {
      console.error('[Scheduled Posts] Erro ao publicar:', functionError);
      throw functionError;
    }

    // Buscar posts que foram publicados
    const { data: publishedPosts, error: selectError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, author_id')
      .eq('status', 'published')
      .gte('published_at', new Date(Date.now() - 60000).toISOString()); // Publicados no último minuto

    if (selectError) {
      console.error('[Scheduled Posts] Erro ao buscar posts publicados:', selectError);
    } else {
      console.log(`[Scheduled Posts] ${publishedPosts?.length || 0} posts publicados`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        published_count: publishedPosts?.length || 0,
        message: 'Posts agendados verificados e publicados',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Scheduled Posts] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
