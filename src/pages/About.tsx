import { useState } from "react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AboutImageSection } from "@/components/AboutImageSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { buildTenantPath, DEFAULT_TENANT_SLUG } from "@/utils/tenantHelpers";
import { useProfessionals } from "@/hooks/useProfessionals";
import { getIllustrativeAvatar } from "@/utils/avatarHelpers";
import {
  Target, Eye, Lightbulb, ClipboardList, UserCheck, Video, Heart, BarChart3,
  ShieldCheck, GraduationCap, Users, Building2, Focus, Hospital, Zap,
  AlertTriangle, Link2, Lock, TrendingUp, Calendar, HelpCircle, ArrowRight,
  BookOpen, Headphones, Sparkles,
} from "lucide-react";
import { InstitutionalDashboardModal } from "@/components/InstitutionalDashboardModal";

const About = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || DEFAULT_TENANT_SLUG;
  const isRedeBemEstar = tenantSlug !== 'medcos';
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);

  const getTenantName = () => {
    return tenant?.slug === 'medcos' ? 'A MEDCOS' : 'A Rede Bem-Estar';
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {isRedeBemEstar ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(271,64%,34%)] via-[hsl(271,64%,34%)]/85 to-[hsl(186,40%,72%)]/30" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-6 bg-white/15 text-white border-white/20 hover:bg-white/20 text-xs tracking-wide uppercase">
                    Plataforma de Bem-Estar Universitário
                  </Badge>
                  <h1 className="text-4xl lg:text-5xl xl:text-[3.5rem] font-bold mb-6 text-white leading-[1.1] tracking-tight">
                    Bem-estar universitário com continuidade, contexto e inteligência
                  </h1>
                  <p className="text-lg text-white/75 mb-10 leading-relaxed max-w-xl">
                    Integramos suporte individual, leitura coletiva e dados institucionais para acompanhar a saúde emocional ao longo do tempo.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      onClick={() => document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-white text-[hsl(271,64%,34%)] hover:bg-white/90 font-bold shadow-lg"
                    >
                      Conhecer a solução
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                      className="border-2 border-white text-white hover:bg-white/15 font-semibold bg-transparent"
                    >
                      <Building2 className="mr-2 h-5 w-5" />
                      Falar com a equipe
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:flex justify-center">
                  <div className="relative w-full max-w-md">
                    {/* Clean mockup card */}
                    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 shadow-2xl">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[hsl(330,60%,70%)]/30 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="h-3 w-28 bg-white/30 rounded-full" />
                            <div className="h-2 w-20 bg-white/15 rounded-full mt-2" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {['87%', '4.8', '320'].map((v, i) => (
                            <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                              <p className="text-xl font-bold text-white">{v}</p>
                              <p className="text-[10px] text-white/50 mt-1">
                                {['Adesão', 'Avaliação', '/mês'][i]}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {[75, 55, 40].map((w, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-2 rounded-full bg-white/20 flex-1">
                                <div className="h-full rounded-full bg-gradient-to-r from-white/60 to-[hsl(186,40%,72%)]/60" style={{ width: `${w}%` }} />
                              </div>
                              <span className="text-[10px] text-white/40 w-8">{w}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <AboutImageSection />
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-primary">
                    Cuidando de<br />Quem Cuida
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    {getTenantName()} é uma plataforma de bem-estar universitário focada em médicos e
                    estudantes de medicina. Unimos atendimento clínico qualificado, fluxos de
                    apoio e dados agregados para fortalecer aprendizagem, permanência e clima acadêmico.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="default" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))} className="group">
                      <Calendar className="mr-2 h-5 w-5" />
                      Agendar Atendimento
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}>
                      <Building2 className="mr-2 h-5 w-5" />
                      Sou de uma Faculdade
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ═══════ POR QUE EXISTIMOS (apenas RBE) ═══════ */}
      {isRedeBemEstar && (
        <section className="py-24 lg:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm font-semibold text-[hsl(271,64%,34%)] uppercase tracking-widest mb-4">Por que existimos</p>
              <h2 className="text-3xl lg:text-4xl font-semibold text-foreground leading-snug tracking-tight mb-6">
                Cuidar não é intervir pontualmente.{' '}
                <span className="text-[hsl(271,64%,34%)]">
                  É acompanhar ao longo do tempo.
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                O bem-estar universitário não se resolve em ações isoladas. Ele exige leitura contínua,
                contexto e responsabilidade institucional. A Rede Bem-Estar nasceu para preencher essa lacuna.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ MÓDULOS DA PLATAFORMA (apenas RBE) ═══════ */}
      {isRedeBemEstar && (
        <section id="modulos" className="py-24 bg-[hsl(0,0%,96%)]">
          <div className="container mx-auto px-4">
            <p className="text-sm font-semibold text-[hsl(271,64%,34%)] uppercase tracking-widest text-center mb-4">Plataforma</p>
            <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Módulos que estruturam o cuidado</h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Cada módulo funciona de forma integrada, criando um ecossistema de suporte contínuo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: BookOpen,
                  title: "Diário Emocional",
                  description: "Registro contínuo do bem-estar com insights de IA que ajudam a compreender padrões emocionais ao longo do tempo.",
                  cta: "Explorar",
                  href: "/diario-emocional",
                  color: "hsl(271,64%,34%)",
                  bg: "hsl(271,64%,34%)",
                },
                {
                  icon: Headphones,
                  title: "Escuta Profissional",
                  description: "Suporte individual com psicólogos e psiquiatras selecionados, supervisionados e alinhados ao contexto acadêmico.",
                  cta: "Ver profissionais",
                  href: "/profissionais",
                  color: "hsl(330,60%,70%)",
                  bg: "hsl(330,60%,70%)",
                },
                {
                  icon: Sparkles,
                  title: "Encontros & Trilhas",
                  description: "Grupos temáticos, rodas de conversa e trilhas de autocuidado que fortalecem a rede de apoio coletivo.",
                  cta: "Ver encontros",
                  href: "/encontros",
                  color: "hsl(186,40%,72%)",
                  bg: "hsl(186,40%,72%)",
                },
              ].map((mod) => {
                const Icon = mod.icon;
                return (
                  <Card key={mod.title} className="border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-card">
                    <CardHeader className="pb-2">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${mod.bg} / 0.1`.replace(' / ', '/').replace('hsl', 'hsla').replace(')', ',0.1)') }}
                      >
                        <Icon className="w-6 h-6" style={{ color: mod.color }} />
                      </div>
                      <CardTitle className="text-xl">{mod.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">{mod.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-0 font-semibold hover:bg-transparent"
                        style={{ color: mod.color }}
                        onClick={() => navigate(buildTenantPath(tenantSlug, mod.href))}
                      >
                        {mod.cta}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ NOSSA FILOSOFIA / COMO FUNCIONA ═══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">
            {isRedeBemEstar ? "Nossa Filosofia de Cuidado" : "Como Funciona"}
          </h2>
          {isRedeBemEstar && (
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Quatro pilares que orientam tudo o que construímos.
            </p>
          )}
          {isRedeBemEstar ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {[
                { icon: Heart, title: "Continuidade", description: "Registro e suporte ao longo do tempo, não apenas em momentos críticos.", color: "hsl(271,64%,34%)" },
                { icon: Eye, title: "Contexto", description: "Compreensão das dinâmicas acadêmicas, períodos e pressões que afetam o bem-estar.", color: "hsl(330,60%,70%)" },
                { icon: Users, title: "Estrutura", description: "Suporte clínico individual, trilhas de autocuidado e grupos temáticos integrados.", color: "hsl(186,40%,72%)" },
                { icon: BarChart3, title: "Inteligência", description: "Dados agregados e anônimos que orientam decisões estratégicas das instituições.", color: "hsl(271,64%,34%)" },
              ].map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="flex items-start gap-4 p-5 rounded-2xl border border-border/60 bg-card">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${pillar.color.replace('hsl', 'hsla').replace(')', ',0.1)')}` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: pillar.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 text-foreground">{pillar.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8 mt-16">
              {[
                { icon: ClipboardList, title: "Triagem Rápida", description: "Avaliação inicial para entender suas necessidades e direcionar para o melhor suporte.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                { icon: UserCheck, title: "Escolha de Profissional", description: "Acesso a psicólogos e psiquiatras especializados no contexto universitário médico.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                { icon: Video, title: "Atendimento Online", description: "Flexibilidade para escolher o formato que melhor se adapta à sua rotina.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                { icon: Heart, title: "Planos de Autocuidado e Grupos Temáticos", description: "Trilhas personalizadas e grupos de apoio para diferentes necessidades.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
                { icon: BarChart3, title: "Relatórios Institucionais", description: "Para a instituição: dados agregados e anônimos que orientam ações de prevenção.", iconColor: "text-primary", iconBg: "bg-primary/10", borderColor: "border-primary" },
              ].map((item, index, arr) => {
                const Icon = item.icon;
                const isLast = index === arr.length - 1;
                return (
                  <div key={index} className="relative">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 rounded-full ${item.iconBg} flex items-center justify-center border-2 ${item.borderColor}`}>
                          <Icon className={`w-8 h-8 ${item.iconColor}`} />
                        </div>
                      </div>
                      <Card className="flex-1 hover:shadow-lg transition-all">
                        <CardHeader>
                          <CardTitle className="text-xl">{item.title}</CardTitle>
                          <CardDescription className="text-base">{item.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                    {!isLast && <div className="absolute left-8 top-16 w-0.5 h-8 bg-primary/20" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ PARA QUEM É ═══════ */}
      <section className={isRedeBemEstar ? "py-24 bg-[hsl(0,0%,96%)]" : "py-24 bg-background"}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Para Quem É</h2>
          {isRedeBemEstar && (
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Soluções adaptadas para cada público do ecossistema acadêmico.
            </p>
          )}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto ${!isRedeBemEstar ? 'mt-16' : ''}`}>
            {[
              {
                icon: GraduationCap,
                title: "Estudantes",
                description: isRedeBemEstar
                  ? "Acompanhamento acessível com suporte contínuo ao longo da jornada acadêmica."
                  : "Acesso rápido a psicólogos e psiquiatras, trilhas e grupos de apoio.",
                color: "hsl(271,64%,34%)",
              },
              {
                icon: Users,
                title: "Docentes",
                description: isRedeBemEstar
                  ? "Ferramentas e suporte para lidar com carga emocional, dinâmica de turma e permanência."
                  : "Suporte individual e orientação para manejo de turma e bem-estar.",
                color: "hsl(330,60%,70%)",
              },
              {
                icon: Building2,
                title: "Instituições",
                description: isRedeBemEstar
                  ? "Visão estruturada e dados agregados para orientar decisões e fortalecer o ambiente acadêmico."
                  : "Visão consolidada por painéis anônimos que apoiam decisões, acolhimento e permanência.",
                color: "hsl(186,40%,72%)",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border border-border/60 rounded-2xl shadow-sm bg-card text-center">
                  <CardHeader className="pb-2">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: `${item.color.replace('hsl', 'hsla').replace(')', ',0.1)')}` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ DADOS E INTELIGÊNCIA ═══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-widest mb-4 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`}>Inteligência de dados</p>
              <h2 className="text-3xl font-semibold mb-6 tracking-tight">
                {isRedeBemEstar
                  ? "Dados que ampliam a capacidade de cuidar"
                  : "Dados que Transformam Decisões"}
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {isRedeBemEstar
                  ? "Leituras agregadas que ajudam instituições a identificar padrões, antecipar riscos e agir com mais precisão."
                  : "Veja métricas agregadas e anônimas que ajudam sua instituição a tomar decisões baseadas em dados reais:"}
              </p>
              <ul className="space-y-3 mb-8">
                {(isRedeBemEstar
                  ? [
                      "Adesão e engajamento por turmas e períodos",
                      "Temas e demandas mais recorrentes",
                      "Correlações com o calendário acadêmico",
                      "Indicadores de permanência e bem-estar coletivo",
                    ]
                  : [
                      "Adesão por turmas e períodos",
                      "Temas mais buscados",
                      "Correlações com calendário acadêmico",
                      "Engajamento em trilhas e grupos",
                    ]
                ).map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isRedeBemEstar ? 'bg-[hsl(271,64%,34%)]/10' : 'bg-primary/10'}`}>
                      <TrendingUp className={`w-4 h-4 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`} />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={() => setDashboardModalOpen(true)}
                className={isRedeBemEstar ? "bg-[hsl(271,64%,34%)] text-white hover:bg-[hsl(271,64%,34%)]/90 font-semibold" : "bg-primary text-white hover:bg-primary/90 font-semibold"}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver exemplo de painel
              </Button>
            </div>
            <div>
              {isRedeBemEstar ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Adesão', valueMain: '87', valueSuffix: '%', desc: 'dos estudantes continuam o acompanhamento', color: 'hsl(271,64%,34%)' },
                      { label: 'Avaliação', valueMain: '4.8', valueSuffix: '/5', desc: 'satisfação média dos estudantes', color: 'hsl(330,60%,70%)' },
                      { label: 'Acompanhamentos', valueMain: '320', valueSuffix: '/mês', desc: 'suportes estruturados realizados', color: 'hsl(186,40%,72%)' },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-border/60 bg-card p-5 text-center shadow-sm">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{metric.label}</span>
                        <div className="flex items-baseline justify-center gap-0.5 mt-2">
                          <span className="text-4xl font-bold" style={{ color: metric.color }}>{metric.valueMain}</span>
                          <span className="text-lg font-semibold" style={{ color: metric.color }}>{metric.valueSuffix}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-2 block leading-relaxed">{metric.desc}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center italic">* Dados ilustrativos para demonstração</p>
                </div>
              ) : (
                <Card className="bg-card border-2 hover:shadow-2xl transition-all border-primary/20 hover:border-primary/40">
                  <CardContent className="p-10">
                    <h3 className="text-xl font-semibold mb-8 text-foreground flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Exemplo de Painel
                    </h3>
                    <div className="grid grid-cols-3 gap-8">
                      {[
                        { label: 'Adesão', value: '87%' },
                        { label: 'Avaliação', value: '4.8/5' },
                        { label: 'Acompanhamentos', value: '320/mês' },
                      ].map((metric) => (
                        <div key={metric.label} className="flex flex-col items-center gap-2 py-6">
                          <span className="text-4xl font-bold">{metric.value}</span>
                          <span className="text-sm text-muted-foreground">{metric.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ DIFERENCIAIS ═══════ */}
      <section className={isRedeBemEstar ? "py-24 bg-[hsl(0,0%,96%)]" : "py-24 bg-background"}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Nossos Diferenciais</h2>
          {isRedeBemEstar && (
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              O que nos diferencia de soluções tradicionais de saúde mental.
            </p>
          )}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto ${!isRedeBemEstar ? 'mt-16' : ''}`}>
            {[
              {
                icon: Focus,
                title: isRedeBemEstar ? "Especialização acadêmica" : "Foco exclusivo em medicina",
                description: isRedeBemEstar
                  ? "Plataforma desenhada para as demandas específicas do ambiente universitário"
                  : "Especialização no contexto universitário médico",
              },
              {
                icon: Hospital,
                title: "Curadoria clínica",
                description: isRedeBemEstar
                  ? "Profissionais selecionados, supervisionados e alinhados ao contexto acadêmico"
                  : "Profissionais selecionados e supervisionados",
              },
              {
                icon: Zap,
                title: isRedeBemEstar ? "Continuidade no acesso" : "Início rápido",
                description: isRedeBemEstar
                  ? "Suporte contínuo ao longo do tempo, com redução de barreiras de acesso"
                  : "Tempo médio reduzido para primeira sessão",
              },
              {
                icon: AlertTriangle,
                title: isRedeBemEstar ? "Protocolos de risco" : "Fluxos de risco definidos",
                description: isRedeBemEstar
                  ? "Fluxos estruturados para identificação e manejo de situações críticas"
                  : "Protocolos claros para situações críticas",
              },
              {
                icon: Link2,
                title: isRedeBemEstar ? "Integração institucional" : "Integração com campanhas",
                description: isRedeBemEstar
                  ? "Articulação com ações institucionais de prevenção e promoção de saúde"
                  : "Alinhamento com ações institucionais",
              },
              {
                icon: Lock,
                title: "LGPD e confidencialidade",
                description: isRedeBemEstar
                  ? "Dados protegidos por design, com relatórios sempre agregados e anônimos"
                  : "Proteção total de dados e privacidade",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border/60 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRedeBemEstar ? 'bg-[hsl(271,64%,34%)]/10' : 'bg-primary/10'}`}>
                    <Icon className={`w-5 h-5 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-sm text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ GOVERNANÇA ═══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-widest mb-4 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`}>Governança</p>
              <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">
                {isRedeBemEstar ? "Base clínica, ética e privacidade" : "Governança Clínica, Ética e LGPD"}
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Acompanhamento por profissionais habilitados, protocolos clínicos, supervisões e
                auditoria de qualidade. Dados assistenciais ficam sob sigilo, relatórios
                institucionais são sempre agregados e anonimizados.
              </p>
              <Button variant="outline" onClick={() => navigate(buildTenantPath(tenantSlug, '/termos-servico'))}>
                Ver Termos de Serviço
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, label: "Profissionais Habilitados", color: "hsl(271,64%,34%)" },
                { icon: ClipboardList, label: "Protocolos Clínicos", color: "hsl(330,60%,70%)" },
                { icon: Lock, label: "Sigilo Profissional", color: "hsl(186,40%,72%)" },
                { icon: ShieldCheck, label: "LGPD Compliant", color: "hsl(271,64%,34%)" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-center p-5 rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${item.color.replace('hsl', 'hsla').replace(')', ',0.1)')}` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ EQUIPE ═══════ */}
      <section className={isRedeBemEstar ? "py-24 bg-[hsl(0,0%,96%)]" : "py-20 bg-background"}>
        <div className="container mx-auto px-4">
          <p className={`text-sm font-semibold uppercase tracking-widest text-center mb-4 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`}>Equipe</p>
          <h2 className="text-2xl lg:text-3xl font-semibold text-center mb-4 tracking-tight">
            {isRedeBemEstar ? "Equipe dedicada ao contexto acadêmico" : "Nosso Time"}
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            {isRedeBemEstar
              ? "Profissionais selecionados, supervisionados e alinhados às demandas do ambiente universitário"
              : "Equipe clínica especializada e time de operações dedicados ao público médico"}
          </p>
          <TeamSection navigate={navigate} tenantSlug={tenantSlug} limit={isRedeBemEstar ? 4 : 6} isRedeBemEstar={isRedeBemEstar} />
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
              Ver Todos os Profissionais
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 justify-center mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isRedeBemEstar ? 'bg-[hsl(271,64%,34%)]/10' : 'bg-primary/10'}`}>
                <HelpCircle className={`w-6 h-6 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`} />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Perguntas Frequentes</h2>
            </div>
            <p className="text-center text-muted-foreground mb-12">
              Tire suas dúvidas sobre {getTenantName()}
            </p>
            <Accordion type="single" collapsible>
              {(isRedeBemEstar
                ? [
                    { question: "Como funciona a confidencialidade?", answer: "Todo o acompanhamento segue o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais." },
                    { question: "Como são os relatórios institucionais?", answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios." },
                    { question: "Há cobertura de planos ou bolsas?", answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela instituição), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis." },
                    { question: "Qual o tempo médio para iniciar o acompanhamento?", answer: "Após a triagem inicial, o tempo médio para o primeiro acompanhamento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o suporte em até 24 horas." },
                    { question: "Como inicio meu acompanhamento?", answer: "Basta acessar a plataforma, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS." },
                    { question: "Como minha instituição pode participar?", answer: "Entre em contato através do botão 'Falar com a equipe' para uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição." },
                  ]
                : [
                    { question: "Como funciona a confidencialidade?", answer: "Todos os atendimentos seguem o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais." },
                    { question: "Como são os relatórios institucionais?", answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios." },
                    { question: "Há cobertura de planos ou bolsas?", answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela faculdade), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis." },
                    { question: "Qual o tempo médio para iniciar?", answer: "Após a triagem inicial, o tempo médio para o primeiro atendimento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o atendimento em até 24 horas." },
                    { question: "Como faço para agendar?", answer: "Basta clicar em 'Agendar Atendimento' no topo da página, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS." },
                    { question: "Como minha instituição pode entrar?", answer: "Entre em contato através do botão 'Sou uma instituição' para agendar uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição." },
                  ]
              ).map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className={`text-left ${isRedeBemEstar ? 'hover:text-[hsl(271,64%,34%)]' : 'hover:text-primary'}`}>
                    <span className="font-medium">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL (apenas RBE) ═══════ */}
      {isRedeBemEstar && (
        <section className="py-24 bg-gradient-to-br from-[hsl(271,64%,34%)] via-[hsl(271,64%,34%)]/90 to-[hsl(186,40%,72%)]/40">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight">
              Vamos cuidar juntos?
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
              Conheça como a Rede Bem-Estar pode fortalecer o suporte emocional na sua instituição.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}
                className="bg-white text-[hsl(271,64%,34%)] hover:bg-white/90 font-bold shadow-lg"
              >
                Iniciar acompanhamento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                className="border-2 border-white text-white hover:bg-white/15 font-semibold bg-transparent"
              >
                <Building2 className="mr-2 h-5 w-5" />
                Falar com a equipe
              </Button>
            </div>
          </div>
        </section>
      )}

      <Footer />
      <InstitutionalDashboardModal open={dashboardModalOpen} onOpenChange={setDashboardModalOpen} />
    </div>
  );
};

// Component: Team Section with Real Data
const TeamSection = ({
  navigate,
  tenantSlug,
  limit = 6,
  isRedeBemEstar = false,
}: {
  navigate: any;
  tenantSlug: string;
  limit?: number;
  isRedeBemEstar?: boolean;
}) => {
  const { data: professionals, isLoading } = useProfessionals(limit);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 max-w-6xl mx-auto`}>
        {Array.from({ length: limit }).map((_, index) => (
          <Card key={index} className="text-center rounded-2xl">
            <CardContent className="pt-8">
              <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto mb-3" />
              <Skeleton className="h-16 w-full mb-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!professionals || professionals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Nenhum profissional disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 max-w-6xl mx-auto`}>
      {professionals.map(professional => {
        const photoUrl = professional.foto_perfil_url || getIllustrativeAvatar(null, null, professional.display_name);
        const bio = professional.resumo_profissional || `Profissional qualificado com registro ${professional.crp_crm || 'ativo'}.`;
        const specialties = professional.servicos_normalizados || [];
        return (
          <Card key={professional.id} className="text-center hover:shadow-md transition-shadow rounded-2xl border border-border/60">
            <CardContent className="pt-8">
              <Avatar className={`w-24 h-24 mx-auto mb-4 ring-4 transition-all ${isRedeBemEstar ? 'ring-[hsl(271,64%,34%)]/10' : 'ring-primary/10'}`}>
                <AvatarImage src={photoUrl} alt={professional.display_name} />
                <AvatarFallback className={`text-xl ${isRedeBemEstar ? 'bg-gradient-to-br from-[hsl(271,64%,34%)]/20 to-[hsl(330,60%,70%)]/20' : 'bg-gradient-to-br from-primary/20 to-accent/20'}`}>
                  {getInitials(professional.display_name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg mb-1">{professional.display_name}</h3>
              <p className={`text-sm font-medium mb-3 ${isRedeBemEstar ? 'text-[hsl(271,64%,34%)]' : 'text-primary'}`}>
                {professional.profissao || 'Profissional de Saúde'}
              </p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                {bio}
              </p>
              {!isRedeBemEstar && specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {specialties.slice(0, 3).map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default About;
