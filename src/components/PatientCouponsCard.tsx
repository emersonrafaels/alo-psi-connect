import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientInstitutionCoupons } from '@/hooks/usePatientInstitutionCoupons';
import { Tag, Calendar, DollarSign, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientCouponsCardProps {
  loading?: boolean;
}

const getDiscountText = (coupon: any) => {
  if (coupon.discount_type === 'percentage') {
    const percentage = `${coupon.discount_value}%`;
    if (coupon.max_discount_amount) {
      return `${percentage} (até R$ ${coupon.max_discount_amount.toFixed(2)})`;
    }
    return percentage;
  }
  return `R$ ${coupon.discount_value.toFixed(2)} de desconto`;
};

const getAudienceBadge = (targetAudience: string, institutionName: string) => {
  const labels: Record<string, string> = {
    'all': 'Todos os Pacientes',
    'institution_students': `Alunos da ${institutionName}`,
    'other_patients': 'Pacientes Externos',
    'specific_users': 'Pacientes Selecionados',
  };
  return labels[targetAudience] || targetAudience;
};

export function PatientCouponsCard({ loading: externalLoading }: PatientCouponsCardProps) {
  const { coupons, isLoading } = usePatientInstitutionCoupons();
  
  const loading = externalLoading || isLoading;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Cupons Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (coupons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Cupons Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum cupom disponível no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Cupons Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div>
                  <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    {coupon.institution_name}
                  </Badge>
                </div>
                
                <h4 className="font-semibold text-lg">{coupon.name}</h4>
                {coupon.description && (
                  <p className="text-sm text-muted-foreground">{coupon.description}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Ativo
                </Badge>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Desconto:</span>
                <span className="text-foreground font-semibold">{getDiscountText(coupon)}</span>
              </div>

              {coupon.valid_until && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Válido até:</span>
                  <span className="text-foreground">
                    {format(new Date(coupon.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span className="font-medium">Código:</span>
                <code className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">
                  {coupon.code}
                </code>
              </div>
            </div>

            <div>
              <Badge variant="outline" className="text-xs">
                {getAudienceBadge(coupon.target_audience || 'all', coupon.institution_name)}
              </Badge>
            </div>
          </div>
        ))}

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-blue-800 dark:text-blue-200">
            Estes cupons serão aplicados automaticamente durante o agendamento de consultas com profissionais elegíveis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
