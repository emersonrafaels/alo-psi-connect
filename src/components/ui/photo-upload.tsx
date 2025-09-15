import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Image as ImageIcon, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  onPhotoSelected: (file: File | null) => void;
  onPhotoUrlChange: (url: string) => void;
  currentPhotoUrl?: string;
  selectedFile?: File | null;
  label?: string;
  className?: string;
}

export const PhotoUpload = ({ 
  onPhotoSelected,
  onPhotoUrlChange,
  currentPhotoUrl, 
  selectedFile,
  label = "Foto de Perfil",
  className = ""
}: PhotoUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl || '');
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl);
      }
    };
  }, [localObjectUrl]);

  // Update preview when currentPhotoUrl changes
  useEffect(() => {
    if (currentPhotoUrl !== previewUrl) {
      setPreviewUrl(currentPhotoUrl || '');
    }
  }, [currentPhotoUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    // Cleanup previous object URL
    if (localObjectUrl) {
      URL.revokeObjectURL(localObjectUrl);
    }

    // Create local preview URL
    const objectUrl = URL.createObjectURL(file);
    setLocalObjectUrl(objectUrl);
    setPreviewUrl(objectUrl);
    
    // Notify parent component
    onPhotoSelected(file);
  };


  const clearPhoto = () => {
    // Cleanup object URL
    if (localObjectUrl) {
      URL.revokeObjectURL(localObjectUrl);
      setLocalObjectUrl(null);
    }
    
    setPreviewUrl('');
    onPhotoSelected(null);
    onPhotoUrlChange('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show current preview (local file or server URL)
  const displayUrl = localObjectUrl || previewUrl;
  const isPendingSave = !!selectedFile;

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      {/* Preview da foto */}
      {displayUrl && (
        <div className="relative inline-block">
          <img 
            src={displayUrl} 
            alt="Preview" 
            className="w-32 h-32 object-cover rounded-lg border"
          />
          {isPendingSave && (
            <div className="absolute -top-1 -left-1 bg-orange-500 text-white p-1 rounded-full shadow-lg">
              <Clock className="h-3 w-3" />
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={clearPhoto}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Indicador de pendência */}
      {isPendingSave && (
        <p className="text-sm text-orange-600 flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Foto pendente - salve o formulário para enviar
        </p>
      )}

      {/* Upload área */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar uma imagem
            </p>
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Escolher arquivo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF até 10MB
          </p>
        </div>
      </div>
    </div>
  );
};