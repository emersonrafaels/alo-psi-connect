import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Heart,
  Home,
  LineChart,
  ListChecks,
  Plus,
  Sparkles,
  UserCircle2,
} from "lucide-react";

const moodOptions = [
  { label: "Muito ruim", emoji: "☹️", tone: "bg-rose-100 text-rose-500" },
  { label: "Ruim", emoji: "🙁", tone: "bg-orange-100 text-orange-500" },
  { label: "Neutro", emoji: "😐", tone: "bg-amber-100 text-amber-500" },
  { label: "Bem", emoji: "🙂", tone: "bg-emerald-100 text-emerald-500" },
  { label: "Muito bem", emoji: "😄", tone: "bg-teal-100 text-teal-500" },
];

const stats = [
  { title: "Humor médio", value: "4,5/5", subtitle: "↑ 12% desde o mês passado", icon: "😊" },
  { title: "Total de entradas", value: "3", subtitle: "esta semana", icon: "🗓️" },
  { title: "Mais recorrente", value: "Tranquilo", subtitle: "(2x)", icon: "📊" },
  { title: "Emoção predominante", value: "Gratidão", subtitle: "nos últimos 7 dias", icon: "💗" },
];

const history = [
  { date: "12 Ago", day: "Ter", mood: "Muito bem", note: "Hoje foi um dia produtivo e me senti bem com minhas conquistas.", tags: ["Gratidão", "Tranquilidade"], tone: "border-emerald-400" },
  { date: "10 Ago", day: "Dom", mood: "Bem", note: "Consegui resolver algumas pendências e isso me deixou aliviado.", tags: ["Alegria", "Esperança"], tone: "border-emerald-300" },
  { date: "08 Ago", day: "Sex", mood: "Neutro", note: "Dia puxado, mas consegui me organizar no final.", tags: ["Cansaço", "Ansiedade"], tone: "border-amber-300" },
  { date: "05 Ago", day: "Ter", mood: "Ruim", note: "Tive algumas dificuldades no trabalho e me senti sobrecarregado.", tags: ["Tristeza", "Estresse"], tone: "border-rose-300" },
];

const improvements = [
  "Visual mais limpo e moderno",
  "Resumo rápido do seu bem-estar",
  "Registro de forma simples e intuitiva",
  "Histórico com filtros por data",
  "Tags para emoções e acontecimentos",
  "Layout responsivo (desktop e mobile)",
  "Ilustrações e feedbacks visuais",
  "Mais foco na sua jornada de autocuidado",
];

const DesktopShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#f5f7ff] p-4 md:p-6">
    <div className="mx-auto max-w-[1240px] overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-[#4b2ca0] px-5 py-4 text-white">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-cyan-200" />
          bem-estar
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>Início</span>
          <span className="font-semibold underline underline-offset-8">Diário Emocional</span>
          <span>Relatórios</span>
          <span>Recursos</span>
          <Bell className="h-4 w-4" />
          <UserCircle2 className="h-5 w-5" />
        </div>
      </div>
      {children}
    </div>
  </div>
);

export const HiddenMoodDiaryPrototypeHome = () => (
  <DesktopShell>
    <div className="grid md:grid-cols-[190px_1fr]">
      <aside className="border-r bg-[#fbfcff] p-4 text-sm text-[#2d4570]">
        <div className="space-y-2">
          <div className="rounded-lg bg-[#ece8ff] px-3 py-2 font-medium">Diário Emocional</div>
          <div className="px-3 py-2">Resumo</div>
          <div className="px-3 py-2">Histórico</div>
          <div className="px-3 py-2">Configurações</div>
        </div>
      </aside>
      <main className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-[#112c6b]">Diário Emocional</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#426198]">Acompanhe seu bem-estar emocional diariamente e descubra padrões que podem melhorar sua qualidade de vida.</p>
          </div>
          <button className="rounded-xl bg-[#5d35c3] px-5 py-2.5 text-sm font-semibold text-white">+ Registrar novo dia</button>
        </div>
        <div className="grid gap-3 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#e8eefe] bg-white p-4">
              <p className="text-xl">{item.icon}</p>
              <p className="mt-2 text-sm text-[#35537f]">{item.title}</p>
              <p className="mt-1 text-3xl font-bold text-[#112c6b]">{item.value}</p>
              <p className="mt-1 text-xs text-[#4f85a9]">{item.subtitle}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border border-[#e8eefe] p-4">
            <p className="text-xl font-semibold text-[#112c6b]">Como você está se sentindo hoje?</p>
            <p className="mb-4 text-sm text-[#426198]">Selecione o que melhor descreve seu estado emocional no momento.</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {moodOptions.map((mood) => (
                <div key={mood.label} className="text-center">
                  <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl ${mood.tone}`}>{mood.emoji}</div>
                  <p className="mt-2 text-sm text-[#2d4570]">{mood.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid place-items-center rounded-2xl bg-gradient-to-br from-[#f4f7ff] to-[#eef0ff] p-6 text-center text-[#315186]">
            <div>
              <Heart className="mx-auto mb-3 h-8 w-8 text-[#4f47cc]" />
              <p className="text-2xl">🌿</p>
              <p className="mt-2 italic">“Cuidar da sua saúde emocional também é uma forma de se cuidar.”</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </DesktopShell>
);

export const HiddenMoodDiaryPrototypeNewEntry = () => (
  <div className="min-h-screen bg-[#f5f7ff] p-4 md:p-8">
    <div className="mx-auto max-w-[600px] overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-[#4b2ca0] px-4 py-3 text-white">
        <div className="flex items-center gap-2 text-base font-semibold"><Sparkles className="h-4 w-4 text-cyan-200" />bem-estar</div>
        <div className="flex items-center gap-2"><Bell className="h-4 w-4" /><UserCircle2 className="h-5 w-5" /></div>
      </div>
      <div className="space-y-4 p-4">
        <button className="text-sm text-[#466db1]">← Voltar</button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#f1edff] p-2 text-[#5d35c3]"><CalendarDays className="h-5 w-5" /></div>
          <div><h2 className="text-2xl font-bold text-[#112c6b]">Novo registro</h2><p className="text-sm text-[#426198]">Conte como você está se sentindo hoje.</p></div>
        </div>
        <div className="space-y-3 rounded-xl border p-4">
          <p className="text-sm font-semibold text-[#112c6b]">Como você está se sentindo hoje?</p>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {moodOptions.map((mood) => (
              <div key={mood.label}>
                <div className={`mx-auto grid h-11 w-11 place-items-center rounded-full text-lg ${mood.tone}`}>{mood.emoji}</div>
                <span>{mood.label}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[#112c6b]">Emoções principais (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {["Ansiedade", "Tranquilidade", "Alegria"].map((tag) => (
                <span key={tag} className="rounded-full bg-[#f3f5ff] px-3 py-1 text-xs text-[#315186]">{tag}</span>
              ))}
              <span className="rounded-full border px-3 py-1 text-xs text-[#7e93bd]">Selecione ou adicione...</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-[#112c6b]">O que aconteceu hoje? (opcional)</p>
            <textarea className="min-h-20 w-full rounded-lg border p-2 text-sm" placeholder="Ex.: algo que te deixou bem, desafiador, importante..." />
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-[#112c6b]">Observações (opcional)</p>
            <textarea className="min-h-20 w-full rounded-lg border p-2 text-sm" placeholder="Anote algo que ache importante..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 pb-1">
          <button className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#4f47cc]">Cancelar</button>
          <button className="rounded-lg bg-[#5d35c3] px-5 py-2 text-sm font-semibold text-white">Salvar</button>
        </div>
      </div>
    </div>
  </div>
);

export const HiddenMoodDiaryPrototypeHistory = () => (
  <DesktopShell>
    <div className="grid md:grid-cols-[190px_1fr]">
      <aside className="border-r bg-[#fbfcff] p-4 text-sm text-[#2d4570]">
        <div className="space-y-2">
          <div className="px-3 py-2">Diário Emocional</div>
          <div className="px-3 py-2">Resumo</div>
          <div className="rounded-lg bg-[#ece8ff] px-3 py-2 font-medium">Histórico</div>
          <div className="px-3 py-2">Configurações</div>
        </div>
      </aside>
      <main className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-4xl font-bold text-[#112c6b]">Histórico do Diário Emocional</h3>
            <p className="text-sm text-[#426198]">Veja todos os seus registros e acompanhe sua evolução ao longo do tempo.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#2d4570]">
            <CalendarDays className="h-4 w-4" />
            Últimos 30 dias
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        {history.map((entry) => (
          <div key={`${entry.date}-${entry.mood}`} className={`rounded-xl border border-l-4 ${entry.tone} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-center text-sm font-semibold text-[#315186]">
                  <p>{entry.date.split(" ")[0]}</p>
                  <p>{entry.date.split(" ")[1]}</p>
                  <p className="text-xs font-normal">{entry.day}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#112c6b]">{entry.mood}</p>
                  <p className="text-sm text-[#426198]">{entry.note}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#f3f5ff] px-2 py-0.5 text-xs text-[#315186]">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="text-sm font-medium text-[#5d35c3]">Ver detalhes →</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  </DesktopShell>
);

export const HiddenMoodDiaryPrototypeMobile = () => (
  <div className="min-h-screen bg-[#f5f7ff] p-4 md:p-8">
    <div className="mx-auto max-w-[340px] overflow-hidden rounded-[34px] border bg-white shadow-sm">
      <div className="bg-[#4b2ca0] px-4 py-3 text-white">
        <div className="flex items-center justify-between text-sm">
          <span>9:41</span>
          <div className="flex items-center gap-2"><Bell className="h-4 w-4" /><UserCircle2 className="h-5 w-5" /></div>
        </div>
        <p className="mt-1 font-semibold">bem-estar</p>
      </div>
      <div className="space-y-3 p-4 text-xs">
        <h4 className="text-xl font-bold text-[#112c6b]">Diário Emocional</h4>
        <div className="grid grid-cols-2 gap-2 rounded-lg border p-2 text-[#315186]">
          <div>Humor médio <p className="text-base font-bold text-[#112c6b]">4,5/5</p></div>
          <div>Total de entradas <p className="text-base font-bold text-[#112c6b]">3</p></div>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-sm font-semibold text-[#112c6b]">Como você está se sentindo hoje?</p>
          <div className="grid grid-cols-5 gap-1 text-center">
            {moodOptions.map((mood) => (
              <div key={mood.label}>
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-xs ${mood.tone}`}>{mood.emoji}</div>
                <span className="text-[10px] text-[#315186]">{mood.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full rounded-lg bg-[#5d35c3] py-2 text-xs font-semibold text-white">+ Registrar novo dia</button>
        </div>
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#112c6b]">
            <span>Últimos registros</span><span className="text-[#5d35c3]">Ver todos</span>
          </div>
          <div className="space-y-2 text-[#315186]">
            <div className="flex items-center justify-between"><span>12 Ago · Muito bem</span><span>›</span></div>
            <div className="flex items-center justify-between"><span>10 Ago · Bem</span><span>›</span></div>
            <div className="flex items-center justify-between"><span>08 Ago · Neutro</span><span>›</span></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 border-t pt-2 text-center text-[#315186]">
          <div><Home className="mx-auto h-4 w-4" />Início</div>
          <div><Plus className="mx-auto h-4 w-4" />Diário</div>
          <div><LineChart className="mx-auto h-4 w-4" />Relat.</div>
          <div><ListChecks className="mx-auto h-4 w-4" />Mais</div>
        </div>
      </div>
    </div>
  </div>
);

export const HiddenMoodDiaryPrototypeImprovements = () => (
  <div className="min-h-screen bg-[#f5f7ff] p-4 md:p-8">
    <div className="mx-auto max-w-[560px] rounded-3xl border bg-gradient-to-br from-[#f4f6ff] to-[#f0f2ff] p-6 shadow-sm">
      <h1 className="mb-4 flex items-center gap-2 text-4xl font-bold text-[#39229b]">
        <Heart className="h-7 w-7" />
        Principais melhorias
      </h1>
      <ul className="space-y-3 text-[#3f5f94]">
        {improvements.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#7e5cdf]" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-right text-3xl italic text-[#4f47cc]">Seu bem-estar importa!</p>
    </div>
  </div>
);

const HiddenMoodDiaryPrototype = HiddenMoodDiaryPrototypeHome;

export default HiddenMoodDiaryPrototype;
