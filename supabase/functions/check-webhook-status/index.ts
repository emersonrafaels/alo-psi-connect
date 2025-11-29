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
    const { webhooks } = await req.json();
    
    if (!Array.isArray(webhooks)) {
      throw new Error('webhooks must be an array');
    }
    
    console.log('[check-webhook-status] Checking webhooks:', webhooks);
    
    const results = await Promise.all(
      webhooks.map(async ({ type, url }) => {
        if (!url) {
          console.log(`[${type}] No URL configured`);
          return { type, status: 'not_configured' };
        }
        
        try {
          // Attempt GET request with health check parameter and timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          console.log(`[${type}] Testing webhook: ${url}`);
          
          const response = await fetch(`${url}?health=check`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
          
          // Any response indicates server is responding
          // N8N webhooks typically return 404 or 405 for GET requests
          console.log(`[${type}] Response status: ${response.status}`);
          
          if (response.ok || response.status === 404 || response.status === 405) {
            return { type, status: 'online', code: response.status };
          } else {
            return { type, status: 'offline', code: response.status };
          }
        } catch (error) {
          console.warn(`[${type}] GET request failed, trying HEAD:`, error.message);
          
          // Fallback to HEAD request
          try {
            const headResponse = await fetch(url, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
            
            console.log(`[${type}] HEAD response status: ${headResponse.status}`);
            return { type, status: 'online', code: headResponse.status };
          } catch (headError) {
            console.error(`[${type}] Both GET and HEAD failed:`, headError.message);
            return { type, status: 'offline', error: headError.message };
          }
        }
      })
    );

    console.log('[check-webhook-status] Results:', results);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[check-webhook-status] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        results: []
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
