import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToolRequest {
  action: 'search_professionals' | 'get_professional_schedules' | 'get_system_config' | 'check_availability' | 'get_next_available_slots';
  parameters?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, parameters = {} } = await req.json() as ToolRequest;

    console.log(`🔧 AI Tool Request: ${action}`, parameters);

    let result: any = {};

    switch (action) {
      case 'search_professionals': {
        const { specialties, profession, price_range, availability_period, gender, include_photos } = parameters;
        
        let query = supabase
          .from('profissionais')
          .select(`
            id,
            display_name,
            profissao,
            resumo_profissional,
            foto_perfil_url,
            preco_consulta,
            tempo_consulta,
            formacao_raw,
            formacao_normalizada,
            servicos_raw,
            servicos_normalizados,
            idiomas_raw,
            telefone,
            email_secundario,
            crp_crm,
            linkedin,
            ativo,
            user_id,
            profile_id,
            profiles!inner(nome, email, genero)
          `)
          .eq('ativo', true);

        if (profession) {
          query = query.ilike('profissao', `%${profession}%`);
        }

        // Apply gender filter
        if (gender) {
          const genderValue = gender.toLowerCase() === 'masculino' || gender.toLowerCase() === 'homem' ? 'masculino' : 
                            gender.toLowerCase() === 'feminino' || gender.toLowerCase() === 'mulher' ? 'feminino' : gender;
          query = query.eq('profiles.genero', genderValue);
        }

        // Apply specialty filter using normalized specialties
        if (specialties) {
          // For array of specialties, check if any specialty matches
          if (Array.isArray(specialties)) {
            query = query.overlaps('servicos_normalizados', specialties);
          } else {
            // For single specialty, check if it's contained in the array
            query = query.contains('servicos_normalizados', [specialties]);
          }
        }

        // Apply price range filter - handle null/zero values properly
        if (price_range) {
          const [min, max] = price_range;
          
          // Only apply price filters if values are valid numbers
          if (typeof min === 'number' && min > 0) {
            query = query.gte('preco_consulta', min);
          }
          if (typeof max === 'number' && max > 0) {
            query = query.lte('preco_consulta', max);
          }
          
          // Exclude professionals with null or zero prices from price-filtered searches
          if ((typeof min === 'number' && min > 0) || (typeof max === 'number' && max > 0)) {
            query = query.not('preco_consulta', 'is', null);
            query = query.gt('preco_consulta', 0);
          }
        }

        const { data: professionals, error: profError } = await query;

        if (profError) {
          console.error('❌ Error fetching professionals:', profError);
          result = { professionals: [], error: profError.message };
          break;
        }

        // Get schedules for all professionals
        const professionalIds = professionals?.map(p => p.user_id) || [];
        let schedulesData = [];

        if (professionalIds.length > 0) {
          const { data: schedules } = await supabase
            .from('profissionais_sessoes')
            .select('*')
            .in('user_id', professionalIds);

          schedulesData = schedules || [];
        }

        // Format professionals with schedule information and next available slots
        const formattedProfessionals = await Promise.all(professionals?.map(async prof => {
          const profSchedules = schedulesData.filter(s => s.user_id === prof.user_id);
          
          // Organize schedules by day and period
          const schedulesByPeriod = {
            manha: [],
            tarde: [],
            noite: []
          };

          profSchedules.forEach(schedule => {
            const startHour = parseInt(schedule.start_time.split(':')[0]);
            let period = 'manha';
            if (startHour >= 12 && startHour < 18) period = 'tarde';
            if (startHour >= 18) period = 'noite';

            schedulesByPeriod[period].push({
              day: schedule.day,
              start_time: schedule.start_time,
              end_time: schedule.end_time
            });
          });

          // Get next 3 available slots for this professional
          const nextSlots = await getNextAvailableSlots(prof.id, profSchedules, 3);

          return {
            id: prof.id,
            name: prof.display_name,
            profession: prof.profissao,
            summary: prof.resumo_profissional,
            photo: include_photos ? prof.foto_perfil_url : null,
            gender: prof.profiles?.genero,
            price: prof.preco_consulta,
            price_formatted: prof.preco_consulta ? 
              `R$ ${prof.preco_consulta.toFixed(2)}` : 'A consultar',
            consultation_time: prof.tempo_consulta,
            formation: prof.formacao_normalizada?.join(', ') || prof.formacao_raw || 'Não especificado',
            specialties: prof.servicos_normalizados?.join(', ') || 'Não especificado',
            languages: prof.idiomas_raw,
            phone: prof.telefone,
            secondary_email: prof.email_secundario,
            crp_crm: prof.crp_crm,
            linkedin: prof.linkedin,
            profile_link: `/professional/${prof.id}`,
            booking_link: `/agendamento?professionalId=${prof.id}`,
            schedules: schedulesByPeriod,
            next_available_slots: nextSlots,
            availability: {
              morning: schedulesByPeriod.manha.length > 0,
              afternoon: schedulesByPeriod.tarde.length > 0,
              evening: schedulesByPeriod.noite.length > 0
            }
          };
        }) || []);

        // Filter by availability period if specified
        if (availability_period) {
          const filtered = formattedProfessionals.filter(prof => {
            switch (availability_period.toLowerCase()) {
              case 'manha': case 'manhã': case 'morning':
                return prof.availability.morning;
              case 'tarde': case 'afternoon':
                return prof.availability.afternoon;
              case 'noite': case 'evening': case 'night':
                return prof.availability.evening;
              default:
                return true;
            }
          });
          result = { professionals: filtered };
        } else {
          result = { professionals: formattedProfessionals };
        }

        console.log(`✅ Found ${result.professionals.length} professionals`);
        break;
      }

      case 'get_professional_schedules': {
        const { professional_id } = parameters;
        
        const { data: schedules, error } = await supabase
          .from('profissionais_sessoes')
          .select('*')
          .eq('user_id', professional_id);

        if (error) {
          console.error('❌ Error fetching schedules:', error);
          result = { schedules: [], error: error.message };
        } else {
          result = { schedules: schedules || [] };
        }
        break;
      }

      case 'get_system_config': {
        const { category, key } = parameters;
        
        let query = supabase.from('system_configurations').select('*');
        
        if (category) {
          query = query.eq('category', category);
        }
        
        if (key) {
          query = query.eq('key', key);
        }

        const { data: configs, error } = await query;

        if (error) {
          console.error('❌ Error fetching config:', error);
          result = { configs: [], error: error.message };
        } else {
          result = { configs: configs || [] };
        }
        break;
      }

      case 'check_availability': {
        const { professional_id, date, time_period } = parameters;
        
        // Validate required parameters
        if (!professional_id) {
          result = { error: 'professional_id é obrigatório para verificar disponibilidade' };
          break;
        }

        // Get professional schedules first
        const { data: schedules, error: schedError } = await supabase
          .from('profissionais_sessoes')
          .select('*')
          .eq('user_id', professional_id);

        if (schedError) {
          console.error('❌ Error fetching schedules:', schedError);
          result = { error: `Erro ao buscar horários: ${schedError.message}` };
          break;
        }

        if (!schedules || schedules.length === 0) {
          result = { 
            message: 'Este profissional não possui horários cadastrados.',
            available_times: [],
            schedules: []
          };
          break;
        }

        // If no date is provided, return general schedule information
        if (!date) {
          const organizedSchedules = {
            weekdays: schedules.filter(s => !['saturday', 'sunday'].includes(s.day?.toLowerCase())),
            weekend: schedules.filter(s => ['saturday', 'sunday'].includes(s.day?.toLowerCase())),
            by_period: {
              morning: schedules.filter(s => {
                const hour = parseInt(s.start_time.split(':')[0]);
                return hour >= 8 && hour < 12;
              }),
              afternoon: schedules.filter(s => {
                const hour = parseInt(s.start_time.split(':')[0]);
                return hour >= 12 && hour < 18;
              }),
              evening: schedules.filter(s => {
                const hour = parseInt(s.start_time.split(':')[0]);
                return hour >= 18;
              })
            }
          };

          result = {
            message: 'Horários gerais disponíveis para este profissional',
            schedules: organizedSchedules,
            total_slots: schedules.length
          };
          break;
        }

        // Validate date format if provided
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          result = { error: 'Formato de data inválido. Use YYYY-MM-DD' };
          break;
        }

        // Get existing appointments for the specific date
        const { data: appointments, error: apptError } = await supabase
          .from('agendamentos')
          .select('horario, status')
          .eq('professional_id', professional_id)
          .eq('data_consulta', date)
          .in('status', ['confirmado', 'pendente']);

        if (apptError) {
          console.error('❌ Error fetching appointments:', apptError);
          result = { error: `Erro ao verificar agendamentos: ${apptError.message}` };
          break;
        }

        const bookedTimes = appointments?.map(a => a.horario) || [];
        
        // Get day of week for the date
        const targetDate = new Date(date);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[targetDate.getDay()];
        
        // Filter schedules for this day of week
        const daySchedules = schedules.filter(schedule => 
          schedule.day?.toLowerCase() === dayOfWeek
        );

        // Calculate available times based on schedules and booked times
        const availableTimes = daySchedules.filter(schedule => {
          const scheduleTime = schedule.start_time;
          return !bookedTimes.includes(scheduleTime);
        });

        // Filter by time period if specified
        let filteredTimes = availableTimes;
        if (time_period) {
          filteredTimes = availableTimes.filter(schedule => {
            const hour = parseInt(schedule.start_time.split(':')[0]);
            switch (time_period.toLowerCase()) {
              case 'manha': case 'manhã': case 'morning':
                return hour >= 8 && hour < 12;
              case 'tarde': case 'afternoon':
                return hour >= 12 && hour < 18;
              case 'noite': case 'evening': case 'night':
                return hour >= 18;
              default:
                return true;
            }
          });
        }

        result = {
          date: date,
          day_of_week: dayOfWeek,
          available_times: filteredTimes,
          booked_times: bookedTimes,
          total_day_slots: daySchedules.length,
          message: filteredTimes.length > 0 
            ? `Encontrados ${filteredTimes.length} horários disponíveis para ${date}`
            : `Nenhum horário disponível para ${date}${time_period ? ` no período ${time_period}` : ''}`
        };
        break;
      }

      case 'get_next_available_slots': {
        const { professional_id, limit = 5 } = parameters;
        
        if (!professional_id) {
          result = { error: 'professional_id é obrigatório' };
          break;
        }

        // Get professional schedules
        const { data: schedules, error: schedError } = await supabase
          .from('profissionais_sessoes')
          .select('*')
          .eq('user_id', professional_id);

        if (schedError) {
          result = { error: `Erro ao buscar horários: ${schedError.message}` };
          break;
        }

        if (!schedules || schedules.length === 0) {
          result = { 
            professional_id,
            available_slots: [],
            message: 'Este profissional não possui horários cadastrados.'
          };
          break;
        }

        const availableSlots = await getNextAvailableSlots(professional_id, schedules, limit);
        
        result = {
          professional_id,
          available_slots: availableSlots,
          message: availableSlots.length > 0 
            ? `Encontrados ${availableSlots.length} horários disponíveis`
            : 'Nenhum horário disponível nos próximos dias'
        };
        break;
      }

      default:
        result = { error: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in ai-assistant-tool:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get next available slots for a professional
async function getNextAvailableSlots(professionalId: number, schedules: any[], limit: number = 5) {
  const slots = [];
  const today = new Date();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Helper to get day name from date
  const getDayName = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };
  
  // Generate time slots from schedule ranges
  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const consultationDuration = 50; // 50 minutes
    
    const lastPossibleStart = new Date(end.getTime() - consultationDuration * 60 * 1000);
    
    const current = new Date(start);
    while (current <= lastPossibleStart) {
      const timeString = current.toTimeString().substring(0, 5);
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + 30); // 30-minute intervals
    }
    
    return slots;
  };
  
  // Check next 30 days
  for (let dayOffset = 1; dayOffset <= 30 && slots.length < limit; dayOffset++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + dayOffset);
    const dayName = getDayName(checkDate);
    const dateString = checkDate.toISOString().split('T')[0];
    
    // Get schedules for this day
    const daySchedules = schedules.filter(schedule => 
      schedule.day?.toLowerCase() === dayName
    );
    
    if (daySchedules.length === 0) continue;
    
    // Check existing appointments for this date
    const { data: existingAppointments } = await supabase
      .from('agendamentos')
      .select('horario')
      .eq('professional_id', professionalId)
      .eq('data_consulta', dateString)
      .in('status', ['pendente', 'confirmado']);
    
    // Check for unavailability blocks
    const { data: unavailabilityRecords } = await supabase
      .from('professional_unavailability')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('date', dateString);
    
    const isDayBlocked = unavailabilityRecords?.some(record => record.all_day);
    if (isDayBlocked) continue;
    
    const occupiedTimes = new Set(
      (existingAppointments || []).map(apt => apt.horario.substring(0, 5))
    );
    
    const blockedTimeRanges = (unavailabilityRecords || [])
      .filter(record => !record.all_day && record.start_time && record.end_time)
      .map(record => ({
        start: record.start_time,
        end: record.end_time
      }));
    
    // Check if time is blocked
    const isTimeBlocked = (timeSlot: string) => {
      return blockedTimeRanges.some(range => {
        const slotTime = new Date(`2000-01-01T${timeSlot}:00`);
        const startTime = new Date(`2000-01-01T${range.start}`);
        const endTime = new Date(`2000-01-01T${range.end}`);
        const slotEndTime = new Date(slotTime.getTime() + 50 * 60 * 1000);
        
        return (slotTime >= startTime && slotTime < endTime) || 
               (slotEndTime > startTime && slotEndTime <= endTime) ||
               (slotTime < startTime && slotEndTime > endTime);
      });
    };
    
    // Generate available slots for this day
    for (const schedule of daySchedules) {
      const timeSlots = generateTimeSlots(schedule.start_time, schedule.end_time);
      
      for (const timeSlot of timeSlots) {
        if (slots.length >= limit) break;
        
        if (!occupiedTimes.has(timeSlot) && !isTimeBlocked(timeSlot)) {
          slots.push({
            date: dateString,
            date_formatted: checkDate.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            time: timeSlot,
            day_of_week: dayName,
            booking_url: `/confirmacao-agendamento?professionalId=${professionalId}&date=${dateString}&time=${timeSlot}`
          });
        }
      }
    }
  }
  
  return slots;
}