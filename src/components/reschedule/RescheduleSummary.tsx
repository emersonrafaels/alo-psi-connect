import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, User, DollarSign, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RescheduleSummaryProps {
  original: {
    professionalName: string
    date: string
    time: string
    price: number
  }
  new: {
    professionalName: string
    date: string
    time: string
    price: number
  }
  confirmed: boolean
  onConfirmChange: (checked: boolean) => void
}

export const RescheduleSummary = ({
  original,
  new: newData,
  confirmed,
  onConfirmChange
}: RescheduleSummaryProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  const priceDiff = newData.price - original.price
  const isDifferentProfessional = original.professionalName !== newData.professionalName

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          📋 Resumo do Reagendamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparison Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* BEFORE Column */}
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-3">
                Antes
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{original.professionalName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">{formatDate(original.date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">{original.time}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{formatPrice(original.price)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
          </div>

          {/* AFTER Column */}
          <div className="space-y-4 -ml-4">
            <div className="text-center">
              <Badge variant="default" className="mb-3">
                Depois
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {newData.professionalName}
                    {isDifferentProfessional && (
                      <Badge variant="secondary" className="ml-2 text-xs">Novo</Badge>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{formatDate(newData.date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{newData.time}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <DollarSign className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-primary">{formatPrice(newData.price)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Difference Alert */}
        {priceDiff !== 0 && (
          <Alert variant={priceDiff > 0 ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {priceDiff > 0 ? (
                <>
                  Você precisará pagar a diferença de <strong>{formatPrice(Math.abs(priceDiff))}</strong>
                </>
              ) : (
                <>
                  Você receberá um reembolso de <strong>{formatPrice(Math.abs(priceDiff))}</strong>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Confirmation Checkbox */}
        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
          <Checkbox
            id="confirm-reschedule"
            checked={confirmed}
            onCheckedChange={onConfirmChange}
          />
          <label
            htmlFor="confirm-reschedule"
            className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
          >
            Li e confirmo todas as alterações acima. Estou ciente que ao reagendar, 
            a consulta original será cancelada e substituída pela nova consulta.
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
