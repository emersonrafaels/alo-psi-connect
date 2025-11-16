import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogActionRequest {
  institution_id: string;
  action_type: string; // 'create', 'update', 'delete', 'link_user', 'unlink_user', 'add_professional', 'remove_professional', 'create_coupon', 'update_coupon', 'delete_coupon'
  entity_type: string; // 'institution', 'user', 'professional', 'coupon'
  entity_id?: string;
  changes_summary?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: LogActionRequest = await req.json();
    const { institution_id, action_type, entity_type, entity_id, changes_summary, metadata } = body;

    // Validate required fields
    if (!institution_id || !action_type || !entity_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: institution_id, action_type, entity_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert audit log
    const { data: auditLog, error: insertError } = await supabase
      .from('institution_audit_log')
      .insert({
        institution_id,
        action_type,
        entity_type,
        entity_id: entity_id || null,
        performed_by: user.id,
        changes_summary: changes_summary || null,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting audit log:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create audit log', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Audit log created:', {
      id: auditLog.id,
      action_type,
      entity_type,
      institution_id,
      performed_by: user.id
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        audit_log: auditLog 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
