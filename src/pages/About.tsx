import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AboutImageSection } from "@/components/AboutImageSection"
import { useNavigate } from "react-router-dom"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"
import { 
  Target, Eye, Lightbulb, ClipboardList, UserCheck, Video, 
  Heart, BarChart3, ShieldCheck, GraduationCap, Users, Building2,
  Focus, Hospital, Zap, AlertTriangle, Link2, Lock, TrendingUp,
  Calendar, HelpCircle, ArrowRight
} from "lucide-react"

const About = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'medcos';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* SEÇÃO 1: Hero/Intro */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AboutImageSection />
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Cuidando de Quem <br />
                Cuida da Saúde
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                A MEDCOS é uma plataforma de bem-estar universitário focada em médicos e 
                estudantes de medicina. Unimos atendimento clínico qualificado, fluxos de 
                apoio e dados agregados para fortalecer aprendizagem, permanência e clima acadêmico.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}
                  className="group"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Agendar Atendimento
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  Sou de uma Faculdade
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: Missão, Visão e Por Quê */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Target,
                title: "Missão",
                description: "Tornar o cuidado emocional parte do cotidiano de quem forma e pratica a medicina.",
                color: "from-primary/20 to-primary/30"
              },
              {
                icon: Eye,
                title: "Visão",
                description: "Universidades com ambientes mais humanos, alunos presentes e professores sustentados.",
                color: "from-accent/20 to-accent/30"
              },
              {
                icon: Lightbulb,
                title: "Por Quê Existimos",
                description: "A graduação concentra pressão, longas jornadas e alto custo emocional. Cuidar disso muda trajetórias e melhora resultados acadêmicos.",
                color: "from-secondary/20 to-secondary/30"
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 group">
                  <CardHeader>
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br ${item.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: Como Funciona */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Como Funciona</h2>
          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                icon: ClipboardList,
                title: "Triagem Rápida",
                description: "Avaliação inicial para entender suas necessidades e direcionar para o melhor suporte."
              },
              {
                icon: UserCheck,
                title: "Escolha de Profissional",
                description: "Acesso a psicólogos e psiquiatras especializados no contexto universitário médico."
              },
              {
                icon: Video,
                title: "Atendimento Online ou Presencial",
                description: "Flexibilidade para escolher o formato que melhor se adapta à sua rotina."
              },
              {
                icon: Heart,
                title: "Planos de Autocuidado e Grupos Temáticos",
                description: "Trilhas personalizadas e grupos de apoio para diferentes necessidades."
              },
              {
                icon: BarChart3,
                title: "Relatórios Institucionais",
                description: "Para a instituição: dados agregados e anônimos que orientam ações de prevenção."
              }
            ].map((item, index) => {
              const Icon = item.icon;
              const isLast = index === 4;
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
                  {!isLast && (
                    <div className="absolute left-8 top-16 w-0.5 h-8 bg-primary/30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: Governança Clínica, Ética e LGPD */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-6">Governança Clínica, Ética e LGPD</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Atendimento por profissionais habilitados, protocolos clínicos, supervisões e 
                auditoria de qualidade. Dados assistenciais ficam sob sigilo, relatórios 
                institucionais são sempre agregados e anonimizados.
              </p>
              <Button 
                variant="outline"
                onClick={() => navigate(buildTenantPath(tenantSlug, '/termos-de-servico'))}
              >
                Ver Termos de Serviço
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, label: "Profissionais Habilitados" },
                { icon: ClipboardList, label: "Protocolos Clínicos" },
                { icon: Lock, label: "Sigilo Profissional" },
                { icon: ShieldCheck, label: "LGPD Compliant" }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="text-center p-6 hover:shadow-lg transition-all border-2 hover:border-primary/50">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{item.label}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: Para Quem É */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Para Quem É</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: GraduationCap,
                title: "Estudantes",
                description: "Acesso rápido a psicólogos e psiquiatras, trilhas e grupos de apoio.",
                color: "border-t-primary",
                bgColor: "from-primary/10 to-primary/20"
              },
              {
                icon: Users,
                title: "Docentes",
                description: "Suporte individual e orientação para manejo de turma e bem-estar.",
                color: "border-t-accent",
                bgColor: "from-accent/10 to-accent/20"
              },
              {
                icon: Building2,
                title: "Instituições",
                description: "Visão consolidada por painéis anônimos que apoiam decisões, acolhimento e permanência.",
                color: "border-t-secondary",
                bgColor: "from-secondary/10 to-secondary/20"
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className={`border-t-4 ${item.color} hover:shadow-xl transition-all group`}>
                  <CardHeader className="text-center">
                    <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br ${item.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-12 h-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: Diferenciais */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Nossos Diferenciais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Focus, title: "Foco exclusivo em medicina", description: "Especialização no contexto universitário médico" },
              { icon: Hospital, title: "Curadoria clínica", description: "Profissionais selecionados e supervisionados" },
              { icon: Zap, title: "Início rápido", description: "Tempo médio reduzido para primeira sessão" },
              { icon: AlertTriangle, title: "Fluxos de risco definidos", description: "Protocolos claros para situações críticas" },
              { icon: Link2, title: "Integração com campanhas", description: "Alinhamento com ações institucionais" },
              { icon: Lock, title: "LGPD e confidencialidade", description: "Proteção total de dados e privacidade" }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-6 bg-card rounded-lg hover:shadow-lg transition-all border border-border hover:border-primary/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 7: Indicadores e Impacto */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-6">Dados que Transformam Decisões</h2>
              <p className="text-primary-foreground/90 mb-6 leading-relaxed">
                Veja métricas agregadas e anônimas que ajudam sua instituição a tomar 
                decisões baseadas em dados reais:
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Adesão por turmas e períodos",
                  "Temas mais buscados",
                  "Correlações com calendário acadêmico",
                  "Engajamento em trilhas e grupos"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => navigate(buildTenantPath(tenantSlug, '/contato'))}
              >
                Quero Ver um Exemplo de Painel
              </Button>
            </div>
            <Card className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/20 hover:bg-primary-foreground/15 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-primary-foreground">Exemplo de Painel</h3>
                <div className="space-y-4">
                  <div className="flex items-end gap-2 h-40 bg-primary-foreground/5 rounded-lg p-4">
                    <div className="w-full bg-accent/60 rounded-t" style={{ height: '65%' }}></div>
                    <div className="w-full bg-accent/70 rounded-t" style={{ height: '85%' }}></div>
                    <div className="w-full bg-accent/50 rounded-t" style={{ height: '55%' }}></div>
                    <div className="w-full bg-accent/80 rounded-t" style={{ height: '75%' }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-primary-foreground/10 rounded-lg p-3">
                      <p className="text-2xl font-bold">87%</p>
                      <p className="text-xs opacity-90">Adesão</p>
                    </div>
                    <div className="bg-primary-foreground/10 rounded-lg p-3">
                      <p className="text-2xl font-bold">4.8</p>
                      <p className="text-xs opacity-90">Avaliação</p>
                    </div>
                    <div className="bg-primary-foreground/10 rounded-lg p-3">
                      <p className="text-2xl font-bold">320</p>
                      <p className="text-xs opacity-90">Atendimentos</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SEÇÃO 8: Time */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Nosso Time</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Equipe clínica especializada e time de operações dedicados ao público médico
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {[
              {
                name: "Dra. Maria Silva",
                role: "Psicóloga Clínica",
                bio: "15 anos de experiência em saúde mental universitária e supervisão clínica",
                specialties: ["Ansiedade", "Burnout", "Terapia Breve"],
                avatar: "MS"
              },
              {
                name: "Dr. João Santos",
                role: "Psiquiatra",
                bio: "Especialista em transtornos de ansiedade e depressão em estudantes",
                specialties: ["Depressão", "Ansiedade", "Psicofarmacologia"],
                avatar: "JS"
              },
              {
                name: "Dra. Ana Costa",
                role: "Psicóloga Organizacional",
                bio: "Foco em clima acadêmico e desenvolvimento docente",
                specialties: ["Grupos", "Clima Acadêmico", "Liderança"],
                avatar: "AC"
              },
              {
                name: "Dr. Pedro Lima",
                role: "Psicólogo Clínico",
                bio: "Especializado em terapia cognitivo-comportamental para universitários",
                specialties: ["TCC", "Procrastinação", "Autoestima"],
                avatar: "PL"
              },
              {
                name: "Dra. Carla Mendes",
                role: "Coordenadora Clínica",
                bio: "Gestão de protocolos e qualidade assistencial",
                specialties: ["Supervisão", "Protocolos", "Qualidade"],
                avatar: "CM"
              },
              {
                name: "Dr. Lucas Rocha",
                role: "Psicólogo Clínico",
                bio: "Experiência com grupos temáticos e intervenções preventivas",
                specialties: ["Grupos", "Prevenção", "Mindfulness"],
                avatar: "LR"
              }
            ].map((member, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all group">
                <CardContent className="pt-8">
                  <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-accent/20">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {member.bio}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate(buildTenantPath(tenantSlug, '/profissionais'))}
            >
              Ver Todos os Profissionais
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 9: FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Perguntas Frequentes</h2>
          <p className="text-center text-muted-foreground mb-16">
            Tire suas dúvidas sobre a MEDCOS
          </p>
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            {[
              {
                question: "Como funciona a confidencialidade?",
                answer: "Todos os atendimentos seguem o sigilo profissional previsto nos códigos de ética da Psicologia e Medicina. Dados assistenciais individuais não são compartilhados com a instituição. Apenas relatórios agregados e anônimos são gerados para orientar ações institucionais."
              },
              {
                question: "Como são os relatórios institucionais?",
                answer: "Os relatórios são sempre agregados e anonimizados, mostrando tendências gerais como temas mais buscados, períodos de maior demanda e correlações com o calendário acadêmico. Nenhum dado individual é identificável nesses relatórios."
              },
              {
                question: "Há cobertura de planos ou bolsas?",
                answer: "Sim, trabalhamos com diferentes modelos: convênio institucional (custeado pela faculdade), planos de saúde parceiros e programa de bolsas para estudantes em situação de vulnerabilidade. Consulte sua instituição sobre as opções disponíveis."
              },
              {
                question: "Qual o tempo médio para iniciar?",
                answer: "Após a triagem inicial, o tempo médio para o primeiro atendimento é de 3 a 5 dias úteis. Em casos de urgência identificados na triagem, priorizamos o atendimento em até 24 horas."
              },
              {
                question: "Como faço para agendar?",
                answer: "Basta clicar em 'Agendar Atendimento' no topo da página, preencher o formulário de triagem inicial e escolher o profissional e horário que melhor se adequam à sua rotina. Você receberá confirmação por e-mail e SMS."
              },
              {
                question: "Como minha instituição pode entrar?",
                answer: "Entre em contato através do botão 'Sou de uma Faculdade' para agendar uma reunião com nosso time. Faremos uma apresentação personalizada, demonstração da plataforma e discussão sobre modelos de implementação adequados à sua instituição."
              }
            ].map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:text-primary">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pl-8">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default About
