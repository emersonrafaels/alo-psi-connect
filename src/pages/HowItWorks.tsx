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
  Database,
  Flag,
  GraduationCap,
  Handshake,
  Heart,
  Leaf,
  LockKeyhole,
  MessageCircle,
  Moon,
  Pencil,
  Rocket,
  ShieldCheck,
  Sparkles,
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
  { Icon: Rocket, title: "Início", copy: "Boas-vindas e orientações da jornada", tone: "primary" },
  { Icon: CalendarDays, title: "Durante o semestre", copy: "Lembretes das escalas e conteúdos de apoio", tone: "pink" },
  { Icon: MessageCircle, title: "Check-ins", copy: "Mensagens de cuidado e acompanhamento", tone: "mint" },
  { Icon: Users, title: "Momentos críticos", copy: "Suporte extra em períodos de maior desafio", tone: "primary" },
  { Icon: Flag, title: "Final do semestre", copy: "Fechamento e incentivo à continuidade", tone: "pink" },
] as const;

const messages = [
  { Icon: Bell, label: "Lembrete", text: "Oi! 👋\nEstá na hora de responder sua escala de bem-estar. É rapidinho e nos ajuda a cuidar melhor de você.", time: "10:00", tone: "pink" },
  { Icon: BarChart3, label: "Check-in", text: "Como você tem se sentido esta semana?\n\nSua saúde emocional também importa. 💙", time: "14:22", tone: "mint" },
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

const toneClasses = {
  primary: "bg-[var(--rbe-primary-fixed)] text-[var(--rbe-primary)]",
  pink: "bg-[var(--rbe-secondary-fixed)] text-[var(--rbe-secondary)]",
  mint: "bg-[var(--rbe-tertiary-fixed)] text-[var(--rbe-on-tertiary-fixed)]",
};

const AccentTitle = ({ children, accent }: { children: React.ReactNode; accent: React.ReactNode }) => (
  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.05] text-[var(--rbe-primary)]">
    {children} <span className="text-[var(--rbe-secondary-container)]">{accent}</span>
  </h2>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--rbe-primary)]">{children}</p>
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
    <div className="rbe-home-page min-h-screen overflow-x-hidden bg-[var(--rbe-surface-container-lowest)]">
      <Header />

      <main>
        <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
          <div className="absolute inset-0 bg-[var(--rbe-primary-fixed)] opacity-20" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="z-10">
              <Eyebrow>Dados para mais pessoas bem hoje e sempre</Eyebrow>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-[0.98] text-[var(--rbe-primary)] sm:text-6xl lg:text-7xl">
                Mensuração contínua da <span className="text-[var(--rbe-secondary-container)]">saúde mental</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--rbe-on-surface-variant)] sm:text-lg">
                Uma jornada de cuidado baseada em dados, para acompanhar o bem-estar ao longo do tempo.
              </p>
              <Button asChild size="lg" className="mt-7 rounded-full px-7 shadow-lg">
                <Link to={path("/contato")}>Conheça nossa solução <ArrowRight /></Link>
              </Button>
            </div>

            <div className="relative mx-auto min-h-[430px] w-full max-w-2xl sm:min-h-[560px]">
              <div className="absolute inset-x-[10%] bottom-0 top-[5%] overflow-hidden rounded-[46%_54%_42%_58%/48%_42%_58%_52%] bg-[var(--rbe-tertiary-fixed)]">
                <img src={heroImage} alt="Estudante sorrindo durante sua jornada de bem-estar" width={1024} height={1280} className="h-full w-full object-cover object-top" />
              </div>
              <div className="absolute left-0 top-[18%] w-36 rounded-lg bg-[var(--rbe-surface-container-lowest)] p-4 shadow-xl sm:w-40">
                <BarChart3 className="mb-3 h-7 w-7 text-[var(--rbe-on-tertiary-fixed)]" />
                <p className="text-sm font-bold leading-tight text-[var(--rbe-primary)]">Mais bem-estar ao longo do tempo</p>
              </div>
              <div className="absolute right-0 top-[20%] w-36 rounded-lg bg-[var(--rbe-surface-container-lowest)] p-4 shadow-xl sm:w-40">
                <Heart className="mb-3 h-7 w-7 text-[var(--rbe-secondary-container)]" />
                <p className="text-sm font-bold leading-tight text-[var(--rbe-primary)]">Dados que geram cuidado real</p>
              </div>
              <div className="absolute bottom-[8%] right-0 w-36 rounded-lg bg-[var(--rbe-surface-container-lowest)] p-4 shadow-xl sm:w-44">
                <Users className="mb-3 h-7 w-7 text-[var(--rbe-on-tertiary-fixed)]" />
                <p className="text-sm font-bold leading-tight text-[var(--rbe-primary)]">Ambientes mais saudáveis e acolhedores</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-lg bg-[var(--rbe-primary-fixed)] p-6 sm:p-8 lg:grid-cols-[1.05fr_1.95fr] lg:p-10">
            <div className="lg:pr-6">
              <Eyebrow>Como funciona</Eyebrow>
              <AccentTitle accent="e apoio contínuo">Escalas validadas, Diário Emocional</AccentTitle>
              <p className="mt-5 leading-relaxed text-[var(--rbe-on-surface-variant)]">Combinamos ciência, tecnologia e um acompanhamento próximo para entender como cada pessoa está ao longo do tempo.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { Icon: BarChart3, title: "Escalas validadas", copy: "Aplicamos instrumentos científicos em momentos estratégicos do ano.", chip: "Momentos estratégicos", tone: "primary" },
                { Icon: Pencil, title: "Diário Emocional", copy: "Registros rápidos e simples para captar emoções e padrões do dia a dia.", chip: "Visão contínua", tone: "pink" },
                { title: "Buddy sempre por perto", copy: "Nosso assistente de bem-estar acompanha, engaja e incentiva a jornada ao longo do semestre.", chip: "Apoio constante", tone: "mint" },
              ].map((item) => (
                <div key={item.title} className="flex min-h-64 flex-col rounded-lg bg-[var(--rbe-surface-container-lowest)] p-5 shadow-sm">
                  {item.Icon ? <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${toneClasses[item.tone]}`}><item.Icon /></div> : <BuddyCharacter size="md" className="mb-2 h-20 w-20 object-contain" />}
                  <h3 className="font-extrabold text-[var(--rbe-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{item.copy}</p>
                  <span className={`mt-auto w-fit rounded-full px-3 py-1 text-[10px] font-bold ${toneClasses[item.tone]}`}>{item.chip}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <Eyebrow>Acompanhamento ao longo do tempo</Eyebrow>
            <AccentTitle accent="cada jornada">Inteligência que reconhece</AccentTitle>
            <p className="mt-5 leading-relaxed text-[var(--rbe-on-surface-variant)]">Nossos algoritmos analisam as respostas de forma longitudinal, identificando mudanças, tendências e possíveis sinais de atenção, sempre respeitando o contexto de cada pessoa.</p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--rbe-on-surface-variant)]">
              {["Acompanha a evolução individual", "Identifica mudanças relevantes", "Gera insights para o cuidado proativo"].map((item, index) => (
                <li key={item} className="flex items-center gap-3"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${index === 1 ? toneClasses.pink : index === 2 ? toneClasses.mint : toneClasses.primary}`}><Check className="h-4 w-4" /></span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-[var(--rbe-outline-variant)] bg-[var(--rbe-surface-container-lowest)] p-5 shadow-lg sm:p-7">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rbe-secondary-fixed)] text-[var(--rbe-primary)]"><User /></div><div><p className="font-bold text-[var(--rbe-primary)]">Jornada individual</p><p className="text-xs text-[var(--rbe-on-surface-variant)]">Visão longitudinal e personalizada</p></div></div>
              <span className="rounded-full border border-[var(--rbe-outline-variant)] px-4 py-2 text-xs text-[var(--rbe-on-surface-variant)]">6 meses</span>
            </div>
            <div className="relative h-52 border-b border-l border-[var(--rbe-outline-variant)]">
              <div className="absolute inset-x-0 top-1/3 border-t border-[var(--rbe-outline-variant)] opacity-50" />
              <div className="absolute inset-x-0 top-2/3 border-t border-[var(--rbe-outline-variant)] opacity-50" />
              <svg viewBox="0 0 600 180" className="absolute inset-0 h-full w-full overflow-visible text-[var(--rbe-primary)]" aria-label="Gráfico de tendência de bem-estar crescente">
                <path d="M0 115 C55 72 95 70 145 98 S230 140 290 112 S385 77 440 82 S525 83 600 25" fill="none" stroke="currentColor" strokeWidth="4" />
                <path d="M0 115 C55 72 95 70 145 98 S230 140 290 112 S385 77 440 82 S525 83 600 25 L600 180 L0 180 Z" fill="currentColor" opacity="0.08" />
                {[['75','82'],['220','123'],['365','86'],['510','76'],['600','25']].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="6" fill="var(--rbe-surface-container-lowest)" stroke="currentColor" strokeWidth="3" />)}
              </svg>
              <span className="absolute right-2 top-2 rounded-full bg-[var(--rbe-tertiary-fixed)] px-3 py-1 text-xs font-bold text-[var(--rbe-on-tertiary-fixed)]">↗ Tendência de melhora</span>
            </div>
            <div className="mt-3 grid grid-cols-6 text-center text-xs text-[var(--rbe-on-surface-variant)]"><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span></div>
          </div>
        </section>

        <section className="bg-[var(--rbe-primary-fixed)] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
              <div><Eyebrow>Uma jornada de cuidado contínua</Eyebrow><AccentTitle accent="em todas as fases do semestre">Ao lado de cada pessoa,</AccentTitle></div>
              <p className="max-w-xl leading-relaxed text-[var(--rbe-on-surface-variant)]">O Buddy se comunica de forma planejada e respeitosa ao longo do semestre, com mensagens que incentivam o autocuidado, o preenchimento das escalas e o engajamento com os recursos da instituição.</p>
            </div>
            <div className="relative mt-12 grid gap-8 sm:grid-cols-5 sm:gap-3">
              <div className="absolute left-[10%] right-[10%] top-10 hidden h-0.5 bg-[var(--rbe-tertiary-fixed)] sm:block" />
              {journeySteps.map(({ Icon, title, copy, tone }) => (
                <div key={title} className="relative text-center">
                  <div className={`relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${toneClasses[tone]}`}><Icon className="h-8 w-8" /></div>
                  <h3 className="text-sm font-extrabold text-[var(--rbe-primary)]">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end"><div><Eyebrow>Exemplos de comunicações</Eyebrow><AccentTitle accent="acolhem e engajam">Mensagens que informam,</AccentTitle></div><p className="leading-relaxed text-[var(--rbe-on-surface-variant)]">O Buddy utiliza uma linguagem próxima e empática, comunicando-se de forma clara, respeitosa e no momento ideal.</p></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {messages.map(({ Icon, label, text, time, tone }) => (
              <div key={label} className="relative min-h-64 rounded-lg bg-[var(--rbe-surface-container-low)] p-5 shadow-sm">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${toneClasses[tone]}`}><Icon className="h-3.5 w-3.5" />{label}</span>
                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{text}</p>
                <div className="absolute bottom-3 left-3 flex items-end gap-2"><BuddyCharacter size="sm" className="h-12 w-12 object-contain" /><span className="mb-1 text-[10px] text-[var(--rbe-on-surface-variant)]">{time}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-10 grid items-center gap-8 rounded-lg bg-[var(--rbe-primary-fixed)] p-7 sm:p-10 lg:grid-cols-[1fr_1.25fr]">
            <div><Eyebrow>Mais participação, mais impacto</Eyebrow><AccentTitle accent="aumenta a adesão">A comunicação certa</AccentTitle><p className="mt-4 leading-relaxed text-[var(--rbe-on-surface-variant)]">Com lembretes no momento ideal e mensagens personalizadas, mais pessoas respondem às escalas, acessam os conteúdos e se mantêm engajadas ao longo do semestre.</p></div>
            <div className="grid items-end gap-5 sm:grid-cols-[1fr_auto]">
              <div className="flex h-44 items-end justify-center gap-5 border-b border-[var(--rbe-outline-variant)]"><span className="h-14 w-10 rounded-t bg-[var(--rbe-primary)] opacity-20" /><span className="h-20 w-10 rounded-t bg-[var(--rbe-primary)] opacity-35" /><span className="h-28 w-10 rounded-t bg-[var(--rbe-primary)] opacity-55" /><span className="h-40 w-10 rounded-t bg-[var(--rbe-primary)] opacity-75" /></div>
              <div><strong className="text-5xl font-extrabold text-[var(--rbe-primary)]">+78%</strong><p className="mt-2 max-w-40 text-sm leading-snug text-[var(--rbe-on-surface-variant)]">de aumento na adesão às escalas com a comunicação do Buddy.</p></div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--rbe-surface-container-low)] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center"><div><Eyebrow>Nossas escalas validadas</Eyebrow><AccentTitle accent="visão mais clara">Avaliação completa,</AccentTitle></div><p className="max-w-xl text-lg leading-relaxed text-[var(--rbe-on-surface-variant)]">Selecionamos as principais escalas científicas para avaliar diferentes dimensões da saúde mental, com aplicação rápida e segura.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scales.map(({ Icon, code, title, copy, tone }) => (
                <Link to={path("/escalas")} key={code} className="group rounded-lg bg-[var(--rbe-surface-container-lowest)] p-6 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-start justify-between"><span className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClasses[tone]}`}><Icon className="h-8 w-8" /></span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rbe-primary-fixed)] text-[var(--rbe-primary)]"><ArrowRight /></span></div>
                  <h3 className="mt-5 text-2xl font-extrabold text-[var(--rbe-primary)]">{code}</h3><p className="font-bold text-[var(--rbe-primary)]">{title}</p><p className="mt-2 leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Eyebrow>Apoio para cada necessidade</Eyebrow>
            <AccentTitle accent="bem-estar real">Especialistas e programas para promover</AccentTitle>
            <p className="mt-3 text-lg text-[var(--rbe-on-surface-variant)]">Encaminhamos para o tipo de apoio ideal, de forma personalizada e integrada à sua instituição.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {supports.map(({ Icon, title, copy, tone }) => (
                <Link to={path("/biblioteca-apoios")} key={title} className="group flex min-h-64 flex-col rounded-lg bg-[var(--rbe-surface-container-lowest)] p-5 shadow-sm transition-transform hover:-translate-y-1">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClasses[tone]}`}><Icon className="h-8 w-8" /></span>
                  <h3 className="mt-5 text-lg font-extrabold text-[var(--rbe-primary)]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p>
                  <span className="mt-auto ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rbe-primary-fixed)] text-[var(--rbe-primary)]"><ArrowRight /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--rbe-primary-fixed)] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div><Eyebrow>Dados para diferentes necessidades</Eyebrow><AccentTitle accent="o mesmo propósito">Duas perspectivas,</AccentTitle><p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--rbe-on-surface-variant)]">Transformamos dados em informações úteis para o cuidado individual e para a gestão institucional, sempre com privacidade.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[{ Icon: User, title: "Leitura individual", copy: "A pessoa acessa apenas os seus próprios dados, de forma privada e segura, para acompanhar a sua jornada de bem-estar.", chip: "Visão individual e personalizada", tone: "pink" }, { Icon: BarChart3, title: "Visão institucional", copy: "A instituição acessa apenas dados agregados e anonimizados, com panoramas e tendências para apoiar decisões e ações de promoção da saúde mental.", chip: "Dados agregados e sem identificação", tone: "mint" }].map(({ Icon, title, copy, chip, tone }) => (
                  <div key={title} className="rounded-lg bg-[var(--rbe-surface-container-lowest)] p-6 shadow-sm"><span className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClasses[tone]}`}><Icon /></span><h3 className="mt-4 text-xl font-extrabold text-[var(--rbe-primary)]">{title}</h3><p className="mt-2 leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p><span className={`mt-5 inline-flex rounded-full px-4 py-2 text-xs font-bold ${toneClasses[tone]}`}>{chip}</span></div>
                ))}
              </div>
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div><Eyebrow>Segurança em cada detalhe</Eyebrow><AccentTitle accent="sua confiança">Tecnologia, processos e pessoas a favor da</AccentTitle><p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--rbe-on-surface-variant)]">Adotamos as melhores práticas de segurança da informação e governança de dados, com foco na proteção, na ética e na transparência.</p></div>
              <div className="grid gap-7 sm:grid-cols-2">
                {[{ Icon: LockKeyhole, title: "Anonimização de dados", copy: "As informações institucionais são sempre agregadas e sem identificação de pessoas.", tone: "primary" }, { Icon: ShieldCheck, title: "Conformidade com a LGPD", copy: "Seguimos integralmente a Lei Geral de Proteção de Dados, com políticas claras e atualizadas.", tone: "pink" }, { Icon: Database, title: "Infraestrutura segura", copy: "Dados protegidos com criptografia, controle de acesso e monitoramento contínuo.", tone: "mint" }, { Icon: Users, title: "Governança e ética", copy: "Processos, equipes e parceiros comprometidos com o uso responsável e ético dos dados.", tone: "primary" }].map(({ Icon, title, copy, tone }) => (
                  <div key={title} className="flex gap-4"><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}><Icon /></span><div><h3 className="font-extrabold text-[var(--rbe-primary)]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--rbe-on-surface-variant)]">{copy}</p></div></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-lg bg-[var(--rbe-primary-fixed)] p-7 sm:p-10 lg:grid-cols-[1fr_0.55fr_0.9fr] lg:p-12">
            <div><Eyebrow>Privacidade do estudante</Eyebrow><AccentTitle accent="">Confidencialidade em todas as etapas</AccentTitle><p className="mt-4 text-lg leading-relaxed text-[var(--rbe-on-surface-variant)]">As informações individuais são protegidas e acessíveis apenas à equipe autorizada, garantindo um ambiente seguro e de confiança.</p><Button asChild size="lg" className="mt-7 rounded-full"><Link to={path("/politica-privacidade")}>Saiba mais sobre nossa política <ArrowRight /></Link></Button></div>
            <div className="relative mx-auto flex h-52 w-44 items-center justify-center rounded-[48%_52%_55%_45%] bg-[var(--rbe-primary)] text-[var(--rbe-on-primary)] shadow-xl"><ShieldCheck className="h-36 w-36" /><LockKeyhole className="absolute h-16 w-16" /></div>
            <div className="space-y-4">{[{ Icon: LockKeyhole, text: "Dados individuais sempre sigilosos" }, { Icon: User, text: "Acesso restrito à equipe especializada" }, { Icon: ShieldCheck, text: "Comunicação segura e ética" }].map(({ Icon, text }) => <div key={text} className="flex items-center gap-4 rounded-lg bg-[var(--rbe-surface-container-lowest)] p-4 shadow-sm"><Icon className="h-7 w-7 shrink-0 text-[var(--rbe-primary)]" /><p className="font-bold text-[var(--rbe-primary)]">{text}</p></div>)}</div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;