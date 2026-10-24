import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges, Instance, Instances, Line } from '@react-three/drei';
import { AXIS, RISK_HEX, toAxis, type WellbeingPoint } from './sceneData';
import { SceneLabel, SceneTooltip } from './VolumeScene';
import type { SceneTheme } from './useSceneTheme';

const RISK_LABEL: Record<string, string> = { critical: 'Em Risco', alert: 'Alerta', attention: 'Atenção', healthy: 'Saudável', no_data: 'Sem dados' };
const H = AXIS / 2;
const fmt = (v: number | null) => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

interface WellbeingSceneProps {
  points: WellbeingPoint[];
  theme: SceneTheme;
  onOpenStudent: (patientId: string) => void;
}

/** One instanced mesh per triage status, so thousands of students stay a couple of draw calls. */
function PointCloud({ points, glow, onHover, onOpen }: { points: WellbeingPoint[]; glow: boolean; onHover: (p: WellbeingPoint | null) => void; onOpen: (p: WellbeingPoint) => void }) {
  if (points.length === 0) return null;
  return (
    <Instances limit={points.length} range={points.length}>
      <sphereGeometry args={[1, 18, 18]} />
      <meshStandardMaterial roughness={glow ? 0.25 : 0.7} emissive="#ffffff" emissiveIntensity={glow ? 0.22 : 0} toneMapped={false} />
      {points.map((p) => (
        <Instance
          key={p.patientId}
          position={p.position}
          scale={p.radius}
          color={RISK_HEX[p.risk]}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(p); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(p); }}
        />
      ))}
    </Instances>
  );
}

export function WellbeingScene({ points, theme, onOpenStudent }: WellbeingSceneProps) {
  const [hovered, setHovered] = useState<WellbeingPoint | null>(null);
  const origin: [number, number, number] = [-H, -H, -H];
  const open = (p: WellbeingPoint) => { document.body.style.cursor = ''; onOpenStudent(p.patientId); };

  // Critical zone, same thresholds as the risk classification: mood ≤ 1.5 or anxiety ≥ 4.5.
  const moodEdge = toAxis(1.5);
  const anxietyEdge = toAxis(4.5);

  return (
    <group>
      {/* Cube frame and the three axes from the "worst mood, calm, worst sleep" corner. */}
      <mesh>
        <boxGeometry args={[AXIS, AXIS, AXIS]} />
        <meshBasicMaterial visible={false} />
        <Edges color={theme.border} />
      </mesh>
      <Line points={[origin, [H, -H, -H]]} color={theme.muted} lineWidth={1.5} />
      <Line points={[origin, [-H, H, -H]]} color={theme.muted} lineWidth={1.5} />
      <Line points={[origin, [-H, -H, H]]} color={theme.muted} lineWidth={1.5} />

      <mesh position={[(moodEdge - H) / 2, 0, 0]}>
        <boxGeometry args={[moodEdge + H, AXIS, AXIS]} />
        <meshBasicMaterial color={RISK_HEX.critical} transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <mesh position={[0, (anxietyEdge + H) / 2, 0]}>
        <boxGeometry args={[AXIS, H - anxietyEdge, AXIS]} />
        <meshBasicMaterial color={RISK_HEX.critical} transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <SceneLabel position={[-H + 0.4, H + 0.35, -H]} color={RISK_HEX.critical}>Zona crítica</SceneLabel>

      <SceneLabel position={[H + 0.5, -H, -H]} color={theme.foreground}>Humor →</SceneLabel>
      <SceneLabel position={[-H, H + 0.4, -H - 0.3]} color={theme.foreground}>Ansiedade ↑</SceneLabel>
      <SceneLabel position={[-H, -H, H + 0.5]} color={theme.foreground}>Sono →</SceneLabel>
      {[1, 3, 5].map((v) => (
        <group key={v}>
          <SceneLabel position={[toAxis(v), -H - 0.35, -H]} color={theme.muted}>{v}</SceneLabel>
          <SceneLabel position={[-H - 0.3, toAxis(v), -H]} color={theme.muted}>{v}</SceneLabel>
          <SceneLabel position={[-H - 0.3, -H - 0.2, toAxis(v)]} color={theme.muted}>{v}</SceneLabel>
        </group>
      ))}

      <PointCloud points={points.filter((p) => p.triaged)} glow={false} onHover={setHovered} onOpen={open} />
      <PointCloud points={points.filter((p) => !p.triaged)} glow onHover={setHovered} onOpen={open} />

      {hovered && (
        <SceneTooltip position={[hovered.position[0], hovered.position[1] + hovered.radius + 0.5, hovered.position[2]]}>
          <p className="flex items-center gap-1.5 font-semibold">
            <span className="h-2 w-2 rounded-full" style={{ background: RISK_HEX[hovered.risk] }} />
            {hovered.label} · {RISK_LABEL[hovered.risk]}
          </p>
          <p className="mt-1 tabular-nums">Humor {fmt(hovered.mood)} · Ansiedade {fmt(hovered.anxiety)} · Sono {fmt(hovered.sleep)} · Energia {fmt(hovered.energy)}</p>
          <p className="mt-0.5 text-muted-foreground">{hovered.triaged ? 'Já triado' : 'Ainda não triado'} · {hovered.entryCount} registros no diário</p>
          <p className="mt-1 text-muted-foreground">Clique para ver o histórico</p>
        </SceneTooltip>
      )}
    </group>
  );
}
