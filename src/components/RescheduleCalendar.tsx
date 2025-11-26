import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { format, addDays, startOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Session {
  id: number
  day: string
  start_time: string
  end_time: string
  time_slot: number
}

interface RescheduleCalendarProps {
  sessions: Session[]
  professionalName: string
  price?: string
  onBooking: (date: string, time: string) => void
  loading?: boolean
}

export const RescheduleCalendar = ({ 
  sessions, 
  professionalName, 
  price, 
  onBooking,
  loading = false
}: RescheduleCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()

  // Generate available dates for the next 30 days
  const generateAvailableDates = () => {
    const dates = []
    const today = startOfDay(new Date())
    
    // Get unique working days from sessions
    const workingDays = new Set()
    sessions.forEach(session => {
      const sessionDay = session.day.toLowerCase().trim()
      workingDays.add(sessionDay)
    })
    
    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i)
      const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase()
      
      // Check if this day matches any working day
      const isWorkingDay = Array.from(workingDays).some(workingDay => {
        // Map database day codes to JS day numbers (0 = Sunday, 1 = Monday, etc.)
        const dayCodeToNumber = {
          'domingo': 0, 'sunday': 0,
          'segunda': 1, 'segunda-feira': 1, 'monday': 1,
          'terça': 2, 'terça-feira': 2, 'tuesday': 2,
          'quarta': 3, 'quarta-feira': 3, 'wednesday': 3,
          'quinta': 4, 'quinta-feira': 4, 'thursday': 4,
          'sexta': 5, 'sexta-feira': 5, 'friday': 5,
          'sábado': 6, 'saturday': 6
        }
        
        const sessionDayNumber = dayCodeToNumber[workingDay as keyof typeof dayCodeToNumber]
        return sessionDayNumber === date.getDay()
      })
      
      if (isWorkingDay) {
        dates.push(date)
      }
    }
    
    return dates
  }

  // Generate time slots for selected date
  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots = []
    const start = new Date(`1970-01-01T${startTime}`)
    const end = new Date(`1970-01-01T${endTime}`)
    
    let current = new Date(start)
    
    while (current < end) {
      slots.push(format(current, 'HH:mm'))
      current = new Date(current.getTime() + 30 * 60 * 1000) // Add 30 minutes
    }
    
    return slots
  }

  // Get available times for selected date
  const getAvailableTimesForDate = (date: Date) => {
    if (!date) return []
    
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase()
    
    // Find sessions for this day
    const daySessions = sessions.filter(session => {
      const sessionDay = session.day.toLowerCase().trim()
      
      const dayCodeToNumber = {
        'domingo': 0, 'sunday': 0,
        'segunda': 1, 'segunda-feira': 1, 'monday': 1,
        'terça': 2, 'terça-feira': 2, 'tuesday': 2,
        'quarta': 3, 'quarta-feira': 3, 'wednesday': 3,
        'quinta': 4, 'quinta-feira': 4, 'thursday': 4,
        'sexta': 5, 'sexta-feira': 5, 'friday': 5,
        'sábado': 6, 'saturday': 6
      }
      
      const sessionDayNumber = dayCodeToNumber[sessionDay as keyof typeof dayCodeToNumber]
      return sessionDayNumber === date.getDay()
    })
    
    // Generate all time slots for all sessions
    const allSlots = []
    for (const session of daySessions) {
      const slots = generateTimeSlots(session.start_time, session.end_time)
      allSlots.push(...slots)
    }
    
    // Remove duplicates and sort
    const uniqueSlots = [...new Set(allSlots)].sort()
    
    return uniqueSlots
  }

  const availableDates = generateAvailableDates()
  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : []

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) return
    
    const dateString = format(selectedDate, 'yyyy-MM-dd')
    onBooking(dateString, selectedTime)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">📅 Escolha a nova data e horário</h3>
        <p className="text-sm text-muted-foreground">
          Profissional: <span className="font-medium">{professionalName}</span>
        </p>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return date < today || !availableDates.some(availableDate => isSameDay(date, availableDate))
          }}
          modifiers={{
            available: availableDates
          }}
          modifiersClassNames={{
            available: "bg-primary/10 border-primary/30 font-medium"
          }}
          className="rounded-md border shadow"
        />
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="text-center">
          <Badge variant="outline" className="px-3 py-1">
            📅 {format(selectedDate, "PPPP", { locale: ptBR })}
          </Badge>
        </div>
      )}

      {/* Time slots */}
      {availableTimes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-center text-sm font-medium text-muted-foreground">
            🕒 Horários disponíveis
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {availableTimes.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeSelect(time)}
                className={cn(
                  "h-9 text-xs transition-all",
                  selectedTime === time && "shadow-md"
                )}
              >
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(time)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {availableTimes.length === 0 && selectedDate && (
        <div className="text-center p-4 bg-muted/30 rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">
            😔 Nenhum horário disponível para esta data
          </p>
        </div>
      )}

      {/* Confirmation */}
      {selectedDate && selectedTime && (
        <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Confirmar reagendamento:</p>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                📅 {format(selectedDate, "PPPP", { locale: ptBR })}
              </p>
              <p className="font-medium text-primary">
                🕒 {formatTime(selectedTime)}
              </p>
              {price && (
                <p className="text-sm text-muted-foreground">
                  💰 {price}
                </p>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleBooking}
            className="w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            size="lg"
          >
            Selecionar Este Horário
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!selectedDate && (
        <div className="text-center p-4 bg-muted/30 rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">
            📋 Selecione uma data disponível para ver os horários
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dias com borda colorida possuem horários disponíveis
          </p>
        </div>
      )}
    </div>
  )
}