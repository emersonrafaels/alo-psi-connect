import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-amz-date, x-amz-content-sha256',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting upload process...')
    
    // Parse form data first
    const formData = await req.formData()
    const file = formData.get('file') as File
    const professionalId = formData.get('professionalId') as string

    if (!file) {
      throw new Error('No file provided')
    }

    console.log('File received:', file.name, file.type, file.size)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed')
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB')
    }

    // Try S3 upload first, fallback to Supabase Storage
    let publicUrl: string | null = null

    try {
      console.log('Attempting S3 upload...')
      publicUrl = await uploadToS3(file, professionalId)
      console.log('S3 upload successful:', publicUrl)
    } catch (s3Error) {
      console.log('S3 upload failed, trying Supabase Storage fallback...', s3Error)
      try {
        publicUrl = await uploadToSupabaseStorage(file, professionalId)
        console.log('Supabase Storage upload successful:', publicUrl)
      } catch (supabaseError) {
        console.error('Both S3 and Supabase Storage failed:', supabaseError)
        throw new Error('Failed to upload file to any storage service')
      }
    }

    if (!publicUrl) {
      throw new Error('Failed to get upload URL')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        storage: publicUrl.includes('supabase') ? 'supabase' : 's3'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error uploading:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to upload file' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})

// S3 upload function using native fetch with AWS v4 signature
async function uploadToS3(file: File, professionalId?: string): Promise<string> {
  const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
  const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')
  const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured')
  }

  // Generate unique filename
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '')
  const extension = file.name.split('.').pop()
  const fileName = `${professionalId || 'professional'}_${timestamp}.${extension}`
  const key = `imagens/fotosPerfil/profile-pictures/${fileName}`

  const bucketName = 'alopsi-website'
  const region = AWS_REGION
  const host = `${bucketName}.s3.${region}.amazonaws.com`
  const url = `https://${host}/${key}`

  // Get current timestamp and date for AWS signature
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '')
  const dateStamp = amzDate.substr(0, 8)

  // Create canonical request
  const method = 'PUT'
  const canonicalUri = `/${key}`
  const canonicalQuerystring = ''
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const payloadHash = 'UNSIGNED-PAYLOAD'

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`

  // Calculate signature
  const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, region, 's3')
  const signature = await hmacSha256(signingKey, stringToSign)

  // Create authorization header
  const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  // Upload file
  const fileBuffer = await file.arrayBuffer()
  const response = await fetch(url, {
    method: 'PUT',
    body: new Uint8Array(fileBuffer),
    headers: {
      'Content-Type': file.type,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return `https://${bucketName}.s3.amazonaws.com/${key}`
}

// Supabase Storage fallback function
async function uploadToSupabaseStorage(file: File, professionalId?: string): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Generate unique filename
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '')
  const extension = file.name.split('.').pop()
  const fileName = `${professionalId || 'professional'}_${timestamp}.${extension}`
  const filePath = `profile-pictures/${fileName}`

  const fileBuffer = await file.arrayBuffer()
  
  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, new Uint8Array(fileBuffer), {
      contentType: file.type,
      upsert: false
    })

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

// Helper functions for AWS signature
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key: CryptoKey, message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const signature = await crypto.subtle.sign('HMAC', key, msgBuffer)
  const signatureArray = Array.from(new Uint8Array(signature))
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<CryptoKey> {
  const kDate = await hmacSha256Raw(new TextEncoder().encode('AWS4' + key), dateStamp)
  const kRegion = await hmacSha256Raw(kDate, regionName)
  const kService = await hmacSha256Raw(kRegion, serviceName)
  const kSigning = await hmacSha256Raw(kService, 'aws4_request')
  
  return await crypto.subtle.importKey(
    'raw',
    kSigning,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

async function hmacSha256Raw(key: Uint8Array | CryptoKey, message: string): Promise<Uint8Array> {
  let cryptoKey: CryptoKey
  
  if (key instanceof Uint8Array) {
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
  } else {
    cryptoKey = key
  }
  
  const msgBuffer = new TextEncoder().encode(message)
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBuffer)
  return new Uint8Array(signature)
}