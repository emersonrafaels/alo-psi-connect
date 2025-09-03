import { Button } from "@/components/ui/button"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import SearchSection from "@/components/search-section"
import ProfessionalCard from "@/components/professional-card"

const Index = () => {
  const professionals = [
    {
      name: "Gabriela Kumai Mattedi",
      title: "Psicólogo - CRP/CRM 06/203067",
      specialties: ["Ansiedade", "Depressão", "Terapia de Casal"]
    },
    {
      name: "Dr. João Silva",
      title: "Psiquiatra - CRM 12345",
      specialties: ["Transtornos de Humor", "TDAH", "Bipolaridade"]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                Cuidando De Quem <br />
                Cuida De Nós
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Encontre profissionais especializados em saúde mental com atendimento humanizado e de qualidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="default" size="lg" className="bg-primary text-primary-foreground">
                  Encontrar Profissional
                </Button>
                <Button variant="accent" size="lg">
                  Marcar uma Consulta
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-80 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Imagem do Hero</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <SearchSection />

      {/* About Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg max-w-4xl mx-auto text-foreground">
            Acreditamos na força do acolhimento e na construção de um ambiente seguro, 
            onde sua história é respeitada, suas dores são ouvidas e seus avanços, celebrados.
          </p>
        </div>
      </section>

      {/* University Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Voltada Exclusivamente Para Estudantes Universitários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">94%</span>
              </div>
              <p className="text-sm text-foreground">
                dos psicólogos consideram <br />
                que administram com <br />
                eficácia seus estudos acadêmicos
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">94%</span>
              </div>
              <p className="text-sm text-foreground">
                dos médicos consideram <br />
                que administram sempre <br />
                com prevenção e cuidado
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <p className="text-sm text-foreground">
                anos de experiência <br />
                promovendo de saúde mental <br />
                com qualidade 12 meses
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-teal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-2 text-card-foreground">250+</h3>
                <p className="text-sm text-card-foreground">Psicólogos</p>
                <p className="text-xs text-muted-foreground">
                  Nos últimos meses, Â são psicólogos credenciados desde junho de 2022
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-2 text-card-foreground">Uma escola tão acolhedora.</h3>
                <p className="text-sm text-card-foreground">
                  Encontre agora de Escutar nós vamos de trabalho nos Encontre
                </p>
              </div>
            </div>
            <div className="bg-primary/20 aspect-video rounded-lg flex items-center justify-center">
              <Button variant="default" size="icon" className="w-16 h-16 rounded-full">
                ▶
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Profissionais em Destaque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {professionals.map((professional, index) => (
              <ProfessionalCard
                key={index}
                name={professional.name}
                title={professional.title}
                specialties={professional.specialties}
                isCompactView
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Empatia, Compreensão, Transformação: <br />
            O Seu Caminho Para A Cura.
          </h2>
          <Button variant="accent" size="lg" className="mt-8">
            Agendar Consulta
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
