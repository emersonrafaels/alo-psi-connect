import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Brain, Play, ShieldCheck, Volume2, VolumeX, Wind, Palette, Music } from "lucide-react";
import { usePratica } from "@/hooks/usePraticas";
import { IconePratica } from "@/components/praticas/IconePratica";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";
import { BREATHING_PRESETS, SCENE_THEMES } from "@/data/praticasPresets";
import { TRACK_CATALOG } from "@/data/praticasAudios";

const PraticaDetalhe = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = getTenantSlugFromPath(location.pathname);
  const basePath = getBasePath(tenantSlug);
  const { data: pratica, isLoading } = usePratica(slug);

  const [duracao, setDuracao] = useState<number | null>(null);
  const [comSom, setComSom] = useState(true);
  const [presetId, setPresetId] = useState<string>("padrao");
  const [trackId, setTrackId] = useState<string>("auto");
  const [temaId, setTemaId] = useState<string>("aurora");

  useEffect(() => {
    window.scrollTo(0, 0);
    if (pratica) {
      document.title = `${pratica.titulo} | Práticas | Rede Bem-Estar`;
      setDuracao(pratica.duracao_min_default);
      setComSom(true);
      setPresetId("padrao");
      setTrackId("auto");
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("praticas:tema") : null;
      setTemaId(stored ?? "aurora");
    }
  }, [pratica]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-12 w-3/4 mb-6" />
          <Skeleton className="h-40 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!pratica) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-3xl mb-4">Prática não encontrada</h1>
          <Button asChild>
            <Link to={`${basePath}/praticas`}>Voltar para Práticas</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const iniciar = () => {
    const params = new URLSearchParams();
    if (duracao) params.set("d", String(duracao));
    params.set("som", comSom ? "1" : "0");
    if (presetId && presetId !== "padrao") params.set("preset", presetId);
    if (trackId && trackId !== "auto") params.set("t", trackId);
    if (temaId && temaId !== "aurora") params.set("tema", temaId);
    if (typeof window !== "undefined") window.localStorage.setItem("praticas:tema", temaId);
    navigate(`${basePath}/praticas/${pratica.slug}/sessao?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 max-w-4xl">
          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-3">
            <Link to={`${basePath}/praticas`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Todas as práticas
            </Link>
          </Button>

          <div className="flex items-start gap-5 mb-8">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary shrink-0">
              <IconePratica name={pratica.icone} className="h-8 w-8" />
            </div>
            <div className="flex-1">
              {pratica.categoria_badge && (
                <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px]">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {pratica.categoria_badge}
                </Badge>
              )}
              <h1 className="font-serif text-4xl md:text-5xl text-primary leading-tight">
                {pratica.titulo}
              </h1>
              {pratica.subtitulo && (
                <p className="mt-3 text-lg text-muted-foreground">{pratica.subtitulo}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {pratica.duracao_min_default} min
                </span>
                {pratica.ideal_para && <span>· Ideal para: {pratica.ideal_para}</span>}
              </div>
            </div>
          </div>

          {pratica.corpo_ciencia && (
            <Card className="p-6 md:p-8 mb-8 bg-muted/40 border-border/60">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Brain className="h-5 w-5" />
                <h2 className="font-serif text-2xl">Entender melhor</h2>
              </div>
              <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {pratica.corpo_ciencia}
              </p>
            </Card>
          )}

          <Card className="p-6 md:p-8 mb-8">
            <h2 className="font-serif text-2xl text-primary mb-5">Configurações</h2>

            {/* Duração */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Duração
              </p>
              <div className="flex flex-wrap gap-2">
                {(pratica.duracoes_disponiveis ?? []).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuracao(d)}
                    className={`px-4 py-2 rounded-full text-sm transition-all border ${
                      duracao === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Padrão de respiração */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Wind className="h-4 w-4 text-primary" /> Padrão de respiração
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BREATHING_PRESETS.map((p) => {
                  const active = presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPresetId(p.id)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className={`text-xs mt-0.5 ${active ? "opacity-90" : "text-muted-foreground"}`}>
                        {p.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tema da cena */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Tema visual
              </p>
              <div className="flex flex-wrap gap-2">
                {SCENE_THEMES.map((t) => {
                  const active = temaId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTemaId(t.id)}
                      className={`inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm transition-all border ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                      title={t.label}
                    >
                      <span className="flex items-center -space-x-1">
                        {t.swatch.map((c, i) => (
                          <span
                            key={i}
                            className="h-4 w-4 rounded-full border border-background/40"
                            style={{ background: c }}
                          />
                        ))}
                      </span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trilha sonora */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" /> Trilha sonora
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setComSom(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all border ${
                    comSom
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                  Com trilha
                </button>
                <button
                  onClick={() => setComSom(false)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all border ${
                    !comSom
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <VolumeX className="h-4 w-4" />
                  Apenas visual
                </button>
              </div>

              {comSom && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRACK_CATALOG.map((t) => {
                    const active = trackId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTrackId(t.id)}
                        className={`text-left px-4 py-2.5 rounded-lg border transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-sm font-medium">{t.label}</div>
                        {t.mood && (
                          <div className={`text-xs mt-0.5 ${active ? "opacity-90" : "text-muted-foreground"}`}>
                            {t.mood}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                Música: Kevin MacLeod — CC-BY 4.0
              </p>
            </div>
          </Card>

          <div className="flex flex-col items-center gap-3">
            <Button size="lg" onClick={iniciar} className="px-10">
              <Play className="h-5 w-5 mr-2" />
              Começar prática
            </Button>
            {comSom && (
              <p className="text-xs text-muted-foreground">
                Prepare seus fones de ouvido para uma experiência imersiva.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PraticaDetalhe;
