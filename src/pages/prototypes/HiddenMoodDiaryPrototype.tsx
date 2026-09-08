import { useState } from "react";
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
  Trash2,
  Check,
  Edit,
} from "lucide-react";
import { Link } from "react-router-dom";

const hiddenMoodDiaryRoutes = {
  home: "/__hidden/prototipo-diario-emocional",
  newEntry: "/__hidden/prototipo-diario-emocional/novo-registro",
  history: "/__hidden/prototipo-diario-emocional/historico",
  settings: "/__hidden/prototipo-diario-emocional/configuracoes",
  mobile: "/__hidden/prototipo-diario-emocional/mobile",
  improvements: "/__hidden/prototipo-diario-emocional/melhorias",
};

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
  {
    date: "12 Ago",
    day: "Ter",
    mood: "Muito bem",
    moodEmoji: "😄",
    moodValue: "9/10",
    note: "Hoje foi um dia produtivo e me senti bem com minhas conquistas.",
    tags: ["Gratidão", "Tranquilidade"],
    tone: "border-emerald-400",
    emotions: [
      { name: "Alegria", emoji: "😊", value: "9/10" },
      { name: "Tranquilidade", emoji: "😌", value: "8/10" },
      { name: "Gratidão", emoji: "💚", value: "9/10" },
      { name: "Esperança", emoji: "🌱", value: "8/10" },
    ],
    sleep: {
      hours: "8h",
      quality: "5/5",
    },
    analysis: {
      risk: "Baixo risco",
      riskTone: "bg-emerald-50 text-emerald-600",
      message:
        "Seu registro indica um estado emocional positivo e estável.",
      buddy:
        "Que bom perceber que você está se sentindo bem com suas conquistas. Continue valorizando esses pequenos momentos.",
    },
  },

  {
    date: "10 Ago",
    day: "Dom",
    mood: "Bem",
    moodEmoji: "🙂",
    moodValue: "8/10",
    note: "Consegui resolver algumas pendências e isso me deixou aliviado.",
    tags: ["Alegria", "Esperança"],
    tone: "border-emerald-300",
    emotions: [
      { name: "Alegria", emoji: "😊", value: "8/10" },
      { name: "Esperança", emoji: "🌱", value: "8/10" },
      { name: "Tranquilidade", emoji: "😌", value: "7/10" },
    ],
    sleep: {
      hours: "7h30",
      quality: "4/5",
    },
    analysis: {
      risk: "Baixo risco",
      riskTone: "bg-emerald-50 text-emerald-600",
      message:
        "O registro demonstra uma percepção positiva do dia e sensação de alívio.",
      buddy:
        "Resolver aquilo que estava pendente pode trazer uma sensação enorme de alívio. Aproveite esse momento.",
    },
  },

  {
    date: "08 Ago",
    day: "Sex",
    mood: "Neutro",
    moodEmoji: "😐",
    moodValue: "5/10",
    note: "Dia puxado, mas consegui me organizar no final.",
    tags: ["Cansaço", "Ansiedade"],
    tone: "border-amber-300",
    emotions: [
      { name: "Cansaço", emoji: "😴", value: "7/10" },
      { name: "Ansiedade", emoji: "😟", value: "6/10" },
      { name: "Foco", emoji: "🎯", value: "7/10" },
      { name: "Tranquilidade", emoji: "😌", value: "4/10" },
      { name: "Esperança", emoji: "🌱", value: "6/10" },
    ],
    sleep: {
      hours: "6h",
      quality: "3/5",
    },
    analysis: {
      risk: "Atenção",
      riskTone: "bg-amber-50 text-amber-600",
      message:
        "Foram identificados sinais de cansaço e ansiedade, apesar da organização ao final do dia.",
      buddy:
        "Parece que hoje exigiu bastante de você. Mesmo assim, você conseguiu se organizar. Isso também é uma conquista.",
    },
  },

  {
    date: "05 Ago",
    day: "Ter",
    mood: "Ruim",
    moodEmoji: "🙁",
    moodValue: "3/10",
    note: "Tive algumas dificuldades no trabalho e me senti sobrecarregado.",
    tags: ["Tristeza", "Estresse"],
    tone: "border-rose-300",
    emotions: [
      { name: "Tristeza", emoji: "😢", value: "6/10" },
      { name: "Estresse", emoji: "😣", value: "8/10" },
      { name: "Ansiedade", emoji: "😟", value: "7/10" },
      { name: "Cansaço", emoji: "😴", value: "8/10" },
    ],
    sleep: {
      hours: "5h30",
      quality: "2/5",
    },
    analysis: {
      risk: "Atenção",
      riskTone: "bg-amber-50 text-amber-600",
      message:
        "O registro apresenta sinais de sobrecarga emocional associados às dificuldades no trabalho.",
      buddy:
        "Você parece ter passado por um dia bastante pesado. Talvez seja importante reservar um momento para descansar e cuidar de você.",
    },
  },
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

const settingsSections = [
  { title: "Privacidade", description: "Defina quem pode visualizar seus registros emocionais.", status: "Somente você" },
  { title: "Lembretes", description: "Escolha os horários para receber lembretes diários.", status: "08:00 e 20:00" },
  { title: "Exportar histórico", description: "Baixe um relatório com seus registros por período.", status: "Últimos 30 dias" },
  { title: "Categorias de emoções", description: "Personalize as emoções e tags disponíveis no diário.", status: "12 categorias ativas" },
];

type SidebarSection = "diary" | "summary" | "history" | "settings";

const sidebarItems: { label: string; route: string; key: SidebarSection }[] = [
  { label: "Diário Emocional", route: hiddenMoodDiaryRoutes.home, key: "diary" },
  { label: "Histórico", route: hiddenMoodDiaryRoutes.history, key: "history" },
  { label: "Configurações", route: hiddenMoodDiaryRoutes.settings, key: "settings" },
];

const SidebarNavigation = ({ active }: { active: SidebarSection }) => (
  <aside className="border-r bg-[#fbfcff] p-4 text-sm text-[#2d4570]">
    <div className="space-y-2">
      {sidebarItems.map((item) => (
        <Link
          key={item.key}
          to={item.route}
          className={`block rounded-lg px-3 py-2 ${item.key === active ? "bg-[#ece8ff] font-medium" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  </aside>
);

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
      <SidebarNavigation active="diary" />
      <main className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-[#112c6b]">Diário Emocional</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#426198]">Acompanhe seu bem-estar emocional diariamente e descubra padrões que podem melhorar sua qualidade de vida.</p>
          </div>
          <Link to={hiddenMoodDiaryRoutes.newEntry} className="rounded-xl bg-[#5d35c3] px-5 py-2.5 text-sm font-semibold text-white">+ Registrar novo dia</Link>
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
        <Link to={hiddenMoodDiaryRoutes.home} className="inline-block text-sm text-[#466db1]">← Voltar</Link>
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
          <Link to={hiddenMoodDiaryRoutes.home} className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#4f47cc]">Cancelar</Link>
          <Link to={hiddenMoodDiaryRoutes.history} className="rounded-lg bg-[#5d35c3] px-5 py-2 text-sm font-semibold text-white">Salvar</Link>
        </div>
      </div>
    </div>
  </div>
);

export const HiddenMoodDiaryPrototypeHistory = () => {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  return (
    <DesktopShell>
      <div className="grid md:grid-cols-[190px_1fr]">
        <SidebarNavigation active="history" />

        <main className="space-y-5 p-5">

          {/* Cabeçalho */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-4xl font-bold text-[#112c6b]">
                Histórico do Diário Emocional
              </h3>

              <p className="mt-1 text-sm text-[#426198]">
                Veja seus registros e acompanhe sua evolução ao longo do tempo.
              </p>
            </div>

            <button className="inline-flex items-center gap-2 rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-sm font-medium text-[#2d4570]">
              <CalendarDays className="h-4 w-4" />
              Últimos 30 dias
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Resumo */}
          <div className="grid gap-3 sm:grid-cols-3">

            <div className="rounded-2xl border border-[#e8eefe] bg-white p-4">
              <p className="text-xs text-[#6d82a6]">
                Registros
              </p>

              <p className="mt-1 text-2xl font-bold text-[#112c6b]">
                4
              </p>

              <p className="mt-1 text-xs text-[#426198]">
                últimos 30 dias
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8eefe] bg-white p-4">
              <p className="text-xs text-[#6d82a6]">
                Humor médio
              </p>

              <p className="mt-1 text-2xl font-bold text-[#112c6b]">
                6,3/10
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                ↑ tendência positiva
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8eefe] bg-white p-4">
              <p className="text-xs text-[#6d82a6]">
                Emoção recorrente
              </p>

              <p className="mt-1 text-2xl font-bold text-[#112c6b]">
                Gratidão
              </p>

              <p className="mt-1 text-xs text-[#426198]">
                presente em 2 registros
              </p>
            </div>
          </div>

          {/* Histórico */}
          <div className="space-y-3">

            {history.map((entry) => {
              const isExpanded =
                expandedEntry === `${entry.date}-${entry.mood}`;

              return (
                <div
                  key={`${entry.date}-${entry.mood}`}
                  className={`rounded-2xl border border-[#e3e8f2] border-l-4 ${entry.tone} bg-white transition`}
                >

                  {/* Registro */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 items-start gap-4">

                        {/* Data */}
                        <div className="min-w-[58px] text-center text-[#315186]">
                          <p className="text-sm font-bold">
                            {entry.date.split(" ")[0]}
                          </p>

                          <p className="text-xs font-semibold uppercase">
                            {entry.date.split(" ")[1]}
                          </p>

                          <p className="mt-1 text-xs font-normal">
                            {entry.day}
                          </p>
                        </div>

                        <div className="h-16 w-px bg-[#e7ebf3]" />

                        {/* Conteúdo */}
                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xl">
                              {entry.moodEmoji}
                            </span>

                            <p className="font-semibold text-[#112c6b]">
                              {entry.mood}
                            </p>

                            <span className="rounded-full bg-[#f1edff] px-2 py-0.5 text-xs font-semibold text-[#5d35c3]">
                              {entry.moodValue}
                            </span>
                          </div>

                          <p className="mt-1 text-sm leading-5 text-[#426198]">
                            {entry.note}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#f3f5ff] px-2.5 py-1 text-xs text-[#315186]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Botão */}
                      <button
                        onClick={() =>
                          setExpandedEntry(
                            isExpanded
                              ? null
                              : `${entry.date}-${entry.mood}`
                          )
                        }
                        className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#5d35c3] hover:text-[#4323a1]"
                      >
                        {isExpanded
                          ? "Ocultar"
                          : "Ver detalhes"}

                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Detalhes */}
                  {isExpanded && (
                    <div className="border-t border-[#edf0f6] bg-[#fafbff] px-4 pb-4 pt-4">

                      <div className="grid gap-4 lg:grid-cols-2">

                        {/* Dimensões emocionais */}
                        <div className="rounded-xl border border-[#e5e9f3] bg-white p-4">

                          <h4 className="mb-3 text-sm font-semibold text-[#112c6b]">
                            Dimensões emocionais
                          </h4>

                          <div className="grid grid-cols-2 gap-3">
                            {entry.emotions.map((emotion) => (
                              <div
                                key={emotion.name}
                                className="flex items-center gap-2"
                              >
                                <span className="text-lg">
                                  {emotion.emoji}
                                </span>

                                <div>
                                  <p className="text-xs text-[#6d82a6]">
                                    {emotion.name}
                                  </p>

                                  <p className="text-sm font-semibold text-[#315186]">
                                    {emotion.value}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sono */}
                        <div className="rounded-xl border border-[#e5e9f3] bg-white p-4">

                          <h4 className="mb-3 text-sm font-semibold text-[#112c6b]">
                            Sono
                          </h4>

                          <div className="grid grid-cols-2 gap-3">

                            <div>
                              <p className="text-xs text-[#6d82a6]">
                                Horas de sono
                              </p>

                              <p className="mt-1 font-semibold text-[#315186]">
                                😴 {entry.sleep.hours}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[#6d82a6]">
                                Qualidade
                              </p>

                              <p className="mt-1 font-semibold text-[#315186]">
                                ⭐ {entry.sleep.quality}
                              </p>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* Análise */}
                      <div className="mt-4 rounded-xl border border-[#ddd8fa] bg-[#f8f6ff] p-4">

                        <div className="flex flex-wrap items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#5d35c3]" />

                          <p className="text-sm font-semibold text-[#112c6b]">
                            Análise Medcos Track
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.analysis.riskTone}`}
                          >
                            {entry.analysis.risk}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#426198]">
                          {entry.analysis.message}
                        </p>
                      </div>

                      {/* Buddy */}
                      <div className="mt-3 rounded-xl border-l-4 border-[#7b61d9] bg-white p-4">

                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#5d35c3]" />

                          <p className="text-xs font-semibold text-[#5d35c3]">
                            Mensagem do Buddy
                          </p>
                        </div>

                        <p className="mt-2 text-sm italic leading-6 text-[#426198]">
                          “{entry.analysis.buddy}”
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="mt-4 flex justify-end gap-2">

                        <button className="inline-flex items-center gap-2 rounded-lg border border-[#dfe4ef] bg-white px-3 py-2 text-xs font-semibold text-[#426198]">
                          <Edit className="h-3.5 w-3.5" />
                          Editar
                        </button>

                        <button className="inline-flex items-center gap-2 rounded-lg border border-[#f0d8dc] bg-white px-3 py-2 text-xs font-semibold text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </main>
      </div>
    </DesktopShell>
  );
};

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
          <Link to={hiddenMoodDiaryRoutes.newEntry} className="mt-3 block w-full rounded-lg bg-[#5d35c3] py-2 text-center text-xs font-semibold text-white">+ Registrar novo dia</Link>
        </div>
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#112c6b]">
            <span>Últimos registros</span><Link to={hiddenMoodDiaryRoutes.history} className="text-[#5d35c3]">Ver todos</Link>
          </div>
          <div className="space-y-2 text-[#315186]">
            <div className="flex items-center justify-between"><span>12 Ago · Muito bem</span><span>›</span></div>
            <div className="flex items-center justify-between"><span>10 Ago · Bem</span><span>›</span></div>
            <div className="flex items-center justify-between"><span>08 Ago · Neutro</span><span>›</span></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 border-t pt-2 text-center text-[#315186]">
          <Link to={hiddenMoodDiaryRoutes.home}><Home className="mx-auto h-4 w-4" />Início</Link>
          <Link to={hiddenMoodDiaryRoutes.newEntry}><Plus className="mx-auto h-4 w-4" />Diário</Link>
          <Link to={hiddenMoodDiaryRoutes.history}><LineChart className="mx-auto h-4 w-4" />Relat.</Link>
          <Link to={hiddenMoodDiaryRoutes.improvements}><ListChecks className="mx-auto h-4 w-4" />Mais</Link>
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

export const HiddenMoodDiaryPrototypeSettings = () => {
  const emotionTemplates = [
    {
      title: "Básico",
      description: "3 emoções essenciais",
      emotions: ["Alegria", "Tranquilidade", "Ansiedade"],
      active: false,
    },
    {
      title: "Avançado",
      description: "6 emoções para uma análise mais profunda",
      emotions: ["Alegria", "Ansiedade", "Tranquilidade", "Estresse", "Cansaço", "Esperança"],
      active: true,
    },
    {
      title: "Bem-estar",
      description: "5 emoções focadas no seu bem-estar",
      emotions: ["Gratidão", "Calma", "Alegria", "Confiança", "Relaxamento"],
      active: false,
    },
    {
      title: "Completo",
      description: "12 emoções para uma análise completa",
      emotions: [
        "Alegria",
        "Ansiedade",
        "Tranquilidade",
        "Estresse",
        "Cansaço",
        "Esperança",
        "Gratidão",
        "Calma",
        "Confiança",
        "Relaxamento",
        "Motivação",
        "Foco",
      ],
      active: false,
    },
  ];

  const emotions = [
    {
      name: "Tranquilidade",
      description: "Sensação de calma e equilíbrio",
      emoji: "😌",
      color: "bg-emerald-50 text-emerald-600",
      enabled: true,
    },
    {
      name: "Ansiedade",
      description: "Sensação de preocupação ou inquietação",
      emoji: "😟",
      color: "bg-orange-50 text-orange-600",
      enabled: true,
    },
    {
      name: "Alegria",
      description: "Sensação de felicidade e satisfação",
      emoji: "😊",
      color: "bg-yellow-50 text-yellow-600",
      enabled: true,
    },
    {
      name: "Gratidão",
      description: "Reconhecimento por experiências positivas",
      emoji: "💚",
      color: "bg-teal-50 text-teal-600",
      enabled: true,
    },
    {
      name: "Estresse",
      description: "Sensação de pressão ou sobrecarga",
      emoji: "😣",
      color: "bg-rose-50 text-rose-600",
      enabled: false,
    },
  ];

  return (
    <DesktopShell>
      <div className="grid md:grid-cols-[190px_1fr]">
        <SidebarNavigation active="settings" />

        <main className="space-y-6 p-5 md:p-7">
          {/* Cabeçalho */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-medium text-[#6d72a8]">
                Diário Emocional
              </p>

              <h1 className="text-3xl font-bold text-[#112c6b]">
                Configurar emoções
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#426198]">
                Personalize as emoções que aparecem no seu diário e escolha
                como você deseja acompanhar seu bem-estar.
              </p>
            </div>

            <button className="rounded-xl bg-[#5d35c3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4f2eb0]">
              + Nova emoção
            </button>
          </div>

          {/* Status atual */}
          <section className="rounded-2xl border border-[#ddd8fa] bg-gradient-to-r from-[#f5f2ff] to-[#f8faff] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9e3ff] text-[#5d35c3]">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7469b0]">
                    Configuração atual
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#112c6b]">
                    Template Avançado
                  </h2>

                  <p className="text-sm text-[#426198]">
                    6 emoções selecionadas para acompanhar sua rotina.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#5d35c3] shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
                Ativo
              </span>
            </div>
          </section>

          {/* Templates */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#112c6b]">
                Escolha um modelo
              </h2>

              <p className="text-sm text-[#426198]">
                Comece rapidamente com uma configuração pronta.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {emotionTemplates.map((template) => (
                <button
                  key={template.title}
                  className={`relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    template.active
                      ? "border-[#6c4bdc] bg-[#f7f4ff] ring-1 ring-[#6c4bdc]/20"
                      : "border-[#e3e8f7] bg-white hover:border-[#cbd3ef]"
                  }`}
                >
                  {template.active && (
                    <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#5d35c3] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}

                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#f0edff] text-[#5d35c3]">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <h3 className="font-semibold text-[#112c6b]">
                    {template.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#426198]">
                    {template.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.emotions.slice(0, 3).map((emotion) => (
                      <span
                        key={emotion}
                        className="rounded-full bg-[#f3f5ff] px-2 py-1 text-[10px] text-[#526a9c]"
                      >
                        {emotion}
                      </span>
                    ))}

                    {template.emotions.length > 3 && (
                      <span className="rounded-full bg-[#f3f5ff] px-2 py-1 text-[10px] text-[#526a9c]">
                        +{template.emotions.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Emoções */}
          <section className="rounded-2xl border border-[#e3e8f7] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f8] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#112c6b]">
                    Suas emoções
                  </h2>

                  <span className="rounded-full bg-[#f0edff] px-2.5 py-1 text-xs font-semibold text-[#5d35c3]">
                    4 ativas
                  </span>
                </div>

                <p className="mt-1 text-sm text-[#426198]">
                  Ative ou desative as emoções que deseja acompanhar.
                </p>
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg border border-[#d8def1] px-3 py-2 text-sm font-semibold text-[#315186] transition hover:bg-[#f7f8fc]">
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>

            <div className="divide-y divide-[#edf0f8]">
              {emotions.map((emotion) => (
                <div
                  key={emotion.name}
                  className="flex items-center gap-3 p-4 md:p-5"
                >
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${emotion.color}`}
                  >
                    {emotion.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#112c6b]">
                        {emotion.name}
                      </h3>

                      {emotion.enabled && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Ativa
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-[#6a7da6]">
                      {emotion.description}
                    </p>
                  </div>

                  <div
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      emotion.enabled ? "bg-[#5d35c3]" : "bg-[#d8deeb]"
                    }`}
                  >
                    <div
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        emotion.enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </div>

                  <button className="grid h-9 w-9 place-items-center rounded-lg text-[#8190ae] transition hover:bg-rose-50 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Configurações complementares */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#112c6b]">
                Outras configurações
              </h2>

              <p className="text-sm text-[#426198]">
                Ajustes complementares do seu diário.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e3e8f7] bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef5ff] text-[#4b72b7]">
                    <Bell className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-[#112c6b]">
                      Lembretes
                    </h3>

                    <p className="mt-1 text-sm text-[#6a7da6]">
                      Receba lembretes para registrar como você está se
                      sentindo.
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#526a9c]">
                        08:00 e 20:00
                      </span>

                      <span className="rounded-full bg-[#f0edff] px-2.5 py-1 text-xs font-semibold text-[#5d35c3]">
                        Ativo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e3e8f7] bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf8f7] text-[#339b93]">
                    <Heart className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-[#112c6b]">
                      Privacidade
                    </h3>

                    <p className="mt-1 text-sm text-[#6a7da6]">
                      Controle quem pode visualizar seus registros emocionais.
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#526a9c]">
                        Somente você
                      </span>

                      <button className="text-xs font-semibold text-[#5d35c3]">
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </DesktopShell>
  );
};

const HiddenMoodDiaryPrototype = HiddenMoodDiaryPrototypeHome;

export default HiddenMoodDiaryPrototype;
