import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Edit, X } from 'lucide-react';

interface ProfessionalData {
  id: number;
  user_id: number;
  display_name: string;
  foto_perfil_url: string | null;
  profissao: string | null;
  crp_crm: string | null;
  resumo_profissional: string | null;
  preco_consulta: number | null;
  tempo_consulta: number | null;
  servicos_raw: string | null;
  telefone: string | null;
  email_secundario: string | null;
  ativo: boolean;
}

interface ProfessionalInfoEditorProps {
  professionalData: ProfessionalData | null;
  onUpdate: (data: ProfessionalData) => void;
}

export const ProfessionalInfoEditor: React.FC<ProfessionalInfoEditorProps> = ({
  professionalData,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    display_name: professionalData?.display_name || '',
    profissao: professionalData?.profissao || '',
    crp_crm: professionalData?.crp_crm || '',
    resumo_profissional: professionalData?.resumo_profissional || '',
    preco_consulta: professionalData?.preco_consulta?.toString() || '',
    tempo_consulta: professionalData?.tempo_consulta?.toString() || '',
    telefone: professionalData?.telefone || '',
    email_secundario: professionalData?.email_secundario || '',
    ativo: professionalData?.ativo || false
  });

  React.useEffect(() => {
    if (professionalData) {
      setFormData({
        display_name: professionalData.display_name || '',
        profissao: professionalData.profissao || '',
        crp_crm: professionalData.crp_crm || '',
        resumo_profissional: professionalData.resumo_profissional || '',
        preco_consulta: professionalData.preco_consulta?.toString() || '',
        tempo_consulta: professionalData.tempo_consulta?.toString() || '',
        telefone: professionalData.telefone || '',
        email_secundario: professionalData.email_secundario || '',
        ativo: professionalData.ativo || false
      });
    }
  }, [professionalData]);

  const handleSave = async () => {
    if (!professionalData) return;

    setLoading(true);
    try {
      const updateData = {
        display_name: formData.display_name,
        profissao: formData.profissao,
        crp_crm: formData.crp_crm,
        resumo_profissional: formData.resumo_profissional,
        preco_consulta: formData.preco_consulta ? parseFloat(formData.preco_consulta) : null,
        tempo_consulta: formData.tempo_consulta ? parseInt(formData.tempo_consulta) : null,
        telefone: formData.telefone,
        email_secundario: formData.email_secundario,
        ativo: formData.ativo
      };

      const { error } = await supabase
        .from('profissionais')
        .update(updateData)
        .eq('id', professionalData.id);

      if (error) throw error;

      onUpdate({ ...professionalData, ...updateData });
      setIsEditing(false);
      
      toast({
        title: "Informações atualizadas",
        description: "Suas informações profissionais foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar as informações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (professionalData) {
      setFormData({
        display_name: professionalData.display_name || '',
        profissao: professionalData.profissao || '',
        crp_crm: professionalData.crp_crm || '',
        resumo_profissional: professionalData.resumo_profissional || '',
        preco_consulta: professionalData.preco_consulta?.toString() || '',
        tempo_consulta: professionalData.tempo_consulta?.toString() || '',
        telefone: professionalData.telefone || '',
        email_secundario: professionalData.email_secundario || '',
        ativo: professionalData.ativo || false
      });
    }
    setIsEditing(false);
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Informações Profissionais</CardTitle>
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
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="display_name">Nome de exibição</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => updateFormData('display_name', e.target.value)}
              disabled={!isEditing}
              placeholder="Nome que aparecerá no perfil"
            />
          </div>

          <div>
            <Label htmlFor="profissao">Profissão</Label>
            <Input
              id="profissao"
              value={formData.profissao}
              onChange={(e) => updateFormData('profissao', e.target.value)}
              disabled={!isEditing}
              placeholder="Ex: Psicólogo(a)"
            />
          </div>

          <div>
            <Label htmlFor="crp_crm">CRP/CRM</Label>
            <Input
              id="crp_crm"
              value={formData.crp_crm}
              onChange={(e) => updateFormData('crp_crm', e.target.value)}
              disabled={!isEditing}
              placeholder="Ex: CRP 12/34567"
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => updateFormData('telefone', e.target.value)}
              disabled={!isEditing}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="email_secundario">Email secundário</Label>
            <Input
              id="email_secundario"
              type="email"
              value={formData.email_secundario}
              onChange={(e) => updateFormData('email_secundario', e.target.value)}
              disabled={!isEditing}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => updateFormData('ativo', checked)}
              disabled={!isEditing}
            />
            <Label htmlFor="ativo">Perfil ativo para agendamentos</Label>
          </div>
        </div>

        {/* Resumo Profissional */}
        <div>
          <Label htmlFor="resumo_profissional">Resumo profissional</Label>
          <Textarea
            id="resumo_profissional"
            value={formData.resumo_profissional}
            onChange={(e) => updateFormData('resumo_profissional', e.target.value)}
            disabled={!isEditing}
            placeholder="Descreva sua experiência, abordagens terapêuticas e áreas de atuação..."
            rows={4}
          />
        </div>

        {/* Valores e Tempo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="preco_consulta">Preço da consulta (R$)</Label>
            <Input
              id="preco_consulta"
              type="number"
              step="0.01"
              min="0"
              value={formData.preco_consulta}
              onChange={(e) => updateFormData('preco_consulta', e.target.value)}
              disabled={!isEditing}
              placeholder="120.00"
            />
          </div>

          <div>
            <Label htmlFor="tempo_consulta">Duração da consulta (minutos)</Label>
            <Input
              id="tempo_consulta"
              type="number"
              min="15"
              step="15"
              value={formData.tempo_consulta}
              onChange={(e) => updateFormData('tempo_consulta', e.target.value)}
              disabled={!isEditing}
              placeholder="50"
            />
          </div>
        </div>

        {/* Informações sobre status */}
        {!isEditing && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Status do perfil:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Perfil {formData.ativo ? 'ativo' : 'inativo'} para novos agendamentos</p>
              {formData.preco_consulta && (
                <p>• Valor da consulta: R$ {parseFloat(formData.preco_consulta).toFixed(2)}</p>
              )}
              {formData.tempo_consulta && (
                <p>• Duração da consulta: {formData.tempo_consulta} minutos</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};