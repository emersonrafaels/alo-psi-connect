import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Professional {
  id: number;
  display_name: string;
  foto_perfil_url: string | null;
  profissao: string | null;
}

interface Appointment {
  id: string;
  data_consulta: string;
  horario: string;
  status: string;
  payment_status: string;
  valor: number;
  observacoes: string | null;
  coupon_id: string | null;
  professional_id: number;
  profissionais?: Professional;
}

interface CouponUsage {
  id: string;
  coupon_id: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  used_at: string;
  appointment_id: string | null;
  institution_coupons?: {
    code: string;
    name: string;
  };
}

export interface TimelineEvent {
  id: string;
  type: 'appointment' | 'coupon_used' | 'cancellation';
  date: Date;
  title: string;
  description: string;
  professional?: {
    id: number;
    name: string;
    photo_url: string | null;
    profession: string | null;
  };
  appointment?: Appointment;
  coupon?: CouponUsage;
  status: 'confirmed' | 'cancelled' | 'pending' | 'completed';
  amount?: {
    original: number;
    discount: number;
    final: number;
  };
}

export interface UserStorytellingData {
  appointments: Appointment[];
  couponsUsed: CouponUsage[];
  metrics: {
    totalAppointments: number;
    futureAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    attendanceRate: number;
    totalSpent: number;
    totalSavings: number;
  };
  timeline: TimelineEvent[];
}

export const useUserStorytellingData = (userId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-storytelling', userId],
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');

      // Buscar agendamentos
      const { data: appointments, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_consulta,
          horario,
          status,
          payment_status,
          valor,
          observacoes,
          coupon_id,
          professional_id,
          profissionais!inner(
            id,
            display_name,
            foto_perfil_url,
            profissao
          )
        `)
        .eq('user_id', userId)
        .order('data_consulta', { ascending: false })
        .order('horario', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Buscar cupons utilizados
      const { data: couponsUsed, error: couponsError } = await supabase
        .from('coupon_usage')
        .select(`
          id,
          coupon_id,
          original_amount,
          discount_amount,
          final_amount,
          used_at,
          appointment_id,
          institution_coupons(
            code,
            name
          )
        `)
        .eq('user_id', userId)
        .order('used_at', { ascending: false });

      if (couponsError) throw couponsError;

      const now = new Date();
      const completed = (appointments || []).filter(
        (a) => new Date(a.data_consulta) < now && a.status === 'confirmado' && a.payment_status === 'paid'
      );
      const future = (appointments || []).filter(
        (a) => new Date(a.data_consulta) >= now
      );
      const cancelled = (appointments || []).filter(
        (a) => a.status === 'cancelado'
      );

      const totalSpent = (appointments || [])
        .filter((a) => a.payment_status === 'paid')
        .reduce((sum, a) => sum + (a.valor || 0), 0);

      const totalSavings = (couponsUsed || []).reduce(
        (sum, c) => sum + c.discount_amount,
        0
      );

      const attendanceRate =
        completed.length + cancelled.length > 0
          ? (completed.length / (completed.length + cancelled.length)) * 100
          : 0;

      // Criar timeline de eventos
      const timeline: TimelineEvent[] = [];

      // Criar um mapa de cupons por appointment_id para lookup rápido
      const couponsByAppointment = new Map(
        (couponsUsed || [])
          .filter(c => c.appointment_id)
          .map(c => [c.appointment_id, c])
      );

      // Adicionar agendamentos à timeline COM cupom incorporado
      (appointments || []).forEach((apt) => {
        const aptDate = new Date(`${apt.data_consulta}T${apt.horario}`);
        const isPast = aptDate < now;
        const isCancelled = apt.status === 'cancelado';
        
        // Buscar cupom associado a este agendamento
        const relatedCoupon = apt.coupon_id ? couponsByAppointment.get(apt.id) : null;

        timeline.push({
          id: apt.id,
          type: isCancelled ? 'cancellation' : 'appointment',
          date: aptDate,
          title: isCancelled
            ? 'Consulta Cancelada'
            : isPast
            ? 'Consulta Realizada'
            : 'Consulta Agendada',
          description: apt.observacoes || '',
          professional: {
            id: apt.profissionais.id,
            name: apt.profissionais.display_name,
            photo_url: apt.profissionais.foto_perfil_url,
            profession: apt.profissionais.profissao,
          },
          appointment: apt,
          coupon: relatedCoupon || undefined,
          status: isCancelled
            ? 'cancelled'
            : isPast
            ? 'completed'
            : apt.payment_status === 'paid'
            ? 'confirmed'
            : 'pending',
          amount: relatedCoupon ? {
            original: relatedCoupon.original_amount,
            discount: relatedCoupon.discount_amount,
            final: relatedCoupon.final_amount,
          } : {
            original: apt.valor || 0,
            discount: 0,
            final: apt.valor || 0,
          },
        });
      });

      // Ordenar timeline por data (mais recente primeiro)
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

      const storytellingData: UserStorytellingData = {
        appointments: appointments || [],
        couponsUsed: couponsUsed || [],
        metrics: {
          totalAppointments: (appointments || []).length,
          futureAppointments: future.length,
          completedAppointments: completed.length,
          cancelledAppointments: cancelled.length,
          attendanceRate: Math.round(attendanceRate),
          totalSpent,
          totalSavings,
        },
        timeline,
      };

      return storytellingData;
    },
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    error,
  };
};
