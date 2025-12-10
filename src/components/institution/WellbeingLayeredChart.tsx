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
import { Heart, Brain, Moon, Zap, TrendingUp, Layers } from 'lucide-react';
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

interface LayerConfig {
  id: string;
  name: string;
  dataKey: string;
  color: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export const WellbeingLayeredChart = ({
  dailyEntries,
  predictions = [],
  avgMood,
  avgAnxiety,
}: WellbeingLayeredChartProps) => {
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'mood', name: 'Humor', dataKey: 'avg_mood', color: 'hsl(var(--chart-1))', icon: <Heart className="h-3 w-3" />, enabled: true },
    { id: 'anxiety', name: 'Ansiedade', dataKey: 'avg_anxiety', color: 'hsl(var(--chart-2))', icon: <Brain className="h-3 w-3" />, enabled: true },
    { id: 'sleep', name: 'Sono', dataKey: 'avg_sleep', color: 'hsl(var(--chart-3))', icon: <Moon className="h-3 w-3" />, enabled: false },
    { id: 'energy', name: 'Energia', dataKey: 'avg_energy', color: 'hsl(var(--chart-4))', icon: <Zap className="h-3 w-3" />, enabled: false },
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

  // Prepare chart data with trend line and predictions
  const chartData = useMemo(() => {
    const data = dailyEntries.map(entry => {
      const dateObj = parseISO(entry.date);
      return {
        ...entry,
        displayDate: format(dateObj, 'dd/MM', { locale: ptBR }),
        fullDate: format(dateObj, "dd 'de' MMMM", { locale: ptBR }),
      };
    });

    // Add predictions if available
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

  // Calculate moving average for trend line
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

  // Add trend data to chart
  const enrichedChartData = useMemo(() => {
    return chartData.map((entry, index) => ({
      ...entry,
      trend: trendData?.[index] ?? null,
    }));
  }, [chartData, trendData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const entryData = payload[0]?.payload;
    const isPrediction = entryData?.isPrediction;

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-medium text-sm mb-2 flex items-center gap-2">
          {entryData?.fullDate || label}
          {isPrediction && (
            <Badge variant="secondary" className="text-xs">
              🔮 Previsão
            </Badge>
          )}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            const layer = layers.find(l => l.dataKey === entry.dataKey || entry.dataKey.includes(l.id));
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  {layer?.icon}
                  {entry.name}:
                </span>
                <span className="font-medium">{Number(entry.value).toFixed(1)}/5</span>
              </div>
            );
          })}
          {!isPrediction && entryData?.entries_count > 0 && (
            <div className="text-xs text-muted-foreground pt-1 border-t mt-2">
              {entryData.entries_count} registro(s)
            </div>
          )}
        </div>
      </div>
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
        {/* Layer Controls */}
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b">
          {layers.map(layer => (
            <label
              key={layer.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                layer.enabled
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/50 border border-transparent hover:bg-muted'
              }`}
            >
              <Checkbox
                checked={layer.enabled}
                onCheckedChange={() => toggleLayer(layer.id)}
                className="h-3.5 w-3.5"
              />
              <span
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: layer.enabled ? layer.color : undefined }}
              >
                {layer.icon}
                {layer.name}
              </span>
            </label>
          ))}
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
                  <ReferenceLine y={4} stroke="hsl(var(--chart-1))" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <ReferenceLine y={2} stroke="hsl(var(--destructive))" strokeDasharray="5 5" strokeOpacity={0.5} />
                </>
              )}

              {/* Average Reference Lines */}
              {avgMood && (
                <ReferenceLine
                  y={avgMood}
                  stroke="hsl(var(--chart-1))"
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
                formatter={(value) => <span className="text-xs">{value}</span>}
              />

              {/* Prediction Confidence Area */}
              {showPredictions && predictions.length > 0 && (
                <Area
                  dataKey="confidence_high"
                  stroke="none"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.1}
                  name="Intervalo de confiança"
                />
              )}

              {/* Metric Lines */}
              {layers.map(layer => 
                layer.enabled && (
                  <Line
                    key={layer.id}
                    type="monotone"
                    dataKey={layer.dataKey}
                    name={layer.name}
                    stroke={layer.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: layer.color }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
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
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: 'hsl(var(--chart-1))', strokeDasharray: '0' }}
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
              <div className="w-6 h-0.5 border-t-2 border-dashed border-primary" />
              <span>Previsão ML</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
