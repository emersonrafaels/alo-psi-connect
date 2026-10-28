import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SIGNAL_LABELS, SIGNAL_RULE_TEXT, type SignalLevel } from './signalRules';

const LEVELS: { key: SignalLevel; dot: string }[] = [
  { key: 'critical', dot: 'bg-red-500' },
  { key: 'alert', dot: 'bg-orange-500' },
  { key: 'attention', dot: 'bg-yellow-500' },
  { key: 'healthy', dot: 'bg-green-500' },
  { key: 'no_data', dot: 'bg-muted-foreground/50' },
];

const FACTORS = [
  { title: 'Mudanças de humor', text: 'Variações relevantes podem ser destacadas quando houver registros comparáveis. Uma queda percentual, sozinha, não determina o nível mais elevado.' },
  { title: 'Registros escritos', text: 'Possíveis sinais sensíveis no Diário Emocional são tratados separadamente das notas e dependem de regras de privacidade e revisão específicas.' },
  { title: 'Acompanhamento', text: 'Triagens pendentes e retornos vencidos ajudam a organizar o trabalho da equipe, sem alterar a classificação emocional por si só.' },
  { title: 'Dados e período', text: 'As leituras dependem da quantidade, da atualidade e da qualidade dos registros disponíveis.' },
];

export function SignalsExplainerDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground">
          <Info className="h-4 w-4" />Como os sinais são identificados e priorizados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Como os sinais são identificados e priorizados</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            A Rede Bem-Estar analisa os registros disponíveis do Diário Emocional para identificar indicadores que merecem atenção.
            Essa classificação ajuda a organizar a triagem, mas não representa diagnóstico ou avaliação clínica automática.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Níveis</h3>
          <ul className="space-y-2">
            {LEVELS.map(({ key, dot }) => (
              <li key={key} className="flex gap-3 rounded-md border p-3 text-sm">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                <p><strong>{SIGNAL_LABELS[key]}:</strong> {SIGNAL_RULE_TEXT[key]}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Fatores complementares</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {FACTORS.map((f) => (
              <div key={f.title} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{f.title}</p>
                <p className="mt-1 text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          <p className="font-semibold">Importante</p>
          <p className="mt-1">
            Os indicadores são apoios à priorização e não representam diagnóstico, previsão de crise ou avaliação de risco clínico individual.
            A definição da conduta cabe aos profissionais autorizados, conforme os protocolos da instituição.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
