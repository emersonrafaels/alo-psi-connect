import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Upload, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  uploaded_at: string;
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (media: MediaItem) => void;
}

export const MediaLibrary = ({ isOpen, onClose, onSelect }: MediaLibraryProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['media-library', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('media_library')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`filename.ilike.%${searchTerm}%,alt_text.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media_library').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Mídia deletada com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
    onError: () => {
      toast({
        title: 'Erro ao deletar mídia',
        variant: 'destructive',
      });
    },
  });

  const handleSelect = (media: MediaItem) => {
    onSelect?.(media);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Biblioteca de Mídia</DialogTitle>
          <DialogDescription>
            Selecione uma imagem ou faça upload de uma nova
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou alt text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="default" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>

          {/* Gallery */}
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Carregando mídia...</p>
              </div>
            ) : !mediaItems || mediaItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mídia encontrada</p>
                <p className="text-sm mt-1">Faça upload de imagens para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
                {mediaItems.map((media) => (
                  <Card
                    key={media.id}
                    className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => setSelectedMedia(media)}
                  >
                    <div className="aspect-square bg-muted">
                      <img
                        src={media.url}
                        alt={media.alt_text || media.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(media);
                        }}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(media.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 bg-background">
                      <p className="text-xs truncate">{media.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {media.width && media.height && `${media.width}x${media.height}`}
                        {media.size_bytes && ` • ${(media.size_bytes / 1024).toFixed(0)}KB`}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Preview Dialog */}
        {selectedMedia && (
          <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedMedia.filename}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt_text || selectedMedia.filename}
                  className="w-full rounded-lg"
                />
                <div className="space-y-2 text-sm">
                  {selectedMedia.alt_text && (
                    <p>
                      <strong>Alt Text:</strong> {selectedMedia.alt_text}
                    </p>
                  )}
                  {selectedMedia.caption && (
                    <p>
                      <strong>Legenda:</strong> {selectedMedia.caption}
                    </p>
                  )}
                  <p>
                    <strong>Dimensões:</strong> {selectedMedia.width}x{selectedMedia.height}
                  </p>
                  <p>
                    <strong>Tamanho:</strong> {(selectedMedia.size_bytes / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button onClick={() => handleSelect(selectedMedia)} className="w-full">
                  Selecionar esta imagem
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
