import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Heart, Brain, Moon, Zap, TrendingUp, TrendingDown, Layers, Minus, CalendarDays, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface DailyEntry {
  date: string;
  avg_mood: number | null;
  avg_anxiety: number | null;
  avg_sleep: number | null;
  avg_energy: number | null;
  entries_count: number;
}

interface PredictionPoint {
  date: string;
  predicted_mood?: number;
  predicted_anxiety?: number;
  predicted_sleep?: number;
  predicted_energy?: number;
  confidence_low?: number;
  confidence_high?: number;
}

interface WellbeingLayeredChartProps {
  dailyEntries: DailyEntry[];
  predictions?: PredictionPoint[];
  avgMood?: number | null;
  avgAnxiety?: number | null;
}

// Cores específicas vibrantes para cada métrica
const metricColors = {
  mood: { color: '#F43F5E', icon: Heart, bgClass: 'bg-rose-500/10', textClass: 'text-rose-500', name: 'Humor' },
  anxiety: { color: '#A855F7', icon: Brain, bgClass: 'bg-purple-500/10', textClass: 'text-purple-500', name: 'Ansiedade' },
  sleep: { color: '#6366F1', icon: Moon, bgClass: 'bg-indigo-500/10', textClass: 'text-indigo-500', name: 'Sono' },
  energy: { color: '#F59E0B', icon: Zap, bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', name: 'Energia' },
};

// Emojis granulares para escala 1-5
const getValueEmoji = (value: number | null, isAnxiety = false): { emoji: string; color: string; label: string } => {
  if (value === null) return { emoji: '', color: 'text-muted-foreground', label: '' };
  
  if (isAnxiety) {
    if (value <= 1) return { emoji: '😌', color: 'text-emerald-600', label: 'Tranquilo' };
    if (value <= 2) return { emoji: '🙂', color: 'text-emerald-500', label: 'Calmo' };
    if (value <= 3) return { emoji: '😐', color: 'text-amber-500', label: 'Moderado' };
    if (value <= 4) return { emoji: '😟', color: 'text-orange-500', label: 'Elevado' };
    return { emoji: '😰', color: 'text-rose-500', label: 'Alto' };
  }
  
  if (value >= 5) return { emoji: '🤩', color: 'text-emerald-600', label: 'Excelente' };
  if (value >= 4) return { emoji: '😊', color: 'text-emerald-500', label: 'Bom' };
  if (value >= 3) return { emoji: '😐', color: 'text-amber-500', label: 'Neutro' };
  if (value >= 2) return { emoji: '😔', color: 'text-orange-500', label: 'Baixo' };
  return { emoji: '😢', color: 'text-rose-500', label: 'Crítico' };
};

const getProgressBarColor = (value: number, isAnxiety = false): string => {
  if (isAnxiety) {
    if (value <= 1) return '#10B981';
    if (value <= 2) return '#22C55E';
    if (value <= 3) return '#F59E0B';
    if (value <= 4) return '#F97316';
    return '#EF4444';
  }
  if (value >= 5) return '#10B981';
  if (value >= 4) return '#22C55E';
  if (value >= 3) return '#F59E0B';
  if (value >= 2) return '#F97316';
  return '#EF4444';
};

interface LayerConfig {
  id: string;
  name: string;
  dataKey: string;
  color: string;
  icon: React.ReactNode;
  enabled: boolean;
  isAnxiety?: boolean;
}

export const WellbeingLayeredChart = ({
  dailyEntries,
  predictions = [],
  avgMood,
  avgAnxiety,
}: WellbeingLayeredChartProps) => {
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'mood', name: 'Humor', dataKey: 'avg_mood', color: metricColors.mood.color, icon: <Heart className="h-3 w-3" />, enabled: true },
    { id: 'anxiety', name: 'Ansiedade', dataKey: 'avg_anxiety', color: metricColors.anxiety.color, icon: <Brain className="h-3 w-3" />, enabled: true, isAnxiety: true },
    { id: 'sleep', name: 'Sono', dataKey: 'avg_sleep', color: metricColors.sleep.color, icon: <Moon className="h-3 w-3" />, enabled: false },
    { id: 'energy', name: 'Energia', dataKey: 'avg_energy', color: metricColors.energy.color, icon: <Zap className="h-3 w-3" />, enabled: false },
  ]);

  const [showTrendLine, setShowTrendLine] = useState(true);
  const [showReferenceZones, setShowReferenceZones] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);

  const toggleLayer = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  };

  const toggleAll = (enabled: boolean) => {
    setLayers(prev => prev.map(layer => ({ ...layer, enabled })));
  };

  const enabledCount = layers.filter(l => l.enabled).length;

  const chartData = useMemo(() => {
    const data = dailyEntries.map(entry => {
      const dateObj = parseISO(entry.date);
      return {
        ...entry,
        displayDate: format(dateObj, 'dd/MM', { locale: ptBR }),
        fullDate: format(dateObj, "dd 'de' MMMM", { locale: ptBR }),
      };
    });

    if (predictions.length > 0 && showPredictions) {
      predictions.forEach(pred => {
        const dateObj = parseISO(pred.date);
        data.push({
          date: pred.date,
          displayDate: format(dateObj, 'dd/MM', { locale: ptBR }),
          fullDate: format(dateObj, "dd 'de' MMMM", { locale: ptBR }) + ' (Previsão)',
          avg_mood: null,
          avg_anxiety: null,
          avg_sleep: null,
          avg_energy: null,
          entries_count: 0,
          predicted_mood: pred.predicted_mood,
          predicted_anxiety: pred.predicted_anxiety,
          confidence_low: pred.confidence_low,
          confidence_high: pred.confidence_high,
          isPrediction: true,
        } as any);
      });
    }

    return data;
  }, [dailyEntries, predictions, showPredictions]);

  const trendData = useMemo(() => {
    if (!showTrendLine || dailyEntries.length < 3) return null;
    
    const windowSize = Math.min(7, Math.floor(dailyEntries.length / 2));
    return dailyEntries.map((_, index) => {
      const start = Math.max(0, index - windowSize + 1);
      const window = dailyEntries.slice(start, index + 1);
      const moodValues = window.map(e => e.avg_mood).filter((v): v is number => v !== null);
      const avgTrend = moodValues.length > 0 
        ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length 
        : null;
      return avgTrend;
    });
  }, [dailyEntries, showTrendLine]);

  const enrichedChartData = useMemo(() => {
    return chartData.map((entry, index) => ({
      ...entry,
      trend: trendData?.[index] ?? null,
    }));
  }, [chartData, trendData]);

  // Componente de tendência ↑↓
  const TrendIndicator = ({ current, previous, isAnxiety = false }: { current: number | null; previous: number | null; isAnxiety?: boolean }) => {
    if (current === null || previous === null) return null;
    
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return <Minus className="h-3 w-3 text-muted-foreground" />;
    
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const entryData = payload[0]?.payload;
    const isPrediction = entryData?.isPrediction;
    
    // Encontrar dados do dia anterior
    const currentIndex = enrichedChartData.findIndex(d => d.date === entryData?.date);
    const previousEntry = currentIndex > 0 ? enrichedChartData[currentIndex - 1] : null;

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[240px]">
        <p className="font-medium text-sm mb-2 pb-2 border-b border-border flex items-center gap-2">
          {entryData?.fullDate || label}
          {isPrediction && (
            <Badge variant="secondary" className="text-xs">
              🔮 Previsão
            </Badge>
          )}
        </p>
        <div className="space-y-2.5">
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            const layer = layers.find(l => l.dataKey === entry.dataKey || entry.dataKey.includes(l.id));
            if (!layer) return null;
            
            const metricConfig = metricColors[layer.id as keyof typeof metricColors];
            const IconComponent = metricConfig?.icon || Heart;
            const st = getValueEmoji(entry.value, layer.isAnxiety);
            const prevVal = previousEntry ? previousEntry[layer.dataKey as keyof typeof previousEntry] : null;
            const barColor = getProgressBarColor(entry.value, layer.isAnxiety);
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${metricConfig?.bgClass}`}>
                      <IconComponent className={`h-3 w-3 ${metricConfig?.textClass}`} />
                    </div>
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{st.emoji}</span>
                    <span className={`text-sm font-bold ${st.color}`}>{Number(entry.value).toFixed(1)}</span>
                    <TrendIndicator 
                      current={entry.value} 
                      previous={typeof prevVal === 'number' ? prevVal : null}
                      isAnxiety={layer.isAnxiety}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, (entry.value / 5) * 100)}%`, 
                        backgroundColor: barColor 
                      }} 
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-14 text-right">{st.label}</span>
                </div>
              </div>
            );
          })}
          {!isPrediction && entryData?.entries_count > 0 && (
            <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
              {entryData.entries_count} registro(s)
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom dot com ícone
  const CustomDot = ({ cx, cy, payload, dataKey }: any) => {
    if (!cx || !cy || payload[dataKey] == null) return null;
    const layerId = dataKey.replace('avg_', '');
    const metricConfig = metricColors[layerId as keyof typeof metricColors];
    if (!metricConfig) return null;
    
    const IconComponent = metricConfig.icon;
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill={metricConfig.color} fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--card))" stroke={metricConfig.color} strokeWidth={2} />
        <foreignObject x={cx - 4} y={cy - 4} width={8} height={8}>
          <IconComponent style={{ width: 8, height: 8, color: metricConfig.color }} />
        </foreignObject>
      </g>
    );
  };

  // Custom active dot com animação
  const CustomActiveDot = ({ cx, cy, payload, dataKey }: any) => {
    if (!cx || !cy || payload[dataKey] == null) return null;
    const layerId = dataKey.replace('avg_', '');
    const metricConfig = metricColors[layerId as keyof typeof metricColors];
    if (!metricConfig) return null;
    
    const IconComponent = metricConfig.icon;
    return (
      <g>
        <circle cx={cx} cy={cy} r={16} fill={metricConfig.color} fillOpacity={0.2}>
          <animate attributeName="r" values="14;18;14" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={10} fill="hsl(var(--card))" stroke={metricConfig.color} strokeWidth={3} />
        <foreignObject x={cx - 6} y={cy - 6} width={12} height={12}>
          <IconComponent style={{ width: 12, height: 12, color: metricConfig.color }} />
        </foreignObject>
      </g>
    );
  };

  if (dailyEntries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Dados insuficientes para gerar gráfico</p>
        </CardContent>
      </Card>
    );
  }

  // Format predictions for table display
  const formattedPredictions = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    return predictions.map(pred => ({
      date: format(parseISO(pred.date), 'dd/MM', { locale: ptBR }),
      fullDate: format(parseISO(pred.date), "EEEE, dd 'de' MMMM", { locale: ptBR }),
      mood: pred.predicted_mood?.toFixed(1) || '-',
      anxiety: pred.predicted_anxiety?.toFixed(1) || '-',
      sleep: pred.predicted_sleep?.toFixed(1) || '-',
      energy: pred.predicted_energy?.toFixed(1) || '-',
      confidence_low: pred.confidence_low?.toFixed(1) || '-',
      confidence_high: pred.confidence_high?.toFixed(1) || '-',
    }));
  }, [predictions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Gráfico Multi-Camadas</CardTitle>
            <Badge variant="outline" className="ml-2">
              {enabledCount} camada{enabledCount !== 1 ? 's' : ''} ativa{enabledCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(true)}
              className="text-xs"
            >
              Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(false)}
              className="text-xs"
            >
              Nenhuma
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
            <TabsTrigger value="chart" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráfico
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Previsão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-0 space-y-4">
        {/* Layer Controls */}
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b">
          {layers.map(layer => {
            const metricConfig = metricColors[layer.id as keyof typeof metricColors];
            return (
              <label
                key={layer.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                  layer.enabled
                    ? `${metricConfig?.bgClass} border`
                    : 'bg-muted/50 border border-transparent hover:bg-muted'
                }`}
                style={{ borderColor: layer.enabled ? layer.color : 'transparent' }}
              >
                <Checkbox
                  checked={layer.enabled}
                  onCheckedChange={() => toggleLayer(layer.id)}
                  className="h-3.5 w-3.5"
                />
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${metricConfig?.textClass}`}
                  style={{ color: layer.enabled ? layer.color : undefined }}
                >
                  {layer.icon}
                  {layer.name}
                </span>
              </label>
            );
          })}
        </div>

        {/* Additional Options */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Switch
              id="trend"
              checked={showTrendLine}
              onCheckedChange={setShowTrendLine}
            />
            <Label htmlFor="trend" className="flex items-center gap-1 cursor-pointer">
              <TrendingUp className="h-3.5 w-3.5" />
              Linha de tendência
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="zones"
              checked={showReferenceZones}
              onCheckedChange={setShowReferenceZones}
            />
            <Label htmlFor="zones" className="cursor-pointer">
              Zonas de referência
            </Label>
          </div>
          {predictions.length > 0 && (
            <div className="flex items-center gap-2">
              <Switch
                id="predictions"
                checked={showPredictions}
                onCheckedChange={setShowPredictions}
              />
              <Label htmlFor="predictions" className="flex items-center gap-1 cursor-pointer">
                🔮 Previsões
              </Label>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={enrichedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              
              {/* Reference Zones */}
              {showReferenceZones && (
                <>
                  <ReferenceLine y={4} stroke="#22C55E" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <ReferenceLine y={2} stroke="#EF4444" strokeDasharray="5 5" strokeOpacity={0.5} />
                </>
              )}

              {/* Average Reference Lines */}
              {avgMood && (
                <ReferenceLine
                  y={avgMood}
                  stroke={metricColors.mood.color}
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  label={{ value: `Média: ${avgMood.toFixed(1)}`, position: 'right', fontSize: 10 }}
                />
              )}

              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 1, 2, 3, 4, 5]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => {
                  const layer = layers.find(l => l.name === value);
                  return (
                    <span className="text-xs flex items-center gap-1">
                      {layer?.icon}
                      {value}
                    </span>
                  );
                }}
              />

              {/* Prediction Confidence Area */}
              {showPredictions && predictions.length > 0 && (
                <Area
                  dataKey="confidence_high"
                  stroke="none"
                  fill={metricColors.mood.color}
                  fillOpacity={0.1}
                  name="Intervalo de confiança"
                />
              )}

              {/* Metric Lines with custom dots */}
              {layers.map(layer => 
                layer.enabled && (
                  <Line
                    key={layer.id}
                    type="monotone"
                    dataKey={layer.dataKey}
                    name={layer.name}
                    stroke={layer.color}
                    strokeWidth={2.5}
                    dot={(props) => <CustomDot {...props} />}
                    activeDot={(props) => <CustomActiveDot {...props} />}
                    connectNulls
                  />
                )
              )}

              {/* Prediction Lines */}
              {showPredictions && predictions.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="predicted_mood"
                  name="Humor (Previsão)"
                  stroke={metricColors.mood.color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: metricColors.mood.color, strokeDasharray: '0' }}
                  connectNulls
                />
              )}

              {/* Trend Line */}
              {showTrendLine && trendData && (
                <Line
                  type="monotone"
                  dataKey="trend"
                  name="Tendência"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false}
                  connectNulls
                />
              )}

              {/* Brush for zoom */}
              {enrichedChartData.length > 14 && (
                <Brush
                  dataKey="displayDate"
                  height={30}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--muted))"
                  travellerWidth={10}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

            {/* Legend Help */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-muted-foreground" style={{ borderTop: '2px dashed' }} />
                <span>Linha de tendência (média móvel)</span>
              </div>
              {predictions.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: metricColors.mood.color }} />
                  <span>Previsão ML</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5" style={{ backgroundColor: '#22C55E' }} />
                <span>Zona saudável (≥4)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5" style={{ backgroundColor: '#EF4444' }} />
                <span>Zona de atenção (≤2)</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="mt-0">
            {formattedPredictions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>Previsão para os próximos {predictions.length} dias</span>
                </div>
                
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-medium">Data</TableHead>
                        <TableHead className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                            Humor
                          </div>
                        </TableHead>
                        <TableHead className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-purple-500" />
                            Ansiedade
                          </div>
                        </TableHead>
                        <TableHead className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <Moon className="h-3.5 w-3.5 text-indigo-500" />
                            Sono
                          </div>
                        </TableHead>
                        <TableHead className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            Energia
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formattedPredictions.map((pred, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{pred.date}</span>
                              <span className="text-xs text-muted-foreground capitalize">{pred.fullDate.split(',')[0]}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${pred.mood !== '-' ? 'text-rose-600' : 'text-muted-foreground'}`}>
                              {pred.mood}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${pred.anxiety !== '-' ? 'text-purple-600' : 'text-muted-foreground'}`}>
                              {pred.anxiety}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${pred.sleep !== '-' ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                              {pred.sleep}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${pred.energy !== '-' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {pred.energy}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Previsões são baseadas em padrões históricos e podem variar conforme novos dados forem registrados.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium mb-1">Nenhuma previsão disponível</p>
                <p className="text-sm text-muted-foreground">
                  Gere insights na aba <strong>"Inteligência Medcos"</strong> para ver previsões aqui.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
