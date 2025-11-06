import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = await req.json();

    if (!slug) {
      throw new Error('Tenant slug is required');
    }

    console.log(`[Cache Invalidation] Invalidating cache for tenant: ${slug}`);

    // Retornar instrução para o frontend invalidar o cache
    // O cache é gerenciado no localStorage do navegador, então o frontend
    // precisa remover a key correspondente
    return new Response(
      JSON.stringify({ 
        success: true,
        slug,
        cacheKey: `tenant_${slug}_cache`,
        message: `Cache invalidation signal sent for tenant: ${slug}`,
        instructions: 'Clear localStorage key and dispatch tenant-updated event'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('[Cache Invalidation] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
