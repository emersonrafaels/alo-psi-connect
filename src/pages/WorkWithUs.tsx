import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Heart, Trophy } from "lucide-react"

const WorkWithUs = () => {
  const benefits = [
    "Flexibilidade de horários",
    "Ambiente colaborativo",
    "Crescimento profissional",
    "Impacto social positivo",
    "Remuneração competitiva",
    "Educação continuada"
  ]

  const requirements = [
    "Registro ativo no conselho profissional",
    "Experiência mínima de 2 anos",
    "Disponibilidade para atendimento online",
    "Compromisso com a ética profissional"
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Trabalhe Conosco
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se à nossa equipe de profissionais dedicados a transformar vidas através do cuidado em saúde mental.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Por que escolher o Alô, Psi!?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-primary-foreground" size={24} />
                </div>
                <CardTitle>Equipe Colaborativa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Trabalhe com uma equipe de profissionais experientes e dedicados ao crescimento mútuo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Heart className="text-primary-foreground" size={24} />
                </div>
                <CardTitle>Impacto Significativo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Faça a diferença na vida das pessoas, oferecendo cuidado de qualidade em saúde mental.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="text-primary-foreground" size={24} />
                </div>
                <CardTitle>Crescimento Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Acesso a formação continuada e oportunidades de especialização na área.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Application Form */}
          <div>
            <h2 className="text-3xl font-bold mb-8">Candidate-se</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Completo</label>
                  <Input placeholder="Seu nome completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Telefone</label>
                <Input placeholder="(11) 99999-9999" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Profissão</label>
                <Input placeholder="Ex: Psicólogo, Psiquiatra, Terapeuta" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Número do Registro Profissional</label>
                <Input placeholder="Ex: CRP 06/123456" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Especialidades</label>
                <Input placeholder="Ex: Ansiedade, Depressão, Terapia de Casal" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Experiência Profissional</label>
                <textarea 
                  placeholder="Descreva sua experiência e formação..."
                  rows={4}
                  className="w-full p-3 border border-input rounded-md resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Currículo (PDF)</label>
                <Input type="file" accept=".pdf" />
              </div>
              
              <Button variant="default" size="lg" className="w-full">
                Enviar Candidatura
              </Button>
            </form>
          </div>

          {/* Information */}
          <div className="space-y-8">
            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Benefícios</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requisitos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Process */}
            <Card>
              <CardHeader>
                <CardTitle>Processo Seletivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center">1</Badge>
                    <span>Análise do currículo</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center">2</Badge>
                    <span>Entrevista inicial</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center">3</Badge>
                    <span>Verificação de documentos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center">4</Badge>
                    <span>Integração à equipe</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Transforme vidas, transforme a sua também
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Junte-se a nós e seja parte de uma missão que vai além do trabalho.
          </p>
          <Button variant="accent" size="lg">
            Candidate-se Agora
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default WorkWithUs