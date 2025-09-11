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
import { ChevronLeft, ChevronRight, Eye, EyeOff, Check } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Badge } from '@/components/ui/badge';
import { useProfileManager } from '@/hooks/useProfileManager';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { SpecialtiesSelector } from '@/components/SpecialtiesSelector';
import { GoogleCalendarWelcomeModal } from '@/components/GoogleCalendarWelcomeModal';

const ProfessionalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGoogleCalendarModal, setShowGoogleCalendarModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { saveGooglePhoto } = useProfileManager();
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
    intervaloHorarios: '30' // 30 ou 60 minutos
  });

  // Salvar foto do Google automaticamente se disponível
  useEffect(() => {
    const saveGoogleProfilePhoto = async () => {
      if (googleData?.picture && !formData.fotoPerfilUrl) {
        const photoUrl = await saveGooglePhoto(googleData.picture);
        if (photoUrl) {
          setFormData(prev => ({ ...prev, fotoPerfilUrl: photoUrl }));
        }
      }
    };

    saveGoogleProfilePhoto();
  }, [googleData, saveGooglePhoto, formData.fotoPerfilUrl]);

  const totalSteps = 7;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleNext = () => {
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
      
      // Se não há usuário logado, criar a conta primeiro
      if (!currentUser) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar conta');
        
        currentUser = authData.user;
      }

      // Criar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: currentUser.id,
          nome: formData.nome,
          email: formData.email,
          data_nascimento: formData.dataNascimento,
          genero: formData.genero,
          cpf: formData.cpf,
          como_conheceu: formData.comoConheceu,
          tipo_usuario: 'profissional'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Criar dados específicos do profissional
      const { data: professional, error: professionalError } = await supabase
        .from('profissionais')
        .insert({
          profile_id: profile.id,
          user_id: parseInt(currentUser.id), // Converter para integer conforme schema existente
          display_name: formData.nome,
          user_email: formData.email,
          user_login: formData.email,
          first_name: formData.nome.split(' ')[0],
          last_name: formData.nome.split(' ').slice(1).join(' '),
          profissao: formData.profissao,
          crp_crm: formData.crpCrm,
          cpf: formData.cpf,
          linkedin: formData.linkedin,
          resumo_profissional: formData.resumoProfissional,
          foto_perfil_url: formData.fotoPerfilUrl,
          possui_e_psi: formData.possuiEPsi === 'sim',
          servicos_raw: formData.especialidades.join(', '), // Salvar especialidades
          ativo: false // Aguardando aprovação
        })
        .select()
        .single();

      if (professionalError) throw professionalError;

      // Salvar horários de atendimento
      if (formData.horarios.length > 0) {
        const horariosFormatted = formData.horarios.map(horario => ({
          user_id: parseInt(currentUser.id),
          day: horario.day,
          start_time: horario.startTime,
          end_time: horario.endTime,
          minutos_janela: horario.duration
        }));

        const { error: horariosError } = await supabase
          .from('profissionais_sessoes')
          .insert(horariosFormatted);

        if (horariosError) throw horariosError;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu perfil será analisado e em breve estará disponível na plataforma.",
      });

      // Mostrar modal do Google Calendar ao invés de navegar diretamente
      setShowGoogleCalendarModal(true);
    } catch (error: any) {
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
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            onChange={(e) => updateFormData('cpf', e.target.value)}
            placeholder="000.000.000-00"
            required
          />
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
          onPhotoUploaded={(url) => updateFormData('fotoPerfilUrl', url)}
          currentPhotoUrl={formData.fotoPerfilUrl}
          label="Foto de Perfil"
        />
        {googleData?.picture && formData.fotoPerfilUrl && (
          <Badge variant="secondary" className="text-xs">
            <Check className="h-3 w-3 mr-1" />
            Foto importada do Google
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
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Configuração de Intervalos <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha o intervalo entre os horários disponíveis para agendamento.
        </p>
        <RadioGroup 
          value={formData.intervaloHorarios} 
          onValueChange={(value) => updateFormData('intervaloHorarios', value)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="30" id="intervalo-30" />
            <Label htmlFor="intervalo-30" className="cursor-pointer">
              <div>
                <div className="font-medium">30 em 30 minutos</div>
                <div className="text-sm text-muted-foreground">Ex: 10:00, 10:30, 11:00, 11:30...</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="60" id="intervalo-60" />
            <Label htmlFor="intervalo-60" className="cursor-pointer">
              <div>
                <div className="font-medium">1 em 1 hora</div>
                <div className="text-sm text-muted-foreground">Ex: 10:00, 11:00, 12:00, 13:00...</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <ScheduleSelector
        value={formData.horarios}
        onChange={(horarios) => updateFormData('horarios', horarios)}
        intervalMinutes={parseInt(formData.intervaloHorarios)}
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
  const canProceedStep5 = formData.especialidades.length > 0;
  const canProceedStep6 = formData.intervaloHorarios && formData.horarios.length > 0;
  const canSubmit = formData.senha && formData.confirmarSenha && formData.senha === formData.confirmarSenha; // Credenciais na última etapa

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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Passo {currentStep} de {totalSteps}</span>
                  <span className="text-sm text-muted-foreground">100% concluído</span>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { number: 1, title: 'Dados Pessoais', completed: currentStep > 1 },
                    { number: 2, title: 'Profissão', completed: currentStep > 2 },
                    { number: 3, title: 'Perfil', completed: currentStep > 3 },
                    { number: 4, title: 'Resumo', completed: currentStep > 4 },
                    { number: 5, title: 'Especialidades', completed: currentStep > 5 },
                    { number: 6, title: 'Horários', completed: currentStep > 6 },
                    { number: 7, title: 'Credenciais', completed: currentStep > 7 }
                  ].map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all cursor-pointer hover:scale-105
                          ${step.completed || currentStep === step.number
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }`}
                        onClick={() => setCurrentStep(step.number)}
                        title={step.title}
                      >
                        {step.completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step.number
                        )}
                      </div>
                      {index < 6 && (
                        <div className={`h-1 w-8 ${step.completed ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground mt-2">
                  {currentStep === 1 ? 'Dados Pessoais' :
                   currentStep === 2 ? 'Profissão' :
                   currentStep === 3 ? 'Perfil' :
                   currentStep === 4 ? 'Resumo' :
                   currentStep === 5 ? 'Especialidades' :
                   currentStep === 6 ? 'Horários' :
                   'Credenciais'}
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

      {/* Modal do Google Calendar após cadastro */}
      <GoogleCalendarWelcomeModal
        isOpen={showGoogleCalendarModal}
        onClose={() => {
          setShowGoogleCalendarModal(false);
          navigate('/');
        }}
      />
    </div>
  );
};

export default ProfessionalForm;