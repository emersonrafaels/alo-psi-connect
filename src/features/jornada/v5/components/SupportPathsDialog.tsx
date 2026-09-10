import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { V5_COPY } from "../copy";

/** Caminhos de apoio disponíveis após concluir o registro. */
export const SupportPathsDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {V5_COPY.support.eyebrow}
        </p>
        <DialogTitle className="text-left text-lg font-semibold">
          {V5_COPY.support.title}
        </DialogTitle>
        <DialogDescription className="text-left text-sm">
          {V5_COPY.support.description}
        </DialogDescription>
      </DialogHeader>

      <ul className="grid gap-3 sm:grid-cols-2">
        {V5_COPY.support.options.map((option) => (
          <li key={option.title} className="rounded-2xl border border-border/70 p-3">
            <span className="block text-sm font-semibold text-foreground">{option.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
          </li>
        ))}
      </ul>

      <DialogFooter>
        <Button onClick={() => onOpenChange(false)}>{V5_COPY.support.close}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
