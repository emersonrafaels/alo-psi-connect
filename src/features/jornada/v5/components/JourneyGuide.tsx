import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GuidePreviewDialog } from "./GuidePreviewDialog";
import { cancelSpeech, collectText, speak, speechSupported } from "../lib/speech";

export const JourneyGuide = ({ title, text, duration = "~25s", allowVideo = true, readPage = false }: { title: string; text: string; duration?: string; allowVideo?: boolean; readPage?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { cancelSpeech(); }, [title]);

  const toggleSpeech = () => {
    if (!speechSupported()) {
      toast("A leitura em voz alta não está disponível neste navegador.");
      return;
    }
    if (speaking) {
      cancelSpeech();
      return;
    }
    const root = rootRef.current;
    let content = "";
    if (readPage && root?.parentElement) {
      const wrapper = document.createElement("div");
      let sib = root.nextElementSibling;
      while (sib) { wrapper.appendChild(sib.cloneNode(true)); sib = sib.nextElementSibling; }
      content = collectText(wrapper);
    } else {
      const section = root?.closest("section, [data-journey-step]") ?? root?.parentElement ?? null;
      content = collectText(section, [title, text]);
    }
    if (!content) content = `${title}. ${text}`;
    setSpeaking(true);
    speak(content, () => setSpeaking(false));
  };
  return (
    <>
      <div ref={rootRef} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Play className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1"><strong className="block text-sm text-foreground">{title}</strong><span className="text-xs text-muted-foreground">{text}</span></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleSpeech}>{speaking ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}{speaking ? "Parar leitura" : readPage ? "Ouvir esta etapa" : "Ouvir"}</Button>
          {allowVideo && <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Ver orientação · {duration}</Button>}
        </div>
      </div>
      <GuidePreviewDialog open={open} onOpenChange={setOpen} title={title} />
    </>
  );
};