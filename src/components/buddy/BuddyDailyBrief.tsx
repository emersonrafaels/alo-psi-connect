import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLatestBuddyInsight } from "@/hooks/useBuddy";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Heart, Zap, X } from "lucide-react";
import buddyImg from "@/assets/buddy-main.png";

const STORAGE_KEY = "buddy-daily-brief-closed";

/**
 * Card diário do Buddy exibido no topo da Home para usuários autenticados.
 * - Saudação personalizada por horário
 * - Uma descoberta do Buddy (primeira frase da narrativa mais recente)
 * - Uma ação sugerida (primeira recomendação ou check-in)
 * - Atalho para o hub do Buddy
 */
export function BuddyDailyBrief() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { data: insight, isLoading } = useLatestBuddyInsight(30);
  const navigate = useNavigate();
  const [isClosed, setIsClosed] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const closedDate = raw;
      const today = new Date().toISOString().slice(0, 10);
      return closedDate === today;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isClosed) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
    }
  }, [isClosed]);

  if (!user || isClosed) return null;

  const firstName =
    profile?.nome?.split(" ")[0] ||
    user?.user_metadata?.nome?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "amigo(a)";

  const greeting = getGreeting();
  const discovery =
    insight?.narrative?.split(/(?<=[.!?])\s+/)[0] ||
    "Estou aprendendo sobre você. Cada registro me ajuda a te apoiar melhor.";
  const nextRec = insight?.recommendations?.[0];
  const ctaLabel = nextRec?.cta || "Fazer meu check-in";
  const ctaAction = () => {
    if (nextRec) {
      const cat = (nextRec.category || "").toLowerCase();
      const routes: Record<string, string> = {
        rotina: "/diario-emocional/nova-entrada",
        pratica: "/praticas",
        encontro: "/encontros",
        conteudo: "/escalas",
      };
      navigate(routes[cat] || "/buddy");
    } else {
      navigate("/diario-emocional/nova-entrada");
    }
  };

  return (
    <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/10 shadow-xl">
        {/* Botão fechar */}
        <button
          onClick={() => setIsClosed(true)}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-background/70 hover:bg-background text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm"
          aria-label="Fechar momento com o Buddy"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Halo decorativo */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "hsl(var(--primary))" }}
          aria-hidden
        />
        <div className="relative grid gap-6 p-6 md:p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          {/* Mascote */}
          <div className="flex items-center gap-4 md:block">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
              <img
                src={buddyImg}
                alt="Buddy"
                className="relative h-20 w-20 md:h-24 md:w-24 rounded-full object-cover ring-4 ring-primary/20"
              />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Sparkles className="mr-1 h-3 w-3" /> Momento com o Buddy
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {greeting}, {firstName}. Que bom te ver.
            </h2>

            {isLoading ? (
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            ) : (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-2">
                <Heart className="inline h-4 w-4 text-primary mr-1.5 -mt-0.5" />
                {discovery}
              </p>
            )}

            {nextRec && (
              <div className="rounded-xl border border-primary/15 bg-background/60 backdrop-blur-sm p-3 flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Sugestão de agora
                  </p>
                  <p className="text-sm text-foreground line-clamp-2">
                    {nextRec.title}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 md:min-w-[200px]">
            <Button
              size="lg"
              onClick={ctaAction}
              className="rounded-full shadow-lg"
            >
              {ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <Link to="/buddy">Ver meu Buddy</Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
