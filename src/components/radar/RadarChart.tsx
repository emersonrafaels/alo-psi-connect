import { Radar, RadarChart as RRadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { MATURITY_DIMENSIONS } from '@/data/radarCatalog';

interface Props {
  maturity: Record<string, number>;
  height?: number;
}

export function RadarChart({ maturity, height = 320 }: Props) {
  const data = MATURITY_DIMENSIONS.map(d => ({
    dimension: d.name,
    valor: Number(maturity[d.id] ?? 0),
    fullMark: 100,
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RRadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
          <Radar name="Maturidade" dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              color: 'hsl(var(--popover-foreground))',
            }}
            formatter={(v: any) => [`${v}/100`, 'Maturidade']}
          />
        </RRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
