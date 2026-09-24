import { useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuidePreviewDialog } from "./GuidePreviewDialog";

export const JourneyGuide = ({ title, text, duration = "~25s", allowVideo = true }: { title: string; text: string; duration?: string; allowVideo?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${title}. ${text}`);
    utterance.lang = "pt-BR";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Play className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1"><strong className="block text-sm text-foreground">{title}</strong><span className="text-xs text-muted-foreground">{text}</span></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleSpeech}>{speaking ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}{speaking ? "Parar" : "Ouvir"}</Button>
          {allowVideo && <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Ver orientação · {duration}</Button>}
        </div>
      </div>
      <GuidePreviewDialog open={open} onOpenChange={setOpen} title={title} />
    </>
  );
};