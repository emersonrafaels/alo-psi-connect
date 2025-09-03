import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useAuth } from '@/hooks/useAuth';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Check } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfileManager();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    data_nascimento: '',
    genero: '',
    cpf: '',
    foto_perfil_url: '',
    como_conheceu: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        email: profile.email || '',
        data_nascimento: profile.data_nascimento || '',
        genero: profile.genero || '',
        cpf: profile.cpf || '',
        foto_perfil_url: profile.foto_perfil_url || '',
        como_conheceu: profile.como_conheceu || ''
      });
    }
  }, [profile]);

  const handleSubmit = async () => {
    setLoading(true);

    const { error } = await updateProfile(formData);
    
    if (!error) {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    }

    setLoading(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          {/* Header do Perfil */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-1 bg-primary mx-auto mb-4"></div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Meu Perfil</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gerenciar Conta
            </h1>
            <p className="text-muted-foreground">
              Atualize suas informações pessoais e preferências
            </p>
          </div>

          {/* Card do Avatar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.foto_perfil_url} alt={formData.nome} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(formData.nome || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold">{formData.nome || user?.email}</h2>
                  <p className="text-muted-foreground">{formData.email}</p>
                  {user?.user_metadata?.email_verified && (
                    <Badge variant="secondary" className="mt-2">
                      <Check className="h-3 w-3 mr-1" />
                      Verificado pelo Google
                    </Badge>
                  )}
                </div>
                
                <PhotoUpload
                  onPhotoUploaded={(url) => updateFormData('foto_perfil_url', url)}
                  currentPhotoUrl={formData.foto_perfil_url}
                  label="Alterar Foto"
                  className="w-auto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => updateFormData('nome', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Para alterar o email, entre em contato com o suporte
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="dataNascimento">Data de nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => updateFormData('data_nascimento', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="genero">Gênero</Label>
                    <Select value={formData.genero} onValueChange={(value) => updateFormData('genero', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="nao_binario">Não binário</SelectItem>
                        <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => updateFormData('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="comoConheceu">Como conheceu o Alô, Psi?</Label>
                    <Select value={formData.como_conheceu} onValueChange={(value) => updateFormData('como_conheceu', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google/Busca online</SelectItem>
                        <SelectItem value="redes_sociais">Redes sociais</SelectItem>
                        <SelectItem value="indicacao_amigo">Indicação de amigo</SelectItem>
                        <SelectItem value="indicacao_profissional">Indicação profissional</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você tem certeza que deseja salvar as alterações em seu perfil? Esta ação atualizará suas informações pessoais.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} disabled={loading}>
                          {loading ? 'Salvando...' : 'Salvar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;