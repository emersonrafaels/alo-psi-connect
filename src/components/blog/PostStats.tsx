import { Eye, Clock, Star, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PostStatsProps {
  views: number;
  readTime: number;
  averageRating?: number;
  ratingsCount?: number;
  commentsCount?: number;
}

export const PostStats = ({ 
  views, 
  readTime, 
  averageRating, 
  ratingsCount,
  commentsCount 
}: PostStatsProps) => {
  const stats = [
    {
      icon: Eye,
      label: 'Visualizações',
      value: views.toLocaleString('pt-BR'),
    },
    {
      icon: Clock,
      label: 'Tempo de leitura',
      value: `${readTime} min`,
    },
    ...((averageRating && averageRating > 0 && ratingsCount && ratingsCount > 0) ? [{
      icon: Star,
      label: 'Avaliação',
      value: `${averageRating.toFixed(1)} (${ratingsCount})`,
    }] : []),
    ...(commentsCount ? [{
      icon: MessageSquare,
      label: 'Comentários',
      value: commentsCount.toString(),
    }] : []),
  ];

  return (
    <Card className="p-4 my-6 bg-muted/30">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-semibold">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
