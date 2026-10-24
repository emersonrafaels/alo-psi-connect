import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Edges, Html, Instance, Instances } from '@react-three/drei';
import { CanvasTexture, SRGBColorSpace, type Group } from 'three';
import { OVERLAY_Z, jitter } from './sceneData';
import type { campusColors } from './campusData';
import type { SceneTheme } from './useSceneTheme';

/** Text label pinned to a point in the scene (DOM, so it stays crisp and themed). */
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

/**
 * Facade texture: a grid of windows drawn on a canvas, ground floor at the bottom. `windows` lists one
 * CSS colour per window (null = unlit glass), row by row from the ground up.
 */
function useFacadeTexture(windows: (string | null)[], rows: number, cols: number, base: string, glass: string) {
  const texture = useMemo(() => {
    const cw = 32, ch = 40;
    const canvas = document.createElement('canvas');
    canvas.width = cols * cw;
    canvas.height = rows * ch;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    windows.forEach((color, i) => {
      const row = Math.floor(i / cols), col = i % cols;
      ctx.fillStyle = color ?? glass;
      ctx.globalAlpha = color ? 1 : 0.55;
      ctx.fillRect(col * cw + 6, (rows - 1 - row) * ch + 8, cw - 12, ch - 16);
    });
    ctx.globalAlpha = 1;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [windows, rows, cols, base, glass]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Grows its children from the ground when first shown; static with reduced motion. */
export function Grow({ delay = 0, reducedMotion, children, position }: { delay?: number; reducedMotion: boolean; children: ReactNode; position: [number, number, number] }) {
  const ref = useRef<Group>(null);
  const progress = useRef(reducedMotion ? 1 : -delay);
  useFrame((_, dt) => {
    if (!ref.current || progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + dt * 1.6);
    ref.current.scale.y = Math.max(0.001, easeOut(Math.max(0, progress.current)));
  });
  return <group ref={ref} position={position} scale={[1, reducedMotion ? 1 : 0.001, 1]}>{children}</group>;
}

interface BuildingProps {
  width: number;
  depth: number;
  height: number;
  rows: number;
  cols: number;
  windows: (string | null)[];
  base: string;
  roof: string;
  glass: string;
  dimmed?: boolean;
  highlighted?: boolean;
  selected?: boolean;
  outline: string;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  children?: ReactNode;
}

/** A box building whose four facades share one window texture; children sit on the roof. */
export function Building({ width, depth, height, rows, cols, windows, base, roof, glass, dimmed, highlighted, selected, outline, onPointerOver, onPointerOut, onClick, children }: BuildingProps) {
  const facade = useFacadeTexture(windows, rows, cols, base, glass);
  const opacity = dimmed ? 0.25 : 1;
  const emissive = highlighted ? 0.18 : 0;
  return (
    <group>
      <mesh position={[0, height / 2, 0]} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onClick={onClick}>
        <boxGeometry args={[width, height, depth]} />
        {/* Material slots: +x, -x, +y (roof), -y, +z, -z */}
        <meshStandardMaterial attach="material-0" map={facade} transparent opacity={opacity} roughness={0.8} emissive="#ffffff" emissiveIntensity={emissive} emissiveMap={facade} />
        <meshStandardMaterial attach="material-1" map={facade} transparent opacity={opacity} roughness={0.8} emissive="#ffffff" emissiveIntensity={emissive} emissiveMap={facade} />
        <meshStandardMaterial attach="material-2" color={roof} transparent opacity={opacity} roughness={0.9} />
        <meshStandardMaterial attach="material-3" color={roof} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-4" map={facade} transparent opacity={opacity} roughness={0.8} emissive="#ffffff" emissiveIntensity={emissive} emissiveMap={facade} />
        <meshStandardMaterial attach="material-5" map={facade} transparent opacity={opacity} roughness={0.8} emissive="#ffffff" emissiveIntensity={emissive} emissiveMap={facade} />
        {selected && <Edges color={outline} scale={1.04} threshold={15} />}
      </mesh>
      {/* Roof parapet */}
      <mesh position={[0, height + 0.04, 0]}>
        <boxGeometry args={[width * 0.92, 0.08, depth * 0.92]} />
        <meshStandardMaterial color={roof} transparent opacity={opacity} />
      </mesh>
      <group position={[0, height + 0.08, 0]}>{children}</group>
    </group>
  );
}

/** Lawn with a path border; size in scene units. */
export function Lawn({ width, depth, colors }: { width: number; depth: number; colors: ReturnType<typeof campusColors> }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.03}>
        <planeGeometry args={[width + 2.4, depth + 2.4]} />
        <meshStandardMaterial color={colors.path} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
        <planeGeometry args={[width + 1.6, depth + 1.6]} />
        <meshStandardMaterial color={colors.lawn} />
      </mesh>
    </group>
  );
}

/** Straight path strip lying on the lawn. */
export function Path({ x, z, width, depth, colors }: { x: number; z: number; width: number; depth: number; colors: ReturnType<typeof campusColors> }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[x, -0.01, z]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={colors.path} />
    </mesh>
  );
}

/** Decorative trees along the lawn border, placed deterministically so they do not move between renders. */
export function Trees({ width, depth, colors, density = 1 }: { width: number; depth: number; colors: ReturnType<typeof campusColors>; density?: number }) {
  const trees = useMemo(() => {
    const out: { p: [number, number, number]; s: number }[] = [];
    const hw = width / 2 + 0.5, hd = depth / 2 + 0.5;
    const step = 1.6 / density;
    for (let x = -hw; x <= hw; x += step) {
      out.push({ p: [x + jitter(`x${x}`, 1, 0.3), 0, -hd + jitter(`a${x}`, 2, 0.2)], s: 0.8 + Math.abs(jitter(`s${x}`, 3, 0.3)) });
      out.push({ p: [x + jitter(`y${x}`, 4, 0.3), 0, hd + jitter(`b${x}`, 5, 0.2)], s: 0.8 + Math.abs(jitter(`t${x}`, 6, 0.3)) });
    }
    for (let z = -hd + step; z < hd; z += step) {
      out.push({ p: [-hw + jitter(`c${z}`, 7, 0.2), 0, z], s: 0.8 + Math.abs(jitter(`u${z}`, 8, 0.3)) });
      out.push({ p: [hw + jitter(`d${z}`, 9, 0.2), 0, z], s: 0.8 + Math.abs(jitter(`v${z}`, 10, 0.3)) });
    }
    return out;
  }, [width, depth, density]);

  return (
    <group>
      <Instances limit={trees.length} range={trees.length}>
        <cylinderGeometry args={[0.05, 0.07, 0.4, 6]} />
        <meshStandardMaterial color={colors.trunk} />
        {trees.map((t, i) => <Instance key={i} position={[t.p[0], 0.2 * t.s, t.p[2]]} scale={t.s} />)}
      </Instances>
      <Instances limit={trees.length} range={trees.length}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={colors.crown} roughness={0.9} flatShading />
        {trees.map((t, i) => <Instance key={i} position={[t.p[0], 0.55 * t.s, t.p[2]]} scale={t.s} />)}
      </Instances>
    </group>
  );
}
