import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('User authenticated:', user.id)

    // Parse JSON body (não FormData)
    const body = await req.json()
    
    // Suportar ambos formatos: fileName/fileType E filename/type
    const base64File = body.file
    const fileName = body.fileName || body.filename
    const fileType = body.fileType || body.type
    const professionalId = body.professionalId

    console.log('Request body keys:', Object.keys(body))
    console.log('Parsed values:', { fileName, fileType, professionalId })

    if (!base64File) {
      throw new Error('No file provided')
    }

    if (!fileName) {
      throw new Error('No fileName provided')
    }

    if (!fileType) {
      throw new Error('No fileType provided')
    }

    if (!fileType.startsWith('image/')) {
      throw new Error('Only image files are allowed')
    }

    // Converter base64 de volta para File/Blob
    const fileBuffer = Uint8Array.from(atob(base64File), c => c.charCodeAt(0))
    const file = new File([fileBuffer], fileName, { type: fileType })

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds 10MB limit')
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      professionalId
    })

    // Get user profile data for folder structure
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, tipo_usuario')
      .eq('user_id', user.id)
      .single()

    console.log('User profile:', profile)

    // Try S3 upload first
    try {
      const s3Url = await uploadToS3(file, user, profile, professionalId)
      if (s3Url) {
        console.log('S3 upload successful:', s3Url)
        return new Response(
          JSON.stringify({ url: s3Url }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    } catch (s3Error) {
      console.log('S3 upload failed, falling back to Supabase Storage:', s3Error)
    }

    // Fallback to Supabase Storage
    const supabaseUrl_final = await uploadToSupabaseStorage(supabase, file, user, profile)
    if (supabaseUrl_final) {
      console.log('Supabase Storage upload successful:', supabaseUrl_final)
      return new Response(
        JSON.stringify({ url: supabaseUrl_final }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    throw new Error('Both S3 and Supabase Storage uploads failed')

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function uploadToS3(
  file: File, 
  user: any, 
  profile: any, 
  professionalId: string
): Promise<string | null> {
  const region = Deno.env.get('AWS_REGION') || 'us-east-1'
  const bucket = 'alopsi-uploads'
  const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
  const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured')
  }

  const { fileName, folderPath } = generateFileName(file, user, profile, professionalId)
  const key = `${folderPath}/${fileName}`

  console.log('S3 upload details:', { bucket, key, region })

  // Generate S3 signed URL and upload
  const host = `${bucket}.s3.${region}.amazonaws.com`
  const url = `https://${host}/${key}`
  
  const date = new Date()
  const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = date.toISOString().replace(/[:\-]|\.\d{3}/g, '')
  
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const credential = `${accessKeyId}/${credentialScope}`

  const signatureKey = await getSignatureKey(secretAccessKey, dateStamp, region, 's3')
  
  const headers = {
    'Host': host,
    'X-Amz-Date': amzDate,
    'X-Amz-Content-Sha256': await sha256(await file.arrayBuffer()),
    'Content-Type': file.type,
  }

  const canonicalHeaders = Object.entries(headers)
    .map(([key, value]) => `${key.toLowerCase()}:${value}`)
    .join('\n') + '\n'

  const signedHeaders = Object.keys(headers)
    .map(key => key.toLowerCase())
    .sort()
    .join(';')

  const canonicalRequest = [
    'PUT',
    `/${key}`,
    '',
    canonicalHeaders,
    signedHeaders,
    headers['X-Amz-Content-Sha256']
  ].join('\n')

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n')

  const signature = await hmacSha256(signatureKey, stringToSign)
  
  const authorizationHeader = `${algorithm} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const uploadResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Authorization': authorizationHeader,
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
  }

  return url
}

async function uploadToSupabaseStorage(
  supabase: any,
  file: File,
  user: any,
  profile: any
): Promise<string | null> {
  const { fileName } = generateFileName(file, user, profile, user.id)
  const filePath = `${user.id}/${fileName}`

  console.log('Supabase Storage upload:', { filePath })

  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath)

  return publicUrlData?.publicUrl || null
}

async function sha256(message: string | ArrayBuffer): Promise<string> {
  const msgBuffer = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key: CryptoKey, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Promise<CryptoKey> {
  const kDate = await hmacSha256Raw(new TextEncoder().encode('AWS4' + key), dateStamp)
  const kRegion = await hmacSha256Raw(kDate, regionName)
  const kService = await hmacSha256Raw(kRegion, serviceName)
  const kSigning = await hmacSha256Raw(kService, 'aws4_request')
  return kSigning
}

async function hmacSha256Raw(key: Uint8Array | CryptoKey, message: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = key instanceof Uint8Array ? key : await crypto.subtle.exportKey('raw', key)
  const keyBuffer = keyData instanceof Uint8Array ? keyData.buffer as ArrayBuffer : keyData as ArrayBuffer;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return cryptoKey
}

function generateFileName(
  file: File,
  user: any,
  profile: any,
  professionalId: string
): { fileName: string; folderPath: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const extension = file.name.split('.').pop() || 'jpg'
  const userType = profile?.tipo_usuario || 'user'
  const userName = profile?.nome ? sanitizeName(profile.nome) : 'unnamed'
  
  const fileName = `${userName}-${user.id}-${professionalId}-${timestamp}.${extension}`
  const folderPath = `${userType}-photos/${sanitizeName(userName)}-${user.id}`
  
  return { fileName, folderPath }
}

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}