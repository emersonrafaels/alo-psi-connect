import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useInstitutionKeyboardShortcuts';

export const KeyboardShortcutsPopover = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Atalhos de teclado"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Atalhos de Teclado</h4>
          <div className="space-y-1">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
