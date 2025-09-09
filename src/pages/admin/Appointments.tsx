import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, Mail, Phone, Eye, Filter } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  nome_paciente: string;
  email_paciente: string;
  telefone_paciente: string;
  data_consulta: string;
  horario: string;
  status: string;
  payment_status: string;
  valor: number;
  observacoes?: string;
  created_at: string;
  professional: {
    display_name: string;
    profissao: string;
  };
}

const statusColors = {
  'pendente': 'secondary',
  'confirmado': 'default',
  'cancelado': 'destructive',
  'realizado': 'outline'
} as const;

const paymentStatusColors = {
  'pending_payment': 'secondary',
  'paid': 'default',
  'failed': 'destructive',
  'refunded': 'outline'
} as const;

type PaymentStatus = 'pending_payment' | 'paid' | 'failed';

const Appointments = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['admin-appointments', statusFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from('agendamentos')
        .select(`
          *,
          profissionais!inner(display_name, profissao)
        `)
        .order('data_consulta', { ascending: false })
        .order('horario', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (paymentFilter !== 'all' && paymentFilter !== 'refunded') {
        query = query.eq('payment_status', paymentFilter as PaymentStatus);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data?.map(appointment => ({
        ...appointment,
        professional: appointment.profissionais
      })) as Appointment[];
    }
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pendente': 'Pendente',
      'confirmado': 'Confirmado',
      'cancelado': 'Cancelado',
      'realizado': 'Realizado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels = {
      'pending_payment': 'Pagamento Pendente',
      'paid': 'Pago',
      'failed': 'Falha no Pagamento',
      'refunded': 'Reembolsado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os agendamentos da plataforma
            </p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os agendamentos da plataforma
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Status do Agendamento</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Status do Pagamento</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os pagamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os pagamentos</SelectItem>
                    <SelectItem value="pending_payment">Pagamento Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="failed">Falha no Pagamento</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <div className="space-y-4">
          {appointments?.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{appointment.nome_paciente}</CardTitle>
                    <CardDescription>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {appointment.professional.display_name} - {appointment.professional.profissao}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={statusColors[appointment.status as keyof typeof statusColors] || 'secondary'}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                    <Badge variant={paymentStatusColors[appointment.payment_status as keyof typeof paymentStatusColors] || 'secondary'}>
                      {getPaymentStatusLabel(appointment.payment_status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(appointment.data_consulta)}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatTime(appointment.horario)}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{appointment.email_paciente}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{appointment.telefone_paciente}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {appointment.valor ? `R$ ${appointment.valor.toFixed(2)}` : 'Valor não informado'}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Agendamento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Paciente</label>
                            <p className="text-sm">{appointment.nome_paciente}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Profissional</label>
                            <p className="text-sm">{appointment.professional.display_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Data</label>
                            <p className="text-sm">{formatDate(appointment.data_consulta)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Horário</label>
                            <p className="text-sm">{formatTime(appointment.horario)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm">{appointment.email_paciente}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                            <p className="text-sm">{appointment.telefone_paciente}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <Badge variant={statusColors[appointment.status as keyof typeof statusColors] || 'secondary'} className="ml-2">
                              {getStatusLabel(appointment.status)}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Pagamento</label>
                            <Badge variant={paymentStatusColors[appointment.payment_status as keyof typeof paymentStatusColors] || 'secondary'} className="ml-2">
                              {getPaymentStatusLabel(appointment.payment_status)}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Valor</label>
                            <p className="text-sm font-semibold">
                              {appointment.valor ? `R$ ${appointment.valor.toFixed(2)}` : 'Não informado'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                            <p className="text-sm">{formatDate(appointment.created_at)}</p>
                          </div>
                        </div>
                        {appointment.observacoes && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Observações</label>
                            <p className="text-sm mt-1 p-3 bg-muted rounded-md">{appointment.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {appointments?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-muted-foreground text-center">
                Não há agendamentos que correspondam aos filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Appointments;