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
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PatientForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const googleData = location.state?.googleData || null;

  const [formData, setFormData] = useState({
    ehEstudante: '',
    nome: googleData?.fullName || '',
    email: user?.email || googleData?.email || '',
    dataNascimento: '',
    genero: '',
    cpf: '',
    instituicaoEnsino: '',
    comoConheceu: ''
  });

  const totalSteps = 3;
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
    if (!user) return;

    setLoading(true);
    try {
      // Criar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          nome: formData.nome,
          email: formData.email,
          data_nascimento: formData.dataNascimento,
          genero: formData.genero,
          cpf: formData.cpf,
          como_conheceu: formData.comoConheceu,
          tipo_usuario: 'paciente'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Criar dados específicos do paciente
      const { error: patientError } = await supabase
        .from('pacientes')
        .insert({
          profile_id: profile.id,
          eh_estudante: formData.ehEstudante === 'estudante',
          instituicao_ensino: formData.instituicaoEnsino
        });

      if (patientError) throw patientError;

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao Alô, Psi!",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Você é estudante ou formado? <span className="text-red-500">*</span>
        </Label>
        <RadioGroup 
          value={formData.ehEstudante} 
          onValueChange={(value) => updateFormData('ehEstudante', value)}
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
              disabled
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
          Instituição de ensino {formData.ehEstudante === 'estudante' && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="instituicaoEnsino"
          value={formData.instituicaoEnsino}
          onChange={(e) => updateFormData('instituicaoEnsino', e.target.value)}
          placeholder="Nome da sua instituição de ensino"
          required={formData.ehEstudante === 'estudante'}
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

  const canProceedStep1 = formData.ehEstudante !== '';
  const canProceedStep2 = formData.nome && formData.email && formData.dataNascimento && formData.genero && formData.cpf;
  const canSubmit = canProceedStep2 && (formData.ehEstudante === 'formado' || formData.instituicaoEnsino);

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
                stepLabels={['Perfil', 'Dados Pessoais', 'Finalização']}
                className="mb-6"
              />
              <CardTitle className="text-center text-xl">
                {currentStep === 1 ? 'Defina seu perfil' :
                 currentStep === 2 ? 'Seus dados pessoais' :
                 'Informações adicionais'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

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
                      (currentStep === 2 && !canProceedStep2)
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
    </div>
  );
};

export default PatientForm;