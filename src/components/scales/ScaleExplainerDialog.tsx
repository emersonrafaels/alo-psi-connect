import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="px-6 pb-2">
          <div className="relative rounded-xl overflow-hidden bg-muted/40 border">
            {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
            <img
              src={imageUrl}
              alt={`Explicação: ${title}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className="w-full max-h-[70vh] object-contain bg-background"
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
