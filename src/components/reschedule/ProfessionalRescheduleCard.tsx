import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getIllustrativeAvatar } from "@/utils/avatarHelpers"

interface ProfessionalRescheduleCardProps {
  professional: {
    id: number
    display_name: string
    profissao: string
    preco_consulta: number
    foto_perfil_url?: string
    resumo_profissional?: string
    especialidades?: string[]
    genero?: string
    raca?: string
  }
  currentProfessionalId?: number
  originalPrice: number
  isSelected?: boolean
  nextAvailableSlot?: string
  onClick: () => void
}

export const ProfessionalRescheduleCard = ({
  professional,
  currentProfessionalId,
  originalPrice,
  isSelected,
  nextAvailableSlot,
  onClick
}: ProfessionalRescheduleCardProps) => {
  const priceDiff = professional.preco_consulta - originalPrice
  const isCurrentProfessional = professional.id === currentProfessionalId

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const avatarUrl = professional.foto_perfil_url || 
    getIllustrativeAvatar(professional.genero, professional.raca, professional.display_name)

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg border-2",
        isSelected && "ring-2 ring-primary bg-primary/5 border-primary",
        isCurrentProfessional && "border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            <Avatar className={cn(
              "h-16 w-16 ring-2 ring-offset-2",
              isCurrentProfessional ? "ring-amber-400" : "ring-primary/20"
            )}>
              <AvatarImage src={avatarUrl} alt={professional.display_name} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {professional.display_name}
                </h3>
                {isCurrentProfessional && (
                  <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-800 border-amber-300">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Atual
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{professional.profissao}</p>
            </div>

            {/* Specialties */}
            {professional.especialidades && professional.especialidades.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {professional.especialidades.slice(0, 3).map((esp, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {esp}
                  </Badge>
                ))}
              </div>
            )}

            {/* Next Available Slot */}
            {nextAvailableSlot && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Próximo: {nextAvailableSlot}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="shrink-0 text-right space-y-1">
            <p className="text-lg font-bold text-foreground">
              {formatPrice(professional.preco_consulta)}
            </p>
            {priceDiff !== 0 && (
              <Badge 
                variant={priceDiff > 0 ? "destructive" : "default"}
                className={cn(
                  "text-xs",
                  priceDiff < 0 && "bg-green-500 hover:bg-green-600"
                )}
              >
                {priceDiff > 0 ? '+' : ''}{formatPrice(Math.abs(priceDiff))}
              </Badge>
            )}
            {priceDiff === 0 && (
              <Badge variant="secondary" className="text-xs">
                Mesmo preço
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
