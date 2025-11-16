import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LinkUserRequest {
  institutionId: string;
  profileId: string;
  userType: 'paciente' | 'profissional';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('❌ [Link User] Erro de autenticação:', authError)
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente com service role para bypassar RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se é institution_admin ou super_admin
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('❌ [Link User] Erro ao buscar roles:', rolesError)
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hasPermission = userRoles?.some(r => 
      r.role === 'institution_admin' || r.role === 'super_admin'
    )

    if (!hasPermission) {
      console.error('❌ [Link User] Usuário sem permissão')
      return new Response(
        JSON.stringify({ error: 'Sem permissão para vincular usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { institutionId, profileId, userType }: LinkUserRequest = await req.json()

    console.log(`📋 [Link User] Vinculando ${userType} ${profileId} à instituição ${institutionId}`)

    if (userType === 'paciente') {
      // Buscar patient_id
      const { data: patient, error: patientError } = await supabaseAdmin
        .from('pacientes')
        .select('id')
        .eq('profile_id', profileId)
        .single()

      if (patientError || !patient) {
        console.error('❌ [Link User] Perfil de paciente não encontrado:', patientError)
        return new Response(
          JSON.stringify({ error: 'Perfil de paciente não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Inserir vínculo
      const { error: linkError } = await supabaseAdmin
        .from('patient_institutions')
        .insert({
          patient_id: patient.id,
          institution_id: institutionId,
          enrollment_status: 'enrolled'
        })

      if (linkError) {
        // Se for erro de chave duplicada, retornar sucesso com flag
        if (linkError.code === '23505') {
          console.log('⚠️ [Link User] Paciente já vinculado à instituição')
          return new Response(
            JSON.stringify({ success: true, message: 'Paciente já vinculado', alreadyLinked: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.error('❌ [Link User] Erro ao vincular paciente:', linkError)
        return new Response(
          JSON.stringify({ error: 'Erro ao vincular paciente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [Link User] Paciente vinculado com sucesso')
      
      // Enviar notificação por email
      try {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('nome, email')
          .eq('id', profileId)
          .single()

        if (!profileError && profile) {
          const { data: institution, error: instError } = await supabaseAdmin
            .from('educational_institutions')
            .select('name')
            .eq('id', institutionId)
            .single()

          if (!instError && institution) {
            await supabaseAdmin.functions.invoke('notify-institution-link', {
              body: {
                userEmail: profile.email,
                userName: profile.nome,
                institutionName: institution.name,
                role: 'student'
              }
            })
            console.log('📧 [Link User] Email de notificação enviado para paciente')
          }
        }
      } catch (emailError) {
        console.warn('⚠️ [Link User] Erro ao enviar email (vínculo criado com sucesso):', emailError)
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Paciente vinculado com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Buscar professional_id
      const { data: professional, error: professionalError } = await supabaseAdmin
        .from('profissionais')
        .select('id')
        .eq('profile_id', profileId)
        .single()

      if (professionalError || !professional) {
        console.error('❌ [Link User] Perfil de profissional não encontrado:', professionalError)
        return new Response(
          JSON.stringify({ error: 'Perfil de profissional não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Inserir vínculo
      const { error: linkError } = await supabaseAdmin
        .from('professional_institutions')
        .insert({
          professional_id: professional.id,
          institution_id: institutionId,
          relationship_type: 'partner',
          is_active: true
        })

      if (linkError) {
        // Se for erro de chave duplicada, retornar sucesso com flag
        if (linkError.code === '23505') {
          console.log('⚠️ [Link User] Profissional já vinculado à instituição')
          return new Response(
            JSON.stringify({ success: true, message: 'Profissional já vinculado', alreadyLinked: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.error('❌ [Link User] Erro ao vincular profissional:', linkError)
        return new Response(
          JSON.stringify({ error: 'Erro ao vincular profissional' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [Link User] Profissional vinculado com sucesso')
      
      // Enviar notificação por email
      try {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('nome, email')
          .eq('id', profileId)
          .single()

        if (!profileError && profile) {
          const { data: institution, error: instError } = await supabaseAdmin
            .from('educational_institutions')
            .select('name')
            .eq('id', institutionId)
            .single()

          if (!instError && institution) {
            await supabaseAdmin.functions.invoke('notify-institution-link', {
              body: {
                userEmail: profile.email,
                userName: profile.nome,
                institutionName: institution.name,
                role: 'professional'
              }
            })
            console.log('📧 [Link User] Email de notificação enviado para profissional')
          }
        }
      } catch (emailError) {
        console.warn('⚠️ [Link User] Erro ao enviar email (vínculo criado com sucesso):', emailError)
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Profissional vinculado com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('❌ [Link User] Erro inesperado:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
