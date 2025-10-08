import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlogRating } from '@/hooks/useBlogRating';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PostRatingProps {
  postId: string;
  allowRatings: boolean;
  averageRating: number;
  ratingsCount: number;
}

export const PostRating = ({ 
  postId, 
  allowRatings, 
  averageRating, 
  ratingsCount 
}: PostRatingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userRating, ratePost } = useBlogRating(postId);
  const [hoverRating, setHoverRating] = useState(0);

  if (!allowRatings) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="w-4 h-4" />
        <span>Avaliações desabilitadas</span>
      </div>
    );
  }

  const handleRate = async (rating: number) => {
    try {
      await ratePost.mutateAsync(rating);
      toast({
        title: 'Avaliação registrada',
        description: `Você avaliou este post com ${rating} estrela${rating > 1 ? 's' : ''}!`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao avaliar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const displayRating = hoverRating || userRating || 0;

  return (
    <div className="flex flex-col gap-2 py-4 border-y border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={ratePost.isPending}
              className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star
                className={cn(
                  'w-6 h-6 transition-colors',
                  star <= displayRating
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({ratingsCount} {ratingsCount === 1 ? 'avaliação' : 'avaliações'})
          </span>
        </div>
      </div>

      {userRating && (
        <p className="text-xs text-muted-foreground">
          Você avaliou: {userRating} estrela{userRating > 1 ? 's' : ''}
        </p>
      )}
      
      {!userRating && !user && (
        <p className="text-xs text-muted-foreground">
          Clique nas estrelas para avaliar
        </p>
      )}
    </div>
  );
};
