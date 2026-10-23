import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MonitorX, Orbit, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Risk } from '../../priorities';
import { PRIORITY_META } from '../../triagePlan';
import { PRIORITIES, type MetricsSelection, type WeekBucket } from '../teamMetrics';
import { PRIORITY_HEX, RISK_HEX, RISK_LABEL, SCENE_RISKS, wellbeingPoints, type Scene3D, type TriageStatusFilter, type WellbeingInput } from './sceneData';
import { hasWebGL, usePrefersReducedMotion, useSceneTheme } from './useSceneTheme';
import { VolumeScene } from './VolumeScene';
import { WellbeingScene } from './WellbeingScene';

export interface Metrics3DPanelProps {
  scene: Scene3D;
  weeks: WeekBucket[];
  selection: MetricsSelection | null;
  onSelect: (selection: MetricsSelection | null) => void;
  students: WellbeingInput[];
  periodDays: number;
  nameOf: (patientId: string) => string;
  onOpenStudent: (patientId: string) => void;
  risks: Set<Risk>;
  status: TriageStatusFilter;
}

const CAMERA: Record<Scene3D, [number, number, number]> = { volume: [9, 8, 11], wellbeing: [9, 6, 10] };

interface Controls { reset: () => void }

/** Interactive 3D views of the triage metrics. Lazy-loaded: three.js is only downloaded in 3D mode. Filters live in the page toolbar. */
export default function Metrics3DPanel({ scene, weeks, selection, onSelect, students, periodDays, nameOf, onOpenStudent, risks, status }: Metrics3DPanelProps) {
  const theme = useSceneTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<Controls | null>(null);
  const webgl = useMemo(hasWebGL, []);

  const allPoints = useMemo(() => wellbeingPoints(students, nameOf, periodDays), [students, nameOf, periodDays]);
  const points = allPoints.filter((p) => risks.has(p.risk) && (status === 'all' || (status === 'pending' ? !p.triaged : p.triaged)));
  const unplaced = students.length - allPoints.length;

  if (!webgl) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        <MonitorX className="h-8 w-8 opacity-50" />
        Este navegador não oferece suporte a WebGL, necessário para a visualização 3D.
        <span className="text-xs">Os mesmos dados estão no modo Dashboard.</span>
      </div>
    );
  }

  const selectedWeek = weeks.find((w) => w.key === selection?.weekStart);
  const selectionSummary = (() => {
    if (!selection) return null;
    const ps = selection.priority ? [selection.priority] : PRIORITIES;
    const list = selectedWeek ? [selectedWeek] : weeks;
    const created = list.reduce((acc, w) => acc + ps.reduce((a, p) => a + w.byPriority[p].created, 0), 0);
    const resolved = list.reduce((acc, w) => acc + ps.reduce((a, p) => a + w.byPriority[p].resolvedSoFar, 0), 0);
    const where = [
      selectedWeek && `semana ${format(selectedWeek.start, 'dd/MM', { locale: ptBR })} – ${format(selectedWeek.end, 'dd/MM', { locale: ptBR })}`,
      selection.priority && `prioridade ${PRIORITY_META[selection.priority].label}`,
    ].filter(Boolean).join(' · ');
    return `${where}: ${created} triagens, ${resolved} já resolvidas, ${created - resolved} em aberto.`;
  })();

  const description = scene === 'volume'
    ? `Colunas 3D de triagens por semana e prioridade nas últimas ${weeks.length} semanas. Os mesmos números estão no modo Dashboard.`
    : `Mapa 3D de ${points.length} alunos anonimizados posicionados por humor, ansiedade e sono, coloridos pelo nível de risco.`;

  return (
    <div className="space-y-3">
      <div className="relative h-[min(72vh,720px)] min-h-[460px] overflow-hidden rounded-xl border bg-gradient-to-b from-muted/40 to-background" role="img" aria-label={description}>
        <Canvas key={scene} camera={{ position: CAMERA[scene], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 12, 8]} intensity={0.9} />
          <directionalLight position={[-8, 4, -6]} intensity={0.25} />
          {scene === 'volume'
            ? <VolumeScene weeks={weeks} selection={selection} onSelect={onSelect} theme={theme} reducedMotion={reducedMotion} />
            : <WellbeingScene points={points} theme={theme} onOpenStudent={onOpenStudent} />}
          <OrbitControls
            ref={controlsRef as never}
            makeDefault
            enableDamping
            autoRotate={autoRotate && !reducedMotion}
            autoRotateSpeed={0.6}
            minDistance={6}
            maxDistance={28}
            maxPolarAngle={scene === 'volume' ? Math.PI / 2.15 : Math.PI}
          />
        </Canvas>

        {/* Legend (top-left) and camera controls (top-right) float over the scene. */}
        <div className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-lg border bg-background/85 px-3 py-2 text-xs backdrop-blur">
          {scene === 'volume' ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {PRIORITIES.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PRIORITY_HEX[p] }} />{PRIORITY_META[p].label}
                </span>
              ))}
              <span className="text-muted-foreground">sólido = resolvidas · translúcido = em aberto</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {SCENE_RISKS.filter((r) => risks.has(r)).map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_HEX[r] }} />{RISK_LABEL[r]}
                </span>
              ))}
              <span className="tabular-nums text-muted-foreground">{points.length} alunos{unplaced > 0 && ` · ${unplaced} sem dados suficientes`}</span>
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border bg-background/85 px-2 py-1.5 backdrop-blur">
          <div className="flex items-center gap-2 px-1">
            <Switch id="auto-rotate" checked={autoRotate} onCheckedChange={setAutoRotate} disabled={reducedMotion} />
            <Label htmlFor="auto-rotate" className="text-xs font-normal">Girar</Label>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => controlsRef.current?.reset()}>
            <RotateCcw className="h-3.5 w-3.5" />Recentralizar
          </Button>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-background/70 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
          <Orbit className="h-3 w-3" />
          {scene === 'volume'
            ? 'Arraste para girar · role para aproximar · clique numa coluna para filtrar'
            : 'Arraste para girar · tamanho = registros no diário · brilho = não triado · clique num aluno para ver o histórico'}
        </p>
      </div>

      {scene === 'volume' && selectionSummary && (
        <p className="text-sm"><span className="font-medium">Seleção</span> · {selectionSummary}</p>
      )}
    </div>
  );
}
