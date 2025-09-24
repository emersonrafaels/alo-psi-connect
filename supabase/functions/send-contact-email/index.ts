import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactFormRequest = await req.json();

    console.log("Sending contact email from:", email);

    // Send email to the company
    const emailResponse = await resend.emails.send({
      from: "Contato Alô Psi <onboarding@resend.dev>",
      to: ["alopsi.host@gmail.com"],
      subject: `Novo contato: ${subject}`,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${phone}</p>
        <p><strong>Assunto:</strong> ${subject}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <p><em>Esta mensagem foi enviada através do formulário de contato do site Alô, Psi!</em></p>
      `,
    });

    // Send confirmation email to the user
    const confirmationResponse = await resend.emails.send({
      from: "Alô, Psi! <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos sua mensagem - Alô, Psi!",
      html: `
        <h2>Olá, ${name}!</h2>
        <p>Recebemos sua mensagem e agradecemos pelo contato.</p>
        <p>Nossa equipe analisará sua solicitação e retornará em breve.</p>
        
        <h3>Resumo da sua mensagem:</h3>
        <p><strong>Assunto:</strong> ${subject}</p>
        <p><strong>Mensagem:</strong> ${message.replace(/\n/g, '<br>')}</p>
        
        <p>Atenciosamente,<br>
        Equipe Alô, Psi!</p>
        
        <hr>
        <p><em>Se você não enviou esta mensagem, pode ignorar este email.</em></p>
      `,
    });

    console.log("Emails sent successfully:", { emailResponse, confirmationResponse });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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