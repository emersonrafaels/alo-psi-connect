import { useEffect, useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from './RichTextEditor';

interface FocusModeProps {
  value: string;
  onChange: (html: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FocusMode = ({ value, onChange, isOpen, onClose }: FocusModeProps) => {
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

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header minimalista */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Maximize2 className="h-4 w-4" />
            <span>Modo Foco</span>
            <span className="text-xs opacity-60">• ESC para sair</span>
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

      {/* Editor fullscreen */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 h-full">
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
