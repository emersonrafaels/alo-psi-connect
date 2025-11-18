import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InstitutionCoupon } from '@/hooks/useInstitutionCoupons';
import { Ticket, Copy, Users, Calendar, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CouponDetailsModal } from './CouponDetailsModal';
import { EditCouponModal } from './EditCouponModal';

interface Props {
  coupons: InstitutionCoupon[];
  canManageCoupons: boolean;
  institutionId: string;
  tenantId?: string;
}

const getStatusVariant = (coupon: InstitutionCoupon): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!coupon.is_active) return 'secondary';
  const now = new Date();
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
  if (validUntil && validUntil < now) return 'destructive';
  if (coupon.maximum_uses && coupon.current_usage_count >= coupon.maximum_uses) return 'outline';
  return 'default';
};

const getStatusLabel = (coupon: InstitutionCoupon): string => {
  if (!coupon.is_active) return 'Inativo';
  const now = new Date();
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
  if (validUntil && validUntil < now) return 'Expirado';
  if (coupon.maximum_uses && coupon.current_usage_count >= coupon.maximum_uses) return 'Esgotado';
  return 'Ativo';
};

const getUsagePercentage = (coupon: InstitutionCoupon): number => {
  if (!coupon.maximum_uses) return 0;
  return (coupon.current_usage_count / coupon.maximum_uses) * 100;
};

const getAudienceLabel = (audience: string): string => {
  const labels: Record<string, string> = {
    all: 'Todos os pacientes',
    institution_students: 'Alunos da instituição',
    other_patients: 'Pacientes não-alunos'
  };
  return labels[audience] || audience;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Código copiado!');
};

export const CouponsCardView = ({ coupons, canManageCoupons, institutionId, tenantId }: Props) => {
  const [selectedCouponForDetails, setSelectedCouponForDetails] = useState<InstitutionCoupon | null>(null);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState<InstitutionCoupon | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {coupons.map(coupon => (
        <Card key={coupon.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
          {/* Badge de status */}
          <div className="absolute top-4 right-4 z-10">
            <Badge variant={getStatusVariant(coupon)}>
              {getStatusLabel(coupon)}
            </Badge>
          </div>

          <CardHeader className="pb-4">
            {/* Código em destaque */}
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="h-5 w-5 text-primary" />
              <code className="text-lg font-bold bg-muted px-3 py-1 rounded">
                {coupon.code}
              </code>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={() => copyToClipboard(coupon.code)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-base">{coupon.name}</CardTitle>
            {coupon.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {coupon.description}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Valor do desconto */}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">Desconto</span>
              <span className="text-2xl font-bold text-primary">
                {coupon.discount_type === 'percentage' 
                  ? `${coupon.discount_value}%`
                  : `R$ ${coupon.discount_value}`}
              </span>
            </div>

            {/* Barra de progresso de uso */}
            {coupon.maximum_uses && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Uso</span>
                  <span className="font-medium">
                    {coupon.current_usage_count} / {coupon.maximum_uses}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(coupon)} 
                  className="h-2"
                />
              </div>
            )}

            {/* Informações adicionais */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{getAudienceLabel(coupon.target_audience)}</span>
              </div>
              {coupon.valid_until && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Válido até {format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <CouponDetailsModal
        coupon={selectedCouponForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCouponForDetails(null);
        }}
      />

      {canManageCoupons && (
        <EditCouponModal
          coupon={selectedCouponForEdit}
          institutionId={institutionId}
          tenantId={tenantId}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCouponForEdit(null);
          }}
          onSave={() => {
            setIsEditModalOpen(false);
            setSelectedCouponForEdit(null);
          }}
        />
      )}
    </div>
  );
};
