import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Fix Post] Iniciando correção do post...');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const correctedContent = `Para conseguir colocar em prática o autocuidado dentro de uma carreira médica, é necessário compreender o conceito primário de auto-compaixão e suas vertentes:

# O Que é Auto-Compaixão?

Auto-compaixão é a habilidade de tratar a si mesmo com a mesma gentileza, preocupação e apoio que ofereceríamos a um bom amigo. Ela se compõe de três elementos principais: bondade para consigo mesmo, reconhecimento da nossa humanidade comum e uma atitude equilibrada em relação aos nossos sentimentos e experiências.

## Por que é Importante na Medicina?

Dentro da prática médica, enfrentar diariamente desafios intensos e situações de alta pressão é uma norma. Médicos e estudantes de medicina operam frequentemente sob o peso de expectativas elevadas, tanto pessoais quanto profissionais, lidando com a saúde e, muitas vezes, a vida dos pacientes. Nesse ambiente, a auto-compaixão não é apenas uma ferramenta valiosa; é uma necessidade fundamental. Cultivar auto-compaixão permite que os médicos enfrentem esses desafios de maneira mais resiliente, reduzindo os sentimentos de isolamento, frustração e falha.

## Benefícios da Auto-Compaixão para Médicos

**1.** Redução do Estresse e Prevenção de Burnout: A auto-compaixão tem mostrado ser eficaz na redução do estresse e na prevenção da exaustão emocional. Médicos que praticam auto-compaixão relatam menores níveis de estresse e ansiedade.

**2.** Melhoria da Saúde Mental: A prática da auto-compaixão está associada a uma melhor saúde mental, incluindo redução da depressão e aumento da satisfação no trabalho.

**3.** Relacionamentos Melhores: A auto-compaixão pode melhorar a empatia e a paciência dos médicos, elementos cruciais para a criação de relações de confiança com os pacientes.

## Como Praticar Auto-Compaixão

**1.** Autoconhecimento e Autocuidado: Reconhecer as próprias necessidades e limitações é o primeiro passo. Isso pode incluir garantir descanso adequado, nutrição, exercícios e tempo para relaxamento e hobbies.

**2.** Mindfulness: Práticas de atenção plena ajudam a observar nossos pensamentos e sentimentos sem julgamento, reconhecendo-os como passageiros e não como definições de quem somos.

**3.** Diálogo Interno Positivo: Transformar a crítica interna em um diálogo mais amável e encorajador é essencial. Isso pode ser praticado através de afirmações positivas e lembrando-se de celebrar pequenas conquistas.

**4.** Conexão Humana: Lembrar que desafios e falhas são experiências humanas comuns ajuda a reduzir o isolamento e a vergonha que muitas vezes acompanham os erros percebidos.

## Conclusão

A prática da auto-compaixão não é apenas um ato de bondade para consigo mesmo, mas uma estratégia essencial para médicos que desejam manter sua saúde mental e melhorar a qualidade do cuidado aos pacientes. Ao adotar essas práticas, médicos podem não só salvaguardar sua própria saúde emocional, mas também oferecer um cuidado mais humano e empático a todos aqueles que dependem de suas habilidades.`;

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({
        content: correctedContent,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', '3175eaef-b4f2-41df-b5a9-3258756408f0')
      .select();

    if (error) {
      console.error('[Fix Post] Erro ao atualizar:', error);
      throw error;
    }

    console.log('[Fix Post] Post corrigido com sucesso:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Post corrigido com sucesso!',
        post: data[0]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Fix Post] Erro:', error);
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
