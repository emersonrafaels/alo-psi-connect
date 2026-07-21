import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Radar as RadarIcon, PlusCircle, History, Sparkles } from 'lucide-react';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useInstitutionRadarList } from '@/hooks/useInstitutionRadar';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { RadarForm } from '@/components/radar/RadarForm';
import { RadarResult } from '@/components/radar/RadarResult';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InstitutionRadar() {
  const { userInstitutions, isLoading } = useInstitutionAccess();
  const { tenant } = useTenant();
  const institution = userInstitutions[0]?.educational_institutions;
  const institutionId = userInstitutions[0]?.institution_id;
  const { data: list = [], isLoading: loadingList } = useInstitutionRadarList(institutionId);

  const [mode, setMode] = useState<'view' | 'form'>('view');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const latest = list[0];
  const selected = useMemo(() => list.find(d => d.id === selectedId) ?? latest, [list, selectedId, latest]);

  if (isLoading || loadingList) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-6 md:py-8 px-4 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to={buildTenantPath(tenant?.slug, '/portal-institucional')}>Portal Institucional</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Radar Institucional</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <RadarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-medium">Radar Institucional</h1>
              <p className="text-muted-foreground">Um diagnóstico consultivo do bem-estar da sua instituição.</p>
            </div>
          </div>
          {mode === 'view' && (
            <Button onClick={() => { setMode('form'); }} size="lg">
              <PlusCircle className="h-4 w-4 mr-2" /> {latest ? 'Atualizar diagnóstico' : 'Iniciar diagnóstico'}
            </Button>
          )}
          {mode === 'form' && (
            <Button variant="outline" onClick={() => setMode('view')}>Voltar</Button>
          )}
        </div>

        {mode === 'form' && institutionId && (
          <RadarForm
            institutionId={institutionId}
            institutionName={institution?.name ?? ''}
            onSubmitted={() => setMode('view')}
          />
        )}

        {mode === 'view' && !latest && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Ainda não há um radar preenchido</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Em cerca de 10 minutos, geramos um retrato completo da maturidade da sua instituição em bem-estar estudantil, com recomendações práticas.
              </p>
              <Button onClick={() => setMode('form')} size="lg" className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" /> Iniciar diagnóstico
              </Button>
            </CardContent>
          </Card>
        )}

        {mode === 'view' && selected && (
          <>
            {list.length > 1 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" /> Histórico de diagnósticos
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {list.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                        (selectedId ?? latest?.id) === d.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="font-medium">v{d.version} · {d.status === 'submitted' ? 'Submetido' : 'Rascunho'}</div>
                      <div className="text-muted-foreground">{format(new Date(d.created_at), "dd 'de' MMM yyyy", { locale: ptBR })}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {selected.status === 'submitted' ? (
              <RadarResult diagnostic={selected} />
            ) : (
              <Card>
                <CardContent className="py-10 text-center space-y-3">
                  <Badge variant="outline">Rascunho</Badge>
                  <p className="text-muted-foreground">Este diagnóstico ainda não foi submetido. Continue de onde parou para gerar a análise.</p>
                  <Button onClick={() => setMode('form')}>Continuar preenchimento</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
