import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DuplicateMatch {
  source_id: number;
  target_id: number;
  source_profile_id: string;
  target_profile_id: string;
  confidence_score: number;
  match_reasons: string[];
  recommended_action: 'merge' | 'review' | 'ignore';
  source_data: ProfessionalSummary;
  target_data: ProfessionalSummary;
}

interface ProfessionalSummary {
  id: number;
  name: string;
  email: string;
  secondary_email?: string;
  photo?: string;
  completeness_score: number;
  has_schedules: boolean;
  schedule_count: number;
  is_orphan: boolean;
  user_id?: number;
  normalized_services?: string[];
  normalized_education?: string[];
  has_summary: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { tenant_id } = await req.json().catch(() => ({}));

    console.log('[Duplicate Detection] Starting detection...');

    // 1. Buscar todos os profissionais com dados de completude
    const professionalsQuery = supabaseClient
      .from('profissionais')
      .select(`
        id,
        user_id,
        profile_id,
        display_name,
        user_email,
        email_secundario,
        foto_perfil_url,
        servicos_normalizados,
        formacao_normalizada,
        resumo_profissional,
        ativo,
        profiles!inner(user_id)
      `)
      .order('display_name');

    const { data: professionals, error: profError } = await professionalsQuery;

    if (profError) throw profError;

    // Filtrar por tenant se especificado
    let filteredProfessionals = professionals;

    if (tenant_id) {
      console.log(`[Duplicate Detection] Filtering by tenant_id: ${tenant_id}`);
      
      // Buscar IDs dos profissionais deste tenant
      const { data: tenantProfessionals, error: tenantError } = await supabaseClient
        .from('professional_tenants')
        .select('professional_id')
        .eq('tenant_id', tenant_id);
      
      if (tenantError) {
        console.error('[Duplicate Detection] Error fetching tenant professionals:', tenantError);
        throw tenantError;
      }
      
      // Criar Set de IDs para filtro rápido
      const tenantProfessionalIds = new Set(
        tenantProfessionals?.map(pt => pt.professional_id) || []
      );
      
      // Filtrar apenas profissionais deste tenant
      filteredProfessionals = professionals?.filter(p => 
        tenantProfessionalIds.has(p.id)
      ) || [];
      
      console.log(`[Duplicate Detection] Filtered to ${filteredProfessionals.length} professionals for tenant`);
    }

    console.log(`[Duplicate Detection] Found ${filteredProfessionals?.length || 0} professionals`);

    // 2. Buscar contagem de horários para cada profissional
    const { data: schedules, error: schedError } = await supabaseClient
      .from('profissionais_sessoes')
      .select('user_id');

    if (schedError) throw schedError;

    const scheduleCounts = schedules?.reduce((acc: Record<number, number>, s: any) => {
      acc[s.user_id] = (acc[s.user_id] || 0) + 1;
      return acc;
    }, {}) || {};

    // 3. Calcular score de completude para cada profissional
    const professionalsSummaries: ProfessionalSummary[] = filteredProfessionals?.map(p => {
      const scheduleCount = scheduleCounts[p.user_id] || 0;
      const completenessScore = 
        (p.foto_perfil_url ? 10 : 0) +
        (p.servicos_normalizados?.length ? 15 : 0) +
        (p.formacao_normalizada?.length ? 10 : 0) +
        (p.resumo_profissional ? 10 : 0) +
        (scheduleCount * 5) +
        (p.ativo ? 20 : 0);

      return {
        id: p.id,
        name: p.display_name,
        email: p.user_email,
        secondary_email: p.email_secundario,
        photo: p.foto_perfil_url,
        completeness_score: completenessScore,
        has_schedules: scheduleCount > 0,
        schedule_count: scheduleCount,
        is_orphan: !p.profiles?.user_id,
        user_id: p.user_id,
        normalized_services: p.servicos_normalizados,
        normalized_education: p.formacao_normalizada,
        has_summary: !!p.resumo_profissional
      };
    }) || [];

    console.log(`[Duplicate Detection] Calculated completeness scores for ${professionalsSummaries.length} professionals`);

    // 4. Detectar duplicatas
    const matches: DuplicateMatch[] = [];

    for (let i = 0; i < professionalsSummaries.length; i++) {
      for (let j = i + 1; j < professionalsSummaries.length; j++) {
        const prof1 = professionalsSummaries[i];
        const prof2 = professionalsSummaries[j];

        const matchReasons: string[] = [];
        let confidenceScore = 0;

        // Nome similar (case insensitive, remove acentos)
        const name1 = prof1.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const name2 = prof2.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        if (name1 === name2) {
          matchReasons.push(`Nome idêntico: ${prof1.name}`);
          confidenceScore += 50;
        } else if (name1.includes(name2) || name2.includes(name1)) {
          matchReasons.push(`Nome similar: ${prof1.name} ≈ ${prof2.name}`);
          confidenceScore += 30;
        }

        // Email compartilhado
        if (prof1.email.toLowerCase() === prof2.email.toLowerCase() ||
            prof1.email.toLowerCase() === prof2.secondary_email?.toLowerCase() ||
            prof1.secondary_email?.toLowerCase() === prof2.email.toLowerCase()) {
          matchReasons.push('Emails compartilhados');
          confidenceScore += 30;
        }

        // Pelo menos um é órfão (alta prioridade)
        if (prof1.is_orphan || prof2.is_orphan) {
          matchReasons.push(prof1.is_orphan ? 
            `${prof1.name} é perfil órfão (sem user_id)` :
            `${prof2.name} é perfil órfão (sem user_id)`
          );
          confidenceScore += 15;
        }

        // Adicionar match se confidence > 40%
        if (confidenceScore >= 40 && matchReasons.length > 0) {
          // Decidir source e target baseado em completude
          const [source, target] = prof1.completeness_score < prof2.completeness_score 
            ? [prof1, prof2] 
            : [prof2, prof1];

          // Buscar profile_ids
          const sourceProf = filteredProfessionals?.find(p => p.id === source.id);
          const targetProf = filteredProfessionals?.find(p => p.id === target.id);

          matches.push({
            source_id: source.id,
            target_id: target.id,
            source_profile_id: sourceProf?.profile_id || '',
            target_profile_id: targetProf?.profile_id || '',
            confidence_score: confidenceScore,
            match_reasons: matchReasons,
            recommended_action: confidenceScore >= 70 ? 'merge' : 'review',
            source_data: source,
            target_data: target
          });

          console.log(`[Duplicate Detection] Found match: ${source.name} (ID ${source.id}) → ${target.name} (ID ${target.id}) with confidence ${confidenceScore}%`);
        }
      }
    }

    console.log(`[Duplicate Detection] Found ${matches.length} duplicate matches`);

    return new Response(
      JSON.stringify({
        success: true,
        duplicates_found: matches.length,
        matches: matches.sort((a, b) => b.confidence_score - a.confidence_score)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[Duplicate Detection] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        duplicates_found: 0,
        matches: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
