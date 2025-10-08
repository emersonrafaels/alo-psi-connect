import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BlogImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
}

export const BlogImageUpload = ({ currentImageUrl, onImageUploaded, onImageRemoved }: BlogImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem válida',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      onImageUploaded(publicUrl);
      toast({ title: 'Imagem enviada com sucesso!' });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentImageUrl ? (
        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Preview"
            className="w-full max-w-md rounded-lg object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onImageRemoved}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>{uploading ? 'Enviando...' : 'Selecionar Imagem'}</span>
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
};
