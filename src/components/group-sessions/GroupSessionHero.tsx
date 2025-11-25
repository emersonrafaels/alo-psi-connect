import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Moon, Flame } from 'lucide-react';

export const GroupSessionHero = () => {
  const scrollToSessions = () => {
    document.getElementById('sessions-calendar')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Ilustração Decorativa - Esquerda */}
          <div className="hidden md:flex justify-center items-center relative">
            <div className="relative">
              <div className="absolute top-0 left-0 w-32 h-32 opacity-20 animate-pulse">
                <Flame className="w-full h-full text-accent" />
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}>
                <Moon className="w-full h-full text-accent" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                <Heart className="w-full h-full text-accent opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              <Sparkles className="absolute top-10 right-10 w-8 h-8 text-accent opacity-60 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <Sparkles className="absolute bottom-20 left-10 w-6 h-6 text-accent opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
              <Sparkles className="absolute top-32 left-20 w-5 h-5 text-accent opacity-60 animate-pulse" style={{ animationDelay: '1.2s' }} />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary-foreground animate-fade-in">
              Você não está só!
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Participe dos nossos encontros em grupo online e gratuitos. 
              Escolha a melhor opção pra você.
            </p>

            <Button 
              size="lg" 
              onClick={scrollToSessions}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 hover:scale-105 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              Ver Encontros do Mês
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
    </div>
  );
};
