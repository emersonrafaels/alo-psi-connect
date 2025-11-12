import { useEffect, useState } from 'react';
import { X, Maximize2, Type, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from './RichTextEditor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FocusModeProps {
  value: string;
  onChange: (html: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FocusMode = ({ value, onChange, isOpen, onClose }: FocusModeProps) => {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-base';
      case 'large': return 'text-xl';
      default: return 'text-lg';
    }
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-900 text-gray-100';
      case 'sepia': return 'bg-[#f4ecd8] text-[#5c4a3a]';
      default: return 'bg-background text-foreground';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col transition-colors ${getThemeClass()}`}>
      {/* Header minimalista com controles */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Maximize2 className="h-4 w-4" />
              <span>Modo Foco</span>
              <span className="text-xs opacity-60">• ESC para sair</span>
            </div>
            
            {/* Font Size Control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Type className="h-4 w-4" />
                  Fonte
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Tamanho da Fonte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFontSize('small')}>
                  Pequeno {fontSize === 'small' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize('medium')}>
                  Médio {fontSize === 'medium' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize('large')}>
                  Grande {fontSize === 'large' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Tema
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Tema de Escrita</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  ☀️ Claro {theme === 'light' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  🌙 Escuro {theme === 'dark' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('sepia')}>
                  📖 Sépia {theme === 'sepia' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Editor fullscreen com tipografia ajustável */}
      <div className="flex-1 overflow-hidden">
        <div className={`container mx-auto px-6 h-full ${getFontSizeClass()}`}>
          <RichTextEditor
            value={value}
            onChange={onChange}
            placeholder="Escreva seu conteúdo no modo foco..."
            minHeight="calc(100vh - 120px)"
            maxHeight="calc(100vh - 120px)"
          />
        </div>
      </div>
    </div>
  );
};
