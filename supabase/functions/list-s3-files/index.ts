import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AWS Signature v4 helper function
async function createSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  payload: string,
  region: string,
  service: string,
  accessKey: string,
  secretKey: string
) {
  const encoder = new TextEncoder()
  
  // Create canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
    .join('')
    
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';')
    
  const urlObj = new URL(url)
  const canonicalRequest = [
    method,
    urlObj.pathname,
    urlObj.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    await sha256(payload)
  ].join('\n')

  // Create string to sign
  const date = new Date()
  const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = date.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n')

  // Calculate signature
  const signingKey = await getSignatureKey(secretKey, dateStamp, region, service)
  const signature = await hmac(signingKey, stringToSign)
  
  return `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmac(key: Uint8Array, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const kDate = await hmacRaw(new TextEncoder().encode('AWS4' + key), dateStamp)
  const kRegion = await hmacRaw(kDate, regionName)
  const kService = await hmacRaw(kRegion, serviceName)
  const kSigning = await hmacRaw(kService, 'aws4_request')
  return kSigning
}

async function hmacRaw(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return new Uint8Array(signature)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured')
    }

    console.log('Making S3 request with region:', AWS_REGION)

    // S3 list objects request
    const bucket = 'alopsi-website'
    const prefix = 'imagens/fotosPerfil/profile-pictures/'
    const url = `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/?list-type=2&prefix=${encodeURIComponent(prefix)}`
    
    const date = new Date()
    const timestamp = date.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
    
    const headers = {
      'Host': `${bucket}.s3.${AWS_REGION}.amazonaws.com`,
      'X-Amz-Date': timestamp,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
    }

    const authorization = await createSignature(
      'GET',
      url,
      headers,
      '',
      AWS_REGION,
      's3',
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY
    )

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Authorization': authorization,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('S3 API Error:', response.status, errorText)
      throw new Error(`S3 API returned ${response.status}: ${errorText}`)
    }

    const xmlText = await response.text()
    console.log('S3 response received, parsing XML')
    
    // Parse XML response manually (simple parser for ListObjectsV2)
    const files: Array<{
      key: string;
      lastModified: string;
      size: number;
      url: string;
    }> = []

    // Extract Contents elements
    const contentsRegex = /<Contents>(.*?)<\/Contents>/gs
    const matches = xmlText.matchAll(contentsRegex)
    
    for (const match of matches) {
      const content = match[1]
      
      const keyMatch = content.match(/<Key>(.*?)<\/Key>/)
      const lastModifiedMatch = content.match(/<LastModified>(.*?)<\/LastModified>/)
      const sizeMatch = content.match(/<Size>(.*?)<\/Size>/)
      
      if (keyMatch && lastModifiedMatch && sizeMatch) {
        const key = keyMatch[1]
        const lastModified = lastModifiedMatch[1]
        const size = parseInt(sizeMatch[1])
        
        files.push({
          key,
          lastModified,
          size,
          url: `https://${bucket}.s3.amazonaws.com/${key}`
        })
      }
    }

    console.log(`Found ${files.length} files`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        files,
        count: files.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error listing S3 files:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to list files' 
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