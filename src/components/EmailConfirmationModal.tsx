import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmailResend } from '@/hooks/useEmailResend';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const EmailConfirmationModal = ({ isOpen, onClose, email }: EmailConfirmationModalProps) => {
  const navigate = useNavigate();
  const { loading, resendEmailConfirmation } = useEmailResend();
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    const result = await resendEmailConfirmation(email);
    if (result.success) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }
  };

  const handleGoToLogin = () => {
    onClose();
    navigate('/auth');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            Email de confirmação enviado!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Enviamos um email de confirmação para:
          </p>
          
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-foreground">{email}</p>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Para ativar sua conta:</p>
            <ol className="list-decimal list-inside space-y-1 text-left">
              <li>Verifique sua caixa de entrada</li>
              <li>Se não encontrar, verifique a pasta de spam</li>
              <li>Clique no link de confirmação no email</li>
            </ol>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleResendEmail} 
              variant="outline" 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : resendSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Email reenviado!
                </>
              ) : (
                'Reenviar email'
              )}
            </Button>
            
            <Button onClick={handleGoToLogin} className="w-full">
              Ir para o login
            </Button>
            
            <Button 
              onClick={onClose} 
              variant="ghost" 
              className="w-full text-muted-foreground"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};