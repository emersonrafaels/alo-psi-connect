import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Video, CheckCircle, XCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminTenantProvider, useAdminTenant } from '@/contexts/AdminTenantContext';
import { AdminTenantSelector } from '@/components/admin/AdminTenantSelector';

interface TestResult {
  success: boolean;
  meetLink?: string;
  eventId?: string;
  error?: string;
  details?: any;
}

function GoogleCalendarTestsContent() {
  const { toast } = useToast();
  const { tenantFilter, tenants } = useAdminTenant();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  
  const [formData, setFormData] = useState({
    patientName: 'Paciente Teste',
    patientEmail: 'paciente@teste.com',
    consultDate: new Date().toISOString().split('T')[0],
    consultTime: '10:00',
    duration: '50',
    professionalName: 'Dr. Teste',
    professionalEmail: 'profissional@teste.com',
    notes: 'Consulta de teste do sistema Google Calendar'
  });

  const selectedTenant = tenants.find(t => t.id === tenantFilter);

  const handleCreateEvent = async () => {
    if (!tenantFilter) {
      toast({
        title: "Erro",
        description: "Selecione um tenant antes de criar o evento",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Montar payload do agendamento
      const agendamentoId = crypto.randomUUID();
      const payload = {
        agendamento: {
          id: agendamentoId,
          tenant_id: tenantFilter,
          nome_paciente: formData.patientName,
          email_paciente: formData.patientEmail,
          data_consulta: formData.consultDate,
          horario: formData.consultTime,
          observacoes: formData.notes,
          professional_id: 1, // ID fictício para teste
        },
        professional: {
          display_name: formData.professionalName,
          user_email: formData.professionalEmail
        },
        duration_minutes: parseInt(formData.duration)
      };

      console.log('📤 Criando evento de teste:', payload);

      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: payload
      });

      console.log('📥 Resposta da edge function:', { data, error });

      if (error) {
        setResult({
          success: false,
          error: error.message,
          details: error
        });
        toast({
          title: "Erro ao criar evento",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.error) {
        setResult({
          success: false,
          error: data.error,
          details: data
        });
        toast({
          title: "Erro ao criar evento",
          description: data.error,
          variant: "destructive"
        });
      } else {
        setResult({
          success: true,
          meetLink: data?.meeting_link,
          eventId: data?.event_id,
          details: data
        });
        toast({
          title: "Evento criado com sucesso!",
          description: "Link do Google Meet gerado.",
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar evento:', error);
      setResult({
        success: false,
        error: error.message || 'Erro desconhecido',
        details: error
      });
      toast({
        title: "Erro",
        description: `Falha ao criar evento: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Testes - Google Calendar</h1>
            <p className="text-muted-foreground">
              Teste a criação de eventos e links do Google Meet
            </p>
          </div>
        </div>
        <AdminTenantSelector />
      </div>

      {!tenantFilter && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione um tenant usando o seletor no topo da página para começar os testes.
          </AlertDescription>
        </Alert>
      )}

      {tenantFilter && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Criar Evento de Teste</CardTitle>
                  <CardDescription>
                    Preencha os dados abaixo para testar a criação de um evento no Google Calendar
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-base">
                  {selectedTenant?.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nome do Paciente</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientEmail">Email do Paciente</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultDate">Data da Consulta</Label>
                  <Input
                    id="consultDate"
                    type="date"
                    value={formData.consultDate}
                    onChange={(e) => setFormData({ ...formData, consultDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultTime">Horário</Label>
                  <Input
                    id="consultTime"
                    type="time"
                    value={formData.consultTime}
                    onChange={(e) => setFormData({ ...formData, consultTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração da Consulta</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="50">50 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professionalName">Nome do Profissional</Label>
                  <Input
                    id="professionalName"
                    value={formData.professionalName}
                    onChange={(e) => setFormData({ ...formData, professionalName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professionalEmail">Email do Profissional</Label>
                  <Input
                    id="professionalEmail"
                    type="email"
                    value={formData.professionalEmail}
                    onChange={(e) => setFormData({ ...formData, professionalEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleCreateEvent} 
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando evento...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Criar Evento de Teste
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className={result.success ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-green-600">Evento Criado com Sucesso!</CardTitle>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-red-600">Erro ao Criar Evento</CardTitle>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success ? (
                  <>
                    {result.meetLink && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Link do Google Meet:</Label>
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <Video className="h-4 w-4 text-green-600" />
                          <a 
                            href={result.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:underline flex-1 truncate"
                          >
                            {result.meetLink}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(result.meetLink, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {result.eventId && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Event ID:</Label>
                        <div className="p-3 bg-muted rounded-lg">
                          <code className="text-sm">{result.eventId}</code>
                        </div>
                      </div>
                    )}

                    {result.details && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Detalhes da Resposta:</Label>
                        <div className="p-3 bg-muted rounded-lg overflow-auto max-h-48">
                          <pre className="text-xs">{JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-red-600">Mensagem de Erro:</Label>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-900">{result.error}</p>
                      </div>
                    </div>

                    {result.details && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Detalhes do Erro:</Label>
                        <div className="p-3 bg-muted rounded-lg overflow-auto max-h-48">
                          <pre className="text-xs">{JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function GoogleCalendarTests() {
  return (
    <AdminTenantProvider>
      <GoogleCalendarTestsContent />
    </AdminTenantProvider>
  );
}
