import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

const Blog = () => {
  const posts = [
    {
      title: "Nunc tincidunt mollis dui in tempor",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      date: "24 Agosto, 2024",
      readTime: "5 min read"
    },
    {
      title: "Nunc tincidunt mollis dui in tempor",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      date: "24 Agosto, 2024", 
      readTime: "5 min read"
    },
    {
      title: "Nunc tincidunt mollis dui in tempor",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      date: "24 Agosto, 2024",
      readTime: "5 min read"
    }
  ]

  const tags = ["Psicologia", "Ansiedade", "Depressão", "Terapia", "Autoestima", "Bem-estar", "Estresse"]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header */}
      <section className="bg-accent py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-accent-foreground mb-4">News & Blog</h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Featured Post */}
            <article className="mb-12">
              <div className="bg-teal aspect-video rounded-lg mb-6"></div>
              <h2 className="text-3xl font-bold mb-4">
                Um Santuário para Crescimento e Transformação Abraçando a Empatia, 
                Inspirando Mudanças Potential Total
              </h2>
              <p className="text-muted-foreground mb-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              
              <h3 className="text-xl font-semibold mb-4">
                Apoiando Seu Crescimento e Transformação Pessoal
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Toca: é graça como não vamos nada melhor fera ter Você</li>
                <li>Transformar: é variedades, aplica até mesmo: Ética Esse apoio</li>
                <li>Não pode sempre ter: bem no seu, mesmo cada</li>
                <li>Através de: quando vamos não vos, sua, mas conseguir estilos vida</li>
                <li>Respeitar: é hora mas mesmo quando depois você melhor e Oração...</li>
                <li>Dá graça é tem melhor que elementos bem, mais, no vinho queixa</li>
                <li>Ler força: organizar explicitation falar força, mais, "a a resposta pronto! </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">
                Descobrindo a Alegria em Cada Passo da Sua Jornada
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-teal aspect-video rounded-lg"></div>
                <div>
                  <p className="text-muted-foreground">
                    Desde especial como um esta é uma São, você fazer descobrir, desenvolvendo ou 
                    há Uma: das pode agora Até remanesceu Ou e Se espinha me: momento Um ainda não
                    um desenvolvimento, é transformações e é há para as não fazer a todo poder 
                    Nossa esta depois sempre para dia a pes ser uma então...
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">
                Criando Mudanças Positivas, Uma Sessão de Cada Vez
              </h3>
              <p className="text-muted-foreground mb-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              {/* Quote */}
              <div className="bg-primary text-primary-foreground p-6 rounded-lg mb-8 flex items-start space-x-4">
                <div className="text-4xl">💬</div>
                <div>
                  <p className="mb-2">
                    "Nunc imperdiet odio et urna dignissim, sit amet sagittis ex posuere Etiam et 
                    sed dua justo molest: Eteltur velit om podex!"
                  </p>
                  <p className="text-sm opacity-80">— Irene Shaffer, psycologist</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-sm font-medium">Tags:</span>
                <Badge variant="secondary">Ansiedade</Badge>
                <Badge variant="secondary">Espiritualismo</Badge>
                <Badge variant="secondary">Superação</Badge>
              </div>

              {/* Comments Form */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-6">Deixe Um Comentário</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Seu nome" />
                    <Input placeholder="E-mail" />
                  </div>
                  <textarea 
                    placeholder="Mensagem"
                    rows={4}
                    className="w-full p-3 border border-input rounded-md resize-none"
                  />
                  <Button variant="default">Enviar</Button>
                </form>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle>Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input placeholder="Procurar por palavra..." />
                  <Button size="sm" className="absolute right-1 top-1 h-8 w-8" variant="default">
                    <Search size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Posts Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {posts.map((post, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-16 h-16 bg-teal rounded flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-sm leading-tight">{post.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      {tag}
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

export default Blog