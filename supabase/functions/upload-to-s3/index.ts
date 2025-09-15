import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting upload to S3...')
    
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured')
    }

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

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '')
    const extension = file.name.split('.').pop()
    const fileName = `${professionalId || 'professional'}_${timestamp}.${extension}`
    const key = `imagens/fotosPerfil/profile-pictures/${fileName}`

    const fileBuffer = await file.arrayBuffer()
    
    console.log('Uploading to S3 with key:', key)

    // Direct fetch to AWS S3 API instead of using SDK
    const url = `https://alopsi-website.s3.amazonaws.com/${key}`
    
    const response = await fetch(url, {
      method: 'PUT',
      body: new Uint8Array(fileBuffer),
      headers: {
        'Content-Type': file.type,
        'x-amz-acl': 'public-read',
        'Authorization': `AWS ${AWS_ACCESS_KEY_ID}:${await generateSignature(key, file.type, AWS_SECRET_ACCESS_KEY)}`,
      },
    })

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`)
    }

    const publicUrl = `https://alopsi-website.s3.amazonaws.com/${key}`

    console.log('Upload successful, URL:', publicUrl)

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        key: key 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error uploading to S3:', error)
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

// Simple signature generation for AWS S3
async function generateSignature(key: string, contentType: string, secretKey: string): Promise<string> {
  const stringToSign = `PUT\n\n${contentType}\n\nx-amz-acl:public-read\n/${key}`
  
  const encoder = new TextEncoder()
  const data = encoder.encode(stringToSign)
  const keyData = encoder.encode(secretKey)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
  
  return base64Signature
}