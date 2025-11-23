import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, GraduationCap, Calendar, Star } from "lucide-react";
import { PatientInstitution } from "@/hooks/usePatientInstitutions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientInstitutionsCardProps {
  institutions: PatientInstitution[];
  loading: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'enrolled':
      return <Badge variant="default" className="bg-green-600">Vinculado</Badge>;
    case 'graduated':
      return <Badge variant="default" className="bg-blue-600">Formado</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inativo</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
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

export function PatientInstitutionsCard({ institutions, loading }: PatientInstitutionsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
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
          <GraduationCap className="h-5 w-5" />
          Vínculos Institucionais
        </CardTitle>
      </CardHeader>
      <CardContent>
        {institutions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Você não está vinculado a nenhuma instituição educacional</p>
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
                      {getStatusBadge(institution.enrollment_status)}
                      
                      {institution.has_partnership && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                          <Star className="h-3 w-3 mr-1" />
                          Parceria Ativa
                        </Badge>
                      )}
                    </div>

                    {institution.enrollment_date && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Vinculado em:{" "}
                          {format(new Date(institution.enrollment_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
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
