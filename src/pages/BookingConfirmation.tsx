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
import { supabase } from "@/integrations/supabase/client"
import AuthChoiceModal from "@/components/AuthChoiceModal"

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
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAuthChoice, setShowAuthChoice] = useState(false)
  const [authChoiceMade, setAuthChoiceMade] = useState(false)
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
        setAuthChoiceMade(true) // Usuário já fez login, pode prosseguir
      }
    }
  }, [searchParams])

  // Verificar se precisa mostrar modal de escolha de autenticação
  useEffect(() => {
    if (bookingData && !user && !authChoiceMade) {
      setShowAuthChoice(true)
    }
  }, [bookingData, user, authChoiceMade])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.phone) {
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
      // Get professional profile_id (UUID) from the profissionais table
      const { data: professionalData, error: professionalError } = await supabase
        .from('profissionais')
        .select('profile_id')
        .eq('id', parseInt(bookingData.professionalId))
        .single()

      if (professionalError || !professionalData?.profile_id) {
        console.error('Erro ao buscar profissional:', professionalError)
        throw new Error('Profissional não encontrado')
      }
      
      // 1. Create agendamento in database
      const { data: agendamento, error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert({
          user_id: user?.id || null, // null para visitantes, user.id para usuários logados
          professional_id: professionalData.profile_id,
          nome_paciente: formData.name,
          email_paciente: formData.email,
          telefone_paciente: formData.phone,
          data_consulta: bookingData.date,
          horario: bookingData.time,
          valor: parseFloat(bookingData.price),
          observacoes: formData.notes || null,
          status: 'pendente_pagamento'
        })
        .select()
        .single()

      if (agendamentoError) {
        console.error('Erro ao criar agendamento:', agendamentoError)
        throw new Error('Erro ao criar agendamento')
      }

      // 2. Create MercadoPago payment preference
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-mercadopago-payment',
        {
          body: {
            agendamentoId: agendamento.id,
            valor: parseFloat(bookingData.price),
            title: `Consulta com ${bookingData.professionalName}`,
            description: `Consulta agendada para ${new Date(bookingData.date).toLocaleDateString('pt-BR')} às ${bookingData.time}`
          }
        }
      )

      if (paymentError) {
        console.error('Erro ao criar pagamento:', paymentError)
        throw new Error('Erro ao processar pagamento')
      }

      // 3. Redirect to MercadoPago checkout
      if (paymentData?.initPoint) {
        window.location.href = paymentData.initPoint
      } else {
        throw new Error('URL de pagamento não recebida')
      }
      
    } catch (error) {
      console.error('Erro no agendamento:', error)
      toast({
        title: "Erro no agendamento",
        description: "Ocorreu um erro ao processar seu agendamento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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
              <Link to="/profissionais">
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
          <Link to="/profissionais" className="hover:text-primary transition-colors">
            Profissionais
          </Link>
          <span>›</span>
          <span className="text-foreground">Confirmar Agendamento</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumo do Agendamento */}
          <div className="lg:col-span-1">
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
                        {new Date(bookingData.date).toLocaleDateString('pt-BR')}
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
                    <div>
                      <p className="text-sm font-medium">Valor</p>
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(bookingData.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(bookingData.price)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                      <Link to="/profissionais">
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
        <AuthChoiceModal
          isOpen={showAuthChoice}
          onClose={() => setShowAuthChoice(false)}
          onContinueAsGuest={() => setAuthChoiceMade(true)}
          bookingData={bookingData}
        />
      )}
    </div>
  )
}

export default BookingConfirmation