import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Plus, Trash2, Pencil, HeartHandshake, Eye } from "lucide-react";
import { SupportIcon, SUPPORT_ICON_OPTIONS } from "@/features/apoios/SupportIcon";
import {
  SUPPORT_ACCESS_TYPES,
  SUPPORT_CATEGORIES,
  SUPPORT_FORMATS,
  type InstitutionSupportRow,
} from "@/features/apoios/types";
import {
  useInstitutionSupportPlan,
  useInstitutionSupports,
  useSupportCatalog,
} from "@/hooks/useSupportLibrary";
import { useInstitutionSupportsManager } from "@/hooks/useInstitutionSupportsManager";
import { useInstitutionAccess } from "@/hooks/useInstitutionAccess";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath } from "@/utils/tenantHelpers";

type FormState = Partial<InstitutionSupportRow>;

const emptyForm: FormState = {
  title: "",
  category: SUPPORT_CATEGORIES[0],
  format: "Orientação",
  access_type: "Consultar instituição",
  icon: "hands",
  description: "",
  details: "",
  how_to: "",
  when_to: "",
  provider: "",
  contact_channel: "",
  contact_value: "",
  is_published: true,
};

const InstitutionSupports = () => {
  const { userInstitutions, isLoading } = useInstitutionAccess();
  const { tenant } = useTenant();
  const institutionId = userInstitutions[0]?.institution_id;
  const institutionName = userInstitutions[0]?.educational_institutions?.name;

  const { data: supports = [], isLoading: loadingSupports } = useInstitutionSupports(institutionId);
  const { data: catalog = [] } = useSupportCatalog();
  const { allowedCategories } = useInstitutionSupportPlan(institutionId);
  const { save, togglePublished, remove, addFromCatalog } = useInstitutionSupportsManager(institutionId);

  const [form, setForm] = useState<FormState | null>(null);

  const categories = useMemo(
    () => (allowedCategories.length > 0 ? allowedCategories : [...SUPPORT_CATEGORIES]),
    [allowedCategories]
  );
  const models = useMemo(() => catalog.filter((c) => c.origin_type === "institution"), [catalog]);
  const activeCatalogIds = useMemo(
    () => new Set(supports.map((s) => s.catalog_id).filter(Boolean)),
    [supports]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!institutionId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-16 px-4 text-center">
          <h1 className="text-xl font-semibold">Conta sem vínculo institucional</h1>
          <p className="text-muted-foreground mt-2">
            Sua conta não está ligada a uma instituição, então não há apoios para gerenciar.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={buildTenantPath(tenant?.slug, "/portal-institucional")}>
                  Portal Institucional
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Apoios</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HeartHandshake className="h-6 w-6 text-primary" /> Apoios da {institutionName}
            </h1>
            <p className="text-muted-foreground">
              Escolha os apoios que a sua instituição oferece e cadastre os apoios próprios que os
              alunos podem acessar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={buildTenantPath(tenant?.slug, "/biblioteca-apoios")}>
                <Eye className="h-4 w-4 mr-2" /> Ver como o aluno
              </Link>
            </Button>
            <Button onClick={() => setForm({ ...emptyForm })}>
              <Plus className="h-4 w-4 mr-2" /> Novo apoio
            </Button>
          </div>
        </div>

        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">Meus apoios ({supports.length})</TabsTrigger>
            <TabsTrigger value="models">Modelos prontos ({models.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="pt-4">
            {loadingSupports ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : supports.length === 0 ? (
              <Card className="p-10 text-center border-dashed">
                <p className="font-semibold">Nenhum apoio cadastrado ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Comece pelos modelos prontos ou cadastre um apoio próprio da instituição.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {supports.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4 flex gap-3 items-start">
                      <span className="h-10 w-10 rounded-xl bg-secondary/15 text-secondary grid place-items-center shrink-0">
                        <SupportIcon name={item.icon} className="h-5 w-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{item.title}</p>
                          {!item.is_published && (
                            <Badge variant="outline" className="text-[10px]">
                              Rascunho
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.category} · {item.format} · {item.access_type}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Switch
                          checked={item.is_published}
                          onCheckedChange={(v) =>
                            togglePublished.mutate({ id: item.id, is_published: v })
                          }
                          aria-label="Publicado"
                        />
                        <div className="flex">
                          <Button variant="ghost" size="icon" onClick={() => setForm(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove.mutate(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="models" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Modelos da Rede Bem-Estar</CardTitle>
                <CardDescription>
                  Ative um modelo para publicá-lo com o nome da sua instituição. Depois é possível
                  ajustar textos e contatos.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {models.map((m) => {
                  const active = activeCatalogIds.has(m.id);
                  const blocked =
                    allowedCategories.length > 0 && !allowedCategories.includes(m.category);
                  return (
                    <div key={m.id} className="rounded-lg border p-3 flex gap-3 items-start">
                      <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                        <SupportIcon name={m.icon} className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{m.category}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={active ? "secondary" : "outline"}
                        disabled={active || blocked}
                        onClick={() => addFromCatalog.mutate(m)}
                      >
                        {active ? "Ativo" : blocked ? "Fora do plano" : "Ativar"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Formulário */}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar apoio" : "Novo apoio"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div>
                <Label>Título</Label>
                <Input
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex.: Núcleo de apoio ao estudante"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formato</Label>
                  <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
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
                  <Label>Como é o acesso</Label>
                  <Select
                    value={form.access_type}
                    onValueChange={(v) => setForm({ ...form, access_type: v })}
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
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_ICON_OPTIONS.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição curta</Label>
                <Textarea
                  rows={2}
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Detalhes</Label>
                <Textarea
                  rows={3}
                  value={form.details || ""}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                />
              </div>
              <div>
                <Label>Como acessar</Label>
                <Textarea
                  rows={2}
                  value={form.how_to || ""}
                  onChange={(e) => setForm({ ...form, how_to: e.target.value })}
                />
              </div>
              <div>
                <Label>Quando faz sentido</Label>
                <Textarea
                  rows={2}
                  value={form.when_to || ""}
                  onChange={(e) => setForm({ ...form, when_to: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Canal de contato</Label>
                  <Input
                    value={form.contact_channel || ""}
                    onChange={(e) => setForm({ ...form, contact_channel: e.target.value })}
                    placeholder="E-mail, WhatsApp, sala..."
                  />
                </div>
                <div>
                  <Label>Contato</Label>
                  <Input
                    value={form.contact_value || ""}
                    onChange={(e) => setForm({ ...form, contact_value: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="pub">Visível para os alunos</Label>
                <Switch
                  id="pub"
                  checked={!!form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!form?.title}
              onClick={() => {
                if (!form?.title) return;
                save.mutate({
                  ...form,
                  institution_id: institutionId,
                  title: form.title,
                  category: form.category || SUPPORT_CATEGORIES[0],
                } as any);
                setForm(null);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default InstitutionSupports;
