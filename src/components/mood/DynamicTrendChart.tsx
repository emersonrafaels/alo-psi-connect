import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import { buildSeries, filterEntriesByDays, getEmotionColor, type Granularity } from '@/utils/moodSeriesBuilder';

interface Props {
  entries: MoodEntry[];
  configs: EmotionConfig[];
  selected: string[];
  days: number;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

export const DynamicTrendChart = ({ entries, configs, selected, days, granularity, onGranularityChange }: Props) => {
  const data = useMemo(() => {
    const filtered = filterEntriesByDays(entries, days);
    return buildSeries(filtered, selected, granularity);
  }, [entries, selected, days, granularity]);

  const labels: Record<string, string> = {};
  selected.forEach((k) => {
    labels[k] = configs.find((c) => c.emotion_type === k)?.display_name ?? k;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Tendências</CardTitle>
            <CardDescription>
              Evolução das emoções selecionadas nos últimos {days} dias.
            </CardDescription>
          </div>
          <Tabs value={granularity} onValueChange={(v) => onGranularityChange(v as Granularity)}>
            <TabsList>
              <TabsTrigger value="day">Diário</TabsTrigger>
              <TabsTrigger value="week">Semanal</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {selected.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Selecione ao menos uma emoção acima para visualizar.
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Sem registros no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selected.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={labels[key]}
                  stroke={getEmotionColor(configs, key, idx)}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
