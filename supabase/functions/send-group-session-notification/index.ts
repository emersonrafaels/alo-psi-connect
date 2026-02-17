import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getBccEmails } from "../_shared/get-bcc-emails.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EventType =
  | "registration_confirmed"
  | "registration_cancelled"
  | "session_approved"
  | "session_rejected"
  | "session_cancelled"
  | "reminder_24h"
  | "reminder_1h"
  | "followup";

interface NotificationRequest {
  event_type: EventType;
  session_id: string;
  user_email?: string;
  user_name?: string;
  review_notes?: string;
  cancellation_reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: NotificationRequest = await req.json();
    const { event_type, session_id } = body;

    console.log(`[group-session-notification] event=${event_type} session=${session_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch session data with tenant info
    const { data: session, error: sessionError } = await supabase
      .from("group_sessions")
      .select(`
        *,
        tenants!inner (
          name,
          slug,
          primary_color,
          logo_url,
          admin_email
        )
      `)
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      console.error("[group-session-notification] Session not found:", sessionError);
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const tenant = session.tenants;
    let tenantName = tenant?.name || "Rede Bem Estar";
    const tenantSlug = tenant?.slug || "default";
    const tenantColor = tenant?.primary_color || "#7c3aed";
    const tenantLogo = tenant?.logo_url || null;
    const adminEmail = tenant?.admin_email || "redebemestar1@gmail.com";

    if (tenantSlug === "medcos") tenantName = "MEDCOS";

    // Buscar emails BCC configurados
    const bccEmails = await getBccEmails(supabase, session.tenant_id);

    const primaryColor = tenantColor.startsWith("#") ? tenantColor : `hsl(${tenantColor})`;
    const siteBaseUrl = "https://alopsi.com.br";
    const tenantPath = tenantSlug !== "default" ? `/${tenantSlug}` : "";

    // Format session date
    const sessionDate = new Date(session.session_date + "T00:00:00");
    const dataFormatada = sessionDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const horarioFormatado = session.start_time?.slice(0, 5) || "";

    const sessionTypeLabels: Record<string, string> = {
      palestra: "Palestra",
      workshop: "Workshop",
      roda_conversa: "Roda de Conversa",
    };
    const sessionTypeLabel = sessionTypeLabels[session.session_type] || session.session_type;

    // Get facilitator info
    let facilitatorName = "Equipe organizadora";
    if (session.professional_id) {
      const { data: prof } = await supabase
        .from("profissionais")
        .select("display_name, user_email")
        .eq("id", session.professional_id)
        .single();
      if (prof) facilitatorName = prof.display_name || facilitatorName;
    }

    // Dispatch based on event_type
    const results: string[] = [];

    if (event_type === "registration_confirmed") {
      const email = body.user_email;
      const name = body.user_name || "Participante";
      if (!email) throw new Error("user_email is required for registration_confirmed");

      const html = buildRegistrationEmail({
        tenantName, tenantLogo, primaryColor,
        title: session.title,
        description: session.description,
        sessionType: sessionTypeLabel,
        date: dataFormatada,
        time: horarioFormatado,
        duration: session.duration_minutes,
        facilitator: facilitatorName,
        meetingLink: session.meeting_link,
        whatsappLink: session.whatsapp_group_link,
        participantName: name,
        encontrosUrl: `${siteBaseUrl}${tenantPath}/encontros`,
      });

      const { error } = await resend.emails.send({
        from: `${tenantName} <noreply@redebemestar.com.br>`,
        to: [email],
        bcc: [...(adminEmail ? [adminEmail] : []), ...bccEmails].length > 0 
          ? [...(adminEmail ? [adminEmail] : []), ...bccEmails] 
          : undefined,
        subject: `✅ Inscrição Confirmada - ${session.title}`,
        html,
      });
      if (error) console.error("[group-session-notification] Resend error:", error);
      else results.push(`registration_confirmed sent to ${email}`);
    }

    if (event_type === "session_approved" || event_type === "session_rejected") {
      // Find facilitator email via submitted_by (user_id)
      if (!session.submitted_by) {
        console.warn("[group-session-notification] No submitted_by for session");
        return new Response(JSON.stringify({ success: true, skipped: "no submitted_by" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, email")
        .eq("user_id", session.submitted_by)
        .single();

      if (!profile?.email) {
        console.warn("[group-session-notification] Facilitator email not found");
        return new Response(JSON.stringify({ success: true, skipped: "no facilitator email" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const isApproved = event_type === "session_approved";
      const html = buildStatusEmail({
        tenantName, tenantLogo, primaryColor,
        facilitatorName: profile.nome || "Facilitador(a)",
        title: session.title,
        sessionType: sessionTypeLabel,
        date: dataFormatada,
        time: horarioFormatado,
        isApproved,
        reviewNotes: body.review_notes || session.review_notes,
        encontrosUrl: `${siteBaseUrl}${tenantPath}/encontros`,
      });

      const { error } = await resend.emails.send({
        from: `${tenantName} <noreply@redebemestar.com.br>`,
        to: [profile.email],
        bcc: bccEmails.length > 0 ? bccEmails : undefined,
        subject: isApproved
          ? `🎉 Seu encontro foi aprovado - ${session.title}`
          : `❌ Encontro não aprovado - ${session.title}`,
        html,
      });
      if (error) console.error("[group-session-notification] Resend error:", error);
      else results.push(`${event_type} sent to ${profile.email}`);
    }

    if (event_type === "session_cancelled") {
      // Notify all confirmed registrations
      const { data: registrations } = await supabase
        .from("group_session_registrations")
        .select("user_id")
        .eq("session_id", session_id)
        .eq("status", "confirmed");

      if (registrations && registrations.length > 0) {
        const userIds = registrations.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email, nome, user_id")
          .in("user_id", userIds);

        for (const profile of profiles || []) {
          const html = buildCancellationEmail({
            tenantName, tenantLogo, primaryColor,
            participantName: profile.nome || "Participante",
            title: session.title,
            date: dataFormatada,
            time: horarioFormatado,
            reason: body.cancellation_reason || "O encontro foi cancelado pela equipe organizadora.",
            encontrosUrl: `${siteBaseUrl}${tenantPath}/encontros`,
          });

          const { error } = await resend.emails.send({
            from: `${tenantName} <noreply@redebemestar.com.br>`,
            to: [profile.email],
            bcc: bccEmails.length > 0 ? bccEmails : undefined,
            subject: `⚠️ Encontro Cancelado - ${session.title}`,
            html,
          });
          if (error) console.error(`[group-session-notification] Cancel email error for ${profile.email}:`, error);
          else results.push(`session_cancelled sent to ${profile.email}`);
        }
      }
    }

    console.log(`[group-session-notification] Done. Results:`, results);

    return new Response(JSON.stringify({ success: true, sent: results.length, details: results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[group-session-notification] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

// ========== Email Templates ==========

function emailWrapper(tenantName: string, tenantLogo: string | null, primaryColor: string, content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 32px 20px; text-align: center;">
      ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 50px; margin-bottom: 12px;" />` : ""}
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${tenantName}</h1>
    </div>
    <div style="padding: 32px 24px;">${content}</div>
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">Email enviado automaticamente por ${tenantName}</p>
    </div>
  </div>
</body>
</html>`;
}

interface RegistrationEmailData {
  tenantName: string; tenantLogo: string | null; primaryColor: string;
  title: string; description: string; sessionType: string;
  date: string; time: string; duration: number;
  facilitator: string; meetingLink?: string | null; whatsappLink?: string | null;
  participantName: string; encontrosUrl: string;
}

function buildRegistrationEmail(d: RegistrationEmailData): string {
  const linksSection = [];
  if (d.meetingLink) {
    linksSection.push(`
      <a href="${d.meetingLink}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-right: 8px;">
        🎥 Entrar na Reunião
      </a>`);
  }
  if (d.whatsappLink) {
    linksSection.push(`
      <a href="${d.whatsappLink}" style="display: inline-block; background-color: #25D366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        💬 Grupo do WhatsApp
      </a>`);
  }

  const content = `
    <h2 style="color: #1f2937; margin: 0 0 8px;">🎉 Inscrição Confirmada!</h2>
    <p style="color: #6b7280; margin: 0 0 24px;">Olá, <strong>${d.participantName}</strong>! Sua inscrição foi confirmada.</p>

    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 0 0 20px; border-left: 4px solid ${d.primaryColor};">
      <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 18px;">${d.title}</h3>
      <p style="color: #6b7280; margin: 0 0 16px; font-size: 14px;">${d.description}</p>
      <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">📌 <strong>Tipo:</strong> ${d.sessionType}</p>
      <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">📅 <strong>Data:</strong> ${d.date}</p>
      <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">🕐 <strong>Horário:</strong> ${d.time} • ${d.duration}min</p>
      <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">👤 <strong>Facilitador:</strong> ${d.facilitator}</p>
    </div>

    ${linksSection.length > 0 ? `<div style="margin: 24px 0; text-align: center;">${linksSection.join("")}</div>` : ""}

    <div style="margin: 24px 0; text-align: center;">
      <a href="${d.encontrosUrl}" style="display: inline-block; background-color: ${d.primaryColor}; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Ver Todos os Encontros
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 24px 0 0;">
      Caso queira cancelar, acesse a página "Meus Encontros" na plataforma.
    </p>`;

  return emailWrapper(d.tenantName, d.tenantLogo, d.primaryColor, content);
}

interface StatusEmailData {
  tenantName: string; tenantLogo: string | null; primaryColor: string;
  facilitatorName: string; title: string; sessionType: string;
  date: string; time: string; isApproved: boolean;
  reviewNotes?: string | null; encontrosUrl: string;
}

function buildStatusEmail(d: StatusEmailData): string {
  const statusColor = d.isApproved ? "#22c55e" : "#ef4444";
  const statusIcon = d.isApproved ? "✅" : "❌";
  const statusText = d.isApproved ? "Aprovado e Publicado" : "Não Aprovado";

  const content = `
    <h2 style="color: #1f2937; margin: 0 0 8px;">${statusIcon} Encontro ${statusText}</h2>
    <p style="color: #6b7280; margin: 0 0 24px;">Olá, <strong>${d.facilitatorName}</strong>!</p>

    <div style="background-color: ${d.isApproved ? "#dcfce7" : "#fef2f2"}; padding: 16px; border-radius: 8px; margin: 0 0 20px; border-left: 4px solid ${statusColor};">
      <p style="margin: 0; color: ${d.isApproved ? "#15803d" : "#b91c1c"}; font-weight: 600;">
        ${d.isApproved ? "Seu encontro foi aprovado e já está visível para os participantes!" : "Infelizmente seu encontro não foi aprovado neste momento."}
      </p>
    </div>

    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 0 0 20px;">
      <p style="margin: 4px 0; color: #4b5563;"><strong>Encontro:</strong> ${d.title}</p>
      <p style="margin: 4px 0; color: #4b5563;"><strong>Tipo:</strong> ${d.sessionType}</p>
      <p style="margin: 4px 0; color: #4b5563;"><strong>Data:</strong> ${d.date} às ${d.time}</p>
    </div>

    ${d.reviewNotes ? `
    <div style="background-color: #fefce8; padding: 16px; border-radius: 8px; margin: 0 0 20px; border-left: 4px solid #eab308;">
      <p style="margin: 0 0 4px; font-weight: 600; color: #854d0e;">📝 Observações da revisão:</p>
      <p style="margin: 0; color: #713f12;">${d.reviewNotes}</p>
    </div>` : ""}

    ${d.isApproved ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${d.encontrosUrl}" style="display: inline-block; background-color: ${d.primaryColor}; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Ver Encontro Publicado
      </a>
    </div>` : ""}`;

  return emailWrapper(d.tenantName, d.tenantLogo, d.primaryColor, content);
}

interface CancellationEmailData {
  tenantName: string; tenantLogo: string | null; primaryColor: string;
  participantName: string; title: string; date: string; time: string;
  reason: string; encontrosUrl: string;
}

function buildCancellationEmail(d: CancellationEmailData): string {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 8px;">⚠️ Encontro Cancelado</h2>
    <p style="color: #6b7280; margin: 0 0 24px;">Olá, <strong>${d.participantName}</strong>.</p>

    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 0 0 20px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; color: #b91c1c; font-weight: 600;">
        O encontro "${d.title}" agendado para ${d.date} às ${d.time} foi cancelado.
      </p>
    </div>

    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 0 0 20px;">
      <p style="margin: 0 0 4px; font-weight: 600; color: #4b5563;">Motivo:</p>
      <p style="margin: 0; color: #6b7280;">${d.reason}</p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${d.encontrosUrl}" style="display: inline-block; background-color: ${d.primaryColor}; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Ver Próximos Encontros
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      Pedimos desculpas pelo inconveniente. Esperamos vê-lo(a) em um próximo encontro!
    </p>`;

  return emailWrapper(d.tenantName, d.tenantLogo, d.primaryColor, content);
}
