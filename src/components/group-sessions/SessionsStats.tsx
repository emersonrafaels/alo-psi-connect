import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export const SessionsStats = () => {
  const { data: stats } = useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const [sessionsResult, registrationsResult, testimonialsResult] = await Promise.all([
        supabase
          .from('group_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase
          .from('group_session_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'confirmed'),
        supabase
          .from('session_testimonials')
          .select('rating')
          .eq('is_approved', true),
      ]);

      const avgRating = testimonialsResult.data?.length
        ? testimonialsResult.data.reduce((acc, t) => acc + (t.rating || 0), 0) / testimonialsResult.data.length
        : 0;

      return {
        totalSessions: sessionsResult.count || 0,
        totalParticipants: registrationsResult.count || 0,
        averageRating: avgRating,
        satisfactionRate: avgRating > 0 ? (avgRating / 5) * 100 : 0,
      };
    },
  });

  const [counts, setCounts] = useState({
    sessions: 0,
    participants: 0,
    rating: 0,
    satisfaction: 0,
  });

  useEffect(() => {
    if (!stats) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCounts({
        sessions: Math.floor(stats.totalSessions * progress),
        participants: Math.floor(stats.totalParticipants * progress),
        rating: parseFloat((stats.averageRating * progress).toFixed(1)),
        satisfaction: Math.floor(stats.satisfactionRate * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts({
          sessions: stats.totalSessions,
          participants: stats.totalParticipants,
          rating: parseFloat(stats.averageRating.toFixed(1)),
          satisfaction: Math.floor(stats.satisfactionRate),
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  if (!stats) return null;

  const statsData = [
    {
      icon: Calendar,
      value: counts.sessions,
      label: "Encontros Realizados",
      suffix: "+",
    },
    {
      icon: Users,
      value: counts.participants,
      label: "Pessoas Atendidas",
      suffix: "+",
    },
    {
      icon: Star,
      value: counts.rating,
      label: "Avaliação Média",
      suffix: "/5",
      decimals: true,
    },
    {
      icon: TrendingUp,
      value: counts.satisfaction,
      label: "Taxa de Satisfação",
      suffix: "%",
    },
  ];

  return (
    <section className="py-16 px-4 bg-primary/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Nosso Impacto
          </h2>
          <p className="text-lg text-muted-foreground">
            Construindo uma comunidade de apoio emocional
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <Icon className="w-10 h-10 text-primary mx-auto" />
                  <div>
                    <p className="text-4xl font-bold text-foreground">
                      {stat.decimals ? stat.value : stat.value}
                      <span className="text-2xl text-primary">{stat.suffix}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};