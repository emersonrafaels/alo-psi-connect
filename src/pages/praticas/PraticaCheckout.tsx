import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Zap, Wind, Brain, Minus, X,
} from "lucide-react";
import { usePratica } from "@/hooks/usePraticas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";

type Estado = "calmo" | "energizado" | "leve" | "reflexivo" | "igual";

const ESTADOS: { id: Estado; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "calmo", label: "Calmo", Icon: Sparkles },
  { id: "energizado", label: "Energizado", Icon: Zap },
  { id: "leve", label: "Leve", Icon: Wind },
  { id: "reflexivo", label: "Reflexivo", Icon: Brain },
  { id: "igual", label: "Igual", Icon: Minus },
];

const PraticaCheckout = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantSlug = getTenantSlugFromPath(location.pathname);
  const basePath = getBasePath(tenantSlug);
  const { data: pratica } = usePratica(slug);
  const dur = Number(params.get("dur") || 0);

  const [estado, setEstado] = useState<Estado | null>(null);
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Check-out emocional | Práticas";
  }, []);

  const irParaConcluida = () =>
    navigate(`${basePath}/praticas/${slug}/concluida?dur=${dur}`);

  const concluir = async () => {
    if (!estado || !pratica) return;
    setSaving(true);
    const { error } = await supabase.from("praticas_checkouts").insert({
      pratica_id: pratica.id,
      user_id: user?.id ?? null,
      estado,
      nota: nota.trim() || null,
      duracao_segundos: dur || null,
    });
    setSaving(false);
    if (error) {
      toast({
        title: "Não foi possível registrar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    irParaConcluida();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={irParaConcluida}
              aria-label="Pular"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl md:text-5xl text-primary leading-tight mb-4">
              Como você se sente agora?
            </h1>
            <p className="text-muted-foreground">
              Reserve um momento para acolher suas sensações pós-prática.
            </p>
          </div>

          <Card className="p-6 md:p-8">
            <p className="text-sm font-medium mb-4 text-muted-foreground">
              Selecione seu estado
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              {ESTADOS.map(({ id, label, Icon }) => {
                const active = estado === id;
                return (
                  <button
                    key={id}
                    onClick={() => setEstado(id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary scale-[1.02] shadow"
                        : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>

            <label className="block text-sm font-medium mb-2">
              Alguma percepção que queira registrar? (opcional)
            </label>
            <Textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Anote o que percebeu..."
              rows={4}
              className="mb-6"
            />

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="ghost" onClick={irParaConcluida} disabled={saving}>
                Pular por enquanto
              </Button>
              <Button onClick={concluir} disabled={!estado || saving}>
                {saving ? "Salvando..." : "Concluir e ver resumo"}
              </Button>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PraticaCheckout;
