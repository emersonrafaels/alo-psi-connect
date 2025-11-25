import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Mail, Sparkles } from 'lucide-react';

interface EmptySessionsStateProps {
  hasNoFutureSessions?: boolean;
}

export const EmptySessionsState = ({ hasNoFutureSessions }: EmptySessionsStateProps) => {
  const handleNewsletterSignup = () => {
    // Navigate to newsletter section or open modal
    const newsletterSection = document.getElementById('newsletter-section');
    if (newsletterSection) {
      newsletterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSuggestTheme = () => {
    // Navigate to contact form or open suggestion modal
    window.location.href = '/contato';
  };

  return (
    <div className="text-center py-16 space-y-8">
      <Card className="max-w-2xl mx-auto border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-12 pb-12 px-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Calendar className="w-20 h-20 text-primary/30" />
              <Sparkles className="w-8 h-8 text-accent absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>

          {hasNoFutureSessions ? (
            <>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Em breve novos encontros!
              </h3>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                Estamos preparando encontros incríveis para você. Cadastre-se na nossa newsletter para ser o primeiro a saber quando abrirem novas vagas.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Nenhum encontro neste período
              </h3>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                Não encontramos encontros disponíveis para este mês. Tente selecionar outro período ou cadastre-se para receber notificações.
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleNewsletterSignup}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Mail className="w-4 h-4" />
              Quero ser avisado
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleSuggestTheme}
              className="gap-2 border-2 hover:bg-primary/5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Sugerir um tema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Decorative elements */}
      <div className="flex justify-center gap-2 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};
