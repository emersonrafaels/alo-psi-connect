import { Settings, Type, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useReadingPreferences, ReadingTheme, FontSize, ContentWidth } from '@/hooks/useReadingPreferences';

export const ReadingPreferences = () => {
  const { preferences, setTheme, setFontSize, setContentWidth } = useReadingPreferences();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-24 right-6 z-40 shadow-lg">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Preferências de Leitura</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Tema
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme('light')} className={preferences.theme === 'light' ? 'bg-accent' : ''}>
          ☀️ Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className={preferences.theme === 'dark' ? 'bg-accent' : ''}>
          🌙 Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('sepia')} className={preferences.theme === 'sepia' ? 'bg-accent' : ''}>
          📖 Sépia
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          <Type className="inline h-3 w-3 mr-1" />
          Tamanho da Fonte
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setFontSize('small')} className={preferences.fontSize === 'small' ? 'bg-accent' : ''}>
          Pequeno
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setFontSize('medium')} className={preferences.fontSize === 'medium' ? 'bg-accent' : ''}>
          Médio
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setFontSize('large')} className={preferences.fontSize === 'large' ? 'bg-accent' : ''}>
          Grande
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          <Monitor className="inline h-3 w-3 mr-1" />
          Largura do Conteúdo
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setContentWidth('narrow')} className={preferences.contentWidth === 'narrow' ? 'bg-accent' : ''}>
          Estreito
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setContentWidth('medium')} className={preferences.contentWidth === 'medium' ? 'bg-accent' : ''}>
          Médio
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setContentWidth('wide')} className={preferences.contentWidth === 'wide' ? 'bg-accent' : ''}>
          Largo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
