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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck, ArrowRight, Clock, Shield, Calendar } from 'lucide-react';
import { parseISODateLocal } from '@/lib/utils';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

interface AuthChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  bookingData: {
    professionalName: string;
    date: string;
    time: string;
    price: string;
  };
}

const AuthChoiceModal: React.FC<AuthChoiceModalProps> = ({
  isOpen,
  onClose,
  onContinueAsGuest,
  bookingData
}) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  const [selectedOption, setSelectedOption] = useState<'login' | 'guest' | null>(null);

  const handleLoginChoice = () => {
    // Salvar dados do agendamento no sessionStorage para recuperar após login
    sessionStorage.setItem('pendingBooking', JSON.stringify({
      professionalId: new URLSearchParams(window.location.search).get('professionalId'),
      professionalName: bookingData.professionalName,
      date: bookingData.date,
      time: bookingData.time,
      price: bookingData.price,
      returnTo: window.location.pathname + window.location.search
    }));
    
    navigate(buildTenantPath(tenantSlug, '/auth'));
  };

  const handleGuestChoice = () => {
    onContinueAsGuest();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Como você gostaria de continuar?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Para finalizar seu agendamento com <strong>{bookingData.professionalName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {/* Opção: Fazer Login */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedOption === 'login' ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setSelectedOption('login')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Entrar na minha conta</CardTitle>
              <CardDescription>
                Já tenho conta ou quero criar uma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span>Histórico de agendamentos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Dados salvos e seguros</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>Reagendamentos fáceis</span>
                </div>
              </div>
              <Badge variant="secondary" className="w-full justify-center">
                Recomendado
              </Badge>
            </CardContent>
          </Card>

          {/* Opção: Continuar como Visitante */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedOption === 'guest' ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setSelectedOption('guest')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Continuar como visitante</CardTitle>
              <CardDescription>
                Não quero criar conta agora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Agendamento rápido</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                  <span>Sem cadastro necessário</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Confirmação apenas por email
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo do Agendamento */}
        <div className="bg-muted/30 p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Resumo do seu agendamento:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Data:</span>
              <span>{parseISODateLocal(bookingData.date).toLocaleDateString('pt-BR')}</span>
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

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          
          {selectedOption === 'login' && (
            <Button 
              onClick={handleLoginChoice}
              className="flex-1 btn-gradient"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          )}
          
          {selectedOption === 'guest' && (
            <Button 
              onClick={handleGuestChoice}
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continuar como Visitante
            </Button>
          )}
          
          {!selectedOption && (
            <Button 
              disabled
              className="flex-1"
            >
              Selecione uma opção
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthChoiceModal;