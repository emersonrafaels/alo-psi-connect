import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import "./HomeRedeBemEstar.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useShowPrices } from "@/hooks/useShowPrices";
import { buildTenantPath } from "@/utils/tenantHelpers";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import BuddyCharacter from "@/components/hero/BuddyCharacter";
import { BuddyDailyBrief } from "@/components/buddy/BuddyDailyBrief";
import buddyVideo from "../../videos/buddy2.mp4";
import buddyAME from "../../videos/buddyAME.mp4";
import {
  Heart, Clock, Users, Brain, EyeOff, Bot, BookOpen, Sparkles,
  ClipboardCheck, LineChart, LayoutDashboard, FileText, Stethoscope,
  CalendarDays, AlertTriangle, Building2, Moon, UserSearch,
  ArrowRight, TrendingUp, HeartHandshake, Smartphone, CheckCircle2,
  MessageCircle, ShieldCheck, Bell, Activity, Eye, Battery,
  Zap, Quote,
} from "lucide-react";
import heroImg from "@/assets/students-hero.png";
import ameImg from "@/assets/home-rbe-ame.jpg";
import buddyImg from "@/assets/buddy-main.png";
import buddyChat from "@/assets/buddy-chat.png";
import EmotionalCheckinHome from "@/components/emotionalcheckinhome/emotionalcheckinhome";
interface FeaturedProfessional {
  id: number;
  display_name: string;
  profissao: string | null;
  crp_crm: string | null;
  servicos_raw: string | null;
  preco_consulta: number | null;
  foto_perfil_url: string | null;
}

const WHATSAPP_NUMBER = "5511937074332";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Quero conhecer a Rede Bem-Estar."
)}`;

const HomeRedeBemEstar = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || "alopsi";
  const showPrices = useShowPrices();
  const [featured, setFeatured] = useState<FeaturedProfessional[]>([]);
  const [loadingPros, setLoadingPros] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || !('IntersectionObserver' in window)) return;
    const cards = page.querySelectorAll<HTMLElement>('.rbe-ame-card, .rbe-chat-card, .rbe-diary-card, .rbe-service-panel');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('rbe-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    cards.forEach(card => {
      card.classList.add('rbe-reveal');
      observer.observe(card);
    });
    return () => {
      observer.disconnect();
      cards.forEach(card => card.classList.remove('rbe-reveal', 'rbe-in-view'));
    };
  }, []);

  const moveCardLight = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>('.rbe-ame-card, .rbe-chat-card, .rbe-diary-card, .rbe-service-panel');
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--light-x', ((event.clientX - bounds.left) / bounds.width * 100) + '%');
    card.style.setProperty('--light-y', ((event.clientY - bounds.top) / bounds.height * 100) + '%');
  };


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!tenant) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profissionais")
          .select(
            `id, display_name, profissao, crp_crm, servicos_raw, preco_consulta, foto_perfil_url,
             professional_tenants!inner(tenant_id, is_featured, featured_order)`
          )
          .eq("ativo", true)
          .eq("professional_tenants.tenant_id", tenant.id)
          .eq("professional_tenants.is_featured", true)
          .not("preco_consulta", "is", null)
          .limit(3);
        if (error) throw error;
        const sorted = (data || []).sort((a: any, b: any) => {
          const oa = a.professional_tenants?.[0]?.featured_order || 999;
          const ob = b.professional_tenants?.[0]?.featured_order || 999;
          return oa - ob;
        });
        if (!cancelled) setFeatured(sorted as any);
      } catch (e) {
        console.error("Erro ao buscar profissionais em destaque:", e);
      } finally {
        if (!cancelled) setLoadingPros(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant]);

  const goToContact = () => {
    navigate(buildTenantPath(tenantSlug, "/contato"));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  const goToProfessionals = () => {
    navigate(buildTenantPath(tenantSlug, "/profissionais"));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  const goToProfessional = (id: number | string) => {
    navigate(`/professional/${id}`);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const formatSpecialties = (s: string | null) =>
    !s ? [] : s.split(",").map(x => x.trim()).filter(Boolean).slice(0, 3);

  return (
    <div ref={pageRef} onPointerMove={moveCardLight} className="rbe-home-page min-h-screen overflow-x-hidden">
      <Header />
      <BuddyDailyBrief />

      {/* ═════════ HERO ═════════ */}
      <header className="relative pt-16 sm:pt-24 pb-16 sm:pb-24 lg:pt-32 lg:pb-32 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl"
             style={{ background: "var(--rbe-tertiary-fixed)" }} />
        <div className="absolute -bottom-24 -left-24 w-[24rem] h-[24rem] rounded-full opacity-40 blur-3xl"
             style={{ background: "var(--rbe-secondary-fixed)" }} />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                    style={{ background: "var(--rbe-secondary-container)", color: "var(--rbe-on-secondary-container)" }}>
                <Heart className="w-3.5 h-3.5" fill="currentColor" />
                Cuidado Ativo
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] mb-6 sm:mb-8 tracking-tighter"
                  style={{ color: "var(--rbe-primary)" }}>
                Cuidar da mente é cultivar o futuro.
              </h1>
              <p className="text-base sm:text-lg lg:text-xl font-light leading-relaxed mb-8 sm:mb-10 max-w-lg"
                 style={{ color: "var(--rbe-on-surface-variant)" }}>
                Uma infraestrutura completa de bem-estar institucional que acolhe, mapeia e conecta
                indivíduos em um ecossistema seguro e humano.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <button
                  onClick={goToContact}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-all hover:scale-105 shadow-lg"
                  style={{
                    background: "var(--rbe-primary-container)",
                    color: "var(--rbe-on-primary)",
                    boxShadow: "0 10px 30px -10px rgba(91,33,142,0.4)",
                  }}
                >
                  Agendar Demonstração
                </button>
                <button
                  onClick={() => scrollTo("metodologia-ame")}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-colors"
                  style={{
                    border: "1px solid var(--rbe-outline-variant)",
                    color: "var(--rbe-primary)",
                    background: "transparent",
                  }}
                >
                  Conhecer Mais
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 rounded-[2rem] sm:rounded-[3rem] overflow-hidden aspect-[4/5] shadow-2xl">
                <img
                  src={heroImg}
                  alt="Profissional acolhedora da Rede Bem-Estar"
                  className="w-full h-full object-cover"
                  width={832}
                  height={1024}
                />
                <div className="rbe-glass absolute bottom-4 sm:bottom-8 left-4 sm:left-8 p-4 sm:p-6 rounded-2xl max-w-[200px] sm:max-w-[240px]">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2"
                     style={{ color: "var(--rbe-primary)" }}>
                    Impacto Real
                  </p>
                  <p className="text-xs sm:text-sm font-medium italic leading-snug"
                     style={{ color: "var(--rbe-on-surface)" }}>
                    "Hoje minha saúde mental melhorou muito com a Rede Bem-Estar."
                    </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      

      {/* ═════════ METODOLOGIA AME ═════════ */}
      <section id="metodologia-ame" className="py-16 sm:py-20 lg:py-24 relative overflow-hidden"
               style={{ background: "var(--rbe-surface-container-lowest)" }}>
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rbe-section-heading">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4"
                style={{ color: "var(--rbe-primary)" }}>
              Metodologia AME
            </h2>
            <p className="rbe-section-description"
               style={{ color: "var(--rbe-secondary)" }}>
              O ciclo de cuidado que transforma a experiência institucional.
            </p>
          </div>
          <div className="rbe-ame-grid">
            {[
              {
                letter: "A",
                title: "Acolhimento",
                sub: "A porta de entrada do cuidado",
                desc: "Acolhimento reduz resistência, gera vínculo, amplia pertencimento e torna o cuidado mais próximo.",
                color: "var(--rbe-brand-purple)",
                items: [
                  { Icon: Bot, label: "Buddy" },
                  { Icon: BookOpen, label: "Diário Emocional" },
                  { Icon: Users, label: "Grupos temáticos" },
                  { Icon: Sparkles, label: "Autorregulação" },
                ],
              },
              {
                letter: "M",
                title: "Mapeamento",
                sub: "Ler vulnerabilidades com ética",
                desc: "Mais do que medir, busca compreender onde o sofrimento se acumula e quais fatores impactam o campus.",
                color: "var(--rbe-brand-mint)",
                items: [
                  { Icon: ClipboardCheck, label: "Escalas" },
                  { Icon: LineChart, label: "ISEU-RBE" },
                  { Icon: LayoutDashboard, label: "Dashboards" },
                  { Icon: FileText, label: "Relatórios" },
                ],
              },
              {
                letter: "E",
                title: "Encaminhamento",
                sub: "Transformar leitura em resposta",
                desc: "A metodologia conecta cada necessidade ao suporte mais adequado, no tempo e intensidade corretos.",
                color: "var(--rbe-brand-pink)",
                items: [
                  { Icon: Stethoscope, label: "Rede Profissional" },
                  { Icon: CalendarDays, label: "Agenda Solidária" },
                  { Icon: AlertTriangle, label: "Protocolos Risco" },
                  { Icon: Building2, label: "Planos de Ação" },
                ],
              },
            ].map(p => (
              <article key={p.letter} className="rbe-ame-card" style={{ "--pillar-accent": p.color } as CSSProperties}>
                <span className="rbe-ame-letter" aria-hidden="true">{p.letter}</span>
                <div className="rbe-ame-copy">
                  <h3>{p.title}</h3>
                  <p className="rbe-ame-subtitle">{p.sub}</p>
                  <p className="rbe-ame-description">{p.desc}</p>
                </div>
                <ul className="rbe-ame-tools">
                  {p.items.map(({ Icon, label }) => (
                    <li key={label}><Icon aria-hidden="true" className="w-4 h-4 shrink-0" /><span>{label}</span></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ INTELIGÊNCIA PREVENTIVA ═════════ */}
      <section className="py-16 sm:py-20 lg:py-24" style={{ background: "var(--rbe-surface)" }}>
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5 sm:mb-6 tracking-tighter"
                style={{ color: "var(--rbe-primary)" }}>
              Bem-estar é inteligência preventiva.
            </h2>
            <p className="text-base sm:text-lg lg:text-xl font-light leading-relaxed mb-8 sm:mb-10"
               style={{ color: "var(--rbe-on-surface-variant)" }}>
              Transformamos o acompanhamento estudantil em uma jornada de cuidado contínuo,
              ética e orientada a dados.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <button onClick={goToContact}
                      className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base hover:scale-105 transition-transform shadow-lg"
                      style={{
                        background: "var(--rbe-primary)",
                        color: "var(--rbe-on-primary)",
                        boxShadow: "0 10px 30px -10px rgba(91,33,142,0.4)",
                      }}>
                Agendar Demonstração
              </button>
              <button onClick={goToContact}
                      className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base"
                      style={{
                        border: "1px solid var(--rbe-outline-variant)",
                        color: "var(--rbe-primary)",
                        background: "transparent",
                      }}>
                Falar com Especialista
              </button>
            </div>
          </div>
          <div className="relative">
  <div
    className="relative p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] overflow-hidden min-h-[320px]"
    style={{
      background: "color-mix(in srgb, var(--rbe-tertiary-fixed) 25%, transparent)"
    }}
  >
    {/* VIDEO COMO BACKGROUND */}
    <video
      src={buddyVideo}
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />

    {/* (opcional) overlay / conteúdo por cima */}
    <div className="relative z-10">
      {/* se quiser colocar algo por cima */}
    </div>
  </div>
</div>
        </div>
      </section>

      {/* ═════════ BENTO — ONDE A TECNOLOGIA ENCONTRA O CORAÇÃO ═════════ */}
      <section className="py-16 sm:py-20 lg:py-24 overflow-hidden" style={{ background: "var(--rbe-surface)" }}>
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 mb-12 sm:mb-16">
            <div className="max-w-xl">
              <h2 className="rbe-journey-label"
                  style={{ color: "var(--rbe-secondary)" }}>
                Sua Jornada Acompanhada
              </h2>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                  style={{ color: "var(--rbe-primary)" }}>
                Onde a tecnologia encontra o coração.
              </h3>
            </div>
            {/* Decorative Buddy on larger screens */}
            <div className="hidden md:flex items-center">
              {/* <BuddyCharacter size="lg" animated /> */}
            </div>
          </div>
          <div className="grid md:grid-cols-12 gap-6 sm:gap-8">
            {/* Buddy removed — chat card expanded to fill space */}
            <div className="rbe-chat-card md:col-span-7 lg:col-span-8 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[320px] sm:min-h-[400px]"
                 style={{
                   background: "var(--rbe-surface-container-lowest)",
                   border: "1px solid rgba(0,0,0,0.04)",
                 }}>
              <div className="rbe-chat-heading"><span className="rbe-buddy-presence"><span aria-hidden="true" /> Buddy</span><span>Um espaço para conversar</span></div>
              <div className="max-w-3xl relative z-10 space-y-5 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: "var(--rbe-secondary)" }}>
                    <img src={buddyChat} alt="Buddy chat" className="w-full h-full object-cover" />
                  </div>
                  <div className="rbe-chat-bubble px-4 sm:px-5 py-3 rounded-2xl"
                       style={{ border: "1px solid color-mix(in srgb, var(--rbe-secondary-container) 30%, transparent)" }}>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--rbe-primary)" }}>
                      Como você está se sentindo hoje?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 ml-8 sm:ml-12">
                  <div className="rbe-chat-answer px-4 sm:px-5 py-3 rounded-2xl"
                       style={{ background: "var(--rbe-primary-container)", color: "var(--rbe-on-primary)" }}>
                    <p className="text-xs sm:text-sm">Um pouco ansioso com as provas...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: "var(--rbe-secondary)" }}>
                    <img src={buddyChat} alt="Buddy chat" className="w-full h-full object-cover" />
                  </div>
                  <div className="rbe-chat-bubble px-4 sm:px-5 py-3 rounded-2xl"
                       style={{ border: "1px solid color-mix(in srgb, var(--rbe-secondary-container) 30%, transparent)" }}>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--rbe-primary)" }}>
                      Te entendo. Que tal um exercício de respiração comigo?
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm font-semibold mb-2"
                     style={{ color: "var(--rbe-secondary)" }}>
                    Buddy
                  </p>
                  <p className="text-base sm:text-lg font-bold" style={{ color: "var(--rbe-primary)" }}>
                    O companheiro acolhedor para qualquer momento, conversando com empatia em tempo real.
                  </p>
                </div>
              </div>
            </div>
            {/* Diário card */}
              <div className="rbe-diary-card md:col-span-5 lg:col-span-4 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[280px]"
                style={{
                  background: "var(--rbe-tertiary-fixed)",
                  border: "1px solid transparent",
                }}>
              <div>
                <BookOpen className="w-8 h-8 mb-4" style={{ color: "var(--rbe-on-tertiary-fixed)" }} />
                <h4 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: "var(--rbe-on-tertiary-fixed)" }}>
                  Diário Emocional
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: "var(--rbe-on-tertiary-fixed)", opacity: 0.85 }}>
                  Registre humor, energia e sono. A IA traduz padrões e devolve insights para sua jornada.
                </p>
              </div>
              <div className="rbe-diary-preview" aria-hidden="true">
                <span>Seu ritmo, seu cuidado</span>
                <svg viewBox="0 0 280 80" fill="none" preserveAspectRatio="none"><path pathLength="1" d="M0 65 C20 65 20 35 40 35 S60 60 80 50 S100 10 125 24 S155 65 180 38 S215 60 240 22 S265 15 280 5" /></svg>
              </div>
              <div className="flex items-center gap-2 mt-6">
                {[Heart, Activity, Moon, Battery, Sparkles].map((Ic, i) => (
                  <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center"
                       style={{ background: "color-mix(in srgb, var(--rbe-primary) 12%, transparent)" }}>
                    <Ic className="w-3.5 h-3.5" style={{ color: "var(--rbe-on-tertiary-fixed)" }} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═════════ DIÁRIO EMOCIONAL ═════════ */}
<EmotionalCheckinHome />

      {/* ═════════ INFOGRÁFICO DE SERVIÇOS ═════════ */}
      <section className="py-16 sm:py-20 lg:py-24 overflow-hidden" style={{ background: "var(--rbe-surface-container-lowest)" }}>
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-3 sm:mb-4" style={{ color: "var(--rbe-primary)" }}>
            Uma rede. Muitas formas de cuidar.
          </h2>
          <div className="rbe-services-intro">
            <HeartHandshake className="w-7 h-7 shrink-0" aria-hidden="true" />
            <p>Apoio a estudantes e professores, ferramentas para o dia a dia e inteligência institucional.
              Um ecossistema conectado para uma experiência universitária mais saudável.</p>
          </div>

          <div className="rbe-services-grid">
            {[
              {
                Icon: Heart, color: "var(--rbe-brand-purple)", textOnIcon: "#fff",
                title: "Cuidado individual",
                items: ["Atendimentos psicológicos", "Atendimentos psiquiátricos", "Encaminhamento para suporte adequado", "Acolhimento com olhar humano e especializado"],
              },
              {
                Icon: Smartphone, color: "var(--rbe-brand-pink)", textOnIcon: "#fff",
                title: "Ferramentas para o aluno",
                items: ["Diário Emocional", "Buddy, companheiro digital de acompanhamento", "Check-ins de humor, energia e ansiedade", "Ferramentas de autorregulação", "Trilhas e conteúdos de bem-estar", "Escalas e testes de acompanhamento emocional", "Agenda Solidária"],
              },
              {
                Icon: Users, color: "var(--rbe-brand-mint)", textOnIcon: "var(--rbe-primary)",
                title: "Experiências coletivas",
                items: ["Grupos temáticos", "Rodas de conversa", "Workshops", "Palestras e ações de conscientização", "Ativações em campus e programas especiais"],
              },
              {
                Icon: Building2, color: "var(--rbe-brand-purple)", textOnIcon: "#fff",
                title: "Soluções para instituições",
                items: ["Dashboard com dados agregados e anônimos", "Diário Emocional com visão institucional", "ISEU-RBE, índice semestral de equilíbrio universitário", "Relatórios estratégicos e reuniões de acompanhamento", "Personalização white-label", "Apoio à permanência, clima institucional e prevenção"],
              },
            ].map(col => (
              <article key={col.title} className="rbe-service-panel">
                <div className="rbe-service-heading">
                  <div className="rbe-service-icon" style={{ background: col.color, color: col.textOnIcon }}><col.Icon className="w-6 h-6" aria-hidden="true" /></div>
                  <h3>{col.title}</h3>
                </div>
                <ul>{col.items.map(item => (
                  <li key={item}><CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /><span>{item}</span></li>
                ))}</ul>
              </article>
            ))}
          </div>
{/* Sub-seção Metodologia AME */}
<div
  className="
    mt-20 sm:mt-24
    pt-16 sm:pt-24
    grid lg:grid-cols-12
    gap-10 lg:gap-12
    items-center
  "
  style={{
    borderTop:
      "1px solid color-mix(in srgb, var(--rbe-outline-variant) 20%, transparent)",
  }}
>
  {/* Vídeo */}
  <div className="lg:col-span-5 flex justify-center">
    <div className="relative w-full max-w-xs sm:max-w-sm aspect-square">
      <div
        className="
          absolute -inset-4
          rounded-[2.5rem]
          opacity-30
          blur-3xl
          animate-pulse
        "
        style={{
          background: "var(--rbe-tertiary-fixed)",
        }}
      />

      <div
        className="
          relative
          w-full h-full
          overflow-hidden
          rounded-[2rem]
          shadow-2xl
        "
        style={{
          border: "8px solid var(--rbe-surface-container-lowest)",
          background: "var(--rbe-surface-container-low)",
        }}
      >
        <video
          src={buddyAME}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  </div>

  {/* Texto */}
  <div className="lg:col-span-7 text-left">
    <span
      className="
        block
        mb-3 sm:mb-4
        text-[10px] sm:text-xs
        font-black
        uppercase
        tracking-[0.3em]
      "
      style={{
        color: "var(--rbe-brand-pink)",
      }}
    >
      Metodologia
    </span>

    <h3
      className="mb-5 sm:mb-6 text-4xl sm:text-5xl font-black"
      style={{
        color: "var(--rbe-primary)",
      }}
    >
      AME.
    </h3>

    <p
      className="mb-10 sm:mb-12 max-w-xl text-base sm:text-lg"
      style={{
        color: "var(--rbe-on-surface-variant)",
      }}
    >
      <span
        className="font-bold"
        style={{
          color: "var(--rbe-primary)",
        }}
      >
        Acolhimento, Mapeamento e Encaminhamento:
      </span>{" "}
      uma lógica de cuidado que identifica necessidades, organiza sinais e
      conecta cada pessoa ao suporte mais adequado.
    </p>

    <div className="relative grid grid-cols-3 gap-3 sm:gap-4 items-start">
      <div
        className="
          absolute
          top-6
          left-1/4 right-1/4
          hidden md:block
          h-px
          border-t border-dashed
        "
        style={{
          borderColor:
            "color-mix(in srgb, var(--rbe-outline-variant) 40%, transparent)",
        }}
      />

      {[
        {
          Icon: UserSearch,
          label: "1. Acolhimento",
          desc: "Escuta ativa e olhar humano.",
          bg: "color-mix(in srgb, var(--rbe-brand-pink) 12%, transparent)",
          color: "var(--rbe-brand-pink)",
        },
        {
          Icon: LineChart,
          label: "2. Mapeamento",
          desc: "Identifica necessidades e organiza sinais.",
          bg: "color-mix(in srgb, var(--rbe-brand-mint) 30%, transparent)",
          color: "var(--rbe-primary)",
        },
        {
          Icon: ArrowRight,
          label: "3. Encaminhamento",
          desc: "Conecta cada pessoa ao suporte mais adequado.",
          bg: "var(--rbe-brand-purple)",
          color: "#fff",
        },
      ].map((step) => (
        <div key={step.label} className="text-center">
          <div
            className="
              relative z-10
              mx-auto
              mb-3 sm:mb-4
              flex
              w-10 h-10
              sm:w-12 sm:h-12
              items-center justify-center
              rounded-full
            "
            style={{
              background: step.bg,
              color: step.color,
              outline: "4px solid var(--rbe-surface-container-lowest)",
            }}
          >
            <step.Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <h5
            className="
              mb-1 sm:mb-2
              text-[10px] sm:text-xs
              font-black
              uppercase
            "
            style={{
              color: "var(--rbe-primary)",
            }}
          >
            {step.label}
          </h5>

          <p
            className="
              px-1 sm:px-2
              text-[10px] sm:text-[0.65rem]
              leading-relaxed
            "
            style={{
              color: "var(--rbe-on-surface-variant)",
            }}
          >
            {step.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</div>

          {/* AME impact strip */}
          <div className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { Icon: Heart, title: "Mais escuta", desc: "Ambientes mais acolhedores e humanizados." },
              { Icon: Eye, title: "Mais clareza", desc: "Dados e inteligência para decisões mais eficazes." },
              { Icon: TrendingUp, title: "Mais ação", desc: "Intervenções que promovem bem-estar e permanência." },
              { Icon: Users, title: "Para todos", desc: "Estudantes, professores e instituições." },
            ].map((c, i) => (
              <div key={c.title} className="p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center"
                   style={{ background: `color-mix(in srgb, var(--rbe-primary) ${100 - i * 5}%, transparent)`, color: "#fff" }}>
                <c.Icon className="w-5 h-5 mb-2 opacity-70" />
                <p className="font-bold text-sm">{c.title}</p>
                <p className="text-[10px] sm:text-[0.65rem] opacity-70 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ NOSSA REDE DE PROFISSIONAIS ═════════ */}
      {(loadingPros || featured.length > 0) && (
        <section className="py-16 sm:py-20 lg:py-24" style={{ background: "var(--rbe-surface)" }}>
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase mb-3 sm:mb-4"
                  style={{ color: "var(--rbe-secondary)" }}>
                Nossa Rede de Cuidado
              </h2>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6"
                  style={{ color: "var(--rbe-primary)" }}>
                Profissionais que acolhem com presença.
              </h3>
              <p className="text-base sm:text-lg max-w-2xl mx-auto"
                 style={{ color: "var(--rbe-on-surface-variant)" }}>
                Psicólogos e psiquiatras selecionados, supervisionados e alinhados ao contexto universitário.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {loadingPros
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-6 rounded-[2rem] animate-pulse"
                         style={{ background: "var(--rbe-surface-container-lowest)" }}>
                      <div className="w-20 h-20 rounded-full mb-4" style={{ background: "var(--rbe-surface-container)" }} />
                      <div className="h-5 rounded mb-2 w-3/4" style={{ background: "var(--rbe-surface-container)" }} />
                      <div className="h-4 rounded mb-2 w-1/2" style={{ background: "var(--rbe-surface-container)" }} />
                      <div className="h-3 rounded w-full" style={{ background: "var(--rbe-surface-container)" }} />
                    </div>
                  ))
                : featured.map(p => {
                    const specialties = formatSpecialties(p.servicos_raw);
                    return (
                      <div key={p.id}
                           className="p-6 sm:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col"
                           style={{ background: "var(--rbe-surface-container-lowest)" }}>
                        <div className="flex items-start gap-4 mb-5">
                          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                               style={{ background: "var(--rbe-primary-fixed)" }}>
                            {p.foto_perfil_url ? (
                              <img src={p.foto_perfil_url} alt={p.display_name}
                                   className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <span className="text-xl font-black" style={{ color: "var(--rbe-primary)" }}>
                                {p.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg leading-tight" style={{ color: "var(--rbe-primary)" }}>
                              {p.display_name}
                            </h4>
                            <p className="text-sm font-medium" style={{ color: "var(--rbe-secondary)" }}>
                              {p.profissao || "Profissional"}
                            </p>
                            {p.crp_crm && (
                              <p className="text-xs mt-1" style={{ color: "var(--rbe-on-surface-variant)" }}>
                                {p.crp_crm}
                              </p>
                            )}
                          </div>
                        </div>
                        {specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-5">
                            {specialties.map(s => (
                              <span key={s} className="text-xs px-3 py-1 rounded-full font-medium"
                                    style={{ background: "var(--rbe-secondary-fixed)", color: "var(--rbe-on-secondary-fixed)" }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {showPrices && p.preco_consulta && (
                          <div className="mt-auto pt-2">
                            <span className="text-sm font-bold" style={{ color: "var(--rbe-primary)" }}>
                              R$ {p.preco_consulta}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>
        </section>
      )}

      {/* ═════════ BUDDY NO WHATSAPP ═════════ */}
      <section className="py-16 sm:py-20 lg:py-24 overflow-hidden"
               style={{ background: "var(--rbe-surface-container-low)" }}>
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5 sm:mb-6"
                  style={{ background: "#dcfce7", color: "#166534" }}>
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5 sm:mb-6 tracking-tighter"
                style={{ color: "var(--rbe-primary)" }}>
              Buddy no seu WhatsApp.
            </h2>
            <p className="text-base sm:text-lg font-light leading-relaxed mb-8 sm:mb-10 max-w-lg"
               style={{ color: "var(--rbe-on-surface-variant)" }}>
                O cuidado com a sua saúde mental no canal de comunicação que você já usa todos os dias.
                Buddy é o acompanhante que envia check-ins, lembranças e suporte em tempo real.
            </p>
            <div className="space-y-5 sm:space-y-6 mb-8 sm:mb-10">
              {[
                { Icon: Zap, title: "Check-ins rápidos", desc: "Pulsos diários para registrar humor, sono e energia em segundos." },
                { Icon: Bell, title: "Notificações inteligentes", desc: "Lembretes contextuais que respeitam seu ritmo e evitam ruído." },
                { Icon: ShieldCheck, title: "Privacidade total", desc: "Seus registros individuais permanecem privados. A instituição acessa apenas indicadores agregados e anonimizados, conforme consentimento e regras de privacidade." },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: "color-mix(in srgb, var(--rbe-brand-mint) 25%, transparent)", color: "var(--rbe-primary)" }}>
                    <f.Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-0.5 sm:mb-1" style={{ color: "var(--rbe-primary)" }}>{f.title}</h4>
                    <p className="text-sm" style={{ color: "var(--rbe-on-surface-variant)" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base text-white shadow-lg hover:scale-105 transition-transform"
               style={{ background: "linear-gradient(180deg, #075E54 0%, #128C7E 100%)" }}>
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Iniciar conversa no WhatsApp
            </a>
          </div>

          {/* WhatsApp phone mock */}
          <div className="relative flex justify-center">
            <div className="absolute -inset-8 rounded-full opacity-30 blur-3xl"
                 style={{ background: "var(--rbe-tertiary-fixed)" }} />
            <div className="relative w-64 sm:w-72 aspect-[9/19] rounded-[2.5rem] sm:rounded-[3rem] p-2 sm:p-2.5 shadow-2xl"
                 style={{ background: "#0f172a", border: "4px solid #1e293b" }}>
              <div className="w-full h-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col"
                   style={{ background: "#ECE5DD" }}>
                {/* WA header */}
                <div className="px-4 py-3 flex items-center gap-3"
                     style={{ background: "linear-gradient(180deg, #075E54 0%, #128C7E 100%)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                       style={{ background: "#fff" }}>
                    <img src={buddyChat} alt="Buddy chat" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">Buddy · Rede Bem-Estar</p>
                    <p className="text-white/70 text-[10px]">online agora</p>
                  </div>
                </div>
                {/* Messages */}
                <div className="flex-1 p-3 space-y-2 overflow-hidden text-[11px]">
                  <div className="max-w-[80%] rounded-lg rounded-tl-none px-3 py-2 shadow-sm"
                       style={{ background: "#fff", color: "#111" }}>
                    Bom dia! Como você está se sentindo hoje? 💜
                  </div>
                  <div className="max-w-[80%] rounded-lg rounded-tr-none px-3 py-2 ml-auto shadow-sm"
                       style={{ background: "#DCF8C6", color: "#111" }}>
                    Acordei meio cansado, dormi mal.
                  </div>
                  <div className="max-w-[80%] rounded-lg rounded-tl-none px-3 py-2 shadow-sm"
                       style={{ background: "#fff", color: "#111" }}>
                    Entendo. Quer registrar essa noite no seu Diário Emocional?
                  </div>
                  <div className="max-w-[80%] rounded-lg rounded-tr-none px-3 py-2 ml-auto shadow-sm"
                       style={{ background: "#DCF8C6", color: "#111" }}>
                    Sim, vamos
                  </div>
                  <div className="max-w-[80%] rounded-lg rounded-tl-none px-3 py-2 shadow-sm"
                       style={{ background: "#fff", color: "#111" }}>
                    Perfeito ✨ Vou te guiar em 3 perguntas rápidas.
                  </div>
                </div>
                {/* WA input */}
                <div className="px-3 py-2 flex items-center gap-2" style={{ background: "#F0F0F0" }}>
                  <div className="flex-1 h-8 rounded-full bg-white" />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                       style={{ background: "#128C7E" }}>
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ CTA FINAL ═════════ */}
      <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 rbe-organic-gradient" />
        <div className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full opacity-20 blur-3xl"
             style={{ background: "var(--rbe-brand-pink)" }} />
        <div className="absolute bottom-0 left-0 w-[24rem] h-[24rem] rounded-full opacity-20 blur-3xl"
             style={{ background: "var(--rbe-brand-mint)" }} />
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Quote className="w-10 h-10 mx-auto mb-5 sm:mb-6 text-white/70" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tighter">
            Vamos cultivar o futuro juntos?
          </h2>
          <p className="text-base sm:text-lg text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto">
            Conheça como a Rede Bem-Estar pode transformar o cuidado emocional na sua instituição.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button onClick={goToContact}
                    className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base bg-white hover:scale-105 transition-transform shadow-lg"
                    style={{ color: "var(--rbe-primary)" }}>
              Falar com a equipe
            </button>
            <button onClick={goToContact}
                    className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base text-white border-2 border-white/60 hover:bg-white/10 transition-colors">
              Agendar Demonstração
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomeRedeBemEstar;
