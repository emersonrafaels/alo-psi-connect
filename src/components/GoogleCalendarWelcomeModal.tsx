import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration';
import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';

interface GoogleCalendarWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleCalendarWelcomeModal: React.FC<GoogleCalendarWelcomeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isConnected, setIsConnected] = React.useState(false);

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  const handleContinue = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Bem-vindo à plataforma!
          </DialogTitle>
          <DialogDescription>
            Para uma melhor experiência, recomendamos conectar sua agenda do Google Calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Privacidade</h4>
                    <p className="text-sm text-green-700">A permissão compartilha apenas a situação dos horários como Livre ou Ocupado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Economia de tempo</h4>
                    <p className="text-sm text-blue-700">Não precisa gerenciar dois calendários separadamente.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Melhor experiência</h4>
                    <p className="text-sm text-purple-700">Pacientes veem apenas horários realmente disponíveis.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900">Sincronização automática</h4>
                    <p className="text-sm text-orange-700">Atualização em tempo real dos seus horários.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Componente de integração */}
          <GoogleCalendarIntegration
            isConnected={isConnected}
            onConnectionChange={handleConnectionChange}
          />

          {/* Nota sobre privacidade */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Privacidade garantida:</strong> Apenas informações de disponibilidade são sincronizadas. 
              Não acessamos o conteúdo dos seus eventos pessoais.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleContinue}>
            {isConnected ? 'Continuar' : 'Conectar mais tarde'}
          </Button>
          {isConnected && (
            <Button onClick={handleContinue}>
              Finalizar configuração
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};