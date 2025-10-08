import { FileText, Newspaper, ListChecks, BarChart3, Lightbulb } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PostTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

export const PostTemplates = ({ onSelectTemplate }: PostTemplatesProps) => {
  const templates = {
    tutorial: {
      icon: FileText,
      label: 'Tutorial Técnico',
      content: `# Como [Título do Tutorial]

## Introdução

Breve introdução sobre o que será ensinado e por que é importante.

## Pré-requisitos

- Requisito 1
- Requisito 2
- Requisito 3

## Passo 1: [Nome do Passo]

Descrição detalhada do primeiro passo.

\`\`\`
// Exemplo de código
const exemplo = "código aqui";
\`\`\`

## Passo 2: [Nome do Passo]

Descrição do segundo passo.

## Passo 3: [Nome do Passo]

Descrição do terceiro passo.

## Conclusão

Recapitulação do que foi aprendido e próximos passos.

## Recursos Adicionais

- [Link 1](https://example.com)
- [Link 2](https://example.com)
`
    },
    news: {
      icon: Newspaper,
      label: 'Notícia/Anúncio',
      content: `# [Título da Notícia]

**[Cidade/Local], [Data]** - Lead da notícia com as informações principais em um parágrafo.

## O que aconteceu

Desenvolvimento da história com mais detalhes sobre o acontecimento.

> "Citação relevante de fonte importante"
> — Nome da Fonte, Cargo

## Contexto

Informações de background e contexto necessários para entender a notícia.

## Impacto

Como isso afeta o público e qual é a importância.

## Próximos Passos

O que esperar daqui para frente.

---

**Sobre [Empresa/Organização]**: Breve descrição.
`
    },
    listicle: {
      icon: ListChecks,
      label: 'Lista/Listicle',
      content: `# [Número] [Adjetivo] [Tópico]

Introdução breve explicando o tema da lista e o que o leitor vai ganhar.

## 1. [Primeiro Item]

Descrição detalhada do primeiro item da lista.

**Por que é importante:** Explicação do valor.

## 2. [Segundo Item]

Descrição do segundo item.

**Exemplo prático:** Caso de uso real.

## 3. [Terceiro Item]

Descrição do terceiro item.

## 4. [Quarto Item]

Continue adicionando itens conforme necessário...

## Conclusão

Resumo dos pontos principais e call-to-action.
`
    },
    review: {
      icon: BarChart3,
      label: 'Análise/Review',
      content: `# Review: [Nome do Produto/Serviço]

## Visão Geral

Introdução sobre o produto/serviço e primeira impressão.

**Avaliação Geral:** ⭐⭐⭐⭐ (4/5)

## Características Principais

- Característica 1
- Característica 2
- Característica 3

## Prós

✅ **Ponto positivo 1:** Explicação
✅ **Ponto positivo 2:** Explicação
✅ **Ponto positivo 3:** Explicação

## Contras

❌ **Ponto negativo 1:** Explicação
❌ **Ponto negativo 2:** Explicação

## Experiência de Uso

Detalhes sobre a experiência real de uso no dia a dia.

## Comparação com Alternativas

Como se compara com opções similares no mercado.

## Veredito Final

Recomendação final e para quem é mais adequado.

**Vale a pena?** Sim/Não - justificativa.
`
    },
    tips: {
      icon: Lightbulb,
      label: 'Dicas Rápidas',
      content: `# [Número] Dicas de [Tópico]

Introdução rápida sobre o tema e por que essas dicas são valiosas.

## 💡 Dica 1: [Nome da Dica]

Explicação concisa da primeira dica e como aplicá-la.

## 💡 Dica 2: [Nome da Dica]

Segunda dica com exemplo prático.

## 💡 Dica 3: [Nome da Dica]

Terceira dica com benefícios claros.

## 💡 Dica 4: [Nome da Dica]

Continue adicionando dicas...

## 💡 Dica 5: [Nome da Dica]

Última dica com impacto.

---

**Dica Bônus:** Uma dica extra especial para quem leu até o final.

## Conclusão

Incentivo para aplicar as dicas e compartilhar resultados.
`
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Usar Template
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(templates).map(([key, template]) => {
          const Icon = template.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onSelectTemplate(template.content)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {template.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
