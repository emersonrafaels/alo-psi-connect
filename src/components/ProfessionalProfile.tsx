import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useAuth } from '@/hooks/useAuth';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useUserType } from '@/hooks/useUserType';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarStatus';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Stethoscope, 
  Clock, 
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { GoogleCalendarIntegration } from './GoogleCalendarIntegration';
import { SpecialtiesSelector } from './SpecialtiesSelector';
import { ScheduleManager } from './ScheduleManager';
import { ProfessionalInfoEditor } from './ProfessionalInfoEditor';
import { PhotoUpload } from './ui/photo-upload';
import { useNavigate } from 'react-router-dom';

interface ProfessionalData {
  id: number;
  display_name: string;
  foto_perfil_url: string | null;
  profissao: string | null;
  crp_crm: string | null;
  resumo_profissional: string | null;
  preco_consulta: number | null;
  tempo_consulta: number | null;
  servicos_raw: string | null;
  telefone: string | null;
  email_secundario: string | null;
  ativo: boolean;
}

// Componente para editar especialidades específico para profissionais
const SpecialtiesEditor: React.FC<{
  currentSpecialties: string[];
  professionalId?: number;
  onUpdate: (specialties: string[]) => void;
}> = ({ currentSpecialties, professionalId, onUpdate }) => {
  const [specialties, setSpecialties] = useState(currentSpecialties);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!professionalId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({ servicos_raw: JSON.stringify(specialties) })
        .eq('id', professionalId);

      if (error) throw error;

      onUpdate(specialties);
      toast({
        title: "Especialidades atualizadas",
        description: "Suas especialidades foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar as especialidades.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SpecialtiesSelector 
        value={specialties}
        onChange={setSpecialties}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={loading || JSON.stringify(specialties) === JSON.stringify(currentSpecialties)}
        >
          {loading ? 'Salvando...' : 'Salvar Especialidades'}
        </Button>
      </div>
    </div>
  );
};

export const ProfessionalProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, uploadProfilePhoto } = useProfileManager();
  const { isProfessional } = useUserType();
  const { isConnected: googleCalendarConnected, refetch: refetchGoogleCalendar } = useGoogleCalendarStatus();
  const { toast } = useToast();
  
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);

  // Carregar dados do profissional
  useEffect(() => {
    const loadProfessionalData = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('profissionais')
          .select('*')
          .eq('profile_id', profile.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar dados do profissional:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados profissionais.",
            variant: "destructive",
          });
          return;
        }

        setProfessionalData(data);
      } catch (error) {
        console.error('Erro ao carregar dados do profissional:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isProfessional && profile) {
      loadProfessionalData();
    } else {
      setLoading(false);
    }
  }, [profile, isProfessional, toast]);

  const handlePhotoUpload = async (file: File) => {
    try {
      const photoUrl = await uploadProfilePhoto(file);
      if (photoUrl && professionalData) {
        // Atualizar na tabela profissionais
        const { error } = await supabase
          .from('profissionais')
          .update({ foto_perfil_url: photoUrl })
          .eq('id', professionalData.id);

        if (error) throw error;

        setProfessionalData(prev => prev ? { ...prev, foto_perfil_url: photoUrl } : null);
        
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi atualizada com sucesso.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível atualizar a foto.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const parseSpecialties = (servicos_raw: string | null): string[] => {
    if (!servicos_raw) return [];
    try {
      return JSON.parse(servicos_raw);
    } catch {
      return servicos_raw.split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  if (!isProfessional) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
            <p className="text-muted-foreground mb-6">
              Esta área é exclusiva para profissionais cadastrados.
            </p>
            <Button onClick={() => navigate('/')}>
              Voltar ao início
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Perfil Profissional</h1>
              <p className="text-muted-foreground">
                Gerencie suas informações, especialidades e agenda
              </p>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={professionalData?.foto_perfil_url || profile?.foto_perfil_url} 
                      alt={professionalData?.display_name || profile?.nome} 
                    />
                    <AvatarFallback className="text-2xl">
                      {getInitials(professionalData?.display_name || profile?.nome || 'P')}
                    </AvatarFallback>
                  </Avatar>
                  <PhotoUpload
                    onPhotoSelected={handlePhotoUpload}
                    onPhotoUrlChange={() => {}}
                    currentPhotoUrl={professionalData?.foto_perfil_url || profile?.foto_perfil_url || ''}
                    label=""
                    className="absolute -bottom-2 -right-2"
                  />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {professionalData?.display_name || profile?.nome}
                  </h2>
                  <div className="space-y-2">
                    {professionalData?.profissao && (
                      <p className="text-lg text-muted-foreground">
                        {professionalData.profissao}
                        {professionalData.crp_crm && ` • ${professionalData.crp_crm}`}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {professionalData?.preco_consulta && (
                        <span>R$ {professionalData.preco_consulta.toFixed(2)}</span>
                      )}
                      {professionalData?.tempo_consulta && (
                        <span>{professionalData.tempo_consulta} min</span>
                      )}
                      <Badge variant={professionalData?.ativo ? "default" : "secondary"}>
                        {professionalData?.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${googleCalendarConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">
                    {googleCalendarConnected ? 'Agenda conectada' : 'Agenda desconectada'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="specialties" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Especialidades
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horários
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Agenda
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <ProfessionalInfoEditor 
                professionalData={professionalData}
                onUpdate={setProfessionalData}
              />
            </TabsContent>

            <TabsContent value="specialties" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Especialidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <SpecialtiesSelector 
                      value={parseSpecialties(professionalData?.servicos_raw)}
                      onChange={(specialties) => {
                        if (professionalData) {
                          setProfessionalData({
                            ...professionalData,
                            servicos_raw: JSON.stringify(specialties)
                          });
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Horários</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScheduleManager professionalId={professionalData?.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integração com Google Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoogleCalendarIntegration
                    isConnected={googleCalendarConnected}
                    onConnectionChange={(connected) => {
                      if (connected) {
                        refetchGoogleCalendar();
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Componente para atualizar especialidades específico para profissionais
const SpecialtiesUpdater: React.FC<{
  currentSpecialties: string[];
  professionalId?: number;
  onUpdate: (specialties: string[]) => void;
}> = ({ currentSpecialties, professionalId, onUpdate }) => {
  const [specialties, setSpecialties] = useState(currentSpecialties);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!professionalId) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('update-specialties', {
        body: {
          professionalId,
          specialties
        }
      });

      if (error) throw error;

      onUpdate(specialties);
      toast({
        title: "Especialidades atualizadas",
        description: "Suas especialidades foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar as especialidades.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SpecialtiesSelector 
        value={specialties}
        onChange={setSpecialties}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={loading || JSON.stringify(specialties) === JSON.stringify(currentSpecialties)}
        >
          {loading ? 'Salvando...' : 'Salvar Especialidades'}
        </Button>
      </div>
    </div>
  );
};