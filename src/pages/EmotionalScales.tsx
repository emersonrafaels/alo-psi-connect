import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";
import { useEmotionalScales, useLatestResponseByScale } from "@/hooks/useEmotionalScales";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ClipboardList, HeartPulse, ArrowRight, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const EmotionalScales = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const slug = tenant?.slug || "alopsi";

  const { data: scales, isLoading } = useEmotionalScales();
  const { data: latestMap } = useLatestResponseByScale();

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
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scales?.map((scale) => {
              const last = latestMap?.[scale.code];
              const avail = getAvailability(scale.frequency_days, last?.taken_at);
              return (
                <Card key={scale.id} className="rounded-2xl border-border/60 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{scale.name}</CardTitle>
                        <CardDescription className="mt-1">{scale.short_description}</CardDescription>
                      </div>
                      <Badge variant={avail.available ? "default" : "secondary"}>{avail.label}</Badge>
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
                          <Badge variant="outline" className="capitalize">{last.severity}</Badge>
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
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EmotionalScales;
