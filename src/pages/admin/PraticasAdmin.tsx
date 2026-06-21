import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useAdminPraticas,
  useDeleteAtalho,
  useDeleteGrupo,
  useDeletePratica,
  useSaveAtalho,
  useSaveGrupo,
  useSavePratica,
} from "@/hooks/useAdminPraticas";
import type { Pratica, PraticaGrupo, PraticaAtalho } from "@/hooks/usePraticas";
import { ICON_OPTIONS, IconePratica } from "@/components/praticas/IconePratica";
import { toast } from "@/hooks/use-toast";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PraticasAdmin = () => {
  const { data, isLoading } = useAdminPraticas();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Práticas para Reequilíbrio Emocional</h1>
        <p className="text-muted-foreground">
          Gerencie as práticas guiadas exibidas publicamente em <code>/praticas</code>.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="praticas">
          <TabsList>
            <TabsTrigger value="praticas">Práticas</TabsTrigger>
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="atalhos">Atalhos</TabsTrigger>
            <TabsTrigger value="checkouts">Check-outs</TabsTrigger>
          </TabsList>

          <TabsContent value="praticas" className="mt-6">
            <PraticasTab data={data!} />
          </TabsContent>
          <TabsContent value="grupos" className="mt-6">
            <GruposTab data={data!} />
          </TabsContent>
          <TabsContent value="atalhos" className="mt-6">
            <AtalhosTab data={data!} />
          </TabsContent>
          <TabsContent value="checkouts" className="mt-6">
            <CheckoutsTab data={data!} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// ===================== PRÁTICAS =====================

const PraticasTab = ({
  data,
}: {
  data: { praticas: Pratica[]; grupos: PraticaGrupo[] };
}) => {
  const [editing, setEditing] = useState<Partial<Pratica> | null>(null);
  const del = useDeletePratica();

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Práticas ({data.praticas.length})</h2>
        <Button
          onClick={() =>
            setEditing({
              titulo: "",
              slug: "",
              ativo: true,
              destaque: false,
              duracao_min_default: 5,
              duracoes_disponiveis: [3, 5, 10],
              padrao_respiracao: { inspirar: 4, segurar: 0, expirar: 6 } as any,
              tem_audio: false,
              ordem: data.praticas.length + 1,
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Nova prática
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.praticas.map((p) => {
            const grupo = data.grupos.find((g) => g.id === p.grupo_id);
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconePratica name={p.icone} className="h-4 w-4 text-primary" />
                    <span className="font-medium">{p.titulo}</span>
                    {p.destaque && <Badge variant="secondary">Destaque</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </TableCell>
                <TableCell>{grupo?.nome ?? "—"}</TableCell>
                <TableCell>{p.duracao_min_default} min</TableCell>
                <TableCell>
                  {p.ativo ? (
                    <Badge>Ativa</Badge>
                  ) : (
                    <Badge variant="outline">Oculta</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Excluir "${p.titulo}"?`)) del.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editing && (
        <PraticaDialog
          pratica={editing}
          grupos={data.grupos}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
};

const PraticaDialog = ({
  pratica,
  grupos,
  onClose,
}: {
  pratica: Partial<Pratica>;
  grupos: PraticaGrupo[];
  onClose: () => void;
}) => {
  const [f, setF] = useState<Partial<Pratica>>(pratica);
  const save = useSavePratica();

  const update = <K extends keyof Pratica>(k: K, v: Pratica[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!f.titulo || !f.slug) {
      toast({ title: "Título e slug são obrigatórios", variant: "destructive" });
      return;
    }
    try {
      await save.mutateAsync(f);
      toast({ title: "Prática salva" });
      onClose();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{f.id ? "Editar prática" : "Nova prática"}</DialogTitle>
          <DialogDescription>Configurações da prática guiada.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <Label>Título</Label>
            <Input
              value={f.titulo ?? ""}
              onChange={(e) => {
                update("titulo", e.target.value);
                if (!f.id && !f.slug) update("slug", slugify(e.target.value));
              }}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label>Slug (URL)</Label>
            <Input
              value={f.slug ?? ""}
              onChange={(e) => update("slug", slugify(e.target.value))}
            />
          </div>

          <div className="col-span-2">
            <Label>Subtítulo</Label>
            <Input
              value={f.subtitulo ?? ""}
              onChange={(e) => update("subtitulo", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Label>Descrição curta (card)</Label>
            <Input
              value={f.descricao_curta ?? ""}
              onChange={(e) => update("descricao_curta", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Label>Corpo (ciência)</Label>
            <Textarea
              rows={5}
              value={f.corpo_ciencia ?? ""}
              onChange={(e) => update("corpo_ciencia", e.target.value)}
            />
          </div>

          <div>
            <Label>Grupo</Label>
            <Select
              value={f.grupo_id ?? ""}
              onValueChange={(v) => update("grupo_id", v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ícone</Label>
            <Select
              value={f.icone ?? ""}
              onValueChange={(v) => update("icone", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categoria badge</Label>
            <Input
              value={f.categoria_badge ?? ""}
              onChange={(e) => update("categoria_badge", e.target.value)}
              placeholder="EVIDÊNCIA"
            />
          </div>

          <div>
            <Label>Ideal para</Label>
            <Input
              value={f.ideal_para ?? ""}
              onChange={(e) => update("ideal_para", e.target.value)}
            />
          </div>

          <div>
            <Label>Duração padrão (min)</Label>
            <Input
              type="number"
              value={f.duracao_min_default ?? 5}
              onChange={(e) =>
                update("duracao_min_default", Number(e.target.value))
              }
            />
          </div>

          <div>
            <Label>Durações disponíveis (vírgula)</Label>
            <Input
              value={(f.duracoes_disponiveis ?? []).join(",")}
              onChange={(e) =>
                update(
                  "duracoes_disponiveis",
                  e.target.value
                    .split(",")
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !isNaN(n))
                )
              }
            />
          </div>

          <div>
            <Label>Inspirar (s)</Label>
            <Input
              type="number"
              value={(f.padrao_respiracao as any)?.inspirar ?? 4}
              onChange={(e) =>
                update("padrao_respiracao", {
                  ...(f.padrao_respiracao as any),
                  inspirar: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label>Segurar (s)</Label>
            <Input
              type="number"
              value={(f.padrao_respiracao as any)?.segurar ?? 0}
              onChange={(e) =>
                update("padrao_respiracao", {
                  ...(f.padrao_respiracao as any),
                  segurar: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label>Expirar (s)</Label>
            <Input
              type="number"
              value={(f.padrao_respiracao as any)?.expirar ?? 6}
              onChange={(e) =>
                update("padrao_respiracao", {
                  ...(f.padrao_respiracao as any),
                  expirar: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="col-span-2">
            <Label>URL do áudio (MP3 público)</Label>
            <Input
              value={f.audio_url ?? ""}
              onChange={(e) => update("audio_url", e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Hospede em qualquer URL pública (Storage, S3, etc.) e cole aqui.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={!!f.tem_audio}
              onCheckedChange={(v) => update("tem_audio", v)}
            />
            <Label>Tem áudio</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={!!f.ativo}
              onCheckedChange={(v) => update("ativo", v)}
            />
            <Label>Ativa (visível ao público)</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={!!f.destaque}
              onCheckedChange={(v) => update("destaque", v)}
            />
            <Label>Destaque</Label>
          </div>
          <div>
            <Label>Ordem</Label>
            <Input
              type="number"
              value={f.ordem ?? 0}
              onChange={(e) => update("ordem", Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===================== GRUPOS =====================

const GruposTab = ({ data }: { data: { grupos: PraticaGrupo[] } }) => {
  const [editing, setEditing] = useState<Partial<PraticaGrupo> | null>(null);
  const save = useSaveGrupo();
  const del = useDeleteGrupo();

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Grupos</h2>
        <Button
          onClick={() =>
            setEditing({ nome: "", slug: "", ativo: true, ordem: data.grupos.length + 1 })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Novo grupo
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.grupos.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{g.nome}</TableCell>
              <TableCell className="text-xs">{g.slug}</TableCell>
              <TableCell>{g.ordem}</TableCell>
              <TableCell>{g.ativo ? "Sim" : "Não"}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(g)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Excluir grupo "${g.nome}"?`)) del.mutate(g.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing.id ? "Editar grupo" : "Novo grupo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editing.nome ?? ""}
                  onChange={(e) => {
                    const nome = e.target.value;
                    setEditing((s) => ({
                      ...s!,
                      nome,
                      slug: s?.id ? s?.slug : slugify(nome),
                    }));
                  }}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={editing.slug ?? ""}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s!, slug: slugify(e.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  rows={2}
                  value={editing.descricao ?? ""}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s!, descricao: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-3 items-end">
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={editing.ordem ?? 0}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s!, ordem: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editing.ativo}
                    onCheckedChange={(v) =>
                      setEditing((s) => ({ ...s!, ativo: v }))
                    }
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await save.mutateAsync(editing);
                  toast({ title: "Grupo salvo" });
                  setEditing(null);
                }}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

// ===================== ATALHOS =====================

const AtalhosTab = ({
  data,
}: {
  data: { atalhos: PraticaAtalho[]; praticas: Pratica[] };
}) => {
  const [editing, setEditing] = useState<Partial<PraticaAtalho> | null>(null);
  const save = useSaveAtalho();
  const del = useDeleteAtalho();

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Atalhos ("Encontrar o que preciso agora")</h2>
        <Button
          onClick={() =>
            setEditing({
              texto: "",
              pratica_slug: "",
              ativo: true,
              ordem: data.atalhos.length + 1,
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Novo atalho
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Texto</TableHead>
            <TableHead>Prática</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.atalhos.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.texto}</TableCell>
              <TableCell className="text-xs">{a.pratica_slug ?? "—"}</TableCell>
              <TableCell>{a.ativo ? "Sim" : "Não"}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => setEditing(a)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Excluir atalho?")) del.mutate(a.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing.id ? "Editar atalho" : "Novo atalho"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Texto</Label>
                <Input
                  value={editing.texto ?? ""}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s!, texto: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Prática (slug)</Label>
                <Select
                  value={editing.pratica_slug ?? ""}
                  onValueChange={(v) =>
                    setEditing((s) => ({ ...s!, pratica_slug: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.praticas.map((p) => (
                      <SelectItem key={p.id} value={p.slug}>
                        {p.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 items-end">
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={editing.ordem ?? 0}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s!, ordem: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editing.ativo}
                    onCheckedChange={(v) =>
                      setEditing((s) => ({ ...s!, ativo: v }))
                    }
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await save.mutateAsync(editing);
                  toast({ title: "Atalho salvo" });
                  setEditing(null);
                }}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

// ===================== CHECKOUTS =====================

const CheckoutsTab = ({
  data,
}: {
  data: { checkouts: any[]; praticas: Pratica[] };
}) => {
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">Últimos 100 check-outs emocionais</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Prática</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Nota</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.checkouts.map((c) => {
            const p = data.praticas.find((x) => x.id === c.pratica_id);
            return (
              <TableRow key={c.id}>
                <TableCell className="text-xs">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>{p?.titulo ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{c.estado}</Badge>
                </TableCell>
                <TableCell>
                  {c.duracao_segundos
                    ? `${Math.round(c.duracao_segundos / 60)} min`
                    : "—"}
                </TableCell>
                <TableCell className="max-w-md text-sm text-muted-foreground">
                  {c.nota ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
          {data.checkouts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum check-out registrado ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default PraticasAdmin;
