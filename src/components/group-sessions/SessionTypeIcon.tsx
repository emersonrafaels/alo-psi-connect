import { Mic, Wrench, MessageCircle } from 'lucide-react';

interface SessionTypeIconProps {
  type: 'palestra' | 'workshop' | 'roda_conversa';
  className?: string;
}

export const SessionTypeIcon = ({ type, className }: SessionTypeIconProps) => {
  switch (type) {
    case 'palestra':
      return <Mic className={className} />;
    case 'workshop':
      return <Wrench className={className} />;
    case 'roda_conversa':
      return <MessageCircle className={className} />;
  }
};

export const getSessionTypeLabel = (type: 'palestra' | 'workshop' | 'roda_conversa') => {
  switch (type) {
    case 'palestra':
      return 'Palestra';
    case 'workshop':
      return 'Workshop';
    case 'roda_conversa':
      return 'Roda de Conversa';
  }
};

export const getSessionTypeDescription = (type: 'palestra' | 'workshop' | 'roda_conversa') => {
  switch (type) {
    case 'palestra':
      return 'Informação de qualidade, reflexões com profundidade e dicas práticas';
    case 'workshop':
      return 'Desenvolvimento de habilidades e ferramentas práticas para transformar hábitos';
    case 'roda_conversa':
      return 'Reflexões e provocações em um bate-papo moderado por especialistas';
  }
};
