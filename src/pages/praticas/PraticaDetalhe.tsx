import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Brain, Play, ShieldCheck, Volume2, VolumeX, Palette, Music, Pause, Waves } from "lucide-react";
import { usePratica } from "@/hooks/usePraticas";
import { IconePratica } from "@/components/praticas/IconePratica";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";
import { SCENE_THEMES } from "@/data/praticasPresets";
import { TRACK_CATALOG, resolveTrackForPratica } from "@/data/praticasAudios";

const PREVIEW_VOLUME = 0.5;
const PREVIEW_DURATION_MS = 15000;
const FADE_MS = 400;

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
  const [extras, setExtras] = useState<Record<string, string>>({});

  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewFadeRef = useRef<number | null>(null);
  const previewStopTimerRef = useRef<number | null>(null);
  const previewTokenRef = useRef(0);
  const lastPlayPromiseRef = useRef<Promise<void> | null>(null);

  const getPreviewAudio = () => {
    if (!previewAudioRef.current) {
      const a = new Audio();
      a.loop = false;
      a.preload = "auto";
      previewAudioRef.current = a;
    }
    return previewAudioRef.current;
  };

  const clearPreviewTimers = () => {
    if (previewStopTimerRef.current) {
      window.clearTimeout(previewStopTimerRef.current);
      previewStopTimerRef.current = null;
    }
    if (previewFadeRef.current) {
      window.clearInterval(previewFadeRef.current);
      previewFadeRef.current = null;
    }
  };

  const stopPreview = async (immediate = false) => {
    previewTokenRef.current++;
    clearPreviewTimers();
    const a = previewAudioRef.current;
    setPreviewingId(null);
    if (!a) return;

    // aguarda play() pendente para evitar AbortError
    try { await lastPlayPromiseRef.current; } catch {}

    if (immediate) {
      try { a.pause(); } catch {}
      a.currentTime = 0;
      return;
    }
    // fade-out
    const startVol = a.volume;
    const steps = Math.max(1, Math.round(FADE_MS / 40));
    let i = 0;
    await new Promise<void>((resolve) => {
      previewFadeRef.current = window.setInterval(() => {
        i++;
        a.volume = Math.max(0, startVol * (1 - i / steps));
        if (i >= steps) {
          if (previewFadeRef.current) window.clearInterval(previewFadeRef.current);
          previewFadeRef.current = null;
          try { a.pause(); } catch {}
          a.currentTime = 0;
          resolve();
        }
      }, 40);
    });
  };

  const startPreview = async (id: string, url: string) => {
    const token = ++previewTokenRef.current;
    clearPreviewTimers();
    const a = getPreviewAudio();

    // pausa instância atual sem zerar src antes do play
    try { await lastPlayPromiseRef.current; } catch {}
    if (token !== previewTokenRef.current) return;
    try { a.pause(); } catch {}

    a.src = url;
    a.volume = 0;
    setPreviewingId(id);

    const playPromise = a.play();
    lastPlayPromiseRef.current = playPromise;
    try {
      await playPromise;
    } catch (e: any) {
      if (e?.name !== "AbortError") console.warn("[pratica] preview falhou", url, e);
      if (token === previewTokenRef.current) setPreviewingId(null);
      return;
    }
    if (token !== previewTokenRef.current) return;

    // fade-in
    const steps = Math.max(1, Math.round(FADE_MS / 40));
    let i = 0;
    previewFadeRef.current = window.setInterval(() => {
      if (token !== previewTokenRef.current) {
        if (previewFadeRef.current) window.clearInterval(previewFadeRef.current);
        previewFadeRef.current = null;
        return;
      }
      i++;
      a.volume = Math.min(PREVIEW_VOLUME, (PREVIEW_VOLUME * i) / steps);
      if (i >= steps) {
        if (previewFadeRef.current) window.clearInterval(previewFadeRef.current);
        previewFadeRef.current = null;
      }
    }, 40);
    previewStopTimerRef.current = window.setTimeout(() => {
      if (token === previewTokenRef.current) stopPreview(false);
    }, PREVIEW_DURATION_MS);
  };

  const handleTrackClick = (id: string, url: string | null) => {
    setTrackId(id);
    if (!url) {
      stopPreview(true);
      return;
    }
    if (previewingId === id) {
      stopPreview(false);
    } else {
      startPreview(id, url);
    }
  };

  useEffect(() => () => { stopPreview(true); }, []);


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
      // Defaults dos opcoes_extra (sempre pré-seleciona o recomendado).
      const opcoes = pratica.opcoes_extra ?? {};
      const defaults: Record<string, string> = {};
      for (const [key, cfg] of Object.entries(opcoes)) {
        if (cfg && typeof cfg === "object" && "default" in cfg) {
          defaults[key] = (cfg as { default: string }).default;
        }
      }
      setExtras(defaults);
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
    stopPreview(true);
    const params = new URLSearchParams();
    if (duracao) params.set("d", String(duracao));
    params.set("som", comSom ? "1" : "0");
    
    if (trackId && trackId !== "auto") params.set("t", trackId);
    if (temaId && temaId !== "aurora") params.set("tema", temaId);
    for (const [k, v] of Object.entries(extras)) {
      if (v) params.set(`x_${k}`, v);
    }
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

            {/* Opções específicas da prática (opcoes_extra) */}
            {pratica.opcoes_extra && Object.keys(pratica.opcoes_extra).length > 0 && (
              <div className="mb-6 space-y-4">
                {Object.entries(pratica.opcoes_extra).map(([key, cfg]) => {
                  if (!cfg || typeof cfg !== "object" || !("options" in cfg)) return null;
                  const c = cfg as { label: string; options: string[] };
                  const sel = extras[key];
                  return (
                    <div key={key}>
                      <p className="text-sm font-medium mb-2">{c.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {c.options.map((opt) => {
                          const active = sel === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setExtras((e) => ({ ...e, [key]: opt }))}
                              className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card border-border hover:border-primary/50"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}





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
                    const isPreviewing = previewingId === t.id;
                    const canPreview = !!t.url;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleTrackClick(t.id, t.url)}
                        className={`relative text-left px-4 py-2.5 pr-11 rounded-lg border transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-sm font-medium flex items-center gap-2">
                          {t.label}
                          {isPreviewing && <Waves className="h-3.5 w-3.5 animate-pulse" aria-hidden />}
                        </div>
                        {t.mood && (
                          <div className={`text-xs mt-0.5 ${active ? "opacity-90" : "text-muted-foreground"}`}>
                            {isPreviewing ? "Prévia tocando…" : t.mood}
                          </div>
                        )}
                        {canPreview && (
                          <span
                            className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-full border ${
                              active ? "border-primary-foreground/40" : "border-border"
                            }`}
                            aria-label={isPreviewing ? "Parar prévia" : "Ouvir prévia"}
                          >
                            {isPreviewing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                {(() => {
                  if (!comSom) return "Sem trilha musical — apenas som ambiente.";
                  // Se estiver com prévia tocando, mostra a faixa da prévia;
                  // caso contrário, mostra a faixa efetivamente selecionada (resolvendo "Recomendada").
                  const idForLegend = previewingId ?? trackId;
                  if (idForLegend === "none") {
                    return "Sem trilha musical — apenas som ambiente.";
                  }
                  const resolved = resolveTrackForPratica(
                    pratica?.audio_url,
                    pratica?.slug,
                    idForLegend,
                  );
                  if (!resolved || resolved.url === null) {
                    return "Sem trilha musical — apenas som ambiente.";
                  }
                  return `Música: ${resolved.label} — Kevin MacLeod · CC-BY 4.0`;
                })()}
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
