import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize2, Minimize2 } from "lucide-react";
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

const DRAG_THRESHOLD = 5; // px before a pointer move counts as a drag (not a click)

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

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMaximized(false);
      setPan({ x: 0, y: 0 });
    }
  }, [open]);

  // Reset pan when toggling maximize
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [maximized]);

  // Esc handling: when maximized, first Esc just minimizes
  useEffect(() => {
    if (!open || !maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setMaximized(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, maximized]);

  const clampPan = useCallback((x: number, y: number) => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return { x, y };
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const iw = img.offsetWidth;
    const ih = img.offsetHeight;
    const maxX = Math.max(0, (iw - cw) / 2);
    const maxY = Math.max(0, (ih - ch) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!maximized) return;
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
    if (!state || !maximized) return;
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
    // If it was a click (no drag), toggle maximize
    if (!moved) {
      setMaximized((m) => !m);
    }
  };

  const onImageClickNotMaximized = () => {
    if (!maximized) setMaximized(true);
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
              maximized && "h-full flex items-center justify-center",
              maximized && (isDragging ? "cursor-grabbing" : "cursor-grab"),
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
              onClick={maximized ? undefined : onImageClickNotMaximized}
              style={
                maximized
                  ? { transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }
                  : undefined
              }
              className={cn(
                "object-contain bg-background transition-[max-height,max-width] duration-200 pointer-events-none",
                maximized
                  ? "max-w-none max-h-none h-auto w-auto min-h-[140%] min-w-[140%]"
                  : "w-full max-h-[70vh] cursor-zoom-in",
              )}
            />
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
