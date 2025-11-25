import { Card, CardContent } from '@/components/ui/card';
import { SessionTypeIcon, getSessionTypeLabel, getSessionTypeDescription } from './SessionTypeIcon';

export const FormatExplainer = () => {
  const formats = [
    { type: 'palestra' as const },
    { type: 'workshop' as const },
    { type: 'roda_conversa' as const },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
        Por onde você quer começar?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formats.map((format) => (
          <Card key={format.type} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
                <SessionTypeIcon type={format.type} className="h-8 w-8 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                {getSessionTypeLabel(format.type)}
              </h3>
              
              <p className="text-muted-foreground text-sm">
                {getSessionTypeDescription(format.type)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
