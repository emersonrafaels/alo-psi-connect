import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";
import { getSessionTypeLabel } from "./SessionTypeIcon";

export const PastSessionsSection = () => {
  const { tenant } = useTenant();

  const { data: pastSessions, isLoading } = useQuery({
    queryKey: ['past-sessions', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_sessions')
        .select(`
          *,
          professional:profissionais!group_sessions_professional_id_fkey(display_name, crp_crm, foto_perfil_url),
          institution:educational_institutions!group_sessions_institution_id_fkey(name)
        `)
        .eq('tenant_id', tenant?.id)
        .eq('status', 'completed')
        .order('session_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });

  if (isLoading || !pastSessions || pastSessions.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Encontros Realizados
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja os encontros que já aconteceram
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastSessions.map((session: any) => {
            const isOrganizedByTenant = session.organizer_type === 'tenant';
            const organizerName = isOrganizedByTenant
              ? tenant?.name
              : session.organizer_type === 'institution'
              ? session.institution?.name
              : session.professional?.display_name;

            const organizerPhoto = isOrganizedByTenant
              ? tenant?.logo_url
              : session.organizer_type === 'institution'
              ? null
              : session.professional?.foto_perfil_url;

            return (
              <Card key={session.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-border">
                      <AvatarImage 
                        src={organizerPhoto} 
                        alt={organizerName}
                        className={isOrganizedByTenant ? "object-contain p-2" : ""}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {isOrganizedByTenant ? (
                          <Building2 className="w-6 h-6" />
                        ) : (
                          organizerName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-1">
                        {getSessionTypeLabel(session.session_type)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{organizerName}</p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                    {session.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {session.description}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(session.session_date), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.start_time.slice(0, 5)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {session.current_registrations} participantes
                    </div>
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