import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Pencil,
  Sparkles,
  Plus,
  Star,
  Heart,
  Eye,
  LayoutGrid,
  X,
  Info,
  ClipboardCheck,
} from "lucide-react";
import { SupportIcon, SUPPORT_ICON_OPTIONS } from "@/features/apoios/SupportIcon";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_FORMATS,
  SUPPORT_ACCESS_TYPES,
  type SupportCatalogRow,
} from "@/features/apoios/types";
import { useSupportCatalog } from "@/hooks/useSupportLibrary";
import {
  useAdminInstitutionPlan,
  useAdminSupportCatalogMutations,
  useSupportInstitutions,
  useSupportUsageMetrics,
} from "@/hooks/useAdminSupportPlan";

const ALL = "__all__";

type Draft = Partial<SupportCatalogRow>;

const emptyDraft: Draft = {
  title: "",
  description: "",
  details: "",
  how_to: "",
  when_to: "",
  origin_type: "platform",
  category: SUPPORT_CATEGORIES[0],
  format: SUPPORT_FORMATS[0],
  access_type: SUPPORT_ACCESS_TYPES[0],
  icon: "HeartHandshake",
  provider: "",
  cta_label: "",
  cta_route: "",
  featured: false,
  is_active: true,
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

const SupportLibraryAdmin = () => {
  const { data: catalog = [], isLoading } = useSupportCatalog(true);
  const { updateCatalog, createCatalog } = useAdminSupportCatalogMutations();
  const { data: institutions = [] } = useSupportInstitutions();
  const { data: usage } = useSupportUsageMetrics();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [institutionId, setInstitutionId] = useState<string>("");

  const [originFilter, setOriginFilter] = useState(ALL);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [formatFilter, setFormatFilter] = useState(ALL);
  const [accessFilter, setAccessFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const hasFilters =
    !!search ||
    originFilter !== ALL ||
    categoryFilter !== ALL ||
    formatFilter !== ALL ||
    accessFilter !== ALL ||
    statusFilter !== ALL ||
    onlyFeatured;

  const clearFilters = () => {
    setSearch("");
    setOriginFilter(ALL);
    setCategoryFilter(ALL);
    setFormatFilter(ALL);
    setAccessFilter(ALL);
    setStatusFilter(ALL);
    setOnlyFeatured(false);
  };

  const { excludedIds, allowedCategories, setIncluded, setAllowedCategories } =
    useAdminInstitutionPlan(institutionId || undefined);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.filter((c) => {
      if (
        term &&
        ![c.title, c.category, c.format, c.provider]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      )
        return false;
      if (originFilter !== ALL && c.origin_type !== originFilter) return false;
      if (categoryFilter !== ALL && c.category !== categoryFilter) return false;
      if (formatFilter !== ALL && c.format !== formatFilter) return false;
      if (accessFilter !== ALL && c.access_type !== accessFilter) return false;
      if (statusFilter === "active" && !c.is_active) return false;
      if (statusFilter === "inactive" && c.is_active) return false;
      if (onlyFeatured && !c.featured) return false;
      return true;
    });
  }, [catalog, search, originFilter, categoryFilter, formatFilter, accessFilter, statusFilter, onlyFeatured]);

  const metrics = useMemo(() => {
    const favOf = (id: string) => usage?.favorites.get(`catalog:${id}`) || 0;
    const visOf = (id: string) => usage?.visits.get(`catalog:${id}`) || 0;
    const planOf = (id: string) => usage?.planItems.get(`catalog:${id}`) || 0;
    const topBy = (fn: (id: string) => number) =>
      [...catalog]
        .map((c) => ({ title: c.title, total: fn(c.id) }))
        .filter((r) => r.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    return {
      favOf,
      visOf,
      planOf,
      total: catalog.length,
      active: catalog.filter((c) => c.is_active).length,
      featured: catalog.filter((c) => c.featured).length,
      totalFavorites: usage?.totalFavorites || 0,
      totalVisits: usage?.totalVisits || 0,
      totalPlanItems: usage?.totalPlanItems || 0,
      topFavorites: topBy(favOf),
      topVisits: topBy(visOf),
      topPlan: topBy(planOf),
    };
  }, [catalog, usage]);

  const saveDraft = () => {
    if (!editing?.title?.trim()) return;
    if (isCreating) {
      createCatalog.mutate({
        ...editing,
        slug: slugify(editing.title || "") || `apoio-${Date.now()}`,
        sort_order: catalog.length + 1,
      });
    } else {
      const { id, ...values } = editing as SupportCatalogRow;
      updateCatalog.mutate({ id, values });
    }
    setEditing(null);
    setIsCreating(false);
  };


  const platformSupports = useMemo(
    () => catalog.filter((c) => c.origin_type === "platform"),
    [catalog]
  );
  const institutionModels = useMemo(
    () => catalog.filter((c) => c.origin_type === "institution"),
    [catalog]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Biblioteca de Apoios
          </h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de apoios e defina o que cada instituição tem disponível no plano dela.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditing({ ...emptyDraft });
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo apoio
        </Button>
      </div>


      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catálogo ({catalog.length})</TabsTrigger>
          <TabsTrigger value="plans">Plano por instituição</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4 pt-4">
          <TooltipProvider delayDuration={150}>
            <p className="text-xs text-muted-foreground">
              Os números abaixo são totais agregados e não identificam alunos. Cada aluno conta uma
              vez por apoio em cada indicador.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Apoios no catálogo",
                  value: metrics.total,
                  hint: `${metrics.active} ativos`,
                  icon: LayoutGrid,
                  info: "Quantidade de apoios cadastrados na biblioteca, somando plataforma e modelos institucionais.",
                },
                {
                  label: "Em destaque",
                  value: metrics.featured,
                  hint: "Aparecem no topo para o aluno",
                  icon: Star,
                  info: "Apoios marcados como destaque, que aparecem primeiro na biblioteca do aluno.",
                },
                {
                  label: "Favoritos dos alunos",
                  value: metrics.totalFavorites,
                  hint: "Salvos para consultar depois",
                  icon: Heart,
                  info: "Quantos alunos salvaram apoios como favoritos para voltar depois.",
                },
                {
                  label: "Apoios acessados",
                  value: metrics.totalVisits,
                  hint: "Alunos que abriram o apoio",
                  icon: Eye,
                  info: "Quantas vezes um aluno abriu os detalhes de um apoio na biblioteca. Mede alcance e interesse.",
                },
                {
                  label: "Apoios usados",
                  value: metrics.totalPlanItems,
                  hint: "Incluídos no plano de apoio",
                  icon: ClipboardCheck,
                  info: "Quantas vezes um aluno incluiu um apoio no plano de apoio dele, indicando que pretende usar de fato. Mede adoção.",
                },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {m.label}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`O que significa ${m.label}`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px] text-xs">
                            {m.info}
                          </TooltipContent>
                        </Tooltip>
                      </p>
                      <m.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{m.value}</p>
                    <p className="text-[11px] text-muted-foreground">{m.hint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TooltipProvider>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { title: "Mais favoritados", rows: metrics.topFavorites },
              { title: "Mais acessados", rows: metrics.topVisits },
              { title: "Mais usados (no plano)", rows: metrics.topPlan },
            ].map((block) => (
              <Card key={block.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{block.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {block.rows.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Ainda sem registros.</p>
                  ) : (
                    block.rows.map((r) => (
                      <div key={r.title} className="flex items-center justify-between text-sm">
                        <span className="truncate">{r.title}</span>
                        <span className="font-semibold tabular-nums">{r.total}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar no catálogo"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas as origens</SelectItem>
                  <SelectItem value="platform">Plataforma</SelectItem>
                  <SelectItem value="institution">Modelo institucional</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas as categorias</SelectItem>
                  {SUPPORT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos os formatos</SelectItem>
                  {SUPPORT_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={accessFilter} onValueChange={setAccessFilter}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos os acessos</SelectItem>
                  {SUPPORT_ACCESS_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Ativos e inativos</SelectItem>
                  <SelectItem value="active">Somente ativos</SelectItem>
                  <SelectItem value="inactive">Somente inativos</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={onlyFeatured ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyFeatured((v) => !v)}
              >
                <Star className="h-4 w-4 mr-2" /> Só destaques
              </Button>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" /> Limpar filtros
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {filtered.length} de {catalog.length} apoios
            </p>
          </div>


          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex gap-3 items-start">
                    <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                      <SupportIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.origin_type === "platform" ? "Plataforma" : "Modelo institucional"}
                        </Badge>
                        {item.featured && <Badge className="text-[10px]">Destaque</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {item.category} · {item.format} · {item.access_type}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {metrics.favOf(item.id)} favoritos
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {metrics.visOf(item.id)} acessos
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" /> {metrics.planOf(item.id)} no plano
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(v) =>
                          updateCatalog.mutate({ id: item.id, values: { is_active: v } })
                        }
                        aria-label="Ativo"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsCreating(false);
                          setEditing(item);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instituição</CardTitle>
              <CardDescription>
                Escolha a instituição para definir os apoios da plataforma incluídos no plano e as
                categorias liberadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={institutionId} onValueChange={setInstitutionId}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {institutionId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Categorias liberadas</CardTitle>
                  <CardDescription>
                    Categorias que a instituição pode usar ao cadastrar apoios próprios. Sem seleção,
                    todas ficam liberadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {SUPPORT_CATEGORIES.map((c) => {
                    const active = allowedCategories.includes(c);
                    return (
                      <Button
                        key={c}
                        size="sm"
                        variant={active ? "default" : "outline"}
                        onClick={() =>
                          setAllowedCategories.mutate(
                            active
                              ? allowedCategories.filter((x) => x !== c)
                              : [...allowedCategories, c]
                          )
                        }
                      >
                        {c}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Apoios da plataforma no plano ({platformSupports.length - excludedIds.size}/
                    {platformSupports.length})
                  </CardTitle>
                  <CardDescription>
                    Desligue o que não faz parte do plano contratado. Os alunos dessa instituição
                    deixam de ver o apoio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {platformSupports.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <Switch
                        checked={!excludedIds.has(item.id)}
                        onCheckedChange={(v) =>
                          setIncluded.mutate({ catalogId: item.id, included: v })
                        }
                        aria-label={`Incluir ${item.title}`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Modelos institucionais</CardTitle>
                  <CardDescription>
                    Estes {institutionModels.length} modelos ficam disponíveis para a instituição
                    ativar e personalizar no portal dela.
                  </CardDescription>
                </CardHeader>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Criação / edição */}
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setIsCreating(false);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Novo apoio" : "Editar apoio"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Título</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  rows={2}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Origem</Label>
                  <Select
                    value={editing.origin_type || "platform"}
                    onValueChange={(v) => setEditing({ ...editing, origin_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Plataforma</SelectItem>
                      <SelectItem value="institution">Modelo institucional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={editing.category || SUPPORT_CATEGORIES[0]}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formato</Label>
                  <Select
                    value={editing.format || SUPPORT_FORMATS[0]}
                    onValueChange={(v) => setEditing({ ...editing, format: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_FORMATS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de acesso</Label>
                  <Select
                    value={editing.access_type || SUPPORT_ACCESS_TYPES[0]}
                    onValueChange={(v) => setEditing({ ...editing, access_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_ACCESS_TYPES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ícone</Label>
                  <Select
                    value={editing.icon || "sparkles"}
                    onValueChange={(v) => setEditing({ ...editing, icon: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(editing.icon && !SUPPORT_ICON_OPTIONS.includes(editing.icon)
                        ? [editing.icon, ...SUPPORT_ICON_OPTIONS]
                        : SUPPORT_ICON_OPTIONS
                      ).map((iconKey) => (
                        <SelectItem key={iconKey} value={iconKey}>
                          <span className="flex items-center gap-2">
                            <SupportIcon name={iconKey} className="h-4 w-4" />
                            {iconKey}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={editing.provider || ""}
                    onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Texto do botão</Label>
                  <Input
                    value={editing.cta_label || ""}
                    onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Destino do botão</Label>
                  <Input
                    value={editing.cta_route || ""}
                    placeholder="/profissionais"
                    onChange={(e) => setEditing({ ...editing, cta_route: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Detalhes</Label>
                <Textarea
                  rows={3}
                  value={editing.details || ""}
                  onChange={(e) => setEditing({ ...editing, details: e.target.value })}
                />
              </div>
              <div>
                <Label>Como acessar</Label>
                <Textarea
                  rows={2}
                  value={editing.how_to || ""}
                  onChange={(e) => setEditing({ ...editing, how_to: e.target.value })}
                />
              </div>
              <div>
                <Label>Quando faz sentido</Label>
                <Textarea
                  rows={2}
                  value={editing.when_to || ""}
                  onChange={(e) => setEditing({ ...editing, when_to: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="featured">Mostrar em destaque</Label>
                <Switch
                  id="featured"
                  checked={!!editing.featured}
                  onCheckedChange={(v) => setEditing({ ...editing, featured: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="is-active">Ativo</Label>
                <Switch
                  id="is-active"
                  checked={editing.is_active !== false}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setIsCreating(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={saveDraft} disabled={!editing?.title?.trim()}>
              {isCreating ? "Criar apoio" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportLibraryAdmin;
