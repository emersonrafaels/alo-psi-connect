import React from "react";
import { NavLink } from "react-router-dom";
import Header from "@/components/ui/header";
import { Heart, Sparkles, Compass, LineChart, TrendingUp, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/buddy", label: "Início", icon: Heart, end: true },
  { to: "/buddy/me-conhecer", label: "Meu retrato", icon: Sparkles },
  { to: "/buddy/como-te-conhece", label: "Como te conhece", icon: Compass },
  { to: "/buddy/padroes", label: "Padrões", icon: LineChart },
  { to: "/buddy/jornada", label: "Minha jornada", icon: TrendingUp },
  { to: "/buddy/pontos-de-forca", label: "Pontos de força", icon: Shield },
  { to: "/buddy/privacidade", label: "Privacidade", icon: Shield },
];

export function BuddyLayout({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 self-start">
          <nav className="rounded-2xl bg-card border border-border/60 p-2 flex lg:flex-col gap-1 overflow-x-auto">
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
        <main className="min-w-0">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
