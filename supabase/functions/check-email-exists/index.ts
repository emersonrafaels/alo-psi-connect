import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: CheckEmailRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se existe um usuário com este email
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000 // Buscar todos os usuários para filtrar por email
    });

    if (authError) {
      console.error("Erro ao buscar usuários:", authError);
      throw authError;
    }

    // Filtrar por email específico
    const existingUser = authUser.users.find(user => user.email === email);
    
    if (existingUser) {
      // Verificar se tem perfil e se é profissional
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tipo_usuario')
        .eq('user_id', existingUser.id)
        .single();

      const { data: professional } = await supabase
        .from('profissionais')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      return new Response(
        JSON.stringify({ 
          exists: true,
          hasProfile: !!profile,
          isProfessional: !!professional,
          profileType: profile?.tipo_usuario
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        exists: false,
        hasProfile: false,
        isProfessional: false,
        profileType: null
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Erro na função check-email-exists:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);