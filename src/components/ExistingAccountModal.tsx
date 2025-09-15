import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExistingAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const ExistingAccountModal: React.FC<ExistingAccountModalProps> = ({
  isOpen,
  onClose,
  email,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sendingReset, setSendingReset] = React.useState(false);

  const handleLogin = () => {
    // Salvar dados do formulário no sessionStorage para recuperar após login
    const pendingProfessionalData = sessionStorage.getItem('pendingProfessionalData');
    const pendingPatientData = sessionStorage.getItem('pendingPatientData');
    
    if (pendingProfessionalData || pendingPatientData) {
      sessionStorage.setItem('continueRegistration', 'true');
    }
    
    onClose();
    navigate('/auth');
  };

  const handleForgotPassword = async () => {
    try {
      setSendingReset(true);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Se o email existir, você receberá instruções de recuperação.",
        variant: "default",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de recuperação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Conta já existe
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Este email já está cadastrado no sistema. Faça login para continuar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 p-2">
          <div className="text-center text-muted-foreground mb-6">
            <p>Já existe uma conta cadastrada com o email:</p>
            <p className="font-medium text-foreground mt-1">{email}</p>
          </div>

          <div className="space-y-3">
            <Card 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
              onClick={handleLogin}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Fazer Login</h3>
                  <p className="text-sm text-muted-foreground">
                    Acesse sua conta existente
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-orange-500/20"
              onClick={handleForgotPassword}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Key className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Esqueci minha senha</h3>
                  <p className="text-sm text-muted-foreground">
                    Receber email para redefinir senha
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleLogin}
              className="flex-1"
              disabled={sendingReset}
            >
              <User className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
            
            <Button 
              onClick={handleForgotPassword}
              variant="outline"
              className="flex-1"
              disabled={sendingReset}
            >
              <Key className="h-4 w-4 mr-2" />
              {sendingReset ? "Enviando..." : "Recuperar Senha"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};