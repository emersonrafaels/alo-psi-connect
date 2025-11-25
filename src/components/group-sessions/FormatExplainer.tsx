import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionTypeIcon, getSessionTypeLabel } from './SessionTypeIcon';
import { Check } from 'lucide-react';

interface FormatExplainerProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const formatColors = {
  palestra: {
    gradient: 'from-purple-500/10 via-purple-400/5 to-transparent',
    ring: 'ring-purple-500/50',
    glow: 'shadow-purple-500/20',
    iconBg: 'bg-gradient-to-br from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    hoverBorder: 'hover:border-purple-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-purple-500 to-transparent',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
  },
  workshop: {
    gradient: 'from-orange-500/10 via-orange-400/5 to-transparent',
    ring: 'ring-orange-500/50',
    glow: 'shadow-orange-500/20',
    iconBg: 'bg-gradient-to-br from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/30',
    hoverBorder: 'hover:border-orange-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-orange-500 to-transparent',
    badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20'
  },
  roda_conversa: {
    gradient: 'from-teal-500/10 via-teal-400/5 to-transparent',
    ring: 'ring-teal-500/50',
    glow: 'shadow-teal-500/20',
    iconBg: 'bg-gradient-to-br from-teal-500/20 to-teal-600/10',
    border: 'border-teal-500/30',
    hoverBorder: 'hover:border-teal-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-teal-500 to-transparent',
    badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20'
  }
} as const;

const formatBenefits = {
  palestra: [
    'Reflexões sobre temas importantes',
    'Conteúdo educativo de qualidade',
    'Duração: 45-60 minutos'
  ],
  workshop: [
    'Ferramentas práticas para o dia a dia',
    'Exercícios e atividades interativas',
    'Duração: 60-90 minutos'
  ],
  roda_conversa: [
    'Bate-papo acolhedor e seguro',
    'Compartilhe experiências',
    'Duração: 60-75 minutos'
  ]
} as const;

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
            const colors = formatColors[format];
            
            return (
              <Card 
                key={format} 
                className={`
                  cursor-pointer transition-all duration-300 animate-fade-in relative overflow-hidden
                  border-2 bg-gradient-to-b ${colors.gradient}
                  hover:shadow-2xl hover:scale-[1.02] ${colors.hoverBorder}
                  ${isSelected 
                    ? `scale-[1.02] shadow-xl ring-4 ${colors.ring} ${colors.border}` 
                    : 'border-border/40 hover:border-border'
                  }
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onTypeSelect(format)}
              >
                {/* Decorative top line */}
                <div className={`h-1 w-full ${colors.topLine} opacity-60`} />
                
                <CardContent className="pt-8 pb-6 px-6 relative">
                  {/* Selected checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 animate-scale-in">
                      <div className={`rounded-full p-1.5 ${colors.iconBg} ${colors.glow} shadow-lg`}>
                        <Check className="w-4 h-4 text-foreground" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center text-center space-y-5">
                    {/* Icon with glow effect */}
                    <div className={`
                      w-20 h-20 rounded-full flex items-center justify-center
                      ${colors.iconBg} ${colors.glow} shadow-lg
                      transition-all duration-300
                      ${isSelected ? 'scale-110' : 'hover:scale-110'}
                    `}>
                      <SessionTypeIcon 
                        type={format} 
                        className="w-10 h-10 text-foreground" 
                      />
                    </div>
                    
                    {/* Title and badge */}
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">
                        {getSessionTypeLabel(format)}
                      </h3>
                      <Badge variant="outline" className={`${colors.badge} font-medium`}>
                        {format === 'palestra' && 'Educativo'}
                        {format === 'workshop' && 'Interativo'}
                        {format === 'roda_conversa' && 'Acolhedor'}
                      </Badge>
                    </div>
                    
                    {/* Benefits list */}
                    <ul className="space-y-2 text-sm text-muted-foreground w-full">
                      {formatBenefits[format].map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-left">
                          <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Selection indicator */}
                    <div className={`
                      text-xs font-medium transition-opacity duration-200
                      ${isSelected ? 'text-foreground' : 'text-muted-foreground/60'}
                    `}>
                      {isSelected ? '✓ Selecionado' : 'Clique para selecionar'}
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
