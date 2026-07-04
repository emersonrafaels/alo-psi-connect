import React, { useEffect, useMemo, useState } from "react";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { BuddyAudioAnswer } from "@/components/buddy/BuddyAudioAnswer";
import { BuddyChipInput } from "@/components/buddy/BuddyChipInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";
import { useBuddyPortrait, type BuddyPortrait } from "@/hooks/useBuddy";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Save, Heart, Sparkles, Compass, Anchor, Shield, MessageCircle,
  Check, ChevronRight, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const IMPROVE = ["Autoconfiança", "Organização", "Relacionamentos", "Foco", "Ansiedade", "Procrastinação", "Autoestima", "Sono"];
const TRIGGERS = ["Críticas", "Discussões", "Pressão", "Solidão", "Mudanças", "Injustiças", "Cobranças", "Perder alguém"];
const VALUES = ["Honestidade", "Empatia", "Respeito", "Família", "Amizade", "Liberdade", "Gratidão", "Criatividade"];
const STRENGTHS = ["Escuta", "Resiliência", "Empatia", "Curiosidade", "Coragem", "Paciência", "Humor", "Disciplina"];
const SELFCARE = ["Meditar", "Caminhar", "Ler", "Banho quente", "Diário", "Respiração", "Música", "Yoga"];
const HOBBIES = ["Ler", "Cozinhar", "Correr", "Games", "Desenhar", "Cantar", "Dançar", "Jardinagem"];
const AVOID = ["Multidões", "Conflitos", "Redes sociais", "Notícias", "Discussões políticas", "Silêncio total"];
const MOODS = [
  { key: "muito_bem", label: "Muito bem", emoji: "😄" },
  { key: "bem", label: "Bem", emoji: "🙂" },
  { key: "medio", label: "Mais ou menos", emoji: "😐" },
  { key: "mal", label: "Mal", emoji: "🙁" },
  { key: "muito_mal", label: "Muito mal", emoji: "😢" },
];
const TONES = [
  { key: "acolhedor", label: "Acolhedor", emoji: "🤗" },
  { key: "direto", label: "Direto", emoji: "🎯" },
  { key: "bem_humorado", label: "Bem-humorado", emoji: "😄" },
  { key: "motivador", label: "Motivador", emoji: "🔥" },
];

const SECTIONS = [
  { id: "agora", label: "Agora", icon: Heart, tip: "Não precisa ser perfeito. Só honesto." },
  { id: "essencia", label: "Essência", icon: Sparkles, tip: "O que te define quando ninguém está olhando?" },
  { id: "momento", label: "Momento", icon: Compass, tip: "Contar o que ocupa a mente já é meio caminho." },
  { id: "sustenta", label: "Sustenta", icon: Anchor, tip: "Reconheça o que te mantém de pé." },
  { id: "limites", label: "Limites", icon: Shield, tip: "Saber o que evita é uma forma de cuidado." },
  { id: "buddy", label: "Buddy", icon: MessageCircle, tip: "Me diga como quer ser cuidada(o)." },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

export default function BuddyPortraitPage() {
  const { data, isLoading, save, patientId } = useBuddyPortrait();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<BuddyPortrait>>({});
  const [section, setSection] = useState<SectionId>("agora");

  useEffect(() => { if (data) setForm(data); }, [data]);

  const set = <K extends keyof BuddyPortrait>(k: K, v: BuddyPortrait[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const appendText = (k: keyof BuddyPortrait, text: string) => {
    const cur = (form[k] as string | undefined) ?? "";
    const merged = cur ? `${cur}\n\n${text}` : text;
    setForm((f) => ({ ...f, [k]: merged as any }));
  };
  const setAudio = (k: string, url: string | null) => {
    const cur = (form.audio_answers as Record<string, string> | undefined) ?? {};
    const next = { ...cur };
    if (url) next[k] = url; else delete next[k];
    setForm((f) => ({ ...f, audio_answers: next as any }));
  };

  const progress = useMemo(() => computeProgress(form), [form]);

  const onSave = async () => {
    if (!patientId) {
      toast({ title: "Cadastro incompleto", description: "Complete seu perfil para continuar.", variant: "destructive" });
      return;
    }
    try {
      await save.mutateAsync(form);
      toast({ title: "Retrato salvo 💜", description: "Ficou guardado com segurança." });
    } catch (e: any) {
      toast({ title: "Não conseguimos salvar", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const currentIdx = SECTIONS.findIndex((s) => s.id === section);
  const next = () => setSection(SECTIONS[Math.min(currentIdx + 1, SECTIONS.length - 1)].id);
  const prev = () => setSection(SECTIONS[Math.max(currentIdx - 1, 0)].id);

  return (
    <BuddyLayout
      title="Seu retrato para o Buddy"
      description="Quanto mais eu te conheço, melhor eu cuido. Responda digitando ou falando — no seu ritmo."
    >
      <ProgressHeader progress={progress} />

      <div className="grid min-w-0 max-w-full gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          
          <SectionStepper current={section} onChange={setSection} progress={progress} />

          <div key={section} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
            {section === "agora" && (
              <SectionAgora form={form} set={set} appendText={appendText} setAudio={setAudio} />
            )}
            {section === "essencia" && (
              <SectionEssencia form={form} set={set} />
            )}
            {section === "momento" && (
              <SectionMomento form={form} set={set} appendText={appendText} setAudio={setAudio} />
            )}
            {section === "sustenta" && (
              <SectionSustenta form={form} set={set} appendText={appendText} setAudio={setAudio} />
            )}
            {section === "limites" && (
              <SectionLimites form={form} set={set} />
            )}
            {section === "buddy" && (
              <SectionBuddy form={form} set={set} appendText={appendText} setAudio={setAudio} />
            )}
          </div>

          <div className="sticky bottom-3 sm:bottom-4 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-3 rounded-2xl bg-card/95 backdrop-blur border border-border/70 shadow-lg p-2 sm:p-3 min-w-0">
            <Button type="button" variant="ghost" size="sm" onClick={prev} disabled={currentIdx === 0} className="min-h-9 !h-auto px-2 sm:px-3 text-xs sm:text-sm !whitespace-normal">
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button onClick={onSave} disabled={save.isPending || isLoading} size="sm" className="min-h-10 !h-auto rounded-full shadow-md px-3 sm:px-5 text-xs sm:text-sm !whitespace-normal">
              {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              <span className="hidden min-[360px]:inline">Salvar </span>retrato
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={next} disabled={currentIdx === SECTIONS.length - 1} className="min-h-9 !h-auto px-2 sm:px-3 text-xs sm:text-sm !whitespace-normal">
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 self-start space-y-4">
          <Card className="min-w-0 border-primary/20 overflow-visible sm:overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <CardContent className="p-3 sm:p-4">
              <BuddyMascot size="lg" message={SECTIONS[currentIdx].tip} stack />
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground flex items-center gap-2 [overflow-wrap:anywhere]">
                <Sparkles className="h-4 w-4 text-primary shrink-0" /> Fale em vez de digitar
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed [overflow-wrap:anywhere]">
                Toque no botão do microfone em qualquer pergunta longa. Eu transcrevo pra você e você pode editar depois.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </BuddyLayout>
  );
}

/* ---------- Sections ---------- */

function SectionAgora({ form, set, appendText, setAudio }: any) {
  return (
    <>
      <SectionHeader title="Como você está agora?" subtitle="Um retrato do seu momento presente." />
      <Card>
        <CardHeader><CardTitle className="text-base">Humor de hoje</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <MoodChip key={m.key} active={form.current_mood === m.key} onClick={() => set("current_mood", m.key)} emoji={m.emoji} label={m.label} />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ScaleRow label="Ansiedade" value={form.anxiety ?? 0} onChange={(v) => set("anxiety", v)} colorClass="from-orange-400 to-red-500" />
            <ScaleRow label="Tristeza" value={form.sadness ?? 0} onChange={(v) => set("sadness", v)} colorClass="from-blue-400 to-indigo-500" />
            <ScaleRow label="Motivação" value={form.motivation ?? 5} onChange={(v) => set("motivation", v)} colorClass="from-green-400 to-emerald-500" />
            <ScaleRow label="Energia" value={form.energy_level ?? 5} onChange={(v) => set("energy_level", v)} colorClass="from-amber-400 to-yellow-500" />
            <ScaleRow label="Qualidade do sono" value={form.sleep_quality ?? 5} onChange={(v) => set("sleep_quality", v)} colorClass="from-purple-400 to-indigo-500" />
            <ScaleRow label="Nível de estresse" value={form.stress_level ?? 5} onChange={(v) => set("stress_level", v)} colorClass="from-rose-400 to-pink-500" />
          </div>
        </CardContent>
      </Card>

      <QuestionCard title="O que tem ocupado sua mente?" hint="Solte o que está pensando — sem filtros.">
        <Textarea value={form.mind_on ?? ""} onChange={(e) => set("mind_on", e.target.value)} rows={4} maxLength={800} />
        <BuddyAudioAnswer fieldKey="mind_on" onTranscribed={(t) => appendText("mind_on", t)} onAudioUrl={(u) => setAudio("mind_on", u)} />
      </QuestionCard>
    </>
  );
}

function SectionEssencia({ form, set }: any) {
  return (
    <>
      <SectionHeader title="Sua essência" subtitle="O que te constitui como pessoa." />
      <QuestionCard title="Valores que guiam você" hint="Selecione ou adicione — até 6.">
        <BuddyChipInput suggestions={VALUES} value={form.values_list ?? []} onChange={(v) => set("values_list", v)} max={6} placeholder="Ex: coragem" />
      </QuestionCard>
      <QuestionCard title="Suas forças pessoais" hint="No que você é bom(a)?">
        <BuddyChipInput suggestions={STRENGTHS} value={form.strengths_self ?? []} onChange={(v) => set("strengths_self", v)} max={8} placeholder="Ex: escutar" />
      </QuestionCard>
      <QuestionCard title="Três palavras que te definem" hint="Só três. Escolha com carinho.">
        <BuddyChipInput value={form.three_words ?? []} onChange={(v) => set("three_words", v)} max={3} placeholder="Ex: leal" />
      </QuestionCard>
      <QuestionCard title="O que você gostaria de melhorar?">
        <BuddyChipInput suggestions={IMPROVE} value={form.wants_to_improve ?? []} onChange={(v) => set("wants_to_improve", v)} placeholder="Adicionar outro..." />
      </QuestionCard>
    </>
  );
}

function SectionMomento({ form, set, appendText, setAudio }: any) {
  return (
    <>
      <SectionHeader title="Seu momento de vida" subtitle="O que está acontecendo agora." />
      <QuestionCard title="Quais são seus sonhos?" hint="Grandes, pequenos, quaisquer.">
        <Textarea value={form.dreams ?? ""} onChange={(e) => set("dreams", e.target.value)} rows={4} maxLength={800} />
        <BuddyAudioAnswer fieldKey="dreams" onTranscribed={(t) => appendText("dreams", t)} onAudioUrl={(u) => setAudio("dreams", u)} />
      </QuestionCard>
      <QuestionCard title="O que você quer mudar nos próximos 3 meses?">
        <Textarea value={form.next_3_months ?? ""} onChange={(e) => set("next_3_months", e.target.value)} rows={3} maxLength={500} />
        <BuddyAudioAnswer fieldKey="next_3_months" onTranscribed={(t) => appendText("next_3_months", t)} onAudioUrl={(u) => setAudio("next_3_months", u)} />
      </QuestionCard>
      <QuestionCard title="Qual é o seu maior desafio agora?">
        <Textarea value={form.biggest_challenge ?? ""} onChange={(e) => set("biggest_challenge", e.target.value)} rows={3} maxLength={500} />
        <BuddyAudioAnswer fieldKey="biggest_challenge" onTranscribed={(t) => appendText("biggest_challenge", t)} onAudioUrl={(u) => setAudio("biggest_challenge", u)} />
      </QuestionCard>
    </>
  );
}

function SectionSustenta({ form, set, appendText, setAudio }: any) {
  return (
    <>
      <SectionHeader title="O que te sustenta" subtitle="Pessoas, hábitos e prazeres que te apoiam." />
      <QuestionCard title="O que te acalma?" hint="Atividades, lugares, situações...">
        <Textarea value={form.calms_me ?? ""} onChange={(e) => set("calms_me", e.target.value)} rows={3} maxLength={600} />
        <BuddyAudioAnswer fieldKey="calms_me" onTranscribed={(t) => appendText("calms_me", t)} onAudioUrl={(u) => setAudio("calms_me", u)} />
      </QuestionCard>
      <QuestionCard title="Quem são suas pessoas de referência?" hint="Quem você procura em momentos difíceis.">
        <Textarea value={form.support_people ?? ""} onChange={(e) => set("support_people", e.target.value)} rows={3} maxLength={500} />
        <BuddyAudioAnswer fieldKey="support_people" onTranscribed={(t) => appendText("support_people", t)} onAudioUrl={(u) => setAudio("support_people", u)} />
      </QuestionCard>
      <QuestionCard title="Rituais de autocuidado" hint="Pequenas práticas que você já faz (ou quer começar).">
        <BuddyChipInput suggestions={SELFCARE} value={form.self_care_rituals ?? []} onChange={(v) => set("self_care_rituals", v)} placeholder="Adicionar outro..." />
      </QuestionCard>
      <QuestionCard title="Hobbies e paixões">
        <BuddyChipInput suggestions={HOBBIES} value={form.hobbies ?? []} onChange={(v) => set("hobbies", v)} placeholder="Adicionar outro..." />
      </QuestionCard>
    </>
  );
}

function SectionLimites({ form, set }: any) {
  return (
    <>
      <SectionHeader title="Seus limites" subtitle="O que respeita o seu espaço." />
      <QuestionCard title="Gatilhos emocionais" hint="O que costuma te deixar mal.">
        <BuddyChipInput suggestions={TRIGGERS} value={form.triggers ?? []} onChange={(v) => set("triggers", v)} placeholder="Adicionar outro..." />
      </QuestionCard>
      <QuestionCard title="Situações que você prefere evitar">
        <BuddyChipInput suggestions={AVOID} value={form.avoid_situations ?? []} onChange={(v) => set("avoid_situations", v)} placeholder="Adicionar outra..." />
      </QuestionCard>
      <QuestionCard title="Facilidade em pedir ajuda" hint="0 = muito difícil, 10 = super natural">
        <ScaleRow label="" value={form.ask_help_ease ?? 5} onChange={(v) => set("ask_help_ease", v)} colorClass="from-teal-400 to-emerald-500" />
      </QuestionCard>
    </>
  );
}

function SectionBuddy({ form, set, appendText, setAudio }: any) {
  return (
    <>
      <SectionHeader title="Como quer ser cuidada(o) pelo Buddy?" subtitle="Personalize como eu falo com você." />
      <Card>
        <CardHeader><CardTitle className="text-base">Tom preferido</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <MoodChip key={t.key} active={form.preferred_tone === t.key} onClick={() => set("preferred_tone", t.key)} emoji={t.emoji} label={t.label} />
            ))}
          </div>
        </CardContent>
      </Card>
      <QuestionCard title="Melhor horário para lembretes" hint="Quando você tem calma para se ouvir.">
        <Input type="time" value={form.reminder_time ?? ""} onChange={(e) => set("reminder_time", e.target.value)} className="w-full max-w-[160px]" />
      </QuestionCard>
      <QuestionCard title="O que você quer que o Buddy entenda sobre você?" hint="Algo importante para eu te apoiar melhor.">
        <Textarea value={form.message_to_buddy ?? ""} onChange={(e) => set("message_to_buddy", e.target.value)} rows={5} maxLength={800} />
        <BuddyAudioAnswer fieldKey="message_to_buddy" onTranscribed={(t) => appendText("message_to_buddy", t)} onAudioUrl={(u) => setAudio("message_to_buddy", u)} />
      </QuestionCard>
    </>
  );
}

/* ---------- Building blocks ---------- */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-1 min-w-0 max-w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-tight [overflow-wrap:anywhere]">{title}</h2>
      <p className="text-xs sm:text-sm text-muted-foreground [overflow-wrap:anywhere]">{subtitle}</p>
    </div>
  );
}

function QuestionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0 max-w-full border-border/70 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 p-4 sm:p-6">
        <CardTitle className="text-base leading-tight flex items-center gap-2 [overflow-wrap:anywhere]">{title}</CardTitle>
        {hint && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{hint}</p>}
      </CardHeader>
      <CardContent className="space-y-2 p-4 sm:p-6 pt-0 sm:pt-0 min-w-0">{children}</CardContent>
    </Card>
  );
}

function MoodChip({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "max-w-full min-h-10 px-3 py-2 rounded-2xl border text-sm flex items-center gap-2 transition-all whitespace-normal text-left [overflow-wrap:anywhere]",
        active ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" : "bg-card hover:bg-primary/10 border-border/70"
      )}
    >
      <span aria-hidden className="text-base shrink-0">{emoji}</span> <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
    </button>
  );
}

function ScaleRow({ label, value, onChange, colorClass }: { label: string; value: number; onChange: (v: number) => void; colorClass?: string }) {
  return (
    <div className="space-y-2 min-w-0 max-w-full">
      {label && (
        <div className="flex min-w-0 justify-between gap-3 text-sm">
          <Label className="min-w-0 [overflow-wrap:anywhere]">{label}</Label>
          <span className={cn("font-semibold bg-clip-text text-transparent bg-gradient-to-r", colorClass ?? "from-primary to-primary")}>{value}/10</span>
        </div>
      )}
      <Slider min={0} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}


function ProgressHeader({ progress }: { progress: number }) {
  return (
    <div className="mb-4 rounded-2xl bg-card border border-border/70 p-3 sm:p-4 min-w-0">
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm mb-2">
        <span className="text-muted-foreground">Retrato completo</span>
        <span className="font-semibold text-primary">{progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function SectionStepper({ current, onChange, progress }: { current: SectionId; onChange: (s: SectionId) => void; progress: number }) {
  return (
    <div className="flex max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 -mx-1 px-1 snap-x scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {SECTIONS.map((s) => {
        const active = s.id === current;
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "shrink-0 snap-start flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border transition-all whitespace-nowrap",
              active
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card hover:bg-primary/10 border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Progress ---------- */

function computeProgress(f: Partial<BuddyPortrait>): number {
  const checks: boolean[] = [
    !!f.current_mood,
    (f.anxiety ?? null) !== null,
    (f.sadness ?? null) !== null,
    (f.motivation ?? null) !== null,
    (f.energy_level ?? null) !== null,
    (f.sleep_quality ?? null) !== null,
    (f.stress_level ?? null) !== null,
    !!f.mind_on,
    (f.values_list ?? []).length > 0,
    (f.strengths_self ?? []).length > 0,
    (f.three_words ?? []).length > 0,
    (f.wants_to_improve ?? []).length > 0,
    !!f.dreams,
    !!f.next_3_months,
    !!f.biggest_challenge,
    !!f.calms_me,
    !!f.support_people,
    (f.self_care_rituals ?? []).length > 0,
    (f.hobbies ?? []).length > 0,
    (f.triggers ?? []).length > 0,
    (f.avoid_situations ?? []).length > 0,
    (f.ask_help_ease ?? null) !== null,
    !!f.preferred_tone,
    !!f.reminder_time,
    !!f.message_to_buddy,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
