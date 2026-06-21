import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScaleExplainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const DRAG_THRESHOLD = 5;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

export function ScaleExplainerDialog({
  open,
  onOpenChange,
  imageUrl,
  title,
  description,
  ctaLabel,
  onCta,
}: ScaleExplainerDialogProps) {
  const [loaded, setLoaded] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setMaximized(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [open]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [maximized]);

  const clampPan = useCallback((x: number, y: number, z: number = zoom) => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return { x, y };
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const iw = img.offsetWidth * z;
    const ih = img.offsetHeight * z;
    const maxX = Math.max(0, (iw - cw) / 2);
    const maxY = Math.max(0, (ih - ch) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, [zoom]);

  const applyZoom = useCallback((next: number) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 100) / 100));
    setZoom(clamped);
    setPan((p) => clampPan(p.x, p.y, clamped));
  }, [clampPan]);

  const zoomIn = useCallback(() => applyZoom(zoom + ZOOM_STEP), [zoom, applyZoom]);
  const zoomOut = useCallback(() => applyZoom(zoom - ZOOM_STEP), [zoom, applyZoom]);
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Keyboard: Esc minimiza primeiro; +/-/0 controlam zoom
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && maximized) {
        e.stopPropagation();
        e.preventDefault();
        setMaximized(false);
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        applyZoom(zoom + ZOOM_STEP);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        applyZoom(zoom - ZOOM_STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, maximized, zoom, applyZoom, resetZoom]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      applyZoom(zoom + delta);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, zoom, applyZoom]);

  const canPan = zoom > 1;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || !canPan) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      state.moved = true;
    }
    if (state.moved) {
      setPan(clampPan(state.originX + dx, state.originY + dy));
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
    const moved = state.moved;
    dragStateRef.current = null;
    setIsDragging(false);
    if (!moved && !canPan) {
      setMaximized((m) => !m);
    }
  };

  const onImageClickWhenIdle = () => {
    if (!canPan) setMaximized((m) => !m);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden transition-all duration-200",
          maximized ? "max-w-[95vw] w-[95vw] h-[95vh] !flex flex-col gap-0" : "max-w-3xl",
        )}
      >
        <DialogHeader className="px-6 pt-6 pr-16">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
            <button
              type="button"
              onClick={() => setMaximized((m) => !m)}
              className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={maximized ? "Restaurar tamanho" : "Maximizar"}
              title={maximized ? "Restaurar" : "Maximizar"}
            >
              {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </DialogHeader>
        <div className={cn("px-6 pb-2", maximized && "flex-1 min-h-0 flex")}>
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={cn(
              "relative rounded-xl overflow-hidden bg-muted/40 border w-full select-none touch-none",
              maximized ? "h-full flex items-center justify-center" : "flex items-center justify-center",
              canPan && (isDragging ? "cursor-grabbing" : "cursor-grab"),
            )}
          >
            {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
            <img
              ref={imgRef}
              src={imageUrl}
              alt={`Explicação: ${title}`}
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => setLoaded(true)}
              onClick={canPan ? undefined : onImageClickWhenIdle}
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 150ms ease-out",
              }}
              className={cn(
                "object-contain bg-background pointer-events-none",
                maximized
                  ? "max-w-none max-h-none h-auto w-auto"
                  : "max-w-full max-h-[70vh]",
                !canPan && "cursor-zoom-in",
              )}
            />

            {/* Zoom controls */}
            {loaded && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full border bg-background/90 backdrop-blur px-2 py-1 shadow-md"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={zoomOut}
                  disabled={zoom <= ZOOM_MIN}
                  aria-label="Diminuir zoom"
                  title="Diminuir zoom (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="w-28 sm:w-36 px-1">
                  <Slider
                    value={[zoom]}
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step={ZOOM_STEP}
                    onValueChange={(v) => applyZoom(v[0] ?? 1)}
                    aria-label="Nível de zoom"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={zoomIn}
                  disabled={zoom >= ZOOM_MAX}
                  aria-label="Aumentar zoom"
                  title="Aumentar zoom (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground min-w-[3ch] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={resetZoom}
                  disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                  aria-label="Restaurar zoom"
                  title="Restaurar (0)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 pt-2 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {ctaLabel && onCta && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onCta();
              }}
            >
              {ctaLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
