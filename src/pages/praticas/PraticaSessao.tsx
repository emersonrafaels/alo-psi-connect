import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Pause, Play, Volume2, VolumeX, Music2, Music, Maximize2, Minimize2 } from "lucide-react";
import { usePratica } from "@/hooks/usePraticas";
import { BreathingCircle } from "@/components/praticas/BreathingCircle";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

// Deterministic pseudo-random for particle positions
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

  const duracaoMin = Number(params.get("d") || pratica?.duracao_min_default || 5);
  const somPref = params.get("som") === "1";
  const totalSeg = duracaoMin * 60;

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(!somPref);
  const [ambient, setAmbient] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("praticas:ambient");
    return stored === null ? true : stored === "1";
  });
  const [chromeVisible, setChromeVisible] = useState(true);
  const idleTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Web Audio ambient drone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<{ stop: () => void } | null>(null);

  const padrao = pratica?.padrao_respiracao ?? { inspirar: 4, segurar: 0, expirar: 6 };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (elapsed >= totalSeg && totalSeg > 0) {
      navigate(`${basePath}/praticas/${slug}/checkout?dur=${totalSeg}`);
    }
  }, [elapsed, totalSeg, basePath, slug, navigate]);

  // Voice guide audio
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (paused) a.pause();
    else a.play().catch(() => {});
  }, [paused, muted]);

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
      osc2.frequency.value = 164.81; // E3
      const osc3 = ctx.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.value = 220;

      // LFO for slow shimmer
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
      // ignore audio errors
    }

    return stop;
  }, [ambient, paused]);

  useEffect(() => {
    return () => {
      ambientNodesRef.current?.stop();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    document.title = pratica ? `${pratica.titulo} — em sessão` : "Sessão";
  }, [pratica]);

  // Auto-hide chrome
  const wakeChrome = () => {
    setChromeVisible(true);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => setChromeVisible(false), 4000);
  };
  useEffect(() => {
    wakeChrome();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  const encerrar = () => {
    navigate(`${basePath}/praticas/${slug}/checkout?dur=${elapsed}`);
  };

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
          // iOS Safari fallback
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

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-primary-foreground overflow-hidden overscroll-none"
      style={{ height: "100dvh" }}
      onPointerMove={wakeChrome}
      onTouchStart={wakeChrome}
    >
      {/* Scene layers */}
      <div
        aria-hidden
        className="absolute inset-0 pratica-scene-aurora"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      />
      <div aria-hidden className="absolute inset-0 pratica-scene-vignette" />
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
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

      {/* Top bar */}
      <header
        className={`relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 transition-all duration-500 ${
          chromeVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <p className="font-serif text-base sm:text-lg opacity-90">Rede Bem-Estar</p>
        <button
          onClick={encerrar}
          className="p-2 rounded-full hover:bg-white/10 transition"
          aria-label="Encerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
        <h1 className="font-serif text-2xl sm:text-4xl mb-2 drop-shadow-[0_2px_18px_rgba(0,0,0,0.25)]">
          {pratica?.titulo ?? "Respiração guiada"}
        </h1>
        <p className="opacity-80 mb-8 sm:mb-12 max-w-md text-sm sm:text-base">
          {pratica?.subtitulo ?? "Acalme sua mente agora"}
        </p>

        <BreathingCircle
          inspirar={padrao.inspirar}
          segurar={padrao.segurar}
          expirar={padrao.expirar}
          paused={paused}
        />

        <div className="mt-8 sm:mt-12 w-full max-w-md">
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-primary-foreground/90 transition-all"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 12px hsl(var(--primary-foreground) / 0.7)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm opacity-80 mt-2">
            <span>{fmt(elapsed)}</span>
            <span>{fmt(totalSeg)}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 pb-6 sm:pb-10 transition-all duration-500 ${
          chromeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {pratica?.tem_audio && pratica.audio_url && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMuted((m) => !m)}
            className="rounded-full bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            aria-label={muted ? "Ativar voz guia" : "Mutar voz guia"}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setAmbient((a) => !a)}
          className="rounded-full bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          aria-label={ambient ? "Desligar som ambiente" : "Ligar som ambiente"}
          title={ambient ? "Som ambiente ativo" : "Som ambiente desligado"}
        >
          {ambient ? <Music2 className="h-5 w-5" /> : <Music className="h-5 w-5 opacity-50" />}
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
          size="lg"
          onClick={encerrar}
          className="rounded-full bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
        >
          Encerrar
        </Button>
      </footer>

      {pratica?.tem_audio && pratica.audio_url && (
        <audio
          ref={audioRef}
          src={pratica.audio_url}
          loop
          autoPlay
          muted={muted}
          className="hidden"
        />
      )}
    </div>
  );
};

export default PraticaSessao;
