import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** Texto atual do campo; a transcrição é acrescentada ao final. */
  currentValue: string;
  onChange: (next: string) => void;
}

type State = "idle" | "recording" | "transcribing";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export const VoiceInputButton = ({ currentValue, onChange }: Props) => {
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(currentValue);
  valueRef.current = currentValue;
  const { toast } = useToast();

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const transcribe = async (blob: Blob, mime: string) => {
    setState("transcribing");
    try {
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audio: btoa(bin), audio_format: mime.includes("mp4") ? "mp4" : "webm" },
      });
      const text = (data?.transcription as string | undefined)?.trim();
      if (error || !text) throw error ?? new Error("vazio");
      const prev = valueRef.current.trim();
      onChange(prev ? `${prev} ${text}` : text);
    } catch (e) {
      console.error("[VoiceInputButton]", e);
      toast({ title: "Não foi possível transcrever", description: "Tente gravar de novo.", variant: "destructive" });
    } finally {
      setState("idle");
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size) transcribe(blob, mime);
        else setState("idle");
      };
      recRef.current = rec;
      rec.start(1000);
      setSeconds(0);
      setState("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast({ title: "Microfone indisponível", description: "Permita o acesso ao microfone para gravar.", variant: "destructive" });
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recRef.current?.stop();
  };

  if (state === "transcribing")
    return (
      <Button type="button" size="sm" variant="outline" className="rounded-full" disabled>
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Transcrevendo…
      </Button>
    );
  if (state === "recording")
    return (
      <Button type="button" size="sm" variant="destructive" className="rounded-full" onClick={stop}>
        <Square className="mr-1.5 h-3.5 w-3.5" /> Parar · {fmt(seconds)}
      </Button>
    );
  return (
    <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={start}>
      <Mic className="mr-1.5 h-4 w-4" /> Gravar áudio
    </Button>
  );
};
