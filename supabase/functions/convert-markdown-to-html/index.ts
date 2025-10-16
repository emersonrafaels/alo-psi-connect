import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { marked } from 'https://esm.sh/marked@14.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Convert MD→HTML] Iniciando conversão de posts...');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todos os posts
    const { data: posts, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, content, slug, title');

    if (fetchError) {
      console.error('[Convert MD→HTML] Erro ao buscar posts:', fetchError);
      throw fetchError;
    }

    console.log(`[Convert MD→HTML] Encontrados ${posts?.length || 0} posts para converter`);

    const updates = [];
    let converted = 0;
    let skipped = 0;

    for (const post of posts || []) {
      try {
        // Verificar se já é HTML (começa com <p>, <h1>, etc)
        const isAlreadyHtml = /^<[a-z][\s\S]*>/i.test(post.content.trim());
        
        if (isAlreadyHtml) {
          console.log(`[Convert MD→HTML] Post "${post.slug}" já está em HTML, pulando...`);
          skipped++;
          continue;
        }

        // Converter Markdown para HTML
        const htmlContent = await marked(post.content, {
          breaks: true,
          gfm: true,
        });
        
        updates.push({
          id: post.id,
          slug: post.slug,
          title: post.title,
          content: htmlContent
        });

        console.log(`[Convert MD→HTML] Post "${post.slug}" convertido`);
      } catch (error) {
        console.error(`[Convert MD→HTML] Erro ao converter post "${post.slug}":`, error);
      }
    }

    // Atualizar posts em batch
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('blog_posts')
        .update({ 
          content: update.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`[Convert MD→HTML] Erro ao atualizar post "${update.slug}":`, updateError);
      } else {
        converted++;
      }
    }

    console.log(`[Convert MD→HTML] Conversão concluída: ${converted} convertidos, ${skipped} já em HTML`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        converted,
        skipped,
        total: posts?.length || 0,
        posts: updates.map(u => ({ slug: u.slug, title: u.title }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Convert MD→HTML] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
