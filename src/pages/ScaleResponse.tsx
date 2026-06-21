import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import {
  useEmotionalScale,
  useSubmitScaleResponse,
  useUserScaleResponses,
  severityBand,
  ISEU_BAND_COLOR,
} from "@/hooks/useEmotionalScales";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import { ScaleExplainerDialog } from "@/components/scales/ScaleExplainerDialog";
import { SCALE_EXPLAINERS } from "@/data/scaleExplainers";

const MHCSF_INTERPRETATION: Record<string, { title: string; text: string }> = {
  florescimento: {
    title: "Você está em florescimento",
    text: "Seus indicadores apontam alta presença de bem-estar emocional, social e psicológico nas últimas semanas. Continue cultivando o que tem feito bem a você.",
  },
  moderado: {
    title: "Saúde mental moderada",
    text: "Você apresenta bem-estar em algumas áreas, mas há espaço para fortalecer outras. Pequenas práticas constantes (sono, conexões, propósito) costumam fazer diferença.",
  },
  definhamento: {
    title: "Sinais de definhamento",
    text: "Os indicadores sugerem baixa presença de bem-estar. Considere conversar com um profissional de cuidado — buscar apoio é um passo importante.",
  },
};

const ScaleResponse = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const slug = tenant?.slug || "alopsi";

  const scaleCode = (code || "").toUpperCase();
  const { data, isLoading } = useEmotionalScale(scaleCode);
  const { data: history } = useUserScaleResponses(scaleCode);
  const submit = useSubmitScaleResponse();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof submit.mutateAsync>> | null>(null);
  const [explainerOpen, setExplainerOpen] = useState(false);


  if (!authLoading && !user) {
    navigate(buildTenantPath(slug, "/auth"));
    return null;
  }

  const items = data?.items ?? [];
  const scale = data?.scale;
  const previous = history?.[1]; // history[0] would be the just-submitted if any

  const allAnswered = useMemo(
    () => items.length > 0 && items.every((it) => typeof answers[it.position] === "number"),
    [items, answers],
  );

  const handleSubmit = async () => {
    if (!scale || !allAnswered) return;
    try {
      const payload = items.map((it) => answers[it.position]);
      const res = await submit.mutateAsync({ scale_code: scale.code, answers: payload });
      setResult(res);
      window.scrollTo(0, 0);
    } catch (e: any) {
      const details = e?.details;
      if (details?.error === "frequency_blocked") {
        toast.error(details.message);
      } else {
        toast.error(e?.message || "Erro ao enviar respostas");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-96 rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!scale) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
          <p className="text-muted-foreground">Escala não encontrada.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = items.length ? (answeredCount / items.length) * 100 : 0;

  if (result) {
    const previousScore = previous?.raw_score;
    const current = result.response.raw_score;
    const delta = previousScore != null ? Number((current - previousScore).toFixed(1)) : null;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(buildTenantPath(slug, "/escalas"))}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar às escalas
          </Button>
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <CardTitle>Resposta registrada</CardTitle>
              </div>
              <CardDescription>{scale.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-muted/40 rounded-xl p-4 max-w-xs">
                <div className="text-xs text-muted-foreground">Pontuação</div>
                <div className="text-2xl font-semibold mt-1">{result.response.raw_score}</div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">Resultado:</span>
                {(() => {
                  const band = severityBand(scale.code, result.response.severity);
                  return (
                    <Badge
                      variant="outline"
                      style={{ borderColor: ISEU_BAND_COLOR[band], color: ISEU_BAND_COLOR[band] }}
                    >
                      {result.response.severity}
                    </Badge>
                  );
                })()}
                {SCALE_EXPLAINERS[scale.code] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => setExplainerOpen(true)}
                  >
                    <Info className="h-3.5 w-3.5 mr-1" />
                    Entenda este resultado
                  </Button>
                )}
              </div>

              {scale.code === "MHCSF" && MHCSF_INTERPRETATION[result.response.severity] && (
                <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4">
                  <div className="font-medium mb-1">
                    {MHCSF_INTERPRETATION[result.response.severity].title}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {MHCSF_INTERPRETATION[result.response.severity].text}
                  </p>
                </div>
              )}

              {result.response.subscale_scores && (
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground mb-3">Subescalas</div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={Object.values(result.response.subscale_scores).map((s) => ({
                          name: s.label,
                          score: s.normalized,
                        }))}
                        margin={{ left: 16, right: 24, top: 4, bottom: 4 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Bar dataKey="score" radius={[6, 6, 6, 6]}>
                          {Object.values(result.response.subscale_scores).map((s, i) => {
                            const color =
                              s.normalized >= 75
                                ? ISEU_BAND_COLOR.verde
                                : s.normalized >= 55
                                ? ISEU_BAND_COLOR.amarelo
                                : s.normalized >= 35
                                ? ISEU_BAND_COLOR.laranja
                                : ISEU_BAND_COLOR.vermelho;
                            return <Cell key={i} fill={color} />;
                          })}
                          <LabelList
                            dataKey="score"
                            position="right"
                            formatter={(v: number) => `${Math.round(v)}`}
                            style={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {delta != null && (
                <div className="text-sm bg-muted/30 rounded-xl p-3">
                  Comparado à última aplicação ({new Date(previous!.taken_at).toLocaleDateString("pt-BR")}):{" "}
                  <span className={delta >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                    {delta >= 0 ? "+" : ""}{delta} pts
                  </span>
                </div>
              )}

              {result.iseu ? (
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">ISEU-RBE atualizado</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-2xl font-semibold">{result.iseu.score}</div>
                    <Badge variant="outline" className="capitalize">{result.iseu.band}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Composto a partir de {result.iseu.scales_used} escala(s) do pack essencial.
                  </div>
                </div>
              ) : (result as any).missing_scales && (result as any).missing_scales.length > 0 ? (
                <div className="rounded-xl border border-dashed p-4">
                  <div className="text-xs text-muted-foreground">ISEU-RBE</div>
                  <p className="text-sm mt-1">
                    Faltam {(result as any).missing_scales.length} escala
                    {(result as any).missing_scales.length === 1 ? "" : "s"} para calcular seu ISEU-RBE:{" "}
                    <span className="font-medium">{(result as any).missing_scales.join(", ")}</span>.
                  </p>
                </div>
              ) : null}

              <div className="flex gap-3">
                <Button onClick={() => navigate(buildTenantPath(slug, "/minhas-emocoes"))}>
                  Ver meu histórico
                </Button>
                <Button variant="outline" onClick={() => navigate(buildTenantPath(slug, "/escalas"))}>
                  Voltar às escalas
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
        {SCALE_EXPLAINERS[scale.code] && (
          <ScaleExplainerDialog
            open={explainerOpen}
            onOpenChange={setExplainerOpen}
            title={scale.name}
            imageUrl={SCALE_EXPLAINERS[scale.code]}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(buildTenantPath(slug, "/escalas"))}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar às escalas
        </Button>

        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>{scale.name}</CardTitle>
                <CardDescription className="mt-1.5">{scale.instructions}</CardDescription>
              </div>
              {SCALE_EXPLAINERS[scale.code] && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setExplainerOpen(true)}
                >
                  <Info className="h-4 w-4 mr-1.5" />
                  Como funciona
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{answeredCount} de {items.length} respondidas</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </CardContent>
        </Card>

        <div className="space-y-4 mt-6">
          {items.map((item) => {
            const options = Object.entries(item.option_labels).sort(
              ([a], [b]) => Number(a) - Number(b),
            );
            return (
              <Card key={item.id} className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-medium leading-snug">
                    {item.position}. {item.text}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {options.map(([value, label]) => {
                      const v = Number(value);
                      const selected = answers[item.position] === v;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [item.position]: v }))}
                          className={`text-left rounded-xl border p-3 text-sm transition-colors ${
                            selected
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border hover:border-primary/40 hover:bg-muted/40"
                          }`}
                        >
                          <span className="font-medium mr-2">{value}.</span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-6">
          <Button
            className="w-full h-12 text-base shadow-lg"
            disabled={!allAnswered || submit.isPending}
            onClick={handleSubmit}
          >
            {submit.isPending ? "Enviando..." : allAnswered ? "Enviar respostas" : `Responda todas (${answeredCount}/${items.length})`}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ScaleResponse;
