import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const SessionsTestimonials = () => {
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['session-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_testimonials')
        .select('*')
        .eq('is_approved', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading || !testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            O Que Dizem os Participantes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experiências reais de pessoas que participaram dos nossos encontros
          </p>
        </div>

        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <Quote className="w-8 h-8 text-primary/40" />
                    
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{testimonial.testimonial_text}"
                    </p>

                    {testimonial.rating && (
                      <div className="flex gap-1">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={testimonial.user_avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {testimonial.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">
                          {testimonial.user_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.session_title}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};