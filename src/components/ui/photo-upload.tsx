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
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PhotoUpload = ({ 
  onPhotoSelected,
  onPhotoUrlChange,
  currentPhotoUrl, 
  selectedFile,
  label = "Foto de Perfil",
  className = "",
  compact = false,
  size = 'md'
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
    console.log('PhotoUpload: handleFileSelect triggered');
    
    const file = event.target.files?.[0];
    console.log('PhotoUpload: File selected:', file);
    
    if (!file) {
      console.log('PhotoUpload: No file selected');
      return;
    }

    try {
      console.log('PhotoUpload: Starting file validations...');
      
      // Validações
      if (file.size > 10 * 1024 * 1024) { // 10MB
        console.error('PhotoUpload: File too large:', file.size);
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        console.error('PhotoUpload: Invalid file type:', file.type);
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive",
        });
        return;
      }

      console.log('PhotoUpload: File validations passed');

      // Cleanup previous object URL
      if (localObjectUrl) {
        console.log('PhotoUpload: Cleaning up previous object URL');
        URL.revokeObjectURL(localObjectUrl);
      }

      console.log('PhotoUpload: Creating new object URL...');
      // Create local preview URL
      const objectUrl = URL.createObjectURL(file);
      console.log('PhotoUpload: Object URL created:', objectUrl);
      
      setLocalObjectUrl(objectUrl);
      setPreviewUrl(objectUrl);
      
      console.log('PhotoUpload: Notifying parent component...');
      // Notify parent component
      onPhotoSelected(file);
      
      console.log('PhotoUpload: File selection completed successfully');
    } catch (error) {
      console.error('PhotoUpload: Error in handleFileSelect:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
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

  // Size classes based on size prop
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32', 
    lg: 'w-48 h-48'
  };

  const avatarSize = sizeClasses[size];

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        {!label && <Label className="sr-only">{label}</Label>}
        
        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Avatar com overlay de upload */}
        <div className="relative group">
          {displayUrl ? (
            <img 
              src={displayUrl} 
              alt="Foto de perfil" 
              className={`${avatarSize} object-cover rounded-full border-2 border-border`}
            />
          ) : (
            <div className={`${avatarSize} bg-muted rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center`}>
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {/* Overlay de upload que aparece no hover */}
          <div 
            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5 text-white" />
          </div>

          {/* Indicador de pendência */}
          {isPendingSave && (
            <div className="absolute -top-1 -right-1 bg-orange-500 text-white p-1 rounded-full shadow-lg">
              <Clock className="h-3 w-3" />
            </div>
          )}

          {/* Botão de remover */}
          {displayUrl && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                clearPhoto();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Indicador de pendência abaixo */}
        {isPendingSave && (
          <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
            <Clock className="h-3 w-3" />
            Pendente
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      {/* Preview da foto */}
      {displayUrl && (
        <div className="relative inline-block">
          <img 
            src={displayUrl} 
            alt="Preview" 
            className={`${avatarSize} object-cover rounded-lg border`}
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

      {/* Upload área - só mostra se não tem foto */}
      {!displayUrl && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 transition-colors">
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
                className="w-full hover:bg-primary/10 hover:border-primary/50"
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
      )}

      {/* Botão para trocar foto quando já tem uma */}
      {displayUrl && (
        <>
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
            className="w-full mt-2"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Alterar foto
          </Button>
        </>
      )}
    </div>
  );
};