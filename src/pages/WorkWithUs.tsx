import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Heart, Shield, Sparkles, Users, Award, BookOpen, MessageCircle, Mail, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"

// Página Trabalhe Conosco - Cadastro gratuito + contato

const WorkWithUs = () => {
  const { tenant } = useTenant();
  const platformName = tenant?.name || "Alô, Psi!";
  const whatsappNumber = tenant?.whatsapp_number || "5511947994163";
  const contactEmail = tenant?.contact_email || "contato@alopsi.com.br";
  
  const handleWhatsAppClick = () => {
    const message = `Olá! Sou profissional e gostaria de saber mais sobre atender na ${platformName}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const benefits = [
    "Flexibilidade total de horários - você define quando atender",
    "Plataforma completa para gestão de consultas",
    `Suporte contínuo da equipe ${platformName}`,
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-teal/5 to-accent/10 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-5"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-teal to-accent bg-clip-text text-transparent">
              Se Torne um Profissional {platformName}
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-4 leading-relaxed">
              <strong className="text-foreground">Ajude além do rótulo.</strong> Transforme vidas oferecendo cuidado em saúde mental que enxerga a pessoa por completo.
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
              Junte-se a uma comunidade de profissionais que acredita no poder da conexão humana, da escuta ativa e do acolhimento sem julgamentos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="btn-gradient text-lg px-8 py-4 h-auto">
                <Link to={buildTenantPath(tenant?.slug || 'alopsi', '/register/profissional')}>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Cadastre-se Gratuitamente
                </Link>
              </Button>
              <Button onClick={handleWhatsAppClick} variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2">
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar com Especialista
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
          Na {platformName}, acreditamos que cada pessoa que busca ajuda é muito mais do que qualquer rótulo ou diagnóstico.
          Somos profissionais que escolheram ver além - que enxergam potencial onde outros veem limitações,
          que escutam histórias onde outros veem sintomas.
        </p>
        <div className="bg-background/80 backdrop-blur-sm p-8 rounded-xl border-2 border-primary/20">
          <p className="text-xl font-medium italic text-gray-800 dark:text-white">
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
<div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center 
  bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-500 dark:to-blue-700">
  <Icon className="w-10 h-10 text-gray-800 dark:text-white" />
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
              Por que Escolher a {platformName}?
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
                      <Award className="text-yellow-500 h-5 w-5" />
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Started Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-teal/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Como Começar?
              </h2>
              <p className="text-lg text-muted-foreground">
                É simples! Cadastre-se gratuitamente ou fale com nossa equipe para tirar dúvidas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Cadastro Gratuito */}
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center">Cadastro Gratuito</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Crie sua conta profissional agora e comece a atender em minutos. 
                    Sem processo seletivo, sem burocracia.
                  </p>
                  <Button asChild size="lg" className="w-full btn-gradient">
                    <Link to={buildTenantPath(tenant?.slug || 'alopsi', '/register/profissional')}>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Cadastrar Agora
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Falar com Especialista */}
              <Card className="border-2 border-teal/20 hover:border-teal/40 transition-all">
                <CardHeader>
                  <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-teal" />
                  </div>
                  <CardTitle className="text-center">Tire suas Dúvidas</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Converse com nosso time de especialistas para entender melhor 
                    como funciona a plataforma.
                  </p>
                  <Button onClick={handleWhatsAppClick} size="lg" variant="outline" className="w-full border-2 border-teal hover:bg-teal/10">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Requisitos */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5" />
                  Requisitos para Atender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-sm text-muted-foreground">{requirement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Ainda tem dúvidas? Entre em contato diretamente:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {contactEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary via-teal to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para Transformar Vidas?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Junte-se a nós e faça parte de uma comunidade que acredita no poder do cuidado humanizado.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-4 h-auto">
            <Link to={buildTenantPath(tenant?.slug || 'alopsi', '/register/profissional')}>
              <Heart className="mr-2 h-5 w-5" />
              Começar Agora
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default WorkWithUs
