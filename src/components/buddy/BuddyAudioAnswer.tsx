import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Trash2, Play, Pause, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  fieldKey: string;
  onTranscribed: (text: string, mode: "append" | "replace") => void;
  onAudioUrl?: (url: string | null) => void;
  existingUrl?: string | null;
};

export function BuddyAudioAnswer({ fieldKey, onTranscribed, onAudioUrl, existingUrl }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => cleanup(), []);
  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (localUrl) URL.revokeObjectURL(localUrl);
  }

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => finalize(mime);
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      toast({ title: "Sem acesso ao microfone", description: "Permita o microfone para gravar.", variant: "destructive" });
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRecording(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const finalize = async (mime: string) => {
    const blob = new Blob(chunksRef.current, { type: mime });
    if (blob.size < 1200) {
      toast({ title: "Gravação muito curta", description: "Tente novamente falando por alguns segundos.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(blob);
    setLocalUrl(url);
    setBusy(true);
    try {
      // 1) Upload no storage (privado por paciente)
      let storageUrl: string | null = null;
      if (user?.id) {
        const ext = mime.includes("mp4") ? "mp4" : "webm";
        const path = `${user.id}/${fieldKey}/${Date.now()}.${ext}`;
        const up = await supabase.storage.from("buddy-audio").upload(path, blob, {
          contentType: mime, upsert: true,
        });
        if (!up.error) {
          storageUrl = path;
          onAudioUrl?.(path);
        }
      }

      // 2) Transcrição
      const fd = new FormData();
      fd.append("file", blob, `recording.${mime.includes("mp4") ? "mp4" : "webm"}`);
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/buddy-transcribe-audio`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Falha ao transcrever");
      const text = (json?.text as string) ?? "";
      if (text.trim()) {
        onTranscribed(text.trim(), "append");
        toast({ title: "Transcrito pelo Buddy", description: "Você pode editar o texto como quiser." });
      } else {
        toast({ title: "Não entendi o áudio", description: "Tente falar um pouco mais alto ou por mais tempo.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro ao transcrever", description: e?.message ?? "Tente de novo.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  const remove = () => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(null);
    onAudioUrl?.(null);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {!recording && !localUrl && (
        <Button type="button" size="sm" variant="outline" onClick={start} disabled={busy} className="rounded-full">
          {busy ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Mic className="h-3.5 w-3.5 mr-2" />}
          {busy ? "Transcrevendo…" : "Falar em vez de digitar"}
        </Button>
      )}
      {recording && (
        <div className="flex items-center gap-3 rounded-full bg-destructive/10 border border-destructive/30 px-3 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive/60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          <Waveform />
          <span className="text-xs font-mono text-destructive">{mmss}</span>
          <Button type="button" size="sm" variant="destructive" onClick={stop} className="h-7 rounded-full">
            <Square className="h-3.5 w-3.5 mr-1" /> Parar
          </Button>
        </div>
      )}
      {localUrl && !recording && (
        <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-2 py-1">
          <audio ref={audioRef} src={localUrl} onEnded={() => setPlaying(false)} />
          <Button type="button" size="sm" variant="ghost" onClick={togglePlay} className="h-7 w-7 p-0 rounded-full">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <span className="text-xs text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> transcrito
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={remove} className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function Waveform() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn("w-0.5 bg-destructive rounded-full animate-pulse")}
          style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
