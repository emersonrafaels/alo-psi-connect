import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useProfileManager } from '@/hooks/useProfileManager';
import { Save, Edit, X, User } from 'lucide-react';

interface ProfileData {
  nome: string;
  email: string;
  data_nascimento?: string;
  genero?: string;
  cpf?: string;
  como_conheceu?: string;
}

interface EditableProfileFieldsProps {
  profile: ProfileData;
  onUpdate: () => void;
}

export const EditableProfileFields: React.FC<EditableProfileFieldsProps> = ({
  profile,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useProfileManager();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    data_nascimento: profile?.data_nascimento || '',
    genero: profile?.genero || '',
    cpf: profile?.cpf || '',
    como_conheceu: profile?.como_conheceu || ''
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        data_nascimento: profile.data_nascimento || '',
        genero: profile.genero || '',
        cpf: profile.cpf || '',
        como_conheceu: profile.como_conheceu || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      onUpdate();
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações pessoais foram salvas com sucesso.",
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
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        data_nascimento: profile.data_nascimento || '',
        genero: profile.genero || '',
        cpf: profile.cpf || '',
        como_conheceu: profile.como_conheceu || ''
      });
    }
    setIsEditing(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-lg"></div>
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Informações Pessoais</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie seus dados pessoais
              </p>
            </div>
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
      
      <CardContent className="relative space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => updateFormData('nome', e.target.value)}
              disabled={!isEditing}
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled={true}
              placeholder="Email não pode ser alterado"
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O email não pode ser alterado por questões de segurança
            </p>
          </div>

          <div>
            <Label htmlFor="data_nascimento">Data de nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => updateFormData('data_nascimento', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="genero">Gênero</Label>
            {isEditing ? (
              <Select
                value={formData.genero}
                onValueChange={(value) => updateFormData('genero', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                  <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="genero"
                value={formData.genero}
                disabled={true}
                placeholder="Ex: Masculino, Feminino, Outro"
              />
            )}
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => updateFormData('cpf', e.target.value)}
              disabled={!isEditing}
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <Label htmlFor="como_conheceu">Como nos conheceu?</Label>
            {isEditing ? (
              <Select
                value={formData.como_conheceu}
                onValueChange={(value) => updateFormData('como_conheceu', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Como nos conheceu?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Indicação de amigo">Indicação de amigo</SelectItem>
                  <SelectItem value="Indicação médica">Indicação médica</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="como_conheceu"
                value={formData.como_conheceu}
                disabled={true}
                placeholder="Ex: Google, indicação, redes sociais"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};