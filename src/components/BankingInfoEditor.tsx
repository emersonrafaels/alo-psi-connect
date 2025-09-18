import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Edit, X, CreditCard, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Comprehensive list of Brazilian banks
const BRAZILIAN_BANKS = [
  "Banco do Brasil",
  "Caixa Econômica Federal",
  "Banco Bradesco",
  "Itaú Unibanco",
  "Banco Santander",
  "BTG Pactual",
  "Nubank",
  "Banco Inter",
  "C6 Bank",
  "Banco Original",
  "Banco Safra",
  "Banco Votorantim",
  "Banco Pine",
  "Banco BS2",
  "Banco BV",
  "Banco Pan",
  "Banco BMG",
  "Banco Daycoval",
  "Banco Sofisa",
  "Banco Fibra",
  "Banco Mercantil do Brasil",
  "Banco da Amazônia",
  "Banco do Nordeste",
  "Banrisul",
  "Banco Sicoob",
  "Banco Sicredi",
  "Banco Cooperativo do Brasil",
  "Banco Rural",
  "Banco Rendimento",
  "Banco Topázio",
  "Banco Tribanco",
  "Banco Paulista",
  "Banco Industrial do Brasil",
  "Banco ABC Brasil",
  "Banco Alfa",
  "Banco Arbi",
  "Banco Bari",
  "Banco Bocom BBM",
  "Banco BRB",
  "Banco Citibank",
  "Banco Credit Suisse",
  "Banco Crédit Agricole",
  "Banco Guanabara",
  "Banco Itaú BBA",
  "Banco J.P. Morgan",
  "Banco Modal",
  "Banco Morgan Stanley",
  "Banco Ourinvest",
  "Banco Ribeirão Preto",
  "Banco Semear",
  "Banco UBS",
  "Banco Voiter",
  "Banco XP",
  "Banco Yamaha Motor",
  "BancoSeguro",
  "Banestes",
  "Banpará",
  "BRDE",
  "Caixa Geral - Brasil",
  "CCB - Caixa de Crédito Brasil",
  "Credisis",
  "Hipercard",
  "HSBC Brasil",
  "Pagseguro Internet",
  "Stone Pagamentos",
  "Will Bank"
].sort();

export const BankingInfoEditor: React.FC<BankingInfoEditorProps> = ({
  professionalData,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openBankCombobox, setOpenBankCombobox] = useState(false);
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
            {isEditing ? (
              <Popover open={openBankCombobox} onOpenChange={setOpenBankCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openBankCombobox}
                    className="w-full justify-between"
                  >
                    {formData.banco || "Selecione um banco..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar banco..." />
                    <CommandList>
                      <CommandEmpty>Nenhum banco encontrado.</CommandEmpty>
                      <CommandGroup>
                        {BRAZILIAN_BANKS.map((bank) => (
                          <CommandItem
                            key={bank}
                            value={bank}
                            onSelect={(currentValue) => {
                              updateFormData('banco', currentValue === formData.banco ? "" : currentValue);
                              setOpenBankCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.banco === bank ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {bank}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                id="banco"
                value={formData.banco}
                disabled={true}
                placeholder="Nome do banco"
              />
            )}
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