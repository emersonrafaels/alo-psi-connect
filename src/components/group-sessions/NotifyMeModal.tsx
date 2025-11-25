import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Loader2 } from "lucide-react";
import { useNewsletter } from "@/hooks/useNewsletter";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Você precisa aceitar receber notificações",
  }),
});

interface NotifyMeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotifyMeModal = ({ open, onOpenChange }: NotifyMeModalProps) => {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { subscribe, isLoading } = useNewsletter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      newsletterSchema.parse({ email, nome, acceptTerms });

      const success = await subscribe({
        email,
        nome: nome || undefined,
      });

      if (success) {
        setEmail("");
        setNome("");
        setAcceptTerms(false);
        onOpenChange(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Bell className="w-8 h-8 text-accent" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Fique por dentro dos encontros!
          </DialogTitle>
          <DialogDescription className="text-center">
            Receba notificações sobre novos temas, horários e eventos especiais diretamente no seu email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Seu nome (opcional)</Label>
            <Input
              id="nome"
              placeholder="Como podemos te chamar?"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Seu email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              disabled={isLoading}
              className={errors.acceptTerms ? "border-destructive" : ""}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Aceito receber notificações sobre encontros em grupo
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-destructive">{errors.acceptTerms}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Me avise! 🚀
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
