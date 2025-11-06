import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ParsedUserWithValidation, useBulkUserValidation } from '@/hooks/useBulkUserValidation';
import { InstitutionSelector } from '@/components/register/InstitutionSelector';

interface UserEditDialogProps {
  user: ParsedUserWithValidation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updatedUser: Partial<ParsedUserWithValidation>) => void;
}

export const UserEditDialog = ({ user, open, onOpenChange, onSave }: UserEditDialogProps) => {
  const [formData, setFormData] = useState<ParsedUserWithValidation | null>(null);
  const { validateUser } = useBulkUserValidation();

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  if (!formData) return null;

  const handleSave = () => {
    const newValidation = validateUser(formData);
    const updatedUser = {
      ...formData,
      validation: newValidation
    };
    onSave(formData.id, updatedUser);
    onOpenChange(false);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      // Recalcular validação em tempo real
      updated.validation = validateUser(updated);
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dados do Usuário</DialogTitle>
          <DialogDescription>
            Revise e corrija os dados antes da importação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => updateField('nome', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf || ''}
                onChange={(e) => updateField('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento || ''}
                onChange={(e) => updateField('data_nascimento', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genero">Gênero</Label>
              <Select
                value={formData.genero || ''}
                onValueChange={(value) => updateField('genero', value)}
              >
                <SelectTrigger id="genero">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                  <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ''}
                onChange={(e) => updateField('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
              <Select
                value={formData.tipo_usuario}
                onValueChange={(value) => updateField('tipo_usuario', value)}
              >
                <SelectTrigger id="tipo_usuario">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paciente">Paciente</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={formData.senha || ''}
                onChange={(e) => updateField('senha', e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          {/* Campos específicos para profissionais */}
          {formData.tipo_usuario === 'profissional' && (
            <>
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-3">Informações Profissionais</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crp_crm">CRP/CRM</Label>
                    <Input
                      id="crp_crm"
                      value={formData.crp_crm || ''}
                      onChange={(e) => updateField('crp_crm', e.target.value)}
                      placeholder="Ex: CRP 12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input
                      id="profissao"
                      value={formData.profissao || ''}
                      onChange={(e) => updateField('profissao', e.target.value)}
                      placeholder="Ex: Psicólogo(a)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preco_consulta">Preço da Consulta (R$)</Label>
                    <Input
                      id="preco_consulta"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.preco_consulta || ''}
                      onChange={(e) => updateField('preco_consulta', parseFloat(e.target.value) || 0)}
                      placeholder="120.00"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <InstitutionSelector
                    value={formData.instituicao || ''}
                    onChange={(value) => updateField('instituicao', value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Instituição para pacientes */}
          {formData.tipo_usuario === 'paciente' && (
            <InstitutionSelector
              value={formData.instituicao || ''}
              onChange={(value) => updateField('instituicao', value)}
            />
          )}

          {/* Feedback de validação */}
          {formData.validation && (
            <div className="space-y-2 pt-2">
              {formData.validation.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erros que impedem a importação:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {formData.validation.errors.map((err, i) => (
                        <li key={i} className="text-sm">{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {formData.validation.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Avisos (não impedem a importação):</strong>
                    <ul className="list-disc list-inside mt-1">
                      {formData.validation.warnings.map((warn, i) => (
                        <li key={i} className="text-sm">{warn}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
