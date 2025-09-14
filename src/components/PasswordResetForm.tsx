import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

interface PasswordResetFormProps {
  token?: string;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Token recebido:', token);
    
    if (!token) {
      toast({
        title: "Token inválido",
        description: "O link de recuperação é inválido ou expirou.",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!doPasswordsMatch) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Verificando token no banco:', token);
      
      // Verificar se o token é válido
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      console.log('Resultado da consulta:', { tokenData, tokenError });

      if (tokenError || !tokenData) {
        console.error('Token inválido:', tokenError);
        toast({
          title: "Token inválido",
          description: "O link de recuperação é inválido ou expirou.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar a senha do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Marcar o token como usado
      const { error: markUsedError } = await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);

      if (markUsedError) {
        console.error('Error marking token as used:', markUsedError);
      }

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi redefinida. Você será redirecionado para o login.",
      });

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro ao redefinir senha",
        description: "Ocorreu um erro. Tente novamente ou solicite um novo link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Redefinir senha</CardTitle>
        <CardDescription className="text-center">
          Digite sua nova senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua nova senha"
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
            
            {password && (
              <PasswordStrengthIndicator password={password} className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirme sua nova senha"
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
            
            {confirmPassword && (
              <div className="flex items-center space-x-2 text-sm">
                {doPasswordsMatch ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Senhas coincidem</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Senhas não coincidem</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isPasswordValid || !doPasswordsMatch}
          >
            {loading ? "Atualizando..." : "Redefinir senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};