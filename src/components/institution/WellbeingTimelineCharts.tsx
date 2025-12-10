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
} from 'recharts';
import { Heart, Brain, Moon, Zap } from 'lucide-react';

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
}

const periodOptions = [
  { label: '7 dias', value: 7 },
  { label: '14 dias', value: 14 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">
          {new Date(label + 'T00:00:00').toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long' 
          })}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value?.toFixed(1) || 'N/A'}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const WellbeingTimelineCharts = ({ 
  dailyEntries, 
  periodDays, 
  onPeriodChange 
}: WellbeingTimelineChartsProps) => {
  // Preparar dados para os gráficos
  const chartData = dailyEntries.map(entry => ({
    ...entry,
    date: entry.date,
    displayDate: formatDate(entry.date),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum dado disponível para o período selecionado.
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
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Gráficos em Grid Responsivo */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Evolução do Humor */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Evolução do Humor
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
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="avg_mood"
                    name="Humor"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#moodGradient)"
                    dot={{ r: 3, fill: 'hsl(var(--chart-1))' }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Ansiedade */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Nível de Ansiedade
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
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="avg_anxiety"
                    name="Ansiedade"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#anxietyGradient)"
                    dot={{ r: 3, fill: 'hsl(var(--chart-2))' }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Sono x Energia (Área Empilhada) */}
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              <Zap className="h-5 w-5 text-yellow-500" />
              Sono e Energia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_sleep"
                    name="Qualidade do Sono"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--chart-4))' }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_energy"
                    name="Nível de Energia"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--chart-5))' }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
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
