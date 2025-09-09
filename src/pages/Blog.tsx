import { useState } from "react"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { CommentForm } from "@/components/CommentForm"
import { CommentsList } from "@/components/CommentsList"

const Blog = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const posts = [
    {
      title: "Como Identificar e Superar a Síndrome do Impostor na Universidade",
      excerpt: "Você já se sentiu como se não merecesse estar na universidade? A síndrome do impostor afeta muitos estudantes...",
      date: "15 Janeiro, 2025",
      readTime: "7 min de leitura",
      author: "Dra. Marina Silva",
      tags: ["Síndrome do Impostor", "Autoestima", "Universidade"]
    },
    {
      title: "5 Técnicas de Mindfulness para Reduzir a Ansiedade Acadêmica",
      excerpt: "Descubra práticas simples de mindfulness que podem ser aplicadas no dia a dia universitário para diminuir a ansiedade...",
      date: "12 Janeiro, 2025", 
      readTime: "5 min de leitura",
      author: "Dr. Carlos Mendes",
      tags: ["Mindfulness", "Ansiedade", "Técnicas"]
    },
    {
      title: "Sinais de Que Você Precisa Buscar Ajuda Psicológica",
      excerpt: "Reconhecer quando é hora de procurar apoio profissional é fundamental para sua saúde mental...",
      date: "10 Janeiro, 2025",
      readTime: "6 min de leitura",
      author: "Dra. Ana Paula Costa",
      tags: ["Saúde Mental", "Terapia", "Autocuidado"]
    },
    {
      title: "Gerenciando o Estresse Durante o Período de Provas",
      excerpt: "Estratégias práticas para manter o equilíbrio emocional durante os momentos mais intensos do semestre...",
      date: "8 Janeiro, 2025",
      readTime: "8 min de leitura",
      author: "Dr. Roberto Oliveira",
      tags: ["Estresse", "Provas", "Estratégias"]
    },
    {
      title: "O Impacto das Redes Sociais na Saúde Mental dos Universitários",
      excerpt: "Como o uso excessivo das redes sociais pode afetar seu bem-estar e dicas para um uso mais consciente...",
      date: "5 Janeiro, 2025",
      readTime: "6 min de leitura",
      author: "Dra. Fernanda Ribeiro",
      tags: ["Redes Sociais", "Bem-estar", "Digital"]
    }
  ]

  const tags = ["Ansiedade", "Estresse", "Autoestima", "Mindfulness", "Síndrome do Impostor", "Terapia", "Bem-estar", "Universitários", "Depressão", "Autocuidado"]

  const postId = "ansiedade-academica-guia-completo";

  const handleCommentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
              <div className="bg-teal aspect-video rounded-lg mb-6 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">Ansiedade Acadêmica</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Como Superar a Ansiedade Acadêmica: Um Guia Completo para Estudantes Universitários
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span>Por Dra. Luciana Santos</span>
                <span>•</span>
                <span>15 Janeiro, 2025</span>
                <span>•</span>
                <span>10 min de leitura</span>
              </div>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                A ansiedade acadêmica é uma realidade que afeta milhões de estudantes universitários no Brasil. 
                Caracterizada por sentimentos intensos de preocupação, medo e nervosismo relacionados ao desempenho 
                acadêmico, essa condição pode impactar significativamente a qualidade de vida e o rendimento dos estudos.
              </p>
              
              <h3 className="text-xl font-semibold mb-4">
                Entendendo os Sinais da Ansiedade Acadêmica
              </h3>
              <p className="text-muted-foreground mb-4">
                Reconhecer os sintomas é o primeiro passo para buscar ajuda. Os sinais mais comuns incluem:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Dificuldade para se concentrar durante os estudos</li>
                <li>Procrastinação excessiva ou paralisia diante das tarefas</li>
                <li>Sintomas físicos como taquicardia, suor excessivo ou dores de cabeça</li>
                <li>Insônia ou alterações no padrão de sono</li>
                <li>Pensamentos catastróficos sobre o futuro acadêmico</li>
                <li>Evitamento de situações acadêmicas importantes</li>
                <li>Baixa autoestima relacionada ao desempenho</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">
                Estratégias Práticas para Gerenciar a Ansiedade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-accent/10 aspect-video rounded-lg flex items-center justify-center">
                  <span className="text-accent font-semibold">Técnicas de Respiração</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">1. Técnica da Respiração 4-7-8</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    Inspire por 4 segundos, segure por 7 e expire por 8. Esta técnica ativa o sistema nervoso 
                    parassimpático, promovendo relaxamento imediato.
                  </p>
                  <h4 className="font-semibold mb-2">2. Organização e Planejamento</h4>
                  <p className="text-muted-foreground text-sm">
                    Divida grandes projetos em tarefas menores e crie cronogramas realistas. A sensação de 
                    controle reduz significativamente a ansiedade.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">
                Quando Buscar Ajuda Profissional
              </h3>
              <p className="text-muted-foreground mb-6">
                Se a ansiedade está interferindo significativamente em sua vida acadêmica e pessoal, é importante 
                buscar apoio de um profissional de saúde mental. A terapia cognitivo-comportamental tem se mostrado 
                especialmente eficaz no tratamento da ansiedade acadêmica, ajudando os estudantes a desenvolver 
                estratégias de enfrentamento saudáveis e duradouras.
              </p>

              {/* Quote */}
              <div className="bg-primary text-primary-foreground p-6 rounded-lg mb-8 flex items-start space-x-4">
                <div className="text-4xl">💭</div>
                <div>
                  <p className="mb-2">
                    "A ansiedade acadêmica não é uma falha de caráter, mas uma resposta natural do corpo a situações 
                    de pressão. O importante é aprender a gerenciá-la de forma saudável."
                  </p>
                  <p className="text-sm opacity-80">— Dra. Luciana Santos, Psicóloga Clínica</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-sm font-medium">Tags:</span>
                <Badge variant="secondary">Ansiedade</Badge>
                <Badge variant="secondary">Estudantes</Badge>
                <Badge variant="secondary">Técnicas</Badge>
                <Badge variant="secondary">Saúde Mental</Badge>
              </div>

              {/* Comments Section */}
              <div className="space-y-8">
                <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
                <CommentsList postId={postId} refreshTrigger={refreshTrigger} />
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
                {posts.slice(0, 3).map((post, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-16 h-16 bg-teal rounded flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold text-center">
                        {post.tags[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm leading-tight line-clamp-2">{post.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                      <p className="text-xs text-muted-foreground">{post.readTime}</p>
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