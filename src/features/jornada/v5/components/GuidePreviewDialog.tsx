import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const GuidePreviewDialog = ({ open, onOpenChange, title }: { open: boolean; onOpenChange: (open: boolean) => void; title: string }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <p className="text-xs font-semibold uppercase text-primary">Orientação em vídeo</p>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Este espaço receberá o vídeo final validado pela equipe.</DialogDescription>
      </DialogHeader>
      <div className="grid min-h-52 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <div className="text-center">
          <Play className="mx-auto mb-3 h-10 w-10" aria-hidden />
          <strong className="block">Conteúdo em produção</strong>
          <span className="mt-1 block max-w-sm text-sm opacity-80">O vídeo abrirá sem som e você decidirá se quer ouvir ou ampliar.</span>
        </div>
      </div>
      <DialogFooter><Button onClick={() => onOpenChange(false)}>Continuar minha jornada</Button></DialogFooter>
    </DialogContent>
  </Dialog>
);