import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Link as LinkIcon, Check } from 'lucide-react';

interface S3File {
  key: string;
  url: string;
  lastModified: string;
  size: number;
}

interface Professional {
  id: number;
  display_name: string;
  user_email: string;
  foto_perfil_url: string | null;
  profissao: string;
  telefone: string;
}

interface ImageAssociationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImageAssociationModal = ({ open, onOpenChange }: ImageAssociationModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [s3Files, setS3Files] = useState<S3File[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [associations, setAssociations] = useState<Record<number, string>>({});

  const fetchS3Files = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('list-s3-files');
      if (error) throw error;
      setS3Files(data.files || []);
    } catch (error) {
      console.error('Error fetching S3 files:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os arquivos do S3",
        variant: "destructive",
      });
    }
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, display_name, user_email, foto_perfil_url, profissao, telefone')
        .order('display_name');
      
      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      toast({
        title: "Erro", 
        description: "Não foi possível carregar os profissionais",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchS3Files(), fetchProfessionals()]).finally(() => {
        setLoading(false);
      });
    }
  }, [open]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const suggestMatches = (file: S3File): Professional[] => {
    const fileName = file.key.split('/').pop() || '';
    const baseName = fileName.split('_')[0] || fileName.split('.')[0];
    const normalizedFileName = normalizeString(baseName);

    return professionals
      .filter(prof => {
        const normalizedName = normalizeString(prof.display_name);
        const normalizedEmail = normalizeString(prof.user_email.split('@')[0]);
        const firstName = normalizeString(prof.display_name.split(' ')[0]);
        
        return normalizedName.includes(normalizedFileName) ||
               normalizedFileName.includes(normalizedName) ||
               normalizedEmail.includes(normalizedFileName) ||
               normalizedFileName.includes(firstName) ||
               prof.id.toString() === baseName;
      })
      .slice(0, 3);
  };

  const handleAssociation = (professionalId: number, fileUrl: string) => {
    setAssociations(prev => ({ ...prev, [professionalId]: fileUrl }));
    toast({
      title: "Associação criada",
      description: "Clique em 'Aplicar Associações' para salvar",
    });
  };

  const applyAssociations = async () => {
    if (Object.keys(associations).length === 0) {
      toast({
        title: "Nenhuma associação",
        description: "Selecione pelo menos uma associação para aplicar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      for (const [professionalId, photoUrl] of Object.entries(associations)) {
        const { error } = await supabase
          .from('profissionais')
          .update({ foto_perfil_url: photoUrl })
          .eq('id', parseInt(professionalId));

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `${Object.keys(associations).length} associações aplicadas`,
      });
      
      setAssociations({});
      await fetchProfessionals();
    } catch (error) {
      console.error('Error applying associations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar as associações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredS3Files = s3Files.filter(file =>
    file.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const professionalsWithoutPhoto = professionals.filter(prof => 
    !prof.foto_perfil_url && !associations[prof.id]
  );

  if (loading && s3Files.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Associação de Imagens S3 com Profissionais</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="automatic" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automatic">Associação Automática</TabsTrigger>
            <TabsTrigger value="manual">Associação Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="automatic" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={applyAssociations}
                disabled={Object.keys(associations).length === 0 || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar Associações ({Object.keys(associations).length})
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredS3Files.map((file) => {
                  const suggestions = suggestMatches(file);
                  const fileName = file.key.split('/').pop() || '';
                  
                  return (
                    <Card key={file.key} className="p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={file.url}
                          alt={fileName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium truncate">{fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.lastModified).toLocaleDateString()}
                          </p>
                          
                          {suggestions.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium">Sugestões:</p>
                              {suggestions.map((prof) => (
                                <div key={prof.id} className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={prof.foto_perfil_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(prof.display_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs flex-1">{prof.display_name}</span>
                                  <Button
                                    size="sm"
                                    variant={associations[prof.id] === file.url ? "default" : "outline"}
                                    onClick={() => handleAssociation(prof.id, file.url)}
                                    className="h-6 px-2"
                                  >
                                    {associations[prof.id] === file.url ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <LinkIcon className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Arquivos S3 ({s3Files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {s3Files.map((file) => {
                        const fileName = file.key.split('/').pop() || '';
                        return (
                          <div
                            key={file.key}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                              selectedFile?.key === file.key ? 'bg-muted' : ''
                            }`}
                            onClick={() => setSelectedFile(file)}
                          >
                            <img
                              src={file.url}
                              alt={fileName}
                              className="w-8 h-8 object-cover rounded"
                            />
                            <span className="text-sm truncate">{fileName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Profissionais sem Foto ({professionalsWithoutPhoto.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {professionalsWithoutPhoto.map((prof) => (
                        <div
                          key={prof.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                            selectedProfessional?.id === prof.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedProfessional(prof)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(prof.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{prof.display_name}</p>
                            <p className="text-xs text-muted-foreground">{prof.profissao}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {selectedFile && selectedProfessional && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedFile.url}
                    alt="Selected"
                    className="w-12 h-12 object-cover rounded"
                  />
                  <span className="text-sm">→</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {getInitials(selectedProfessional.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedProfessional.display_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProfessional.profissao}</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    handleAssociation(selectedProfessional.id, selectedFile.url);
                    setSelectedFile(null);
                    setSelectedProfessional(null);
                  }}
                >
                  Associar
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};