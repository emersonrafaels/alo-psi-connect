import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FindProfessionalRequest {
  name?: string;
  professions?: string[];
  specialties?: string[];
  services?: string[];
  price_min?: number;
  price_max?: number;
  date_start?: string;
  date_end?: string;
  days_of_week?: string[];
  time_start?: string;
  time_end?: string;
  min_available_slots?: number;
  tenant_id?: string;
  tenant_slug?: string;
  limit?: number;
  offset?: number;
  sort_by?: "price_asc" | "price_desc" | "availability" | "featured" | "name";
  include_availability_details?: boolean;
  include_institutions?: boolean;
  minimal?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Find Professional] Request received');

    const body: FindProfessionalRequest = await req.json();
    
    // Validate and set defaults
    const params = validateAndSetDefaults(body);
    console.log('[Find Professional] Parameters:', JSON.stringify(params, null, 2));

    // Resolve tenant_id if tenant_slug provided
    if (params.tenant_slug && !params.tenant_id) {
      console.log(`[Find Professional] Resolving tenant_slug: ${params.tenant_slug}`);
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', params.tenant_slug)
        .single();
      
      if (tenantError) {
        console.error('[Find Professional] Tenant not found:', tenantError);
        throw new Error(`Tenant not found: ${params.tenant_slug}`);
      }
      
      params.tenant_id = tenantData.id;
      console.log(`[Find Professional] Resolved tenant_id: ${params.tenant_id}`);
    }

    // Decide query strategy
    const useRPC = shouldUseRPC(params);
    console.log(`[Find Professional] Using ${useRPC ? 'RPC' : 'direct query'} strategy`);

    let professionals: any[] = [];

    if (useRPC) {
      // Use RPC for availability-based queries
      const rpcName = params.minimal 
        ? 'get_professionals_with_filtered_availability_minimal'
        : 'get_professionals_with_filtered_availability';
      
      console.log(`[Find Professional] Using RPC: ${rpcName}`);
      
      const { data, error } = await supabase.rpc(rpcName, {
        p_date_start: params.date_start,
        p_date_end: params.date_end,
        p_tenant_id: params.tenant_id || null
      });
      
      if (error) {
        console.error('[Find Professional] RPC error:', error);
        throw error;
      }
      
      professionals = data || [];
      console.log(`[Find Professional] RPC returned ${professionals.length} professionals`);
    } else {
      // Use direct query for simpler searches
      let query = supabase
        .from('profissionais')
        .select(`
          *,
          professional_tenants!inner(
            tenant_id,
            is_featured,
            featured_order,
            tenants(id, name, slug)
          )
        `)
        .eq('ativo', true);
      
      if (params.tenant_id) {
        query = query.eq('professional_tenants.tenant_id', params.tenant_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[Find Professional] Direct query error:', error);
        throw error;
      }
      
      professionals = data || [];
      console.log(`[Find Professional] Direct query returned ${professionals.length} professionals`);
    }

    // Apply additional filters
    professionals = applyAdditionalFilters(professionals, params);
    console.log(`[Find Professional] After filters: ${professionals.length} professionals`);

    // Sort results
    professionals = sortResults(professionals, params.sort_by);

    // Get total count before pagination
    const totalCount = professionals.length;

    // Apply pagination
    const paginatedResults = applyPagination(professionals, params.limit, params.offset);
    console.log(`[Find Professional] Returning ${paginatedResults.length} of ${totalCount} professionals`);

    // Format response
    const response = formatResponse(paginatedResults, totalCount, params, startTime);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Find Professional] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function validateAndSetDefaults(body: FindProfessionalRequest) {
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(now.getDate() + 30);
  
  return {
    name: body.name || null,
    professions: Array.isArray(body.professions) ? body.professions : [],
    specialties: Array.isArray(body.specialties) ? body.specialties : [],
    services: Array.isArray(body.services) ? body.services : [],
    price_min: body.price_min || null,
    price_max: body.price_max || null,
    date_start: body.date_start || now.toISOString().split('T')[0],
    date_end: body.date_end || in30Days.toISOString().split('T')[0],
    days_of_week: Array.isArray(body.days_of_week) ? body.days_of_week : [],
    time_start: body.time_start || null,
    time_end: body.time_end || null,
    min_available_slots: body.min_available_slots || 0,
    tenant_id: body.tenant_id || null,
    tenant_slug: body.tenant_slug || null,
    limit: Math.min(body.limit || 10, 50),
    offset: body.offset || 0,
    sort_by: body.sort_by || 'featured',
    include_availability_details: body.include_availability_details !== false,
    include_institutions: body.include_institutions || false,
    minimal: body.minimal || false
  };
}

function shouldUseRPC(params: any): boolean {
  // Use RPC when availability filtering is needed
  return params.date_start || params.date_end || 
         params.days_of_week.length > 0 || 
         params.time_start || params.time_end ||
         params.min_available_slots > 0;
}

function applyAdditionalFilters(professionals: any[], params: any) {
  let filtered = [...professionals];
  
  // Name filter
  if (params.name) {
    const nameLower = params.name.toLowerCase();
    filtered = filtered.filter(p => 
      p.display_name?.toLowerCase().includes(nameLower) ||
      p.profissao?.toLowerCase().includes(nameLower)
    );
  }
  
  // Professions filter
  if (params.professions.length > 0) {
    filtered = filtered.filter(p => 
      p.profissao && params.professions.some(prof => 
        p.profissao.toLowerCase().includes(prof.toLowerCase())
      )
    );
  }
  
  // Specialties/Services filter
  if (params.specialties.length > 0 || params.services.length > 0) {
    const searchTerms = [...params.specialties, ...params.services];
    filtered = filtered.filter(p => {
      const services = p.servicos_normalizados || [];
      return searchTerms.some(term => 
        services.some((s: string) => s.toLowerCase().includes(term.toLowerCase()))
      );
    });
  }
  
  // Price range filter
  if (params.price_min) {
    filtered = filtered.filter(p => 
      p.preco_consulta && p.preco_consulta >= params.price_min
    );
  }
  if (params.price_max) {
    filtered = filtered.filter(p => 
      p.preco_consulta && p.preco_consulta <= params.price_max
    );
  }
  
  // Min available slots filter
  if (params.min_available_slots > 0) {
    filtered = filtered.filter(p => 
      p.total_slots_available >= params.min_available_slots
    );
  }
  
  // Days of week filter
  if (params.days_of_week.length > 0) {
    filtered = filtered.filter(p => {
      if (!p.available_dates) return false;
      return p.available_dates.some((slot: any) => {
        const date = new Date(slot.date);
        const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
        return params.days_of_week.includes(dayOfWeek);
      });
    });
  }
  
  // Time range filter
  if (params.time_start || params.time_end) {
    filtered = filtered.filter(p => {
      if (!p.available_dates) return false;
      return p.available_dates.some((slot: any) => {
        let matches = true;
        if (params.time_start) {
          matches = matches && slot.slot_start >= params.time_start;
        }
        if (params.time_end) {
          matches = matches && slot.slot_end <= params.time_end;
        }
        return matches;
      });
    });
  }
  
  return filtered;
}

function sortResults(professionals: any[], sortBy: string) {
  const sorted = [...professionals];
  
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => 
        (a.preco_consulta || 999999) - (b.preco_consulta || 999999)
      );
    case 'price_desc':
      return sorted.sort((a, b) => 
        (b.preco_consulta || 0) - (a.preco_consulta || 0)
      );
    case 'availability':
      return sorted.sort((a, b) => 
        (b.total_slots_available || 0) - (a.total_slots_available || 0)
      );
    case 'name':
      return sorted.sort((a, b) => 
        a.display_name.localeCompare(b.display_name)
      );
    case 'featured':
    default:
      return sorted.sort((a, b) => {
        // First by featured
        if (a.em_destaque !== b.em_destaque) {
          return b.em_destaque ? 1 : -1;
        }
        // Then by featured order
        const orderA = a.ordem_destaque ?? 999;
        const orderB = b.ordem_destaque ?? 999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // Finally by name
        return a.display_name.localeCompare(b.display_name);
      });
  }
}

function applyPagination(professionals: any[], limit: number, offset: number) {
  return professionals.slice(offset, offset + limit);
}

function formatResponse(professionals: any[], totalCount: number, params: any, startTime: number) {
  const formatted = professionals.map(p => {
    // Base object with fields available in both minimal and full modes
    const base: any = {
      id: p.id || p.professional_id,
      profile_id: p.profile_id,
      display_name: p.display_name,
      profession: p.profissao,
      registration: p.crp_crm,
      specialties: p.servicos_normalizados || [],
      services: p.servicos_normalizados || [],
      consultation_price: p.preco_consulta,
      availability_summary: {
        total_slots: p.total_slots_available || 0,
        days_available: p.days_available || 0,
        next_available_date: p.next_available_date,
        last_available_date: p.last_available_date,
        slots_per_day: params.include_availability_details ? p.slots_per_day : undefined
      },
      tenant: p.tenant_info ? {
        id: p.tenant_info?.tenant_id,
        name: p.tenant_info?.tenant_name,
        slug: p.tenant_info?.tenant_slug,
        is_featured: p.tenant_info?.is_featured || false,
        featured_order: p.tenant_info?.featured_order
      } : (p.professional_tenants && p.professional_tenants[0] ? {
        id: p.professional_tenants[0].tenants.id,
        name: p.professional_tenants[0].tenants.name,
        slug: p.professional_tenants[0].tenants.slug,
        is_featured: p.professional_tenants[0].is_featured || false,
        featured_order: p.professional_tenants[0].featured_order
      } : null),
      is_active: p.ativo,
      is_featured: p.em_destaque || false,
      featured_order: p.ordem_destaque
    };

    // Add demographics if available (in minimal mode)
    if (p.genero !== undefined || p.data_nascimento !== undefined || 
        p.raca !== undefined || p.sexualidade !== undefined) {
      base.demographics = {
        gender: p.genero,
        birth_date: p.data_nascimento,
        race: p.raca,
        sexuality: p.sexualidade
      };
    }

    // Add full mode fields (only if not minimal)
    if (!params.minimal) {
      base.photo_url = p.foto_perfil_url;
      base.summary = p.resumo_profissional;
      base.email = p.user_email;
      base.phone = p.telefone;
      base.linkedin = p.linkedin;
      base.consultation_duration = p.tempo_consulta;
      base.available_slots = params.include_availability_details ? p.available_dates : undefined;
      base.regular_schedule = params.include_availability_details ? p.schedule_summary : undefined;
      base.institutions = params.include_institutions ? p.institutions : undefined;
    }

    return base;
  });
  
  return {
    success: true,
    data: {
      professionals: formatted,
      total_count: totalCount,
      returned_count: formatted.length,
      filters_applied: {
        name: params.name,
        professions: params.professions,
        specialties: params.specialties,
        services: params.services,
        price_range: params.price_min || params.price_max ? {
          min: params.price_min,
          max: params.price_max
        } : null,
        availability: {
          date_start: params.date_start,
          date_end: params.date_end,
          days_of_week: params.days_of_week,
          time_start: params.time_start,
          time_end: params.time_end,
          min_slots: params.min_available_slots
        },
        tenant: params.tenant_slug || params.tenant_id,
        pagination: {
          limit: params.limit,
          offset: params.offset
        },
        sort_by: params.sort_by,
        minimal: params.minimal
      },
      search_metadata: {
        search_time_ms: Date.now() - startTime,
        date_range: {
          start: params.date_start,
          end: params.date_end
        },
        response_mode: params.minimal ? 'minimal' : 'full'
      }
    }
  };
}
