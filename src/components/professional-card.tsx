import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"

interface ProfessionalCardProps {
  id: number | string
  name: string
  title: string
  image?: string
  specialties?: string[]
  isCompactView?: boolean
}

const ProfessionalCard = ({ 
  id,
  name, 
  title, 
  image, 
  specialties = [],
  isCompactView = false 
}: ProfessionalCardProps) => {
  const navigate = useNavigate()

  const handleViewProfile = () => {
    navigate(`/professional/${id}`)
  }
  if (isCompactView) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              {image ? (
                <img src={image} alt={name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
          <Button variant="accent" size="sm" className="w-full mt-4" onClick={handleViewProfile}>
            Ver Perfil Completo
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-3xl">👤</span>
          )}
        </div>
        <h3 className="font-semibold text-xl">{name}</h3>
        <p className="text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent>
        {specialties.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button variant="accent" className="w-full" onClick={handleViewProfile}>
          Ver Perfil Completo
        </Button>
      </CardContent>
    </Card>
  )
}

export default ProfessionalCard