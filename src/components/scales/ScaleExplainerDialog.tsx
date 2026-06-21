import { useState, useEffect } from "react";
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

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMaximized(false);
    }
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden transition-all duration-200",
          maximized ? "max-w-[95vw] w-[95vw] h-[95vh]" : "max-w-3xl",
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
            className={cn(
              "relative rounded-xl overflow-hidden bg-muted/40 border w-full",
              maximized && "h-full flex items-center justify-center",
            )}
          >
            {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
            <img
              src={imageUrl}
              alt={`Explicação: ${title}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              onClick={() => setMaximized((m) => !m)}
              className={cn(
                "w-full object-contain bg-background transition-all duration-200",
                maximized ? "max-h-[82vh] cursor-zoom-out" : "max-h-[70vh] cursor-zoom-in",
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
