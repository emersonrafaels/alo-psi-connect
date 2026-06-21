import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import {
  useEmotionalScales,
  useLatestResponseByScale,
  useMissingIseuScales,
  severityBand,
  POSITIVE_SCALES,
  ISEU_BAND_COLOR,
  type EmotionalScale,
} from "@/hooks/useEmotionalScales";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ClipboardList, HeartPulse, ArrowRight, History, Sparkles, Activity, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScaleExplainerDialog } from "@/components/scales/ScaleExplainerDialog";
import { SCALE_EXPLAINERS, ISEU_EXPLAINER } from "@/data/scaleExplainers";

const EmotionalScales = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const slug = tenant?.slug || "alopsi";
  const [explainer, setExplainer] = useState<{ title: string; url: string; code?: string } | null>(null);

  const { data: scales, isLoading } = useEmotionalScales();
  const { data: latestMap } = useLatestResponseByScale();
  const { data: missingScales } = useMissingIseuScales();

  if (!authLoading && !user) {
    navigate(buildTenantPath(slug, "/auth"));
    return null;
  }

  const getAvailability = (frequencyDays: number, lastTakenAt?: string) => {
    if (!lastTakenAt) return { available: true, label: "Disponível" };
    const next = new Date(lastTakenAt).getTime() + frequencyDays * 86_400_000;
    const days = Math.ceil((next - Date.now()) / 86_400_000);
    if (days <= 0) return { available: true, label: "Disponível" };
    return { available: false, label: `Próxima em ${days} dia${days === 1 ? "" : "s"}` };
  };

  const positiveScales = (scales ?? []).filter((s) => POSITIVE_SCALES.has(s.code));
  const symptomScales = (scales ?? []).filter((s) => !POSITIVE_SCALES.has(s.code));

  const renderScaleCard = (scale: EmotionalScale) => {
    const last = latestMap?.[scale.code];
    const avail = getAvailability(scale.frequency_days, last?.taken_at);
    const isNew = scale.code === "MHCSF";
    const band = last ? severityBand(scale.code, last.severity) : null;

    return (
      <Card key={scale.id} className="rounded-2xl border-border/60 hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CardTitle className="text-lg">{scale.name}</CardTitle>
                {isNew && (
                  <Badge className="bg-primary/15 text-primary border-0 text-[10px] uppercase tracking-wide">
                    Novo
                  </Badge>
                )}
              </div>
              <CardDescription>{scale.short_description}</CardDescription>
            </div>
            <Badge variant={avail.available ? "default" : "secondary"} className="shrink-0">
              {avail.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{scale.estimated_minutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              Frequência sugerida: {scale.frequency_days} dias
            </span>
          </div>

          {last && (
            <div className="text-sm bg-muted/40 rounded-lg p-3">
              <div className="text-muted-foreground text-xs">Última aplicação</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium">
                  {new Date(last.taken_at).toLocaleDateString("pt-BR")}
                </span>
                {band && (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: ISEU_BAND_COLOR[band] }}
                    />
                    <Badge
                      variant="outline"
                      className="capitalize"
                      style={{ borderColor: ISEU_BAND_COLOR[band], color: ISEU_BAND_COLOR[band] }}
                    >
                      {last.severity}
                    </Badge>
                  </span>
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            variant={avail.available ? "default" : "outline"}
            onClick={() => navigate(buildTenantPath(slug, `/escalas/${scale.code.toLowerCase()}`))}
          >
            {last ? "Responder novamente" : "Responder agora"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <HeartPulse className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Escalas Emocionais</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Instrumentos clinicamente validados para acompanhar seu bem-estar ao longo do tempo.
            Suas respostas ficam registradas no seu histórico para que você acompanhe sua evolução.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(buildTenantPath(slug, "/minhas-emocoes"))}
            >
              <History className="h-4 w-4 mr-2" />
              Ver meu histórico
            </Button>
        </div>

        {missingScales && missingScales.length > 0 && (
          <div className="mb-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="text-sm font-medium">
              Faltam {missingScales.length} escala{missingScales.length === 1 ? "" : "s"} para calcular seu ISEU-RBE
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Responda: <span className="font-medium">{missingScales.join(", ")}</span>
            </div>
          </div>
        )}

        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">Saúde mental positiva</h2>
                <span className="text-xs text-muted-foreground">
                  mede florescimento e bem-estar
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {positiveScales.map(renderScaleCard)}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">Sintomas e risco</h2>
                <span className="text-xs text-muted-foreground">
                  identifica sinais clínicos para acompanhamento
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {symptomScales.map(renderScaleCard)}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EmotionalScales;
