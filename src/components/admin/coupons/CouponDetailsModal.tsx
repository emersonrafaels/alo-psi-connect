import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { InstitutionCoupon } from '@/hooks/useInstitutionCoupons';
import { Copy, Ticket, Calendar, Users, UserCheck, TrendingUp, Shield, Clock, Target, Award } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  coupon: InstitutionCoupon | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CouponDetailsModal = ({ coupon, isOpen, onClose }: Props) => {
  if (!coupon) return null;

  const getStatusVariant = () => {
    if (!coupon.is_active) return 'secondary';
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) return 'destructive';
    if (coupon.maximum_uses && coupon.current_usage_count >= coupon.maximum_uses) return 'outline';
    return 'default';
  };

  const getStatusLabel = () => {
    if (!coupon.is_active) return 'Inativo';
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) return 'Expirado';
    if (coupon.maximum_uses && coupon.current_usage_count >= coupon.maximum_uses) return 'Esgotado';
    return 'Ativo';
  };

  const getUsagePercentage = () => {
    if (!coupon.maximum_uses) return 0;
    return (coupon.current_usage_count / coupon.maximum_uses) * 100;
  };

  const getAudienceLabel = () => {
    const labels = {
      all: 'Todos os pacientes',
      institution_students: 'Alunos da instituição',
      other_patients: 'Pacientes não-alunos'
    };
    return labels[coupon.target_audience as keyof typeof labels] || coupon.target_audience;
  };

  const getScopeLabel = () => {
    const labels = {
      all_tenant: 'Todos os profissionais do tenant',
      institution_professionals: 'Profissionais da instituição'
    };
    return labels[coupon.professional_scope as keyof typeof labels] || coupon.professional_scope;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="h-6 w-6 text-primary" />
              <DialogTitle className="text-2xl">{coupon.name}</DialogTitle>
            </div>
            <Badge variant={getStatusVariant()}>
              {getStatusLabel()}
            </Badge>
          </div>
          {coupon.description && (
            <DialogDescription className="text-base mt-2">
              {coupon.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Código do Cupom */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Código do Cupom</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(coupon.code)}
                  className="h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-2xl font-bold text-primary">{coupon.code}</code>
            </div>

            {/* Desconto */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Desconto</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">
                    {coupon.discount_type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-bold text-primary text-lg">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%`
                      : `R$ ${coupon.discount_value.toFixed(2)}`}
                  </span>
                </div>
                {coupon.max_discount_amount && (
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Desconto Máximo</span>
                    <span className="font-medium">R$ {coupon.max_discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {coupon.minimum_purchase_amount && coupon.minimum_purchase_amount > 0 && (
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Compra Mínima</span>
                    <span className="font-medium">R$ {coupon.minimum_purchase_amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Validade */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Validade</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Válido de</span>
                  <span className="font-medium">{format(new Date(coupon.valid_from), 'dd/MM/yyyy')}</span>
                </div>
                {coupon.valid_until && (
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Válido até</span>
                    <span className="font-medium">{format(new Date(coupon.valid_until), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Uso */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Uso do Cupom</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Uso Atual</span>
                  <span className="font-bold">
                    {coupon.current_usage_count} {coupon.maximum_uses ? `/ ${coupon.maximum_uses}` : ''}
                  </span>
                </div>
                {coupon.maximum_uses && (
                  <Progress value={getUsagePercentage()} className="h-2" />
                )}
                {coupon.uses_per_user && (
                  <div className="flex justify-between p-3 bg-muted rounded-lg text-sm">
                    <span className="text-muted-foreground">Usos por Usuário</span>
                    <span className="font-medium">{coupon.uses_per_user}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Público-Alvo */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Público-Alvo</h4>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{getAudienceLabel()}</span>
                </div>
                {coupon.target_audience_user_ids && coupon.target_audience_user_ids.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {coupon.target_audience_user_ids.length} usuário(s) específico(s)
                  </div>
                )}
              </div>
            </div>

            {/* Escopo Profissional */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Escopo Profissional</h4>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{getScopeLabel()}</span>
                </div>
                {coupon.professional_scope_ids && coupon.professional_scope_ids.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {coupon.professional_scope_ids.length} profissional(is) específico(s)
                  </div>
                )}
              </div>
            </div>

            {/* Metadados */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Informações</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Criado em</span>
                  <span>{format(new Date(coupon.created_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Atualizado em</span>
                  <span>{format(new Date(coupon.updated_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
