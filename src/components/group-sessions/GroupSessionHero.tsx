import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export const GroupSessionHero = () => {
  const scrollToSessions = () => {
    document.getElementById('sessions-calendar')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
          <Users className="h-8 w-8 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Você não está só!
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Participe dos nossos encontros em grupo online e gratuitos. 
          Escolha a melhor opção pra você.
        </p>

        <Button 
          size="lg" 
          onClick={scrollToSessions}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          Ver Encontros do Mês
        </Button>
      </div>

      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -z-10" />
    </div>
  );
};
