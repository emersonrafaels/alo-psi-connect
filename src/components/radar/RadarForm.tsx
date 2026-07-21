import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Save, Sparkles } from 'lucide-react';
import {
  RADAR_STEPS,
  RESPONDENT_ROLES,
  INSTITUTION_TYPES,
  STUDENT_RANGES,
  SUPPORT_LEVELS,
  STRUCTURE_STATUS,
  INSTITUTIONAL_STRUCTURES,
  PAINS,
  ADAPTIVE_QUESTIONS,
  MATURITY_DIMENSIONS,
  URGENCY_LEVELS,
  SEGMENTED_LABELS,
  emptyAnswers,
  RadarAnswers,
  PainId,
} from '@/data/radarCatalog';
import { useSaveRadarDraft, useSubmitRadar } from '@/hooks/useInstitutionRadar';
import { useSubmitPublicRadar } from '@/hooks/usePublicRadar';
import { cn } from '@/lib/utils';

interface Props {
  institutionId?: string;
  institutionName: string;
  mode?: 'authenticated' | 'public';
  initial?: {
    id?: string;
    answers?: Partial<RadarAnswers>;
  };
  onSubmitted?: (id: string) => void;
  onPublicComplete?: (token: string) => void;
}

export function RadarForm({ institutionId, institutionName: initialName, mode = 'authenticated', initial, onSubmitted, onPublicComplete }: Props) {
  const isPublic = mode === 'public';
  const [stepIdx, setStepIdx] = useState(0);
  const [id, setId] = useState<string | undefined>(initial?.id);
  const [institutionName, setInstitutionName] = useState(initialName);
  const [website, setWebsite] = useState('');
  const [answers, setAnswers] = useState<RadarAnswers>(() => ({
    ...emptyAnswers(),
    ...(initial?.answers ?? {}),
    institution: { ...emptyAnswers().institution, ...(initial?.answers?.institution ?? {}) },
    respondent: { ...emptyAnswers().respondent, ...(initial?.answers?.respondent ?? {}) },
    structures: { ...emptyAnswers().structures, ...(initial?.answers?.structures ?? {}) },
    maturity: { ...emptyAnswers().maturity, ...(initial?.answers?.maturity ?? {}) },
  }));

  const save = useSaveRadarDraft();
  const submit = useSubmitRadar();
  const publicSubmit = useSubmitPublicRadar();

  const step = RADAR_STEPS[stepIdx];
  const progress = Math.round(((stepIdx + 1) / RADAR_STEPS.length) * 100);

  // Auto-save após mudanças (debounce simples) — apenas no modo autenticado
  useEffect(() => {
    if (isPublic || !institutionId) return;
    const t = setTimeout(() => {
      save.mutate(
        { id, institution_id: institutionId, answers, institution_name: institutionName },
        { onSuccess: (r: any) => { if (!id) setId(r.id); } }
      );
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  function update<K extends keyof RadarAnswers>(key: K, value: RadarAnswers[K]) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  function togglePain(p: PainId) {
    setAnswers(a => {
      const has = a.pains.includes(p);
      if (has) return { ...a, pains: a.pains.filter(x => x !== p) };
      if (a.pains.length >= 5) return a;
      return { ...a, pains: [...a.pains, p] };
    });
  }

  function validateStep(): string | null {
    switch (step.id) {
      case 'institution':
        if (!institutionName?.trim()) return 'Informe o nome da instituição.';
        if (!answers.institution.state) return 'Selecione o estado.';
        if (!answers.institution.type) return 'Selecione o tipo de instituição.';
        return null;
      case 'respondent':
        if (!answers.respondent.role) return 'Selecione seu papel.';
        return null;
      case 'pains':
        if (answers.pains.length < 2) return 'Escolha pelo menos 2 desafios.';
        return null;
      case 'priority':
        if (answers.pains.some(p => !answers.priorities[p])) return 'Defina urgência para cada desafio.';
        return null;
      case 'contact':
        if (!answers.respondent.name) return 'Informe seu nome.';
        if (!answers.respondent.email) return 'Informe um e-mail.';
        if (!answers.consent) return 'Confirme o consentimento LGPD.';
        return null;
    }
    return null;
  }

  async function handleNext() {
    const err = validateStep();
    if (err) return toast({ title: 'Verifique', description: err, variant: 'destructive' });
    if (stepIdx < RADAR_STEPS.length - 1) setStepIdx(stepIdx + 1);
    else handleSubmit();
  }

  async function handleSubmit() {
    if (isPublic) {
      const result = await publicSubmit.mutateAsync({
        answers,
        institution: {
          name: institutionName,
          type: answers.institution.type,
          city: answers.institution.city,
          state: answers.institution.state,
          website: website || undefined,
        },
      });
      onPublicComplete?.(result.token);
      return;
    }
    if (!institutionId) return;
    const saved = await save.mutateAsync({ id, institution_id: institutionId, answers, institution_name: institutionName });
    const savedId = (saved as any).id ?? id;
    if (!savedId) return;
    if (!id) setId(savedId);
    await submit.mutateAsync(savedId);
    onSubmitted?.(savedId);
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Etapa {stepIdx + 1} de {RADAR_STEPS.length}</div>
              <div className="text-lg font-semibold">{step.label}</div>
            </div>
            {!isPublic && (
              <Badge variant="outline" className="gap-1">
                <Save className="h-3 w-3" /> Rascunho salvo automaticamente
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" />
          <div className="hidden md:flex mt-4 gap-1 overflow-x-auto pb-1">
            {RADAR_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStepIdx(i)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border',
                  i === stepIdx ? 'bg-primary text-primary-foreground border-primary' :
                    i < stepIdx ? 'bg-primary/10 text-primary border-primary/30' :
                    'bg-muted text-muted-foreground border-border hover:bg-muted/70'
                )}
              >
                {i < stepIdx && <Check className="h-3 w-3 inline mr-1" />}
                {s.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {step.id === 'institution' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Nome da instituição</Label>
                <Input
                  value={institutionName}
                  disabled={!isPublic}
                  onChange={e => setInstitutionName(e.target.value)}
                  placeholder={isPublic ? 'Ex.: Universidade Modelo' : undefined}
                />
              </div>
              {isPublic && (
                <div className="md:col-span-2">
                  <Label>Site institucional <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
                </div>
              )}
              <div>
                <Label>Cidade</Label>
                <Input value={answers.institution.city ?? ''} onChange={e => update('institution', { ...answers.institution, city: e.target.value })} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={answers.institution.state ?? ''} onValueChange={v => update('institution', { ...answers.institution, state: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nº aproximado de alunos</Label>
                <Select value={answers.institution.students ?? ''} onValueChange={v => update('institution', { ...answers.institution, students: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{STUDENT_RANGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de instituição</Label>
                <Select value={answers.institution.type ?? ''} onValueChange={v => update('institution', { ...answers.institution, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{INSTITUTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Estrutura de apoio ao estudante</Label>
                <Select value={answers.institution.support ?? ''} onValueChange={v => update('institution', { ...answers.institution, support: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SUPPORT_LEVELS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Considere psicologia, psicopedagogia, assistência estudantil e núcleos de permanência.</p>
              </div>
            </div>
          )}

          {step.id === 'respondent' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Seu papel na instituição</Label>
                <Select value={answers.respondent.role ?? ''} onValueChange={v => update('respondent', { ...answers.respondent, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{RESPONDENT_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Área ou diretoria</Label>
                <Input value={answers.respondent.area ?? ''} onChange={e => update('respondent', { ...answers.respondent, area: e.target.value })} placeholder="Ex.: Diretoria de Ensino" />
              </div>
            </div>
          )}

          {step.id === 'structures' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Para cada estrutura, indique o estágio atual na sua instituição.</p>
              {INSTITUTIONAL_STRUCTURES.map(s => (
                <div key={s.id} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                    <Select
                      value={answers.structures[s.id] ?? 'Não sei informar'}
                      onValueChange={v => update('structures', { ...answers.structures, [s.id]: v })}
                    >
                      <SelectTrigger className="w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{STRUCTURE_STATUS.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step.id === 'pains' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-muted-foreground">Selecione de 2 a 5 desafios prioritários.</p>
                <Badge variant="outline">{answers.pains.length}/5 selecionados</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {PAINS.map(p => {
                  const sel = answers.pains.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePain(p.id)}
                      className={cn(
                        'text-left p-4 rounded-xl border-2 transition-all',
                        sel ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold">{p.title}</div>
                        {sel && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step.id === 'adaptive' && (
            <div className="space-y-6">
              {answers.pains.length === 0 && <p className="text-sm text-muted-foreground">Volte à etapa anterior e selecione desafios.</p>}
              {answers.pains.map(pid => {
                const q = ADAPTIVE_QUESTIONS[pid];
                const val = answers.adaptive[pid] ?? 50;
                return (
                  <div key={pid} className="p-4 rounded-lg border bg-muted/20">
                    <div className="mb-2">
                      <div className="font-semibold">{q.title}</div>
                      <div className="text-sm text-muted-foreground">{q.text}</div>
                    </div>
                    {q.type === 'scale' ? (
                      <div className="flex items-center gap-4">
                        <Slider value={[val]} min={0} max={100} step={5} onValueChange={([v]) => update('adaptive', { ...answers.adaptive, [pid]: v })} />
                        <div className="text-lg font-bold text-primary w-12 text-right">{val}</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SEGMENTED_LABELS.map((l, i) => {
                          const targets = [15, 40, 65, 90];
                          const active = Math.min(3, Math.floor(val / 26)) === i;
                          return (
                            <button
                              key={l}
                              type="button"
                              onClick={() => update('adaptive', { ...answers.adaptive, [pid]: targets[i] })}
                              className={cn(
                                'text-xs py-2 px-3 rounded-lg border transition-colors',
                                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'
                              )}
                            >
                              {l}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {step.id === 'maturity' && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Avalie de 0 a 100 a maturidade da instituição em cada dimensão.</p>
              {MATURITY_DIMENSIONS.map(d => {
                const v = answers.maturity[d.id] ?? 50;
                return (
                  <div key={d.id} className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.desc}</div>
                      </div>
                      <div className="text-2xl font-bold text-primary">{v}</div>
                    </div>
                    <Slider value={[v]} min={0} max={100} step={5} onValueChange={([nv]) => update('maturity', { ...answers.maturity, [d.id]: nv })} />
                  </div>
                );
              })}
            </div>
          )}

          {step.id === 'priority' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Defina a urgência de cada desafio selecionado.</p>
              {answers.pains.map((pid, i) => {
                const p = PAINS.find(x => x.id === pid);
                return (
                  <div key={pid} className="p-4 rounded-lg border flex items-center gap-4 flex-wrap">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-[180px] font-medium">{p?.title}</div>
                    <Select value={answers.priorities[pid] ?? ''} onValueChange={v => update('priorities', { ...answers.priorities, [pid]: v })}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Urgência" /></SelectTrigger>
                      <SelectContent>{URGENCY_LEVELS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}

          {step.id === 'contact' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Seu nome</Label>
                  <Input value={answers.respondent.name ?? ''} onChange={e => update('respondent', { ...answers.respondent, name: e.target.value })} />
                </div>
                <div>
                  <Label>E-mail institucional</Label>
                  <Input type="email" value={answers.respondent.email ?? ''} onChange={e => update('respondent', { ...answers.respondent, email: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Telefone ou WhatsApp <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input value={answers.respondent.phone ?? ''} onChange={e => update('respondent', { ...answers.respondent, phone: e.target.value })} />
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30 flex items-start gap-3">
                <Checkbox id="consent" checked={answers.consent} onCheckedChange={c => update('consent', Boolean(c))} />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  Concordo com o uso destas informações para gerar o diagnóstico e permitir contato da Rede Bem-Estar para apresentação da devolutiva, conforme a LGPD.
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStepIdx(Math.max(0, stepIdx - 1))} disabled={stepIdx === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <div className="text-xs text-muted-foreground hidden sm:block">
          {isPublic ? '' : save.isPending ? 'Salvando…' : id ? 'Salvo' : 'Não salvo ainda'}
        </div>
        <Button onClick={handleNext} disabled={submit.isPending || publicSubmit.isPending}>
          {stepIdx === RADAR_STEPS.length - 1 ? (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {(submit.isPending || publicSubmit.isPending) ? 'Gerando análise…' : 'Gerar diagnóstico'}
            </>
          ) : (
            <>Avançar <ArrowRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
