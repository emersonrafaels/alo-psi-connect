import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import {
  describeCorrelation,
  getEmotionColor,
  getEmotionRaw,
  linearRegression,
  pearson,
} from '@/utils/moodSeriesBuilder';

interface Props {
  entries: MoodEntry[];
  configs: EmotionConfig[];
}

export const EmotionScatterCard = ({ entries, configs }: Props) => {
  const enabled = configs.filter((c) => c.is_enabled);
  const [xKey, setXKey] = useState<string>(enabled[0]?.emotion_type || '');
  const [yKey, setYKey] = useState<string>(enabled[1]?.emotion_type || enabled[0]?.emotion_type || '');

  useEffect(() => {
    if (!xKey && enabled[0]) setXKey(enabled[0].emotion_type);
    if (!yKey && enabled[1]) setYKey(enabled[1].emotion_type);
  }, [enabled, xKey, yKey]);

  const { points, regression, r, xLabel, yLabel, xColor, yColor } = useMemo(() => {
    const xLabel = configs.find((c) => c.emotion_type === xKey)?.display_name ?? xKey;
    const yLabel = configs.find((c) => c.emotion_type === yKey)?.display_name ?? yKey;
    const xColor = getEmotionColor(configs, xKey, 0);
    const yColor = getEmotionColor(configs, yKey, 1);
    const points = entries
      .map((e) => {
        const x = getEmotionRaw(e, xKey);
        const y = getEmotionRaw(e, yKey);
        if (x === null || y === null) return null;
        return { x, y, date: e.date };
      })
      .filter((p): p is { x: number; y: number; date: string } => p !== null);
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const reg = linearRegression(xs, ys);
    const corr = pearson(xs, ys);
    let regression: { x: number; y: number }[] = [];
    if (reg && xs.length > 1) {
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      regression = [
        { x: minX, y: reg.intercept + reg.slope * minX },
        { x: maxX, y: reg.intercept + reg.slope * maxX },
      ];
    }
    return { points, regression, r: corr, xLabel, yLabel, xColor, yColor };
  }, [entries, configs, xKey, yKey]);

  const chartData = useMemo(() => {
    return points.map((p) => ({ ...p, trend: undefined as number | undefined }));
  }, [points]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Relação entre 2 emoções</CardTitle>
            <CardDescription>Cada ponto é um dia. A linha mostra a tendência geral.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={xKey} onValueChange={setXKey}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Eixo X" />
              </SelectTrigger>
              <SelectContent>
                {enabled.map((c) => (
                  <SelectItem key={c.emotion_type} value={c.emotion_type}>
                    {c.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yKey} onValueChange={setYKey}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Eixo Y" />
              </SelectTrigger>
              <SelectContent>
                {enabled.map((c) => (
                  <SelectItem key={c.emotion_type} value={c.emotion_type}>
                    {c.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {points.length < 3 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Precisamos de pelo menos 3 dias com ambas emoções para mostrar a relação.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 16, bottom: 16, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={xLabel}
                  label={{ value: xLabel, position: 'insideBottom', offset: -8, fill: xColor }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={yLabel}
                  label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: yColor }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: any) => [value, name === 'x' ? xLabel : yLabel]}
                />
                <Scatter data={chartData} fill={xColor} />
                {regression.length === 2 && (
                  <Line
                    data={regression}
                    dataKey="y"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground italic">{describeCorrelation(r)} entre {xLabel} e {yLabel}.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
