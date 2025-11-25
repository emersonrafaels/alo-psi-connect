import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserStorytellingData } from '@/hooks/useUserStorytellingData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  DollarSign,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserStorytellingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userType: 'patient' | 'professional';
}

export function UserStorytellingModal({
  open,
  onOpenChange,
  userId,
  userName,
  userType,
}: UserStorytellingModalProps) {
  const { data, isLoading } = useUserStorytellingData(userId);

  if (!open) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Realizada</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Histórico de Uso - {userName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {userType === 'patient' ? 'Paciente' : 'Profissional'}
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !data ? (
          <div className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum dado encontrado para este usuário.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Visão Geral</TabsTrigger>
              <TabsTrigger value="coupons">
                Cupons ({data.couponsUsed.length})
              </TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-6">
              {/* Métricas */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">
                          {data.metrics.totalAppointments}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Taxa de Comparecimento
                        </p>
                        <p className="text-2xl font-bold">
                          {data.metrics.attendanceRate}%
                        </p>
                      </div>
                      {data.metrics.attendanceRate >= 80 ? (
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Gasto
                        </p>
                        <p className="text-2xl font-bold">
                          R$ {data.metrics.totalSpent.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Economia
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {data.metrics.totalSavings.toFixed(2)}
                        </p>
                      </div>
                      <Tag className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline de Atividades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.timeline.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma atividade registrada
                      </p>
                    ) : (
                      data.timeline.map((event) => (
                        <div
                          key={event.id}
                          className="flex gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {getStatusIcon(event.status)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{event.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(event.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                              {getStatusBadge(event.status)}
                            </div>

                            {event.professional && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={event.professional.photo_url || ''}
                                  />
                                  <AvatarFallback>
                                    {event.professional.name
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {event.professional.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {event.professional.profession}
                                  </p>
                                </div>
                              </div>
                            )}

                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}

                            {event.coupon && (
                              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-1">
                                  <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                    Cupom Aplicado: {event.coupon.institution_coupons?.code}
                                  </p>
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  {event.coupon.institution_coupons?.name}
                                </p>
                              </div>
                            )}

                            {event.amount && (
                              <div className="flex items-center gap-4 text-sm">
                                {event.amount.discount > 0 ? (
                                  <>
                                    <span className="line-through text-muted-foreground">
                                      R$ {event.amount.original.toFixed(2)}
                                    </span>
                                    <Badge variant="secondary" className="gap-1">
                                      <Tag className="h-3 w-3" />
                                      -R$ {event.amount.discount.toFixed(2)}
                                    </Badge>
                                    <span className="font-semibold text-green-600">
                                      R$ {event.amount.final.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-semibold">
                                    R$ {event.amount.final.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coupons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cupons Utilizados</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.couponsUsed.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum cupom utilizado
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {data.couponsUsed.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="flex items-center gap-4">
                            <Tag className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-semibold">
                                {coupon.institution_coupons?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Código: {coupon.institution_coupons?.code}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Usado em{' '}
                                {format(new Date(coupon.used_at), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground line-through">
                              R$ {coupon.original_amount.toFixed(2)}
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              R$ {coupon.final_amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-green-600">
                              Economia: R$ {coupon.discount_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo de Consultas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">
                        {data.metrics.totalAppointments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Realizadas</span>
                      <span className="font-bold text-green-600">
                        {data.metrics.completedAppointments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Futuras</span>
                      <span className="font-bold text-blue-600">
                        {data.metrics.futureAppointments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Canceladas</span>
                      <span className="font-bold text-red-600">
                        {data.metrics.cancelledAppointments}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Gasto</span>
                      <span className="font-bold">
                        R$ {data.metrics.totalSpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Economia com Cupons
                      </span>
                      <span className="font-bold text-green-600">
                        R$ {data.metrics.totalSavings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cupons Usados</span>
                      <span className="font-bold">
                        {data.couponsUsed.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Taxa de Comparecimento
                      </span>
                      <span
                        className={`font-bold ${
                          data.metrics.attendanceRate >= 80
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {data.metrics.attendanceRate}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
