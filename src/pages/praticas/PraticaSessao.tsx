import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  X,
  Pause,
  Play,
  Volume2,
  VolumeOff,
  Waves,
  Maximize2,
  Minimize2,
  Bell,
  BellOff,
  Plus,
  Type,
  Sparkles,
} from "lucide-react";
import { usePratica } from "@/hooks/usePraticas";
import { BreathingCircle, type BreathingPhase } from "@/components/praticas/BreathingCircle";
import { PausaTresMinutosSessao } from "@/components/praticas/PausaTresMinutosSessao";
import { GroundingSessao } from "@/components/praticas/GroundingSessao";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";
import { resolveTrackForPratica } from "@/data/praticasAudios";
import { getThemeById } from "@/data/praticasPresets";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useTenant } from "@/hooks/useTenant";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

const PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rand = seed / 233280;
  const seed2 = ((i + 7) * 9301 + 49297) % 233280;
  return {
    left: `${(rand * 100).toFixed(2)}%`,
    top: `${((seed2 / 233280) * 100).toFixed(2)}%`,
    size: 2 + ((i * 3) % 5),
    delay: ((i * 1.3) % 8).toFixed(2),
    duration: (8 + (i % 9)).toFixed(2),
    opacity: 0.25 + ((i % 5) * 0.12),
  };
});

const PraticaSessao = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = getTenantSlugFromPath(location.pathname);
  const basePath = getBasePath(tenantSlug);
  const { data: pratica } = usePratica(slug);
  const { tenant } = useTenant();
  const tenantLogo = tenant?.logo_url_dark || tenant?.logo_url;

  const duracaoMin = Number(params.get("d") || pratica?.duracao_min_default || 5);
  const somPref = params.get("som") === "1";
  const trackParam = params.get("t");
  const temaParam = params.get("tema");

  const baseTotalSeg = duracaoMin * 60;
  const [extraSec, setExtraSec] = useState(0);
  const totalSeg = baseTotalSeg + extraSec;

  // Tema da cena
  const tema = useMemo(() => getThemeById(temaParam), [temaParam]);

  // Padrão de respiração — sempre vem da prática (não é configurável pelo usuário)
  const padrao = (pratica?.padrao_respiracao ?? { inspirar: 4, segurar: 0, expirar: 6 }) as
    { inspirar: number; segurar: number; expirar: number; segurar_pos_expirar?: number; inspirar_curta?: number };
  const cicloSegundos = Math.max(
    1,
    (padrao.inspirar || 0) + (padrao.segurar || 0) + (padrao.expirar || 0) + (padrao.segurar_pos_expirar || 0) + (padrao.inspirar_curta || 0),
  );

  // Trilha — escolha do usuário sobrepõe o fallback automático (slug/grupo)
  const resolvedTrack = resolveTrackForPratica(
    pratica?.audio_url,
    slug,
    trackParam,
  );
  const audioUrl = resolvedTrack.url;

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(!somPref);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.75;
    const stored = window.localStorage.getItem("praticas:volume");
    const n = stored === null ? NaN : Number(stored);
    return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.75;
  });
  const [ambient, setAmbient] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("praticas:ambient");
    return stored === null ? true : stored === "1";
  });
  const [sino, setSino] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("praticas:sino");
    return stored === null ? true : stored === "1";
  });
  const [ciclos, setCiclos] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [dimmed, setDimmed] = useState(false);
  const [largeLabels, setLargeLabels] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("praticas:legendasGrandes") === "1";
  });
  const [intensity, setIntensity] = useState<number>(() => {
    if (typeof window === "undefined") return 3;
    const stored = Number(window.localStorage.getItem("praticas:intensidade"));
    return Number.isFinite(stored) && stored >= 1 && stored <= 5 ? stored : 3;
  });
  const reducedMotion = usePrefersReducedMotion();
  const idleTimerRef = useRef<number | null>(null);
  const dimTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gongCtxRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<{ stop: () => void } | null>(null);
  const gongPulseTimerRef = useRef<number | null>(null);
  const [gongPulse, setGongPulse] = useState(false);
  const startBellFiredRef = useRef(false);
  const endBellFiredRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (elapsed >= totalSeg && totalSeg > 0) {
      if (sino && !endBellFiredRef.current) {
        endBellFiredRef.current = true;
        try { playGong(396); } catch {}
        const navTimer = window.setTimeout(() => {
          navigate(`${basePath}/praticas/${slug}/checkout?dur=${totalSeg}`);
        }, 700);
        return () => window.clearTimeout(navTimer);
      }
      navigate(`${basePath}/praticas/${slug}/checkout?dur=${totalSeg}`);
    }
  }, [elapsed, totalSeg, basePath, slug, navigate, sino]);

  // Voice/trilha audio
  useEffect(() => {
    if (audioUrl) console.info("[pratica] track resolvido", audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    a.volume = volume;
    // garante recarregar quando o src muda em runtime
    if (a.src && !a.src.endsWith(audioUrl ?? "")) {
      try { a.load(); } catch {}
    }
    if (paused) a.pause();
    else a.play().catch(() => {});
  }, [paused, muted, volume, audioUrl]);

  useEffect(() => {
    window.localStorage.setItem("praticas:volume", String(volume));
  }, [volume]);

  useEffect(() => {
    window.localStorage.setItem("praticas:sino", sino ? "1" : "0");
  }, [sino]);

  // Ambient procedural drone
  useEffect(() => {
    window.localStorage.setItem("praticas:ambient", ambient ? "1" : "0");

    const stop = () => {
      ambientNodesRef.current?.stop();
      ambientNodesRef.current = null;
    };

    if (!ambient || paused) {
      stop();
      return;
    }

    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const master = ctx.createGain();
      master.gain.value = 0;
      master.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;
      filter.Q.value = 0.7;

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = 110;
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = 164.81;
      const osc3 = ctx.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.value = 220;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 80;
      lfo.connect(lfoGain).connect(filter.frequency);

      const g3 = ctx.createGain();
      g3.gain.value = 0.4;

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(g3).connect(filter);
      filter.connect(master).connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();
      lfo.start();

      ambientNodesRef.current = {
        stop: () => {
          try {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
            setTimeout(() => {
              [osc1, osc2, osc3, lfo].forEach((n) => {
                try {
                  n.stop();
                } catch {}
              });
            }, 900);
          } catch {}
        },
      };
    } catch {
      // ignore
    }

    return stop;
  }, [ambient, paused]);

  useEffect(() => {
    return () => {
      ambientNodesRef.current?.stop();
      audioCtxRef.current?.close().catch(() => {});
      gongCtxRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    document.title = pratica ? `${pratica.titulo} — em sessão` : "Sessão";
  }, [pratica]);

  // Pausa inteligente — pausa quando aba perde foco
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Auto-hide chrome + "modo sem tela" (dim after longer idle)
  const wakeChrome = () => {
    setChromeVisible(true);
    setDimmed(false);
    // Aproveita o gesto do usuário para destravar autoplay do sino
    try { gongCtxRef.current?.resume?.(); } catch {}
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => setChromeVisible(false), 4000);
    if (dimTimerRef.current) window.clearTimeout(dimTimerRef.current);
    dimTimerRef.current = window.setTimeout(() => setDimmed(true), 15000);
  };
  useEffect(() => {
    wakeChrome();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (dimTimerRef.current) window.clearTimeout(dimTimerRef.current);
    };
  }, []);

  // Persist Sprint 1 toggles
  useEffect(() => {
    try { window.localStorage.setItem("praticas:legendasGrandes", largeLabels ? "1" : "0"); } catch {}
  }, [largeLabels]);
  useEffect(() => {
    try { window.localStorage.setItem("praticas:intensidade", String(intensity)); } catch {}
  }, [intensity]);

  const encerrar = () => {
    navigate(`${basePath}/praticas/${slug}/checkout?dur=${elapsed}`);
  };

  // Gong / sino curto em transição de fase — usa contexto isolado do drone ambiente.
  const playGong = useCallback((freq: number) => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      let ctx = gongCtxRef.current;
      if (!ctx || ctx.state === "closed") {
        ctx = new Ctx();
        gongCtxRef.current = ctx;
      }
      const schedule = () => {
        try {
          const c = gongCtxRef.current;
          if (!c || c.state === "closed") return;
          const now = c.currentTime;
          const gain = c.createGain();
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
          const osc = c.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq;
          const osc2 = c.createOscillator();
          osc2.type = "sine";
          osc2.frequency.value = freq * 2.01;
          const g2 = c.createGain();
          g2.gain.value = 0.35;
          const osc3 = c.createOscillator();
          osc3.type = "sine";
          osc3.frequency.value = freq * 0.5;
          const g3 = c.createGain();
          g3.gain.value = 0.15;
          osc.connect(gain);
          osc2.connect(g2).connect(gain);
          osc3.connect(g3).connect(gain);
          gain.connect(c.destination);
          osc.start(now);
          osc2.start(now);
          osc3.start(now);
          osc.stop(now + 1.45);
          osc2.stop(now + 1.45);
          osc3.stop(now + 1.45);
        } catch (err) {
          console.warn("[pratica] gong schedule failed", err);
        }
      };
      // Garante que o contexto esteja "running" antes de agendar (importante em Safari/iOS).
      const resumePromise = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
      Promise.resolve(resumePromise).then(schedule).catch(schedule);
      // Pulso visual no botão do sino para feedback de que tocou.
      setGongPulse(true);
      if (gongPulseTimerRef.current) window.clearTimeout(gongPulseTimerRef.current);
      gongPulseTimerRef.current = window.setTimeout(() => setGongPulse(false), 280);
    } catch (err) {
      console.warn("[pratica] gong failed", err);
    }
  }, []);

  const onPhaseChange = useCallback(
    (next: BreathingPhase) => {
      // Apenas o início de um novo ciclo (inspiração) toca o sino — evita 3-4 sinos por ciclo.
      if (sino && next === "inspirar") {
        playGong(528);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            (navigator as Navigator).vibrate?.([40]);
          } catch {}
        }
      }
      if (next === "inspirar") setCiclos((c) => c + 1);
    },
    [sino, playGong]
  );

  // Callback estável para a Pausa de 3 minutos — sino apenas em transição real de etapa.
  const onPausaEtapaChange = useCallback(
    (i: number) => {
      if (sino && i > 0) playGong(440);
    },
    [sino, playGong]
  );

  // Callback estável para o Grounding — sino suave ao avançar de passo.
  const onGroundingAvancar = useCallback(() => {
    if (sino) playGong(528);
  }, [sino, playGong]);

  // Fullscreen with iOS fallback
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = async () => {
    const doc: any = document;
    const el: any = document.documentElement;
    const inFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
    try {
      if (inFs) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        setIsFullscreen(false);
        el.classList.remove("pratica-fullscreen-fallback");
      } else {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else {
          el.classList.add("pratica-fullscreen-fallback");
          window.scrollTo(0, 1);
        }
        setIsFullscreen(true);
      }
    } catch {
      el.classList.toggle("pratica-fullscreen-fallback");
      setIsFullscreen((v) => !v);
    }
  };

  useEffect(() => {
    const sync = () => {
      const doc: any = document;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as any);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync as any);
      window.removeEventListener("keydown", onKey);
      const doc: any = document;
      if (doc.fullscreenElement && doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
      else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      document.documentElement.classList.remove("pratica-fullscreen-fallback");
    };
  }, []);

  const progress = useMemo(
    () => Math.min(100, (elapsed / totalSeg) * 100),
    [elapsed, totalSeg]
  );


  // Particle count scales with user intensity (1..5) and is suppressed under reduced-motion.
  const visibleParticles = useMemo(() => {
    if (reducedMotion) return [] as typeof PARTICLES;
    const count = Math.round((PARTICLES.length * intensity) / 5);
    return PARTICLES.slice(0, count);
  }, [reducedMotion, intensity]);
  const auroraBlur = `blur(${40 + intensity * 12}px)`;
  const auroraOpacity = 0.4 + intensity * 0.1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-primary-foreground overflow-y-auto"
      style={{ minHeight: "100dvh" }}
      onPointerMove={wakeChrome}
      onTouchStart={wakeChrome}
      onClick={() => { if (dimmed) wakeChrome(); }}
    >
      {/* Scene layers */}
      <div
        aria-hidden
        className={`absolute inset-0 ${tema.className}`}
        style={{
          animationPlayState: paused || reducedMotion ? "paused" : "running",
          filter: auroraBlur,
          opacity: auroraOpacity,
        }}
      />
      <div aria-hidden className="absolute inset-0 pratica-scene-vignette" />
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {visibleParticles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-primary-foreground pratica-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              filter: "blur(0.5px)",
              animation: `praticaFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        ))}
      </div>

      {/* "Modo sem tela" — dim overlay that escurece tudo menos o círculo respirando */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-[2000ms] ${
          dimmed ? "opacity-80" : "opacity-0"
        }`}
        style={{
          maskImage:
            "radial-gradient(circle at 50% 50%, transparent 18%, black 55%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, transparent 18%, black 55%)",
        }}
      />

      {/* Top bar */}
      <header
        className={`relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 transition-all duration-500 ${
          chromeVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {tenantLogo ? (
          <img
            src={tenantLogo}
            alt={tenant?.name || "Logo"}
            className="h-8 sm:h-10 w-auto object-contain opacity-90"
          />
        ) : (
          <p className="font-serif text-base sm:text-lg opacity-90">{tenant?.name || "Rede Bem-Estar"}</p>
        )}
        <button
          onClick={encerrar}
          className="p-2 rounded-full hover:bg-white/10 transition"
          aria-label="Encerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center pb-4">
        <h1
          className={`font-serif text-2xl sm:text-3xl mb-1 drop-shadow-[0_2px_18px_rgba(0,0,0,0.25)] transition-opacity duration-700 ${
            dimmed ? "opacity-0" : "opacity-100"
          }`}
        >
          {pratica?.titulo ?? "Respiração guiada"}
        </h1>
        <p
          className={`opacity-80 mb-3 sm:mb-4 max-w-md text-sm transition-opacity duration-700 ${
            dimmed ? "!opacity-0" : ""
          }`}
        >
          {pratica?.subtitulo ?? "Acalme sua mente agora"}
        </p>

        {slug === "pausa-tres-minutos" ? (
          <PausaTresMinutosSessao
            paused={paused}
            largeLabels={largeLabels}
            onEtapaChange={onPausaEtapaChange}
          />
        ) : slug === "grounding-54321" ? (
          <GroundingSessao
            largeLabels={largeLabels}
            onAvancar={onGroundingAvancar}
            onConcluir={() => navigate(`${basePath}/praticas/${slug}/checkout?dur=${elapsed}`)}
          />
        ) : (
          <BreathingCircle
            inspirar={padrao.inspirar}
            segurar={padrao.segurar}
            expirar={padrao.expirar}
            segurarPosExpirar={padrao.segurar_pos_expirar ?? 0}
            inspirarCurta={padrao.inspirar_curta ?? 0}
            paused={paused}
            onPhaseChange={onPhaseChange}
            reducedMotion={reducedMotion}
            largeLabels={largeLabels}
          />
        )}

        <div className="mt-4 sm:mt-6 w-full max-w-md">
          <div className="h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-primary-foreground/90 transition-all"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 12px hsl(var(--primary-foreground) / 0.7)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-sm sm:text-base font-medium tabular-nums opacity-95 mt-2 drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
            <span>{fmt(elapsed)}</span>
            <span className="opacity-80">Ciclo {ciclos}</span>
            <span>{fmt(totalSeg)}</span>
          </div>
        </div>
      </main>

      {/* Controls */}
      <footer
        className={`relative z-20 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6 transition-all duration-500 ${
          chromeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {audioUrl && (
          <div className="flex items-center gap-2 rounded-full border border-white/30 bg-transparent pl-1 pr-3 py-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMuted((m) => !m)}
              className="rounded-full h-9 w-9 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              aria-label={muted ? "Ativar trilha" : "Mutar trilha"}
              title={muted ? "Trilha desligada" : `Volume ${Math.round(volume * 100)}%`}
            >
              {muted || volume === 0 ? <VolumeOff className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider
              value={[muted ? 0 : Math.round(volume * 100)]}
              onValueChange={([v]) => {
                setVolume(v / 100);
                if (muted && v > 0) setMuted(false);
              }}
              max={100}
              step={1}
              aria-label="Volume da trilha"
              className="w-24 sm:w-28"
            />
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setAmbient((a) => !a)}
          className={`relative rounded-full bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground ${
            ambient ? "border-white/60" : "border-white/20"
          }`}
          aria-label={ambient ? "Desligar som ambiente" : "Ligar som ambiente"}
          title={ambient ? "Som ambiente ativo" : "Som ambiente desligado"}
        >
          <Waves className="h-5 w-5" />
          {!ambient && (
            <span
              aria-hidden
              className="absolute left-1.5 right-1.5 top-1/2 h-px bg-current rotate-45 origin-center"
            />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSino((s) => !s)}
          className={`rounded-full bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground relative ${
            sino ? "border-white/60" : "border-white/20"
          } ${sino && gongPulse ? "ring-2 ring-white/70 scale-110" : ""} transition-all duration-200`}
          aria-label={sino ? "Desligar sino de transição" : "Ligar sino de transição"}
          title={sino ? "Sino de transição ativo" : "Sino de transição desligado"}
        >
          {sino ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLargeLabels((v) => !v)}
          className={`rounded-full bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground ${
            largeLabels ? "border-white/60" : "border-white/20"
          }`}
          aria-label={largeLabels ? "Desativar legendas grandes" : "Ativar legendas grandes"}
          title={largeLabels ? "Legendas grandes ativas" : "Legendas grandes desligadas"}
          aria-pressed={largeLabels}
        >
          <Type className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-white/30 bg-transparent pl-3 pr-3 py-1">
          <Sparkles className="h-4 w-4 opacity-90" aria-hidden />
          <Slider
            value={[intensity]}
            onValueChange={([v]) => setIntensity(v)}
            min={1}
            max={5}
            step={1}
            aria-label="Intensidade visual"
            className="w-20 sm:w-24"
          />
          <span className="text-xs tabular-nums opacity-80 w-3 text-center">{intensity}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="rounded-full bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
          title={isFullscreen ? "Sair da tela cheia (F)" : "Tela cheia (F)"}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setPaused((p) => !p)}
          className="rounded-full px-6 sm:px-8"
        >
          {paused ? (
            <>
              <Play className="h-5 w-5 mr-2" /> Continuar
            </>
          ) : (
            <>
              <Pause className="h-5 w-5 mr-2" /> Pausar
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExtraSec((s) => s + 60)}
          className="rounded-full bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          title="Estender duração em 1 minuto"
        >
          <Plus className="h-4 w-4 mr-1" /> 1 min
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={encerrar}
          className="rounded-full bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
        >
          Encerrar
        </Button>
      </footer>

      {audioUrl && (
        <audio
          key={audioUrl}
          ref={audioRef}
          src={audioUrl}
          loop
          autoPlay
          muted={muted}
          preload="auto"
          onError={(e) => console.warn("[pratica] audio error", audioUrl, e)}
          onCanPlay={() => console.info("[pratica] audio canplay", audioUrl)}
          className="hidden"
        />
      )}
    </div>
  );
};

export default PraticaSessao;
