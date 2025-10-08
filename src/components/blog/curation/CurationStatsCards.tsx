import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Award, FileText, FilePlus, Eye } from 'lucide-react';
import { useCurationStats } from '@/hooks/useCurationPosts';
import { Skeleton } from '@/components/ui/skeleton';

export const CurationStatsCards = () => {
  const { data: stats, isLoading } = useCurationStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Posts em Destaque',
      value: stats?.totalFeatured || 0,
      icon: Star,
      description: 'Posts marcados como destaque'
    },
    {
      title: 'Com Badges',
      value: stats?.totalWithBadges || 0,
      icon: Award,
      description: 'Posts com badge editorial'
    },
    {
      title: 'Publicados',
      value: stats?.totalPublished || 0,
      icon: FileText,
      description: 'Posts publicados ativos'
    },
    {
      title: 'Rascunhos',
      value: stats?.totalDrafts || 0,
      icon: FilePlus,
      description: 'Posts em rascunho'
    },
    {
      title: 'Média de Visualizações',
      value: stats?.avgViewsFeatured || 0,
      icon: Eye,
      description: 'Média de views dos destaques'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
