import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToolRequest {
  action: 'search_professionals' | 'get_professional_schedules' | 'get_system_config' | 'check_availability' | 'get_next_available_slots' | 'get_professional_calendar_status';
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
          // Normalize profession search to handle common terms
          const normalizedProfession = profession.toLowerCase().trim();
          
          if (normalizedProfession.includes('psicoterapeuta') || normalizedProfession.includes('psicoterapia')) {
            // Filter specifically for professionals with 'psicoterapeuta' profession
            query = query.ilike('profissao', '%psicoterapeuta%');
          } else {
            query = query.ilike('profissao', `%${profession}%`);
          }
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

        // Get the day of week for this date
        const targetDate = new Date(date);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[targetDate.getDay()];
        
        // Map day names to numbers for comparison (same logic as CalendarWidget)
        const dayCodeToNumber = {
          'sun': 0, 'sunday': 0, 'domingo': 0, 'dom': 0,
          'mon': 1, 'monday': 1, 'segunda': 1, 'segunda-feira': 1, 'seg': 1,
          'tue': 2, 'tuesday': 2, 'terça': 2, 'terça-feira': 2, 'terca': 2, 'ter': 2,
          'wed': 3, 'wednesday': 3, 'quarta': 3, 'quarta-feira': 3, 'qua': 3,
          'thu': 4, 'thursday': 4, 'quinta': 4, 'quinta-feira': 4, 'qui': 4,
          'fri': 5, 'friday': 5, 'sexta': 5, 'sexta-feira': 5, 'sex': 5,
          'sat': 6, 'saturday': 6, 'sábado': 6, 'sabado': 6, 'sab': 6
        };
        
        const currentDayNumber = targetDate.getDay();
        
        // Filter schedules for this day (matching CalendarWidget logic)
        const daySchedules = schedules.filter(schedule => {
          const sessionDay = schedule.day?.toLowerCase().trim();
          const sessionDayNumber = dayCodeToNumber[sessionDay];
          return sessionDayNumber === currentDayNumber;
        });

        if (daySchedules.length === 0) {
          result = {
            date: date,
            day_of_week: dayOfWeek,
            available_times: [],
            message: `Este profissional não atende às ${dayOfWeek}s`
          };
          break;
        }

        // Check for existing appointments on this date
        const { data: appointments, error: apptError } = await supabase
          .from('agendamentos')
          .select('horario, status, payment_status')
          .eq('professional_id', professional_id)
          .eq('data_consulta', date)
          .in('status', ['pendente', 'confirmado']);

        if (apptError) {
          console.error('❌ Error fetching appointments:', apptError);
          result = { error: `Erro ao verificar agendamentos: ${apptError.message}` };
          break;
        }

        // Check for professional unavailability/blocks on this date
        const { data: unavailabilityRecords, error: unavailError } = await supabase
          .from('professional_unavailability')
          .select('*')
          .eq('professional_id', professional_id)
          .eq('date', date);

        if (unavailError) {
          console.error('❌ Error fetching unavailability:', unavailError);
        }

        // Check if the entire day is blocked
        const isDayBlocked = unavailabilityRecords?.some(record => record.all_day);
        if (isDayBlocked) {
          const blockedReason = unavailabilityRecords?.find(r => r.all_day)?.reason;
          result = {
            date: date,
            day_of_week: dayOfWeek,
            available_times: [],
            blocked: true,
            block_reason: blockedReason,
            message: `Profissional indisponível no dia ${date}${blockedReason ? ` - ${blockedReason}` : ''}`
          };
          break;
        }

        const occupiedTimes = new Set(
          (appointments || []).map(apt => apt.horario.substring(0, 5))
        );

        // Get blocked time ranges for this day
        const blockedTimeRanges = (unavailabilityRecords || [])
          .filter(record => !record.all_day && record.start_time && record.end_time)
          .map(record => ({
            start: record.start_time,
            end: record.end_time,
            reason: record.reason
          }));

        // Helper function to check if a time slot is blocked (matching CalendarWidget logic)
        const isTimeBlocked = (timeSlot: string) => {
          return blockedTimeRanges.some(range => {
            const slotTime = new Date(`2000-01-01T${timeSlot}:00`);
            const startTime = new Date(`2000-01-01T${range.start}`);
            const endTime = new Date(`2000-01-01T${range.end}`);
            
            // Check if the slot falls within any blocked time range
            // We also need to check if the consultation would end within the blocked period
            const slotEndTime = new Date(slotTime.getTime() + 50 * 60 * 1000); // 50 minutes consultation
            
            return (slotTime >= startTime && slotTime < endTime) || 
                   (slotEndTime > startTime && slotEndTime <= endTime) ||
                   (slotTime < startTime && slotEndTime > endTime);
          });
        };

        // Generate time slots for each session range (replicating CalendarWidget logic)
        const generateTimeSlots = (startTime: string, endTime: string, consultationDuration: number = 50) => {
          const slots = [];
          const start = new Date(`2000-01-01T${startTime}`);
          const end = new Date(`2000-01-01T${endTime}`);
          
          // Calculate the last possible start time (end time minus consultation duration)
          const lastPossibleStart = new Date(end.getTime() - consultationDuration * 60 * 1000);
          
          // Generate slots every 30 minutes until we reach the last possible start time
          const current = new Date(start);
          while (current <= lastPossibleStart) {
            const timeString = current.toTimeString().substring(0, 5); // HH:MM format
            slots.push(timeString);
            current.setMinutes(current.getMinutes() + 30); // 30-minute intervals
          }
          
          return slots;
        };

        // Generate all available time slots
        const allTimeSlots = [];
        daySchedules.forEach(session => {
          const slots = generateTimeSlots(session.start_time, session.end_time, 50);
          slots.forEach(slot => {
            // Only add if not occupied and not blocked
            if (!occupiedTimes.has(slot) && !isTimeBlocked(slot)) {
              allTimeSlots.push({
                time: slot,
                session_id: session.id,
                day: session.day,
                period: parseInt(slot.split(':')[0]) < 12 ? 'manhã' : 
                       parseInt(slot.split(':')[0]) < 18 ? 'tarde' : 'noite'
              });
            }
          });
        });

        // Remove duplicates and sort
        const uniqueSlots = allTimeSlots.filter((slot, index, self) => 
          index === self.findIndex(s => s.time === slot.time)
        );
        uniqueSlots.sort((a, b) => a.time.localeCompare(b.time));

        // Filter by time period if specified
        let filteredTimes = uniqueSlots;
        if (time_period) {
          filteredTimes = uniqueSlots.filter(slot => {
            const hour = parseInt(slot.time.split(':')[0]);
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
          occupied_times: Array.from(occupiedTimes),
          blocked_time_ranges: blockedTimeRanges,
          total_day_slots: daySchedules.length,
          message: filteredTimes.length > 0 
            ? `Encontrados ${filteredTimes.length} horários disponíveis para ${date}${time_period ? ` no período ${time_period}` : ''}`
            : `Nenhum horário disponível para ${date}${time_period ? ` no período ${time_period}` : ''}${blockedTimeRanges.length > 0 ? ' (alguns horários bloqueados)' : ''}`
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

      case 'get_professional_calendar_status': {
        const { professional_id } = parameters;
        
        if (!professional_id) {
          result = { error: 'professional_id é obrigatório' };
          break;
        }

        // Get professional info
        const { data: professional, error: profError } = await supabase
          .from('profissionais')
          .select('display_name, ativo')
          .eq('id', professional_id)
          .single();

        if (profError || !professional) {
          result = { error: 'Profissional não encontrado' };
          break;
        }

        if (!professional.ativo) {
          result = { 
            professional_id,
            status: 'inactive',
            message: 'Este profissional está inativo no momento'
          };
          break;
        }

        // Get professional schedules
        const { data: schedules, error: schedError } = await supabase
          .from('profissionais_sessoes')
          .select('*')
          .eq('user_id', professional_id);

        if (schedError || !schedules || schedules.length === 0) {
          result = { 
            professional_id,
            name: professional.display_name,
            status: 'no_schedule',
            message: 'Este profissional não possui horários cadastrados'
          };
          break;
        }

        // Check for upcoming unavailability (next 7 days)
        const today = new Date();
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);
        
        const { data: upcomingBlocks } = await supabase
          .from('professional_unavailability')
          .select('date, all_day, start_time, end_time, reason')
          .eq('professional_id', professional_id)
          .gte('date', today.toISOString().split('T')[0])
          .lte('date', next7Days.toISOString().split('T')[0]);

        // Get next few available slots
        const nextSlots = await getNextAvailableSlots(professional_id, schedules, 3);

        // Organize schedule information
        const scheduleInfo = {
          weekdays: schedules.filter(s => !['saturday', 'sunday'].includes(s.day?.toLowerCase())),
          weekend: schedules.filter(s => ['saturday', 'sunday'].includes(s.day?.toLowerCase())),
          by_period: {
            morning: schedules.filter(s => parseInt(s.start_time.split(':')[0]) < 12),
            afternoon: schedules.filter(s => {
              const hour = parseInt(s.start_time.split(':')[0]);
              return hour >= 12 && hour < 18;
            }),
            evening: schedules.filter(s => parseInt(s.start_time.split(':')[0]) >= 18)
          }
        };

        result = {
          professional_id,
          name: professional.display_name,
          status: 'active',
          schedule_info: scheduleInfo,
          next_available_slots: nextSlots,
          upcoming_blocks: upcomingBlocks || [],
          total_weekly_hours: schedules.length,
          message: `${professional.display_name} está ativo com ${schedules.length} horários semanais disponíveis`
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

// Helper function to get next available slots for a professional (enhanced with CalendarWidget logic)
async function getNextAvailableSlots(professionalId: number, schedules: any[], limit: number = 5) {
  const slots = [];
  const today = new Date();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Map day names to numbers for comparison (same logic as CalendarWidget)
  const dayCodeToNumber = {
    'sun': 0, 'sunday': 0, 'domingo': 0, 'dom': 0,
    'mon': 1, 'monday': 1, 'segunda': 1, 'segunda-feira': 1, 'seg': 1,
    'tue': 2, 'tuesday': 2, 'terça': 2, 'terça-feira': 2, 'terca': 2, 'ter': 2,
    'wed': 3, 'wednesday': 3, 'quarta': 3, 'quarta-feira': 3, 'qua': 3,
    'thu': 4, 'thursday': 4, 'quinta': 4, 'quinta-feira': 4, 'qui': 4,
    'fri': 5, 'friday': 5, 'sexta': 5, 'sexta-feira': 5, 'sex': 5,
    'sat': 6, 'saturday': 6, 'sábado': 6, 'sabado': 6, 'sab': 6
  };
  
  // Generate time slots from schedule ranges (matching CalendarWidget logic)
  const generateTimeSlots = (startTime: string, endTime: string, consultationDuration: number = 50) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Calculate the last possible start time (end time minus consultation duration)
    const lastPossibleStart = new Date(end.getTime() - consultationDuration * 60 * 1000);
    
    // Generate slots every 30 minutes until we reach the last possible start time
    const current = new Date(start);
    while (current <= lastPossibleStart) {
      const timeString = current.toTimeString().substring(0, 5); // HH:MM format
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + 30); // 30-minute intervals
    }
    
    return slots;
  };

  // Helper function to check if a time slot is blocked
  const isTimeBlocked = (timeSlot: string, blockedTimeRanges: any[]) => {
    return blockedTimeRanges.some(range => {
      const slotTime = new Date(`2000-01-01T${timeSlot}:00`);
      const startTime = new Date(`2000-01-01T${range.start}`);
      const endTime = new Date(`2000-01-01T${range.end}`);
      
      // Check if the slot falls within any blocked time range
      // We also need to check if the consultation would end within the blocked period
      const slotEndTime = new Date(slotTime.getTime() + 50 * 60 * 1000); // 50 minutes consultation
      
      return (slotTime >= startTime && slotTime < endTime) || 
             (slotEndTime > startTime && slotEndTime <= endTime) ||
             (slotTime < startTime && slotEndTime > endTime);
    });
  };
  
  // Check next 30 days
  for (let dayOffset = 1; dayOffset <= 30 && slots.length < limit; dayOffset++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + dayOffset);
    const currentDayNumber = checkDate.getDay();
    const dateString = checkDate.toISOString().split('T')[0];
    
    // Filter schedules for this day (matching CalendarWidget logic)
    const daySchedules = schedules.filter(schedule => {
      const sessionDay = schedule.day?.toLowerCase().trim();
      const sessionDayNumber = dayCodeToNumber[sessionDay];
      return sessionDayNumber === currentDayNumber;
    });
    
    if (daySchedules.length === 0) continue;

    // Check for professional unavailability/blocks on this date
    const { data: unavailabilityRecords } = await supabase
      .from('professional_unavailability')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('date', dateString);

    // Check if the entire day is blocked
    const isDayBlocked = unavailabilityRecords?.some(record => record.all_day);
    if (isDayBlocked) continue; // Skip this entire day

    // Check existing appointments for this date
    const { data: existingAppointments } = await supabase
      .from('agendamentos')
      .select('horario, status, payment_status')
      .eq('professional_id', professionalId)
      .eq('data_consulta', dateString)
      .in('status', ['pendente', 'confirmado']);
    
    const occupiedTimes = new Set(
      (existingAppointments || []).map(apt => apt.horario.substring(0, 5))
    );
    
    // Get blocked time ranges for this day
    const blockedTimeRanges = (unavailabilityRecords || [])
      .filter(record => !record.all_day && record.start_time && record.end_time)
      .map(record => ({
        start: record.start_time,
        end: record.end_time
      }));
    
    // Generate available slots for this day
    for (const schedule of daySchedules) {
      const timeSlots = generateTimeSlots(schedule.start_time, schedule.end_time, 50);
      
      for (const timeSlot of timeSlots) {
        if (slots.length >= limit) break;
        
        if (!occupiedTimes.has(timeSlot) && !isTimeBlocked(timeSlot, blockedTimeRanges)) {
          const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
          const dayName = dayNames[checkDate.getDay()];
          
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
            period: parseInt(timeSlot.split(':')[0]) < 12 ? 'manhã' : 
                   parseInt(timeSlot.split(':')[0]) < 18 ? 'tarde' : 'noite',
            booking_url: `/confirmacao-agendamento?professionalId=${professionalId}&date=${dateString}&time=${timeSlot}`
          });
        }
      }
      
      if (slots.length >= limit) break;
    }
  }
  
  return slots;
}