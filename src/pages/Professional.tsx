import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const Professional = () => {
  const schedule = {
    weekdays: ["Seg", "Ter", "Qua", "Qui", "Sex"],
    times: ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]
  }

  const specialties = [
    "Ansiedade", "Borderline", "Casamento", "Compulsões",
    "Conflitos Amorosos", "Conflitos Familiares", "Cuidados Paleativos"
  ]

  const approaches = ["Psicanálise", "Análise Bioenergética"]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <section className="bg-accent py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-accent-foreground">Perfil Do Profissional</h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Professional Info */}
            <div className="flex items-start space-x-6 mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Gabriela Kumai Mattedi</h2>
                <p className="text-muted-foreground">Psicólogo - CRP/CRM 06/203067</p>
              </div>
            </div>

            {/* About */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Sobre mim</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Sou psicóloga clínica de Orientação Psicanalítica, e psicóloga Hospitalar pós graduada em Psicologia Clínica 
                  Hospitalar no HCFMUSP (Hospital das Clínicas da Faculdade de Medicina da Universidade de São Paulo) e formação 
                  contínua em psicanálise pelo Instituto Gerar.
                </p>
                <p>
                  Tenho experiência nas áreas da Psicologia Social, Psicologia Clínica e Psicologia Hospitalar. Na área da 
                  Psicologia Social atuo/en com populações em situação de rua e mulheres vítimas de violência doméstica. 
                  Na clínica, atendo indivíduos de diferentes faixas etárias, multidisciplinar em atendimento a pacientes 
                  acometidos por câncer e pacientes com cardiopatias na área de UTI, enfermaria e transplante.
                </p>
                <p>
                  Na área da Psicologia Clínica, atendimento individual em consultório particular.
                </p>
                <p>
                  A psicanálise é uma abordagem que valoriza a escuta e o entendimento das raízes inconscientes que influenciam 
                  nossos comportamentos e emoções.
                </p>
                <p>
                  O meu foco de estudo é voltado para demandas de ansiedade, depressão, estresse, luto, abusos, autoestima, 
                  questões da adolescência e infância, questões relacionadas ao trabalho, relacionamentos abusivos, 
                  parentalidade, dentre outros.
                </p>
              </div>
            </section>

            {/* Professional Space */}
            <section>
              <h3 className="text-2xl font-bold mb-6">Espaço do profissional</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="sm" className="text-red-600 border-red-600">
                  📄 Curriculum pdf
                </Button>
                <Button variant="outline" size="sm">
                  📄 O Luto e o Processo de Ressignificação: Como Encontrar Sentido na Dor.html
                </Button>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Schedule */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-center">Agende sua consulta online</CardTitle>
                <p className="text-center text-sm opacity-90">Veja o calendário do profissional</p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {schedule.weekdays.map((day) => (
                    <Button key={day} variant="default" size="sm" className="text-xs">
                      {day}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {schedule.times.map((time, index) => (
                    <div key={index} className="text-center py-1">
                      {time}
                    </div>
                  ))}
                  {/* Mock schedule grid */}
                  {Array.from({ length: 30 }).map((_, index) => (
                    <div key={index} className="text-center py-1 text-xs text-blue-600">
                      {schedule.times[index % schedule.times.length]}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle>Especializações</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Approaches */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle>Abordagens</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {approaches.map((approach, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {approach}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Professional