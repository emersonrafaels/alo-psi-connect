import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionTypeIcon, getSessionTypeLabel, getSessionTypeDescription } from './SessionTypeIcon';

interface FormatExplainerProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

export const FormatExplainer = ({ selectedType, onTypeSelect }: FormatExplainerProps) => {
  const formats = ['palestra', 'workshop', 'roda_conversa'] as const;

  return (
    <div className="bg-gradient-to-b from-accent/5 via-background to-background py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2 animate-fade-in">
            Escolha o formato ideal pra você
          </h2>
          <p className="text-muted-foreground text-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Cada formato tem suas particularidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {formats.map((format, index) => {
            const isSelected = selectedType === format;
            return (
              <Card 
                key={format} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in border-2 ${
                  isSelected ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onTypeSelect(format)}
              >
                <CardContent className="pt-6 relative">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-accent/30">
                      <SessionTypeIcon type={format} className="w-8 h-8 text-accent" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {getSessionTypeLabel(format)}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        {format === 'palestra' && (
                          <>
                            Escute <strong>reflexões</strong> sobre temas importantes para sua saúde mental
                          </>
                        )}
                        {format === 'workshop' && (
                          <>
                            Aprenda <strong>dicas práticas</strong> e ferramentas para usar no dia a dia
                          </>
                        )}
                        {format === 'roda_conversa' && (
                          <>
                            <strong>Bate-papo acolhedor</strong> sobre hábitos e rotinas que transformam
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
