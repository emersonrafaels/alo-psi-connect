import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { AboutImageSection } from "@/components/AboutImageSection"

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AboutImageSection />
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Cuidando De Quem <br />
                Cuida De Nós
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Acreditamos na força do acolhimento e na construção de um ambiente seguro, 
                onde sua história é respeitada, suas dores são ouvidas e seus avanços, celebrados.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="default" size="lg">
                  Encontrar Profissional
                </Button>
                <Button variant="accent" size="lg">
                  Marcar uma Consulta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg max-w-4xl mx-auto">
            Acreditamos na força do acolhimento e na construção de um ambiente seguro, 
            onde sua história é respeitada, suas dores são ouvidas e seus avanços, celebrados.
          </p>
        </div>
      </section>

      {/* University Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Voltada Exclusivamente Para Estudantes Universitários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">94%</span>
              </div>
              <p className="text-sm">
                dos psicólogos que se consideram <br />
                administradores experientes de <br />
                suas próprias experiências acadêmicas
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">94%</span>
              </div>
              <p className="text-sm">
                dos médicos que afirmam que <br />
                administram sempre <br />
                prevenção e primeiros socorros
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <p className="text-sm">
                anos de experiência <br />
                provando de saúde mental <br />
                em grupo, 14 vezes mais eficácia
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default About