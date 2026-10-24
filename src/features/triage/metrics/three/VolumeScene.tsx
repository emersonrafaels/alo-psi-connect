import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRIORITY_META } from '../../triagePlan';
import { PRIORITIES, type MetricsSelection, type WeekBucket } from '../teamMetrics';
import { Building, Grow, Lawn, Path, SceneLabel, SceneTooltip, Trees } from './CampusKit';
import { PRIORITY_HEX, VOLUME, volumeColumns, volumeWindows, type VolumeColumn } from './sceneData';
import { campusColors } from './campusData';
import type { SceneTheme } from './useSceneTheme';

const matches = (c: VolumeColumn, s: MetricsSelection | null) =>
  !s || ((!s.weekStart || s.weekStart === c.weekKey) && (!s.priority || s.priority === c.priority));

interface VolumeSceneProps {
  weeks: WeekBucket[];
  selection: MetricsSelection | null;
  onSelect: (selection: MetricsSelection | null) => void;
  theme: SceneTheme;
  reducedMotion: boolean;
}

/**
 * Team volume as a campus street grid: weeks run along the avenues (x), each priority is a block (z), and every
 * column is a building whose lit windows are triages already resolved and dark windows the ones still open.
 */
export function VolumeScene({ weeks, selection, onSelect, theme, reducedMotion }: VolumeSceneProps) {
  const { columns, width, depth } = volumeColumns(weeks);
  const [hovered, setHovered] = useState<string | null>(null);
  const colors = campusColors(theme);
  const hoveredColumn = columns.find((c) => c.id === hovered);
  const range = (key: string) => {
    const w = weeks.find((x) => x.key === key)!;
    return `${format(w.start, 'dd/MM', { locale: ptBR })} – ${format(w.end, 'dd/MM', { locale: ptBR })}`;
  };
  const rowZ = (j: number) => columns[j].z;

  return (
    <group>
      <Lawn width={width} depth={depth} colors={colors} />
      <Trees width={width} depth={depth} colors={colors} density={0.8} />
      {/* Streets between the priority blocks and an avenue in front. */}
      {PRIORITIES.slice(1).map((p, j) => (
        <Path key={p} x={0} z={(rowZ(j) + rowZ(j + 1)) / 2} width={width + 0.6} depth={0.45} colors={colors} />
      ))}
      <Path x={0} z={depth / 2 + 0.1} width={width + 1.2} depth={0.5} colors={colors} />

      {columns.map((c) => {
        const dimmed = !matches(c, selection);
        const handlers = {
          onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(c.id); document.body.style.cursor = 'pointer'; },
          onPointerOut: () => { setHovered(null); document.body.style.cursor = ''; },
          onClick: (e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            const same = selection?.weekStart === c.weekKey && selection?.priority === c.priority;
            onSelect(same ? null : { weekStart: c.weekKey, priority: c.priority });
          },
        };
        if (c.created === 0) {
          // Empty lot: a flat paved tile so the grid stays readable and hoverable.
          return (
            <mesh key={c.id} position={[c.x, 0.01, c.z]} {...handlers}>
              <boxGeometry args={[VOLUME.size, 0.02, VOLUME.size]} />
              <meshStandardMaterial color={colors.path} transparent opacity={dimmed ? 0.3 : 1} />
            </mesh>
          );
        }
        const height = c.resolvedHeight + c.openHeight;
        const { rows, cols, windows } = volumeWindows(c);
        return (
          <Grow key={c.id} position={[c.x, 0, c.z]} delay={c.weekIndex * 0.06} reducedMotion={reducedMotion}>
            <Building
              width={VOLUME.size}
              depth={VOLUME.size}
              height={height}
              rows={rows}
              cols={cols}
              windows={windows}
              base={PRIORITY_HEX[c.priority]}
              roof={colors.roof}
              glass={colors.glass}
              dimmed={dimmed}
              highlighted={hovered === c.id}
              selected={!!selection?.weekStart && !!selection?.priority && !dimmed}
              outline={theme.foreground}
              {...handlers}
            />
          </Grow>
        );
      })}

      {/* Week labels along the avenue (every other week to avoid collisions), block names on the left. */}
      {weeks.map((w, i) => (i % 2 === (weeks.length - 1) % 2) && (
        <SceneLabel key={w.key} position={[columns[i * PRIORITIES.length].x, 0, depth / 2 + 0.55]} color={theme.muted}>
          {format(w.start, 'dd/MM', { locale: ptBR })}
        </SceneLabel>
      ))}
      {PRIORITIES.map((p, j) => (
        <SceneLabel key={p} position={[-width / 2 - 0.6, 0, rowZ(j)]} color={theme.foreground} className="rounded bg-background/80 px-1.5 py-0.5 text-right">
          {PRIORITY_META[p].label}
        </SceneLabel>
      ))}

      {hoveredColumn && (
        <SceneTooltip position={[hoveredColumn.x, hoveredColumn.resolvedHeight + hoveredColumn.openHeight + 0.7, hoveredColumn.z]}>
          <p className="font-semibold">Semana {range(hoveredColumn.weekKey)}</p>
          <p className="mt-0.5 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_HEX[hoveredColumn.priority] }} />
            Prioridade {PRIORITY_META[hoveredColumn.priority].label}
          </p>
          <p className="mt-1 tabular-nums">
            {hoveredColumn.created} {hoveredColumn.created === 1 ? 'triagem' : 'triagens'} · {hoveredColumn.resolved} já resolvida{hoveredColumn.resolved === 1 ? '' : 's'} · {hoveredColumn.open} em aberto
          </p>
          <p className="mt-1 text-muted-foreground">Clique para filtrar a página</p>
        </SceneTooltip>
      )}
    </group>
  );
}
