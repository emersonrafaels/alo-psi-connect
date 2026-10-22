import { useIsFetching } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Indeterminate progress bar used for all data loading states. */
export function LoadingBar({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("w-full", className)} role="progressbar" aria-busy="true" aria-label={label ?? "Carregando"}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-primary animate-loading-bar motion-reduce:animate-pulse motion-reduce:w-full" />
      </div>
      {label && <p className="mt-2 text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}

/** Section placeholder: bar + short message. */
export function LoadingSection({ label = "Carregando dados...", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <LoadingBar label={label} />
    </div>
  );
}

/** Grid of number cards while their values load. */
export function LoadingCards({ count = 4, labels, className }: { count?: number; labels?: string[]; className?: string }) {
  return (
    <div className={cn("grid gap-3 grid-cols-2 md:grid-cols-4", className)}>
      {Array.from({ length: labels?.length ?? count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">{labels?.[i] ?? "Carregando"}</p>
          <LoadingBar />
        </div>
      ))}
    </div>
  );
}

/** Thin top-of-page bar while any portal query is fetching. */
export function PortalTopLoadingBar() {
  const { pathname } = useLocation();
  const fetching = useIsFetching();
  if (!pathname.includes("portal-institucional") || fetching === 0) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-muted" role="progressbar" aria-busy="true" aria-label="Carregando dados">
      <div className="absolute inset-y-0 left-0 w-2/5 bg-primary animate-loading-bar motion-reduce:animate-pulse motion-reduce:w-full" />
    </div>
  );
}
