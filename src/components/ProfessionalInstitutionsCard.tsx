import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Briefcase, Calendar, Star } from "lucide-react";
import { ProfessionalInstitutionLink } from "@/hooks/useCurrentProfessionalInstitutions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfessionalInstitutionsCardProps {
  institutions: ProfessionalInstitutionLink[];
  loading: boolean;
}

const getRelationshipLabel = (type: string) => {
  const labels: Record<string, string> = {
    'employee': 'Funcionário',
    'consultant': 'Consultor',
    'supervisor': 'Supervisor',
    'intern': 'Estagiário',
  };
  return labels[type] || type;
};

const getRelationshipBadgeVariant = (type: string) => {
  switch (type) {
    case 'employee':
      return 'bg-blue-600';
    case 'consultant':
      return 'bg-purple-600';
    case 'supervisor':
      return 'bg-amber-600';
    case 'intern':
      return 'bg-teal-600';
    default:
      return 'bg-gray-600';
  }
};

const getInstitutionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'university_public': 'Universidade Pública',
    'university_private': 'Universidade Privada',
    'college': 'Faculdade',
    'school': 'Escola',
    'clinic': 'Clínica',
    'hospital': 'Hospital',
    'private': 'Privada',
    'public': 'Pública',
    'other': 'Outro',
  };
  return labels[type] || type;
};

export function ProfessionalInstitutionsCard({ institutions, loading }: ProfessionalInstitutionsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Vínculos Institucionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Vínculos Institucionais
        </CardTitle>
      </CardHeader>
      <CardContent>
        {institutions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Você não está vinculado a nenhuma instituição</p>
            <p className="text-sm mt-1">Solicite um vínculo usando o formulário abaixo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {institutions.map((institution) => (
              <div
                key={institution.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-5 w-5 mt-0.5 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-base leading-tight">
                          {institution.institution_name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getInstitutionTypeLabel(institution.institution_type)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge 
                        variant="default" 
                        className={getRelationshipBadgeVariant(institution.relationship_type)}
                      >
                        {getRelationshipLabel(institution.relationship_type)}
                      </Badge>
                      
                      {!institution.is_active && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                      
                      {institution.has_partnership && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                          <Star className="h-3 w-3 mr-1" />
                          Parceria Ativa
                        </Badge>
                      )}
                    </div>

                    {institution.start_date && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Desde:{" "}
                          {format(new Date(institution.start_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                          {institution.end_date && (
                            <> até {format(new Date(institution.end_date), "dd/MM/yyyy", { locale: ptBR })}</>
                          )}
                        </span>
                      </div>
                    )}

                    {institution.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {institution.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
