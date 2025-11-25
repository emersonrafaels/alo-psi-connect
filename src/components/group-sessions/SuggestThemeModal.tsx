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
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Loader2 } from "lucide-react";
import { useThemeSuggestion } from "@/hooks/useThemeSuggestion";
import { z } from "zod";

const suggestionSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().optional(),
  tema: z.string().min(3, "O tema deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
});

interface SuggestThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuggestThemeModal = ({ open, onOpenChange }: SuggestThemeModalProps) => {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { suggest, isLoading } = useThemeSuggestion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      suggestionSchema.parse({ email, nome, tema, descricao });

      const success = await suggest({
        email,
        nome: nome || undefined,
        tema,
        descricao: descricao || undefined,
      });

      if (success) {
        setEmail("");
        setNome("");
        setTema("");
        setDescricao("");
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Sugira um tema para debate!
          </DialogTitle>
          <DialogDescription className="text-center">
            Queremos ouvir você! Compartilhe temas que gostaria de ver abordados nos nossos encontros em grupo.
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

          <div className="space-y-2">
            <Label htmlFor="tema">
              Tema sugerido <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tema"
              placeholder="Ex: Ansiedade no ambiente de trabalho"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              disabled={isLoading}
              className={errors.tema ? "border-destructive" : ""}
            />
            {errors.tema && (
              <p className="text-sm text-destructive">{errors.tema}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Por que esse tema? (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Conte-nos por que esse tema é importante para você ou para a comunidade..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={isLoading}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Sua justificativa nos ajuda a entender melhor a relevância do tema
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
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
                <Lightbulb className="w-4 h-4 mr-2" />
                Enviar sugestão 💫
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
