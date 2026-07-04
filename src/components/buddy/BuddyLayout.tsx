import React, { useRef, useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import Header from "@/components/ui/header";
import { Heart, Sparkles, Compass, LineChart, TrendingUp, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

function DragScrollNav({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const state = useRef({ down: false, moved: false, startX: 0, startScroll: 0 });
  const [dragging, setDragging] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return; // native touch scroll
    const el = ref.current;
    if (!el) return;
    state.current = { down: true, moved: false, startX: e.clientX, startScroll: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!state.current.down) return;
    const el = ref.current;
    if (!el) return;
    const dx = e.clientX - state.current.startX;
    if (Math.abs(dx) > 4) {
      state.current.moved = true;
      setDragging(true);
    }
    el.scrollLeft = state.current.startScroll - dx;
  };
  const endDrag = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    state.current.down = false;
    setTimeout(() => setDragging(false), 0);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  };

  return (
    <>
      <nav
        ref={ref as any}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className={cn(
          "flex w-full max-w-full min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain px-2 min-[380px]:px-3 py-1 scroll-smooth touch-pan-x [scrollbar-width:thin]",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        {children}
      </nav>
      {(canLeft || canRight) && (
        <div className="mt-1 px-3 flex items-center justify-center gap-1" aria-hidden>
          <span className={cn("h-1 w-6 rounded-full transition-colors", canLeft ? "bg-primary/40" : "bg-border/60")} />
          <span className={cn("h-1 w-6 rounded-full transition-colors", canRight ? "bg-primary/40" : "bg-border/60")} />
        </div>
      )}
    </>
  );
}


const nav = [
  { to: "/buddy", label: "Início", shortLabel: "Início", icon: Heart, end: true },
  { to: "/buddy/me-conhecer", label: "Meu retrato", shortLabel: "Retrato", icon: Sparkles },
  { to: "/buddy/como-te-conhece", label: "Como te conhece", shortLabel: "Conhece", icon: Compass },
  { to: "/buddy/padroes", label: "Padrões", shortLabel: "Padrões", icon: LineChart },
  { to: "/buddy/jornada", label: "Minha jornada", shortLabel: "Jornada", icon: TrendingUp },
  { to: "/buddy/pontos-de-forca", label: "Pontos de força", shortLabel: "Forças", icon: Shield },
  { to: "/buddy/privacidade", label: "Privacidade", shortLabel: "Privacidade", icon: Lock },
];

export function BuddyLayout({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="min-h-screen w-full max-w-full bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <Header />
      <div className="w-full max-w-7xl min-w-0 mx-auto px-2 min-[380px]:px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8 grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 max-w-full lg:sticky lg:top-24 self-start -mx-2 min-[380px]:-mx-3 sm:mx-0">
          {/* Mobile/Tablet: horizontal scroll with drag support and visible scrollbar */}
          <div className="relative lg:hidden">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10"
              aria-hidden
            />
            <DragScrollNav>
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors border select-none",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border/60 hover:bg-primary/10 hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </DragScrollNav>
          </div>

          {/* Desktop: sticky vertical sidebar */}
          <nav className="hidden lg:flex rounded-2xl bg-card border border-border/60 p-2 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 max-w-full w-full pb-20 sm:pb-0">
          <header className="mb-4 sm:mb-6 min-w-0 max-w-full">
            <h1 className="max-w-full whitespace-normal text-lg min-[380px]:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight [overflow-wrap:anywhere] hyphens-auto">{title}</h1>
            {description && <p className="mt-2 max-w-full sm:max-w-2xl text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed [overflow-wrap:anywhere]">{description}</p>}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
