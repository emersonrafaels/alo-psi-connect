import { useEffect, useState } from "react";
import { Accessibility, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { A11yPrefs, DEFAULT_PREFS, STORAGE_KEY, applyPrefs, loadPrefs, stepScale } from "./prefs";

const TOGGLES: { key: keyof A11yPrefs; label: string }[] = [
  { key: "contrast", label: "Alto contraste" },
  { key: "grayscale", label: "Tons de cinza" },
  { key: "readableFont", label: "Fonte legível" },
  { key: "spacing", label: "Mais espaçamento" },
  { key: "links", label: "Destacar links" },
  { key: "bigCursor", label: "Cursor grande" },
  { key: "noMotion", label: "Pausar animações" },
  { key: "readingGuide", label: "Guia de leitura" },
];

export default function AccessibilityWidget() {
  const [prefs, setPrefs] = useState<A11yPrefs>(loadPrefs);
  const [guideY, setGuideY] = useState(-100);

  useEffect(() => {
    applyPrefs(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (!prefs.readingGuide) return;
    const h = (e: MouseEvent) => setGuideY(e.clientY);
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [prefs.readingGuide]);

  const set = (k: keyof A11yPrefs, v: any) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <>
      {prefs.readingGuide && (
        <div aria-hidden className="pointer-events-none fixed inset-x-0 z-[60] h-10 -translate-y-1/2 border-y-2 border-primary bg-primary/10" style={{ top: guideY }} />
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" aria-label="Opções de acessibilidade" className="fixed bottom-6 left-6 z-40 h-12 w-12 rounded-full shadow-lg">
            <Accessibility className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-80 space-y-4">
          <div>
            <h2 className="font-semibold">Acessibilidade</h2>
            <p className="text-sm text-muted-foreground">Ajuste o site do seu jeito. Fica salvo neste navegador.</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tamanho do texto</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Diminuir texto" onClick={() => set("scale", stepScale(prefs.scale, -1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-12 text-center text-sm tabular-nums" data-no-translate>{Math.round(prefs.scale * 100)}%</span>
              <Button variant="outline" size="icon" aria-label="Aumentar texto" onClick={() => set("scale", stepScale(prefs.scale, 1))}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="space-y-3">
            {TOGGLES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`a11y-${key}`}>{label}</Label>
                <Switch id={`a11y-${key}`} checked={Boolean(prefs[key])} onCheckedChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" onClick={() => setPrefs({ ...DEFAULT_PREFS })}>
            <RotateCcw className="h-4 w-4" /> Restaurar padrão
          </Button>
        </PopoverContent>
      </Popover>
    </>
  );
}
