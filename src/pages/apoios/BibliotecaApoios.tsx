import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Sparkles,
  ShieldCheck,
  Wand2,
  Heart,
  ListChecks,
  History,
  ArrowRight,
  X,
} from "lucide-react";
import buddySvg from "@/assets/buddy.svg";
import { SupportCard } from "@/features/apoios/SupportCard";
import { SupportIcon } from "@/features/apoios/SupportIcon";
import {
  SUPPORT_ACCESS_TYPES,
  SUPPORT_CATEGORIES,
  SUPPORT_FORMATS,
  type SupportItem,
} from "@/features/apoios/types";
import { useStudentSupportLibrary, useSupportUserLists } from "@/hooks/useSupportLibrary";
import { getBasePath, getTenantSlugFromPath } from "@/utils/tenantHelpers";

type ViewTab = "all" | "platform" | "institution" | "favorites" | "plan" | "history";

const QUIZ = [
  {
    id: "need",
    question: "O que está mais pesado para você agora?",
    options: [
      { label: "Emoções e saúde mental", categories: ["Saúde emocional", "Práticas e conteúdos"] },
      { label: "Estudos e desempenho", categories: ["Vida acadêmica", "Carreira"] },
      { label: "Dinheiro, moradia ou alimentação", categories: ["Apoio material"] },
      { label: "Me sentir parte, acolhimento", categories: ["Pertencimento", "Acessibilidade", "Parentalidade"] },
    ],
  },
  {
    id: "format",
    question: "Como você prefere ser apoiado?",
    options: [
      { label: "Conversando com alguém", formats: ["Atendimento individual", "Orientação", "Mentoria"] },
      { label: "Em grupo, com outras pessoas", formats: ["Grupo"] },
      { label: "Sozinho, no meu ritmo", formats: ["Prática", "Conteúdo", "Trilha"] },
    ],
  },
  {
    id: "urgency",
    question: "Você precisa de algo agora ou pode agendar?",
    options: [
      { label: "Quero começar agora", access: ["Acesso imediato", "Acesso direto"] },
      { label: "Posso agendar", access: ["Agendamento", "Consultar instituição"] },
      { label: "Tanto faz", access: [] },
    ],
  },
] as const;

const BibliotecaApoios = () => {
  const location = useLocation();
  const basePath = getBasePath(getTenantSlugFromPath(location.pathname));
  const { items, institutionName, hasInstitution, isLoading } = useStudentSupportLibrary();
  const { favorites, planItems, history, isAuthenticated, toggle, registerVisit } =
    useSupportUserLists();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ViewTab>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [access, setAccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<SupportItem | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [quizResultKeys, setQuizResultKeys] = useState<string[] | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Biblioteca de Apoios | Rede Bem-Estar";
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (tab === "platform" && item.origin !== "platform") return false;
      if (tab === "institution" && item.origin !== "institution") return false;
      if (tab === "favorites" && !favorites.includes(item.key)) return false;
      if (tab === "plan" && !planItems.includes(item.key)) return false;
      if (tab === "history" && !history.includes(item.key)) return false;
      if (category && item.category !== category) return false;
      if (format && item.format !== format) return false;
      if (access && item.accessType !== access) return false;
      if (quizResultKeys && !quizResultKeys.includes(item.key)) return false;
      if (!term) return true;
      return [item.title, item.description, item.category, item.format, item.provider]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [items, tab, favorites, planItems, history, category, format, access, quizResultKeys, search]);

  const featured = useMemo(() => items.filter((i) => i.featured).slice(0, 3), [items]);

  const openDetails = (item: SupportItem) => {
    setSelected(item);
    if (isAuthenticated) registerVisit.mutate(item.key);
  };

  const runQuiz = (answers: Record<string, any>) => {
    const cats: string[] = answers.need?.categories ?? [];
    const fmts: string[] = answers.format?.formats ?? [];
    const accs: string[] = answers.urgency?.access ?? [];
    const scored = items
      .map((item) => {
        let score = 0;
        if (cats.includes(item.category)) score += 3;
        if (fmts.includes(item.format)) score += 2;
        if (accs.length === 0 || accs.includes(item.accessType)) score += 1;
        if (item.origin === "institution") score += 1;
        return { item, score };
      })
      .filter((s) => s.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    setQuizResultKeys(scored.map((s) => s.item.key));
    setTab("all");
    setCategory(null);
    setFormat(null);
    setAccess(null);
  };

  const clearFilters = () => {
    setCategory(null);
    setFormat(null);
    setAccess(null);
    setSearch("");
    setQuizResultKeys(null);
  };

  const hasFilters = !!(category || format || access || search || quizResultKeys);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Hero */}
        <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 md:p-10">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Novo na Rede Bem-Estar
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight max-w-2xl">
            Biblioteca de Apoios
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Todos os apoios disponíveis para você em um só lugar: os cuidados oferecidos pela
            plataforma e os apoios{" "}
            {hasInstitution ? `da ${institutionName}` : "da sua instituição, quando houver vínculo"}.
            Escolha o que faz sentido agora e monte o seu plano de apoio.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar apoio: ansiedade, moradia, carreira..."
                className="pl-9 h-11 bg-background"
                aria-label="Buscar apoio"
              />
            </div>
            <Button size="lg" onClick={() => { setQuizOpen(true); setQuizStep(0); setQuizAnswers({}); }}>
              <Wand2 className="h-4 w-4 mr-2" /> Encontrar meu apoio
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Seus favoritos, histórico e plano são privados. A instituição não vê o que você acessa.
          </p>
        </section>

        {/* Buddy */}
        <Card className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <img src={buddySvg} alt="Buddy" className="h-14 w-14 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">O Buddy sugere começar aqui</p>
            <p className="text-sm text-muted-foreground">
              {planItems.length > 0
                ? `Você já tem ${planItems.length} ${planItems.length === 1 ? "apoio" : "apoios"} no seu plano. Que tal retomar de onde parou?`
                : "Se estiver difícil escolher, responda três perguntas rápidas e eu mostro os apoios que combinam com o seu momento."}
            </p>
          </div>
          <div className="flex gap-2">
            {planItems.length > 0 ? (
              <Button variant="outline" onClick={() => setTab("plan")}>
                <ListChecks className="h-4 w-4 mr-2" /> Meu plano
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setQuizOpen(true); setQuizStep(0); setQuizAnswers({}); }}>
                Responder <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>

        {/* Destaques */}
        {featured.length > 0 && !hasFilters && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Em destaque para você</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((item) => (
                <button
                  key={item.key}
                  onClick={() => openDetails(item)}
                  className="text-left rounded-2xl border p-4 hover:bg-muted/40 transition-colors flex gap-3 items-start"
                >
                  <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <SupportIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="block text-xs text-muted-foreground line-clamp-2 mt-1">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Abas e filtros */}
        <section className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="platform">Plataforma</TabsTrigger>
              <TabsTrigger value="institution">
                {hasInstitution ? "Minha instituição" : "Instituição"}
              </TabsTrigger>
              <TabsTrigger value="favorites">
                <Heart className="h-3.5 w-3.5 mr-1" /> Favoritos
              </TabsTrigger>
              <TabsTrigger value="plan">
                <ListChecks className="h-3.5 w-3.5 mr-1" /> Meu plano
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-3.5 w-3.5 mr-1" /> Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2">
            {SUPPORT_CATEGORIES.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(category === c ? null : c)}
              >
                {c}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_FORMATS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={format === f ? "secondary" : "ghost"}
                className="text-xs"
                onClick={() => setFormat(format === f ? null : f)}
              >
                {f}
              </Button>
            ))}
            {SUPPORT_ACCESS_TYPES.map((a) => (
              <Button
                key={a}
                size="sm"
                variant={access === a ? "secondary" : "ghost"}
                className="text-xs"
                onClick={() => setAccess(access === a ? null : a)}
              >
                {a}
              </Button>
            ))}
            {hasFilters && (
              <Button size="sm" variant="link" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Limpar filtros
              </Button>
            )}
          </div>
        </section>

        {/* Resultados */}
        <section>
          <p className="text-sm text-muted-foreground mb-4">
            {isLoading ? "Carregando apoios..." : `${filtered.length} apoios encontrados`}
          </p>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <p className="font-semibold">Nada por aqui ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "institution" && !hasInstitution
                  ? "Sua conta ainda não está vinculada a uma instituição, então você vê apenas os apoios da plataforma."
                  : "Tente ajustar a busca ou limpar os filtros."}
              </p>
              {hasFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <SupportCard
                  key={item.key}
                  item={item}
                  isFavorite={favorites.includes(item.key)}
                  inPlan={planItems.includes(item.key)}
                  onOpen={() => openDetails(item)}
                  onToggleFavorite={() =>
                    toggle.mutate({
                      list: "favorites",
                      supportKey: item.key,
                      active: favorites.includes(item.key),
                    })
                  }
                  onTogglePlan={() =>
                    toggle.mutate({
                      list: "plan",
                      supportKey: item.key,
                      active: planItems.includes(item.key),
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                    <SupportIcon name={selected.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <Badge variant="secondary" className="text-[10px]">
                      {selected.originLabel}
                    </Badge>
                    <DialogTitle className="text-lg mt-1">{selected.title}</DialogTitle>
                  </div>
                </div>
                <DialogDescription className="pt-2 text-left">
                  {selected.details || selected.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {selected.howTo && (
                  <div>
                    <p className="font-semibold">Como acessar</p>
                    <p className="text-muted-foreground">{selected.howTo}</p>
                  </div>
                )}
                {selected.whenTo && (
                  <div>
                    <p className="font-semibold">Quando faz sentido</p>
                    <p className="text-muted-foreground">{selected.whenTo}</p>
                  </div>
                )}
                {selected.provider && (
                  <div>
                    <p className="font-semibold">Oferecido por</p>
                    <p className="text-muted-foreground">{selected.provider}</p>
                  </div>
                )}
                {selected.contactValue && (
                  <div>
                    <p className="font-semibold">Contato</p>
                    <p className="text-muted-foreground">
                      {selected.contactChannel ? `${selected.contactChannel}: ` : ""}
                      {selected.contactValue}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {[selected.category, selected.format, selected.accessType].map((t) => (
                    <span key={t} className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  {selected.ctaRoute ? (
                    isKnownRoute(selected.ctaRoute) ? (
                      <Button asChild className="flex-1">
                        <Link to={`${basePath}${selected.ctaRoute}`}>
                          {selected.ctaLabel || "Acessar apoio"}
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled className="flex-1" title="Página ainda não disponível">
                        Em breve
                      </Button>
                    )
                  ) : null}

                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      toggle.mutate({
                        list: "plan",
                        supportKey: selected.key,
                        active: planItems.includes(selected.key),
                      })
                    }
                  >
                    {planItems.includes(selected.key)
                      ? "Remover do meu plano"
                      : "Adicionar ao meu plano"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz */}
      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encontre o apoio que combina com você</DialogTitle>
            <DialogDescription>
              Pergunta {quizStep + 1} de {QUIZ.length}
            </DialogDescription>
          </DialogHeader>
          <p className="font-medium">{QUIZ[quizStep].question}</p>
          <div className="space-y-2">
            {QUIZ[quizStep].options.map((opt) => (
              <Button
                key={opt.label}
                variant="outline"
                className="w-full justify-start h-auto py-3 text-left whitespace-normal"
                onClick={() => {
                  const answers = { ...quizAnswers, [QUIZ[quizStep].id]: opt };
                  setQuizAnswers(answers);
                  if (quizStep < QUIZ.length - 1) {
                    setQuizStep(quizStep + 1);
                  } else {
                    runQuiz(answers);
                    setQuizOpen(false);
                  }
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BibliotecaApoios;
