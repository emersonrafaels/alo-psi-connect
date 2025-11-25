import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface SessionsErrorStateProps {
  onRetry: () => void;
}

export const SessionsErrorState = ({ onRetry }: SessionsErrorStateProps) => {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Erro ao carregar encontros
          </h3>
          <p className="text-muted-foreground max-w-md">
            Não foi possível carregar os encontros. Por favor, tente novamente.
          </p>
        </div>
        <Button onClick={onRetry} variant="default">
          Tentar Novamente
        </Button>
      </CardContent>
    </Card>
  );
};