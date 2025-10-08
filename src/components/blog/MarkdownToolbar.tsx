import { 
  Bold, Italic, Code, Heading1, Heading2, Heading3, 
  List, ListOrdered, Link2, Image, Quote, FileCode, 
  Minus, Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarkdownToolbarProps {
  onAction: (action: string) => void;
}

export const MarkdownToolbar = ({ onAction }: MarkdownToolbarProps) => {
  const ToolbarButton = ({ 
    icon: Icon, 
    label, 
    action, 
    shortcut 
  }: { 
    icon: any; 
    label: string; 
    action: string; 
    shortcut?: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAction(action)}
            className="h-8 w-8 p-0"
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label} {shortcut && <span className="text-muted-foreground ml-2">{shortcut}</span>}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
      <ToolbarButton icon={Bold} label="Negrito" action="bold" shortcut="Ctrl+B" />
      <ToolbarButton icon={Italic} label="Itálico" action="italic" shortcut="Ctrl+I" />
      <ToolbarButton icon={Code} label="Código Inline" action="code" />
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Heading1 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Títulos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAction('h1')}>
            <Heading1 className="h-4 w-4 mr-2" /> Título 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('h2')}>
            <Heading2 className="h-4 w-4 mr-2" /> Título 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('h3')}>
            <Heading3 className="h-4 w-4 mr-2" /> Título 3
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('h4')}>
            <span className="mr-2 font-bold text-xs">H4</span> Título 4
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('h5')}>
            <span className="mr-2 font-bold text-xs">H5</span> Título 5
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('h6')}>
            <span className="mr-2 font-bold text-xs">H6</span> Título 6
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <ToolbarButton icon={List} label="Lista com Marcadores" action="bullet-list" />
      <ToolbarButton icon={ListOrdered} label="Lista Numerada" action="numbered-list" />
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <ToolbarButton icon={Link2} label="Link" action="link" shortcut="Ctrl+K" />
      <ToolbarButton icon={Image} label="Imagem" action="image" />
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <ToolbarButton icon={Quote} label="Citação" action="quote" />
      <ToolbarButton icon={FileCode} label="Bloco de Código" action="code-block" />
      <ToolbarButton icon={Table} label="Tabela" action="table" />
      <ToolbarButton icon={Minus} label="Linha Horizontal" action="hr" />
    </div>
  );
};
