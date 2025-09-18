import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { format, addDays, startOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

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
  const [availableTimes, setAvailableTimes] = useState<any[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)
  const navigate = useNavigate()

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
          'sun': 0, 'sunday': 0, 'domingo': 0, 'dom': 0,
          'mon': 1, 'monday': 1, 'segunda': 1, 'segunda-feira': 1, 'seg': 1,
          'tue': 2, 'tuesday': 2, 'terça': 2, 'terça-feira': 2, 'terca': 2, 'ter': 2,
          'wed': 3, 'wednesday': 3, 'quarta': 3, 'quarta-feira': 3, 'qua': 3,
          'thu': 4, 'thursday': 4, 'quinta': 4, 'quinta-feira': 4, 'qui': 4,
          'fri': 5, 'friday': 5, 'sexta': 5, 'sexta-feira': 5, 'sex': 5,
          'sat': 6, 'saturday': 6, 'sábado': 6, 'sabado': 6, 'sab': 6
        }
        
        const currentDayNumber = date.getDay()
        const workingDayNumber = dayCodeToNumber[workingDay as string]
        
        return workingDayNumber === currentDayNumber
      })
      
      if (isWorkingDay) {
        dates.push(date)
      }
    }
    
    return dates
  }

  const availableDates = generateAvailableDates()

  // Generate time slots based on consultation duration (50 minutes)
  const generateTimeSlots = (startTime: string, endTime: string, consultationDuration: number = 50) => {
    const slots = []
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    
    // Calculate the last possible start time (end time minus consultation duration)
    const lastPossibleStart = new Date(end.getTime() - consultationDuration * 60 * 1000)
    
    // Generate slots every 30 minutes until we reach the last possible start time
    const current = new Date(start)
    while (current <= lastPossibleStart) {
      const timeString = current.toTimeString().substring(0, 5) // HH:MM format
      slots.push(timeString)
      current.setMinutes(current.getMinutes() + 30) // 30-minute intervals
    }
    
    return slots
  }

  // Get available times for selected date, filtering out occupied slots
  const getAvailableTimesForDate = async (date: Date) => {
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase()
    
    const dayCodeToNumber = {
      'sun': 0, 'sunday': 0, 'domingo': 0, 'dom': 0,
      'mon': 1, 'monday': 1, 'segunda': 1, 'segunda-feira': 1, 'seg': 1,
      'tue': 2, 'tuesday': 2, 'terça': 2, 'terça-feira': 2, 'terca': 2, 'ter': 2,
      'wed': 3, 'wednesday': 3, 'quarta': 3, 'quarta-feira': 3, 'qua': 3,
      'thu': 4, 'thursday': 4, 'quinta': 4, 'quinta-feira': 4, 'qui': 4,
      'fri': 5, 'friday': 5, 'sexta': 5, 'sexta-feira': 5, 'sex': 5,
      'sat': 6, 'saturday': 6, 'sábado': 6, 'sabado': 6, 'sab': 6
    }
    
    const currentDayNumber = date.getDay()
    
    // Get all sessions for this day
    const daysSessions = sessions.filter(session => {
      const sessionDay = session.day.toLowerCase().trim()
      const sessionDayNumber = dayCodeToNumber[sessionDay as keyof typeof dayCodeToNumber]
      return sessionDayNumber === currentDayNumber
    })
    
    // Check for existing appointments on this date
    const dateString = format(date, 'yyyy-MM-dd')
    // Convert professionalId to number for the query
    const professionalIdNumber = parseInt(professionalId)
    const { data: existingAppointments } = await supabase
      .from('agendamentos')
      .select('horario, status, payment_status')
      .eq('professional_id', professionalIdNumber)
      .eq('data_consulta', dateString)
      .in('status', ['pendente', 'confirmado'])
    
    // Check for professional unavailability/blocks on this date
    const { data: unavailabilityRecords } = await supabase
      .from('professional_unavailability')
      .select('*')
      .eq('professional_id', professionalIdNumber)
      .eq('date', dateString)
    
    // Check if the entire day is blocked
    const isDayBlocked = unavailabilityRecords?.some(record => record.all_day)
    if (isDayBlocked) {
      return [] // No times available - entire day is blocked
    }
    
    const occupiedTimes = new Set(
      (existingAppointments || []).map(apt => apt.horario.substring(0, 5))
    )
    
    // Get blocked time ranges for this day
    const blockedTimeRanges = (unavailabilityRecords || [])
      .filter(record => !record.all_day && record.start_time && record.end_time)
      .map(record => ({
        start: record.start_time,
        end: record.end_time
      }))
    
    // Helper function to check if a time slot is blocked
    const isTimeBlocked = (timeSlot: string) => {
      return blockedTimeRanges.some(range => {
        const slotTime = new Date(`2000-01-01T${timeSlot}:00`)
        const startTime = new Date(`2000-01-01T${range.start}`)
        const endTime = new Date(`2000-01-01T${range.end}`)
        
        // Check if the slot falls within any blocked time range
        // We also need to check if the consultation would end within the blocked period
        const slotEndTime = new Date(slotTime.getTime() + 50 * 60 * 1000) // 50 minutes consultation
        
        return (slotTime >= startTime && slotTime < endTime) || 
               (slotEndTime > startTime && slotEndTime <= endTime) ||
               (slotTime < startTime && slotEndTime > endTime)
      })
    }

    // Generate time slots for each session range
    const allTimeSlots = []
    daysSessions.forEach(session => {
      const slots = generateTimeSlots(session.start_time, session.end_time, 50)
      slots.forEach(slot => {
        // Only add if not occupied and not blocked
        if (!occupiedTimes.has(slot) && !isTimeBlocked(slot)) {
          allTimeSlots.push({
            id: `${session.id}-${slot}`,
            day: session.day,
            start_time: slot,
            end_time: slot,
            time_slot: session.time_slot
          })
        }
      })
    })
    
    // Remove duplicates and sort
    const uniqueSlots = allTimeSlots.filter((slot, index, self) => 
      index === self.findIndex(s => s.start_time === slot.start_time)
    )
    
    return uniqueSlots.sort((a, b) => a.start_time.localeCompare(b.start_time))
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

  // Load available times when date is selected
  useEffect(() => {
    if (selectedDate) {
      setLoadingTimes(true)
      getAvailableTimesForDate(selectedDate).then(times => {
        setAvailableTimes(times)
        setLoadingTimes(false)
      })
    } else {
      setAvailableTimes([])
    }
  }, [selectedDate, professionalId])

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Agendar Consulta</h3>
        <p className="text-sm text-muted-foreground">
          Selecione uma data e horário disponível
        </p>
      </div>

      {/* Calendar */}
      <div className="bg-card p-4 rounded-xl border shadow-sm">
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
          className="rounded-md pointer-events-auto w-full"
          classNames={{
            months: "space-y-4",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center text-foreground",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted rounded-md transition-colors",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground rounded-md",
            day_today: "bg-accent text-accent-foreground font-semibold",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          modifiers={{
            available: availableDates
          }}
          modifiersClassNames={{
            available: "bg-primary/10 text-primary font-medium border border-primary/20 hover:bg-primary/20 cursor-pointer transition-all duration-200"
          }}
        />
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="text-center">
          <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
            📅 {format(selectedDate, "PPPP", { locale: ptBR })}
          </Badge>
        </div>
      )}

      {/* Available Times */}
      {selectedDate && !loadingTimes && availableTimes.length > 0 && (
        <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
          <h4 className="font-medium text-center flex items-center justify-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Horários Disponíveis
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {availableTimes.map((session) => (
              <Button
                key={session.id}
                variant={selectedTime === session.start_time ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeSelect(session.start_time)}
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  selectedTime === session.start_time 
                    ? "bg-primary text-primary-foreground shadow-md scale-105" 
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                )}
              >
                {formatTime(session.start_time)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading times */}
      {selectedDate && loadingTimes && (
        <div className="text-center p-4 bg-muted/50 rounded-xl border">
          <p className="text-sm text-muted-foreground">
            🔄 Carregando horários disponíveis...
          </p>
        </div>
      )}

      {/* No times available */}
      {selectedDate && !loadingTimes && availableTimes.length === 0 && (
        <div className="text-center p-4 bg-muted/50 rounded-xl border">
          <p className="text-sm text-muted-foreground">
            ⚠️ Nenhum horário disponível para esta data
          </p>
        </div>
      )}

      {/* Book Button */}
      {selectedDate && selectedTime && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-primary/10 to-primary/20 p-4 rounded-xl border border-primary/20">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Confirmar agendamento:</p>
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
          </div>
          
          <Button 
            onClick={handleBooking}
            className="w-full btn-gradient shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            size="lg"
          >
            ✅ Confirmar Agendamento
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