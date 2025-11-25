import { Card, CardContent } from '@/components/ui/card';
import { SessionTypeIcon, getSessionTypeLabel, getSessionTypeDescription } from './SessionTypeIcon';

export const FormatExplainer = () => {
  const formats = [
    { type: 'palestra' as const },
    { type: 'workshop' as const },
    { type: 'roda_conversa' as const },
  ];

  return (
    <div className="bg-wellz-pink-light py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-wellz-text-title">
          Por onde você quer começar?
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Escolha o formato que mais combina com você
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {formats.map((format) => (
            <Card key={format.type} className="hover:shadow-lg transition-shadow border-0 bg-white">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-wellz-coral/20 rounded-full mb-4">
                  <SessionTypeIcon type={format.type} className="h-10 w-10 text-wellz-coral" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-wellz-text-title">
                  {getSessionTypeLabel(format.type)}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {format.type === 'palestra' && (
                    <>
                      Escute <strong>reflexões</strong> sobre temas importantes para sua saúde mental
                    </>
                  )}
                  {format.type === 'workshop' && (
                    <>
                      Aprenda <strong>dicas práticas</strong> e ferramentas para usar no dia a dia
                    </>
                  )}
                  {format.type === 'roda_conversa' && (
                    <>
                      <strong>Bate-papo acolhedor</strong> sobre hábitos e rotinas que transformam
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
