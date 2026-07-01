import React, { useEffect, useState } from "react";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBuddyPortrait, type BuddyPortrait } from "@/hooks/useBuddy";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Save } from "lucide-react";

const IMPROVE_SUGGESTIONS = ["Autoconfiança", "Organização", "Relacionamentos", "Foco", "Ansiedade", "Procrastinação", "Autoestima", "Sono"];
const TRIGGER_SUGGESTIONS = ["Críticas", "Discussões", "Pressão", "Solidão", "Mudanças", "Injustiças", "Cobranças", "Perder alguém"];
const VALUE_SUGGESTIONS = ["Honestidade", "Empatia", "Respeito", "Família", "Amizade", "Liberdade", "Gratidão", "Criatividade"];
const MOODS = [
  { key: "muito_bem", label: "Muito bem", emoji: "😄" },
  { key: "bem", label: "Bem", emoji: "🙂" },
  { key: "medio", label: "Mais ou menos", emoji: "😐" },
  { key: "mal", label: "Mal", emoji: "🙁" },
  { key: "muito_mal", label: "Muito mal", emoji: "😢" },
];

export default function BuddyPortraitPage() {
  const { data, isLoading, save, patientId } = useBuddyPortrait();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<BuddyPortrait>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (k: keyof BuddyPortrait, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTag = (k: "wants_to_improve" | "triggers" | "values_list", tag: string) => {
    const cur = (form[k] as string[] | undefined) ?? [];
    set(k, cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]);
  };

  const onSave = async () => {
    if (!patientId) {
      toast({ title: "Cadastro incompleto", description: "Complete seu perfil de paciente para continuar.", variant: "destructive" });
      return;
    }
    try {
      await save.mutateAsync(form);
      toast({ title: "Retrato salvo", description: "Suas respostas ficaram guardadas com segurança." });
    } catch (e: any) {
      toast({ title: "Não conseguimos salvar", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <BuddyLayout
      title="Ajude o Buddy a te conhecer melhor"
      description="Quanto mais você compartilha, mais o Buddy consegue te apoiar. Não precisa ter pressa — você pode voltar quando quiser."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-5">
          <PrivacyCard privacy={form.privacy ?? "only_me"} onChange={(v) => set("privacy", v)} />

          <div className="grid gap-5 md:grid-cols-2">
            <Field title="O que tem ocupado sua mente?" hint="Escreva livremente o que está pensando ou sentindo.">
              <Textarea value={form.mind_on ?? ""} onChange={(e) => set("mind_on", e.target.value)} maxLength={500} rows={4} />
            </Field>
            <Field title="O que te acalma?" hint="Atividades, lugares ou pessoas que te fazem bem.">
              <Textarea value={form.calms_me ?? ""} onChange={(e) => set("calms_me", e.target.value)} maxLength={500} rows={4} />
            </Field>
            <Field title="Quais são seus sonhos?" hint="Conte sobre seus sonhos e objetivos.">
              <Textarea value={form.dreams ?? ""} onChange={(e) => set("dreams", e.target.value)} maxLength={500} rows={4} />
            </Field>
            <Field title="O que você quer que o Buddy entenda sobre você?" hint="Algo importante para eu te apoiar melhor.">
              <Textarea value={form.message_to_buddy ?? ""} onChange={(e) => set("message_to_buddy", e.target.value)} maxLength={500} rows={4} />
            </Field>
          </div>

          <Field title="O que você gostaria de melhorar?">
            <TagPicker options={IMPROVE_SUGGESTIONS} value={form.wants_to_improve ?? []} onToggle={(t) => toggleTag("wants_to_improve", t)} />
          </Field>

          <Field title="Gatilhos emocionais" hint="O que costuma te deixar mal?">
            <TagPicker options={TRIGGER_SUGGESTIONS} value={form.triggers ?? []} onToggle={(t) => toggleTag("triggers", t)} />
          </Field>

          <Field title="Valores que guiam você" hint="Selecione até 5 valores importantes.">
            <TagPicker options={VALUE_SUGGESTIONS} value={form.values_list ?? []} onToggle={(t) => toggleTag("values_list", t)} />
          </Field>

          <Card>
            <CardHeader><CardTitle>Como você está se sentindo hoje?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => set("current_mood", m.key)}
                    className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-2 transition ${
                      form.current_mood === m.key ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
                    }`}
                  >
                    <span aria-hidden>{m.emoji}</span> {m.label}
                  </button>
                ))}
              </div>
              <ScaleRow label="Ansiedade" value={form.anxiety ?? 0} onChange={(v) => set("anxiety", v)} />
              <ScaleRow label="Tristeza" value={form.sadness ?? 0} onChange={(v) => set("sadness", v)} />
              <ScaleRow label="Motivação" value={form.motivation ?? 5} onChange={(v) => set("motivation", v)} />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between rounded-2xl bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground max-w-md">
              Você está construindo um retrato único que ajuda o Buddy a cuidar de você do seu jeito.
            </p>
            <Button onClick={onSave} disabled={save.isPending || isLoading} size="lg">
              {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar no meu perfil
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <BuddyMascot size="lg" message="Estou aqui para te escutar sem julgamentos e te apoiar no que precisar." />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Dica do Buddy</p>
              <p>Seja sincera(o) consigo. Não existe resposta certa ou errada aqui.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </BuddyLayout>
  );
}

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TagPicker({ options, value, onToggle }: { options: string[]; value: string[]; onToggle: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-primary/10 border-border"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ScaleRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <Label>{label}</Label>
        <span className="font-medium text-primary">{value}/10</span>
      </div>
      <Slider min={0} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function PrivacyCard({ privacy, onChange }: { privacy: string; onChange: (v: "only_me" | "with_professionals") => void }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Privacidade das suas respostas</p>
            <p className="text-xs text-muted-foreground">
              {privacy === "with_professionals"
                ? "Profissionais autorizados por você poderão ler."
                : "Apenas você e o Buddy veem estas respostas."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Compartilhar com profissionais</span>
          <Switch
            checked={privacy === "with_professionals"}
            onCheckedChange={(v) => onChange(v ? "with_professionals" : "only_me")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
