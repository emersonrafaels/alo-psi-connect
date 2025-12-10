import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon, Sunset } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WelcomeCardProps {
  institutionName?: string;
}

export const WelcomeCard = ({ institutionName }: WelcomeCardProps) => {
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ['profile-welcome', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Bom dia', icon: Sun, color: 'text-yellow-500' };
    if (hour < 18) return { text: 'Boa tarde', icon: Sunset, color: 'text-orange-500' };
    return { text: 'Boa noite', icon: Moon, color: 'text-indigo-500' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const userName = profile?.nome?.split(' ')[0] || user?.email?.split('@')[0] || 'Administrador';

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="py-4 px-6">
        <div className="flex items-center gap-3">
          <GreetingIcon className={`h-6 w-6 ${greeting.color}`} />
          <div>
            <p className="text-lg font-medium">
              {greeting.text}, <span className="font-semibold">{userName}</span>!
            </p>
            {institutionName && (
              <p className="text-sm text-muted-foreground">
                Gerenciando: {institutionName}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
