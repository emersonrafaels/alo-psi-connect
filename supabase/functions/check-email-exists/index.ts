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

    // Filtrar por email específico (case-insensitive)
    const existingUser = authUser.users.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (existingUser) {
      // Only existence is returned; account type and profile details stay private.
      return new Response(JSON.stringify({ exists: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ exists: false }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Erro na função check-email-exists:", error);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar email' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);