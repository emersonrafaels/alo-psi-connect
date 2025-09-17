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
import { ChevronLeft, ChevronRight, Eye, EyeOff, Check, Clock } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Badge } from '@/components/ui/badge';
import { useProfileManager } from '@/hooks/useProfileManager';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { SpecialtiesSelector } from '@/components/SpecialtiesSelector';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

import { ExistingAccountModal } from '@/components/ExistingAccountModal';
import { EmailConfirmationModal } from '@/components/EmailConfirmationModal';

const ProfessionalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { saveGooglePhoto, uploadProfilePhoto } = useProfileManager();
  const googleData = location.state?.googleData || null;

  const [formData, setFormData] = useState({
    nome: googleData?.fullName || '',
    email: user?.email || googleData?.email || '',
    dataNascimento: '',
    genero: '',
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

  const totalSteps = 7;
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
    try {
      let currentUser = user;
      
      // Se não há usuário logado, verificar se email já existe antes de criar conta
      if (!currentUser) {
        const emailCheck = await checkEmailExists(formData.email);
        if (emailCheck?.exists) {
          // Salvar dados do formulário
          sessionStorage.setItem('pendingProfessionalData', JSON.stringify(formData));
          setShowExistingAccountModal(true);
          setLoading(false);
          return;
        }

        // Criar a conta - sem email automático do Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
          options: {
            // Desabilitar envio automático de email de confirmação
            data: {
              skip_confirmation: true
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar conta');
        
        currentUser = authData.user;
        
        // Aguardar um pouco para garantir que a autenticação seja processada
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Verificar se o usuário está realmente autenticado
      const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
      if (!authenticatedUser && !currentUser) {
        throw new Error('Erro na autenticação. Tente novamente.');
      }

      const userToUse = authenticatedUser || currentUser;

      // Upload da foto se foi selecionada
      let uploadedPhotoUrl = formData.fotoPerfilUrl;
      if (selectedPhotoFile) {
        console.log('🔄 Fazendo upload da foto após autenticação...', { fileName: selectedPhotoFile.name, fileSize: selectedPhotoFile.size });
        
        try {
          uploadedPhotoUrl = await uploadProfilePhoto(selectedPhotoFile);
          if (uploadedPhotoUrl) {
            console.log('✅ Foto carregada com sucesso:', uploadedPhotoUrl);
            // Garantir que a foto seja incluída nos dados
            setFormData(prev => ({ ...prev, fotoPerfilUrl: uploadedPhotoUrl! }));
          } else {
            console.warn('❌ Falha no upload da foto - função retornou null');
          }
        } catch (error) {
          console.error('❌ Erro durante upload da foto:', error);
          uploadedPhotoUrl = null;
        }
      } else if (formData.fotoPerfilUrl && formData.fotoPerfilUrl.startsWith('http')) {
        // Se há uma URL de foto do Google, tentar salvá-la
        console.log('🔄 Salvando foto do Google...', formData.fotoPerfilUrl);
        try {
          uploadedPhotoUrl = await saveGooglePhoto(formData.fotoPerfilUrl);
          if (uploadedPhotoUrl) {
            console.log('✅ Foto do Google salva com sucesso:', uploadedPhotoUrl);
          }
        } catch (error) {
          console.error('❌ Erro ao salvar foto do Google:', error);
        }
      }

      console.log('📸 URL final da foto:', uploadedPhotoUrl);

      // Preparar dados para a edge function
      const profileData = {
        nome: formData.nome,
        email: formData.email,
        data_nascimento: formData.dataNascimento || null,
        genero: formData.genero || null,
        cpf: formData.cpf || null,
        como_conheceu: formData.comoConheceu || null,
        tipo_usuario: 'profissional',
        foto_perfil_url: uploadedPhotoUrl || null
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
        foto_perfil_url: uploadedPhotoUrl || null,
        possui_e_psi: formData.possuiEPsi === 'sim',
        servicos_raw: formData.especialidades.length > 0 ? formData.especialidades.join(', ') : null,
        preco_consulta: formData.precoConsulta ? parseFloat(formData.precoConsulta) : null,
        tempo_consulta: 50, // Fixado em 50 minutos
        ativo: true
      };

      const horariosData = formData.horarios.map(horario => ({
        day: horario.day,
        startTime: horario.startTime,
        endTime: horario.endTime,
        duration: horario.duration || 30
      }));

      console.log('📤 Enviando dados para edge function:', { 
        userId: userToUse.id, 
        profileHasPhoto: !!profileData.foto_perfil_url,
        professionalHasPhoto: !!professionalData.foto_perfil_url,
        photoUrl: uploadedPhotoUrl
      });

      // Usar edge function para criar perfil com privilégios administrativos
      const { data, error } = await supabase.functions.invoke('create-professional-profile', {
        body: {
          userId: userToUse.id,
          profileData,
          professionalData,
          horariosData: horariosData.length > 0 ? horariosData : null
        }
      });

      if (error) throw new Error(error.message || 'Erro ao criar perfil');
      if (!data?.success) throw new Error('Erro no processamento do cadastro');

      // Check if this is a new user that needs email confirmation
      if (data.isNewUser && data.confirmationEmailSent) {
        setShowEmailConfirmationModal(true);
      } else {
        toast({
          title: "Cadastro Finalizado!",
          description: "Seu perfil profissional foi criado com sucesso. Bem-vindo(a) à nossa plataforma!",
        });
        // Redirecionar para login após cadastro bem-sucedido
        navigate('/auth');
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

        <div>
          <Label htmlFor="dataNascimento">Data de nascimento <span className="text-red-500">*</span></Label>
          <Input
            id="dataNascimento"
            type="date"
            value={formData.dataNascimento}
            onChange={(e) => updateFormData('dataNascimento', e.target.value)}
            required
          />
        </div>

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
          <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
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
            <p className="text-sm text-red-500 mt-1">CPF deve ter 11 dígitos no formato XXX.XXX.XXX-XX</p>
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
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Psicólogo" id="psicologo" />
            <Label htmlFor="psicologo" className="cursor-pointer">Psicólogo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Psiquiatra" id="psiquiatra" />
            <Label htmlFor="psiquiatra" className="cursor-pointer">Psiquiatra</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Psicoterapeuta" id="psicoterapeuta" />
            <Label htmlFor="psicoterapeuta" className="cursor-pointer">Psicoterapeuta</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">
          Possui E-Psi? <span className="text-red-500">*</span>
        </Label>
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
      </div>

      <div>
        <Label htmlFor="crpCrm">
          Número do {formData.profissao === 'Psiquiatra' ? 'CRM' : 'CRP'} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="crpCrm"
          value={formData.crpCrm}
          onChange={(e) => updateFormData('crpCrm', e.target.value)}
          placeholder={`Digite seu número do ${formData.profissao === 'Psiquiatra' ? 'CRM' : 'CRP'}`}
          required
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
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

      <div>
        <Label htmlFor="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          value={formData.linkedin}
          onChange={(e) => updateFormData('linkedin', e.target.value)}
          placeholder="https://linkedin.com/in/seu-perfil"
        />
      </div>

      <div>
        <Label htmlFor="comoConheceu">Como conheceu o Alô, Psi?</Label>
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

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="resumoProfissional">Escreva seu resumo profissional <span className="text-red-500">*</span></Label>
        <p className="text-sm text-muted-foreground mb-3">
          Descreva sua experiência, especializações e abordagem terapêutica. Este texto será exibido no seu perfil público.
        </p>
        <Textarea
          id="resumoProfissional"
          value={formData.resumoProfissional}
          onChange={(e) => updateFormData('resumoProfissional', e.target.value)}
          placeholder="Descreva sua experiência, especializações e abordagem terapêutica..."
          rows={6}
          required
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <SpecialtiesSelector
        value={formData.especialidades}
        onChange={(especialidades) => updateFormData('especialidades', especialidades)}
      />
      
      <div>
        <Label htmlFor="precoConsulta" className="text-base font-medium">
          Preço da Consulta (R$) <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Informe o valor que você cobra por consulta (50 minutos).
        </p>
        <Input
          id="precoConsulta"
          type="number"
          step="0.01"
          min="0"
          value={formData.precoConsulta}
          onChange={(e) => updateFormData('precoConsulta', e.target.value)}
          placeholder="Ex: 120.00"
          required
        />
      </div>
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
          Após finalizar o cadastro, você será automaticamente logado e poderá conectar sua agenda do Google Calendar 
          para uma melhor gestão dos seus horários.
        </p>
      </div>
    </div>
  );


  const canProceedStep1 = formData.nome && formData.email && formData.dataNascimento && formData.genero && formData.cpf;
  const canProceedStep2 = formData.profissao && formData.possuiEPsi && formData.crpCrm;
  const canProceedStep3 = true; // Campos opcionais
  const canProceedStep4 = formData.resumoProfissional; // Resumo é obrigatório
  const canProceedStep5 = formData.especialidades.length > 0 && formData.precoConsulta;
  const canProceedStep6 = formData.intervaloHorarios && formData.horarios.length > 0;
  const canSubmit = formData.senha && formData.senha.length >= 6 && formData.confirmarSenha && formData.senha === formData.confirmarSenha; // Credenciais na última etapa

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

          <Card>
            <CardHeader>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Passo {currentStep} de {totalSteps}</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}% concluído</span>
                </div>
                
                {/* Timeline horizontal distribuída */}
                <div className="flex items-center justify-between w-full">
                  {[
                    { number: 1, title: 'Dados\nPessoais', completed: currentStep > 1 },
                    { number: 2, title: 'Profissão', completed: currentStep > 2 },
                    { number: 3, title: 'Perfil', completed: currentStep > 3 },
                    { number: 4, title: 'Resumo', completed: currentStep > 4 },
                    { number: 5, title: 'Especialidades', completed: currentStep > 5 },
                    { number: 6, title: 'Horários', completed: currentStep > 6 },
                    { number: 7, title: 'Credenciais', completed: currentStep > 7 }
                  ].map((step, index) => (
                    <div key={step.number} className="flex flex-col items-center relative">
                      {/* Linha de conexão */}
                      {index < 6 && (
                        <div 
                          className={`absolute top-4 left-8 w-full h-0.5 -z-10 
                            ${step.completed ? 'bg-primary' : 'bg-muted'}`} 
                          style={{ width: 'calc(100vw / 7 - 2rem)' }}
                        />
                      )}
                      
                      {/* Círculo do step */}
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all cursor-pointer hover:scale-105 mb-2
                          ${step.completed 
                            ? 'bg-primary text-primary-foreground' 
                            : currentStep === step.number
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                          }`}
                        onClick={() => setCurrentStep(step.number)}
                      >
                        {step.completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step.number
                        )}
                      </div>
                      
                      {/* Nome do step */}
                      <span 
                        className={`text-xs text-center whitespace-pre-line leading-tight cursor-pointer
                          ${step.completed || currentStep === step.number 
                            ? 'text-primary font-medium' 
                            : 'text-muted-foreground'
                          }`}
                        onClick={() => setCurrentStep(step.number)}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <CardTitle className="text-center text-xl">
                 {currentStep === 1 ? 'Seus dados pessoais' :
                  currentStep === 2 ? 'Informações profissionais' :
                  currentStep === 3 ? 'Perfil e contatos' :
                  currentStep === 4 ? 'Resumo profissional' :
                  currentStep === 5 ? 'Suas especialidades' :
                  currentStep === 6 ? 'Horários de atendimento' :
                  'Credenciais de acesso'}
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
                      (currentStep === 4 && !canProceedStep4) ||
                      (currentStep === 5 && !canProceedStep5) ||
                      (currentStep === 6 && !canProceedStep6)
                    }
                    variant="teal"
                    className="flex items-center gap-2"
                  >
                    Prosseguir
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    variant="teal"
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