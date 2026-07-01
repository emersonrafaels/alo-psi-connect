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
};

const CATEGORY_LABELS: Record<string, string> = {
  rotina: "Fazer check-in",
  pratica: "Iniciar prática",
  encontro: "Ver encontros",
  conteudo: "Ver ferramentas",
  apoio: "Abrir chat",
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-primary/20 overflow-hidden">
          <CardHeader className="flex flex-row items-start gap-4">
            <BuddyMascot size="md" message={insight?.narrative?.split("\n")[0] ?? "Estou aprendendo sobre você a cada conversa. Me conte um pouco mais quando quiser."} />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Últimos 30 dias</Badge>
              {insight?.model && <Badge variant="outline">IA: Gemini</Badge>}
            </div>
            {isLoading ? (
              <Skeleton className="h-24" />
            ) : insight?.narrative ? (
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{insight.narrative}</p>
            ) : (
              <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                Ainda não gerei um resumo. Preencha seu retrato e clique em "Atualizar percepções" para eu começar.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRegenerate} disabled={regenerate.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${regenerate.isPending ? "animate-spin" : ""}`} />
                Atualizar percepções
              </Button>
              <Button variant="outline" asChild>
                <Link to="/buddy/como-te-conhece">
                  Ver o que o Buddy percebeu <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" /> Seu retrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {portraitLoading ? (
              <Skeleton className="h-24" />
            ) : portrait ? (
              <>
                <p className="text-muted-foreground">
                  Você já compartilhou {countFilled(portrait)} temas comigo.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/buddy/me-conhecer">Atualizar meu retrato</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Vamos começar? Me conte o que tem passado pela sua cabeça, o que te acalma e o que sonha.
                </p>
                <Button asChild size="sm">
                  <Link to="/buddy/me-conhecer">Preencher agora</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> O que o Buddy está priorizando para você
          </h2>
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ...(insight?.recommendations ?? []),
              {
                id: "static-encontros",
                category: "encontro",
                title: "Participe de um encontro em grupo",
                description: "Conecte-se com outras pessoas em encontros ao vivo mediados por facilitadores da Rede Bem-Estar.",
                cta: "Ver encontros",
              },
            ].map((rec) => (
              <Card key={rec.id} className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <Badge variant="secondary" className="capitalize">{rec.category}</Badge>
                  <h3 className="font-semibold text-foreground">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleRecommendationAction(rec)}
                    >
                      <Check className="h-4 w-4 mr-1" /> {rec.cta ?? CATEGORY_LABELS[(rec.category || "").toLowerCase()] ?? "Abrir"}
                    </Button>
                    {rec.id !== "static-encontros" && (
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
