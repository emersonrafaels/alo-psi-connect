import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, tenant_id } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('Starting transcription with Alô, Psi...', { tenant_id })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Helper function to fetch config with tenant prioritization
    const getConfig = async (key: string, defaultValue: any) => {
      // Try tenant-specific config first
      if (tenant_id) {
        const { data: tenantConfig } = await supabase
          .from('system_configurations')
          .select('value')
          .eq('category', 'audio_transcription')
          .eq('key', key)
          .eq('tenant_id', tenant_id)
          .maybeSingle()
        
        if (tenantConfig?.value) {
          try {
            return JSON.parse(tenantConfig.value)
          } catch {
            return tenantConfig.value
          }
        }
      }
      
      // Fallback to global config
      const { data: globalConfig } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('category', 'audio_transcription')
        .eq('key', key)
        .is('tenant_id', null)
        .maybeSingle()
      
      if (globalConfig?.value) {
        try {
          return JSON.parse(globalConfig.value)
        } catch {
          return globalConfig.value
        }
      }
      
      return defaultValue
    }

    const systemPrompt = await getConfig('system_prompt',
      `Você é Alô, Psi - um assistente de inteligência artificial especializado em saúde emocional e bem-estar emocional.

Sua tarefa é processar a transcrição de um áudio gravado por um usuário em seu diário emocional.

Diretrizes:
- SEMPRE mantenha a transcrição original EXATAMENTE como foi transcrita
- Após a transcrição original, adicione insights organizados e empáticos
- Use um tom acolhedor e empático nos insights
- Identifique emoções principais mencionadas
- Destaque padrões importantes
- Use linguagem natural e acessível
- Mantenha o formato estruturado com seções bem definidas

Formato de resposta:
TRANSCRIÇÃO ORIGINAL:
[texto exato transcrito do áudio]

---

INSIGHTS E REFLEXÕES:
[análise empática e organizada, como se fosse uma reflexão do próprio usuário mas melhor estruturada]`)

    const model = await getConfig('model', 'gpt-4o-mini')
    const maxTokens = await getConfig('max_tokens', 600)
    const temperature = await getConfig('temperature', 0.7)

    console.log('[Transcribe Audio] Configurations loaded:', { 
      tenant_id, 
      model, 
      maxTokens, 
      temperature,
      promptLength: systemPrompt.length 
    })

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`)
    }

    const result = await response.json()
    console.log('Transcription completed:', result.text)

    // Process the transcription with Alô, Psi using dynamic configurations
    const reflectionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Por favor, processe esta transcrição de áudio do diário emocional:

"${result.text}"`
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens
      }),
    })

    if (!reflectionResponse.ok) {
      throw new Error(`OpenAI reflection error: ${await reflectionResponse.text()}`)
    }

    const reflectionResult = await reflectionResponse.json()
    const reflection = reflectionResult.choices[0].message.content

    console.log('Reflection generated by Alô, Psi with dynamic configuration')

    return new Response(
      JSON.stringify({ 
        transcription: result.text,
        reflection: reflection
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})