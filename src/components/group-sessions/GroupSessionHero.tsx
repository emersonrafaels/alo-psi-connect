import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Moon, Flame } from 'lucide-react';

export const GroupSessionHero = () => {
  const scrollToSessions = () => {
    document.getElementById('sessions-calendar')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="relative overflow-hidden bg-wellz-purple py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Ilustração Decorativa - Esquerda */}
          <div className="hidden md:flex justify-center items-center relative">
            <div className="relative">
              <div className="absolute top-0 left-0 w-32 h-32 opacity-20">
                <Flame className="w-full h-full text-wellz-coral" />
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 opacity-20">
                <Moon className="w-full h-full text-yellow-300" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                <Heart className="w-full h-full text-wellz-coral opacity-30" />
              </div>
              {/* Estrelas decorativas */}
              <Sparkles className="absolute top-10 right-10 w-8 h-8 text-yellow-300 opacity-60" />
              <Sparkles className="absolute bottom-20 left-10 w-6 h-6 text-wellz-coral opacity-60" />
              <Sparkles className="absolute top-32 left-20 w-5 h-5 text-pink-300 opacity-60" />
            </div>
          </div>
          
          {/* Conteúdo - Direita */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
              Você não está só!
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
              Participe dos nossos encontros em grupo online e gratuitos. 
              Escolha a melhor opção pra você.
            </p>

            <Button 
              size="lg" 
              onClick={scrollToSessions}
              className="bg-wellz-coral hover:bg-wellz-coral/90 text-white shadow-lg hover:shadow-xl transition-all font-semibold px-8"
            >
              Ver Encontros do Mês
            </Button>
          </div>
        </div>
      </div>

      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-wellz-coral/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10" />
    </div>
  );
};
