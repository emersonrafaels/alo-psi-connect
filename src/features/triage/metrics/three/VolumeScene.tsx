import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Edges, Html } from '@react-three/drei';
import type { Group } from 'three';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRIORITY_META } from '../../triagePlan';
import { PRIORITIES, type MetricsSelection, type WeekBucket } from '../teamMetrics';
import { OVERLAY_Z, PRIORITY_HEX, VOLUME, volumeColumns, type VolumeColumn } from './sceneData';
import type { SceneTheme } from './useSceneTheme';

export function SceneLabel({ position, children, color, className = '' }: { position: [number, number, number]; children: ReactNode; color: string; className?: string }) {
  return (
    <Html position={position} center zIndexRange={OVERLAY_Z} style={{ pointerEvents: 'none' }}>
      <div className={`whitespace-nowrap text-[11px] font-medium ${className}`} style={{ color }}>{children}</div>
    </Html>
  );
}

export function SceneTooltip({ position, children }: { position: [number, number, number]; children: ReactNode }) {
  return (
    <Html position={position} center zIndexRange={OVERLAY_Z} style={{ pointerEvents: 'none', transform: 'translateY(-50%)' }}>
      <div className="min-w-[180px] rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">{children}</div>
    </Html>
  );
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const matches = (c: VolumeColumn, s: MetricsSelection | null) =>
  !s || ((!s.weekStart || s.weekStart === c.weekKey) && (!s.priority || s.priority === c.priority));

interface ColumnProps {
  column: VolumeColumn;
  delay: number;
  dimmed: boolean;
  selected: boolean;
  hovered: boolean;
  theme: SceneTheme;
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

function Column({ column: c, delay, dimmed, selected, hovered, theme, reducedMotion, onHover, onClick }: ColumnProps) {
  const ref = useRef<Group>(null);
  const progress = useRef(reducedMotion ? 1 : -delay);

  // Columns grow from the floor when the scene opens, staggered left to right.
  useFrame((_, dt) => {
    if (!ref.current || progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + dt * 1.6);
    ref.current.scale.y = Math.max(0.001, easeOut(Math.max(0, progress.current)));
  });

  const color = PRIORITY_HEX[c.priority];
  const empty = c.created === 0;
  const total = c.resolvedHeight + c.openHeight;
  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(c.id); document.body.style.cursor = 'pointer'; },
    onPointerOut: () => { onHover(null); document.body.style.cursor = ''; },
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); },
  };

  if (empty) {
    return (
      <mesh position={[c.x, 0.015, c.z]} {...handlers}>
        <boxGeometry args={[VOLUME.size, 0.03, VOLUME.size]} />
        <meshStandardMaterial color={theme.muted} transparent opacity={dimmed ? 0.1 : 0.25} />
      </mesh>
    );
  }

  return (
    <group ref={ref} position={[c.x, 0, c.z]} scale={[1, reducedMotion ? 1 : 0.001, 1]} {...handlers}>
      {c.resolvedHeight > 0 && (
        <mesh position={[0, c.resolvedHeight / 2, 0]}>
          <boxGeometry args={[VOLUME.size, c.resolvedHeight, VOLUME.size]} />
          <meshStandardMaterial color={color} transparent opacity={dimmed ? 0.18 : 1} roughness={0.55} emissive={color} emissiveIntensity={hovered ? 0.35 : 0} />
        </mesh>
      )}
      {c.openHeight > 0 && (
        <mesh position={[0, c.resolvedHeight + c.openHeight / 2, 0]}>
          <boxGeometry args={[VOLUME.size, c.openHeight, VOLUME.size]} />
          <meshStandardMaterial color={color} transparent opacity={dimmed ? 0.08 : 0.38} roughness={0.4} depthWrite={false} emissive={color} emissiveIntensity={hovered ? 0.3 : 0} />
        </mesh>
      )}
      {selected && (
        <mesh position={[0, total / 2, 0]}>
          <boxGeometry args={[VOLUME.size + 0.06, total + 0.06, VOLUME.size + 0.06]} />
          <meshBasicMaterial visible={false} />
          <Edges color={theme.foreground} />
        </mesh>
      )}
    </group>
  );
}

interface VolumeSceneProps {
  weeks: WeekBucket[];
  selection: MetricsSelection | null;
  onSelect: (selection: MetricsSelection | null) => void;
  theme: SceneTheme;
  reducedMotion: boolean;
}

export function VolumeScene({ weeks, selection, onSelect, theme, reducedMotion }: VolumeSceneProps) {
  const { columns, width, depth } = useMemo(() => volumeColumns(weeks), [weeks]);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredColumn = columns.find((c) => c.id === hovered);
  const weekOf = (key: string) => weeks.find((w) => w.key === key)!;
  const range = (key: string) => {
    const w = weekOf(key);
    return `${format(w.start, 'dd/MM', { locale: ptBR })} – ${format(w.end, 'dd/MM', { locale: ptBR })}`;
  };

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
        <planeGeometry args={[width + 1.6, depth + 1.2]} />
        <meshStandardMaterial color={theme.border} transparent opacity={0.6} />
      </mesh>

      {columns.map((c) => (
        <Column
          key={c.id}
          column={c}
          delay={c.weekIndex * 0.06}
          dimmed={!matches(c, selection)}
          selected={!!selection && !!selection.weekStart && !!selection.priority && matches(c, selection)}
          hovered={hovered === c.id}
          theme={theme}
          reducedMotion={reducedMotion}
          onHover={setHovered}
          onClick={() => {
            const same = selection?.weekStart === c.weekKey && selection?.priority === c.priority;
            onSelect(same ? null : { weekStart: c.weekKey, priority: c.priority });
          }}
        />
      ))}

      {/* Week labels along the front edge (every other week to avoid collisions), priorities along the left. */}
      {weeks.map((w, i) => (i % 2 === (weeks.length - 1) % 2) && (
        <SceneLabel key={w.key} position={[columns[i * PRIORITIES.length].x, 0, depth / 2 + 0.3]} color={theme.muted}>
          {format(w.start, 'dd/MM', { locale: ptBR })}
        </SceneLabel>
      ))}
      {PRIORITIES.map((p, j) => (
        <SceneLabel key={p} position={[-width / 2 - 0.5, 0, columns[j].z]} color={theme.foreground} className="text-right">
          {PRIORITY_META[p].label}
        </SceneLabel>
      ))}

      {hoveredColumn && (
        <SceneTooltip position={[hoveredColumn.x, hoveredColumn.resolvedHeight + hoveredColumn.openHeight + 0.6, hoveredColumn.z]}>
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
