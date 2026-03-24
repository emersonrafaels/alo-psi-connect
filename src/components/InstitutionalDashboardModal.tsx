import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, Users, AlertTriangle, Heart } from 'lucide-react';

interface InstitutionalDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const metrics = [
  { label: 'Adesão', value: '87%', color: '#5B218E', desc: 'dos estudantes continuam' },
  { label: 'Avaliação', value: '4.8/5', color: '#E281BB', desc: 'satisfação média' },
  { label: 'Acompanhamentos', value: '320', suffix: '/mês', color: '#97D3D9', desc: 'suportes realizados' },
  { label: 'Cursos ativos', value: '12', color: '#5B218E', desc: 'programas vinculados' },
];

const themes = [
  { name: 'Ansiedade', pct: 32 },
  { name: 'Burnout acadêmico', pct: 24 },
  { name: 'Relações interpessoais', pct: 18 },
  { name: 'Autoestima', pct: 14 },
  { name: 'Outros', pct: 12 },
];

const periods = [
  { label: '1º sem', value: 72 },
  { label: '2º sem', value: 81 },
  { label: '3º sem', value: 87 },
  { label: '4º sem', value: 91 },
];

const alerts = [
  { text: 'Aumento de 18% em relatos de burnout no curso de Medicina', severity: 'high' },
  { text: 'Queda de engajamento em trilhas do 3º período de Direito', severity: 'medium' },
  { text: '5 estudantes com padrão de risco identificado esta semana', severity: 'high' },
];

export function InstitutionalDashboardModal({ open, onOpenChange }: InstitutionalDashboardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-foreground">
            Painel Institucional — Exemplo ilustrativo
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Dados simulados para demonstração da inteligência institucional
          </p>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-6">
          {/* Big Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: `${m.color}10` }}
              >
                <p className="text-2xl font-extrabold" style={{ color: m.color }}>
                  {m.value}
                  {m.suffix && <span className="text-base font-bold">{m.suffix}</span>}
                </p>
                <p className="text-xs font-semibold text-foreground mt-1">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Adesão por período */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#5B218E]" />
                <h3 className="text-sm font-bold text-foreground">Adesão por período</h3>
              </div>
              <div className="flex items-end gap-3 h-32">
                {periods.map((p) => (
                  <div key={p.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold" style={{ color: '#5B218E' }}>{p.value}%</span>
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${p.value}%`,
                        background: `linear-gradient(to top, #5B218E, #E281BB)`,
                        opacity: 0.8,
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground font-medium">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Temas recorrentes */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-[#E281BB]" />
                <h3 className="text-sm font-bold text-foreground">Temas recorrentes</h3>
              </div>
              <div className="space-y-3">
                {themes.map((t) => (
                  <div key={t.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{t.name}</span>
                      <span className="text-muted-foreground font-semibold">{t.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.pct}%`,
                          background: 'linear-gradient(to right, #5B218E, #E281BB)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">Alertas ativos</h3>
              <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                {alerts.length} alertas
              </span>
            </div>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                    a.severity === 'high' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                    a.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  {a.text}
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground italic">
            * Todos os dados apresentados são ilustrativos. Dados reais são anonimizados e seguem a LGPD.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
