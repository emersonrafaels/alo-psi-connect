import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import {
  useEmotionalScales,
  useIseuHistory,
  useUserScaleResponses,
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
} from "recharts";
import { HeartPulse, ArrowUp, ArrowDown, Minus, ClipboardList } from "lucide-react";
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

  // For variation column: precompute previous score per scale within the filtered list
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
        prev = Number(r.normalized_score);
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
                {iseuLoading ? <Skeleton className="h-10 w-24" /> : latestIseu?.score ?? "—"}
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
                <p className="text-sm text-muted-foreground">
                  Responda pelo menos uma escala para calcular seu índice.
                </p>
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
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  Sem dados ainda.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={iseuChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
