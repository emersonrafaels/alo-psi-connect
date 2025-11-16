import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Edit, Ticket, Calendar, Users, TrendingUp, Copy, HelpCircle, Sparkles, Gift, GraduationCap, Tag, Star, UserPlus, MapPin } from 'lucide-react';
import { useInstitutionCoupons, InstitutionCoupon } from '@/hooks/useInstitutionCoupons';
import { useTenant } from '@/hooks/useTenant';
import { useInstitutionAudit } from '@/hooks/useInstitutionAudit';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { UserMultiSelect } from './UserMultiSelect';
import { ProfessionalMultiSelect } from './ProfessionalMultiSelect';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManageInstitutionCouponsModal = ({ institution, isOpen, onClose }: Props) => {
  const { tenant } = useTenant();
  const { logAction } = useInstitutionAudit(institution?.id);
  const { 
    coupons, 
    isLoading, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon,
    isCreating,
    isUpdating 
  } = useInstitutionCoupons(institution?.id);

  // Early return if no institution selected
  if (!institution) return null;

  const [editingCoupon, setEditingCoupon] = useState<InstitutionCoupon | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

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

  const handleEdit = (coupon: InstitutionCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount_amount: coupon.max_discount_amount,
      minimum_purchase_amount: coupon.minimum_purchase_amount,
      maximum_uses: coupon.maximum_uses,
      uses_per_user: coupon.uses_per_user,
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : null,
      is_active: coupon.is_active,
      target_audience: coupon.target_audience,
      target_audience_user_ids: coupon.target_audience_user_ids,
      professional_scope: coupon.professional_scope,
      professional_scope_ids: coupon.professional_scope_ids,
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
      logAction({
        action_type: 'update_coupon',
        entity_type: 'coupon',
        entity_id: editingCoupon.id,
        changes_summary: [{ field: 'coupon', old_value: editingCoupon.code, new_value: couponData.code }]
      });
    } else {
      createCoupon(couponData);
      logAction({
        action_type: 'create_coupon',
        entity_type: 'coupon',
        metadata: { code: couponData.code }
      });
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

  const applyTemplate = (template: string) => {
    const templates = {
      welcome: {
        code: 'BOASVINDAS' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        name: 'Desconto de Boas-Vindas',
        description: 'Cupom de 15% para a primeira consulta de novos pacientes',
        discount_type: 'percentage' as const,
        discount_value: 15,
        max_discount_amount: null,
        minimum_purchase_amount: 0,
        maximum_uses: null,
        uses_per_user: 1,
        target_audience: 'other_patients' as const,
        target_audience_user_ids: null,
        professional_scope: 'all_tenant' as const,
        professional_scope_ids: null,
      },
      student: {
        code: 'ESTUDANTE' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        name: 'Desconto Estudante',
        description: 'R$ 50 de desconto fixo para estudantes vinculados',
        discount_type: 'fixed_amount' as const,
        discount_value: 50,
        max_discount_amount: null,
        minimum_purchase_amount: 100,
        maximum_uses: null,
        uses_per_user: 5,
        target_audience: 'institution_students' as const,
        target_audience_user_ids: null,
        professional_scope: 'all_tenant' as const,
        professional_scope_ids: null,
      },
      blackfriday: {
        code: 'BLACKFRIDAY' + new Date().getFullYear(),
        name: 'Black Friday 2024',
        description: '30% de desconto em todas as consultas (máximo R$ 150)',
        discount_type: 'percentage' as const,
        discount_value: 30,
        max_discount_amount: 150,
        minimum_purchase_amount: 0,
        maximum_uses: 100,
        uses_per_user: 1,
        target_audience: 'all' as const,
        target_audience_user_ids: null,
        professional_scope: 'all_tenant' as const,
        professional_scope_ids: null,
      },
      referral: {
        code: 'INDIQUE' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        name: 'Indicação Amigo',
        description: '10% para quem indicar e para quem foi indicado',
        discount_type: 'percentage' as const,
        discount_value: 10,
        max_discount_amount: null,
        minimum_purchase_amount: 0,
        maximum_uses: null,
        uses_per_user: 3,
        target_audience: 'all' as const,
        target_audience_user_ids: null,
        professional_scope: 'all_tenant' as const,
        professional_scope_ids: null,
      },
      specialty: {
        code: 'PSICO' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        name: 'Desconto Psicologia',
        description: '20% de desconto para consultas de psicologia',
        discount_type: 'percentage' as const,
        discount_value: 20,
        max_discount_amount: 100,
        minimum_purchase_amount: 0,
        maximum_uses: null,
        uses_per_user: 10,
        target_audience: 'all' as const,
        target_audience_user_ids: null,
        professional_scope: 'institution_professionals' as const,
        professional_scope_ids: null,
      },
    };

    const selectedTemplate = templates[template as keyof typeof templates];
    setFormData({
      ...formData,
      ...selectedTemplate,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: null,
      is_active: true,
    });
    toast.success('Template aplicado! Ajuste os campos conforme necessário.');
  };

  const FieldWithTooltip = ({ label, tooltip, children }: { label: string; tooltip: string; children: React.ReactNode }) => (
    <div>
      <Label className="flex items-center gap-2">
        {label}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger type="button" className="cursor-help">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      {children}
    </div>
  );

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
              {/* Botão Templates */}
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-semibold">Configurar Cupom</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Usar Template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem onClick={() => applyTemplate('welcome')}>
                      <Gift className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Boas-Vindas</span>
                        <span className="text-xs text-muted-foreground">15% para primeira consulta</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyTemplate('student')}>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Desconto Estudante</span>
                        <span className="text-xs text-muted-foreground">R$ 50 fixo para estudantes</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyTemplate('blackfriday')}>
                      <Tag className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Black Friday</span>
                        <span className="text-xs text-muted-foreground">30% off (máx R$ 150)</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyTemplate('referral')}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Indicação</span>
                        <span className="text-xs text-muted-foreground">10% para indicações</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => applyTemplate('specialty')}>
                      <Star className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Especialidade Específica</span>
                        <span className="text-xs text-muted-foreground">20% para psicologia</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip
                  label="Código do Cupom *"
                  tooltip="Código único que o paciente digitará no momento do agendamento. Use letras maiúsculas e números (ex: PROMO2024, ESTUDANTE50)."
                >
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
                </FieldWithTooltip>

                <FieldWithTooltip
                  label="Nome da Promoção *"
                  tooltip="Nome descritivo para identificar internamente este cupom (ex: 'Desconto de Boas-Vindas', 'Black Friday 2024')."
                >
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Desconto de Boas-Vindas"
                    required
                  />
                </FieldWithTooltip>
              </div>

              <FieldWithTooltip
                label="Descrição"
                tooltip="Descrição detalhada da promoção para uso interno. Explique o objetivo e regras do cupom."
              >
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição interna do cupom..."
                  rows={2}
                />
              </FieldWithTooltip>

              <div className="grid grid-cols-3 gap-4">
                <FieldWithTooltip
                  label="Tipo de Desconto *"
                  tooltip="Escolha se o desconto será um percentual sobre o valor (ex: 15%) ou um valor fixo em reais (ex: R$ 50)."
                >
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
                </FieldWithTooltip>

                <FieldWithTooltip
                  label="Valor do Desconto *"
                  tooltip="Digite o valor do desconto. Para percentual, use números de 1 a 100. Para valor fixo, use valores em reais."
                >
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50.00'}
                    required
                  />
                </FieldWithTooltip>

                {formData.discount_type === 'percentage' && (
                  <FieldWithTooltip
                    label="Desconto Máximo (R$)"
                    tooltip="Limite máximo em reais para o desconto percentual. Exemplo: 30% com máximo de R$ 150 garante que o desconto nunca ultrapasse R$ 150."
                  >
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_discount_amount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount_amount: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      placeholder="Ex: 100.00"
                    />
                  </FieldWithTooltip>
                )}
              </div>

              <div className="space-y-4">
                <FieldWithTooltip
                  label="Valor Mínimo da Compra (R$)"
                  tooltip="Valor mínimo da consulta para que o cupom seja válido. Use 0 para permitir qualquer valor."
                >
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.minimum_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_purchase_amount: parseFloat(e.target.value) })}
                  />
                </FieldWithTooltip>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip
                  label="Limite Total de Usos"
                  tooltip="Número máximo total de vezes que este cupom pode ser utilizado por todos os usuários. Deixe vazio para usos ilimitados."
                >
                  <Input
                    type="number"
                    value={formData.maximum_uses || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, maximum_uses: e.target.value ? parseInt(e.target.value) : null })
                    }
                    placeholder="Ilimitado"
                  />
                </FieldWithTooltip>

                <FieldWithTooltip
                  label="Usos por Usuário"
                  tooltip="Número máximo de vezes que um mesmo usuário pode utilizar este cupom (ex: 1 para uso único, 5 para múltiplos usos)."
                >
                  <Input
                    type="number"
                    value={formData.uses_per_user}
                    onChange={(e) => setFormData({ ...formData, uses_per_user: parseInt(e.target.value) })}
                    min="1"
                  />
                </FieldWithTooltip>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldWithTooltip
                  label="Válido A Partir De *"
                  tooltip="Data de início da validade do cupom. O cupom só poderá ser usado a partir desta data."
                >
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </FieldWithTooltip>

                <FieldWithTooltip
                  label="Válido Até"
                  tooltip="Data de término da validade do cupom. Deixe vazio para cupom sem data de expiração."
                >
                  <Input
                    type="date"
                    value={formData.valid_until || ''}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || null })}
                  />
                </FieldWithTooltip>
              </div>

              <FieldWithTooltip
                label="Cupom Ativo"
                tooltip="Ative ou desative o cupom. Cupons inativos não poderão ser utilizados pelos pacientes."
              >
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Cupom está ativo' : 'Cupom está inativo'}
                  </span>
                </div>
              </FieldWithTooltip>

              {/* === NOVAS SEÇÕES: Target Audience e Professional Scope === */}
              
              {/* Seção: Para Quem é Aplicado */}
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Para Quem é Aplicado
                </h4>
                
                <FieldWithTooltip
                  label="Público-Alvo"
                  tooltip="Define quem pode usar este cupom"
                >
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value: any) => setFormData({ 
                      ...formData, 
                      target_audience: value,
                      target_audience_user_ids: null
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos os pacientes
                        </div>
                      </SelectItem>
                      <SelectItem value="institution_students">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Apenas alunos da instituição
                        </div>
                      </SelectItem>
                      <SelectItem value="other_patients">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Apenas pacientes não-alunos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWithTooltip>

                {(formData.target_audience === 'institution_students' || 
                  formData.target_audience === 'other_patients') && (
                  <FieldWithTooltip
                    label="Usuários Específicos (Opcional)"
                    tooltip="Deixe vazio para aplicar a todos do grupo selecionado"
                  >
                    <UserMultiSelect
                      institutionId={institution!.id}
                      selectedUserIds={formData.target_audience_user_ids || []}
                      onChange={(ids) => setFormData({ ...formData, target_audience_user_ids: ids })}
                      filterType={formData.target_audience}
                    />
                  </FieldWithTooltip>
                )}
              </div>

              {/* Seção: Em Que Consultas é Aplicado */}
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Em Que Consultas é Aplicado
                </h4>
                
                <FieldWithTooltip
                  label="Abrangência de Profissionais"
                  tooltip="Define em quais consultas o cupom pode ser usado"
                >
                  <Select
                    value={formData.professional_scope}
                    onValueChange={(value: any) => setFormData({ 
                      ...formData, 
                      professional_scope: value,
                      professional_scope_ids: null
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_tenant">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos os profissionais da {tenant?.name}
                        </div>
                      </SelectItem>
                      <SelectItem value="institution_professionals">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Apenas profissionais da instituição
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWithTooltip>

                {formData.professional_scope === 'institution_professionals' && (
                  <FieldWithTooltip
                    label="Profissionais Específicos (Opcional)"
                    tooltip="Deixe vazio para aplicar a todos os profissionais da instituição"
                  >
                    <ProfessionalMultiSelect
                      institutionId={institution!.id}
                      selectedProfessionalIds={formData.professional_scope_ids || []}
                      onChange={(ids) => setFormData({ ...formData, professional_scope_ids: ids })}
                    />
                  </FieldWithTooltip>
                )}
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
