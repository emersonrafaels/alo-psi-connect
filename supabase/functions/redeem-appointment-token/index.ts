import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    if (typeof token !== "string" || token.length < 10 || token.length > 200) {
      return jsonResponse(400, { error: "invalid_token" });
    }

    // 1) Look up the token (must be unused and not expired)
    const { data: tokenData, error: tokenError } = await supabase
      .from("agendamento_tokens")
      .select("token, agendamento_id, email, expires_at, used")
      .eq("token", token)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (tokenError || !tokenData) {
      return jsonResponse(404, { error: "invalid_token" });
    }

    // 2) Load the appointment
    const { data: appointmentData, error: appointmentError } = await supabase
      .from("agendamentos")
      .select(`
        id,
        nome_paciente,
        email_paciente,
        telefone_paciente,
        data_consulta,
        horario,
        valor,
        status,
        observacoes,
        profissionais:professional_id (
          display_name,
          profissao,
          telefone,
          email_secundario
        )
      `)
      .eq("id", tokenData.agendamento_id)
      .maybeSingle();

    if (appointmentError || !appointmentData) {
      return jsonResponse(404, { error: "appointment_not_found" });
    }

    // 3) Ensure the token email matches the appointment email
    if (tokenData.email !== appointmentData.email_paciente) {
      return jsonResponse(403, { error: "email_mismatch" });
    }

    // 4) Mark token as used (only if still unused, to avoid races)
    await supabase
      .from("agendamento_tokens")
      .update({ used: true })
      .eq("token", token)
      .eq("used", false);

    const profissional = Array.isArray(appointmentData.profissionais)
      ? appointmentData.profissionais[0]
      : appointmentData.profissionais;

    return jsonResponse(200, {
      appointment: {
        id: appointmentData.id,
        nome_paciente: appointmentData.nome_paciente,
        email_paciente: appointmentData.email_paciente,
        telefone_paciente: appointmentData.telefone_paciente,
        data_consulta: appointmentData.data_consulta,
        horario: appointmentData.horario,
        valor: appointmentData.valor,
        status: appointmentData.status,
        observacoes: appointmentData.observacoes,
        profissionais: profissional,
      },
    });
  } catch (err) {
    console.error("redeem-appointment-token error:", err);
    return jsonResponse(500, { error: "internal_error" });
  }
});
