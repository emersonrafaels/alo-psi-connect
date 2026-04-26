import { useState, useEffect } from "react";
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
  ClipboardList, UserCheck, Video, Heart, BarChart3,
  GraduationCap, Users, Building2, Focus, Hospital, Zap,
  AlertTriangle, Link2, Lock, TrendingUp, Calendar, HelpCircle, ArrowRight,
} from "lucide-react";
import { InstitutionalDashboardModal } from "@/components/InstitutionalDashboardModal";
import AboutRedeBemEstar from "@/components/about/AboutRedeBemEstar";

const About = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || DEFAULT_TENANT_SLUG;
  const isRedeBemEstar = tenantSlug !== 'medcos';
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getTenantName = () => {
    return tenant?.slug === 'medcos' ? 'A MEDCOS' : 'A Rede Bem-Estar';
  };

  return (
    <div className="min-h-screen bg-[hsl(0,0%,97.6%)] font-sans">
      <Header />

      {isRedeBemEstar ? (
        <AboutRedeBemEstar />
      ) : (
        <>
          {/* ═══════ MEDCOS HERO ═══════ */}
          <section className="relative overflow-hidden py-24 lg:py-32">
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
          </section>

          {/* ═══════ MEDCOS: Como Funciona ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Como Funciona</h2>
              <div className="max-w-4xl mx-auto space-y-8 mt-16">
                {[
                  { icon: ClipboardList, title: "Triagem Rápida", description: "Avaliação inicial para entender suas necessidades e direcionar para o melhor suporte." },
                  { icon: UserCheck, title: "Escolha de Profissional", description: "Acesso a psicólogos e psiquiatras especializados no contexto universitário médico." },
                  { icon: Video, title: "Atendimento Online", description: "Flexibilidade para escolher o formato que melhor se adapta à sua rotina." },
                  { icon: Heart, title: "Planos de Autocuidado e Grupos Temáticos", description: "Trilhas personalizadas e grupos de apoio para diferentes necessidades." },
                  { icon: BarChart3, title: "Relatórios Institucionais", description: "Para a instituição: dados agregados e anônimos que orientam ações de prevenção." },
                ].map((item, index, arr) => {
                  const Icon = item.icon;
                  const isLast = index === arr.length - 1;
                  return (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                            <Icon className="w-8 h-8 text-primary" />
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
            </div>
          </section>

          {/* ═══════ MEDCOS: Para Quem É ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Para Quem É</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
                {[
                  { icon: GraduationCap, title: "Estudantes", description: "Acesso rápido a psicólogos e psiquiatras, trilhas e grupos de apoio.", color: "hsl(271,64%,34%)" },
                  { icon: Users, title: "Docentes", description: "Suporte individual e orientação para manejo de turma e bem-estar.", color: "hsl(330,60%,70%)" },
                  { icon: Building2, title: "Instituições", description: "Visão consolidada por painéis anônimos que apoiam decisões, acolhimento e permanência.", color: "hsl(186,40%,72%)" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title} className="border border-border/60 rounded-2xl shadow-sm bg-card text-center">
                      <CardHeader className="pb-2">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-primary/10">
                          <Icon className="w-7 h-7 text-primary" />
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

          {/* ═══════ MEDCOS: Dados ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-primary">Inteligência de dados</p>
                  <h2 className="text-3xl font-semibold mb-6 tracking-tight">Dados que Transformam Decisões</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Veja métricas agregadas e anônimas que ajudam sua instituição a tomar decisões baseadas em dados reais:
                  </p>
                  <ul className="space-y-3 mb-8">
                    {["Adesão por turmas e períodos", "Temas mais buscados", "Correlações com calendário acadêmico", "Engajamento em trilhas e grupos"].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" onClick={() => setDashboardModalOpen(true)} className="bg-primary text-white hover:bg-primary/90 font-semibold">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver exemplo de painel
                  </Button>
                </div>
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
              </div>
            </div>
          </section>

          {/* ═══════ MEDCOS: Diferenciais ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-semibold text-center mb-4 tracking-tight">Nossos Diferenciais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mt-16">
                {[
                  { icon: Focus, title: "Foco exclusivo em medicina", description: "Especialização no contexto universitário médico" },
                  { icon: Hospital, title: "Curadoria clínica", description: "Profissionais selecionados e supervisionados" },
                  { icon: Zap, title: "Início rápido", description: "Tempo médio reduzido para primeira sessão" },
                  { icon: AlertTriangle, title: "Fluxos de risco definidos", description: "Protocolos claros para situações críticas" },
                  { icon: Link2, title: "Integração com campanhas", description: "Alinhamento com ações institucionais" },
                  { icon: Lock, title: "LGPD e confidencialidade", description: "Proteção total de dados e privacidade" },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border/60 shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
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

          {/* ═══════ MEDCOS: Equipe ═══════ */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-center mb-4 text-primary">Equipe</p>
              <h2 className="text-2xl lg:text-3xl font-semibold text-center mb-4 tracking-tight">Nosso Time</h2>
              <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
                Equipe clínica especializada e time de operações dedicados ao público médico
              </p>
              <TeamSection navigate={navigate} tenantSlug={tenantSlug} limit={6} isRedeBemEstar={false} />
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}>
                  Ver Todos os Profissionais
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* ═══════ MEDCOS: FAQ ═══════ */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight">Perguntas Frequentes</h2>
                </div>
                <p className="text-center text-muted-foreground mb-12">
                  Tire suas dúvidas sobre {getTenantName()}
                </p>
                <Accordion type="single" collapsible>
                  {[
                    { question: "Como funciona a confidencialidade?", answer: "Todos os atendimentos seguem o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais." },
                    { question: "Como são os relatórios institucionais?", answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios." },
                    { question: "Há cobertura de planos ou bolsas?", answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela faculdade), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis." },
                    { question: "Qual o tempo médio para iniciar?", answer: "Após a triagem inicial, o tempo médio para o primeiro atendimento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o atendimento em até 24 horas." },
                    { question: "Como faço para agendar?", answer: "Basta clicar em 'Agendar Atendimento' no topo da página, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS." },
                    { question: "Como minha instituição pode entrar?", answer: "Entre em contato através do botão 'Sou uma instituição' para agendar uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição." },
                  ].map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:text-primary">
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
        </>
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
