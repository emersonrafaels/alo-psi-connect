import { useEffect, useState } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import Header from "@/components/ui/header"
import Footer from "@/components/ui/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, DollarSign, User, ArrowLeft, CreditCard, MapPin, Phone, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useUserProfile } from "@/hooks/useUserProfile"
import { parseISODateLocal } from '@/lib/utils';
import { useBookingTracking } from "@/hooks/useBookingTracking"
import { useAuthRedirect } from "@/hooks/useAuthRedirect"
import { supabase } from "@/integrations/supabase/client"
import QuickSignupModal from "@/components/QuickSignupModal"
import { useTenant } from "@/hooks/useTenant"
import { buildTenantPath } from "@/utils/tenantHelpers"
import { CouponValidator } from "@/components/CouponValidator"
import { useCouponTracking } from "@/hooks/useCouponTracking"


interface BookingData {
  professionalId: string
  professionalName: string
  date: string
  time: string
  price: string
}

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const { saveCurrentLocationAndRedirect } = useAuthRedirect()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const { trackEvent } = useBookingTracking(bookingData?.professionalId)
  const { tenant } = useTenant()
  const tenantSlug = tenant?.slug || 'alopsi'
  const { recordCouponUsage } = useCouponTracking()
  const [loading, setLoading] = useState(false)
  const [showQuickSignup, setShowQuickSignup] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  })

  useEffect(() => {
    const professionalId = searchParams.get('professionalId')
    const professionalName = searchParams.get('professionalName')
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const price = searchParams.get('price')

    if (professionalId && professionalName && date && time && price) {
      setBookingData({
        professionalId,
        professionalName,
        date,
        time,
        price
      })

      // Verificar se há dados de agendamento pendente (usuário retornou após login)
      const pendingBooking = sessionStorage.getItem('pendingBooking')
      if (pendingBooking) {
        sessionStorage.removeItem('pendingBooking')
      }
    }
  }, [searchParams])

  // Verificar se precisa mostrar modal de escolha de autenticação
  // Pré-preencher dados do usuário logado
  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.nome || prev.name,
        email: profile.email || prev.email,
        phone: prev.phone // telefone não está no perfil atualmente
      }))
      
      trackEvent({
        event_name: 'user_data_prefilled',
        event_data: { 
          user_id: user.id,
          profile_complete: !!(profile.nome && profile.email)
        }
      })
    }
  }, [user, profile])

  const handleSignupSuccess = () => {
    // User is now authenticated, we can proceed with the booking
    setShowQuickSignup(false);
  };

  // Verificar se precisa mostrar modal de cadastro rápido
  useEffect(() => {
    if (bookingData && !user) {
      setShowQuickSignup(true)
    }
  }, [bookingData, user])

  const getDayLabel = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira', 
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    }
    return dayMap[day] || day
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    if (!numPrice || numPrice === 0) return 'Consultar'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const handleCouponApplied = (discount: {
    couponId: string;
    code: string;
    discountAmount: number;
    finalAmount: number;
  }) => {
    setAppliedCoupon(discount)
    trackEvent({
      event_name: 'coupon_applied',
      event_data: { 
        coupon_code: discount.code,
        discount_amount: discount.discountAmount,
        final_amount: discount.finalAmount
      }
    })
    toast({
      title: "Cupom aplicado!",
      description: `Você economizou R$ ${discount.discountAmount.toFixed(2)}`,
    })
  }

  const handleCouponRemoved = () => {
    if (appliedCoupon) {
      trackEvent({
        event_name: 'coupon_removed',
        event_data: { coupon_code: appliedCoupon.code }
      })
    }
    setAppliedCoupon(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Track form submission attempt
    await trackEvent({
      event_name: 'booking_form_submitted',
      event_data: { 
        has_name: !!formData.name,
        has_email: !!formData.email,
        has_phone: !!formData.phone,
        has_notes: !!formData.notes,
        user_logged_in: !!user
      },
      booking_data: bookingData
    })
    
    // Check if user needs authentication
    if (!user) {
      setShowQuickSignup(true);
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      await trackEvent({
        event_name: 'booking_form_validation_failed',
        event_data: { 
          missing_fields: {
            name: !formData.name,
            email: !formData.email,
            phone: !formData.phone
          }
        }
      })
      
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    if (!bookingData) return

    setLoading(true)

    try {
      console.log('=== INÍCIO DO PROCESSO DE AGENDAMENTO ===')
      console.log('User ID:', user?.id)
      console.log('Booking Data:', bookingData)
      console.log('Form Data:', formData)
      
      // Get professional profile_id (UUID) from the profissionais table
      console.log('Buscando dados do profissional...')
      const { data: professionalData, error: professionalError } = await supabase
        .from('profissionais')
        .select('profile_id')
        .eq('id', parseInt(bookingData.professionalId))
        .single()

      if (professionalError || !professionalData?.profile_id) {
        console.error('Erro ao buscar profissional:', professionalError)
        toast({
          title: "Profissional não encontrado",
          description: "O profissional selecionado não foi encontrado. Tente novamente.",
          variant: "destructive"
        })
        return
      }

      console.log('Professional Data encontrado:', professionalData)
      
      // Preparar dados do agendamento
      const finalAmount = appliedCoupon?.finalAmount || parseFloat(bookingData.price)
      const agendamentoData = {
        professional_id: parseInt(bookingData.professionalId),
        nome_paciente: formData.name,
        email_paciente: formData.email,
        telefone_paciente: formData.phone,
        data_consulta: bookingData.date,
        horario: bookingData.time,
        valor: finalAmount,
        observacoes: formData.notes || null,
        status: 'pendente',
        user_id: user?.id,
        coupon_id: appliedCoupon?.couponId || null
      }
      
      console.log('Usuário logado - usando user_id real:', user.id)
      
      console.log('Dados para inserir no agendamento:', agendamentoData)
      
      // Verificar auth.uid() antes do insert
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('Current user from auth:', currentUser)
      console.log('auth.uid():', currentUser?.id)
      console.log('user?.id from hook:', user?.id)
      console.log('Will use user_id:', user?.id)
      
      // 1. Create agendamento in database
      console.log('Criando agendamento na base de dados...')
      console.log('🚀 Dados para inserir:', agendamentoData)
      
      const { data: agendamento, error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert(agendamentoData)
        .select()
        .single()

      if (agendamentoError) {
        console.error('Erro detalhado ao criar agendamento:', {
          error: agendamentoError,
          code: agendamentoError.code,
          message: agendamentoError.message,
          details: agendamentoError.details,
          hint: agendamentoError.hint
        })
        
        // Notificar erro via n8n
        try {
          console.log('🔔 Enviando notificação de erro para n8n...');
          const { data: notifyResult, error: notifyError } = await supabase.functions.invoke('notify-booking-status', {
            body: {
              tipo_evento: 'agendamento_erro',
              paciente: {
                nome: formData.name,
                email: formData.email,
                telefone: formData.phone,
                esta_logado: !!user,
                user_id: user?.id || 'guest'
              },
              profissional: {
                nome: bookingData.professionalName,
                especialidade: 'N/A'
              },
              agendamento: {
                data: bookingData.date,
                horario: bookingData.time,
                valor: parseFloat(bookingData.price),
                status: 'erro'
              },
              erro: {
                codigo: agendamentoError.code || 'UNKNOWN',
                mensagem: agendamentoError.message,
                contexto: 'booking_creation'
              },
              notificacao_para: ['admin', 'dev']
            }
          });
          
          if (notifyError) {
            console.error('❌ Erro ao invocar função n8n:', notifyError);
          } else {
            console.log('✅ Notificação de erro enviada com sucesso:', notifyResult);
          }
        } catch (notifyError) {
          console.error('❌ Erro ao notificar via n8n:', notifyError);
        }
        
        // Tratar diferentes tipos de erro
        if (agendamentoError.code === '42501') {
          toast({
            title: "Erro de permissão",
            description: "Você não tem permissão para criar este agendamento. Tente fazer login ou contate o suporte.",
            variant: "destructive"
          })
        } else if (agendamentoError.message?.includes('row-level security')) {
          toast({
            title: "Erro de segurança",
            description: "Problema de segurança ao criar agendamento. Verifique se você está logado corretamente.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Erro ao criar agendamento",
            description: `Erro: ${agendamentoError.message || 'Erro desconhecido'}. Tente novamente.`,
            variant: "destructive"
          })
        }
        return
      }

      console.log('Agendamento criado com sucesso:', agendamento)
      
      // Registrar uso do cupom se foi aplicado
      if (appliedCoupon) {
        recordCouponUsage({
          couponId: appliedCoupon.couponId,
          appointmentId: agendamento.id,
          originalAmount: parseFloat(bookingData.price),
          discountAmount: appliedCoupon.discountAmount,
          finalAmount: appliedCoupon.finalAmount
        })
        
        trackEvent({
          event_name: 'booking_completed_with_coupon',
          event_data: { 
            coupon_code: appliedCoupon.code,
            discount_amount: appliedCoupon.discountAmount
          }
        })
      }
      
      // Notificar sucesso no agendamento via n8n
      try {
        console.log('🔔 Enviando notificação de sucesso para n8n...');
        const { data: notifyResult, error: notifyError } = await supabase.functions.invoke('notify-booking-status', {
          body: {
            tipo_evento: 'agendamento_sucesso',
            paciente: {
              nome: formData.name,
              email: formData.email,
              telefone: formData.phone,
              esta_logado: !!user,
              user_id: user?.id || 'guest'
            },
            profissional: {
              nome: bookingData.professionalName,
              especialidade: 'N/A'
            },
            agendamento: {
              data: bookingData.date,
              horario: bookingData.time,
              valor: parseFloat(bookingData.price),
              status: 'pendente',
              id: agendamento.id
            },
            notificacao_para: ['paciente', 'profissional', 'admin']
          }
        });
        
        if (notifyError) {
          console.error('❌ Erro ao invocar função n8n:', notifyError);
        } else {
          console.log('✅ Notificação de sucesso enviada:', notifyResult);
        }
      } catch (notifyError) {
        console.error('❌ Erro ao notificar sucesso via n8n:', notifyError);
      }

      // 2. Create MercadoPago payment preference
      console.log('Criando preferência de pagamento...')
      const paymentAmount = appliedCoupon?.finalAmount || parseFloat(bookingData.price)
      const paymentDescription = appliedCoupon 
        ? `Consulta agendada para ${parseISODateLocal(bookingData.date).toLocaleDateString('pt-BR')} às ${bookingData.time} (Cupom ${appliedCoupon.code} aplicado - Economia: R$ ${appliedCoupon.discountAmount.toFixed(2)})`
        : `Consulta agendada para ${parseISODateLocal(bookingData.date).toLocaleDateString('pt-BR')} às ${bookingData.time}`
      
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-mercadopago-payment',
        {
          body: {
            agendamentoId: agendamento.id,
            valor: paymentAmount,
            title: `Consulta com ${bookingData.professionalName}`,
            description: paymentDescription
          }
        }
      )

      if (paymentError) {
        console.error('Erro detalhado ao criar pagamento:', paymentError)
        
        // Notificar erro de pagamento via n8n
        try {
          await supabase.functions.invoke('notify-booking-status', {
            body: {
              tipo_evento: 'pagamento_erro',
              paciente: {
                nome: formData.name,
                email: formData.email,
                telefone: formData.phone,
                esta_logado: !!user,
                user_id: user?.id || 'guest'
              },
              profissional: {
                nome: bookingData.professionalName,
                especialidade: 'N/A'
              },
              agendamento: {
                data: bookingData.date,
                horario: bookingData.time,
                valor: parseFloat(bookingData.price),
                status: 'erro_pagamento',
                id: agendamento.id
              },
              erro: {
                codigo: 'PAYMENT_ERROR',
                mensagem: paymentError.message || 'Erro ao processar pagamento',
                contexto: 'payment_creation'
              },
              notificacao_para: ['admin', 'dev']
            }
          });
        } catch (notifyError) {
          console.error('❌ Erro ao notificar erro de pagamento via n8n:', notifyError);
        }
        
        toast({
          title: "Erro no pagamento",
          description: "Não foi possível processar o pagamento. Tente novamente ou contate o suporte.",
          variant: "destructive"
        })
        return
      }

      console.log('Resposta do pagamento:', paymentData)

      // Track successful payment creation
      await trackEvent({
        event_name: 'payment_created_successfully',
        event_data: { 
          agendamento_id: agendamento.id,
          payment_amount: parseFloat(bookingData.price)
        },
        booking_data: bookingData
      })

      // 3. Redirect to MercadoPago checkout
      if (paymentData?.initPoint) {
        console.log('Redirecionando para MercadoPago:', paymentData.initPoint)
        
        await trackEvent({
          event_name: 'redirecting_to_payment',
          event_data: { 
            payment_url: paymentData.initPoint,
            agendamento_id: agendamento.id
          }
        })
        
        window.location.href = paymentData.initPoint
      } else {
        console.error('URL de pagamento não recebida:', paymentData)
        
        await trackEvent({
          event_name: 'payment_url_error',
          event_data: { 
            error: 'Payment URL not received',
            payment_response: paymentData
          }
        })
        
        toast({
          title: "Erro na URL de pagamento",
          description: "Não foi possível obter a URL de pagamento. Tente novamente.",
          variant: "destructive"
        })
        return
      }
      
    } catch (error) {
      console.error('=== ERRO GERAL NO AGENDAMENTO ===')
      console.error('Erro completo:', error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
      
      // Determinar mensagem de erro mais específica
      let errorMessage = "Ocorreu um erro inesperado ao processar seu agendamento."
      
      if (error instanceof Error) {
        if (error.message.includes('Profissional não encontrado')) {
          errorMessage = "O profissional selecionado não foi encontrado."
        } else if (error.message.includes('pagamento')) {
          errorMessage = "Erro ao processar o pagamento. Tente novamente."
        } else if (error.message.includes('agendamento')) {
          errorMessage = "Erro ao criar o agendamento. Verifique os dados e tente novamente."
        }
      }
      
      toast({
        title: "Erro no agendamento",
        description: errorMessage + " Se o problema persistir, contate o suporte.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      console.log('=== FIM DO PROCESSO DE AGENDAMENTO ===')
    }
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Erro</h1>
            <p className="text-muted-foreground mb-4">
              Informações de agendamento não encontradas.
            </p>
            <Button asChild>
              <Link to={buildTenantPath(tenantSlug, '/profissionais')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Profissionais
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to={buildTenantPath(tenantSlug, '/profissionais')} className="hover:text-primary transition-colors">
            Profissionais
          </Link>
          <span>›</span>
          <span className="text-foreground">Confirmar Agendamento</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumo do Agendamento */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Resumo do Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Professional Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(bookingData.professionalName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {bookingData.professionalName}
                    </h3>
                    <p className="text-sm text-muted-foreground">Profissional</p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-teal" />
                    <div>
                      <p className="text-sm font-medium">Data</p>
                      <p className="text-sm text-muted-foreground">
                        {parseISODateLocal(bookingData.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-sm font-medium">Horário</p>
                      <p className="text-sm text-muted-foreground">
                        {bookingData.time}
                      </p>
                    </div>
                  </div>

                   <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Valor</p>
                      {appliedCoupon ? (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(bookingData.price)}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-green-600">
                              {formatPrice(appliedCoupon.finalAmount.toString())}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              -{formatPrice(appliedCoupon.discountAmount.toString())}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(bookingData.price)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total a Pagar</span>
                    <span className="text-xl font-bold text-primary">
                      {appliedCoupon 
                        ? formatPrice(appliedCoupon.finalAmount.toString())
                        : formatPrice(bookingData.price)
                      }
                    </span>
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-green-600 text-right mt-1">
                      Você economizou {formatPrice(appliedCoupon.discountAmount.toString())}!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cupom de Desconto */}
            {bookingData && (
              <CouponValidator
                professionalId={parseInt(bookingData.professionalId)}
                amount={parseFloat(bookingData.price)}
                tenantId={tenant?.id || ''}
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
              />
            )}
          </div>

          {/* Formulário de Confirmação */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Seus Dados
                </CardTitle>
                <CardDescription>
                  Preencha seus dados para confirmar o agendamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome Completo *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, name: e.target.value }))
                          trackEvent({
                            event_name: 'form_field_filled',
                            event_data: { field: 'name', has_value: !!e.target.value }
                          })
                        }}
                        required
                        className="border-2 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, email: e.target.value }))
                          trackEvent({
                            event_name: 'form_field_filled',
                            event_data: { field: 'email', has_value: !!e.target.value }
                          })
                        }}
                        required
                        className="border-2 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, phone: e.target.value }))
                        trackEvent({
                          event_name: 'form_field_filled',
                          event_data: { field: 'phone', has_value: !!e.target.value }
                        })
                      }}
                      required
                      className="border-2 focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      Observações (opcional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Alguma informação adicional que gostaria de compartilhar..."
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="border-2 focus:border-primary/50 resize-none"
                    />
                  </div>

                  {/* Payment Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Pagamento
                    </h3>
                    <div className="bg-gradient-to-r from-primary/5 to-teal/5 p-4 rounded-lg border border-primary/10">
                      <p className="text-sm text-muted-foreground mb-3">
                        Você será redirecionado para uma página segura de pagamento.
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Mercado Pago
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Cartão de Crédito
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          PIX
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-6">
                    <Button variant="outline" size="lg" className="flex-1" asChild>
                      <Link to={buildTenantPath(tenantSlug, '/profissionais')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Link>
                    </Button>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="flex-1 btn-gradient shadow-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        "Processando..."
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Confirmar e Pagar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal de Escolha de Autenticação */}
      {bookingData && (
        <QuickSignupModal
          isOpen={showQuickSignup}
          onClose={() => setShowQuickSignup(false)}
          onSignupSuccess={handleSignupSuccess}
          bookingData={bookingData}
        />
      )}
    </div>
  )
}

export default BookingConfirmation