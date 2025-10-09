import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Upload, ExternalLink, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfessionalTenantsEditor } from '@/components/admin/ProfessionalTenantsEditor'

interface Professional {
  id: number
  display_name: string
  email_secundario?: string
  telefone?: string
  profissao?: string
  resumo_profissional?: string
  ativo: boolean
  foto_perfil_url?: string
  user_email: string
  crp_crm?: string
  preco_consulta?: number
  tempo_consulta?: number
}

interface EditProfessionalModalProps {
  professional: Professional | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const EditProfessionalModal = ({ 
  professional, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditProfessionalModalProps) => {
  const [formData, setFormData] = useState<Partial<Professional>>({})
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (professional) {
      setFormData({
        display_name: professional.display_name,
        email_secundario: professional.email_secundario || '',
        telefone: professional.telefone || '',
        profissao: professional.profissao || '',
        resumo_profissional: professional.resumo_profissional || '',
        crp_crm: professional.crp_crm || '',
        preco_consulta: professional.preco_consulta || 0,
        tempo_consulta: professional.tempo_consulta || 60,
        foto_perfil_url: professional.foto_perfil_url || ''
      })
      setPhotoUrl('')
    }
  }, [professional])

  const handleFileUpload = async (file: File) => {
    if (!professional) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('professionalId', professional.id.toString())

      const response = await fetch('/functions/v1/upload-to-s3', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formDataUpload
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload')
      }

      setFormData(prev => ({ ...prev, foto_perfil_url: result.url }))
      toast({
        title: 'Sucesso',
        description: 'Foto enviada com sucesso para o S3!'
      })
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da foto',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoUrlSubmit = () => {
    if (photoUrl.trim()) {
      setFormData(prev => ({ ...prev, foto_perfil_url: photoUrl.trim() }))
      setPhotoUrl('')
      toast({
        title: 'Sucesso',
        description: 'URL da foto atualizada!'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!professional) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({
          display_name: formData.display_name,
          email_secundario: formData.email_secundario,
          telefone: formData.telefone,
          profissao: formData.profissao,
          resumo_profissional: formData.resumo_profissional,
          crp_crm: formData.crp_crm,
          preco_consulta: formData.preco_consulta,
          tempo_consulta: formData.tempo_consulta,
          foto_perfil_url: formData.foto_perfil_url
        })
        .eq('id', professional.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Profissional atualizado com sucesso!'
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar profissional',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!professional) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Profissional</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Section */}
          <div className="flex items-start space-x-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.foto_perfil_url} />
                <AvatarFallback className="text-xl">
                  {getInitials(formData.display_name || professional.display_name)}
                </AvatarFallback>
              </Avatar>
              
              <Tabs defaultValue="upload" className="w-80">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="tenants">Sites</TabsTrigger>
              </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fazer Upload (S3)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        disabled={uploading}
                      />
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Será enviado para: s3://alopsi-website/imagens/fotosPerfil/profile-pictures/
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label>URL da Imagem</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="https://exemplo.com/foto.jpg"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handlePhotoUrlSubmit}
                        disabled={!photoUrl.trim()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="tenants">
                <ProfessionalTenantsEditor
                  professionalId={professional.id}
                  onSuccess={() => {
                    toast({
                      title: 'Sucesso',
                      description: 'Associações de sites atualizadas!',
                    });
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

            {/* Form Fields */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome</Label>
                <Input
                  id="display_name"
                  value={formData.display_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  value={formData.profissao || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, profissao: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_secundario">Email Secundário</Label>
                <Input
                  id="email_secundario"
                  type="email"
                  value={formData.email_secundario || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_secundario: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crp_crm">CRP/CRM</Label>
                <Input
                  id="crp_crm"
                  value={formData.crp_crm || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, crp_crm: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco_consulta">Preço da Consulta (R$)</Label>
                <Input
                  id="preco_consulta"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preco_consulta || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco_consulta: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="tempo_consulta">Tempo da Consulta (minutos)</Label>
                <Input
                  id="tempo_consulta"
                  type="number"
                  min="15"
                  max="180"
                  value={formData.tempo_consulta || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempo_consulta: parseInt(e.target.value) || 60 }))}
                />
              </div>
            </div>
          </div>

          {/* Resume Field */}
          <div className="space-y-2">
            <Label htmlFor="resumo_profissional">Resumo Profissional</Label>
            <Textarea
              id="resumo_profissional"
              value={formData.resumo_profissional || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, resumo_profissional: e.target.value }))}
              rows={4}
              placeholder="Descrição profissional, especialidades, experiência..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}