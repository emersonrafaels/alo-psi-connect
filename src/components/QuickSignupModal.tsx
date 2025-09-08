import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface QuickSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess: () => void;
  bookingData: {
    professionalName: string;
    date: string;
    time: string;
    price: string;
  };
}

const QuickSignupModal: React.FC<QuickSignupModalProps> = ({
  isOpen,
  onClose,
  onSignupSuccess,
  bookingData
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite seu nome completo.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite seu email.",
        variant: "destructive"
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um email válido.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: formData.name
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Que tal fazer login?",
            variant: "destructive"
          });
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // Create profile immediately if user is confirmed
        if (authData.user.email_confirmed_at) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              nome: formData.name,
              email: formData.email,
              tipo_usuario: 'paciente'
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }

        toast({
          title: "Conta criada com sucesso!",
          description: "Você foi automaticamente conectado.",
        });

        onSignupSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    // Save booking data for after login
    sessionStorage.setItem('pendingBooking', JSON.stringify({
      professionalId: new URLSearchParams(window.location.search).get('professionalId'),
      professionalName: bookingData.professionalName,
      date: bookingData.date,
      time: bookingData.time,
      price: bookingData.price,
      returnTo: window.location.pathname + window.location.search
    }));
    
    navigate('/auth');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Criar conta rapidamente
          </DialogTitle>
          <DialogDescription className="text-center">
            Apenas 3 campos para finalizar seu agendamento com <strong>{bookingData.professionalName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.password && (
                  <PasswordStrengthIndicator password={formData.password} />
                )}
              </div>

              {/* Resumo do Agendamento */}
              <div className="bg-muted/30 p-3 rounded-lg border text-sm">
                <div className="font-medium mb-1">Resumo do agendamento:</div>
                <div className="text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Data:</span>
                    <span>{new Date(bookingData.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Horário:</span>
                    <span>{bookingData.time}</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Valor:</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(parseFloat(bookingData.price))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    "Criando conta..."
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Criar conta e continuar
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleLoginRedirect}
                    disabled={loading}
                    className="text-sm"
                  >
                    Já tenho uma conta - Fazer login
                  </Button>
                </div>

                <Button 
                  type="button"
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSignupModal;