import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath, DEFAULT_TENANT_SLUG } from "@/utils/tenantHelpers";
import {
  HeartHandshake, Target, Eye, Sparkles, Bot, BookOpen, BarChart3, Brain,
  GraduationCap, UserCheck, Building2, Heart, Map, TrendingUp, CheckCheck,
  ShieldCheck, Lock, Ear, Lightbulb, Activity, Users, Zap, ClipboardList,
  Workflow, LineChart, PlayCircle,
} from "lucide-react";
import rightSideImage from "../../assets/image_1f2243.png";
import estudantesVideo from "@/assets/estudantes.mp4";
import professoresVideo from "@/assets/professores.mp4";
import instituicoesVideo from "@/assets/instituicoes.mp4";

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
        <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[600px] flex items-center justify-center overflow-hidden">
          <img 
            src={rightSideImage} 
            alt="Composição de cards flutuantes da plataforma" 
            className="w-full h-full object-contain max-w-[280px] sm:max-w-md lg:max-w-xl"
          />
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
            {/* <div className="inline-block px-5 sm:px-6 py-3 bg-[var(--rbe-cta-bg)] text-[var(--rbe-secondary)] rounded-2xl text-base sm:text-lg lg:text-xl font-extrabold italic">
              "Cuidar melhor também é decidir melhor."
            </div> */}
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
              { Icon: BarChart3, title: "Gestão por Dados", desc: "Dashboards estratégicos para gestores mapearem a saúde mental coletiva e prevenirem a evasão.", chip: "Big Data", bg: "bg-[var(--rbe-secondary)]/20" },
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
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)]">
      Para quem fazemos
    </h2>

    <p className="text-sm sm:text-base text-[var(--rbe-text-muted)] mt-3 sm:mt-4">
      Fortalecendo cada elo da comunidade acadêmica.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
    {[
      {
        title: "Estudantes",
        desc: "Suporte emocional imediato, ferramentas de autoconhecimento e uma rede de proteção sempre disponível.",
        video: estudantesVideo,
      },
      {
        title: "Professores",
        desc: "Capacitação para identificar sinais precoces e ferramentas para um acolhimento mais seguro e eficaz.",
        video: professoresVideo,
      },
      {
        title: "Instituições",
        desc: "Gestão estratégica baseada em dados reais, redução de evasão e fortalecimento da marca institucional.",
        video: instituicoesVideo,
      },
    ].map(({ title, desc, video }) => (
      <div
        key={title}
        className="bg-[var(--rbe-card)] rounded-[32px] sm:rounded-[40px] overflow-hidden border border-[var(--rbe-card-border)] shadow-sm hover:shadow-2xl transition-all duration-300"
      >
        {/* Vídeo */}
        <div className="h-48 sm:h-56 lg:h-64 overflow-hidden">
          <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Conteúdo */}
        <div className="p-6 sm:p-8 lg:p-10">
          <h4 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[var(--rbe-primary)] mb-2 sm:mb-3">
            {title}
          </h4>

          <p className="text-sm sm:text-base text-[var(--rbe-text)] leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    ))}
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
