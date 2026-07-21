import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useInstitutionRadar, useSubmitRadar } from '@/hooks/useInstitutionRadar';
import { RadarResult } from '@/components/radar/RadarResult';
import { RadarForm } from '@/components/radar/RadarForm';
import { useState } from 'react';

export default function RadarInstitutionalDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useInstitutionRadar(id);
  const submit = useSubmitRadar();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!data) return <div className="p-8 text-sm text-muted-foreground">Diagnóstico não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm"><Link to="/admin/radar-institucional"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link></Button>
          <div>
            <div className="text-xs text-muted-foreground">Radar Institucional · v{data.version}</div>
            <h1 className="text-xl font-semibold">{data.educational_institutions?.name ?? data.institution_snapshot?.name ?? '—'}</h1>
          </div>
          <Badge variant={data.status === 'submitted' ? 'default' : 'outline'}>
            {data.status === 'submitted' ? 'Submetido' : data.status === 'draft' ? 'Rascunho' : 'Arquivado'}
          </Badge>
        </div>
        <div className="flex gap-2">
          {data.status === 'draft' && (
            <Button onClick={() => submit.mutate(data.id)} disabled={submit.isPending}>
              <Sparkles className="h-4 w-4 mr-2" /> {submit.isPending ? 'Analisando…' : 'Gerar análise'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditing(e => !e)}>{editing ? 'Fechar edição' : 'Editar respostas'}</Button>
        </div>
      </div>

      {editing ? (
        <RadarForm
          institutionId={data.institution_id}
          institutionName={data.educational_institutions?.name ?? data.institution_snapshot?.name ?? ''}
          initial={{
            id: data.id,
            answers: {
              institution: data.institution_snapshot ?? {},
              respondent: {
                name: data.respondent_name ?? '',
                role: data.respondent_role ?? '',
                area: data.respondent_area ?? '',
                email: data.respondent_email ?? '',
                phone: data.respondent_phone ?? '',
              },
              structures: data.structures ?? {},
              pains: data.pains ?? [],
              adaptive: data.adaptive_answers ?? {},
              maturity: data.maturity ?? {},
              priorities: data.priorities ?? {},
              consent: data.consent_given ?? false,
            },
          }}
          onSubmitted={() => { setEditing(false); refetch(); }}
        />
      ) : data.status === 'submitted' ? (
        <RadarResult diagnostic={data} />
      ) : (
        <Card>
          <CardHeader><CardTitle>Rascunho</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Este diagnóstico ainda não foi analisado. Clique em "Gerar análise" para produzir a leitura estratégica ou "Editar respostas" para continuar o preenchimento.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
