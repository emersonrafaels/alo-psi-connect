import { Button } from '@/components/ui/button';
import heroImage from '@/assets/group-therapy-hero.jpg';

export const GroupSessionHero = () => {
  const scrollToSessions = () => {
    document.getElementById('sessions-calendar')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-teal/10 to-accent/10 dark:from-primary/20 dark:via-teal/20 dark:to-accent/20 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Imagem AI - Esquerda */}
          <div className="hidden md:flex justify-center items-center">
            <img 
              src={heroImage}
              alt="Encontros em grupo online"
              className="w-full max-w-md rounded-2xl shadow-2xl animate-fade-in dark:shadow-primary/50"
            />
          </div>
          
          <div className="text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary dark:text-primary/90 animate-fade-in">
              Você não está só!
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground dark:text-muted-foreground max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Participe dos nossos encontros em grupo online e gratuitos. 
              Escolha a melhor opção pra você.
            </p>

            <Button 
              size="lg" 
              onClick={scrollToSessions}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 hover:scale-105 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              Ver Encontros do Mês
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 dark:bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
    </div>
  );
};
