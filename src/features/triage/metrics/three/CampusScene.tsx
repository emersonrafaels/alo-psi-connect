import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Risk } from '../../priorities';
import { Building, Grow, Lawn, Path, SceneLabel, SceneTooltip, Trees } from './CampusKit';
import { CAMPUS, NO_DATA_WINDOW, campusColors, WINDOW_COLS, buildingWindows, type CampusBuilding, type CampusDistrict } from './campusData';
import { RISK_HEX, RISK_LABEL } from './sceneData';
import type { SceneTheme } from './useSceneTheme';


/** Red light on the roof when Sinal elevado students are still waiting for triage. */
function Beacon({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    ref.current.scale.setScalar(1 + 0.3 * Math.sin(clock.elapsedTime * 3));
  });
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh ref={ref} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={RISK_HEX.critical} emissive={RISK_HEX.critical} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

interface CampusSceneProps {
  buildings: CampusBuilding[];
  districts: CampusDistrict[];
  theme: SceneTheme;
  reducedMotion: boolean;
  litRisks: Set<Risk>;
  highlightPending: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CampusScene({ buildings, districts, theme, reducedMotion, litRisks, highlightPending, selectedId, onSelect }: CampusSceneProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const colors = campusColors(theme);
  const width = Math.max(...buildings.map((b) => Math.abs(b.x))) * 2 + CAMPUS.cell;
  const depth = Math.max(...buildings.map((b) => Math.abs(b.z))) * 2 + CAMPUS.cell;
  const showAllLabels = buildings.length <= 12;
  const hoveredBuilding = buildings.find((b) => b.id === hovered);
  const windows = useMemo(() => new Map(buildings.map((b) => [b.id, buildingWindows(b, litRisks)])), [buildings, litRisks]);

  return (
    <group>
      <Lawn width={width} depth={depth} colors={colors} />
      <Trees width={width} depth={depth} colors={colors} />

      {/* Each unit is a paved quad with its name at the front; a boulevard runs in front of all of them. */}
      {districts.map((d) => (
        <group key={d.name ?? 'campus'}>
          <Path x={d.x} z={d.z} width={d.width} depth={d.depth} colors={colors} />
          {d.name && (
            <SceneLabel position={[d.x, 0, d.z + d.depth / 2 + 0.35]} color={theme.foreground} className="rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold">
              {d.name}
            </SceneLabel>
          )}
        </group>
      ))}
      <Path x={0} z={depth / 2 + 0.2} width={width + 1.6} depth={0.5} colors={colors} />

      {buildings.map((b, i) => {
        const height = b.floors * CAMPUS.floorHeight;
        const pending = (b.pendingCritical ?? 0) > 0;
        const handlers = {
          onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(b.id); document.body.style.cursor = 'pointer'; },
          onPointerOut: () => { setHovered(null); document.body.style.cursor = ''; },
          onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(selectedId === b.id ? null : b.id); },
        };
        return (
          <Grow key={b.id} position={[b.x, 0, b.z]} delay={i * 0.05} reducedMotion={reducedMotion}>
            <Building
              width={CAMPUS.footprint}
              depth={CAMPUS.footprint}
              height={height}
              rows={b.floors}
              cols={WINDOW_COLS}
              windows={windows.get(b.id)!}
              base={colors.concrete}
              roof={colors.roof}
              glass={colors.glass}
              dimmed={highlightPending && !pending}
              highlighted={hovered === b.id}
              selected={selectedId === b.id}
              outline={theme.foreground}
              {...handlers}
            >
              {pending && <Beacon reducedMotion={reducedMotion} />}
            </Building>
            {(showAllLabels || selectedId === b.id) && hovered !== b.id && (
              <SceneLabel position={[0, height + (pending ? 1 : 0.45), 0]} color={theme.foreground} className="max-w-[140px] truncate">
                {b.name}
              </SceneLabel>
            )}
          </Grow>
        );
      })}

      {hoveredBuilding && (
        <SceneTooltip position={[hoveredBuilding.x, hoveredBuilding.floors * CAMPUS.floorHeight + 1.1, hoveredBuilding.z]}>
          <p className="font-semibold">{hoveredBuilding.name}</p>
          {hoveredBuilding.district && <p className="text-muted-foreground">{hoveredBuilding.district}</p>}
          <p className="mt-1 tabular-nums">{hoveredBuilding.total} {hoveredBuilding.total === 1 ? 'aluno' : 'alunos'}</p>
          {hoveredBuilding.byRisk ? (
            <>
              <ul className="mt-1 space-y-0.5 tabular-nums">
                {(['critical', 'alert', 'attention', 'healthy', 'no_data'] as Risk[]).filter((r) => hoveredBuilding.byRisk![r] > 0).map((r) => (
                  <li key={r} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: r === 'no_data' ? NO_DATA_WINDOW : RISK_HEX[r] }} />
                    {RISK_LABEL[r]}: {hoveredBuilding.byRisk![r]}
                  </li>
                ))}
              </ul>
              {(hoveredBuilding.pendingCritical ?? 0) > 0 && (
                <p className="mt-1 font-medium text-red-600 dark:text-red-400">{hoveredBuilding.pendingCritical} Sinal elevado aguardando triagem</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-muted-foreground">Grupo com menos de 10 alunos: divisão por risco oculta para proteger a privacidade.</p>
          )}
          <p className="mt-1 text-muted-foreground">Clique para fixar o resumo</p>
        </SceneTooltip>
      )}
    </group>
  );
}
