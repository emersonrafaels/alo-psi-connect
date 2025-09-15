import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3.441.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })

    const command = new ListObjectsV2Command({
      Bucket: 'alopsi-website',
      Prefix: 'imagens/fotosPerfil/profile-pictures/',
    })

    const response = await s3Client.send(command)
    
    const files = response.Contents?.map(obj => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
      url: `https://alopsi-website.s3.amazonaws.com/${obj.Key}`
    })) || []

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