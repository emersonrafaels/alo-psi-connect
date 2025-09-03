import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { format, addDays, startOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useNavigate } from "react-router-dom"

interface Session {
  id: number
  day: string
  start_time: string
  end_time: string
  time_slot: number
}

interface CalendarWidgetProps {
  sessions: Session[]
  professionalId: string
  professionalName: string
  price?: string
}

export const CalendarWidget = ({ sessions, professionalId, professionalName, price }: CalendarWidgetProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const navigate = useNavigate()

  // Generate available dates for the next 30 days
  const generateAvailableDates = () => {
    const dates = []
    const today = startOfDay(new Date())
    
    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i)
      const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase()
      
      // Check if this day has sessions
      const hasSessions = sessions.some(session => {
        const sessionDay = session.day.toLowerCase().trim()
        
        // More comprehensive day matching
        const dayMappings = {
          'segunda-feira': ['segunda', 'seg', 'monday'],
          'terça-feira': ['terça', 'terca', 'ter', 'tuesday'], 
          'quarta-feira': ['quarta', 'qua', 'wednesday'],
          'quinta-feira': ['quinta', 'qui', 'thursday'],
          'sexta-feira': ['sexta', 'sex', 'friday'],
          'sábado': ['sabado', 'sab', 'saturday'],
          'domingo': ['dom', 'sunday']
        }
        
        const mappedDays = dayMappings[dayName] || []
        return sessionDay === dayName || 
               mappedDays.includes(sessionDay) ||
               sessionDay === dayName.substring(0, 3)
      })
      
      if (hasSessions) {
        dates.push(date)
      }
    }
    
    return dates
  }

  const availableDates = generateAvailableDates()

  // Get available times for selected date
  const getAvailableTimesForDate = (date: Date) => {
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase()
    
    return sessions.filter(session => {
      const sessionDay = session.day.toLowerCase().trim()
      
      // Use same comprehensive day matching as above
      const dayMappings = {
        'segunda-feira': ['segunda', 'seg', 'monday'],
        'terça-feira': ['terça', 'terca', 'ter', 'tuesday'], 
        'quarta-feira': ['quarta', 'qua', 'wednesday'],
        'quinta-feira': ['quinta', 'qui', 'thursday'],
        'sexta-feira': ['sexta', 'sex', 'friday'],
        'sábado': ['sabado', 'sab', 'saturday'],
        'domingo': ['dom', 'sunday']
      }
      
      const mappedDays = dayMappings[dayName] || []
      return sessionDay === dayName || 
             mappedDays.includes(sessionDay) ||
             sessionDay === dayName.substring(0, 3)
    })
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) return
    
    const formattedDate = format(selectedDate, 'yyyy-MM-dd')
    const params = new URLSearchParams({
      professionalId,
      professionalName,
      date: formattedDate,
      time: selectedTime,
      price: price || '0'
    })
    
    navigate(`/confirmacao-agendamento?${params.toString()}`)
  }

  const selectedTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={ptBR}
          disabled={(date) => {
            return date < new Date() || !availableDates.some(availableDate => 
              isSameDay(date, availableDate)
            )
          }}
          className="rounded-md border shadow-sm"
        />
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="text-center">
          <Badge variant="outline" className="text-sm font-medium">
            {format(selectedDate, "PPPP", { locale: ptBR })}
          </Badge>
        </div>
      )}

      {/* Available Times */}
      {selectedDate && selectedTimes.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-center flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Horários Disponíveis
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {selectedTimes.map((session) => (
              <Button
                key={session.id}
                variant={selectedTime === session.start_time ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeSelect(session.start_time)}
                className="text-xs"
              >
                {formatTime(session.start_time)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* No times available */}
      {selectedDate && selectedTimes.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Nenhum horário disponível para esta data
        </div>
      )}

      {/* Book Button */}
      {selectedDate && selectedTime && (
        <Button 
          onClick={handleBooking}
          className="w-full btn-gradient shadow-lg"
          size="lg"
        >
          Agendar para {formatTime(selectedTime)}
        </Button>
      )}

      {/* Instructions */}
      {!selectedDate && (
        <div className="text-center text-sm text-muted-foreground">
          Selecione uma data para ver os horários disponíveis
        </div>
      )}
    </div>
  )
}