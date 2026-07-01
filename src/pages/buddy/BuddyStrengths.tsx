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
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader><CardTitle>Suas fortalezas</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {(insight?.strengths ?? [
              { title: "Empatia", description: "Você se importa com os outros." },
              { title: "Resiliência", description: "Você já superou desafios importantes." },
            ]).map((s, i) => (
              <div key={i} className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="font-semibold text-primary">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <BuddyMascot size="md" message="Você não está sozinha(o). Sua rede de apoio importa." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Seus contatos de emergência</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contacts.length ? contacts.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-none">
                <div>
                  <p className="font-medium text-sm">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.parentesco}</p>
                </div>
                <a href={`tel:${c.telefone}`} className="text-primary text-sm flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {c.telefone}
                </a>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não cadastrou contatos de emergência. Adicione no seu perfil.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Canais de ajuda 24h</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {RESOURCES.map((r) => (
              <div key={r.title} className="border-b border-border/50 pb-2 last:border-none">
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
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
