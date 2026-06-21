import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { usePratica } from "@/hooks/usePraticas";
import { BreathingCircle } from "@/components/praticas/BreathingCircle";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

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
  const audioRef = useRef<HTMLAudioElement>(null);

  const padrao = pratica?.padrao_respiracao ?? { inspirar: 4, segurar: 0, expirar: 6 };

  // tick
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [paused]);

  // navigate to checkout when finished
  useEffect(() => {
    if (elapsed >= totalSeg && totalSeg > 0) {
      navigate(`${basePath}/praticas/${slug}/checkout?dur=${totalSeg}`);
    }
  }, [elapsed, totalSeg, basePath, slug, navigate]);

  // audio sync
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (paused) a.pause();
    else a.play().catch(() => {});
  }, [paused, muted]);

  useEffect(() => {
    document.title = pratica ? `${pratica.titulo} — em sessão` : "Sessão";
  }, [pratica]);

  const encerrar = () => {
    navigate(`${basePath}/praticas/${slug}/checkout?dur=${elapsed}`);
  };

  const progress = useMemo(
    () => Math.min(100, (elapsed / totalSeg) * 100),
    [elapsed, totalSeg]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground overflow-hidden">
      {/* top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <p className="font-serif text-lg opacity-90">Rede Bem-Estar</p>
        <button
          onClick={encerrar}
          className="p-2 rounded-full hover:bg-white/10 transition"
          aria-label="Encerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl md:text-4xl mb-2">
          {pratica?.titulo ?? "Respiração guiada"}
        </h1>
        <p className="opacity-80 mb-12 max-w-md">
          {pratica?.subtitulo ?? "Acalme sua mente agora"}
        </p>

        <BreathingCircle
          inspirar={padrao.inspirar}
          segurar={padrao.segurar}
          expirar={padrao.expirar}
          paused={paused}
        />

        <div className="mt-12 w-full max-w-md">
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-white/80 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm opacity-80 mt-2">
            <span>{fmt(elapsed)}</span>
            <span>{fmt(totalSeg)}</span>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-center gap-3 px-6 pb-10">
        {pratica?.tem_audio && pratica.audio_url && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMuted((m) => !m)}
            className="rounded-full bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            aria-label={muted ? "Ativar som" : "Mutar"}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        )}
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setPaused((p) => !p)}
          className="rounded-full px-8"
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
