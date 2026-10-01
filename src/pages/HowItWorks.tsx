import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Accessibility,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Database,
  Flag,
  GraduationCap,
  Handshake,
  Heart,
  Leaf,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  Moon,
  Pencil,
  Rocket,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import BuddyCharacter from "@/components/hero/BuddyCharacter";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath, getTenantSlugFromPath } from "@/utils/tenantHelpers";
import heroImage from "@/assets/como-funciona-hero.jpg";

const journeySteps = [
  { Icon: Rocket, title: "Início", copy: "Boas-vindas e orientações da jornada", tone: "primary", dot: "bg-[hsl(var(--hiw-purple))]" },
  { Icon: CalendarDays, title: "Durante o semestre", copy: "Lembretes das escalas e conteúdos de apoio", tone: "pink", dot: "bg-[hsl(var(--hiw-pink))]" },
  { Icon: MessageCircle, title: "Check-ins", copy: "Mensagens de cuidado e acompanhamento", tone: "mint", dot: "bg-[hsl(var(--hiw-mint-strong))]" },
  { Icon: Users, title: "Momentos críticos", copy: "Suporte extra em períodos de maior desafio", tone: "primary", dot: "bg-[hsl(var(--hiw-violet))]" },
  { Icon: Flag, title: "Final do semestre", copy: "Fechamento e incentivo à continuidade", tone: "pink", dot: "bg-[hsl(var(--hiw-pink))]" },
] as const;

const messages = [
  { Icon: Bell, label: "Lembrete", text: "Oi! 👋\nEstá na hora de responder sua escala de bem-estar. É rapidinho e nos ajuda a cuidar melhor de você.", time: "10:00", tone: "pink" },
  { Icon: BarChart3, label: "Check-in", text: "Como você tem se sentido esta semana?\n\nSua saúde mental também importa. 💙", time: "14:22", tone: "mint" },
  { Icon: Check, label: "Convite", text: "Temos um novo conteúdo para você: Técnicas simples para reduzir a ansiedade.\n\nQue tal conferir? ✨", time: "09:15", tone: "primary" },
  { Icon: Heart, label: "Cuidado", text: "Lembre-se: você não está sozinho nessa!\n\nEstamos aqui para apoiar a sua jornada. 💜", time: "16:40", tone: "pink" },
] as const;

const scales = [
  { Icon: Leaf, code: "WHO-5", title: "Bem-estar geral", copy: "Avalia o bem-estar subjetivo nas últimas 2 semanas.", tone: "mint" },
  { Icon: Heart, code: "PHQ-9", title: "Sintomas depressivos", copy: "Rastreia sinais de depressão nas últimas 2 semanas.", tone: "pink" },
  { Icon: Brain, code: "GAD-7", title: "Sintomas de ansiedade", copy: "Avalia níveis de ansiedade nas últimas 2 semanas.", tone: "primary" },
  { Icon: Zap, code: "PSS-10", title: "Estresse percebido", copy: "Mede o nível de estresse nas últimas 2 semanas.", tone: "mint" },
  { Icon: Users, code: "MHC-SF", title: "Saúde mental positiva", copy: "Avalia o bem-estar emocional, social e psicológico.", tone: "pink" },
  { Icon: Moon, code: "ISI", title: "Qualidade do sono", copy: "Identifica sinais de insônia e qualidade do sono.", tone: "primary" },
] as const;

const supports = [
  { Icon: Heart, title: "Psicologia", copy: "Apoio emocional e desenvolvimento de habilidades socioemocionais.", tone: "pink" },
  { Icon: Brain, title: "Psiquiatria", copy: "Avaliação especializada e acompanhamento clínico, quando necessário.", tone: "primary" },
  { Icon: BookOpen, title: "Psicopedagógico", copy: "Estratégias para dificuldades de aprendizagem e organização dos estudos.", tone: "mint" },
  { Icon: User, title: "Mentoria", copy: "Orientação personalizada com profissionais experientes.", tone: "mint" },
  { Icon: Users, title: "Grupos", copy: "Encontros temáticos para troca de experiências e fortalecimento social.", tone: "pink" },
  { Icon: GraduationCap, title: "Tutoria acadêmica", copy: "Apoio no planejamento e nas demandas acadêmicas.", tone: "mint" },
  { Icon: Pencil, title: "Apoio pedagógico", copy: "Desenvolvimento de estratégias de estudo e autonomia.", tone: "pink" },
  { Icon: Handshake, title: "Serviço social", copy: "Orientação sobre direitos, benefícios e redes de apoio.", tone: "primary" },
  { Icon: Accessibility, title: "Acessibilidade", copy: "Recursos e adaptações para uma experiência acadêmica mais inclusiva.", tone: "mint" },
] as const;

const securityItems = [
  { Icon: LockKeyhole, title: "Anonimização de dados", copy: "As informações institucionais são sempre agregadas e sem identificação de pessoas.", tone: "primary" },
  { Icon: ShieldCheck, title: "Conformidade com a LGPD", copy: "Seguimos integralmente a Lei Geral de Proteção de Dados, com políticas claras e atualizadas.", tone: "pink" },
  { Icon: Database, title: "Infraestrutura segura", copy: "Dados protegidos com criptografia, controle de acesso e monitoramento contínuo.", tone: "mint" },
  { Icon: Users, title: "Governança e ética", copy: "Processos, equipes e parceiros comprometidos com o uso responsável e ético dos dados.", tone: "primary" },
] as const;

const toneClasses = {
  primary: "bg-[var(--rbe-primary-fixed)] text-[var(--rbe-primary)]",
  pink: "bg-[var(--rbe-secondary-fixed)] text-[var(--rbe-secondary)]",
  mint: "bg-[var(--rbe-tertiary-fixed)] text-[var(--rbe-on-tertiary-fixed)]",
};

// Wellbeing trend points (viewBox 600×200); the curve is drawn through them so the markers sit on the line.
const chartPoints: [number, number][] = [
  [0, 112], [70, 84], [175, 106], [270, 128], [370, 100], [470, 78], [540, 76], [600, 30],
];
const chartMarkers = [70, 175, 270, 370, 470, 540, 600];

const smoothPath = (points: [number, number][]) =>
  points.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [x0, y0] = points[i - 2] ?? points[i - 1];
    const [x1, y1] = points[i - 1];
    const [x3, y3] = points[i + 1] ?? [x, y];
    const c1 = [x1 + (x - x0) / 6, y1 + (y - y0) / 6];
    const c2 = [x - (x3 - x1) / 6, y - (y3 - y1) / 6];
    return `${d} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${x} ${y}`;
  }, "");

const chartLine = smoothPath(chartPoints);

const AccentTitle = ({ children, accent, className = "" }: { children: React.ReactNode; accent?: React.ReactNode; className?: string }) => (
  <h2 className={`text-3xl font-bold leading-[1.05] text-[var(--rbe-primary)] sm:text-4xl lg:text-[2.9rem] ${className}`}>
    {children}
    {accent ? <> <span className="text-[var(--rbe-secondary-container)]">{accent}</span></> : null}
  </h2>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--hiw-violet))]">{children}</p>
);

const IconBadge = ({ Icon, tone, size = "md" }: { Icon: React.ElementType; tone: keyof typeof toneClasses; size?: "sm" | "md" | "lg" }) => {
  const box = size === "lg" ? "h-[4.5rem] w-[4.5rem]" : size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const icon = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${box} ${toneClasses[tone]}`}>
      <Icon className={icon} strokeWidth={1.75} />
    </span>
  );
};

const ArrowBubble = ({ className = "" }: { className?: string }) => (
  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--rbe-primary-fixed)] text-[var(--rbe-primary)] transition-transform group-hover:translate-x-0.5 ${className}`}>
    <ArrowRight className="h-4 w-4" />
  </span>
);

const HowItWorks = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const tenantSlug = tenant?.slug || getTenantSlugFromPath(location.pathname);
  const path = (value: string) => buildTenantPath(tenantSlug, value);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `Como funciona | ${tenant?.name || "Rede Bem-Estar"}`;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content") ?? "";
    description?.setAttribute("content", "Conheça a jornada contínua de cuidado da Rede Bem-Estar, com escalas, Diário Emocional, Buddy e apoio especializado.");
    return () => description?.setAttribute("content", previousDescription);
  }, [tenant?.name]);

  return (
    <div className="rbe-home-page how-it-works-page min-h-screen overflow-x-hidden">
      <Header />

      <main>
        {/* Hero */}
        <section className="hiw-hero-bg relative overflow-hidden pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pb-20">
          <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" aria-hidden="true">
            <path d="M560 600 C640 430 700 330 860 300 S1260 250 1440 150" fill="none" stroke="hsl(var(--hiw-pink))" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </svg>
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="z-10">
              <Eyebrow>Dados para mais pessoas<br />bem hoje e sempre</Eyebrow>
              <h1 className="max-w-xl text-[2.75rem] font-bold leading-[0.98] text-[var(--rbe-primary)] sm:text-6xl lg:text-[4.4rem]">
                Mensuração contínua da <span className="text-[var(--rbe-secondary-container)]">saúde mental</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--rbe-on-surface-variant)] sm:text-lg">
                Uma jornada de cuidado baseada em dados, para acompanhar o bem-estar ao longo do tempo.
              </p>
              <Button asChild size="lg" className="hiw-cta mt-8 h-12 rounded-full px-7 text-base font-semibold">
                <Link to={path("/contato")}>Conheça nossa solução <ArrowRight /></Link>
              </Button>
            </div>

            <div className="relative mx-auto h-[400px] w-full max-w-2xl sm:h-[520px]">
              <div className="absolute inset-x-[8%] bottom-[2%] top-[6%] rounded-[58%_42%_50%_50%/50%_55%_45%_50%] bg-[var(--rbe-primary-fixed)] opacity-80" aria-hidden="true" />
              <div className="absolute bottom-[10%] right-0 top-0 w-[45%] rounded-[50%_50%_45%_55%/55%_45%_55%_45%] bg-[var(--rbe-secondary-fixed)]" aria-hidden="true" />
              <div className="absolute inset-x-[14%] bottom-0 top-[4%] overflow-hidden rounded-[46%_54%_42%_58%/48%_42%_58%_52%]">
                <img src={heroImage} alt="Estudante sorrindo durante sua jornada de bem-estar" width={1024} height={1280} className="h-full w-full object-cover object-top" />
              </div>
              <div className="hiw-card absolute left-0 top-[12%] w-36 p-4 sm:w-40">
                <BarChart3 className="mb-3 h-7 w-7 text-[var(--rbe-on-tertiary-fixed)]" strokeWidth={2.25} />
                <p className="text-sm leading-tight text-[var(--rbe-primary)]">Mais <strong className="font-bold">bem-estar</strong> ao longo do tempo</p>
              </div>
              <div className="hiw-card absolute right-0 top-[10%] w-36 p-4 sm:w-40">
                <Heart className="mb-3 h-7 w-7 text-[var(--rbe-secondary-container)]" strokeWidth={2} />
                <p className="text-sm leading-tight text-[var(--rbe-primary)]">Dados que geram cuidado real</p>
              </div>
              <div className="hiw-card absolute bottom-[8%] right-0 w-40 p-4 sm:w-44">
                <Users className="mb-3 h-7 w-7 text-[var(--rbe-on-tertiary-fixed)]" strokeWidth={2} />
                <p className="text-sm leading-tight text-[var(--rbe-primary)]">Ambientes mais saudáveis e acolhedores</p>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="hiw-panel hiw-reveal grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_2.1fr] lg:items-center lg:p-10">
            <div className="lg:pr-4">
              <Eyebrow>Como funciona</Eyebrow>
              <AccentTitle accent="e apoio contínuo" className="lg:text-[2.4rem]">Escalas validadas, Diário Emocional</AccentTitle>
              <p className="mt-5 leading-relaxed text-[var(--rbe-on-surface-variant)]">Combinamos ciência, tecnologia e um acompanhamento próximo para entender como cada pessoa está ao longo do tempo.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { Icon: ClipboardList, title: "Escalas validadas", copy: "Aplicamos instrumentos científicos em momentos estratégicos do ano.", chip: "Momentos estratégicos", tone: "primary" as const },
                { Icon: Pencil, title: "Diário Emocional", copy: "Registros rápidos e simples para captar emoções e padrões do dia a dia.", chip: "Visão contínua", tone: "pink" as const },
                { Icon: null, title: "Buddy sempre por perto", copy: "Nosso assistente de bem-estar acompanha, engaja e incentiva a jornada ao longo do semestre.", chip: "Apoio constante", tone: "mint" as const },
              ].map((item) => (
                <div key={item.title} className="hiw-card flex min-h-60 flex-col p-5">
                  {item.Icon ? (
                    <div className="mb-5"><IconBadge Icon={item.Icon} tone={item.tone} /></div>
                  ) : (
                    <BuddyCharacter variant="arms" size="md" className="-mt-10 mb-1 h-24 w-24 self-center object-contain" />
                  )}
                  <h3 className="font-bold text-[var(--rbe-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{item.copy}</p>
                  <span className={`mt-auto w-fit rounded-full px-3 py-1.5 text-[11px] font-semibold ${toneClasses[item.tone]}`}>{item.chip}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inteligência */}
        <section className="hiw-reveal mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <Eyebrow>Acompanhamento ao longo do tempo</Eyebrow>
            <AccentTitle accent="cada jornada">Inteligência que reconhece</AccentTitle>
            <p className="mt-5 leading-relaxed text-[var(--rbe-on-surface-variant)]">Nossos algoritmos analisam as respostas de forma longitudinal, identificando mudanças, tendências e possíveis sinais de atenção, sempre respeitando o contexto de cada pessoa.</p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--rbe-on-surface-variant)]">
              {[
                { Icon: TrendingUp, text: "Acompanha a evolução individual", tone: "primary" as const },
                { Icon: Heart, text: "Identifica mudanças relevantes", tone: "pink" as const },
                { Icon: Lightbulb, text: "Gera insights para o cuidado proativo", tone: "mint" as const },
              ].map(({ Icon, text, tone }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses[tone]}`}><Icon className="h-4 w-4" /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="hiw-card p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={heroImage} alt="" className="h-11 w-11 rounded-full object-cover object-top" />
                <div><p className="font-bold text-[var(--rbe-primary)]">Jornada individual</p><p className="text-xs text-[var(--rbe-on-surface-variant)]">Visão longitudinal e personalizada</p></div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--rbe-outline-variant)] px-4 py-2 text-xs text-[var(--rbe-on-surface-variant)]">6 meses <ChevronDown className="h-3.5 w-3.5" /></span>
            </div>
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--rbe-tertiary-fixed)] px-3 py-1.5 text-xs font-semibold text-[var(--rbe-on-tertiary-fixed)]"><TrendingUp className="h-3.5 w-3.5" /> Tendência de melhora</span>
            </div>
            <div className="mt-2 grid grid-cols-[3.5rem_1fr] gap-2">
              <div className="relative h-52 text-[11px] text-[var(--rbe-on-surface-variant)]">
                <span className="absolute -top-5 left-0">Bem-estar</span>
                <span className="absolute top-[14%] -translate-y-1/2">Alto</span>
                <span className="absolute top-1/2 -translate-y-1/2">Médio</span>
                <span className="absolute top-[86%] -translate-y-1/2">Baixo</span>
              </div>
              <div className="relative h-52">
                <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Gráfico de tendência de bem-estar crescente de janeiro a junho">
                  <defs>
                    <linearGradient id="hiw-line" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--hiw-violet))" />
                      <stop offset="45%" stopColor="hsl(var(--hiw-pink))" />
                      <stop offset="100%" stopColor="hsl(var(--hiw-mint-strong))" />
                    </linearGradient>
                    <linearGradient id="hiw-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--hiw-mint))" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="hsl(var(--hiw-mint))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[28, 100, 172].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="hsl(var(--hiw-lilac-deep))" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />)}
                  <path d={`${chartLine} L600 200 L0 200 Z`} fill="url(#hiw-area)" />
                  <path d={chartLine} fill="none" stroke="url(#hiw-line)" strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
                {chartPoints.filter(([x]) => chartMarkers.includes(x)).map(([x, y]) => (
                  <span key={x} className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-[hsl(var(--hiw-card))]" style={{ left: `${(x / 600) * 100}%`, top: `${(y / 200) * 100}%`, borderColor: x < 220 ? "hsl(var(--hiw-violet))" : x < 400 ? "hsl(var(--hiw-pink))" : "hsl(var(--hiw-mint-strong))" }} />
                ))}
              </div>
            </div>
            <div className="ml-[4rem] mt-3 grid grid-cols-6 text-center text-xs text-[var(--rbe-on-surface-variant)]"><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span></div>
          </div>
        </section>

        {/* Jornada */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="hiw-panel hiw-reveal p-6 sm:p-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <div><Eyebrow>Uma jornada de cuidado contínua</Eyebrow><AccentTitle accent="em todas as fases do semestre">Ao lado de cada pessoa,</AccentTitle></div>
              <p className="max-w-xl leading-relaxed text-[var(--rbe-on-surface-variant)] lg:pt-8">O Buddy se comunica de forma planejada e respeitosa ao longo do semestre, com mensagens que incentivam o autocuidado, o preenchimento das escalas e o engajamento com os recursos da instituição.</p>
            </div>
            <div className="relative mt-12">
              <div className="hiw-gradient-line absolute left-[10%] right-[10%] top-[6.125rem] hidden h-0.5 rounded-full sm:block" aria-hidden="true" />
              <div className="hiw-gradient-line-vertical absolute bottom-6 left-[calc(2.25rem-1px)] top-6 w-0.5 rounded-full sm:hidden" aria-hidden="true" />
              <ol className="relative grid gap-6 sm:grid-cols-5 sm:gap-3">
                {journeySteps.map(({ Icon, title, copy, tone, dot }) => (
                  <li key={title} className="grid grid-cols-[4.5rem_1fr] items-center gap-4 sm:flex sm:flex-col sm:items-center sm:text-center">
                    <IconBadge Icon={Icon} tone={tone} size="lg" />
                    <span className={`hidden h-3.5 w-3.5 rounded-full ring-4 ring-[hsl(var(--hiw-lilac))] sm:mt-5 sm:block ${dot}`} aria-hidden="true" />
                    <div className="sm:mt-5"><h3 className="font-bold text-[var(--rbe-primary)]">{title}</h3><p className="mt-1 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Mensagens */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div><Eyebrow>Exemplos de comunicações</Eyebrow><AccentTitle accent="acolhem e engajam">Mensagens que informam,</AccentTitle></div>
            <p className="max-w-xl leading-relaxed text-[var(--rbe-on-surface-variant)]">O Buddy utiliza uma linguagem próxima e empática, comunicando-se de forma clara, respeitosa e no momento ideal.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {messages.map(({ Icon, label, text, time, tone }) => (
              <div key={label} className="hiw-card hiw-interactive flex flex-col items-center p-5 pb-6">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${toneClasses[tone]}`}><Icon className="h-3.5 w-3.5" />{label}</span>
                <div className="relative mt-5 w-full pl-10">
                  <div className="hiw-bubble min-h-36 px-4 pb-6 pt-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{text}</p>
                    <span className="absolute bottom-2 right-3 text-[10px] text-[var(--rbe-on-surface-variant)] opacity-70">{time}</span>
                  </div>
                  <span className="absolute -bottom-3 left-0 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--hiw-purple))] ring-4 ring-[hsl(var(--hiw-card))]">
                    <BuddyCharacter variant="chat" size="sm" className="h-11 w-11 object-contain" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Adesão */}
          <div className="hiw-panel hiw-reveal mt-12 grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div><Eyebrow>Mais participação, mais impacto</Eyebrow><AccentTitle accent="aumenta a adesão">A comunicação certa</AccentTitle><p className="mt-4 leading-relaxed text-[var(--rbe-on-surface-variant)]">Com lembretes no momento ideal e mensagens personalizadas, mais pessoas respondem às escalas, acessam os conteúdos e se mantêm engajadas ao longo do semestre.</p></div>
            <div className="hiw-card grid items-center gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
              <div className="relative h-48">
                <svg viewBox="0 0 300 120" className="absolute inset-x-0 top-0 h-24 w-full overflow-visible" aria-hidden="true">
                  <defs>
                    <linearGradient id="hiw-arrow" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--hiw-mint))" />
                      <stop offset="100%" stopColor="hsl(var(--hiw-violet))" />
                    </linearGradient>
                  </defs>
                  <path d="M10 95 C110 85 200 60 280 12" fill="none" stroke="url(#hiw-arrow)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M262 10 L281 11 L276 29" fill="none" stroke="hsl(var(--hiw-violet))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="absolute inset-x-0 bottom-0 flex h-36 items-end justify-around px-2">
                  {["h-[30%] opacity-40", "h-[48%] opacity-60", "h-[70%] opacity-80", "h-full"].map((bar) => (
                    <span key={bar} className={`w-[16%] rounded-t-lg bg-gradient-to-t from-[hsl(var(--hiw-lilac-deep))] to-[hsl(var(--hiw-violet))] ${bar}`} />
                  ))}
                </div>
              </div>
              <div className="border-t border-[var(--rbe-outline-variant)] pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                <strong className="font-['Outfit'] text-6xl font-bold text-[var(--rbe-primary)]">+78%</strong>
                <p className="mt-2 max-w-44 text-sm leading-snug text-[var(--rbe-on-surface-variant)]">de aumento na adesão às escalas com a comunicação do Buddy.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Escalas */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div><Eyebrow>Nossas escalas validadas</Eyebrow><AccentTitle accent="mais clara">Avaliação completa, visão</AccentTitle></div>
            <p className="max-w-xl leading-relaxed text-[var(--rbe-on-surface-variant)]">Selecionamos as principais escalas científicas para avaliar diferentes dimensões da saúde mental, com aplicação rápida e segura.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {scales.map(({ Icon, code, title, copy, tone }) => (
              <Link to={path("/escalas")} key={code} className="hiw-card hiw-interactive group p-6">
                <div className="flex items-start justify-between"><IconBadge Icon={Icon} tone={tone} size="lg" /><ArrowBubble /></div>
                <h3 className="mt-5 text-2xl font-bold text-[var(--rbe-primary)]">{code}</h3>
                <p className="font-semibold text-[var(--rbe-primary)]">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Apoio */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Eyebrow>Apoio para cada necessidade</Eyebrow>
          <AccentTitle accent="bem-estar real" className="lg:text-[2.6rem]">Especialistas e programas para promover</AccentTitle>
          <p className="mt-3 text-lg text-[var(--rbe-on-surface-variant)]">Encaminhamos para o tipo de apoio ideal, de forma personalizada e integrada à sua instituição.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(20,minmax(0,1fr))]">
            {supports.map(({ Icon, title, copy, tone }, index) => (
              <Link to={path("/biblioteca-apoios")} key={title} className={`hiw-card hiw-interactive group flex min-h-56 flex-col p-5 ${index < 5 ? "lg:col-span-4" : "lg:col-span-5"}`}>
                <IconBadge Icon={Icon} tone={tone} size="lg" />
                <h3 className="mt-5 text-lg font-bold text-[var(--rbe-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p>
                <ArrowBubble className="ml-auto mt-auto" />
              </Link>
            ))}
          </div>
        </section>

        {/* Duas perspectivas */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="hiw-panel hiw-reveal grid gap-8 p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div><Eyebrow>Dados para diferentes necessidades</Eyebrow><AccentTitle accent="o mesmo propósito">Duas perspectivas,</AccentTitle><p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--rbe-on-surface-variant)]">Transformamos dados em informações úteis para o cuidado individual e para a gestão institucional, sempre com privacidade.</p></div>
            <div className="hiw-card grid gap-8 p-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-[var(--rbe-outline-variant)] sm:p-8">
              {[
                { Icon: User, title: "Leitura individual", copy: "A pessoa acessa apenas os seus próprios dados, de forma privada e segura, para acompanhar a sua jornada de bem-estar.", chip: "Visão individual e personalizada", tone: "pink" as const },
                { Icon: BarChart3, title: "Visão institucional", copy: "A instituição acessa apenas dados agregados e anonimizados, com panoramas e tendências para apoiar decisões e ações de promoção da saúde mental.", chip: "Dados agregados e sem identificação", tone: "mint" as const },
              ].map(({ Icon, title, copy, chip, tone }, index) => (
                <div key={title} className={`flex flex-col ${index === 0 ? "sm:pr-8" : "sm:pl-8"}`}>
                  <IconBadge Icon={Icon} tone={tone} size="lg" />
                  <h3 className="mt-4 text-xl font-bold text-[var(--rbe-primary)]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p>
                  <span className={`mt-5 w-fit rounded-full px-4 py-2 text-xs font-semibold ${toneClasses[tone]}`}>{chip}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Segurança */}
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8 lg:py-16">
          <div><Eyebrow>Segurança em cada detalhe</Eyebrow><AccentTitle accent="sua confiança">Tecnologia, processos e pessoas a favor da</AccentTitle><p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--rbe-on-surface-variant)]">Adotamos as melhores práticas de segurança da informação e governança de dados, com foco na proteção, na ética e na transparência.</p></div>
          <div className="grid gap-8 sm:grid-cols-2">
            {securityItems.map(({ Icon, title, copy, tone }) => (
              <div key={title} className="flex gap-4">
                <IconBadge Icon={Icon} tone={tone} size="lg" />
                <div><h3 className="max-w-[11rem] font-bold leading-tight text-[var(--rbe-primary)]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacidade */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8">
          <div className="hiw-panel hiw-reveal relative grid items-center gap-10 overflow-hidden p-7 sm:p-10 lg:grid-cols-[1.1fr_0.6fr_0.8fr] lg:gap-6 lg:p-12">
            <div>
              <Eyebrow>Privacidade do estudante</Eyebrow>
              <AccentTitle accent="etapas">Confidencialidade em todas as</AccentTitle>
              <p className="mt-4 max-w-lg leading-relaxed text-[var(--rbe-on-surface-variant)]">As informações individuais são protegidas e acessíveis apenas à equipe autorizada, garantindo um ambiente seguro e de confiança.</p>
              <Button asChild size="lg" className="hiw-cta mt-7 h-12 rounded-full px-7 font-semibold">
                <Link to={path("/politica-privacidade")}>Saiba mais sobre nossa política <ArrowRight /></Link>
              </Button>
            </div>

            <svg viewBox="0 0 220 240" className="mx-auto h-56 w-auto drop-shadow-[0_24px_30px_hsl(var(--hiw-purple)/0.35)]" role="img" aria-label="Escudo com cadeado representando a proteção dos dados">
              <defs>
                <linearGradient id="hiw-shield" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--hiw-violet))" />
                  <stop offset="100%" stopColor="hsl(268 68% 36%)" />
                </linearGradient>
                <linearGradient id="hiw-shield-edge" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(266 90% 82%)" />
                  <stop offset="100%" stopColor="hsl(var(--hiw-violet))" />
                </linearGradient>
              </defs>
              <path d="M4 52 L20 40 M2 72 L16 70 M28 22 L34 36" stroke="hsl(var(--hiw-pink))" strokeWidth="5" strokeLinecap="round" />
              <path d="M120 16 L196 44 V112 C196 168 162 204 120 226 C78 204 44 168 44 112 V44 Z" fill="url(#hiw-shield-edge)" />
              <path d="M120 30 L184 54 V112 C184 160 155 191 120 211 C85 191 56 160 56 112 V54 Z" fill="url(#hiw-shield)" />
              <path d="M98 108 V92 a22 22 0 0 1 44 0 V108" fill="none" stroke="hsl(0 0% 100%)" strokeWidth="11" strokeLinecap="round" />
              <rect x="86" y="104" width="68" height="56" rx="12" fill="hsl(0 0% 100%)" />
              <circle cx="120" cy="126" r="7" fill="hsl(var(--hiw-purple))" />
              <rect x="116.5" y="128" width="7" height="16" rx="3.5" fill="hsl(var(--hiw-purple))" />
            </svg>

            <div className="space-y-4">
              {[
                { Icon: LockKeyhole, text: "Dados individuais sempre sigilosos" },
                { Icon: User, text: "Acesso restrito à equipe especializada" },
                { Icon: ShieldCheck, text: "Comunicação segura e ética" },
              ].map(({ Icon, text }) => (
                <div key={text} className="relative">
                  <span className="absolute right-full top-1/2 mr-2 hidden w-10 border-t-2 border-dashed border-[hsl(var(--hiw-violet)/0.45)] lg:block" aria-hidden="true" />
                  <div className="hiw-card flex items-center gap-4 p-4">
                    <IconBadge Icon={Icon} tone="primary" size="sm" />
                    <p className="text-sm font-semibold text-[var(--rbe-primary)]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
