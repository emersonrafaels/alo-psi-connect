import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { ChevronLeft, ChevronRight, Eye, EyeOff, Check, Clock, X, Brain, Stethoscope, Users } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Badge } from '@/components/ui/badge';
import { useProfileManager } from '@/hooks/useProfileManager';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { SpecialtiesSelector } from '@/components/SpecialtiesSelector';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { TimelineProgress } from '@/components/register/TimelineProgress';
import { FieldWithTooltip } from '@/components/register/FieldWithTooltip';
import { ProfessionalSummaryField } from '@/components/register/ProfessionalSummaryField';
import { ProfilePreview } from '@/components/register/ProfilePreview';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import { BirthDateInput } from '@/components/register/BirthDateInput';
import { CRPCRMInput } from '@/components/register/CRPCRMInput';
import { PriceInput } from '@/components/register/PriceInput';
import { ScheduleTemplates } from '@/components/register/ScheduleTemplates';
import { AutoSaveIndicator } from '@/components/register/AutoSaveIndicator';

import { formatCPF, validateCPF, getCPFErrorMessage } from '@/utils/cpfValidator';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

import { ExistingAccountModal } from '@/components/ExistingAccountModal';
import { EmailConfirmationModal } from '@/components/EmailConfirmationModal';

const ProfessionalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { saveGooglePhoto, uploadProfilePhoto } = useProfileManager();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  
  const platformName = tenant?.name || "Alô, Psi!";
  const googleData = location.state?.googleData || null;

  const [formData, setFormData] = useState({
    nome: googleData?.fullName || '',
    email: user?.email || googleData?.email || '',
    dataNascimento: '',
    genero: '',
    raca: '',
    sexualidade: '',
    cpf: '',
    profissao: '',
    possuiEPsi: '',
    crpCrm: '',
    fotoPerfilUrl: '',
    linkedin: '',
    comoConheceu: '',
    resumoProfissional: '',
    senha: '',
    confirmarSenha: '',
    // Novos campos
    especialidades: [] as string[],
    horarios: [] as any[],
    precoConsulta: '', // Novo campo obrigatório
    intervaloHorarios: '50' // Fixado em 50 minutos
  });

  // Salvar foto do Google automaticamente se disponível
  useEffect(() => {
    if (googleData?.picture && !formData.fotoPerfilUrl && !photoPreviewUrl) {
      setFormData(prev => ({ ...prev, fotoPerfilUrl: googleData.picture }));
      setPhotoPreviewUrl(googleData.picture);
    }
  }, [googleData, formData.fotoPerfilUrl, photoPreviewUrl]);

  // Auto-save do progresso
  const { clearSaved } = useFormPersistence({
    key: 'professional-registration-draft',
    data: { formData, currentStep },
    enabled: !user, // Só salvar se ainda não estiver autenticado
    debounceMs: 2000,
    onRestore: (restoredData) => {
      setFormData(restoredData.formData);
      setCurrentStep(restoredData.currentStep);
    }
  });

  // Simular salvamento para indicador
  useEffect(() => {
    if (!user && formData.nome) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData, user]);

  // Verificar se o usuário já é profissional cadastrado
  useEffect(() => {
    const checkExistingProfessional = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profissionais')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();
        
        if (data) {
          // Usuário já é profissional - limpar dados e redirecionar
          toast({
            title: "Você já está cadastrado",
            description: "Redirecionando para seu perfil profissional...",
            variant: "default",
          });
          
          // Limpar todos os dados salvos
          sessionStorage.removeItem('pendingProfessionalData');
          sessionStorage.removeItem('continueRegistration');
          sessionStorage.removeItem('professional-registration-draft');
          clearSaved();
          
          // Redirecionar para perfil profissional
          setTimeout(() => {
            navigate('/professional-profile');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao verificar profissional:', error);
      }
    };
    
    checkExistingProfessional();
  }, [user, navigate, toast, clearSaved]);

  // Verificar se há dados pendentes de cadastro profissional
  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingProfessionalData');
    const continueRegistration = sessionStorage.getItem('continueRegistration');
    
    if (pendingData && continueRegistration === 'true' && user) {
      try {
        const parsedData = JSON.parse(pendingData);
        setFormData(parsedData);
        sessionStorage.removeItem('pendingProfessionalData');
        sessionStorage.removeItem('continueRegistration');
        
        toast({
          title: "Dados recuperados",
          description: "Seus dados foram recuperados. Continue o cadastro onde parou.",
          variant: "default",
        });
      } catch (error) {
        console.error('Erro ao recuperar dados pendentes:', error);
      }
    }
  }, [user, toast]);

  const totalSteps = 8;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    // Se estamos no step 1 e não há usuário logado, verificar se email já existe
    if (currentStep === 1 && !user && formData.email) {
      const emailCheck = await checkEmailExists(formData.email);
      if (emailCheck?.exists) {
        // Salvar dados do formulário para recuperar após login
        sessionStorage.setItem('pendingProfessionalData', JSON.stringify(formData));
        setShowExistingAccountModal(true);
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validação de senha
    if (formData.senha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    console.log('📤 [ProfessionalForm] Iniciando cadastro profissional para:', formData.email);
    
    try {
      // Preparar dados (SEM foto inicialmente)
      const profileData = {
        nome: formData.nome,
        email: formData.email,
        data_nascimento: formData.dataNascimento || null,
        genero: formData.genero || null,
        cpf: formData.cpf || null,
        raca: formData.raca || null,
        sexualidade: formData.sexualidade || null,
        como_conheceu: formData.comoConheceu || null,
        tipo_usuario: 'profissional',
        foto_perfil_url: null // Sem foto no primeiro momento
      };

      const professionalData = {
        display_name: formData.nome,
        user_email: formData.email,
        user_login: formData.email,
        first_name: formData.nome.split(' ')[0] || formData.nome,
        last_name: formData.nome.split(' ').slice(1).join(' ') || '',
        profissao: formData.profissao || null,
        crp_crm: formData.crpCrm || null,
        cpf: formData.cpf || null,
        linkedin: formData.linkedin || null,
        resumo_profissional: formData.resumoProfissional || null,
        foto_perfil_url: null,
        possui_e_psi: formData.possuiEPsi === 'sim',
        servicos_raw: formData.especialidades.length > 0 ? formData.especialidades.join(', ') : null,
        preco_consulta: formData.precoConsulta ? parseFloat(formData.precoConsulta) : null,
        tempo_consulta: 50,
        ativo: true,
        senha: formData.senha
      };

      const horariosData = formData.horarios.map(horario => ({
        day: horario.day,
        startTime: horario.startTime,
        endTime: horario.endTime,
        duration: horario.duration || 30
      }));

      // 1️⃣ CRIAR USUÁRIO E PERFIL (sem foto)
      console.log('📝 Criando perfil profissional...');
      const { data, error } = await supabase.functions.invoke('create-professional-profile', {
        body: {
          profileData,
          professionalData,
          horariosData: horariosData.length > 0 ? horariosData : null,
          tenantSlug: tenant?.slug || 'alopsi'
        }
      });

      if (error) throw new Error(error.message || 'Erro ao criar perfil');
      if (!data?.success) throw new Error('Erro no processamento do cadastro');

      console.log('✅ Perfil criado com sucesso!');

      // 2️⃣ FAZER LOGIN AUTOMÁTICO
      console.log('🔐 Autenticando usuário...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.senha,
      });

      if (signInError) throw signInError;
      console.log('✅ Usuário autenticado!');

      // 3️⃣ AGORA FAZER UPLOAD DA FOTO (se existe)
      if (selectedPhotoFile) {
        console.log('📸 Fazendo upload da foto de perfil...');
        
        const uploadedPhotoUrl = await uploadProfilePhoto(selectedPhotoFile);
        
        if (uploadedPhotoUrl) {
          console.log('✅ Foto carregada, atualizando perfil...');
          
          // 4️⃣ ATUALIZAR PERFIL E PROFISSIONAL COM A FOTO
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ foto_perfil_url: uploadedPhotoUrl })
            .eq('user_id', signInData.user.id);
          
          if (profileUpdateError) console.error('⚠️ Erro ao atualizar foto no profile:', profileUpdateError);
          
          const { error: professionalUpdateError } = await supabase
            .from('profissionais')
            .update({ foto_perfil_url: uploadedPhotoUrl })
            .eq('profile_id', data.profile.id);
          
          if (professionalUpdateError) console.error('⚠️ Erro ao atualizar foto no profissional:', professionalUpdateError);
          
          console.log('✅ Foto atualizada em ambas as tabelas!');
        } else {
          console.warn('⚠️ Não foi possível fazer upload da foto');
        }
      } else if (formData.fotoPerfilUrl && formData.fotoPerfilUrl.startsWith('http')) {
        // Se há uma URL de foto do Google, tentar salvá-la
        console.log('🔄 Salvando foto do Google...');
        try {
          const uploadedPhotoUrl = await saveGooglePhoto(formData.fotoPerfilUrl);
          if (uploadedPhotoUrl) {
            console.log('✅ Foto do Google salva com sucesso:', uploadedPhotoUrl);
            
            await supabase
              .from('profiles')
              .update({ foto_perfil_url: uploadedPhotoUrl })
              .eq('user_id', signInData.user.id);
            
            await supabase
              .from('profissionais')
              .update({ foto_perfil_url: uploadedPhotoUrl })
              .eq('profile_id', data.profile.id);
          }
        } catch (error) {
          console.error('❌ Erro ao salvar foto do Google:', error);
        }
      }

      // Limpar TODOS os dados salvos após sucesso
      sessionStorage.removeItem('pendingProfessionalData');
      sessionStorage.removeItem('continueRegistration');
      sessionStorage.removeItem('professional-registration-draft');
      clearSaved();
      
      // Check if this is a new user that needs email confirmation
      if (data.isNewUser && data.confirmationEmailSent) {
        setShowEmailConfirmationModal(true);
      } else {
        // ✅ Login automático após cadastro bem-sucedido
        console.log('🔐 Fazendo login automático após cadastro...');
        
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.senha,
          });

          if (signInError) {
            console.error('❌ Erro no login automático:', signInError);
            toast({
              title: "Cadastro Concluído!",
              description: "Seu perfil foi criado. Faça login para acessar.",
            });
            navigate(buildTenantPath(tenantSlug, '/auth'));
            return;
          }

          console.log('✅ Login automático bem-sucedido:', signInData.user?.email);
          
          toast({
            title: "Bem-vindo(a)!",
            description: "Cadastro concluído com sucesso. Você já está logado!",
          });

          // Aguardar um momento para o AuthProvider processar a sessão
          setTimeout(() => {
            navigate(buildTenantPath(tenantSlug, '/professional-profile'));
          }, 1000);

        } catch (error) {
          console.error('❌ Erro inesperado no login:', error);
          navigate(buildTenantPath(tenantSlug, '/auth'));
        }
      }
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      
      let errorMessage = error.message;
      
      // Tratamento de erros mais específicos
      if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = 'Muitas tentativas de envio de email. Tente novamente em alguns minutos.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado no sistema.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Email inválido. Verifique o formato do email.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.message?.includes('duplicate key value')) {
        if (error.message.includes('email')) {
          errorMessage = 'Este email já está cadastrado no sistema.';
        } else if (error.message.includes('cpf')) {
          errorMessage = 'Este CPF já está cadastrado no sistema.';
        } else {
          errorMessage = 'Dados já existem no sistema. Verifique as informações.';
        }
      } else if (error.message?.includes('profiles_pkey')) {
        errorMessage = 'Usuário já possui um perfil cadastrado.';
      } else if (error.message?.includes('violates row-level security policy')) {
        errorMessage = 'Erro de permissão. Verifique se todos os campos obrigatórios foram preenchidos.';
      } else if (error.message?.includes('Erro na autenticação')) {
        errorMessage = 'Erro na autenticação. Tente novamente.';
      } else if (error.message?.includes('Erro ao criar perfil')) {
        errorMessage = 'Erro ao criar perfil. Verifique os dados e tente novamente.';
      } else if (error.message?.includes('Erro no processamento do cadastro')) {
        errorMessage = 'Erro no processamento do cadastro. Tente novamente.';
      }
      
      toast({
        title: "Erro no Cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Erro ao verificar email:', error);
      return null;
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="nome">Nome completo <span className="text-red-500">*</span></Label>
          <div className="space-y-2">
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => updateFormData('nome', e.target.value)}
              required
            />
            {googleData?.fullName && (
              <Badge variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Preenchido pelo Google
              </Badge>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              required
              disabled={!!user}
            />
            
            {googleData?.emailVerified && (
              <Badge variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Verificado pelo Google
              </Badge>
            )}
          </div>
        </div>

        <BirthDateInput
          value={formData.dataNascimento}
          onChange={(value) => updateFormData('dataNascimento', value)}
        />

        <div>
          <Label htmlFor="genero">Gênero <span className="text-red-500">*</span></Label>
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
          <Label htmlFor="raca">Raça/Etnia</Label>
          <Select value={formData.raca} onValueChange={(value) => updateFormData('raca', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="branca">Branca</SelectItem>
              <SelectItem value="preta">Preta</SelectItem>
              <SelectItem value="parda">Parda</SelectItem>
              <SelectItem value="amarela">Amarela</SelectItem>
              <SelectItem value="indigena">Indígena</SelectItem>
              <SelectItem value="prefiro_nao_declarar">Prefiro não declarar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sexualidade">Orientação Sexual</Label>
          <Select value={formData.sexualidade} onValueChange={(value) => updateFormData('sexualidade', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heterossexual">Heterossexual</SelectItem>
              <SelectItem value="homossexual">Homossexual</SelectItem>
              <SelectItem value="bissexual">Bissexual</SelectItem>
              <SelectItem value="pansexual">Pansexual</SelectItem>
              <SelectItem value="assexual">Assexual</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
              <SelectItem value="prefiro_nao_declarar">Prefiro não declarar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                updateFormData('cpf', formatted);
              }}
              placeholder="000.000.000-00"
              required
              maxLength={14}
              inputMode="numeric"
              className={getCPFErrorMessage(formData.cpf) ? 'border-red-500 pr-10' : 'pr-10'}
            />
            {/* Ícone de validação */}
            {formData.cpf && formData.cpf.length === 14 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validateCPF(formData.cpf) ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          {/* Mensagem de erro/sucesso */}
          {formData.cpf && (
            <p className={`text-sm mt-1 ${
              getCPFErrorMessage(formData.cpf) ? 'text-red-500' : 'text-green-600'
            }`}>
              {getCPFErrorMessage(formData.cpf) || '✓ CPF válido'}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Profissão <span className="text-red-500">*</span>
        </Label>
        <RadioGroup 
          value={formData.profissao} 
          onValueChange={(value) => updateFormData('profissao', value)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <RadioGroupItem value="Psicólogo" id="psicologo" />
            <Brain className="h-5 w-5 text-primary" />
            <Label htmlFor="psicologo" className="cursor-pointer flex-1">Psicólogo</Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <RadioGroupItem value="Psiquiatra" id="psiquiatra" />
            <Stethoscope className="h-5 w-5 text-primary" />
            <Label htmlFor="psiquiatra" className="cursor-pointer flex-1">Psiquiatra</Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <RadioGroupItem value="Psicoterapeuta" id="psicoterapeuta" />
            <Users className="h-5 w-5 text-primary" />
            <Label htmlFor="psicoterapeuta" className="cursor-pointer flex-1">Psicoterapeuta</Label>
          </div>
        </RadioGroup>
      </div>

      <FieldWithTooltip
        label="Possui E-Psi?"
        tooltip="O E-Psi é um cadastro nacional obrigatório para atendimento psicológico online, emitido pelo Conselho Federal de Psicologia (CFP)."
        required
      >
        <RadioGroup 
          value={formData.possuiEPsi} 
          onValueChange={(value) => updateFormData('possuiEPsi', value)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="epsi-sim" />
            <Label htmlFor="epsi-sim" className="cursor-pointer">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="epsi-nao" />
            <Label htmlFor="epsi-nao" className="cursor-pointer">Não</Label>
          </div>
        </RadioGroup>
      </FieldWithTooltip>

      <CRPCRMInput
        value={formData.crpCrm}
        onChange={(value) => updateFormData('crpCrm', value)}
        profession={formData.profissao}
      />
    </div>
  );

  const renderStep3 = () => {
    const previewAvatar = selectedPhotoFile 
      ? URL.createObjectURL(selectedPhotoFile)
      : photoPreviewUrl || formData.fotoPerfilUrl;

    return (
      <div className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage src={previewAvatar} />
            <AvatarFallback>
              {formData.nome ? formData.nome.slice(0, 2).toUpperCase() : 'FT'}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground text-center max-w-[280px]">
            {selectedPhotoFile 
              ? 'Foto selecionada. Ela será salva após finalizar o cadastro.' 
              : 'Adicione uma foto de perfil para que os pacientes possam reconhecê-lo'}
          </p>
        </div>

        <div className="space-y-2">
          <PhotoUpload
            onPhotoSelected={(file) => {
              if (!file) return;

              // Validar arquivo
              if (!file.type.startsWith('image/')) {
                toast({
                  title: "Erro",
                  description: "Por favor, selecione apenas arquivos de imagem.",
                  variant: "destructive",
                });
                return;
              }

              if (file.size > 10 * 1024 * 1024) { // 10MB
                toast({
                  title: "Erro",
                  description: "Arquivo muito grande. Máximo 10MB.",
                  variant: "destructive",
                });
                return;
              }

              // Armazenar arquivo localmente para upload posterior
              setSelectedPhotoFile(file);
              
              // Criar URL para preview
              const previewUrl = URL.createObjectURL(file);
              setPhotoPreviewUrl(previewUrl);
              
              console.log('Foto selecionada para upload posterior:', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
              });

              toast({
                title: "Foto selecionada",
                description: "A foto será carregada quando finalizar o cadastro.",
              });
            }}
            onPhotoUrlChange={(url) => updateFormData('fotoPerfilUrl', url)}
            currentPhotoUrl={photoPreviewUrl || formData.fotoPerfilUrl}
            label="Foto de Perfil"
          />
          {googleData?.picture && photoPreviewUrl && (
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Foto importada do Google
            </Badge>
          )}
          {selectedPhotoFile && (
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Foto selecionada: {selectedPhotoFile.name}
            </Badge>
          )}
        </div>

        <FieldWithTooltip
          htmlFor="linkedin"
          label="LinkedIn"
          tooltip="Adicione o link completo do seu perfil no LinkedIn (ex: https://linkedin.com/in/seu-nome). Isso aumenta a credibilidade do seu perfil."
        >
          <Input
            id="linkedin"
            value={formData.linkedin}
            onChange={(e) => updateFormData('linkedin', e.target.value)}
            placeholder="https://linkedin.com/in/seu-perfil"
          />
        </FieldWithTooltip>

        <div>
          <Label htmlFor="comoConheceu">Como conheceu {platformName}?</Label>
          <Select value={formData.comoConheceu} onValueChange={(value) => updateFormData('comoConheceu', value)}>
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
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <ProfessionalSummaryField
        value={formData.resumoProfissional}
        onChange={(value) => updateFormData('resumoProfissional', value)}
      />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <SpecialtiesSelector
        value={formData.especialidades}
        onChange={(especialidades) => updateFormData('especialidades', especialidades)}
      />
      
      <PriceInput
        value={formData.precoConsulta}
        onChange={(value) => updateFormData('precoConsulta', value)}
      />
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Duração da Consulta
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Duração padrão: 50 minutos por consulta
        </p>
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-medium">50 minutos</span>
            <Badge variant="default">Padrão</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Esta é a duração padrão utilizada por todos os profissionais na plataforma.
          </p>
        </div>
      </div>

      <ScheduleTemplates
        onApplyTemplate={(slots) => {
          const newSlots = slots.map((slot, index) => ({
            id: `${slot.day}-${slot.startTime}-${Date.now()}-${index}`,
            ...slot
          }));
          updateFormData('horarios', newSlots);
          toast({
            title: "✨ Template aplicado!",
            description: `${newSlots.length} horários foram adicionados. Você pode ajustá-los abaixo.`,
            duration: 3000,
          });
        }}
      />

      <ScheduleSelector
        value={formData.horarios}
        onChange={(horarios) => updateFormData('horarios', horarios)}
        intervalMinutes={50}
      />
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="senha">Senha <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Input
            id="senha"
            type={showPassword ? "text" : "password"}
            value={formData.senha}
            onChange={(e) => updateFormData('senha', e.target.value)}
            required
            minLength={6}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        <PasswordStrengthIndicator 
          password={formData.senha}
          className="mt-3"
        />
      </div>

      <div>
        <Label htmlFor="confirmarSenha">Confirmar Senha <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Input
            id="confirmarSenha"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmarSenha}
            onChange={(e) => updateFormData('confirmarSenha', e.target.value)}
            required
            minLength={6}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2">Quase pronto!</h4>
        <p className="text-sm text-green-700">
          Após finalizar o cadastro, você receberá um email de confirmação. Clique no link do email para ativar sua conta 
          e depois faça login para acessar a plataforma.
        </p>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <ProfilePreview 
      formData={formData} 
      onEdit={(step) => setCurrentStep(step)} 
    />
  );

  const canProceedStep1 = formData.nome && formData.email && formData.dataNascimento && formData.genero && formData.cpf && validateCPF(formData.cpf);
  const canProceedStep2 = formData.profissao && formData.possuiEPsi && formData.crpCrm;
  const canProceedStep3 = true; // Campos opcionais
  const canProceedStep4 = formData.resumoProfissional && formData.resumoProfissional.length >= 100;
  const canProceedStep5 = formData.especialidades.length > 0 && formData.precoConsulta;
  const canProceedStep6 = formData.intervaloHorarios && formData.horarios.length > 0;
  const canProceedStep7 = formData.senha && formData.senha.length >= 6 && formData.confirmarSenha && formData.senha === formData.confirmarSenha;
  const canSubmit = canProceedStep7; // Credenciais na última etapa

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-1 bg-secondary mx-auto mb-4"></div>
              <span className="text-sm font-medium text-secondary uppercase tracking-wider">Cadastro de Profissional</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Quero atender
            </h1>
            <p className="text-muted-foreground">
              Junte-se à nossa rede de profissionais qualificados e ajude quem precisa
            </p>
          </div>

          <Card className="shadow-xl border-2">
            <CardHeader className="space-y-4 pb-6">
              {/* Auto-save indicator */}
              {!user && currentStep < totalSteps && (
                <div className="flex justify-end">
                  <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                </div>
              )}

              <TimelineProgress 
                currentStep={currentStep}
                totalSteps={totalSteps}
                onStepClick={(step) => setCurrentStep(step)}
              />


              <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                 {currentStep === 1 ? 'Seus dados pessoais' :
                  currentStep === 2 ? 'Informações profissionais' :
                  currentStep === 3 ? 'Perfil e contatos' :
                  currentStep === 4 ? 'Resumo profissional' :
                  currentStep === 5 ? 'Suas especialidades' :
                  currentStep === 6 ? 'Horários de atendimento' :
                  currentStep === 7 ? 'Credenciais de acesso' :
                  'Revise suas informações'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
              {currentStep === 6 && renderStep6()}
              {currentStep === 7 && renderStep7()}
              {currentStep === 8 && renderStep8()}

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    onClick={currentStep === 7 ? () => setCurrentStep(8) : handleNext}
                    disabled={
                      (currentStep === 1 && !canProceedStep1) ||
                      (currentStep === 2 && !canProceedStep2) ||
                      (currentStep === 3 && !canProceedStep3) ||
                      (currentStep === 4 && !canProceedStep4) ||
                      (currentStep === 5 && !canProceedStep5) ||
                      (currentStep === 6 && !canProceedStep6) ||
                      (currentStep === 7 && !canProceedStep7)
                    }
                    variant="teal"
                    className="flex items-center gap-2"
                  >
                    {currentStep === 7 ? 'Revisar cadastro' : 'Prosseguir'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    variant="teal"
                    className="w-full"
                  >
                    {loading ? 'Cadastrando...' : 'Confirmar e Finalizar Cadastro'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm">
              Caso já possua conta, {' '}
              <button 
                onClick={() => navigate('/auth')}
                className="text-primary hover:underline font-medium"
              >
                clique aqui
              </button>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />


      {/* Modal de conta existente */}
      <ExistingAccountModal
        isOpen={showExistingAccountModal}
        onClose={() => setShowExistingAccountModal(false)}
        email={formData.email}
      />
      
      {/* Modal de confirmação de email */}
      <EmailConfirmationModal
        isOpen={showEmailConfirmationModal}
        onClose={() => setShowEmailConfirmationModal(false)}
        email={formData.email}
      />
    </div>
  );
};

export default ProfessionalForm;