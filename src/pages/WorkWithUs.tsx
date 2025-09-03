import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Heart, Shield, Sparkles, Users, Star, Award, BookOpen } from "lucide-react"
import { Link } from "react-router-dom"

const WorkWithUs = () => {
  const benefits = [
    "Flexibilidade total de horários - você define quando atender",
    "Plataforma completa para gestão de consultas",
    "Suporte contínuo da equipe AloPsi",
    "Comunidade de profissionais engajados",
    "Oportunidades de educação continuada",
    "Remuneração justa e transparente",
    "Ferramentas de IA para apoiar seu trabalho",
    "Ambiente seguro e acolhedor para profissionais e pacientes"
  ]

  const requirements = [
    "Registro ativo no conselho profissional (CRP, CRM, etc.)",
    "Formação em Psicologia, Psiquiatria ou áreas relacionadas",
    "Experiência em atendimento clínico",
    "Disponibilidade para atendimento online",
    "Compromisso com uma abordagem humanizada e inclusiva",
    "Visão que vai além de rótulos e diagnósticos"
  ]

  const values = [
    {
      icon: Heart,
      title: "Humanização Acima de Tudo",
      description: "Acreditamos que cada pessoa é única, com uma história própria que merece ser ouvida e respeitada, muito além de qualquer rótulo."
    },
    {
      icon: Shield,
      title: "Cuidado Integral",
      description: "Oferecemos um ambiente seguro onde profissionais podem exercer sua prática com autonomia, ética e suporte completo."
    },
    {
      icon: Sparkles,
      title: "Inovação com Propósito",
      description: "Combinamos tecnologia de ponta com o calor humano, criando uma experiência única de cuidado em saúde mental."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-teal/5 to-accent/10 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-5"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-teal to-accent bg-clip-text text-transparent">
              Se Torne um Profissional AloPsi
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-4 leading-relaxed">
              <strong className="text-foreground">Ajude além do rótulo.</strong> Transforme vidas oferecendo cuidado em saúde mental que enxerga a pessoa por completo.
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
              Junte-se a uma comunidade de profissionais que acredita no poder da conexão humana, da escuta ativa e do acolhimento sem julgamentos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-gradient text-lg px-8 py-4 h-auto">
                <Heart className="mr-2 h-5 w-5" />
                Quero Atender na AloPsi
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2">
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-foreground">
              Nossa Missão: Cuidar da Pessoa, Não do Diagnóstico
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Na AloPsi, acreditamos que cada pessoa que busca ajuda é muito mais do que qualquer rótulo ou diagnóstico. 
              Somos profissionais que escolheram ver além - que enxergam potencial onde outros veem limitações, 
              que escutam histórias onde outros veem sintomas.
            </p>
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-xl border-2 border-primary/20">
              <p className="text-xl font-medium text-primary italic">
                "Não somos apenas uma plataforma de saúde mental. Somos um movimento de profissionais comprometidos 
                em devolver a dignidade e a esperança para quem mais precisa."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Nossos Valores em Ação</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Icon className="text-white" size={32} />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
              Por que Escolher a AloPsi?
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-primary">
                  Mais do que uma Plataforma, uma Comunidade
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="text-primary-foreground h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Rede de Apoio Profissional</h4>
                      <p className="text-muted-foreground">
                        Conecte-se com outros profissionais que compartilham sua visão humanizada do cuidado.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <BookOpen className="text-white h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Formação Continuada</h4>
                      <p className="text-muted-foreground">
                        Acesso a cursos, workshops e supervisões focados em abordagens humanizadas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Award className="text-white h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Reconhecimento do Seu Trabalho</h4>
                      <p className="text-muted-foreground">
                        Sua dedicação é valorizada através de feedback contínuo e oportunidades de crescimento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="text-yellow-500 h-5 w-5" />
                      Benefícios Exclusivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {benefits.slice(0, 4).map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" className="mt-4 p-0 h-auto text-primary">
                      Ver todos os benefícios →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Pronto para Fazer a Diferença?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Cadastre-se agora e comece sua jornada como profissional AloPsi. 
                Juntos, vamos transformar o cuidado em saúde mental no Brasil.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Application Form */}
              <div className="lg:col-span-2">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Heart className="text-primary h-6 w-6" />
                      Quero Atender na AloPsi
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Preencha os dados abaixo e nossa equipe entrará em contato em até 48 horas.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                          <Input placeholder="Seu nome completo" className="border-2 focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">E-mail *</label>
                          <Input type="email" placeholder="seu@email.com" className="border-2 focus:border-primary/50" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Telefone *</label>
                          <Input placeholder="(11) 99999-9999" className="border-2 focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Profissão *</label>
                          <Input placeholder="Ex: Psicólogo(a), Psiquiatra, Terapeuta" className="border-2 focus:border-primary/50" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Registro Profissional *</label>
                        <Input placeholder="Ex: CRP 06/123456, CRM 123456/SP" className="border-2 focus:border-primary/50" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Especialidades e Abordagens</label>
                        <Input placeholder="Ex: Terapia Cognitivo-Comportamental, Psicanálise, Terapia Humanizada" className="border-2 focus:border-primary/50" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Conte-nos sobre sua visão do cuidado em saúde mental
                        </label>
                        <textarea 
                          placeholder="Como você enxerga o cuidado além dos rótulos? Qual sua experiência em criar conexões genuínas com pacientes?"
                          rows={4}
                          className="w-full p-3 border-2 border-input rounded-md resize-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Currículo (PDF - opcional)</label>
                        <Input type="file" accept=".pdf" className="border-2 focus:border-primary/50" />
                      </div>
                      
                      <Button size="lg" className="w-full btn-gradient text-lg py-6 h-auto">
                        <Heart className="mr-2 h-5 w-5" />
                        Enviar Candidatura - Quero Atender!
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Ao enviar, você concorda com nossos termos de uso e política de privacidade.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Information */}
              <div className="space-y-6">
                {/* Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Requisitos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Process */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Processo de Seleção</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                        <div>
                          <p className="text-sm font-medium">Análise da candidatura</p>
                          <p className="text-xs text-muted-foreground">Avaliação do perfil e alinhamento com nossos valores</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                        <div>
                          <p className="text-sm font-medium">Conversa inicial</p>
                          <p className="text-xs text-muted-foreground">Bate-papo sobre sua visão de cuidado humanizado</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                        <div>
                          <p className="text-sm font-medium">Verificação de documentos</p>
                          <p className="text-xs text-muted-foreground">Validação de registros e formação</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">4</Badge>
                        <div>
                          <p className="text-sm font-medium">Integração</p>
                          <p className="text-xs text-muted-foreground">Bem-vindo à família AloPsi!</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact */}
                <Card className="bg-primary text-primary-foreground">
                  <CardHeader>
                    <CardTitle className="text-lg">Dúvidas?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm opacity-90 mb-4">
                      Nossa equipe está pronta para esclarecer qualquer questão sobre o processo.
                    </p>
                    <Button variant="accent" size="sm" className="w-full">
                      Falar Conosco
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary via-teal to-accent text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Transforme Vidas, Começando pela Sua
            </h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Cada pessoa que você atender na AloPsi não será apenas mais um paciente. 
              Será uma vida que você tocou, uma história que você ajudou a reescrever, 
              um futuro que você ajudou a construir.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="lg" className="text-lg px-8 py-4 h-auto bg-white text-primary hover:bg-white/90">
                <Heart className="mr-2 h-5 w-5" />
                Quero Fazer Parte da AloPsi
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2 border-white text-white hover:bg-white/10">
                <Link to="/professionals" className="flex items-center">
                  Conheça Nossa Equipe
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default WorkWithUs