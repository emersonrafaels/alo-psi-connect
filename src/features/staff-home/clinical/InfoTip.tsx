import * as T from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

/** Small "i" icon with an explanation; portalled so it never hides behind cards. */
export function InfoTip({ text, label }: { text?: string; label: string }) {
  if (!text) return null;
  return (
    <T.Provider delayDuration={150}>
      <T.Root>
        <T.Trigger asChild>
          <button type="button" aria-label={`Sobre: ${label}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="inline-flex shrink-0 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Info className="h-3.5 w-3.5" />
          </button>
        </T.Trigger>
        <T.Portal>
          <T.Content sideOffset={6} collisionPadding={8} className="z-[9999] max-w-xs rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
            {text}<T.Arrow className="fill-popover" />
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}
