import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import {
  useEmotionalScales,
  useIseuHistory,
  useUserScaleResponses,
  useMissingIseuScales,
  ISEU_BAND_LABEL,
  ISEU_BAND_COLOR,
} from "@/hooks/useEmotionalScales";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { HeartPulse, ArrowUp, ArrowDown, Minus, ClipboardList, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MyEmotions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const slug = tenant?.slug || "alopsi";

  const { data: scales } = useEmotionalScales();
  const { data: iseu, isLoading: iseuLoading } = useIseuHistory();
  const [filterScale, setFilterScale] = useState<string>("ALL");
  const { data: responses, isLoading: respLoading } = useUserScaleResponses(
    filterScale === "ALL" ? undefined : filterScale,
  );
  const { data: allResponses } = useUserScaleResponses();
  const { data: missingScales } = useMissingIseuScales();

  if (!authLoading && !user) {
    navigate(buildTenantPath(slug, "/auth"));
    return null;
  }

  const latestIseu = iseu && iseu.length ? iseu[iseu.length - 1] : null;

  const iseuChartData = useMemo(
    () =>
      (iseu ?? []).map((p) => ({
        date: new Date(p.computed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        score: Number(p.score),
        band: p.band,
      })),
    [iseu],
  );

  // For variation column: precompute previous raw_score per scale within the filtered list
  const rowsWithDelta = useMemo(() => {
    if (!responses) return [];
    const grouped: Record<string, typeof responses> = {};
    [...responses]
      .sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime())
      .forEach((r) => {
        grouped[r.scale_code] = grouped[r.scale_code] || [];
        grouped[r.scale_code].push(r);
      });
    const prevById: Record<string, number | null> = {};
    Object.values(grouped).forEach((arr) => {
      let prev: number | null = null;
      for (const r of arr) {
        prevById[r.id] = prev;
        prev = Number(r.raw_score);
      }
    });
    return responses.map((r) => ({ ...r, prev: prevById[r.id] }));
  }, [responses]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Minhas Emoções</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Acompanhe a evolução do seu bem-estar a partir das escalas que você respondeu.
            </p>
          </div>
          <Button onClick={() => navigate(buildTenantPath(slug, "/escalas"))}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Responder uma escala
          </Button>
        </div>

        {/* ISEU summary + trend */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>ISEU-RBE atual</CardDescription>
              <CardTitle className="text-4xl">
                {iseuLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : latestIseu ? (
                  latestIseu.score
                ) : (
                  <span className="text-muted-foreground text-2xl">—</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestIseu ? (
                <Badge
                  variant="outline"
                  className="capitalize"
                  style={{ borderColor: ISEU_BAND_COLOR[latestIseu.band], color: ISEU_BAND_COLOR[latestIseu.band] }}
                >
                  {ISEU_BAND_LABEL[latestIseu.band]}
                </Badge>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Responda todas as escalas para calcular seu ISEU-RBE.
                  </p>
                  {missingScales && missingScales.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {missingScales.map((code) => (
                        <Badge key={code} variant="secondary" className="text-[10px]">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Evolução do ISEU-RBE</CardTitle>
              <CardDescription>Histórico de todas as aplicações</CardDescription>
            </CardHeader>
            <CardContent className="h-48">
              {iseuChartData.length === 0 ? (
                <div className="h-full grid place-items-center text-center text-sm text-muted-foreground px-4">
                  {missingScales && missingScales.length > 0
                    ? `Faltam ${missingScales.length} escala${missingScales.length === 1 ? "" : "s"} (${missingScales.join(", ")}) para começar a calcular o ISEU-RBE.`
                    : "Sem dados ainda."}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={iseuChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ReferenceArea y1={75} y2={100} fill={ISEU_BAND_COLOR.verde} fillOpacity={0.06} />
                    <ReferenceArea y1={55} y2={75} fill={ISEU_BAND_COLOR.amarelo} fillOpacity={0.06} />
                    <ReferenceArea y1={35} y2={55} fill={ISEU_BAND_COLOR.laranja} fillOpacity={0.06} />
                    <ReferenceArea y1={0} y2={35} fill={ISEU_BAND_COLOR.vermelho} fillOpacity={0.06} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-scale sparklines */}
        {scales && scales.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {scales.map((s) => {
              const items = (allResponses ?? [])
                .filter((r) => r.scale_code === s.code)
                .slice(0, 6)
                .reverse()
                .map((r) => ({ v: Number(r.raw_score) }));
              const last = items.length ? items[items.length - 1].v : null;
              const prev = items.length > 1 ? items[items.length - 2].v : null;
              const trend = last != null && prev != null ? Number((last - prev).toFixed(1)) : null;
              return (
                <button
                  key={s.code}
                  onClick={() => setFilterScale(s.code)}
                  className="text-left rounded-2xl border border-border/60 p-4 hover:border-primary/40 hover:shadow-sm transition-all bg-card"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{s.code}</div>
                      <div className="text-sm font-medium truncate">{s.short_description}</div>
                    </div>
                    {trend != null && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs ${
                          trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {trend > 0 ? "+" : ""}{trend}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-2xl font-semibold leading-none">
                        {last != null ? Math.round(last) : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Pontuação</div>
                    </div>
                    <div className="h-10 w-24">
                      {items.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={items}>
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                            <YAxis hide domain={["auto", "auto"]} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full grid place-items-center text-[10px] text-muted-foreground">
                          {items.length === 0 ? "Sem dados" : "1 aplicação"}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}



        {/* History table */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Histórico de aplicações</CardTitle>
              <CardDescription>Todas as respostas ficam preservadas para acompanhar sua evolução.</CardDescription>
            </div>
            <Select value={filterScale} onValueChange={setFilterScale}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as escalas</SelectItem>
                {scales?.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {respLoading ? (
              <Skeleton className="h-40" />
            ) : rowsWithDelta.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma resposta registrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-3">Data</th>
                      <th className="py-2 pr-3">Escala</th>
                      <th className="py-2 pr-3">Pontuação</th>
                      <th className="py-2 pr-3">Saúde (0–100)</th>
                      <th className="py-2 pr-3">Severidade</th>
                      <th className="py-2 pr-3">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsWithDelta.map((r) => {
                      const delta =
                        r.prev != null ? Number((Number(r.normalized_score) - r.prev).toFixed(1)) : null;
                      return (
                        <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/40">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {new Date(r.taken_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2 pr-3 font-medium">{r.scale_code}</td>
                          <td className="py-2 pr-3">{r.raw_score}</td>
                          <td className="py-2 pr-3">{r.normalized_score}</td>
                          <td className="py-2 pr-3 capitalize">{r.severity}</td>
                          <td className="py-2 pr-3">
                            {delta == null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : delta > 0 ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <ArrowUp className="h-3 w-3" />+{delta}
                              </span>
                            ) : delta < 0 ? (
                              <span className="inline-flex items-center gap-1 text-destructive">
                                <ArrowDown className="h-3 w-3" />
                                {delta}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Minus className="h-3 w-3" />0
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MyEmotions;
