import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath, getTenantDisplayName } from '@/utils/tenantHelpers';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordResetForm } from '@/components/PasswordResetForm';
import { EmailConfirmationForm } from '@/components/EmailConfirmationForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailResend } from '@/hooks/useEmailResend';
import { Eye, EyeOff, Mail } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [searchParams] = useSearchParams();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { resendEmailConfirmation, loading: resendLoading } = useEmailResend();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  
  const { user } = useAuth();

  // Verificar se é modo de reset de senha ou confirmação de email
  const isResetMode = searchParams.get('reset') === 'true';
  const isConfirmMode = searchParams.get('confirm') === 'true';
  const token = searchParams.get('token');
  
  // Check for confirmation message in URL params
  const showConfirmationMessage = searchParams.get('message') === 'confirmation-sent';

  useEffect(() => {
    // Se usuário já está logado, redirecionar para home ou página anterior
    if (user) {
      // Verificar se há URL anterior salva
      const returnTo = sessionStorage.getItem('authReturnTo')
      const pendingBooking = sessionStorage.getItem('pendingBooking')
      
      if (returnTo) {
        sessionStorage.removeItem('authReturnTo')
        navigate(returnTo, { replace: true })
      } else if (pendingBooking) {
        const booking = JSON.parse(pendingBooking)
        navigate(booking.returnTo || buildTenantPath(tenantSlug, '/confirmacao-agendamento'), { replace: true })
      } else {
        navigate(buildTenantPath(tenantSlug, '/'))
      }
      return;
    }
  }, [user, navigate]);


  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking email:', error);
      return null;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user is in deleted_users table before attempting login
      const { data: deletedUser, error: deletedUserError } = await supabase
        .from('deleted_users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (deletedUser) {
        toast({
          title: "Conta não encontrada",
          description: "Esta conta não existe mais no sistema.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Detectar erro de email não confirmado
        if (error.message.includes('Email not confirmed')) {
          setEmailNotConfirmed(true);
          toast({
            title: "Email não confirmado",
            description: "Você precisa confirmar seu email antes de fazer login.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Se for erro de credenciais inválidas, verificar se email existe
        if (error.message.includes('Invalid login credentials')) {
          const emailCheck = await checkEmailExists(email);
          
          if (emailCheck && !emailCheck.exists) {
            // Email não existe - sugerir criar conta
            toast({
              title: "Email não cadastrado",
              description: "Este email não está cadastrado. Deseja criar uma conta?",
              variant: "destructive",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(buildTenantPath(tenantSlug, '/cadastro/tipo-usuario'))}
                  className="ml-auto"
                >
                  Criar conta
                </Button>
              ),
            });
            setLoading(false);
            return;
          } else {
            // Email existe mas senha está incorreta
            toast({
              title: "Senha incorreta",
              description: "A senha informada está incorreta. Esqueceu sua senha?",
              variant: "destructive",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await supabase.functions.invoke('send-password-reset', {
                        body: { email, tenantId: tenant?.id }
                      });
                      toast({
                        title: "Email enviado!",
                        description: "Verifique sua caixa de entrada para redefinir sua senha.",
                      });
                    } catch (error) {
                      console.error('Password reset error:', error);
                    }
                  }}
                  className="ml-auto"
                >
                  Recuperar senha
                </Button>
              ),
            });
            setLoading(false);
            return;
          }
        }
        
        throw error;
      }

      // Limpar estado de email não confirmado se login for bem-sucedido
      setEmailNotConfirmed(false);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });
      
      // Verificar se há URL anterior ou agendamento pendente
      const returnTo = sessionStorage.getItem('authReturnTo')
      const pendingBooking = sessionStorage.getItem('pendingBooking')
      
      if (returnTo) {
        sessionStorage.removeItem('authReturnTo')
        navigate(returnTo, { replace: true })
      } else if (pendingBooking) {
        const booking = JSON.parse(pendingBooking)
        navigate(booking.returnTo || buildTenantPath(tenantSlug, '/confirmacao-agendamento'), { replace: true })
      } else {
        navigate(buildTenantPath(tenantSlug, '/'))
      }
    } catch (error: any) {
      // Fallback para outros tipos de erro
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Digite seu email",
        description: "Por favor, digite seu email no campo acima antes de reenviar a confirmação.",
        variant: "destructive",
      });
      return;
    }

    const result = await resendEmailConfirmation(email);
    if (result.success) {
      setEmailNotConfirmed(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro no login com Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Se estiver em modo reset, mostrar apenas o formulário de reset
  if (isResetMode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Redefinir senha
              </h1>
              <p className="text-muted-foreground">
                Digite sua nova senha abaixo
              </p>
            </div>

            <PasswordResetForm token={token || undefined} />
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Se estiver em modo confirmação de email, mostrar apenas o formulário de confirmação
  if (isConfirmMode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Confirmação de Email
              </h1>
              <p className="text-muted-foreground">
                Confirmando sua conta...
              </p>
            </div>

            <EmailConfirmationForm token={token || undefined} />
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo {tenant?.slug === 'medcos' ? 'à' : 'ao'} {getTenantDisplayName(tenant)}!
            </h1>
            <p className="text-muted-foreground">
              Entre ou crie sua conta para continuar
            </p>
          </div>

          {/* Show confirmation message if needed */}
          {showConfirmationMessage && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Email de confirmação enviado!</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Verifique sua caixa de entrada e clique no link para ativar sua conta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Faça seu login</CardTitle>
              <CardDescription className="text-center">
                Entre com suas credenciais para acessar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Sua senha"
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
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={async () => {
                      if (!email) {
                        toast({
                          title: "Digite seu email",
                          description: "Por favor, digite seu email no campo acima antes de recuperar a senha.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        setLoading(true);
                        
                        const { data, error } = await supabase.functions.invoke('send-password-reset', {
                          body: { email, tenantId: tenant?.id }
                        });

                        if (error) throw error;

                        toast({
                          title: "Email enviado!",
                          description: "Se o email existir, você receberá instruções de recuperação.",
                          variant: "default",
                        });
                      } catch (error: any) {
                        console.error('Password reset error:', error);
                        toast({
                          title: "Erro ao enviar email",
                          description: "Não foi possível enviar o email de recuperação. Tente novamente.",
                          variant: "destructive",
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Esqueci minha senha"}
                  </Button>
                </div>
              </form>
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou continue com
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ainda não tem uma conta?
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(buildTenantPath(tenantSlug, '/cadastro/tipo-usuario'))}
                  >
                    Criar conta gratuitamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerta para email não confirmado */}
          {emailNotConfirmed && (
            <Alert className="mt-4">
              <Mail className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Seu email ainda não foi confirmado. Verifique sua caixa de entrada.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="ml-4"
                >
                  {resendLoading ? "Enviando..." : "Reenviar"}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;