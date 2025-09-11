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
    // Get the authorization header first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Header de autorização não encontrado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user.user) {
      console.error('Authentication error:', userError);
      throw new Error('Usuário não autenticado');
    }

    const { action, code }: GoogleCalendarAuthRequest = await req.json();

    const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-auth`;

    if (!clientId || !clientSecret) {
      throw new Error('Configuração do Google Calendar não encontrada');
    }

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
          throw new Error('Erro ao obter token de acesso');
        }

        const tokenData = await tokenResponse.json();

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
        const scope = 'https://www.googleapis.com/auth/calendar.readonly';
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);