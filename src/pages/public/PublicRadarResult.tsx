import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radar as RadarIcon, Loader2, ArrowLeft } from 'lucide-react';
import { usePublicRadarByToken } from '@/hooks/usePublicRadar';
import { RadarResult } from '@/components/radar/RadarResult';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

export default function PublicRadarResult() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicRadarByToken(token);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Resultado do Radar Institucional | Rede Bem-Estar</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="container mx-auto py-8 md:py-12 px-4 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <RadarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-medium">Radar Institucional — Resultado</h1>
              <p className="text-sm text-muted-foreground">
                {data?.submitted_institution_name ?? 'Diagnóstico consultivo'}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/radar-institucional"><ArrowLeft className="h-4 w-4 mr-2" /> Novo diagnóstico</Link>
          </Button>
        </div>

        {isLoading && (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Carregando…
          </CardContent></Card>
        )}

        {!isLoading && !data && (
          <Card><CardContent className="py-16 text-center space-y-2">
            <p className="font-semibold">Diagnóstico não encontrado</p>
            <p className="text-sm text-muted-foreground">Verifique o link recebido ou inicie um novo diagnóstico.</p>
          </CardContent></Card>
        )}

        {error && (
          <Card><CardContent className="py-16 text-center text-destructive">
            Erro ao carregar o diagnóstico.
          </CardContent></Card>
        )}

        {data && data.status !== 'submitted' && (
          <Card><CardContent className="py-12 text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="font-semibold">Gerando sua análise consultiva…</p>
            <p className="text-sm text-muted-foreground">Isso leva alguns segundos. A página atualiza sozinha.</p>
          </CardContent></Card>
        )}

        {data && data.status === 'submitted' && (
          <RadarResult diagnostic={data} />
        )}
      </main>

      <Footer />
    </div>
  );
}
