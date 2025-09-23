import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Star } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface ProfessionalCardProps {
  id: number | string
  name: string
  title: string
  image?: string
  specialties?: string[]
  isCompactView?: boolean
  rating?: number
  consultationPrice?: number
}

const ProfessionalCard = ({ 
  id,
  name, 
  title, 
  image, 
  specialties = [],
  isCompactView = false,
  rating = 4.8,
  consultationPrice
}: ProfessionalCardProps) => {
  const navigate = useNavigate()

  const handleViewProfile = () => {
    navigate(`/professional/${id}`)
  }
  if (isCompactView) {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src={image} alt={name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground mb-1 truncate">{name}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{title}</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-foreground">{rating}</span>
                </div>
                {consultationPrice && (
                  <span className="text-sm font-bold text-primary">
                    R$ {consultationPrice}
                  </span>
                )}
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {specialties.slice(0, 2).map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20">
                      {specialty}
                    </Badge>
                  ))}
                  {specialties.length > 2 && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      +{specialties.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md group-hover:shadow-lg transition-all duration-300" 
            onClick={handleViewProfile}
          >
            Ver Perfil Completo
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
      <div className="relative">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 pb-8">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-28 h-28 border-4 border-white shadow-xl mx-auto">
                <AvatarImage src={image} alt={name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground text-2xl">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-3 border-white shadow-md"></div>
            </div>
            <h3 className="font-bold text-xl text-foreground mb-2">{name}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{title}</p>
          </div>
        </div>
        
        <CardContent className="p-6 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-foreground">{rating}</span>
              </div>
            </div>
            {consultationPrice && (
              <div className="text-right">
                <span className="text-lg font-bold text-primary">R$ {consultationPrice}</span>
                <p className="text-xs text-muted-foreground">por consulta</p>
              </div>
            )}
          </div>
          
          {specialties.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-3 py-1 bg-primary/10 text-primary border-primary/20">
                    {specialty}
                  </Badge>
                ))}
                {specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs px-3 py-1">
                    +{specialties.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <Button 
            variant="default" 
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md group-hover:shadow-lg transition-all duration-300" 
            onClick={handleViewProfile}
          >
            Ver Perfil Completo
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}

export default ProfessionalCard