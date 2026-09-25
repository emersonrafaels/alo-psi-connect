import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BODY_REGION_OPTIONS, getBodyRegionLabel, summarizeBodyLayerRegions } from "../bodyRegions";
import type { BodyMapLayer } from "../types";

type BodyAfter = NonNullable<BodyMapLayer["after"]>;

const OPTIONS: { id: BodyAfter; label: string }[] = [
  { id: "less", label: "Menos intenso" },
  { id: "same", label: "Igual" },
  { id: "more", label: "Mais intenso" },
  { id: "moved", label: "Mudou de lugar" },
  { id: "unsure", label: "Não sei" },
];

export const BodyCheckout = ({
  layers,
  onChange,
  onMovedRegionChange,
  onBack,
  onNext,
}: {
  layers: BodyMapLayer[];
  onChange: (layerId: string, after: BodyAfter) => void;
  onMovedRegionChange: (layerId: string, movedRegionId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="space-y-6 p-5 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Regular · check-out corporal</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">E no corpo, como ficou?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Se você criou camadas no Mapa Corporal, compare com cuidado como elas aparecem agora. “Igual”, “mais intenso”, “mudou de lugar” e “não sei” também são respostas válidas.
        </p>
      </div>

      <div className="space-y-3">
        {layers.map((layer) => (
          <div key={layer.id} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: layer.color }} />
                  <span className="truncate">{layer.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Antes da prática: {layer.intensity}/5 · {summarizeBodyLayerRegions(layer)}
                </p>
              </div>
              {layer.after === "moved" && layer.movedRegionId && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Agora: {getBodyRegionLabel(layer.movedRegionId)}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={layer.after === option.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => onChange(layer.id, option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {layer.after === "moved" && (
              <div className="mt-4 max-w-xl space-y-2">
                <label className="text-xs font-semibold text-foreground" htmlFor={`moved-region-${layer.id}`}>
                  Para onde você percebeu que mudou?
                </label>
                <Select value={layer.movedRegionId ?? ""} onValueChange={(value) => onMovedRegionChange(layer.id, value)}>
                  <SelectTrigger id={`moved-region-${layer.id}`} className="rounded-xl">
                    <SelectValue placeholder="Selecione uma região (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_REGION_OPTIONS.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="rounded-2xl bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
        Essa comparação pertence ao mesmo check-in. Ela ajuda a construir consciência corporal e histórico pessoal, mas não prova que a prática causou uma mudança.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar à prática
        </Button>
        <Button onClick={onNext}>
          Continuar para agir
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);
