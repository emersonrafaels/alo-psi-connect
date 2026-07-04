import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLatestBuddyInsight, useCurrentPatientId } from "@/hooks/useBuddy";
import { supabase } from "@/integrations/supabase/client";
import { Phone } from "lucide-react";

const RESOURCES = [
  { title: "CVV — Centro de Valorização da Vida", desc: "Apoio emocional 24h por telefone, chat e e-mail.", contact: "188" },
  { title: "SAMU", desc: "Emergências médicas.", contact: "192" },
  { title: "CAPS", desc: "Centros de Atenção Psicossocial da sua região." },
  { title: "Rede Bem-Estar", desc: "Agende com um profissional aqui na plataforma.", link: "/profissionais" },
];

export default function BuddyStrengths() {
  const { data: insight } = useLatestBuddyInsight(30);
  const { data: patientId } = useCurrentPatientId();

  const { data: contacts = [] } = useQuery({
    queryKey: ["buddy", "emergency", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("patient_emergency_contacts")
        .select("nome, telefone, parentesco")
        .eq("patient_id", patientId!);
      return data ?? [];
    },
  });

  return (
    <BuddyLayout
      title="Seus pontos de força"
      description="Reconhecer suas fortalezas e sua rede de apoio é o primeiro passo para se sentir bem."
    >
      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-primary/20 min-w-0">
          <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-2xl leading-tight [overflow-wrap:anywhere]">Suas fortalezas</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 p-4 sm:p-6 pt-0 sm:pt-0 min-w-0">
            {(insight?.strengths ?? [
              { title: "Empatia", description: "Você se importa com os outros." },
              { title: "Resiliência", description: "Você já superou desafios importantes." },
            ]).map((s, i) => (
              <div key={i} className="min-w-0 rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="font-semibold text-primary [overflow-wrap:anywhere]">{s.title}</p>
                <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{s.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20 min-w-0 overflow-visible sm:overflow-hidden">
          <CardContent className="p-4 sm:p-6 min-w-0">
            <BuddyMascot size="md" message="Você não está sozinha(o). Sua rede de apoio importa." />
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 sm:gap-6 mt-6 md:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-2xl leading-tight [overflow-wrap:anywhere]">Seus contatos de emergência</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6 pt-0 sm:pt-0 min-w-0">
            {contacts.length ? contacts.map((c: any, i: number) => (
              <div key={i} className="flex min-w-0 flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-2 border-b border-border/50 pb-2 last:border-none">
                <div className="min-w-0">
                  <p className="font-medium text-sm [overflow-wrap:anywhere]">{c.nome}</p>
                  <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{c.parentesco}</p>
                </div>
                <a href={`tel:${c.telefone}`} className="text-primary text-sm flex min-w-0 items-center gap-1 [overflow-wrap:anywhere]">
                  <Phone className="h-4 w-4 shrink-0" /> <span className="min-w-0">{c.telefone}</span>
                </a>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                Você ainda não cadastrou contatos de emergência. Adicione no seu perfil.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-2xl leading-tight [overflow-wrap:anywhere]">Canais de ajuda 24h</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6 pt-0 sm:pt-0 min-w-0">
            {RESOURCES.map((r) => (
              <div key={r.title} className="min-w-0 border-b border-border/50 pb-2 last:border-none">
                <p className="font-medium text-sm [overflow-wrap:anywhere]">{r.title}</p>
                <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{r.desc}</p>
                {r.contact && <p className="text-primary text-sm mt-1">📞 {r.contact}</p>}
                {r.link && <a href={r.link} className="text-primary text-xs underline">Abrir</a>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </BuddyLayout>
  );
}
