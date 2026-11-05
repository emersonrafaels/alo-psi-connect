import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Row = {
  id: string; source_text: string; lang: "en" | "es"; auto_text: string | null; human_text: string | null;
  status: "auto" | "reviewed" | "needs_review"; pages: string[]; updated_at: string;
};
type Gloss = { id: string; term_pt: string; lang: "en" | "es"; term_target: string };

const STATUS: Record<Row["status"], string> = { auto: "Automática", reviewed: "Revisada", needs_review: "Precisa revisão" };
const db = supabase as any;

export default function Translations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [lang, setLang] = useState<"all" | "en" | "es">("all");
  const [status, setStatus] = useState<"all" | Row["status"]>("all");
  const [page, setPage] = useState("all");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  const [draft, setDraft] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-translations"],
    queryFn: async () => {
      const { data, error } = await db.from("translations").select("*").order("updated_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return data as Row[];
    },
  });
  const { data: gloss = [] } = useQuery({
    queryKey: ["admin-glossary"],
    queryFn: async () => (await db.from("translation_glossary").select("*").order("term_pt")).data as Gloss[] ?? [],
  });

  const pages = useMemo(() => [...new Set(rows.flatMap((r) => r.pages ?? []))].sort(), [rows]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) =>
      (lang === "all" || r.lang === lang) && (status === "all" || r.status === status) &&
      (page === "all" || r.pages?.includes(page)) &&
      (!s || r.source_text.toLowerCase().includes(s) || (r.human_text ?? r.auto_text ?? "").toLowerCase().includes(s)));
  }, [rows, lang, status, page, q]);

  const update = async (id: string, patch: Partial<Row>) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("translations").update({ ...patch, updated_by: u.user?.id }).eq("id", id);
    if (error) return toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["admin-translations"] });
    toast({ title: "Tradução atualizada", description: "Vale para os visitantes no próximo carregamento." });
  };

  const [g, setG] = useState({ term_pt: "", lang: "en" as "en" | "es", term_target: "" });
  const addGloss = async () => {
    if (!g.term_pt.trim() || !g.term_target.trim()) return;
    const { error } = await db.from("translation_glossary").upsert(
      { term_pt: g.term_pt.trim(), lang: g.lang, term_target: g.term_target.trim() }, { onConflict: "term_pt,lang" });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setG({ ...g, term_pt: "", term_target: "" });
    qc.invalidateQueries({ queryKey: ["admin-glossary"] });
  };
  const delGloss = async (id: string) => {
    await db.from("translation_glossary").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-glossary"] });
  };

  return (
    <div className="space-y-6 p-6" data-no-translate>
      <div>
        <h1 className="text-2xl font-bold">Traduções</h1>
        <p className="text-muted-foreground">Revise como os textos aparecem em inglês e espanhol. Sua versão substitui a tradução automática.</p>
      </div>
      <Tabs defaultValue="texts">
        <TabsList>
          <TabsTrigger value="texts">Textos ({rows.length})</TabsTrigger>
          <TabsTrigger value="glossary">Glossário ({gloss.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="texts" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Buscar palavra ou frase" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
            <Select value={lang} onValueChange={(v: any) => setLang(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos idiomas</SelectItem><SelectItem value="en">🇺🇸 Inglês</SelectItem><SelectItem value="es">🇪🇸 Espanhol</SelectItem></SelectContent>
            </Select>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas situações</SelectItem>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={page} onValueChange={setPage}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as páginas</SelectItem>{pages.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum texto ainda. Os textos aparecem aqui quando alguém navega pelo site em inglês ou espanhol.</p>}
          <div className="space-y-2">
            {list.slice(0, 300).map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-start">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{r.source_text}</p>
                    <p className="text-sm text-muted-foreground">{r.lang === "en" ? "🇺🇸" : "🇪🇸"} {r.human_text ?? r.auto_text}</p>
                    {r.human_text && <p className="text-xs text-muted-foreground line-through">{r.auto_text}</p>}
                    <p className="text-xs text-muted-foreground">{(r.pages ?? []).slice(0, 4).join(" · ")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.status === "reviewed" ? "default" : r.status === "needs_review" ? "destructive" : "secondary"}>{STATUS[r.status]}</Badge>
                    <Button size="sm" variant="outline" onClick={() => { setEdit(r); setDraft(r.human_text ?? r.auto_text ?? ""); }}>Editar</Button>
                    {r.status !== "needs_review" && !r.human_text && <Button size="sm" variant="ghost" onClick={() => update(r.id, { status: "needs_review" })}>Marcar revisão</Button>}
                    {r.human_text && <Button size="sm" variant="ghost" onClick={() => update(r.id, { human_text: null, status: "auto" })}>Voltar ao automático</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {list.length > 300 && <p className="text-sm text-muted-foreground">Mostrando 300 de {list.length}. Use os filtros para refinar.</p>}
          </div>
        </TabsContent>

        <TabsContent value="glossary" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Nova regra</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Input placeholder="Em português (ex.: Sinal elevado)" value={g.term_pt} onChange={(e) => setG({ ...g, term_pt: e.target.value })} className="w-64" />
              <Select value={g.lang} onValueChange={(v: any) => setG({ ...g, lang: v })}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="en">🇺🇸 Inglês</SelectItem><SelectItem value="es">🇪🇸 Espanhol</SelectItem></SelectContent>
              </Select>
              <Input placeholder="Como deve aparecer" value={g.term_target} onChange={(e) => setG({ ...g, term_target: e.target.value })} className="w-64" />
              <Button onClick={addGloss}>Adicionar</Button>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">O glossário vale para textos que são exatamente o termo e orienta as próximas traduções automáticas.</p>
          {gloss.map((x) => (
            <div key={x.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{x.term_pt} → {x.lang === "en" ? "🇺🇸" : "🇪🇸"} {x.term_target}</span>
              <Button size="sm" variant="ghost" onClick={() => delGloss(x.id)}>Remover</Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revisar tradução</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Original: {edit?.source_text}</p>
          <p className="text-xs text-muted-foreground">Automática: {edit?.auto_text}</p>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={async () => { if (edit) { await update(edit.id, { human_text: draft.trim(), status: "reviewed" }); setEdit(null); } }}>Salvar revisão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
