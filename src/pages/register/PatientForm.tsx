import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Check, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ExistingAccountModal } from '@/components/ExistingAccountModal';
import { EmailConfirmationModal } from '@/components/EmailConfirmationModal';

const PatientForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const googleData = location.state?.googleData || null;

  const [formData, setFormData] = useState({
    ehEstudante: '',
    estudanteStatus: '', // Changed from ehEstudante to match function
    nome: googleData?.fullName || '',
    email: user?.email || googleData?.email || '',
    dataNascimento: '',
    genero: '',
    cpf: '',
    instituicaoEnsino: '',
    instituicao: '', // Added for consistency
    comoConheceu: '',
    senha: '',
    confirmarSenha: '',
    password: '', // Added for edge function compatibility
    telefone: '' // Added for edge function compatibility
  });

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
  const totalSteps = user ? 3 : 4; // 4 passos se não há usuário logado (inclui senha)
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
            existingUserId: session.user.id // Pass existing user ID for Google users
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

        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Bem-vindo ao Alô, Psi!",
        });
        navigate('/');
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
          telefone: ''
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
          navigate('/auth');
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
      
      // Check if this is a new user that needs email confirmation
      if (data.isNewUser && data.confirmationEmailSent) {
        setShowEmailConfirmationModal(true);
      } else {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Bem-vindo ao Alô, Psi!",
        });
        navigate('/auth');
      }

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

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="instituicaoEnsino">
          Instituição de ensino {formData.estudanteStatus === 'estudante' && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="instituicaoEnsino"
          value={formData.instituicaoEnsino}
          onChange={(e) => {
            updateFormData('instituicaoEnsino', e.target.value);
            updateFormData('instituicao', e.target.value);
          }}
          placeholder="Nome da sua instituição de ensino"
          required={formData.estudanteStatus === 'estudante'}
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
  const canProceedStep4 = user ? true : (formData.senha && formData.confirmarSenha && formData.senha === formData.confirmarSenha);
  const canSubmit = user ? canProceedStep3 : canProceedStep4;

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
              <ProgressIndicator 
                currentStep={currentStep} 
                totalSteps={totalSteps} 
                stepLabels={user ? ['Perfil', 'Dados Pessoais', 'Finalização'] : ['Perfil', 'Dados Pessoais', 'Informações', 'Senha']}
                className="mb-6"
              />
              <CardTitle className="text-center text-xl">
                {currentStep === 1 ? 'Defina seu perfil' :
                 currentStep === 2 ? 'Seus dados pessoais' :
                 currentStep === 3 ? 'Informações adicionais' :
                 'Defina sua senha'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}

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
                      (currentStep === 3 && !canProceedStep3)
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