import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Edit, X, CreditCard } from 'lucide-react';

interface ProfessionalData {
  id: number;
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  pix?: string | null;
  tipo_conta?: string | null;
}

interface BankingInfoEditorProps {
  professionalData: ProfessionalData | null;
  onUpdate: (data: Partial<ProfessionalData>) => void;
}

export const BankingInfoEditor: React.FC<BankingInfoEditorProps> = ({
  professionalData,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    banco: professionalData?.banco || '',
    agencia: professionalData?.agencia || '',
    conta: professionalData?.conta || '',
    pix: professionalData?.pix || '',
    tipo_conta: professionalData?.tipo_conta || 'corrente'
  });

  React.useEffect(() => {
    if (professionalData) {
      setFormData({
        banco: professionalData.banco || '',
        agencia: professionalData.agencia || '',
        conta: professionalData.conta || '',
        pix: professionalData.pix || '',
        tipo_conta: professionalData.tipo_conta || 'corrente'
      });
    }
  }, [professionalData]);

  const handleSave = async () => {
    if (!professionalData) return;

    setLoading(true);
    try {
      const updateData = {
        banco: formData.banco || null,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        pix: formData.pix || null,
        tipo_conta: formData.tipo_conta || null
      };

      const { error } = await supabase
        .from('profissionais')
        .update(updateData)
        .eq('id', professionalData.id);

      if (error) throw error;

      onUpdate(updateData);
      setIsEditing(false);
      
      toast({
        title: "Dados bancários atualizados",
        description: "Suas informações bancárias foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar os dados bancários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (professionalData) {
      setFormData({
        banco: professionalData.banco || '',
        agencia: professionalData.agencia || '',
        conta: professionalData.conta || '',
        pix: professionalData.pix || '',
        tipo_conta: professionalData.tipo_conta || 'corrente'
      });
    }
    setIsEditing(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Dados Bancários</CardTitle>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="banco">Banco</Label>
            <Input
              id="banco"
              value={formData.banco}
              onChange={(e) => updateFormData('banco', e.target.value)}
              disabled={!isEditing}
              placeholder="Nome do banco"
            />
          </div>

          <div>
            <Label htmlFor="agencia">Agência</Label>
            <Input
              id="agencia"
              value={formData.agencia}
              onChange={(e) => updateFormData('agencia', e.target.value)}
              disabled={!isEditing}
              placeholder="1234"
            />
          </div>

          <div>
            <Label htmlFor="conta">Conta</Label>
            <Input
              id="conta"
              value={formData.conta}
              onChange={(e) => updateFormData('conta', e.target.value)}
              disabled={!isEditing}
              placeholder="12345-6"
            />
          </div>

          <div>
            <Label htmlFor="tipo_conta">Tipo de conta</Label>
            {isEditing ? (
              <Select
                value={formData.tipo_conta}
                onValueChange={(value) => updateFormData('tipo_conta', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="tipo_conta"
                value={formData.tipo_conta === 'corrente' ? 'Conta Corrente' : 'Conta Poupança'}
                disabled={true}
              />
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="pix">PIX</Label>
          <Input
            id="pix"
            value={formData.pix}
            onChange={(e) => updateFormData('pix', e.target.value)}
            disabled={!isEditing}
            placeholder="email@exemplo.com ou 11999999999"
          />
        </div>

        {!isEditing && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Informações para pagamento:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Estes dados serão usados para transferir seus pagamentos</p>
              <p>• Mantenha as informações sempre atualizadas</p>
              <p>• PIX é opcional, mas facilita recebimentos mais rápidos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};