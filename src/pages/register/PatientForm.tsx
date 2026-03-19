import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TimelineProgress } from '@/components/register/TimelineProgress';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Check, Eye, EyeOff, X, Camera, Plus, Trash2, Phone, Mail, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ExistingAccountModal } from '@/components/ExistingAccountModal';
import { EmailConfirmationModal } from '@/components/EmailConfirmationModal';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath, getTenantDisplayName } from '@/utils/tenantHelpers';
import { BirthDateInput } from '@/components/register/BirthDateInput';
import { InstitutionSelector } from '@/components/register/InstitutionSelector';
import { formatCPF, validateCPF, getCPFErrorMessage } from '@/utils/cpfValidator';
import { AutoSaveIndicator } from '@/components/register/AutoSaveIndicator';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useProfileManager } from '@/hooks/useProfileManager';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Combobox } from '@/components/ui/combobox';

interface EmergencyContact {
  nome: string;
  relacao: string;
  relacaoOutro: string;
  telefone: string;
  email: string;
}

const RELATION_OPTIONS = [
  { value: 'pai_mae', label: 'Pai/Mãe' },
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'irmao_irma', label: 'Irmão/Irmã' },
  { value: 'filho_filha', label: 'Filho/Filha' },
  { value: 'amigo_amiga', label: 'Amigo/Amiga' },
  { value: 'tutor_responsavel', label: 'Tutor/Responsável' },
  { value: 'outro', label: 'Outro' },
];

const emptyContact: EmergencyContact = { nome: '', relacao: '', relacaoOutro: '', telefone: '', email: '' };

const PatientForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  const googleData = location.state?.googleData || null;
  const { uploadProfilePhoto } = useProfileManager();

  const [contatosEmergencia, setContatosEmergencia] = useState<EmergencyContact[]>([{ ...emptyContact }]);

  const [formData, setFormData] = useState({
    ehEstudante: '',
    estudanteStatus: '',
    nome: googleData?.fullName || '',
    email: user?.email || googleData?.email || '',
    dataNascimento: '',
    genero: '',
    raca: '',
    sexualidade: '',
    cpf: '',
    instituicaoEnsino: '',
    instituicao: '',
    comoConheceu: '',
    senha: '',
    confirmarSenha: '',
    password: '',
    telefone: '',
    fotoPerfilUrl: googleData?.picture || ''
  });

  // Auto-save do progresso
  const { clearSaved } = useFormPersistence({
    key: 'patient-registration-draft',
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

  // Verificar se há dados pendentes de cadastro de paciente
  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingPatientData');
    const continueRegistration = sessionStorage.getItem('continueRegistration');
    
    if (pendingData && continueRegistration === 'true' && user) {
      try {
        const parsedData = JSON.parse(pendingData);
        setFormData(parsedData);
        sessionStorage.removeItem('pendingPatientData');
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

  // Auto-preencher foto do Google
  useEffect(() => {
    if (googleData?.picture && !formData.fotoPerfilUrl && !photoPreviewUrl) {
      setFormData(prev => ({ ...prev, fotoPerfilUrl: googleData.picture }));
      setPhotoPreviewUrl(googleData.picture);
    }
  }, [googleData, formData.fotoPerfilUrl, photoPreviewUrl]);
  
  const totalSteps = user ? 4 : 5; // +1 passo para foto
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    // Se estamos no step 2 e não há usuário logado, verificar se email já existe
    if (currentStep === 2 && !user && formData.email) {
      const emailCheck = await checkEmailExists(formData.email);
      if (emailCheck?.exists) {
        // Salvar dados do formulário para recuperar após login
        sessionStorage.setItem('pendingPatientData', JSON.stringify(formData));
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

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setLoading(true);
    
    try {
      // Se não há usuário logado, verificar se email já existe antes de criar conta
      if (!user) {
        const emailCheck = await checkEmailExists(formData.email);
        if (emailCheck?.exists) {
          // Salvar dados do formulário
          sessionStorage.setItem('pendingPatientData', JSON.stringify(formData));
          setShowExistingAccountModal(true);
          setLoading(false);
          return;
        }
      }
      // If Google user, handle specially (they're already authenticated)
      if (googleData) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.error('No active session found for Google user');
          toast({
            title: "Erro",
            description: "Erro na autenticação. Tente fazer login novamente.",
            variant: "destructive",
          });
          return;
        }

        console.log('Google user session found, creating profile...');
        
        // For Google users, call the edge function with their existing user ID
        const { data, error } = await supabase.functions.invoke('create-patient-profile', {
          body: {
            nome: formData.nome,
            email: formData.email,
            password: '', // Google users don't need password
            dataNascimento: formData.dataNascimento,
            genero: formData.genero,
            cpf: formData.cpf,
            comoConheceu: formData.comoConheceu,
            ehEstudante: formData.ehEstudante === 'estudante',
            instituicaoEnsino: formData.ehEstudante === 'estudante' ? formData.instituicaoEnsino : null,
            telefone: '',
            existingUserId: session.user.id, // Pass existing user ID for Google users
            tenantSlug: tenant?.slug || 'alopsi' // ⭐ Enviar tenant explicitamente
          }
        });

        if (error) {
          console.error('Error creating Google user profile:', error);
          toast({
            title: "Erro no cadastro",
            description: "Erro ao criar perfil. Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        // Upload foto após criação do perfil (Google users já estão autenticados)
        if (selectedPhotoFile && session?.user) {
          console.log('📸 Fazendo upload da foto de perfil...');
          
          try {
            const uploadedPhotoUrl = await uploadProfilePhoto(selectedPhotoFile);
            
            if (uploadedPhotoUrl) {
              console.log('✅ Foto carregada, atualizando perfil...');
              
              // Atualizar profiles
              await supabase
                .from('profiles')
                .update({ foto_perfil_url: uploadedPhotoUrl })
                .eq('user_id', session.user.id);
              
              console.log('✅ Foto atualizada com sucesso!');
              
              // ⭐ Limpar sessionStorage após sucesso (caso tenha sido salvo)
              sessionStorage.removeItem('pendingProfilePhoto');
            }
          } catch (uploadError) {
            console.error('Erro no upload da foto:', uploadError);
            toast({
              title: "Aviso",
              description: "Não foi possível carregar a foto, mas o cadastro foi concluído.",
              variant: "default",
            });
          }
        }

        toast({
          title: "Cadastro realizado com sucesso!",
          description: `Bem-vindo ${tenant?.slug === 'medcos' ? 'à' : 'ao'} ${getTenantDisplayName(tenant)}!`,
        });
        navigate(buildTenantPath(tenantSlug, '/'));
        return;
      }

      // For email/password users, use the edge function
      if (formData.senha !== formData.confirmarSenha) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Creating patient profile via edge function...');
      
      const { data, error } = await supabase.functions.invoke('create-patient-profile', {
        body: {
          nome: formData.nome,
          email: formData.email,
          password: formData.senha,
          dataNascimento: formData.dataNascimento,
          genero: formData.genero,
          cpf: formData.cpf,
          comoConheceu: formData.comoConheceu,
          ehEstudante: formData.ehEstudante === 'estudante',
          instituicaoEnsino: formData.ehEstudante === 'estudante' ? formData.instituicaoEnsino : null,
          telefone: '',
          tenantSlug: tenant?.slug || 'alopsi' // ⭐ Enviar tenant explicitamente
        }
      });

      if (error) {
        console.error('Registration error:', error);
        if (error.message && error.message.includes('User already registered')) {
          toast({
            title: "Erro",
            description: "Este email já está cadastrado. Tente fazer login.",
            variant: "destructive",
          });
          navigate(buildTenantPath(tenantSlug, '/auth'));
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message || "Erro ao realizar cadastro. Tente novamente.",
            variant: "destructive",
          });
        }
        return;
      }

      console.log('Patient profile created successfully:', data);
      console.log('isNewUser:', data.isNewUser, 'confirmationEmailSent:', data.confirmationEmailSent);
      
      // Limpar draft salvo após sucesso
      clearSaved();
      
      // Check if this is a new user that needs email confirmation
      if (data.isNewUser && data.confirmationEmailSent) {
        // ⭐ Salvar foto em sessionStorage antes de mostrar modal
        if (selectedPhotoFile) {
          const reader = new FileReader();
          reader.onloadend = () => {
            sessionStorage.setItem('pendingProfilePhoto', JSON.stringify({
              dataUrl: reader.result,
              fileName: selectedPhotoFile.name,
              fileType: selectedPhotoFile.type,
              email: formData.email
            }));
            console.log('📸 Foto salva em sessionStorage para upload posterior');
          };
          reader.readAsDataURL(selectedPhotoFile);
        }
        
        setShowEmailConfirmationModal(true);
        return;
      }
      
      // Upload foto após login/criação de conta bem-sucedida
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (selectedPhotoFile && currentSession?.user) {
        console.log('📸 Fazendo upload da foto de perfil...');
        
        try {
          const uploadedPhotoUrl = await uploadProfilePhoto(selectedPhotoFile);
          
          if (uploadedPhotoUrl) {
            console.log('✅ Foto carregada, atualizando perfil...');
            
            // Atualizar profiles
            await supabase
              .from('profiles')
              .update({ foto_perfil_url: uploadedPhotoUrl })
              .eq('user_id', currentSession.user.id);
            
            console.log('✅ Foto atualizada com sucesso!');
            
            // ⭐ Limpar sessionStorage após sucesso
            sessionStorage.removeItem('pendingProfilePhoto');
          }
        } catch (uploadError) {
          console.error('Erro no upload da foto:', uploadError);
          toast({
            title: "Aviso",
            description: "Não foi possível carregar a foto, mas o cadastro foi concluído.",
            variant: "default",
          });
        }
      }
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Bem-vindo ${tenant?.slug === 'medcos' ? 'à' : 'ao'} ${getTenantDisplayName(tenant)}!`,
      });
      navigate(buildTenantPath(tenantSlug, '/auth'));

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao realizar cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Você é estudante ou formado? <span className="text-red-500">*</span>
        </Label>
        <RadioGroup 
          value={formData.estudanteStatus} 
          onValueChange={(value) => {
            updateFormData('estudanteStatus', value);
            updateFormData('ehEstudante', value);
          }}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="estudante" id="estudante" />
            <Label htmlFor="estudante" className="cursor-pointer">Sou estudante</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="formado" id="formado" />
            <Label htmlFor="formado" className="cursor-pointer">Sou formado</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep2 = () => (
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
          required
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

  const renderStep3 = () => (
    <div className="space-y-6">
      <InstitutionSelector
        value={formData.instituicaoEnsino}
        onChange={(value) => {
          updateFormData('instituicaoEnsino', value);
          updateFormData('instituicao', value);
        }}
      />

      <div>
        <Label htmlFor="comoConheceu">Como conheceu {tenant?.slug === 'medcos' ? 'a' : 'o'} {getTenantDisplayName(tenant)}?</Label>
        <Select value={formData.comoConheceu} onValueChange={(value) => updateFormData('comoConheceu', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="bg-background">
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

  const renderStep3_5 = () => {
    const previewAvatar = selectedPhotoFile 
      ? URL.createObjectURL(selectedPhotoFile)
      : photoPreviewUrl || formData.fotoPerfilUrl;

    return (
      <div className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-32 w-32 border-4 border-primary/20">
            <AvatarImage src={previewAvatar} />
            <AvatarFallback className="text-2xl">
              {formData.nome ? formData.nome.slice(0, 2).toUpperCase() : <Camera className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Adicione uma foto de perfil
            </p>
            <p className="text-xs text-muted-foreground max-w-[280px] mt-1">
              {selectedPhotoFile 
                ? '✓ Foto selecionada. Ela será salva após finalizar o cadastro.' 
                : 'Esta etapa é opcional, mas ajuda os profissionais a reconhecê-lo'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <PhotoUpload
            onPhotoSelected={(file) => {
              if (!file) return;

              // Validar tipo
              if (!file.type.startsWith('image/')) {
                toast({
                  title: "Erro",
                  description: "Por favor, selecione apenas arquivos de imagem.",
                  variant: "destructive",
                });
                return;
              }

              // Validar tamanho (10MB)
              if (file.size > 10 * 1024 * 1024) {
                toast({
                  title: "Erro",
                  description: "Arquivo muito grande. Máximo 10MB.",
                  variant: "destructive",
                });
                return;
              }

              // Armazenar arquivo
              setSelectedPhotoFile(file);
              
              // Criar preview
              const previewUrl = URL.createObjectURL(file);
              setPhotoPreviewUrl(previewUrl);
              updateFormData('fotoPerfilUrl', previewUrl);
              
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
              {selectedPhotoFile.name}
            </Badge>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Dica:</strong> Esta etapa é opcional. Você pode pular e adicionar uma foto depois no seu perfil.
          </p>
        </div>

        {/* Botão Pular */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="text-muted-foreground hover:text-foreground"
          >
            Pular por enquanto →
          </Button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
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
        {formData.confirmarSenha && formData.senha !== formData.confirmarSenha && (
          <p className="text-sm text-red-500 mt-1">As senhas não coincidem</p>
        )}
      </div>
    </div>
  );

  const canProceedStep1 = formData.estudanteStatus !== '';
  const canProceedStep2 = formData.nome && formData.email && formData.dataNascimento && formData.genero && formData.cpf;
  const canProceedStep3 = (formData.estudanteStatus === 'formado' || formData.instituicaoEnsino);
  const canProceedStep3_5 = true; // Foto é sempre opcional
  const canProceedStep4 = user ? true : (formData.senha && formData.confirmarSenha && formData.senha === formData.confirmarSenha);
  const canSubmit = user ? canProceedStep3_5 : canProceedStep4;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-1 bg-primary mx-auto mb-4"></div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Cadastro de Paciente</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Quero ser atendido
            </h1>
            <p className="text-muted-foreground">
              Complete o cadastro para ter acesso a atendimento psicológico especializado
            </p>
          </div>

          <Card>
            <CardHeader>
              {/* Auto-save indicator */}
              {!user && currentStep < totalSteps && (
                <div className="flex justify-end mb-4">
                  <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                </div>
              )}
              <TimelineProgress
                currentStep={currentStep}
                totalSteps={totalSteps}
                onStepClick={handleStepClick}
                stepTitles={user ? ['Perfil', 'Dados Pessoais', 'Informações', 'Foto'] : ['Perfil', 'Dados Pessoais', 'Informações', 'Foto', 'Senha']}
              />
              <CardTitle className="text-center text-xl">
                {currentStep === 1 ? 'Defina seu perfil' :
                 currentStep === 2 ? 'Seus dados pessoais' :
                 currentStep === 3 ? 'Informações adicionais' :
                 currentStep === 4 ? '📸 Foto de perfil (opcional)' :
                 'Defina sua senha'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep3_5()}
              {currentStep === 5 && renderStep4()}

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
                    onClick={handleNext}
                    disabled={
                      (currentStep === 1 && !canProceedStep1) ||
                      (currentStep === 2 && !canProceedStep2) ||
                      (currentStep === 3 && !canProceedStep3) ||
                      (currentStep === 4 && !canProceedStep3_5)
                    }
                    className="flex items-center gap-2"
                  >
                    Prosseguir
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm">
              Caso já possua conta, {' '}
              <button 
                onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'))}
                className="text-primary hover:underline font-medium"
              >
                clique aqui
              </button>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />

      <ExistingAccountModal 
        isOpen={showExistingAccountModal}
        onClose={() => setShowExistingAccountModal(false)}
        email={formData.email}
      />
      
      <EmailConfirmationModal
        isOpen={showEmailConfirmationModal}
        onClose={() => setShowEmailConfirmationModal(false)}
        email={formData.email}
      />
    </div>
  );
};

export default PatientForm;