import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { usePraticas, usePraticasAtalhos } from "@/hooks/usePraticas";
import { PraticaCard } from "@/components/praticas/PraticaCard";
import { getTenantSlugFromPath, getBasePath } from "@/utils/tenantHelpers";

const PraticasIndex = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = getTenantSlugFromPath(location.pathname);
  const basePath = getBasePath(tenantSlug);
  const { data, isLoading } = usePraticas();
  const { data: atalhos } = usePraticasAtalhos();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Práticas para Reequilíbrio Emocional | Rede Bem-Estar";
  }, []);

  const grupos = useMemo(() => data?.grupos ?? [], [data]);
  const praticas = useMemo(() => data?.praticas ?? [], [data]);
  const praticasPorGrupo = useMemo(() => {
    const map: Record<string, typeof praticas> = {};
    for (const p of praticas) {
      if (!p.grupo_id) continue;
      (map[p.grupo_id] ||= []).push(p);
    }
    return map;
  }, [praticas]);


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
          <div className="container relative mx-auto px-4 py-20 md:py-28 max-w-5xl text-center">
            <Badge variant="secondary" className="mb-6 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Práticas guiadas
            </Badge>
            <h1 className="font-serif text-5xl md:text-7xl text-primary leading-[1.05] tracking-tight mb-6">
              Práticas para Reequilíbrio Emocional
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Um santuário de exercícios guiados, desenhados para devolver a clareza e
              dissolver o estresse através da ciência e do sentir.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                onClick={() =>
                  document
                    .getElementById("grupos")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explorar práticas
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("atalhos")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Encontrar o que preciso agora
              </Button>
            </div>
          </div>
        </section>

        {/* ATALHOS — exibidos como tags informativas/clicáveis */}
        {atalhos && atalhos.length > 0 && (
          <section id="atalhos" className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                Comece por aqui
              </p>
              <h2 className="font-serif text-3xl text-foreground">
                Sinta a pausa. Respire.
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {atalhos.map((a) => {
                const content = (
                  <>
                    <span className="text-primary/70 mr-1">#</span>
                    {a.texto}
                  </>
                );
                const className =
                  "inline-flex items-center px-3 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-primary/90 text-xs font-medium tracking-wide";
                return a.pratica_slug ? (
                  <Link
                    key={a.id}
                    to={`${basePath}/praticas/${a.pratica_slug}`}
                    className={`${className} hover:bg-primary/10 transition-colors`}
                  >
                    {content}
                  </Link>
                ) : (
                  <span key={a.id} className={className}>{content}</span>
                );
              })}
            </div>
          </section>
        )}

        {/* GRUPOS */}
        <section id="grupos" className="container mx-auto px-4 py-16 max-w-6xl space-y-16">
          {isLoading &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-40" />
                  <Skeleton className="h-40" />
                </div>
              </div>
            ))}

          {grupos.map((grupo) => {
            const items = praticasPorGrupo[grupo.id] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={grupo.id}>
                <div className="mb-6 max-w-2xl">
                  <h2 className="font-serif text-3xl md:text-4xl text-primary mb-2">
                    {grupo.nome}
                  </h2>
                  {grupo.descricao && (
                    <p className="text-muted-foreground">{grupo.descricao}</p>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((p) => (
                    <PraticaCard key={p.id} pratica={p} basePath={basePath} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* CURADORIA */}
        <section className="bg-muted/40 py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl text-primary mb-4">
              Como escolhemos estas práticas
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Cada exercício é curado por nossa equipe clínica, fundamentado em
              neurociência e psicologia comportamental. Não oferecemos apenas
              meditação; entregamos ferramentas de regulação biológica que agem na
              raiz da resposta ao estresse.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 max-w-4xl">
          <Card className="p-10 md:p-14 text-center bg-primary text-primary-foreground border-0">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Você não precisa lidar com tudo sozinha
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
              Às vezes, a maior prática é reconhecer quando precisamos de um apoio
              extra. Estamos aqui para cada passo do seu caminho.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to={`${basePath}/profissionais`}>
                  Buscar apoio
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link to={`${basePath}/sobre`}>Entender caminhos de cuidado</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PraticasIndex;
