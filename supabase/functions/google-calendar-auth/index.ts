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

    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br';
    const redirectUri = `${appBaseUrl}/google-calendar-callback`;
    console.log('Redirect URI:', redirectUri);
    console.log('App Base URL:', appBaseUrl);

    if (action === 'connect') {
      if (code) {
        console.log('Iniciando troca do authorization code por access token...');
        console.log('Authorization code recebido:', code.substring(0, 10) + '...');
        
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

        console.log('Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token exchange failed:', errorText);
          console.error('Response status:', tokenResponse.status);
          console.error('Response headers:', Object.fromEntries(tokenResponse.headers));
          throw new Error(`Erro ao obter token de acesso: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange successful!');
        console.log('Access token presente:', !!tokenData.access_token);
        console.log('Refresh token presente:', !!tokenData.refresh_token);
        console.log('Token type:', tokenData.token_type);
        console.log('Expires in:', tokenData.expires_in);

        if (!tokenData.access_token) {
          console.error('Nenhum access token retornado pelo Google');
          throw new Error('Google não retornou access token');
        }

        console.log('Salvando tokens no banco de dados para usuário:', user.user.id);

        // Verificar se o usuário existe na tabela profiles
        const { data: profileCheck, error: profileCheckError } = await supabaseClient
          .from('profiles')
          .select('id, user_id')
          .eq('user_id', user.user.id)
          .single();

        if (profileCheckError) {
          console.error('Error checking profile:', profileCheckError);
          throw new Error('Usuário não encontrado no sistema: ' + profileCheckError.message);
        }

        console.log('Profile encontrado:', profileCheck);

        // Detect scope from token response or request
        let detectedScope = 'calendar.readonly'; // Default assumption
        
        // Test which scope was actually granted by testing API access
        try {
          console.log('Testing granted scope by calling Google Calendar API...');
          
          // Try calendar.readonly first (events list)
          const testReadonlyResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1',
            {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
              },
            }
          );
          
          if (testReadonlyResponse.ok) {
            detectedScope = 'calendar.readonly';
            console.log('✅ Full calendar.readonly scope detected');
          } else if (testReadonlyResponse.status === 403) {
            // Try freebusy
            const testFreeBusyResponse = await fetch(
              'https://www.googleapis.com/calendar/v3/freeBusy',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  timeMin: new Date().toISOString(),
                  timeMax: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  items: [{ id: 'primary' }]
                })
              }
            );
            
            if (testFreeBusyResponse.ok) {
              detectedScope = 'calendar.freebusy';
              console.log('✅ Limited calendar.freebusy scope detected');
            } else {
              console.log('❌ Neither scope seems to work, defaulting to readonly');
            }
          }
        } catch (error) {
          console.error('Error testing scope:', error);
          console.log('Using default scope due to test error');
        }

        console.log('Final detected scope:', detectedScope);

        // Save tokens to user profile with detected scope
        console.log('🔄 Iniciando atualização do banco de dados...', {
          userId: user.user.id,
          tokenPresent: !!tokenData.access_token,
          refreshTokenPresent: !!tokenData.refresh_token,
          scope: detectedScope
        });

        const { data: updateData, error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            google_calendar_token: tokenData.access_token,
            google_calendar_refresh_token: tokenData.refresh_token,
            google_calendar_scope: detectedScope,
          })
          .eq('user_id', user.user.id)
          .select('id, user_id, google_calendar_token, google_calendar_scope, google_calendar_refresh_token');

        console.log('📊 Update response:', {
          error: updateError,
          dataReceived: !!updateData,
          recordsAffected: updateData?.length || 0,
          firstRecord: updateData?.[0] || null
        });

        if (updateError) {
          console.error('❌ Error saving Google Calendar tokens:', updateError);
          console.error('Update error details:', JSON.stringify(updateError, null, 2));
          throw new Error('Erro ao salvar tokens de acesso: ' + updateError.message);
        }

        if (!updateData || updateData.length === 0) {
          console.error('❌ No records were updated - this is unexpected!');
          throw new Error('Nenhum registro foi atualizado - possível problema de permissão');
        }

        console.log('✅ Tokens salvos com sucesso!');
        console.log('📋 Dados atualizados:', updateData?.length || 0, 'registros afetados');
        console.log('🔑 Token salvo (primeiros 20 chars):', updateData?.[0]?.google_calendar_token?.substring(0, 20));

        // Verificar se os tokens foram realmente salvos
        const { data: verifyData, error: verifyError } = await supabaseClient
          .from('profiles')
          .select('google_calendar_token, google_calendar_refresh_token, google_calendar_scope')
          .eq('user_id', user.user.id)
          .single();

        if (verifyError) {
          console.error('Error verifying tokens:', verifyError);
        } else {
          console.log('Verificação dos tokens salvos:', {
            hasAccessToken: !!verifyData.google_calendar_token,
            hasRefreshToken: !!verifyData.google_calendar_refresh_token,
            accessTokenLength: verifyData.google_calendar_token?.length || 0,
            scope: verifyData.google_calendar_scope
          });
        }

        const scopeMessage = detectedScope === 'calendar.readonly' 
          ? 'Google Calendar conectado com sucesso! (Acesso completo)' 
          : 'Google Calendar conectado com sucesso! (Acesso básico - apenas períodos ocupados)';

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: scopeMessage,
            scope: detectedScope
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Using only freebusy scope for privacy
        const scope = 'https://www.googleapis.com/auth/calendar.freebusy';
        console.log('Generating auth URL with scope:', scope);
        
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
          google_calendar_scope: null,
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