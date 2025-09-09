import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Webhook, Bot, Mail, CreditCard, ExternalLink, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface N8NWizardProps {
  onComplete: (config: any) => void;
}

const STEPS = [
  { id: 'intro', title: 'O que é N8N?', icon: Bot },
  { id: 'setup', title: 'Configuração Básica', icon: Webhook },
  { id: 'templates', title: 'Templates de Payload', icon: Mail },
  { id: 'test', title: 'Teste e Validação', icon: CheckCircle }
];

const WEBHOOK_TEMPLATES = {
  booking: {
    name: 'Agendamento Criado',
    description: 'Enviado quando um novo agendamento é criado',
    template: {
      event: 'appointment_created',
      timestamp: '{{timestamp}}',
      appointment: {
        id: '{{appointment.id}}',
        patient_name: '{{appointment.nome_paciente}}',
        patient_email: '{{appointment.email_paciente}}',
        patient_phone: '{{appointment.telefone_paciente}}',
        professional_name: '{{professional.display_name}}',
        professional_email: '{{professional.user_email}}',
        date: '{{appointment.data_consulta}}',
        time: '{{appointment.horario}}',
        value: '{{appointment.valor}}',
        status: '{{appointment.status}}'
      }
    }
  },
  payment: {
    name: 'Status de Pagamento',
    description: 'Enviado quando o status de pagamento é atualizado',
    template: {
      event: 'payment_updated',
      timestamp: '{{timestamp}}',
      appointment: {
        id: '{{appointment.id}}',
        payment_status: '{{appointment.payment_status}}',
        patient_email: '{{appointment.email_paciente}}',
        value: '{{appointment.valor}}'
      }
    }
  },
  chat: {
    name: 'Chat do Assistente IA',
    description: 'Enviado para processar mensagens do chat',
    template: {
      event: 'ai_chat_message',
      timestamp: '{{timestamp}}',
      session_id: '{{session_id}}',
      user: {
        message: '{{user_message}}',
        context: '{{context}}',
        page: '{{page}}',
        filters: '{{filters}}'
      },
      professionals: '{{professionals}}',
      platform: 'alopsi'
    }
  }
};

export const N8NWizard = ({ onComplete }: N8NWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState({
    booking_webhook_url: '',
    payment_webhook_url: '',
    chat_webhook_url: '',
    chat_enabled: false,
    chat_timeout_seconds: 30,
    chat_fallback_openai: true
  });
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const copyTemplate = async (template: any, type: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
      setCopiedTemplate(type);
      setTimeout(() => setCopiedTemplate(null), 2000);
      toast({
        title: "Template copiado!",
        description: "Template foi copiado para a área de transferência"
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o template",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Intro
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Bot className="mx-auto h-16 w-16 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">O que é N8N?</h3>
                <p className="text-muted-foreground">
                  N8N é uma plataforma de automação que permite conectar diferentes serviços e APIs
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center p-4">
                  <Mail className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                  <h4 className="font-medium">Notificações</h4>
                  <p className="text-sm text-muted-foreground">
                    Envie emails e SMS automaticamente
                  </p>
                </Card>
                <Card className="text-center p-4">
                  <Webhook className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-medium">Integrações</h4>
                  <p className="text-sm text-muted-foreground">
                    Conecte com CRMs, ERPs e outras APIs
                  </p>
                </Card>
                <Card className="text-center p-4">
                  <Bot className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                  <h4 className="font-medium">IA Personalizada</h4>
                  <p className="text-sm text-muted-foreground">
                    Use modelos de IA customizados
                  </p>
                </Card>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Como funciona na AloPsi:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Quando um agendamento é criado → N8N envia notificação</li>
                  <li>• Quando um pagamento é processado → N8N atualiza CRM</li>
                  <li>• Quando o chat IA é usado → N8N processa com modelo customizado</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4" />
                <span>Saiba mais em: </span>
                <a href="https://n8n.io" target="_blank" className="text-primary hover:underline">
                  n8n.io
                </a>
              </div>
            </div>
          </div>
        );

      case 1: // Setup
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Configuração de Webhooks</h3>
              <p className="text-muted-foreground mb-4">
                Configure as URLs dos seus workflows N8N
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="booking_url">Webhook de Agendamentos</Label>
                <Input
                  id="booking_url"
                  placeholder="https://seu-n8n.com/webhook/booking"
                  value={config.booking_webhook_url}
                  onChange={(e) => setConfig(prev => ({ ...prev, booking_webhook_url: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Será chamado quando um novo agendamento for criado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_url">Webhook de Pagamentos</Label>
                <Input
                  id="payment_url"
                  placeholder="https://seu-n8n.com/webhook/payment"
                  value={config.payment_webhook_url}
                  onChange={(e) => setConfig(prev => ({ ...prev, payment_webhook_url: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Será chamado quando o status de pagamento mudar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat_url">Webhook do Chat IA (Opcional)</Label>
                <Input
                  id="chat_url"
                  placeholder="https://seu-n8n.com/webhook/chat"
                  value={config.chat_webhook_url}
                  onChange={(e) => setConfig(prev => ({ ...prev, chat_webhook_url: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Use para processar chat com IA customizada
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-1">💡 Dica de Segurança</h4>
              <p className="text-sm text-yellow-700">
                Use HTTPS e configure autenticação nos seus webhooks N8N para maior segurança
              </p>
            </div>
          </div>
        );

      case 2: // Templates
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Templates de Payload</h3>
              <p className="text-muted-foreground mb-4">
                Estruturas de dados que serão enviadas para cada webhook
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(WEBHOOK_TEMPLATES).map(([key, template]) => (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyTemplate(template.template, key)}
                      >
                        {copiedTemplate === key ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copiedTemplate === key ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(template.template, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">📋 Como usar</h4>
              <p className="text-sm text-blue-700">
                Os valores entre {`{{chaves}}`} serão substituídos pelos dados reais quando o webhook for chamado
              </p>
            </div>
          </div>
        );

      case 3: // Test
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Teste e Validação</h3>
              <p className="text-muted-foreground mb-4">
                Verifique se suas configurações estão funcionando
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo da Configuração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Webhook de Agendamentos:</span>
                    <Badge variant={config.booking_webhook_url ? "default" : "secondary"}>
                      {config.booking_webhook_url ? "Configurado" : "Não configurado"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Webhook de Pagamentos:</span>
                    <Badge variant={config.payment_webhook_url ? "default" : "secondary"}>
                      {config.payment_webhook_url ? "Configurado" : "Não configurado"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Chat IA Customizado:</span>
                    <Badge variant={config.chat_webhook_url ? "default" : "secondary"}>
                      {config.chat_webhook_url ? "Habilitado" : "Desabilitado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                      <span>Crie os workflows correspondentes no seu N8N</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                      <span>Configure as URLs dos webhooks nos workflows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                      <span>Teste os webhooks usando os botões "Testar" nas configurações</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                      <span>Monitore os logs para garantir que tudo está funcionando</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: return true; // Always complete
      case 1: return config.booking_webhook_url || config.payment_webhook_url || config.chat_webhook_url;
      case 2: return true; // Always complete
      case 3: return true; // Always complete
      default: return false;
    }
  };

  const canProceed = () => {
    return isStepComplete(currentStep);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Assistente de Configuração N8N</CardTitle>
            <CardDescription>
              Configure suas integrações N8N passo a passo
            </CardDescription>
          </div>
          <Badge variant="outline">
            Passo {currentStep + 1} de {STEPS.length}
          </Badge>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between pt-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted bg-background'
                }`}>
                  {isStepComplete(index) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs mt-2 text-center max-w-16">
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <Separator className="flex-1 mx-4" />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStep()}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
              disabled={!canProceed()}
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => onComplete(config)}
              disabled={!canProceed()}
            >
              Finalizar Configuração
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};