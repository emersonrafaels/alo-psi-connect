import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Known institution domain mappings
const KNOWN_INSTITUTIONS: Record<string, string> = {
  'universidade de são paulo': 'usp.br',
  'usp': 'usp.br',
  'universidade estadual de campinas': 'unicamp.br',
  'unicamp': 'unicamp.br',
  'pontifícia universidade católica de são paulo': 'pucsp.br',
  'puc-sp': 'pucsp.br',
  'puc sp': 'pucsp.br',
  'centro universitário são camilo': 'saocamilo-sp.br',
  'são camilo': 'saocamilo-sp.br',
  'unisantos': 'unisantos.br',
  'universidade católica de santos': 'unisantos.br',
  'mackenzie': 'mackenzie.br',
  'universidade presbiteriana mackenzie': 'mackenzie.br',
  'unesp': 'unesp.br',
  'universidade estadual paulista': 'unesp.br',
  'unifesp': 'unifesp.br',
  'universidade federal de são paulo': 'unifesp.br',
  'ufrj': 'ufrj.br',
  'universidade federal do rio de janeiro': 'ufrj.br',
  'ufmg': 'ufmg.br',
  'universidade federal de minas gerais': 'ufmg.br',
  'ufpr': 'ufpr.br',
  'universidade federal do paraná': 'ufpr.br',
  'ufrgs': 'ufrgs.br',
  'universidade federal do rio grande do sul': 'ufrgs.br',
  'ufsc': 'ufsc.br',
  'universidade federal de santa catarina': 'ufsc.br',
  'unb': 'unb.br',
  'universidade de brasília': 'unb.br',
  'ufba': 'ufba.br',
  'universidade federal da bahia': 'ufba.br',
  'ufpe': 'ufpe.br',
  'universidade federal de pernambuco': 'ufpe.br',
  'ufce': 'ufc.br',
  'universidade federal do ceará': 'ufc.br',
  'insper': 'insper.edu.br',
  'fgv': 'fgv.br',
  'fundação getúlio vargas': 'fgv.br',
  'ibmec': 'ibmec.br',
  'anhembi morumbi': 'anhembi.br',
  'universidade anhembi morumbi': 'anhembi.br',
  'uninove': 'uninove.br',
  'unip': 'unip.br',
  'universidade paulista': 'unip.br',
  'estácio': 'estacio.br',
  'universidade estácio de sá': 'estacio.br',
  'anhanguera': 'anhanguera.com',
  'unopar': 'unopar.br',
  'cruzeiro do sul': 'cruzeirodosul.edu.br',
  'faculdade de ciências médicas de santos': 'unisantos.br',
  'fcms': 'unisantos.br',
  'fcmscsp': 'fcmsantacasasp.edu.br',
  'santa casa de são paulo': 'fcmsantacasasp.edu.br',
  'albert einstein': 'einstein.br',
  'hospital israelita albert einstein': 'einstein.br',
  'sírio-libanês': 'hospitalsiriolibanes.org.br',
  'hospital sírio-libanês': 'hospitalsiriolibanes.org.br',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const body = await req.json()
    const { institutionId, institutionName, fetchAll } = body

    console.log('Fetch institution logos request:', { institutionId, institutionName, fetchAll })

    const results: { id: string; name: string; logo_url: string | null; status: string }[] = []

    if (fetchAll) {
      // Fetch logos for all institutions without logos
      const { data: institutions, error } = await supabase
        .from('educational_institutions')
        .select('id, name, logo_url')
        .is('logo_url', null)

      if (error) throw error

      console.log(`Found ${institutions?.length || 0} institutions without logos`)

      for (const inst of institutions || []) {
        const logoUrl = await findLogoForInstitution(inst.name)
        
        if (logoUrl) {
          // Update the institution with the found logo
          await supabase
            .from('educational_institutions')
            .update({ logo_url: logoUrl })
            .eq('id', inst.id)
        }

        results.push({
          id: inst.id,
          name: inst.name,
          logo_url: logoUrl,
          status: logoUrl ? 'found' : 'not_found'
        })
      }
    } else if (institutionId || institutionName) {
      // Fetch logo for a specific institution
      let name = institutionName

      if (institutionId && !institutionName) {
        const { data: inst } = await supabase
          .from('educational_institutions')
          .select('name')
          .eq('id', institutionId)
          .single()
        
        name = inst?.name
      }

      if (name) {
        const logoUrl = await findLogoForInstitution(name)
        
        if (logoUrl && institutionId) {
          await supabase
            .from('educational_institutions')
            .update({ logo_url: logoUrl })
            .eq('id', institutionId)
        }

        results.push({
          id: institutionId || '',
          name: name,
          logo_url: logoUrl,
          status: logoUrl ? 'found' : 'not_found'
        })
      }
    }

    const found = results.filter(r => r.status === 'found').length
    const notFound = results.filter(r => r.status === 'not_found').length

    console.log(`Logo search complete: ${found} found, ${notFound} not found`)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: { found, notFound, total: results.length }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching institution logos:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function findLogoForInstitution(name: string): Promise<string | null> {
  const normalizedName = name.toLowerCase().trim()
  
  // Check known mappings first
  let domain = KNOWN_INSTITUTIONS[normalizedName]
  
  if (!domain) {
    // Try to find partial matches
    for (const [key, value] of Object.entries(KNOWN_INSTITUTIONS)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        domain = value
        break
      }
    }
  }

  if (!domain) {
    // Try to extract acronym from name (e.g., "Universidade XYZ (ABC)" -> abc)
    const acronymMatch = name.match(/\(([A-Z]{2,10})\)/i)
    if (acronymMatch) {
      const acronym = acronymMatch[1].toLowerCase()
      domain = KNOWN_INSTITUTIONS[acronym]
    }
  }

  if (!domain) {
    console.log(`No domain mapping found for: ${name}`)
    return null
  }

  // Use Clearbit Logo API (free, no auth required)
  const logoUrl = `https://logo.clearbit.com/${domain}`
  
  try {
    // Verify the logo exists
    const response = await fetch(logoUrl, { method: 'HEAD' })
    
    if (response.ok) {
      console.log(`Found logo for ${name}: ${logoUrl}`)
      return logoUrl
    } else {
      console.log(`Logo not found at Clearbit for ${domain}`)
      return null
    }
  } catch (error) {
    console.log(`Error checking logo for ${domain}:`, error)
    return null
  }
}
