import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBuddyPortrait, useLatestBuddyInsight, useRecommendationFeedback } from "@/hooks/useBuddy";
import { Sparkles, RefreshCw, Heart, ArrowRight, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIAssistantModal } from "@/components/AIAssistantModal";

const CATEGORY_ROUTES: Record<string, string> = {
  rotina: "/diario-emocional/nova-entrada",
  pratica: "/praticas",
  encontro: "/encontros",
  conteudo: "/escalas",
  profissional: "/profissionais",
};

const CATEGORY_LABELS: Record<string, string> = {
  rotina: "Fazer check-in",
  pratica: "Iniciar prática",
  encontro: "Ver encontros",
  conteudo: "Ver ferramentas",
  apoio: "Abrir chat",
  profissional: "Ver profissionais",
};

export default function BuddyHome() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const { data: portrait, isLoading: portraitLoading } = useBuddyPortrait();
  const { data: insight, isLoading, regenerate } = useLatestBuddyInsight(30);
  const feedback = useRecommendationFeedback();
  const { toast } = useToast();
  const [chatOpen, setChatOpen] = useState(false);

  const handleRecommendationAction = (rec: { id: string; category: string }) => {
    feedback.mutate({ recommendationId: rec.id, action: "done" });
    const cat = (rec.category || "").toLowerCase();
    if (cat === "apoio") {
      setChatOpen(true);
      return;
    }
    const route = CATEGORY_ROUTES[cat] ?? "/buddy/como-te-conhece";
    navigate(route);
  };

  const firstName = profile?.nome || user?.user_metadata?.nome?.split(" ")[0] || user?.email?.split("@")[0] || "amigo(a)";

  const handleRegenerate = async () => {
    try {
      await regenerate.mutateAsync();
      toast({ title: "Buddy atualizou suas percepções", description: "Confira o que ele percebeu." });
    } catch (e: any) {
      toast({
        title: "Não foi possível atualizar agora",
        description: e?.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <BuddyLayout
      title={`Olá, ${firstName}. Que bom te ver.`}
      description="Aqui o Buddy conecta tudo o que você compartilha na Rede Bem-Estar para te apoiar de forma cada vez mais personalizada."
    >
      <div className="grid min-w-0 max-w-full gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-primary/20 min-w-0 max-w-full overflow-visible sm:overflow-hidden">
          <CardHeader className="p-3 min-[380px]:p-4 sm:p-6 min-w-0">
            <BuddyMascot size="md" message={insight?.narrative?.split("\n")[0] ?? "Estou aprendendo sobre você a cada conversa. Me conte um pouco mais quando quiser."} />
          </CardHeader>
          <CardContent className="grid min-w-0 gap-4 p-3 min-[380px]:p-4 sm:p-6 pt-0 min-[380px]:pt-0 sm:pt-0">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Últimos 30 dias</Badge>
            </div>
            {isLoading ? (
              <Skeleton className="h-24" />
            ) : insight?.narrative ? (
              <p className="max-w-full text-sm leading-relaxed text-muted-foreground whitespace-pre-line [overflow-wrap:anywhere]">{insight.narrative}</p>
            ) : (
              <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                Ainda não gerei um resumo. Preencha seu retrato e clique em "Atualizar percepções" para eu começar.
              </div>
            )}
            <div className="flex min-w-0 flex-col sm:flex-row sm:flex-wrap gap-2">
              <Button onClick={handleRegenerate} disabled={regenerate.isPending} className="w-full sm:w-auto min-h-10 !h-auto !whitespace-normal px-3 text-center">
                <RefreshCw className={`h-4 w-4 mr-2 ${regenerate.isPending ? "animate-spin" : ""}`} />
                Atualizar percepções
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto min-h-10 !h-auto !whitespace-normal px-3 text-center">
                <Link to="/buddy/como-te-conhece" className="min-w-0">
                  <span className="min-w-0 [overflow-wrap:anywhere]">Ver o que o Buddy percebeu</span> <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>


        <Card className="border-primary/20 min-w-0 max-w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base sm:text-lg leading-tight [overflow-wrap:anywhere]">
              <Sparkles className="h-5 w-5 text-primary" /> Seu retrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm p-4 sm:p-6 pt-0 sm:pt-0 min-w-0 [overflow-wrap:anywhere]">
            {portraitLoading ? (
              <Skeleton className="h-24" />
            ) : portrait ? (
              <>
                <p className="text-muted-foreground">
                  Você já compartilhou {countFilled(portrait)} temas comigo.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto min-h-9 !h-auto !whitespace-normal text-center">
                  <Link to="/buddy/me-conhecer">Atualizar meu retrato</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Vamos começar? Me conte o que tem passado pela sua cabeça, o que te acalma e o que sonha.
                </p>
                <Button asChild size="sm" className="w-full sm:w-auto min-h-9 !h-auto !whitespace-normal text-center">
                  <Link to="/buddy/me-conhecer">Preencher agora</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="flex min-w-0 items-center justify-between mb-4">
          <h2 className="min-w-0 text-base sm:text-lg md:text-xl font-semibold flex items-start gap-2 leading-tight [overflow-wrap:anywhere]">
            <Heart className="h-5 w-5 text-primary shrink-0" /> <span>O que o Buddy está priorizando para você</span>
          </h2>
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ...((insight?.recommendations ?? []).filter((r: any) => {
                const text = `${r?.title ?? ""} ${r?.description ?? ""}`.toLowerCase();
                return !text.includes("sono");
              })),
              {
                id: "static-profissionais",
                category: "profissional",
                title: "Conheça nossos profissionais",
                description: "Encontre psicólogos e terapeutas da Rede Bem-Estar prontos para te acompanhar.",
                cta: "Ver profissionais",
              },
              {
                id: "static-encontros",
                category: "encontro",
                title: "Participe de um encontro em grupo",
                description: "Conecte-se com outras pessoas em encontros ao vivo mediados por facilitadores da Rede Bem-Estar.",
                cta: "Ver encontros",
              },
            ].map((rec) => (
              <Card key={rec.id} className="min-w-0 max-w-full border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 sm:p-5 space-y-3 min-w-0">
                  <Badge variant="secondary" className="capitalize">{rec.category}</Badge>
                  <h3 className="font-semibold text-foreground [overflow-wrap:anywhere]">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{rec.description}</p>
                  <div className="flex flex-col min-[420px]:flex-row min-[420px]:flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleRecommendationAction(rec)}
                      className="w-full min-[420px]:w-auto min-[420px]:flex-1 sm:flex-none min-h-9 !h-auto !whitespace-normal text-center px-3"
                    >
                      <Check className="h-4 w-4 mr-1 shrink-0" /> <span className="min-w-0 [overflow-wrap:anywhere]">{rec.cta ?? CATEGORY_LABELS[(rec.category || "").toLowerCase()] ?? "Abrir"}</span>
                    </Button>
                    {!rec.id.startsWith("static-") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => feedback.mutate({ recommendationId: rec.id, action: "dismissed" })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </section>

      <AIAssistantModal open={chatOpen} onOpenChange={setChatOpen} />
    </BuddyLayout>
  );
}



function countFilled(p: any) {
  const fields = ["mind_on", "calms_me", "dreams", "message_to_buddy"];
  let n = fields.filter((f) => p?.[f]?.length).length;
  ["wants_to_improve", "triggers", "values_list"].forEach((f) => { if (p?.[f]?.length) n++; });
  return n;
}
