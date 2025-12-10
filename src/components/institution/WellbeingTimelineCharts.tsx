import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Heart, Brain, Moon, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

const formatDate = (dateStr: string) => {
  // Validar formato de data
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return '';
  }
  try {
    const date = new Date(dateStr + 'T12:00:00');
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
};

const formatFullDate = (dateStr: string) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 'Data indisponível';
  }
  try {
    const date = new Date(dateStr + 'T12:00:00');
    if (isNaN(date.getTime())) return 'Data indisponível';
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long' 
    });
  } catch {
    return 'Data indisponível';
  }
};

const getTrendIcon = (current: number | null, avg: number | null) => {
  if (current === null || avg === null) return null;
  const diff = current - avg;
  if (diff > 0.3) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (diff < -0.3) return <TrendingDown className="h-3 w-3 text-rose-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const getMoodColor = (value: number | null) => {
  if (value === null) return 'text-muted-foreground';
  if (value >= 4) return 'text-emerald-500';
  if (value >= 3) return 'text-yellow-500';
  return 'text-rose-500';
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  avgValue?: number | null;
  metricName?: string;
}

const CustomTooltip = ({ active, payload, label, avgValue, metricName }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const entryData = payload[0]?.payload;
    // Usar a data original do entry, não o label formatado
    const originalDate = entryData?.date || '';
    
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-48">
        <p className="font-medium text-sm mb-2 capitalize">
          {formatFullDate(originalDate)}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold text-sm ${getMoodColor(entry.value)}`}>
                  {entry.value?.toFixed(1) || 'N/A'}
                </span>
                {avgValue && getTrendIcon(entry.value, avgValue)}
              </div>
            </div>
          ))}
        </div>
        {entryData?.entries_count > 0 && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
            {entryData.entries_count} registro{entryData.entries_count > 1 ? 's' : ''} neste dia
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const WellbeingTimelineCharts = ({ 
  dailyEntries, 
  periodDays, 
  onPeriodChange,
  avgMood,
  avgAnxiety,
}: WellbeingTimelineChartsProps) => {
  // Filtrar entries com datas válidas
  const validEntries = dailyEntries.filter(entry => {
    if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return false;
    const testDate = new Date(entry.date + 'T12:00:00');
    return !isNaN(testDate.getTime());
  });

  // Preparar dados para os gráficos
  const chartData = validEntries.map(entry => ({
    ...entry,
    displayDate: formatDate(entry.date),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-muted-foreground">
            Nenhum dado disponível para o período selecionado.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Os gráficos aparecerão quando os alunos registrarem seu bem-estar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Período */}
      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <Button
            key={option.value}
            variant={periodDays === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange(option.value)}
            className="transition-all"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Gráficos em Grid Responsivo */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Evolução do Humor */}
        <Card className="col-span-full md:col-span-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              Evolução do Humor
              {avgMood && (
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  Média: {avgMood.toFixed(1)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  {/* Zona saudável (4-5) */}
                  <ReferenceArea y1={4} y2={5} fill="hsl(142 76% 36% / 0.1)" />
                  {/* Zona de atenção (1-2.5) */}
                  <ReferenceArea y1={1} y2={2.5} fill="hsl(0 84% 60% / 0.1)" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip avgValue={avgMood} />} />
                  {avgMood && (
                    <ReferenceLine 
                      y={avgMood} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="avg_mood"
                    name="Humor"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#moodGradient)"
                    dot={{ r: 3, fill: 'hsl(var(--chart-1))' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Ansiedade */}
        <Card className="col-span-full md:col-span-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Brain className="h-4 w-4 text-purple-500" />
              </div>
              Nível de Ansiedade
              {avgAnxiety && (
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  Média: {avgAnxiety.toFixed(1)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anxietyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  {/* Zona de alerta (4-5 para ansiedade é ruim) */}
                  <ReferenceArea y1={4} y2={5} fill="hsl(0 84% 60% / 0.1)" />
                  {/* Zona saudável (1-2 para ansiedade é bom) */}
                  <ReferenceArea y1={1} y2={2} fill="hsl(142 76% 36% / 0.1)" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip avgValue={avgAnxiety} />} />
                  {avgAnxiety && (
                    <ReferenceLine 
                      y={avgAnxiety} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="avg_anxiety"
                    name="Ansiedade"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#anxietyGradient)"
                    dot={{ r: 3, fill: 'hsl(var(--chart-2))' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Sono x Energia */}
        <Card className="col-span-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex gap-1">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Moon className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              Sono e Energia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_sleep"
                    name="Qualidade do Sono"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--chart-4))' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_energy"
                    name="Nível de Energia"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--chart-5))' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
