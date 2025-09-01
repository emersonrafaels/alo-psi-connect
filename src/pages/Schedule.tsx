import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SearchSection from "@/components/search-section"

const Schedule = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Agende sua Consulta
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Encontre o profissional ideal e agende sua consulta de forma rápida e segura.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <SearchSection />

      {/* Instructions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Como Agendar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">1</span>
                  </div>
                  <CardTitle className="text-center">Encontre o Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Use os filtros para encontrar o profissional que melhor atende suas necessidades.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">2</span>
                  </div>
                  <CardTitle className="text-center">Escolha o Horário</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Visualize a agenda do profissional e selecione o melhor horário para você.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">3</span>
                  </div>
                  <CardTitle className="text-center">Confirme seu Agendamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Complete seus dados e confirme o agendamento. Você receberá todas as informações por email.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Nossa equipe está aqui para ajudar você a encontrar o cuidado que merece.
          </p>
          <Button variant="accent" size="lg">
            Encontrar Profissional
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Schedule