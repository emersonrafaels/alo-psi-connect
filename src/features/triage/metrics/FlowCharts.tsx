import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceArea, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { WeekBucket } from './teamMetrics';

/** Categorical slots 1 and 2 of the validated palette (light/dark), see the dataviz reference. */
const flowConfig = {
  created: { label: 'Novas triagens', theme: { light: '#2a78d6', dark: '#3987e5' } },
  resolved: { label: 'Resolvidas', theme: { light: '#eb6834', dark: '#d95926' } },
} satisfies ChartConfig;

const backlogConfig = {
  backlog: { label: 'Em andamento', theme: { light: '#2a78d6', dark: '#3987e5' } },
} satisfies ChartConfig;

const weekLabel = (w: WeekBucket) => format(w.start, 'dd/MM', { locale: ptBR });
const weekRange = (w: WeekBucket) => `${format(w.start, 'dd/MM', { locale: ptBR })} – ${format(w.end, 'dd/MM', { locale: ptBR })}`;

interface FlowChartsProps {
  weeks: WeekBucket[];
  selectedWeek?: string;
  onSelectWeek: (key: string | undefined) => void;
}

/**
 * Two charts instead of one combined chart: weekly volume (tens) and open cases (hundreds) live on
 * different scales, and a second y-axis would make them look comparable when they are not.
 * Animations are off: the data is rebuilt on every filter change and recharts would replay them each time.
 */
export function FlowCharts({ weeks, selectedWeek, onSelectWeek }: FlowChartsProps) {
  const data = weeks.map((w) => ({ key: w.key, label: weekLabel(w), range: weekRange(w), created: w.created, resolved: w.resolved, backlog: w.backlog }));
  const selected = data.find((d) => d.key === selectedWeek);
  const dim = (key: string) => (selectedWeek && key !== selectedWeek ? 0.35 : 1);
  const toggle = (key?: string) => onSelectWeek(key && key !== selectedWeek ? key : undefined);
  const tooltipLabel = (_: unknown, payload: { payload?: { range?: string } }[]) => `Semana ${payload?.[0]?.payload?.range ?? ''}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure className="space-y-2">
        <figcaption>
          <p className="text-sm font-medium">Novas triagens e resolvidas por semana</p>
          <p className="text-xs text-muted-foreground">Clique numa semana para filtrar o restante da página.</p>
        </figcaption>
        <ChartContainer config={flowConfig} className="h-[240px] w-full">
          <BarChart
            data={data}
            barGap={2}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            onClick={(e) => toggle((e?.activePayload?.[0]?.payload as { key?: string } | undefined)?.key)}
            className="cursor-pointer"
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <ChartTooltip cursor={{ fillOpacity: 0.3 }} content={<ChartTooltipContent labelFormatter={tooltipLabel} />} />
            <ChartLegend content={<ChartLegendContent />} />
            {(['created', 'resolved'] as const).map((k) => (
              <Bar key={k} dataKey={k} fill={`var(--color-${k})`} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {data.map((d) => <Cell key={d.key} fillOpacity={dim(d.key)} />)}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </figure>

      <figure className="space-y-2">
        <figcaption>
          <p className="text-sm font-medium">Casos em andamento no fim de cada semana</p>
          <p className="text-xs text-muted-foreground">Se a linha sobe, entram mais casos do que a equipe consegue resolver.</p>
        </figcaption>
        <ChartContainer config={backlogConfig} className="h-[240px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
            onClick={(e) => toggle((e?.activePayload?.[0]?.payload as { key?: string } | undefined)?.key)}
            className="cursor-pointer"
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            {selected && <ReferenceArea x1={selected.label} x2={selected.label} fill="hsl(var(--muted-foreground))" fillOpacity={0.12} />}
            <ChartTooltip content={<ChartTooltipContent labelFormatter={tooltipLabel} />} />
            <Area
              dataKey="backlog"
              type="monotone"
              isAnimationActive={false}
              stroke="var(--color-backlog)"
              strokeWidth={2}
              fill="var(--color-backlog)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ChartContainer>
      </figure>
    </div>
  );
}
