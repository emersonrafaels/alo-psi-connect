import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Ticket, Calendar, Users, TrendingUp, Copy } from 'lucide-react';
import { useInstitutionCoupons, InstitutionCoupon } from '@/hooks/useInstitutionCoupons';
import { useTenant } from '@/hooks/useTenant';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManageInstitutionCouponsModal = ({ institution, isOpen, onClose }: Props) => {
  const { tenant } = useTenant();
  const { 
    coupons, 
    isLoading, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon,
    isCreating,
    isUpdating 
  } = useInstitutionCoupons(institution?.id);

  const [editingCoupon, setEditingCoupon] = useState<InstitutionCoupon | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const initialFormState = {
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    max_discount_amount: null as number | null,
    applies_to: 'all' as 'all' | 'specific_professionals' | 'specific_specialties' | 'first_appointment',
    applicable_professional_ids: null as number[] | null,
    applicable_specialties: null as string[] | null,
    minimum_purchase_amount: 0,
    maximum_uses: null as number | null,
    uses_per_user: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: null as string | null,
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleEdit = (coupon: InstitutionCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount_amount: coupon.max_discount_amount,
      applies_to: coupon.applies_to,
      applicable_professional_ids: coupon.applicable_professional_ids,
      applicable_specialties: coupon.applicable_specialties,
      minimum_purchase_amount: coupon.minimum_purchase_amount,
      maximum_uses: coupon.maximum_uses,
      uses_per_user: coupon.uses_per_user,
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : null,
      is_active: coupon.is_active,
    });
    setIsCreatingNew(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData = {
      ...formData,
      institution_id: institution!.id,
      tenant_id: tenant?.id || null,
    };

    if (editingCoupon) {
      updateCoupon({ id: editingCoupon.id, ...couponData });
    } else {
      createCoupon(couponData);
    }

    setIsCreatingNew(false);
    setEditingCoupon(null);
    setFormData(initialFormState);
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Cupons e Promoções - {institution?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botão Criar Novo */}
          {!isCreatingNew && (
            <Button onClick={() => setIsCreatingNew(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Criar Novo Cupom
            </Button>
          )}

          {/* Formulário de Criação/Edição */}
          {isCreatingNew && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código do Cupom *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="EX: PROMO2024"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Gerar
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Nome da Promoção *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Desconto de Boas-Vindas"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição interna do cupom..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
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

                <div>
                  <Label>Valor do Desconto *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50.00'}
                    required
                  />
                </div>

                {formData.discount_type === 'percentage' && (
                  <div>
                    <Label>Desconto Máximo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_discount_amount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount_amount: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      placeholder="Ex: 100.00"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aplica-se a</Label>
                  <Select
                    value={formData.applies_to}
                    onValueChange={(value: any) => setFormData({ ...formData, applies_to: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os profissionais</SelectItem>
                      <SelectItem value="specific_professionals">Profissionais específicos</SelectItem>
                      <SelectItem value="specific_specialties">Especialidades específicas</SelectItem>
                      <SelectItem value="first_appointment">Primeira consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Valor Mínimo da Compra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.minimum_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_purchase_amount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Limite Total de Usos</Label>
                  <Input
                    type="number"
                    value={formData.maximum_uses || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, maximum_uses: e.target.value ? parseInt(e.target.value) : null })
                    }
                    placeholder="Ilimitado"
                  />
                </div>

                <div>
                  <Label>Usos por Usuário</Label>
                  <Input
                    type="number"
                    value={formData.uses_per_user}
                    onChange={(e) => setFormData({ ...formData, uses_per_user: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Válido A Partir De *</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Válido Até</Label>
                  <Input
                    type="date"
                    value={formData.valid_until || ''}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || null })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Cupom Ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingCoupon(null);
                    setFormData(initialFormState);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Lista de Cupons */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Cupons Cadastrados ({coupons.length})</h3>
            
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : coupons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum cupom cadastrado ainda
              </p>
            ) : (
              <div className="grid gap-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <code className="px-3 py-1 bg-primary/10 rounded font-mono font-bold text-primary">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyCode(coupon.code)}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {coupon.is_active ? (
                            <Badge variant="default">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mt-2">{coupon.name}</h4>
                        {coupon.description && (
                          <p className="text-sm text-muted-foreground">{coupon.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Remover este cupom?')) {
                              deleteCoupon(coupon.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}%`
                            : `R$ ${coupon.discount_value.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {coupon.current_usage_count} / {coupon.maximum_uses || '∞'} usos
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Até {coupon.valid_until ? format(new Date(coupon.valid_until), 'dd/MM/yyyy') : 'Indeterminado'}</span>
                      </div>

                      <div className="text-muted-foreground">
                        {coupon.minimum_purchase_amount > 0 && `Mín. R$ ${coupon.minimum_purchase_amount.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
