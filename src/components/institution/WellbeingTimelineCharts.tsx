import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { Heart, Brain, Moon, Zap, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DailyEntry {
  date: string;
  avg_mood: number | null;
  avg_anxiety: number | null;
  avg_sleep: number | null;
  avg_energy: number | null;
  entries_count: number;
}

interface WellbeingTimelineChartsProps {
  dailyEntries: DailyEntry[];
  periodDays: number;
  onPeriodChange: (days: number) => void;
  avgMood?: number | null;
  avgAnxiety?: number | null;
}

const periodOptions = [
  { label: '7 dias', value: 7 },
  { label: '14 dias', value: 14 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

const metricColors = {
  mood: { primary: '#F43F5E', icon: Heart, bgClass: 'bg-rose-500/10', textClass: 'text-rose-500' },
  anxiety: { primary: '#A855F7', icon: Brain, bgClass: 'bg-purple-500/10', textClass: 'text-purple-500' },
  sleep: { primary: '#6366F1', icon: Moon, bgClass: 'bg-indigo-500/10', textClass: 'text-indigo-500' },
  energy: { primary: '#F59E0B', icon: Zap, bgClass: 'bg-amber-500/10', textClass: 'text-amber-500' }
};

const formatDate = (dateStr: string) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  try {
    const date = new Date(dateStr + 'T12:00:00');
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
};

// Emojis granulares para escala 1-5
const getValueEmoji = (value: number | null, isAnxiety = false): { emoji: string; color: string; label: string } => {
  if (value === null) return { emoji: '', color: 'text-muted-foreground', label: '' };
  
  if (isAnxiety) {
    // Para ansiedade: menor é melhor (invertido)
    if (value <= 1) return { emoji: '😌', color: 'text-emerald-600', label: 'Tranquilo' };
    if (value <= 2) return { emoji: '🙂', color: 'text-emerald-500', label: 'Calmo' };
    if (value <= 3) return { emoji: '😐', color: 'text-amber-500', label: 'Moderado' };
    if (value <= 4) return { emoji: '😟', color: 'text-orange-500', label: 'Elevado' };
    return { emoji: '😰', color: 'text-rose-500', label: 'Alto' };
  }
  
  // Para métricas normais: maior é melhor
  if (value >= 5) return { emoji: '🤩', color: 'text-emerald-600', label: 'Excelente' };
  if (value >= 4) return { emoji: '😊', color: 'text-emerald-500', label: 'Bom' };
  if (value >= 3) return { emoji: '😐', color: 'text-amber-500', label: 'Neutro' };
  if (value >= 2) return { emoji: '😔', color: 'text-orange-500', label: 'Baixo' };
  return { emoji: '😢', color: 'text-rose-500', label: 'Crítico' };
};

// Cor da barra de progresso
const getProgressBarColor = (value: number, isAnxiety = false): string => {
  if (isAnxiety) {
    if (value <= 1) return '#10B981'; // emerald
    if (value <= 2) return '#22C55E'; // green
    if (value <= 3) return '#F59E0B'; // amber
    if (value <= 4) return '#F97316'; // orange
    return '#EF4444'; // red
  }
  if (value >= 5) return '#10B981';
  if (value >= 4) return '#22C55E';
  if (value >= 3) return '#F59E0B';
  if (value >= 2) return '#F97316';
  return '#EF4444';
};

const CustomDot = ({ cx, cy, payload, dataKey, metricType }: any) => {
  if (!cx || !cy || !payload || payload[dataKey] == null) return null;
  const metric = metricColors[metricType as keyof typeof metricColors];
  const IconComponent = metric.icon;
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={metric.primary} fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={8} fill="hsl(var(--card))" stroke={metric.primary} strokeWidth={2} />
      <foreignObject x={cx - 5} y={cy - 5} width={10} height={10}>
        <IconComponent style={{ width: 10, height: 10, color: metric.primary }} />
      </foreignObject>
    </g>
  );
};

const CustomActiveDot = ({ cx, cy, payload, dataKey, metricType }: any) => {
  if (!cx || !cy || !payload || payload[dataKey] == null) return null;
  const metric = metricColors[metricType as keyof typeof metricColors];
  const IconComponent = metric.icon;
  return (
    <g>
      <circle cx={cx} cy={cy} r={18} fill={metric.primary} fillOpacity={0.2}>
        <animate attributeName="r" values="16;20;16" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={12} fill="hsl(var(--card))" stroke={metric.primary} strokeWidth={3} />
      <foreignObject x={cx - 7} y={cy - 7} width={14} height={14}>
        <IconComponent style={{ width: 14, height: 14, color: metric.primary }} />
      </foreignObject>
    </g>
  );
};

// Componente de tendência ↑↓
const TrendIndicator = ({ current, previous, isAnxiety = false }: { current: number | null; previous: number | null; isAnxiety?: boolean }) => {
  if (current === null || previous === null) return null;
  
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return <Minus className="h-3 w-3 text-muted-foreground" />;
  
  // Para ansiedade: diminuir é bom (verde), aumentar é ruim (vermelho)
  // Para outras métricas: aumentar é bom (verde), diminuir é ruim (vermelho)
  const isPositive = isAnxiety ? diff < 0 : diff > 0;
  const color = isPositive ? 'text-emerald-500' : 'text-rose-500';
  const bgColor = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  
  return (
    <div className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${bgColor} ${color}`}>
      {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span className="font-medium">{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, metrics, chartData }: any) => {
  if (!active || !payload?.length) return null;
  
  // Encontrar dados do dia anterior para comparação
  const currentDate = payload[0]?.payload?.date;
  const currentIndex = chartData?.findIndex((d: DailyEntry) => d.date === currentDate);
  const previousEntry = currentIndex > 0 ? chartData[currentIndex - 1] : null;
  
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[220px]">
      <p className="text-sm font-medium mb-2 pb-2 border-b border-border">{label}</p>
      <div className="space-y-2.5">
        {metrics?.map((m: any) => {
          const dp = payload.find((p: any) => p.dataKey === m.key);
          const val = dp?.value;
          const cfg = metricColors[m.type as keyof typeof metricColors];
          const IconComponent = cfg.icon;
          const st = getValueEmoji(val, m.isAnxiety);
          const prevVal = previousEntry ? previousEntry[m.key as keyof DailyEntry] : null;
          const barColor = val != null ? getProgressBarColor(val, m.isAnxiety) : '#888';
          
          return (
            <div key={m.key} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${cfg.bgClass}`}>
                    <IconComponent className={`h-3 w-3 ${cfg.textClass}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {val != null ? (
                    <>
                      <span className="text-lg">{st.emoji}</span>
                      <span className={`text-sm font-bold ${st.color}`}>{val.toFixed(1)}</span>
                      <TrendIndicator 
                        current={val} 
                        previous={typeof prevVal === 'number' ? prevVal : null} 
                        isAnxiety={m.isAnxiety} 
                      />
                    </>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </div>
              </div>
              {val != null && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, (val / 5) * 100)}%`, 
                        backgroundColor: barColor 
                      }} 
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{st.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {payload[0]?.payload?.entries_count != null && (
        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border flex items-center gap-1">
          <Activity className="h-3 w-3" />{payload[0].payload.entries_count} registro{payload[0].payload.entries_count !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export const WellbeingTimelineCharts: React.FC<WellbeingTimelineChartsProps> = ({ dailyEntries, periodDays, onPeriodChange }) => {
  const validEntries = dailyEntries.filter(e => e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date));
  const chartData = validEntries.map(e => ({ ...e, formattedDate: formatDate(e.date) }));

  if (!validEntries.length) {
    return (<Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><Activity className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-muted-foreground text-center">Nenhum dado disponível.</p></CardContent></Card>);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {periodOptions.map(o => (<Button key={o.value} variant={periodDays === o.value ? 'default' : 'outline'} size="sm" onClick={() => onPeriodChange(o.value)} className="text-xs">{o.label}</Button>))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><div className={`p-2 rounded-lg ${metricColors.mood.bgClass}`}><Heart className={`h-4 w-4 ${metricColors.mood.textClass}`} /></div>Evolução do Humor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs><linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={metricColors.mood.primary} stopOpacity={0.4} /><stop offset="95%" stopColor={metricColors.mood.primary} stopOpacity={0.05} /></linearGradient></defs>
                <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} ticks={[1,2,3,4,5]} />
                <Tooltip content={<CustomTooltip metrics={[{ key: 'avg_mood', name: 'Humor', type: 'mood' }]} chartData={chartData} />} />
                <ReferenceLine y={3.5} stroke={metricColors.mood.primary} strokeDasharray="3 3" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="avg_mood" stroke={metricColors.mood.primary} strokeWidth={3} fill="url(#moodGradient)" dot={(p) => <CustomDot {...p} metricType="mood" />} activeDot={(p) => <CustomActiveDot {...p} metricType="mood" />} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><div className={`p-2 rounded-lg ${metricColors.anxiety.bgClass}`}><Brain className={`h-4 w-4 ${metricColors.anxiety.textClass}`} /></div>Nível de Ansiedade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs><linearGradient id="anxietyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={metricColors.anxiety.primary} stopOpacity={0.4} /><stop offset="95%" stopColor={metricColors.anxiety.primary} stopOpacity={0.05} /></linearGradient></defs>
                <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} ticks={[1,2,3,4,5]} />
                <Tooltip content={<CustomTooltip metrics={[{ key: 'avg_anxiety', name: 'Ansiedade', type: 'anxiety', isAnxiety: true }]} chartData={chartData} />} />
                <ReferenceLine y={3.5} stroke={metricColors.anxiety.primary} strokeDasharray="3 3" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="avg_anxiety" stroke={metricColors.anxiety.primary} strokeWidth={3} fill="url(#anxietyGradient)" dot={(p) => <CustomDot {...p} metricType="anxiety" />} activeDot={(p) => <CustomActiveDot {...p} metricType="anxiety" />} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-4 text-base"><div className="flex items-center gap-2"><div className={`p-2 rounded-lg ${metricColors.sleep.bgClass}`}><Moon className={`h-4 w-4 ${metricColors.sleep.textClass}`} /></div><span>Sono</span></div><span className="text-muted-foreground">vs</span><div className="flex items-center gap-2"><div className={`p-2 rounded-lg ${metricColors.energy.bgClass}`}><Zap className={`h-4 w-4 ${metricColors.energy.textClass}`} /></div><span>Energia</span></div></CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} ticks={[1,2,3,4,5]} />
                <Tooltip content={<CustomTooltip metrics={[{ key: 'avg_sleep', name: 'Sono', type: 'sleep' }, { key: 'avg_energy', name: 'Energia', type: 'energy' }]} chartData={chartData} />} />
                <ReferenceLine y={3} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.3} />
                <Line type="monotone" dataKey="avg_sleep" stroke={metricColors.sleep.primary} strokeWidth={3} dot={(p) => <CustomDot {...p} metricType="sleep" />} activeDot={(p) => <CustomActiveDot {...p} metricType="sleep" />} connectNulls />
                <Line type="monotone" dataKey="avg_energy" stroke={metricColors.energy.primary} strokeWidth={3} dot={(p) => <CustomDot {...p} metricType="energy" />} activeDot={(p) => <CustomActiveDot {...p} metricType="energy" />} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
