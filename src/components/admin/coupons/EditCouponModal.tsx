import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { useInstitutionCoupons, InstitutionCoupon } from '@/hooks/useInstitutionCoupons';
import { UserMultiSelect } from '../UserMultiSelect';
import { ProfessionalMultiSelect } from '../ProfessionalMultiSelect';
import { FieldWithTooltip } from './FieldWithTooltip';
import { DiscountValueInput } from './DiscountValueInput';
import { toast } from 'sonner';

interface Props {
  coupon: InstitutionCoupon | null;
  institutionId: string;
  tenantId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const EditCouponModal = ({ coupon, institutionId, tenantId, isOpen, onClose, onSave }: Props) => {
  const { updateCoupon, isUpdating } = useInstitutionCoupons(institutionId, tenantId);

  const initialFormState = {
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    max_discount_amount: null as number | null,
    minimum_purchase_amount: 0,
    maximum_uses: null as number | null,
    uses_per_user: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: null as string | null,
    is_active: true,
    target_audience: 'institution_students' as 'all' | 'institution_students' | 'other_patients',
    target_audience_user_ids: null as string[] | null,
    professional_scope: 'institution_professionals' as 'all_tenant' | 'institution_professionals',
    professional_scope_ids: null as number[] | null,
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
        minimum_purchase_amount: coupon.minimum_purchase_amount || 0,
        maximum_uses: coupon.maximum_uses,
        uses_per_user: coupon.uses_per_user || 1,
        valid_from: coupon.valid_from.split('T')[0],
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : null,
        is_active: coupon.is_active,
        target_audience: coupon.target_audience || 'institution_students',
        target_audience_user_ids: coupon.target_audience_user_ids,
        professional_scope: coupon.professional_scope || 'institution_professionals',
        professional_scope_ids: coupon.professional_scope_ids,
      });
    }
  }, [coupon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coupon) return;

    updateCoupon(
      { id: coupon.id, ...formData },
      {
        onSuccess: () => {
          toast.success('Cupom atualizado com sucesso!');
          onSave();
        },
        onError: (error) => {
          console.error('Erro ao atualizar cupom:', error);
          toast.error('Erro ao atualizar cupom');
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          <DialogHeader>
            <DialogTitle>Editar Cupom</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Nome */}
              <FieldWithTooltip 
                label="Nome do Cupom *" 
                tooltip="Nome interno para identificação"
              >
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FieldWithTooltip>

              {/* Código */}
              <FieldWithTooltip 
                label="Código *" 
                tooltip="Código que os pacientes usarão"
              >
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </FieldWithTooltip>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Tipo e Valor do Desconto */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de Desconto *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed_amount') => 
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed_amount">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DiscountValueInput
                discountType={formData.discount_type}
                value={formData.discount_value}
                onChange={(value) => setFormData({ ...formData, discount_value: value })}
              />

              {formData.discount_type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Desconto Máximo (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      id="max_discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.max_discount_amount || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        max_discount_amount: e.target.value ? parseFloat(e.target.value) : null 
                      })}
                      className="pl-10"
                      placeholder="Ex: 100.00"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview do Desconto */}
            {formData.discount_value > 0 && (
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
                Este cupom dará {formData.discount_type === 'percentage' 
                  ? `${formData.discount_value}% de desconto` 
                  : `R$ ${formData.discount_value.toFixed(2)} de desconto`}
                {formData.max_discount_amount && formData.discount_type === 'percentage' && 
                  ` (máximo R$ ${formData.max_discount_amount.toFixed(2)})`}
              </p>
            )}

            {/* Compra Mínima */}
            <div className="space-y-2">
              <Label htmlFor="minimum_purchase">Valor Mínimo de Compra (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  id="minimum_purchase"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_purchase_amount}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    minimum_purchase_amount: parseFloat(e.target.value) || 0 
                  })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Validade */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Válido de *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Válido até</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    valid_until: e.target.value || null 
                  })}
                />
              </div>
            </div>

            {/* Limites de Uso */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maximum_uses">Limite Total de Usos</Label>
                <Input
                  id="maximum_uses"
                  type="number"
                  min="1"
                  value={formData.maximum_uses || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maximum_uses: e.target.value ? parseInt(e.target.value) : null 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uses_per_user">Usos por Usuário</Label>
                <Input
                  id="uses_per_user"
                  type="number"
                  min="1"
                  value={formData.uses_per_user}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    uses_per_user: parseInt(e.target.value) || 1 
                  })}
                />
              </div>
            </div>

            {/* Público-Alvo */}
            <div className="space-y-2">
              <Label>Público-Alvo *</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value: 'all' | 'institution_students' | 'other_patients') => 
                  setFormData({ ...formData, target_audience: value, target_audience_user_ids: null })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  <SelectItem value="institution_students">Apenas alunos da instituição</SelectItem>
                  <SelectItem value="other_patients">Apenas pacientes não-alunos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Escopo Profissional */}
            <div className="space-y-2">
              <Label>Escopo Profissional *</Label>
              <Select
                value={formData.professional_scope}
                onValueChange={(value: 'all_tenant' | 'institution_professionals') => 
                  setFormData({ ...formData, professional_scope: value, professional_scope_ids: null })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_tenant">Todos os profissionais</SelectItem>
                  <SelectItem value="institution_professionals">Profissionais da instituição</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.professional_scope === 'institution_professionals' && (
              <div className="space-y-2">
                <Label>Selecionar Profissionais Específicos (opcional)</Label>
                <ProfessionalMultiSelect
                  institutionId={institutionId}
                  selectedProfessionalIds={formData.professional_scope_ids || []}
                  onChange={(ids) => setFormData({ ...formData, professional_scope_ids: ids })}
                />
              </div>
            )}

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Cupom Ativo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};
