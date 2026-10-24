import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Building2, Loader2, MonitorX, Orbit, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAcademicStructure } from '@/hooks/useAcademicStructure';
import { LEVEL_LABELS } from '@/features/academic/hierarchy';
import type { Risk } from '../../priorities';
import { PRIORITY_META } from '../../triagePlan';
import { PRIORITIES, type MetricsSelection, type WeekBucket } from '../teamMetrics';
import { CAMPUS, MIN_GROUP, NO_DATA_WINDOW, PROTECTED_WINDOW, UNPLACED_ID, WINDOW_ORDER, campusBuildings, type CampusBuilding, type CampusStudent } from './campusData';
import { PRIORITY_HEX, RISK_HEX, RISK_LABEL, SCENE_RISKS, VOLUME_LIT, type Scene3D } from './sceneData';
import { hasWebGL, usePrefersReducedMotion, useSceneTheme } from './useSceneTheme';
import { VolumeScene } from './VolumeScene';
import { CampusScene } from './CampusScene';

export interface Metrics3DPanelProps {
  institutionId: string;
  scene: Scene3D;
  weeks: WeekBucket[];
  selection: MetricsSelection | null;
  onSelect: (selection: MetricsSelection | null) => void;
  students: CampusStudent[];
  litRisks: Set<Risk>;
  highlightPending: boolean;
}

interface Controls { reset: () => void }

const swatch = (color: string, round = false) => (
  <span className={`h-2.5 w-2.5 shrink-0 ${round ? 'rounded-full' : 'rounded-sm'}`} style={{ background: color }} />
);

function BuildingSummary({ b }: { b: CampusBuilding }) {
  const known = b.byRisk ? WINDOW_ORDER.reduce((a, r) => a + b.byRisk![r], 0) : 0;
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-semibold">{b.name}</p>
          {b.district && <p className="text-xs text-muted-foreground">{b.district}</p>}
        </div>
        <p className="text-sm tabular-nums">{b.total} {b.total === 1 ? 'aluno' : 'alunos'}</p>
      </div>
      {b.byRisk ? (
        <>
          <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" role="img"
            aria-label={WINDOW_ORDER.map((r) => `${RISK_LABEL[r]}: ${b.byRisk![r]}`).join(', ')}>
            {WINDOW_ORDER.filter((r) => b.byRisk![r] > 0).map((r) => (
              <div key={r} style={{ width: `${(b.byRisk![r] / known) * 100}%`, background: r === 'no_data' ? NO_DATA_WINDOW : RISK_HEX[r] }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {WINDOW_ORDER.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                {swatch(r === 'no_data' ? NO_DATA_WINDOW : RISK_HEX[r])}{RISK_LABEL[r]}
                <span className="font-medium tabular-nums text-foreground">{b.byRisk![r]}</span>
              </li>
            ))}
          </ul>
          {(b.pendingCritical ?? 0) > 0 && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{b.pendingCritical} aluno{b.pendingCritical! > 1 ? 's' : ''} Em Risco aguardando triagem.</p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Grupo com menos de {MIN_GROUP} alunos: a divisão por nível de risco fica oculta para proteger a privacidade, como no Comparador.
        </p>
      )}
    </div>
  );
}

/** Interactive 3D views of the triage metrics as a university campus. Lazy-loaded: three.js is only downloaded in 3D mode. */
export default function Metrics3DPanel({ institutionId, scene, weeks, selection, onSelect, students, litRisks, highlightPending }: Metrics3DPanelProps) {
  const theme = useSceneTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const controlsRef = useRef<Controls | null>(null);
  const webgl = useMemo(hasWebGL, []);

  // Fetched only when the 3D opens; aggregated per building before anything is drawn.
  const academic = useAcademicStructure(institutionId);
  const campus = useMemo(
    () => campusBuildings(academic.units, academic.placements, academic.levels, students),
    [academic.units, academic.placements, academic.levels, students],
  );
  const realBuildings = campus.buildings.filter((b) => b.id !== UNPLACED_ID);
  const unplaced = campus.buildings.find((b) => b.id === UNPLACED_ID)?.total ?? 0;
  const levelPlural = `${LEVEL_LABELS[campus.level].toLowerCase()}s`;
  const campusReady = !academic.isLoading && realBuildings.length > 0;

  if (!webgl) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        <MonitorX className="h-8 w-8 opacity-50" />
        Este navegador não oferece suporte a WebGL, necessário para a visualização 3D.
        <span className="text-xs">Os mesmos dados estão no modo Dashboard.</span>
      </div>
    );
  }

  const campusSpan = Math.max(
    8,
    ...campus.buildings.map((b) => Math.abs(b.x) * 2 + CAMPUS.cell),
    ...campus.buildings.map((b) => Math.abs(b.z) * 2 + CAMPUS.cell),
  );
  const camera: [number, number, number] = scene === 'volume' ? [9, 8, 11] : [campusSpan * 0.55, campusSpan * 0.5, campusSpan * 0.75];
  const maxDistance = scene === 'volume' ? 28 : campusSpan * 2.2;

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
    ? `Campus 3D com um prédio por semana e prioridade nas últimas ${weeks.length} semanas; janelas acesas são triagens resolvidas. Os mesmos números estão no modo Dashboard.`
    : `Campus 3D com um prédio por ${LEVEL_LABELS[campus.level].toLowerCase()}; a altura acompanha o número de alunos e as janelas mostram a distribuição por nível de risco, só em grupos com ${MIN_GROUP} alunos ou mais.`;

  const showCampusEmpty = scene === 'campus' && !academic.isLoading && realBuildings.length === 0;

  return (
    <div className="space-y-3">
      <div className="relative h-[min(72vh,720px)] min-h-[460px] overflow-hidden rounded-xl border bg-gradient-to-b from-sky-100/60 to-background dark:from-slate-900 dark:to-background" role="img" aria-label={description}>
        {showCampusEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <Building2 className="h-10 w-10 opacity-40" />
            <p className="max-w-md">A estrutura acadêmica ainda não foi cadastrada, então não há prédios para mostrar.</p>
            <p className="max-w-md text-xs">Cadastre cursos e turmas em <strong>Alunos › Estrutura acadêmica</strong> e posicione os alunos nas turmas.</p>
          </div>
        ) : (scene === 'volume' || campusReady) && (
          <Canvas
            key={scene}
            camera={{ position: camera, fov: 42 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            onPointerMissed={() => setSelectedBuilding(null)}
          >
            <hemisphereLight args={['#ffffff', theme.dark ? '#1e293b' : '#d9ead3', 0.7]} />
            <directionalLight position={[8, 14, 10]} intensity={0.9} />
            <directionalLight position={[-10, 6, -8]} intensity={0.25} />
            {scene === 'volume'
              ? <VolumeScene weeks={weeks} selection={selection} onSelect={onSelect} theme={theme} reducedMotion={reducedMotion} />
              : (
                <CampusScene
                  buildings={campus.buildings}
                  districts={campus.districts}
                  theme={theme}
                  reducedMotion={reducedMotion}
                  litRisks={litRisks}
                  highlightPending={highlightPending}
                  selectedId={selectedBuilding}
                  onSelect={setSelectedBuilding}
                />
              )}
            <OrbitControls
              ref={controlsRef as never}
              makeDefault
              enableDamping
              autoRotate={autoRotate && !reducedMotion}
              autoRotateSpeed={0.6}
              minDistance={4}
              maxDistance={maxDistance}
              maxPolarAngle={Math.PI / 2.15}
            />
          </Canvas>
        )}
        {scene === 'campus' && academic.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />Carregando a estrutura acadêmica…
          </div>
        )}

        {/* Legend (top-left) and camera controls (top-right) float over the scene. */}
        {!showCampusEmpty && (
          <div className="pointer-events-none absolute left-3 top-3 max-w-[62%] rounded-lg border bg-background/85 px-3 py-2 text-xs backdrop-blur">
            {scene === 'volume' ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {PRIORITIES.map((p) => <span key={p} className="inline-flex items-center gap-1.5">{swatch(PRIORITY_HEX[p])}{PRIORITY_META[p].label}</span>)}
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">{swatch(VOLUME_LIT)}janela acesa = resolvida · apagada = em aberto</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {SCENE_RISKS.filter((r) => litRisks.has(r)).map((r) => <span key={r} className="inline-flex items-center gap-1.5">{swatch(RISK_HEX[r])}{RISK_LABEL[r]}</span>)}
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">{swatch(PROTECTED_WINDOW)}menos de {MIN_GROUP} alunos</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">{swatch(RISK_HEX.critical, true)}luz no telhado = Em Risco aguardando triagem</span>
              </div>
            )}
          </div>
        )}
        {!showCampusEmpty && (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border bg-background/85 px-2 py-1.5 backdrop-blur">
            <div className="flex items-center gap-2 px-1">
              <Switch id="auto-rotate" checked={autoRotate} onCheckedChange={setAutoRotate} disabled={reducedMotion} />
              <Label htmlFor="auto-rotate" className="text-xs font-normal">Girar</Label>
            </div>
            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => controlsRef.current?.reset()}>
              <RotateCcw className="h-3.5 w-3.5" />Recentralizar
            </Button>
          </div>
        )}
        {!showCampusEmpty && (
          <p className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-background/70 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
            <Orbit className="h-3 w-3" />
            {scene === 'volume'
              ? 'Arraste para girar · role para aproximar · clique num prédio para filtrar a página'
              : 'Arraste para girar · role para aproximar · clique num prédio para ver o resumo do curso'}
          </p>
        )}
      </div>

      {scene === 'volume' && selectionSummary && (
        <p className="text-sm"><span className="font-medium">Seleção</span> · {selectionSummary}</p>
      )}
      {scene === 'campus' && campusReady && (() => {
        const b = campus.buildings.find((x) => x.id === selectedBuilding);
        if (b) return <BuildingSummary b={b} />;
        return (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{realBuildings.length} {levelPlural}</span> no campus ·{' '}
            {campus.placed} alunos com turma{unplaced > 0 && <> · {unplaced} sem turma definida (prédio separado)</>}.
            {' '}A altura de cada prédio acompanha o número de alunos; as janelas mostram a proporção em cada nível de risco.
          </p>
        );
      })()}
    </div>
  );
}
