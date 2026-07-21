import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radar as RadarIcon, Sparkles, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { RadarForm } from '@/components/radar/RadarForm';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

export default function PublicRadar() {
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Radar Institucional — Diagnóstico gratuito | Rede Bem-Estar';
  }, []);

  return (
    <div className="min-h-screen bg-background">


      <Header />

      <main className="container mx-auto py-8 md:py-12 px-4 space-y-8">
        {!started ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 text-primary items-center justify-center">
                <RadarIcon className="h-8 w-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-medium">Radar Institucional</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Um diagnóstico consultivo do bem-estar estudantil da sua instituição — feito para reitores, diretores,
                coordenações e núcleos de apoio ao aluno.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="font-semibold">~10 minutos</div>
                  <p className="text-sm text-muted-foreground">Formulário guiado, com auto-save enquanto você responde.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div className="font-semibold">Leitura estratégica</div>
                  <p className="text-sm text-muted-foreground">Um retrato claro da maturidade da sua IES em bem-estar.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div className="font-semibold">Confidencial (LGPD)</div>
                  <p className="text-sm text-muted-foreground">Seus dados são usados apenas para gerar a devolutiva.</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-xl font-semibold">O que você recebe ao final</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Um panorama consolidado da maturidade em 6 dimensões (escuta, prevenção, cuidado, docentes, dados e cultura).</li>
                  <li>• Insights estratégicos sobre as tensões e oportunidades da sua instituição.</li>
                  <li>• Recomendações práticas para os próximos 30, 90 e 180 dias.</li>
                  <li>• Um link permanente para revisitar e compartilhar internamente.</li>
                </ul>
                <Button size="lg" onClick={() => setStarted(true)} className="mt-2">
                  Iniciar diagnóstico <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <RadarIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-medium">Radar Institucional</h1>
                <p className="text-sm text-muted-foreground">Preencha as etapas — sua análise é gerada ao final.</p>
              </div>
            </div>

            <RadarForm
              mode="public"
              institutionName=""
              onPublicComplete={(token) => navigate(`/radar-institucional/resultado/${token}`)}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
