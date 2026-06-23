import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Headphones,
  Clock,
  Play,
  CheckCircle2,
} from "lucide-react";
import { usePraticas, usePraticasAtalhos, type Pratica } from "@/hooks/usePraticas";
import { PraticaCard } from "@/components/praticas/PraticaCard";
import { IconePratica } from "@/components/praticas/IconePratica";
import { getTenantSlugFromPath, getBasePath } from "@/utils/tenantHelpers";

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const PraticasIndex = () => {
  const location = useLocation();
  const tenantSlug = getTenantSlugFromPath(location.pathname);
  const basePath = getBasePath(tenantSlug);

  const { data, isLoading } = usePraticas();
  const { data: atalhos } = usePraticasAtalhos();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Práticas para Reequilíbrio Emocional | Rede Bem-Estar";
  }, []);

  const grupos = useMemo(() => data?.grupos ?? [], [data]);
  const praticas = useMemo(() => data?.praticas ?? [], [data]);

  const praticasPorGrupo = useMemo(() => {
    const map: Record<string, Pratica[]> = {};
    for (const p of praticas) {
      if (!p.grupo_id) continue;
      (map[p.grupo_id] ||= []).push(p);
    }
    return map;
  }, [praticas]);

  const destaque: Pratica | undefined = useMemo(() => {
    return praticas.find((p) => p.destaque) ?? praticas[0];
  }, [praticas]);

  const praticasAudio = useMemo(
    () => praticas.filter((p) => p.tem_audio).slice(0, 3),
    [praticas]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 relative">
        {/* Decorative mesh background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0"
          style={{ backgroundImage: "var(--gradient-mesh)" }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
          <div
            className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-80 motion-safe:animate-pulse"
            style={{ backgroundImage: "var(--gradient-soft)", animationDuration: "8s" }}
          />
          <div
            className="absolute top-[35vh] -right-24 w-[520px] h-[520px] rounded-full blur-3xl opacity-70 motion-safe:animate-pulse"
            style={{ backgroundImage: "var(--gradient-soft-accent)", animationDuration: "10s" }}
          />
          <div
            className="absolute top-[110vh] left-1/3 w-[380px] h-[380px] rounded-full blur-3xl opacity-60"
            style={{ backgroundImage: "var(--gradient-soft)" }}
          />
        </div>

        {/* HERO */}
        <section
          className="relative"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <div className="container relative mx-auto px-4 py-20 md:py-28 max-w-5xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 uppercase tracking-wider bg-gradient-to-r from-primary/15 to-accent/15 text-primary border border-primary/20 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Práticas de autorregulação
            </Badge>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Encontre uma prática para o que você
              </span>{" "}
              <span className="text-foreground">precisa agora</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Exercícios guiados e breves para desacelerar, recuperar o foco, aliviar a tensão ou se
              reconectar com o momento presente.
            </p>
            <p className="text-sm text-muted-foreground/80 italic mb-10">
              De 2 a 10 minutos · Áudio, texto e orientação visual
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                onClick={() => scrollToId("destaque")}
                className="group bg-gradient-to-r from-primary to-primary/85 hover:from-primary hover:to-accent transition-all hover:shadow-[var(--shadow-glow)]"
              >
                Encontrar uma prática
                <Search className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToId("grupos")}
                className="backdrop-blur-sm bg-card/50 hover:bg-card"
              >
                Explorar todas
              </Button>
            </div>
          </div>
        </section>

        {/* PILL BAR — atalhos do banco */}
        {atalhos && atalhos.length > 0 && (
          <section id="atalhos" className="relative container mx-auto px-4 pb-8 max-w-6xl">
            <div
              className="rounded-full backdrop-blur-md border border-border/60 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.2)] p-2 flex items-center gap-2 overflow-x-auto"
              style={{ backgroundImage: "var(--gradient-card)" }}
            >
              <div className="hidden md:flex items-center gap-2 px-4 border-r border-border/60 shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  O que você precisa agora?
                </span>
              </div>
              <div className="flex gap-2 px-2 py-1 overflow-x-auto">
                {atalhos.map((a) =>
                  a.pratica_slug ? (
                    <Link
                      key={a.id}
                      to={`${basePath}/praticas/${a.pratica_slug}`}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/15 hover:to-accent/15 text-primary text-sm font-medium whitespace-nowrap transition-all border border-primary/15 hover:border-primary/30 hover:shadow-sm"
                    >
                      {a.texto}
                    </Link>
                  ) : (
                    <span
                      key={a.id}
                      className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium whitespace-nowrap"
                    >
                      {a.texto}
                    </span>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* DESTAQUE */}
        {destaque && (
          <section id="destaque" className="relative container mx-auto px-4 py-12 max-w-6xl">
            <div
              className="rounded-[40px] p-[1.5px] shadow-[var(--shadow-glow)]"
              style={{ backgroundImage: "var(--gradient-border)" }}
            >
              <Card
                className="relative overflow-hidden rounded-[39px] p-8 md:p-14 backdrop-blur-xl border-0"
                style={{ backgroundImage: "var(--gradient-card)" }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full blur-3xl opacity-60"
                  style={{ backgroundImage: "var(--gradient-soft-accent)" }}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
                  <div className="space-y-6">
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-accent/30 to-primary/20 text-accent-foreground border border-accent/40 backdrop-blur-sm"
                    >
                      Uma sugestão para agora
                    </Badge>
                    <h2 className="font-serif text-3xl md:text-5xl leading-tight bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
                      {destaque.titulo}
                    </h2>
                    {destaque.descricao_curta && (
                      <p className="text-base md:text-lg text-muted-foreground">
                        {destaque.descricao_curta}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        asChild
                        size="lg"
                        className="group bg-gradient-to-r from-primary to-primary/85 hover:from-primary hover:to-accent transition-all hover:shadow-[var(--shadow-glow)]"
                      >
                        <Link to={`${basePath}/praticas/${destaque.slug}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Começar prática de {destaque.duracao_min_default} minutos
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="backdrop-blur-sm bg-card/50">
                        <Link to={`${basePath}/praticas/${destaque.slug}`}>Ver orientações</Link>
                      </Button>
                    </div>
                  </div>

                  {/* Circular visual */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                      <span
                        className="absolute -inset-4 rounded-full blur-2xl opacity-70"
                        style={{ backgroundImage: "var(--gradient-soft)" }}
                      />
                      <span className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-40" />
                      <span className="absolute inset-6 rounded-full border border-accent/40" />
                      <div className="w-full h-full rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center relative">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" aria-hidden>
                          <circle
                            cx="50%"
                            cy="50%"
                            r="48%"
                            fill="transparent"
                            stroke="url(#destaque-gradient)"
                            strokeWidth={8}
                            strokeLinecap="round"
                            strokeDasharray="100 100"
                          />
                          <defs>
                            <linearGradient id="destaque-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(var(--primary))" />
                              <stop offset="50%" stopColor="hsl(var(--accent))" />
                              <stop offset="100%" stopColor="hsl(var(--primary) / 0.4)" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div
                          className="text-center z-10 backdrop-blur-xl w-4/5 h-4/5 rounded-full flex flex-col items-center justify-center shadow-lg border border-border/60"
                          style={{ backgroundImage: "var(--gradient-card)" }}
                        >
                          <span className="text-5xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                            {destaque.duracao_min_default}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                            minutos
                          </span>
                          {destaque.ideal_para && (
                            <span className="text-xs text-muted-foreground mt-3 px-4 text-center">
                              {destaque.ideal_para}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Inspirar
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Expirar
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* GRUPOS DINÂMICOS */}
        <section id="grupos" className="relative container mx-auto px-4 py-16 max-w-6xl space-y-16">
          {isLoading &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-40" />
                  <Skeleton className="h-40" />
                </div>
              </div>
            ))}

          {grupos.map((grupo) => {
            const items = praticasPorGrupo[grupo.id] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={grupo.id} className="relative">
                <div
                  aria-hidden
                  className="absolute -left-8 top-0 h-24 w-2/3 rounded-full blur-3xl opacity-50 -z-0"
                  style={{ backgroundImage: "var(--gradient-soft)" }}
                />
                <div className="mb-6 max-w-2xl relative">
                  <div className="inline-block">
                    <h2 className="font-serif text-3xl md:text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                      {grupo.nome}
                    </h2>
                    <div className="h-px w-16 bg-gradient-to-r from-primary to-transparent" />
                  </div>
                  {grupo.descricao && (
                    <p className="text-muted-foreground mt-3">{grupo.descricao}</p>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4 relative">
                  {items.map((p) => (
                    <PraticaCard key={p.id} pratica={p} basePath={basePath} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* PRÁTICAS EM ÁUDIO */}
        {praticasAudio.length > 0 && (
          <section className="relative container mx-auto px-4 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-primary mb-2">
                  Prefere apenas ouvir?
                </h2>
                <p className="text-muted-foreground">
                  Acompanhe instruções guiadas sem precisar manter os olhos na tela.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {praticasAudio.map((p) => (
                <Link
                  key={p.id}
                  to={`${basePath}/praticas/${p.slug}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
                >
                  <Card
                    className="h-full rounded-3xl p-8 backdrop-blur-xl border border-border/60 hover:border-primary/30 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all flex flex-col gap-5"
                    style={{ backgroundImage: "var(--gradient-card)" }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center shadow-sm">
                      {p.icone ? (
                        <IconePratica name={p.icone} className="h-6 w-6" />
                      ) : (
                        <Headphones className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                        {p.titulo}
                      </h3>
                      {p.descricao_curta && (
                        <p className="text-sm text-muted-foreground">{p.descricao_curta}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Clock className="h-4 w-4" />
                      {p.duracao_min_default} min
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative container mx-auto px-4 py-20 max-w-4xl">
          <Card className="p-10 md:p-14 text-center bg-primary text-primary-foreground border-0 rounded-[32px]">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Você não precisa lidar com tudo sozinha
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
              Às vezes, a maior prática é reconhecer quando precisamos de um apoio extra. Estamos
              aqui para cada passo do seu caminho.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to={`${basePath}/profissionais`}>
                  Buscar apoio
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link to={`${basePath}/sobre`}>Entender caminhos de cuidado</Link>
              </Button>
            </div>
          </Card>
        </section>

        {/* SELOS DE SEGURANÇA */}
        <section className="relative bg-muted/40 py-14 border-t border-border/60">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-serif text-xl text-primary">
                    Práticas que respeitam o seu ritmo
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Curadas pela nossa equipe clínica e baseadas em evidências. Não substituem o
                  acompanhamento profissional de saúde mental — em caso de crise, procure ajuda
                  especializada.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                {[
                  "Orientações simples",
                  "Ritmo adaptável",
                  "Áudio opcional",
                  "Sem cobrança",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PraticasIndex;
