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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useAuth } from '@/hooks/useAuth';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useUserType } from '@/hooks/useUserType';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarStatus';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { usePatientInstitutions } from '@/hooks/usePatientInstitutions';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration';
import { PatientInstitutionsCard } from '@/components/PatientInstitutionsCard';
import { PatientCouponsCard } from '@/components/PatientCouponsCard';
import { ArrowLeft, Camera, Check, User, GraduationCap } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadProfilePhoto } = useProfileManager();
  const { isProfessional } = useUserType();
  const { isConnected: googleCalendarConnected, refetch: refetchGoogleCalendar } = useGoogleCalendarStatus();
  const { linkedInstitutions, isLoading: loadingInstitutions } = usePatientInstitutions();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Popula o formulário quando o perfil é carregado
  useEffect(() => {
    console.log('Profile effect - profile:', profile, 'user:', user);
    
    if (profile) {
      console.log('Profile effect - setting form data from profile');
      setFormData({
        nome: profile.nome || '',
        email: profile.email || user?.email || '',
        data_nascimento: profile.data_nascimento || '',
        genero: profile.genero || '',
        cpf: profile.cpf || '',
        foto_perfil_url: profile.foto_perfil_url || '',
        como_conheceu: profile.como_conheceu || ''
      });
    } else if (user && !profileLoading) {
      console.log('Profile effect - no profile but user exists, setting form data from user');
      // Se não há perfil mas há usuário, preencher com dados básicos
      setFormData({
        nome: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        data_nascimento: '',
        genero: '',
        cpf: '',
        foto_perfil_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        como_conheceu: ''
      });
    }
  }, [profile, user, profileLoading]);

  const handleSubmit = async () => {
    console.log('Profile: handleSubmit started');
    console.log('Profile: selectedFile:', selectedFile);
    console.log('Profile: formData:', formData);
    
    setLoading(true);

    try {
      let finalFormData = { ...formData };

      // Se há um arquivo selecionado, fazer upload primeiro
      if (selectedFile) {
        console.log('Profile: Starting photo upload...');
        // Usar a função uploadProfilePhoto já disponível do hook
        const photoUrl = await uploadProfilePhoto(selectedFile);
        console.log('Profile: Photo upload result:', photoUrl);
        
        if (photoUrl) {
          finalFormData.foto_perfil_url = photoUrl;
          console.log('Profile: Photo URL added to form data:', photoUrl);
        } else {
          console.error('Profile: Photo upload failed');
          toast({
            title: "Erro no upload",
            description: "Erro ao fazer upload da foto. Perfil será salvo sem a nova foto.",
            variant: "destructive",
          });
        }
      }

      console.log('Profile: Updating profile with final data:', finalFormData);
      const { error } = await updateProfile(finalFormData);
      
      if (!error) {
        console.log('Profile: Update successful');
        // Limpar arquivo selecionado após sucesso
        setSelectedFile(null);
        
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
        });
      } else {
        console.error('Profile: Update error:', error);
        toast({
          title: "Erro ao atualizar",
          description: "Houve um problema ao salvar suas informações. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Profile: Catch block error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload da foto",
        variant: "destructive",
      });
    } finally {
      console.log('Profile: Setting loading to false');
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelected = (file: File | null) => {
    console.log('Profile handlePhotoSelected: File received:', file);
    setSelectedFile(file);
  };

  const handlePhotoUrlChange = (url: string) => {
    console.log('Profile handlePhotoUrlChange: URL received:', url);
    updateFormData('foto_perfil_url', url);
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
              onClick={() => navigate(buildTenantPath(tenantSlug, '/'))}
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
                
                <div className="flex flex-col items-center gap-2">
                  <PhotoUpload
                    onPhotoSelected={handlePhotoSelected}
                    onPhotoUrlChange={handlePhotoUrlChange}
                    selectedFile={selectedFile}
                    currentPhotoUrl={formData.foto_perfil_url}
                    compact={true}
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Passe o mouse sobre a foto para alterar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Tabs para Pacientes */}
          {!isProfessional ? (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Pessoais
                </TabsTrigger>
                <TabsTrigger value="institution" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Instituição
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 mt-0">
                {/* Formulário de Informações Pessoais */}
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
                            onChange={(e) => {
                              // Only allow digits and format as XXX.XXX.XXX-XX
                              let value = e.target.value.replace(/\D/g, '').slice(0, 11);
                              value = value
                                .replace(/^(\d{3})(\d)/, '$1.$2')
                                .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                                .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                              updateFormData('cpf', value);
                            }}
                            placeholder="000.000.000-00"
                            required
                            maxLength={14}
                            pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                            inputMode="numeric"
                          />
                          {formData.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf) && (
                            <p className="text-sm text-red-500 mt-1">
                              CPF deve ter 11 dígitos no formato XXX.XXX.XXX-XX
                            </p>
                          )}
                        </div>

                        <Separator />

                        <div>
                          <Label htmlFor="comoConheceu">Como conheceu o Rede Bem Estar?</Label>
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
              </TabsContent>

              <TabsContent value="institution" className="space-y-6 mt-0">
                <PatientInstitutionsCard
                  institutions={linkedInstitutions}
                  loading={loadingInstitutions}
                />
                <PatientCouponsCard loading={loadingInstitutions} />
              </TabsContent>
            </Tabs>
          ) : (
            /* Formulário sem tabs para profissionais */
            <>
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
                          onChange={(e) => {
                            // Only allow digits and format as XXX.XXX.XXX-XX
                            let value = e.target.value.replace(/\D/g, '').slice(0, 11);
                            value = value
                              .replace(/^(\d{3})(\d)/, '$1.$2')
                              .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                              .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                            updateFormData('cpf', value);
                          }}
                          placeholder="000.000.000-00"
                          required
                          maxLength={14}
                          pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                          inputMode="numeric"
                        />
                        {formData.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf) && (
                          <p className="text-sm text-red-500 mt-1">
                            CPF deve ter 11 dígitos no formato XXX.XXX.XXX-XX
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="comoConheceu">Como conheceu o Rede Bem Estar?</Label>
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
            </>
          )}

          {/* Seção do Google Calendar para profissionais */}
          {isProfessional && (
            <>
              {/* Acesso rápido ao perfil profissional */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Perfil Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Acesse a área completa para gerenciar especialidades, horários, bloqueios e integração com Google Calendar
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${googleCalendarConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{googleCalendarConnected ? 'Agenda conectada' : 'Agenda desconectada'}</span>
                      </div>
                    </div>
                    <Button onClick={() => navigate(buildTenantPath(tenantSlug, '/professional-profile'))}>
                      Gerenciar Perfil Profissional
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;