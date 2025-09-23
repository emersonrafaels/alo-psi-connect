import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarAuthRequest {
  action: 'connect' | 'disconnect';
  code?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando google-calendar-auth function...');
    
    // Check if required secrets are available
    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    
    console.log('Google Calendar Client ID available:', !!clientId);
    console.log('Google Calendar Client Secret available:', !!clientSecret);
    
    if (!clientId || !clientSecret) {
      console.error('Google Calendar credentials not configured');
      throw new Error('Google Calendar credentials not configured. Please contact administrator.');
    }
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('Header de autorização não encontrado');
      throw new Error('Header de autorização não encontrado');
    }

    // Create Supabase client with service role for auth validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the authenticated user using the token
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extraído, validando usuário...');
    
    const { data: user, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user.user) {
      console.error('Authentication error:', userError);
      throw new Error('Usuário não autenticado: ' + (userError?.message || 'Token inválido'));
    }

    console.log('Usuário autenticado com sucesso:', user.user.id);

    const { action, code }: GoogleCalendarAuthRequest = await req.json();
    console.log('Action requested:', action);

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-auth`;
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br';
    console.log('Redirect URI:', redirectUri);
    console.log('App Base URL:', appBaseUrl);

    if (action === 'connect') {
      if (code) {
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token exchange failed:', errorText);
          throw new Error(`Erro ao obter token de acesso: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange successful:', !!tokenData.access_token);

        // Save tokens to user profile or professional table
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            google_calendar_token: tokenData.access_token,
            google_calendar_refresh_token: tokenData.refresh_token,
          })
          .eq('user_id', user.user.id);

        if (updateError) {
          console.error('Error saving Google Calendar tokens:', updateError);
          throw new Error('Erro ao salvar tokens de acesso');
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Google Calendar conectado com sucesso!' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Generate authorization URL
        const scope = 'https://www.googleapis.com/auth/calendar.events';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scope)}&` +
          `access_type=offline&` +
          `prompt=consent`;

        return new Response(
          JSON.stringify({ authUrl }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (action === 'disconnect') {
      // Remove tokens from user profile
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          google_calendar_token: null,
          google_calendar_refresh_token: null,
        })
        .eq('user_id', user.user.id);

      if (updateError) {
        throw new Error('Erro ao desconectar Google Calendar');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google Calendar desconectado com sucesso!' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in google-calendar-auth function:', error);
    
    // Melhor tratamento de diferentes tipos de erro
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message.includes('credentials not configured')) {
      statusCode = 503;
      errorMessage = 'Google Calendar credentials not configured. Please contact administrator.';
    } else if (error.message.includes('redirect_uri_mismatch')) {
      statusCode = 400;
      errorMessage = 'OAuth redirect URI mismatch. Please check Google Cloud Console configuration.';
    } else if (error.message.includes('access_denied')) {
      statusCode = 403;
      errorMessage = 'Access denied by Google. Please check OAuth consent screen configuration.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);