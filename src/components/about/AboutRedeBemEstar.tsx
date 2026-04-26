import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath, DEFAULT_TENANT_SLUG } from "@/utils/tenantHelpers";
import {
  HeartHandshake, Target, Eye, Sparkles, Bot, BookOpen, BarChart3, Brain,
  GraduationCap, UserCheck, Building2, Heart, Map, TrendingUp, CheckCheck,
  ShieldCheck, Lock, Ear, Lightbulb, Activity, Users, Zap, ClipboardList,
  Workflow, LineChart, PlayCircle,
} from "lucide-react";

/**
 * About page rebuilt from the Stitch mock "Serenity & Wisdom".
 * All design tokens are scoped under .rbe-about-page in src/index.css to avoid
 * impacting the rest of the site. Tokens auto-adapt to dark mode.
 */
const AboutRedeBemEstar = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || DEFAULT_TENANT_SLUG;

  const goTo = (path: string) => {
    navigate(buildTenantPath(tenantSlug, path));
    window.scrollTo(0, 0);
  };

  return (
    <div className="rbe-about-page bg-[var(--rbe-bg)] text-[var(--rbe-text)] overflow-x-hidden">
      {/* ═══════ HERO ═══════ */}
      <header className="pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-20 items-center">
        <div className="z-10">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[var(--rbe-lilac-light)] text-[var(--rbe-primary)] text-[10px] sm:text-xs font-bold mb-5 sm:mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--rbe-primary)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--rbe-primary)]" />
            </span>
            INOVAÇÃO EM SAÚDE MENTAL
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--rbe-primary)] leading-[1.1] mb-6 sm:mb-8 tracking-tight">
            Cuidado emocional para transformar a experiência universitária.
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[var(--rbe-text)] mb-8 sm:mb-10 max-w-xl leading-relaxed">
            A Rede Bem-Estar combina acolhimento humano, tecnologia e dados para apoiar estudantes,
            professores e instituições em toda a jornada acadêmica.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <button
              onClick={() => goTo("/profissionais")}
              className="w-full sm:w-auto bg-[var(--rbe-primary)] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold shadow-xl hover:opacity-90 active:scale-95 transition-all"
            >
              Conhecer plataforma
            </button>
            <button
              onClick={() => goTo("/contato")}
              className="w-full sm:w-auto bg-[var(--rbe-card)] border-2 border-[var(--rbe-card-border)] text-[var(--rbe-text)] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold hover:border-[var(--rbe-primary)] hover:text-[var(--rbe-primary)] transition-all"
            >
              Falar com a equipe
            </button>
          </div>
        </div>

        {/* Composition of floating cards */}
        <div className="relative h-[360px] sm:h-[480px] lg:h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] lg:w-[500px] lg:h-[500px] bg-[var(--rbe-turquoise-light)] rbe-organic-shape-1 -z-10 animate-pulse" />
          <div className="absolute w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px] bg-[var(--rbe-lilac-light)] rbe-organic-shape-2 -z-10 mix-blend-multiply opacity-60" />

          <div className="relative w-full h-full max-w-md mx-auto">
            {/* Buddy mockup */}
            <div className="absolute top-2 right-0 w-44 sm:w-56 lg:w-64 rbe-glass-card p-4 sm:p-5 rounded-3xl shadow-2xl rotate-2 sm:rotate-3 z-30">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--rbe-secondary)] rounded-2xl flex items-center justify-center">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--rbe-primary)]" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[var(--rbe-text-strong)]">Buddy</p>
                  <p className="text-[10px] text-[var(--rbe-text-muted)]">Inteligência Ativa</p>
                </div>
              </div>
              <div className="bg-[var(--rbe-card-soft)] rounded-xl p-3 text-[11px] italic text-[var(--rbe-text)] border-l-4 border-[var(--rbe-secondary)]">
                "Estou aqui para ouvir você agora."
              </div>
            </div>

            {/* Check-in card */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-40 sm:w-48 lg:w-56 bg-[var(--rbe-card)] p-4 sm:p-5 rounded-[28px] shadow-2xl -rotate-3 sm:-rotate-6 z-20 border-b-8 border-[var(--rbe-secondary)]">
              <p className="text-[10px] font-bold text-[var(--rbe-text-subtle)] mb-3 uppercase tracking-widest">Check-in Diário</p>
              <div className="flex justify-between gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--rbe-lilac-light)] rounded-full flex items-center justify-center text-base sm:text-lg">😔</div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--rbe-turquoise-light)] rounded-full flex items-center justify-center text-base sm:text-lg ring-4 ring-[var(--rbe-secondary)]">😊</div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--rbe-lilac-light)] rounded-full flex items-center justify-center text-base sm:text-lg">🤩</div>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-6 w-52 sm:w-64 lg:w-72 bg-[var(--rbe-cta-bg)] text-white p-5 sm:p-7 rounded-[32px] sm:rounded-[36px] shadow-2xl z-40">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <LineChart className="w-7 h-7 sm:w-9 sm:h-9 text-[var(--rbe-secondary)]" />
                <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded">LIVE</span>
              </div>
              <p className="text-xs opacity-70 mb-1">Engajamento Institucional</p>
              <p className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">87.4%</p>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--rbe-secondary)] w-[87%]" />
              </div>
            </div>

            {/* Mini diary */}
            <div className="absolute top-12 sm:top-16 left-2 sm:left-6 w-36 sm:w-44 bg-[var(--rbe-card)] p-3 sm:p-4 rounded-2xl shadow-xl z-10 opacity-80 scale-90">
              <div className="flex gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-[var(--rbe-card-border)] rounded" />
                <div className="h-2 w-3/4 bg-[var(--rbe-card-border)] rounded" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ POR QUE EXISTIMOS ═══════ */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[var(--rbe-card)] p-6 sm:p-10 lg:p-20 rbe-rounded-huge shadow-sm border border-[var(--rbe-card-border)] flex flex-col md:flex-row items-center gap-6 sm:gap-10 lg:gap-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--rbe-turquoise-light)]/40 rbe-organic-shape-1 -translate-y-1/2 translate-x-1/2" />
          <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-[var(--rbe-lilac-light)] rounded-full flex items-center justify-center shrink-0 ring-8 ring-[var(--rbe-bg)]">
            <HeartHandshake className="w-10 h-10 sm:w-14 sm:h-14 text-[var(--rbe-primary)]" />
          </div>
          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)] mb-4 sm:mb-5">Por que existimos</h2>
            <p className="text-base sm:text-lg lg:text-2xl text-[var(--rbe-text)] leading-relaxed mb-6 sm:mb-7">
              A universidade é um período de transformação, mas também de intensa pressão. Existimos
              para garantir que o crescimento intelectual não venha acompanhado de exaustão emocional.
            </p>
            <div className="inline-block px-5 sm:px-6 py-3 bg-[var(--rbe-cta-bg)] text-[var(--rbe-secondary)] rounded-2xl text-base sm:text-lg lg:text-xl font-extrabold italic">
              "Cuidar melhor também é decidir melhor."
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MISSÃO / VISÃO / PROPÓSITO ═══════ */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
        <div className="bg-[var(--rbe-card)] p-6 sm:p-10 lg:p-12 rbe-rounded-huge border border-[var(--rbe-card-border)] hover:border-[var(--rbe-primary)]/20 transition-all group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--rbe-lilac-light)] rounded-2xl flex items-center justify-center mb-5 sm:mb-7 group-hover:bg-[var(--rbe-primary)] transition-colors">
            <Target className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--rbe-primary)] group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--rbe-primary)] mb-3 sm:mb-4">Missão</h3>
          <p className="text-sm sm:text-base text-[var(--rbe-text)] leading-relaxed">
            Conectar acolhimento humano, tecnologia e inteligência institucional para ampliar acesso ao cuidado.
          </p>
        </div>
        <div className="bg-[var(--rbe-card)] p-6 sm:p-10 lg:p-12 rbe-rounded-huge border border-[var(--rbe-card-border)] hover:border-[var(--rbe-secondary)]/40 transition-all group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--rbe-turquoise-light)] rounded-2xl flex items-center justify-center mb-5 sm:mb-7 group-hover:bg-[var(--rbe-secondary)] transition-colors">
            <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--rbe-primary)]" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--rbe-primary)] mb-3 sm:mb-4">Visão</h3>
          <p className="text-sm sm:text-base text-[var(--rbe-text)] leading-relaxed">
            Construir uma cultura universitária em que saúde emocional, permanência e desenvolvimento caminhem juntos.
          </p>
        </div>
        <div className="bg-[var(--rbe-cta-bg)] p-6 sm:p-10 lg:p-12 rbe-rounded-huge shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rbe-organic-shape-2 rotate-45" />
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-5 sm:mb-7">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 sm:mb-4">Propósito</h3>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed">
            Transformar cuidado emocional em presença real, dados úteis e ações contínuas.
          </p>
        </div>
      </section>

      {/* ═══════ O QUE FAZEMOS ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-[var(--rbe-surface-variant)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)] mb-4 sm:mb-5">O que fazemos</h2>
            <p className="text-sm sm:text-base lg:text-lg text-[var(--rbe-text)]">
              Soluções desenhadas para a realidade universitária com alto rigor técnico e empatia.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {[
              { Icon: Bot, title: "Buddy", desc: "Apoio emocional por IA que oferece suporte 24/7, escuta ativa e triagem inteligente para casos de risco.", chip: "IA Ativa", bg: "bg-[var(--rbe-secondary)]/20" },
              { Icon: BookOpen, title: "Diário Emocional", desc: "Ferramenta de autoconhecimento onde o estudante registra emoções e identifica padrões de bem-estar.", chip: "Autocuidado", bg: "bg-[var(--rbe-lilac-light)]" },
              { Icon: BarChart3, title: "Escalas e Dados", desc: "Dashboards estratégicos para gestores mapearem a saúde mental coletiva e prevenirem a evasão.", chip: "Big Data", bg: "bg-[var(--rbe-secondary)]/20" },
              { Icon: Brain, title: "Atendimento Especializado", desc: "Encaminhamento ágil para psicólogos parceiros quando o sistema detecta sinais de alerta.", chip: "Rede Humana", bg: "bg-[var(--rbe-lilac-light)]" },
            ].map(({ Icon, title, desc, chip, bg }) => (
              <div key={title} className="bg-[var(--rbe-card)] p-6 sm:p-8 lg:p-10 rbe-rounded-huge flex gap-4 sm:gap-6 items-start hover:shadow-xl transition-all">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 ${bg} rounded-2xl sm:rounded-3xl shrink-0 flex items-center justify-center`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[var(--rbe-primary)]" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--rbe-primary)] mb-2">{title}</h4>
                  <p className="text-[var(--rbe-text)] leading-relaxed mb-3 sm:mb-4 text-sm lg:text-base">{desc}</p>
                  <span className="text-[10px] lg:text-xs font-bold text-[var(--rbe-primary)] bg-[var(--rbe-lilac-light)] px-3 py-1 rounded-full uppercase tracking-wider">
                    {chip}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PARA QUEM FAZEMOS ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)]">Para quem fazemos</h2>
          <p className="text-sm sm:text-base text-[var(--rbe-text-muted)] mt-3 sm:mt-4">Fortalecendo cada elo da comunidade acadêmica.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            { Icon: GraduationCap, title: "Estudantes", desc: "Suporte emocional imediato, ferramentas de autoconhecimento e uma rede de proteção sempre disponível.", banner: "bg-[var(--rbe-turquoise-light)]" },
            { Icon: UserCheck, title: "Professores", desc: "Capacitação para identificar sinais precoces e ferramentas para um acolhimento mais seguro e eficaz.", banner: "bg-[var(--rbe-lilac-light)]" },
            { Icon: Building2, title: "Instituições", desc: "Gestão estratégica baseada em dados reais, redução de evasão e fortalecimento da marca institucional.", banner: "bg-[var(--rbe-primary)]/10" },
          ].map(({ Icon, title, desc, banner }) => (
            <div key={title} className="bg-[var(--rbe-card)] rounded-[32px] sm:rounded-[40px] overflow-hidden border border-[var(--rbe-card-border)] shadow-sm hover:shadow-2xl transition-all">
              <div className={`h-36 sm:h-44 ${banner} flex items-center justify-center`}>
                <Icon className="w-16 h-16 sm:w-20 sm:h-20 text-[var(--rbe-primary)] opacity-60" strokeWidth={1.5} />
              </div>
              <div className="p-6 sm:p-8 lg:p-10">
                <h4 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[var(--rbe-primary)] mb-2 sm:mb-3">{title}</h4>
                <p className="text-sm sm:text-base text-[var(--rbe-text)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ COMO ATUAMOS ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-[var(--rbe-card)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)] text-center mb-12 sm:mb-16 lg:mb-20">Como atuamos</h2>
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 sm:gap-12 relative">
            <div className="absolute top-12 left-[10%] w-[80%] h-1 border-t-4 border-dotted border-[var(--rbe-card-border)] hidden md:block -z-10" />
            {[
              { n: 1, Icon: Heart, title: "Acolher", desc: "Recebemos o estudante sem julgamentos em um ambiente digital seguro e acolhedor." },
              { n: 2, Icon: Map, title: "Mapear", desc: "Identificamos padrões e níveis de risco emocional via IA e escalas cientificamente validadas." },
              { n: 3, Icon: TrendingUp, title: "Encaminhar", desc: "Direcionamos para o cuidado especializado de forma ágil e precisa, garantindo a continuidade." },
            ].map(({ n, Icon, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center flex-1 w-full">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--rbe-primary)] text-white rounded-full flex items-center justify-center mb-5 sm:mb-7 shadow-xl relative">
                  <span className="absolute -top-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 bg-[var(--rbe-secondary)] rounded-full flex items-center justify-center text-[var(--rbe-cta-bg)] font-black text-lg sm:text-xl border-4 border-[var(--rbe-card)]">
                    {n}
                  </span>
                  <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>
                <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--rbe-primary)] mb-2 sm:mb-3">{title}</h4>
                <p className="text-sm sm:text-base text-[var(--rbe-text)] px-2 sm:px-4 max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CUIDADO QUE CONVERSA COM A REALIDADE ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center bg-[var(--rbe-lilac-light)] rounded-[32px] sm:rounded-[48px] lg:rounded-[64px] p-6 sm:p-10 lg:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--rbe-secondary)]/20 rbe-organic-shape-1 -translate-y-1/2 translate-x-1/2" />
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] overflow-hidden shadow-2xl relative">
              <img
                alt="Grupo diverso de estudantes universitários conversando ao ar livre"
                className="w-full h-[280px] sm:h-[380px] lg:h-[500px] object-cover"
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--rbe-cta-bg)]/60 to-transparent" />
            </div>
            <div className="absolute top-6 right-2 sm:top-8 sm:-right-4 lg:-right-10 rbe-glass-card p-3 sm:p-4 rounded-2xl shadow-xl w-32 sm:w-36 lg:w-40">
              <p className="text-[10px] font-bold text-[var(--rbe-primary)] mb-2">Check-in</p>
              <div className="h-1 w-full bg-[var(--rbe-secondary)] rounded" />
            </div>
            <div className="absolute bottom-12 left-2 sm:bottom-16 sm:-left-4 lg:-left-10 bg-[var(--rbe-card)] p-3 sm:p-4 rounded-2xl shadow-xl w-40 sm:w-44 lg:w-48 rotate-3">
              <p className="text-xs font-bold text-[var(--rbe-primary)] flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                Exercício guiado
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-[var(--rbe-primary)] mb-6 sm:mb-7 lg:mb-8 leading-tight">
              Cuidado que conversa com a realidade universitária
            </h2>
            <div className="space-y-4 sm:space-y-5">
              {[
                "Linguagem acessível e acolhedora",
                "Acesso mobile nativo para rotinas intensas",
                "Dashboards com visão de progresso real",
              ].map((text) => (
                <div key={text} className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--rbe-card)] rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--rbe-primary)]" />
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg text-[var(--rbe-text)] font-medium">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ NOSSOS PRINCÍPIOS ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)] text-center mb-10 sm:mb-14 lg:mb-20">
          Nossos princípios
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {[
            { Icon: ShieldCheck, title: "Ética", desc: "Rigor científico total" },
            { Icon: Lock, title: "Privacidade", desc: "LGPD em cada dado" },
            { Icon: Ear, title: "Escuta", desc: "Presença genuína" },
            { Icon: Lightbulb, title: "Clareza", desc: "Sem burocracia" },
            { Icon: Activity, title: "Cuidado Contínuo", desc: "Acompanhamento real" },
            { Icon: Users, title: "Diversidade", desc: "Respeito às vozes" },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-[var(--rbe-card)] p-5 sm:p-6 lg:p-8 rounded-[24px] sm:rounded-[28px] text-center border border-[var(--rbe-card-border)] hover:border-[var(--rbe-primary)]/20 transition-all hover:-translate-y-1">
              <Icon className="w-8 h-8 sm:w-9 sm:h-9 mx-auto text-[var(--rbe-secondary)] mb-3" />
              <h5 className="font-bold text-[var(--rbe-primary)] mb-1.5 text-sm">{title}</h5>
              <p className="text-[11px] sm:text-[10px] text-[var(--rbe-text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ O QUE NOS DIFERENCIA ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-[var(--rbe-cta-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white text-center mb-10 sm:mb-14 lg:mb-20">
            O que nos diferencia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {[
              { Icon: Sparkles, title: "IA Especializada", desc: "Treinada especificamente em contextos acadêmicos e pedagógicos para entender o estudante real." },
              { Icon: Zap, title: "Resposta em Tempo Real", desc: "Redução drástica no tempo entre a identificação de risco e o atendimento especializado." },
              { Icon: ClipboardList, title: "Protocolos Validados", desc: "Base científica sólida utilizando as melhores escalas de saúde mental reconhecidas globalmente." },
              { Icon: Workflow, title: "Integração Nativa", desc: "Conectamos com os sistemas que a universidade já utiliza, como AVAs e plataformas de gestão." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm p-6 sm:p-8 lg:p-10 rbe-rounded-huge border border-white/10 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--rbe-secondary)] rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--rbe-cta-bg)]" />
                </div>
                <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3">{title}</h4>
                <p className="text-sm sm:text-base text-white/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ IMPACTO ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)] text-center mb-10 sm:mb-14 lg:mb-20">
          Impacto que queremos gerar
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[
            { v: "+90%", title: "Mais Permanência", desc: "Redução direta na evasão causada por questões emocionais." },
            { v: "+85%", title: "Mais Pertencimento", desc: "Fortalecimento dos laços com a comunidade acadêmica." },
            { v: "100%", title: "Mais Clareza", desc: "Visibilidade total dos gargalos emocionais institucionais." },
            { v: "24/7", title: "Mais Acesso", desc: "Suporte emocional em qualquer horário, para todos." },
          ].map(({ v, title, desc }) => (
            <div key={title} className="bg-[var(--rbe-card)] p-5 sm:p-8 lg:p-10 rounded-[24px] sm:rounded-[32px] text-center shadow-sm border border-[var(--rbe-card-border)]">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--rbe-secondary)] mb-2 sm:mb-3">{v}</div>
              <h6 className="font-extrabold text-[var(--rbe-primary)] mb-1.5 sm:mb-2 text-sm sm:text-base">{title}</h6>
              <p className="text-[11px] sm:text-xs text-[var(--rbe-text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[var(--rbe-cta-bg)] rbe-rounded-huge p-8 sm:p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--rbe-secondary)]/20 rbe-organic-shape-1 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--rbe-lilac-light)]/10 rbe-organic-shape-2 translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-6 sm:mb-7 lg:mb-8 leading-tight">
              Vamos construir uma cultura de cuidado mais inteligente?
            </h2>
            <p className="text-white/85 text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 lg:mb-12">
              Junte-se à Rede Bem-Estar e transforme a saúde mental na sua instituição com dados e acolhimento.
            </p>
            <button
              onClick={() => goTo("/contato")}
              className="bg-[var(--rbe-secondary)] text-[var(--rbe-cta-bg)] px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-full font-black text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              Solicitar demonstração gratuita
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutRedeBemEstar;
