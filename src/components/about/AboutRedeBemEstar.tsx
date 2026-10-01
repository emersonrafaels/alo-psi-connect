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

const BuddyHeroComposition = () => {
  const cardClass = `
    bg-[var(--rbe-card)]
    border border-[var(--rbe-card-border)]
    shadow-[0_14px_34px_rgba(73,43,123,0.10)]
  `;

  return (
    <div className="w-full min-w-0">
      {/* =========================================================
          DESKTOP / TABLET GRANDE
      ========================================================= */}
      <div className="hidden lg:flex w-full justify-end">
        <div className="relative w-full max-w-[650px]">
          {/* Glow */}
          <div
            className="
              absolute
              left-1/2
              top-1/2
              -translate-x-1/2
              -translate-y-1/2
              w-[400px]
              h-[400px]
              rounded-full
              bg-[var(--rbe-lilac-light)]/20
              blur-3xl
              pointer-events-none
            "
          />

          <div
            className="
              relative z-10
              grid
              grid-cols-[1fr_1.25fr_1fr]
              grid-rows-[145px_185px_185px_150px]
              gap-x-6
              gap-y-5
              items-center
            "
          >
            {/* ═════ META ═════ */}
            <div
              className={`
                ${cardClass}
                col-start-2 row-start-1
                justify-self-center self-end
                w-[200px]
                rounded-[24px]
                p-4
                -rotate-[2deg]
              `}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="
                    w-9 h-9
                    shrink-0
                    rounded-xl
                    bg-[var(--rbe-secondary)]/15
                    flex items-center justify-center
                  "
                >
                  <Target className="w-4 h-4 text-[var(--rbe-secondary)]" />
                </div>

                <div>
                  <p className="text-xs font-bold text-[var(--rbe-text)] leading-tight">
                    Meta de bem-estar
                  </p>

                  <p className="text-[10px] leading-relaxed text-[var(--rbe-text-muted)] mt-1">
                    Respire fundo, você está indo bem!
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-bold text-[var(--rbe-secondary)] mb-2">
                3/5 dias
              </p>

              <div className="h-[6px] bg-[var(--rbe-surface-variant)] rounded-full overflow-hidden">
                <div className="w-[60%] h-full bg-[var(--rbe-secondary)] rounded-full" />
              </div>
            </div>

            {/* ═════ CHECK-IN ═════ */}
            <div
              className={`
                ${cardClass}
                relative
                col-start-1 row-start-2
                justify-self-end
                w-[205px]
                rounded-[24px]
                p-4
                -rotate-[1deg]
              `}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--rbe-text-muted)] mb-3">
                Check-in diário
              </p>

              <div className="flex items-center justify-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--rbe-lilac-light)] flex items-center justify-center text-sm">
                  😌
                </div>

                <div
                  className="
                    w-11 h-11
                    rounded-full
                    bg-[var(--rbe-card)]
                    ring-4 ring-[var(--rbe-secondary)]
                    flex items-center justify-center
                    text-lg
                  "
                >
                  😊
                </div>

                <div className="w-8 h-8 rounded-full bg-[var(--rbe-lilac-light)] flex items-center justify-center text-sm">
                  😍
                </div>
              </div>

              <div
                className="
                  absolute
                  bottom-0 left-0 right-0
                  h-[6px]
                  bg-[var(--rbe-secondary)]
                  rounded-b-[24px]
                "
              />
            </div>

            {/* ═════ DASHBOARD ═════ */}
            <div
              className="
                col-start-3 row-start-2
                justify-self-start
                w-[215px]
                rounded-[24px]
                p-5
                bg-gradient-to-br
                from-[#35127c]
                via-[#5420b7]
                to-[#7430df]
                border border-white/10
                shadow-[0_18px_44px_rgba(79,33,166,0.25)]
                rotate-[2deg]
              "
            >
              <div className="flex justify-between items-center mb-4">
                <BarChart3 className="w-5 h-5 text-[#59e1d5]" />

                <span className="text-[8px] font-bold text-white bg-white/15 rounded-md px-2 py-1">
                  LIVE
                </span>
              </div>

              <p className="text-[10px] text-white/75">
                Engajamento Institucional
              </p>

              <p className="text-[28px] leading-none font-black text-white mt-1">
                87.4%
              </p>

              <div className="mt-4 h-[6px] bg-white/15 rounded-full overflow-hidden">
                <div className="w-[87%] h-full bg-[#59e1d5] rounded-full" />
              </div>
            </div>

            {/* ═════ BUDDY CENTRAL ═════ */}
            <div
              className="
                col-start-2
                row-start-2
                row-span-2
                self-center
                justify-self-center
                z-20
                w-[300px]
                pointer-events-none
              "
            >
              <img
                src={rightSideImage}
                alt="Buddy, assistente virtual da Rede Bem-Estar"
                className="
                  block
                  w-full
                  h-auto
                  object-contain
                  drop-shadow-[0_28px_40px_rgba(83,30,190,0.30)]
                "
              />
            </div>

            {/* ═════ CONVERSAR ═════ */}
            <div
              className={`
                ${cardClass}
                col-start-1 row-start-3
                justify-self-end
                w-[195px]
                rounded-[24px]
                p-4
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="
                    w-10 h-10
                    shrink-0
                    rounded-xl
                    bg-[var(--rbe-lilac-light)]
                    flex items-center justify-center
                  "
                >
                  <Heart className="w-5 h-5 text-[var(--rbe-primary)]" />
                </div>

                <div>
                  <p className="text-xs font-bold text-[var(--rbe-text)]">
                    Precisa conversar?
                  </p>

                  <p className="text-[10px] text-[var(--rbe-text-muted)] mt-1">
                    Estamos aqui por você.
                  </p>
                </div>
              </div>

              <div
                className="
                  rounded-xl
                  bg-[var(--rbe-lilac-light)]
                  py-2
                  text-center
                  text-[10px]
                  font-bold
                  text-[var(--rbe-primary)]
                "
              >
                Falar com Buddy
              </div>
            </div>

            {/* ═════ BUDDY CARD ═════ */}
            <div
              className={`
                ${cardClass}
                col-start-3 row-start-3
                justify-self-start
                w-[210px]
                rounded-[24px]
                p-4
                rotate-[1deg]
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="
                    w-10 h-10
                    shrink-0
                    rounded-xl
                    bg-[var(--rbe-secondary)]
                    flex items-center justify-center
                  "
                >
                  <Bot className="w-5 h-5 text-[var(--rbe-primary)]" />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-[var(--rbe-primary)]">
                    Buddy
                  </p>

                  <p className="text-[10px] text-[var(--rbe-text-muted)]">
                    Inteligência Ativa
                  </p>
                </div>
              </div>

              <div
                className="
                  rounded-xl
                  bg-[var(--rbe-surface-variant)]
                  px-3
                  py-2.5
                  border-l-[3px]
                  border-[var(--rbe-secondary)]
                "
              >
                <p className="text-[11px] italic leading-relaxed text-[var(--rbe-text)]">
                  “Estou aqui para ouvir você agora.”
                </p>
              </div>
            </div>

            {/* ═════ RECURSOS ═════ */}
            <div
              className={`
                ${cardClass}
                col-start-2 row-start-4
                justify-self-center self-start
                w-[200px]
                rounded-[24px]
                p-4
                rotate-[2deg]
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    w-9 h-9
                    shrink-0
                    rounded-xl
                    bg-[var(--rbe-lilac-light)]
                    flex items-center justify-center
                  "
                >
                  <Ear className="w-4 h-4 text-[var(--rbe-primary)]" />
                </div>

                <div>
                  <p className="text-xs font-bold text-[var(--rbe-text)]">
                    Recursos de apoio
                  </p>

                  <p className="text-[10px] leading-relaxed text-[var(--rbe-text-muted)] mt-1">
                    Conteúdos e ferramentas para cuidar de você.
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[10px] font-bold text-[var(--rbe-primary)]">
                Explorar recursos →
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE / TABLET
      ========================================================= */}
      <div className="lg:hidden w-full max-w-[460px] mx-auto px-2 sm:px-4">
        <div
          className="
            relative
            grid
            grid-cols-2
            gap-3
            sm:gap-4
            items-start
          "
        >
          {/* META */}
          <div
            className={`
              ${cardClass}
              col-span-2
              justify-self-center
              w-[200px]
              rounded-[22px]
              p-4
              -rotate-[2deg]
            `}
          >
            <div className="flex gap-3 items-start mb-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-[var(--rbe-secondary)]/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-[var(--rbe-secondary)]" />
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--rbe-text)]">
                  Meta de bem-estar
                </p>

                <p className="text-[10px] text-[var(--rbe-text-muted)] mt-1">
                  Respire fundo, você está indo bem!
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[var(--rbe-secondary)]">
                3/5 dias
              </span>
            </div>

            <div className="h-[6px] rounded-full bg-[var(--rbe-surface-variant)] overflow-hidden">
              <div className="w-[60%] h-full rounded-full bg-[var(--rbe-secondary)]" />
            </div>
          </div>

          {/* BUDDY MOBILE */}
          <div
            className="
              col-span-2
              relative
              flex
              items-center
              justify-center
              h-[260px]
              sm:h-[310px]
              my-2
            "
          >
            <div
              className="
                absolute
                w-[240px]
                h-[240px]
                rounded-full
                bg-[var(--rbe-lilac-light)]/30
                blur-3xl
              "
            />

            <img
              src={rightSideImage}
              alt="Buddy, assistente virtual da Rede Bem-Estar"
              className="
                relative
                z-10
                w-[210px]
                sm:w-[250px]
                h-auto
                object-contain
                drop-shadow-[0_22px_32px_rgba(83,30,190,0.28)]
              "
            />
          </div>

          {/* CHECK-IN */}
          <div
            className={`
              ${cardClass}
              relative
              col-span-1
              rounded-[20px]
              p-3.5
              min-h-[128px]
            `}
          >
            <p className="text-[9px] font-black uppercase tracking-wide text-[var(--rbe-text-muted)] mb-4">
              Check-in
            </p>

            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--rbe-lilac-light)] flex items-center justify-center text-xs">
                😌
              </div>

              <div
                className="
                  w-10 h-10
                  rounded-full
                  bg-[var(--rbe-card)]
                  ring-[3px]
                  ring-[var(--rbe-secondary)]
                  flex items-center justify-center
                  text-base
                "
              >
                😊
              </div>

              <div className="w-7 h-7 rounded-full bg-[var(--rbe-lilac-light)] flex items-center justify-center text-xs">
                😍
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-[var(--rbe-secondary)] rounded-b-[20px]" />
          </div>

          {/* DASHBOARD */}
          <div
            className="
              col-span-1
              rounded-[20px]
              p-4
              min-h-[128px]
              bg-gradient-to-br
              from-[#35127c]
              via-[#5420b7]
              to-[#7430df]
              border border-white/10
              shadow-[0_16px_36px_rgba(79,33,166,0.24)]
            "
          >
            <div className="flex justify-between items-center mb-3">
              <BarChart3 className="w-4 h-4 text-[#59e1d5]" />

              <span className="text-[7px] text-white bg-white/15 rounded px-1.5 py-1">
                LIVE
              </span>
            </div>

            <p className="text-[8px] text-white/70 leading-tight">
              Engajamento
            </p>

            <p className="text-xl font-black text-white mt-1">
              87.4%
            </p>

            <div className="mt-3 h-[5px] rounded-full bg-white/15">
              <div className="w-[87%] h-full rounded-full bg-[#59e1d5]" />
            </div>
          </div>

          {/* CONVERSAR */}
          <div
            className={`
              ${cardClass}
              col-span-1
              rounded-[20px]
              p-3.5
              min-h-[145px]
            `}
          >
            <div className="flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--rbe-lilac-light)] flex items-center justify-center">
                <Heart className="w-4 h-4 text-[var(--rbe-primary)]" />
              </div>

              <div>
                <p className="text-[11px] font-bold text-[var(--rbe-text)]">
                  Precisa conversar?
                </p>

                <p className="text-[9px] text-[var(--rbe-text-muted)] mt-1">
                  Estamos aqui por você.
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg py-2 text-center text-[9px] font-bold bg-[var(--rbe-lilac-light)] text-[var(--rbe-primary)]">
              Falar com Buddy
            </div>
          </div>

          {/* BUDDY CARD */}
          <div
            className={`
              ${cardClass}
              col-span-1
              rounded-[20px]
              p-3.5
              min-h-[145px]
            `}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-[var(--rbe-secondary)] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[var(--rbe-primary)]" />
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--rbe-primary)]">
                  Buddy
                </p>

                <p className="text-[8px] text-[var(--rbe-text-muted)]">
                  Inteligência Ativa
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--rbe-surface-variant)] px-3 py-2 border-l-[3px] border-[var(--rbe-secondary)]">
              <p className="text-[9px] italic text-[var(--rbe-text)]">
                “Estou aqui para ouvir você.”
              </p>
            </div>
          </div>

          {/* RECURSOS */}
          <div
            className={`
              ${cardClass}
              col-span-2
              justify-self-center
              w-full
              max-w-[270px]
              rounded-[20px]
              p-4
              mt-1
            `}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--rbe-lilac-light)] flex items-center justify-center shrink-0">
                <Ear className="w-4 h-4 text-[var(--rbe-primary)]" />
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--rbe-text)]">
                  Recursos de apoio
                </p>

                <p className="text-[9px] text-[var(--rbe-text-muted)] mt-1">
                  Conteúdos e ferramentas para cuidar de você.
                </p>
              </div>
            </div>

            <p className="text-[9px] font-bold text-[var(--rbe-primary)] mt-3">
              Explorar recursos →
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="rbe-about-page bg-[var(--rbe-bg)] text-[var(--rbe-text)] overflow-x-hidden">
      {/* ═══════ HERO ═══════ */}
      <header
  className="
    pt-12 pb-16
    sm:pt-20 sm:pb-24
    lg:pt-28 lg:pb-32
    px-4 sm:px-6 lg:px-8
    max-w-[1400px]
    mx-auto
    grid
    grid-cols-1
    lg:grid-cols-[0.9fr_1.1fr]
    gap-10
    lg:gap-8
    items-center
  "
>        <div className="relative z-10 min-w-0">
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
{/* Composition of floating cards */}
<BuddyHeroComposition />
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
        <div className="bg-[var(--rbe-card)] p-6 sm:p-10 lg:p-12 rbe-rounded-huge border border-[var(--rbe-card-border)] hover:border-[var(--rbe-primary)]/20 transition-all group">
  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--rbe-lilac-light)] rounded-2xl flex items-center justify-center mb-5 sm:mb-7 group-hover:bg-[var(--rbe-primary)] transition-colors">
    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--rbe-primary)] group-hover:text-white transition-colors" />
  </div>

  <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--rbe-primary)] mb-3 sm:mb-4">
    Propósito
  </h3>

  <p className="text-sm sm:text-base text-[var(--rbe-text)] leading-relaxed">
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
                  <span className="absolute -top-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 bg-[var(--rbe-secondary)] rounded-full flex items-center justify-center text-[var(--rbe-cta-bg)] font-black text-lg sm:text-xl border-4 border-[var(--rbe-card)]">{n}</span>
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
          <div className="relative order-2 lg:order-1 rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl">
            <video src={estudantesVideo} autoPlay muted loop playsInline className="w-full h-[280px] sm:h-[380px] lg:h-[500px] object-cover" />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-[var(--rbe-primary)] mb-6 sm:mb-7 lg:mb-8 leading-tight">Cuidado que conversa com a realidade universitária</h2>
            <div className="space-y-4 sm:space-y-5">
              {["Linguagem acessível e acolhedora", "Acesso mobile para rotinas intensas", "Indicadores com visão de progresso real"].map((text) => (
                <div key={text} className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--rbe-card)] rounded-full flex items-center justify-center shrink-0 shadow-sm"><CheckCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--rbe-primary)]" /></div>
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
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--rbe-primary)] text-center mb-10 sm:mb-14 lg:mb-20">Impacto que queremos gerar</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[
            { v: "+90%", title: "Mais Permanência", desc: "Redução direta na evasão causada por questões emocionais." },
            { v: "+85%", title: "Mais Pertencimento", desc: "Fortalecimento dos laços com a comunidade acadêmica." },
            { v: "100%", title: "Mais Clareza", desc: "Visibilidade dos desafios emocionais institucionais." },
            { v: "24/7", title: "Mais Acesso", desc: "Apoio emocional em qualquer horário, para todos." },
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
