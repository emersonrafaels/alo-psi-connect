import React from "react";
import { NavLink } from "react-router-dom";
import Header from "@/components/ui/header";
import { Heart, Sparkles, Compass, LineChart, TrendingUp, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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
          {/* Mobile: horizontal scroll with edge fade */}
          <div className="relative lg:hidden">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10"
              aria-hidden
            />
            <nav
              className="flex w-full max-w-full min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory px-2 min-[380px]:px-3 py-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border/60 hover:bg-primary/10 hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.shortLabel}</span>
                </NavLink>
              ))}
            </nav>
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
