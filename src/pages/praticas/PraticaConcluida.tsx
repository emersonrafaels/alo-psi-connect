import { useEffect } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Share2, Sparkles } from "lucide-react";
import { usePratica } from "@/hooks/usePraticas";
import { toast } from "@/hooks/use-toast";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";

const PraticaConcluida = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const tenantSlug = getTenantSlugFromPath(location.pathname);
  const basePath = getBasePath(tenantSlug);
  const { data: pratica } = usePratica(slug);
  const segundos = Number(params.get("dur") || 0);
  const minutos = Math.max(1, Math.round(segundos / 60));

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Sessão concluída | Práticas";
  }, []);

  const compartilhar = async () => {
    const url = window.location.origin + `${basePath}/praticas/${slug}`;
    const texto = `Acabei uma prática de ${pratica?.titulo ?? "reequilíbrio"} na Rede Bem-Estar.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: pratica?.titulo, text: texto, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copiado", description: "Compartilhe com quem precisar." });
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="text-center mb-10">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
            <h1 className="font-serif text-5xl md:text-6xl text-primary font-bold mb-4 tracking-tight">
              Sessão Concluída
            </h1>
            <p className="text-muted-foreground text-lg">
              Você dedicou {minutos} minuto{minutos > 1 ? "s" : ""} ao seu equilíbrio.
            </p>
          </div>

          <Card className="p-6 md:p-8 mb-8">
            <h2 className="font-serif text-2xl text-primary mb-6">O que a ciência sugere</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Redução de cortisol:</strong> exercícios de foco atenuam a
                  resposta hormonal ao estresse em minutos.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Estabilidade cardíaca:</strong> a respiração ritmada regula
                  o sistema nervoso parassimpático.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Clareza mental:</strong> a oxigenação cerebral favorece a
                  tomada de decisões e o foco seletivo.
                </span>
              </li>
            </ul>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to={`${basePath}/praticas`}>Voltar para Práticas</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={compartilhar}>
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-10">
            A prática ajuda na autorregulação, mas não substitui apoio profissional.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PraticaConcluida;
