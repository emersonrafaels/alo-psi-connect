import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';

const ProfessionalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    email: user?.email || '',
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
    confirmarSenha: ''
  });

  const totalSteps = 4;
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
          tipo_usuario: 'profissional'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Criar dados específicos do profissional
      const { error: professionalError } = await supabase
        .from('profissionais')
        .insert({
          profile_id: profile.id,
          user_id: parseInt(user.id), // Converter para integer conforme schema existente
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
          ativo: false // Aguardando aprovação
        });

      if (professionalError) throw professionalError;

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu perfil será analisado e em breve estará disponível na plataforma.",
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
      <div className="grid gap-4">
        <div>
          <Label htmlFor="nome">Nome completo <span className="text-red-500">*</span></Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => updateFormData('nome', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            required
            disabled
          />
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
      <PhotoUpload
        onPhotoUploaded={(url) => updateFormData('fotoPerfilUrl', url)}
        currentPhotoUrl={formData.fotoPerfilUrl}
        label="Foto de Perfil"
      />

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
        <Label htmlFor="resumoProfissional">Escreva o resumo profissional <span className="text-red-500">*</span></Label>
        <Textarea
          id="resumoProfissional"
          value={formData.resumoProfissional}
          onChange={(e) => updateFormData('resumoProfissional', e.target.value)}
          placeholder="Descreva sua experiência, especializações e abordagem terapêutica..."
          rows={4}
          required
        />
      </div>

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

  const canProceedStep1 = formData.nome && formData.email && formData.dataNascimento && formData.genero && formData.cpf;
  const canProceedStep2 = formData.profissao && formData.possuiEPsi && formData.crpCrm;
  const canProceedStep3 = true; // Campos opcionais
  const canSubmit = formData.resumoProfissional && formData.senha && formData.confirmarSenha && formData.senha === formData.confirmarSenha;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Quero atender
            </h1>
            <p className="text-muted-foreground">
              Cadastre-se no formulário abaixo e faça parte da comunidade Alô, Psi!
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl">Cadastro</CardTitle>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Etapa {currentStep} - {
                      currentStep === 1 ? 'Dados Pessoais' :
                      currentStep === 2 ? 'Dados Profissionais' :
                      currentStep === 3 ? 'Perfil e Contatos' :
                      'Resumo e Senha'
                    }
                  </span>
                  <span>Passo {currentStep} de {totalSteps}</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>
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
    </div>
  );
};

export default ProfessionalForm;