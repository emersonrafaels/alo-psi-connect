import { HelpCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export const MarkdownCheatSheet = () => {
  const examples = [
    {
      category: 'Títulos',
      items: [
        { syntax: '# Título 1', description: 'Título principal (H1)' },
        { syntax: '## Título 2', description: 'Subtítulo (H2)' },
        { syntax: '### Título 3', description: 'Seção (H3)' },
      ]
    },
    {
      category: 'Formatação de Texto',
      items: [
        { syntax: '**negrito**', description: 'Texto em negrito' },
        { syntax: '*itálico*', description: 'Texto em itálico' },
        { syntax: '`código`', description: 'Código inline' },
        { syntax: '~~riscado~~', description: 'Texto riscado' },
      ]
    },
    {
      category: 'Listas',
      items: [
        { syntax: '- Item 1\n- Item 2', description: 'Lista com marcadores' },
        { syntax: '1. Primeiro\n2. Segundo', description: 'Lista numerada' },
        { syntax: '- [ ] Tarefa\n- [x] Concluída', description: 'Lista de tarefas' },
      ]
    },
    {
      category: 'Links e Imagens',
      items: [
        { syntax: '[Texto do link](https://url.com)', description: 'Link' },
        { syntax: '![Texto alt](url-da-imagem.jpg)', description: 'Imagem' },
      ]
    },
    {
      category: 'Blocos',
      items: [
        { syntax: '> Citação', description: 'Bloco de citação' },
        { syntax: '```\ncódigo\n```', description: 'Bloco de código' },
        { syntax: '---', description: 'Linha horizontal' },
      ]
    },
    {
      category: 'Tabelas',
      items: [
        { 
          syntax: '| Col 1 | Col 2 |\n|-------|-------|\n| A     | B     |', 
          description: 'Tabela simples' 
        },
      ]
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Guia Markdown
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Guia Rápido de Markdown</SheetTitle>
          <SheetDescription>
            Referência de sintaxe para formatação do seu post
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          <div className="space-y-6">
            {examples.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="font-semibold text-sm text-primary">{section.category}</h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <code className="block p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-all">
                        {item.syntax}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-sm text-primary">Atalhos de Teclado</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Negrito</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+B</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itálico</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+I</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Link</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+K</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Indentar</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Tab</kbd>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
