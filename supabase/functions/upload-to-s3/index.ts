import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.400.0"

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

    console.log('AWS credentials found, initializing S3 client...')

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })

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

    const command = new PutObjectCommand({
      Bucket: 'alopsi-website',
      Key: key,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
      ACL: 'public-read',
    })

    await s3Client.send(command)

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