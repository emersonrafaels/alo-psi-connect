import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, ClipboardList, Sparkles, Users } from "lucide-react";

type TimelineItem = { date: string; type: string; title: string; description?: string };

export default function BuddyJourney() {
  const { user } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["buddy", "journey", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const since = new Date(Date.now() - 60 * 86400_000).toISOString();
      const [mood, scale, prat, ag] = await Promise.all([
        supabase.from("mood_entries").select("id,date,notes").eq("user_id", user!.id).gte("date", since.slice(0, 10)).order("date", { ascending: false }).limit(30),
        supabase.from("emotional_scale_responses").select("id,created_at,scale_id").eq("user_id", user!.id).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
        supabase.from("praticas_checkouts").select("id,created_at,pratica_id").eq("user_id", user!.id).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
        supabase.from("agendamentos").select("id,data_consulta,status").eq("user_id", user!.id).gte("data_consulta", since.slice(0, 10)).order("data_consulta", { ascending: false }).limit(20),
      ]);

      const list: (TimelineItem & { icon: any; color: string })[] = [];
      (mood.data ?? []).forEach((m: any) => list.push({
        date: m.date, type: "Diário", title: "Registro no diário emocional",
        description: (m.notes ?? "").slice(0, 120), icon: BookOpen, color: "bg-primary/20 text-primary",
      }));
      (scale.data ?? []).forEach((s: any) => list.push({
        date: s.created_at.slice(0, 10), type: "Escala", title: "Respondeu uma escala emocional",
        icon: ClipboardList, color: "bg-blue-500/20 text-blue-600",
      }));
      (prat.data ?? []).forEach((p: any) => list.push({
        date: p.created_at.slice(0, 10), type: "Prática", title: "Iniciou uma prática",
        icon: Sparkles, color: "bg-emerald-500/20 text-emerald-600",
      }));
      (ag.data ?? []).forEach((a: any) => list.push({
        date: a.data_consulta, type: "Encontro", title: `Encontro ${a.status}`,
        icon: Users, color: "bg-amber-500/20 text-amber-600",
      }));
      return list.sort((a, b) => b.date.localeCompare(a.date));
    },
  });

  return (
    <BuddyLayout
      title="Como sua jornada vem evoluindo"
      description="Acompanhe seus passos e conquistas ao longo do tempo."
    >
      <Card>
        <CardHeader><CardTitle>Últimos 60 dias</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Ainda não há registros. Comece pelo diário emocional ou por uma prática.</p>
          ) : (
            <ol className="relative border-l border-border/60 ml-3 space-y-6">
              {items.map((it, i) => (
                <li key={i} className="ml-6">
                  <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ${it.color}`}>
                    <it.icon className="h-3 w-3" />
                  </span>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{it.type}</Badge>
                    <time className="text-xs text-muted-foreground">{new Date(it.date).toLocaleDateString("pt-BR")}</time>
                  </div>
                  <p className="font-medium">{it.title}</p>
                  {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </BuddyLayout>
  );
}
