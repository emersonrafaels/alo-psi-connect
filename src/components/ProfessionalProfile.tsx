import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/ui/header';

import { useAuth } from '@/hooks/useAuth';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useUserType } from '@/hooks/useUserType';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarStatus';
import { useToast } from '@/hooks/use-toast';
import { useProfessionalData } from '@/hooks/useProfessionalData';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Stethoscope, 
  Clock, 
  Calendar,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Ban,
  CreditCard
} from 'lucide-react';
import { GoogleCalendarIntegration } from './GoogleCalendarIntegration';
import { BusyScheduleDisplay } from './BusyScheduleDisplay';
import { SpecialtiesSelector } from './SpecialtiesSelector';
import { ScheduleManager } from './ScheduleManager';
import { ProfessionalInfoEditor } from './ProfessionalInfoEditor';
import { EditableProfileFields } from './EditableProfileFields';
import { PhotoUpload } from './ui/photo-upload';
import { BankingInfoEditor } from './BankingInfoEditor';
import { ProfessionalStatusToggle } from './ProfessionalStatusToggle';
import { UnavailabilityManager } from './admin/UnavailabilityManager';
import { useNavigate } from 'react-router-dom';

interface ProfessionalData {
  id: number;
  user_id: number;
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
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  
  // Use the optimized professional data hook
  const { 
    professionalData, 
    loading: professionalLoading, 
    error: professionalError,
    updateProfessionalData,
    refreshData: refreshProfessionalData 
  } = useProfessionalData(profile?.id, isProfessional);
  
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Memoize loading state to prevent unnecessary re-renders
  const loading = useMemo(() => 
    profileLoading || professionalLoading, 
    [profileLoading, professionalLoading]
  );

  // Handle professional data errors
  useMemo(() => {
    if (professionalError) {
      toast({
        title: "Erro",
        description: professionalError,
        variant: "destructive",
      });
    }
  }, [professionalError, toast]);

  // Memoized callbacks
  const handleStatusUpdate = useCallback((isActive: boolean) => {
    updateProfessionalData({ ativo: isActive });
  }, [updateProfessionalData]);

  const handlePhotoUpload = useCallback(async (file: File) => {
    try {
      const photoUrl = await uploadProfilePhoto(file);
      if (photoUrl && professionalData) {
        // Atualizar na tabela profissionais
        const { error } = await supabase
          .from('profissionais')
          .update({ foto_perfil_url: photoUrl })
          .eq('id', professionalData.id);

        if (error) throw error;

        updateProfessionalData({ foto_perfil_url: photoUrl });
        
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi atualizada com sucesso.",
        });
      }
    } catch (error: any) {
      console.error('Erro no upload da foto:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível atualizar a foto.",
        variant: "destructive",
      });
    }
  }, [uploadProfilePhoto, professionalData, updateProfessionalData, toast]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const parseSpecialties = useCallback((servicos_raw: string | null): string[] => {
    if (!servicos_raw) return [];
    try {
      return JSON.parse(servicos_raw);
    } catch {
      return servicos_raw.split(',').map(s => s.trim()).filter(Boolean);
    }
  }, []);

  if (!isProfessional) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
            <p className="text-muted-foreground mb-6">
              Esta área é exclusiva para profissionais cadastrados.
            </p>
            <Button onClick={() => navigate(buildTenantPath(tenantSlug, '/'))}>
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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Modern Header with Breadcrumb */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(professionalData?.id ? `/professional/${professionalData.id}` : '/profile')}
              className="flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o perfil
            </Button>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full"></div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    Perfil Profissional
                  </h1>
                  <p className="text-lg text-muted-foreground mt-1">
                    Gerencie suas informações, especialidades e agenda
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Profile Header Card */}
          <Card className="mb-8 overflow-hidden border-0 shadow-lg bg-card">
            <CardContent className="relative pt-8 pb-6">
              {/* Desktop Layout - Clean Grid */}
              <div className="hidden lg:grid lg:grid-cols-4 gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="relative">
                      <PhotoUpload
                        onPhotoSelected={handlePhotoUpload}
                        onPhotoUrlChange={() => {}}
                        currentPhotoUrl={professionalData?.foto_perfil_url || profile?.foto_perfil_url || ''}
                        selectedFile={selectedFile}
                        compact={true}
                        size="lg"
                        className="border-4 border-background shadow-2xl"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Professional Info */}
                <div className="col-span-2 space-y-6">
                  {/* Name and Profession */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-foreground">
                        {professionalData?.display_name || profile?.nome}
                      </h2>
                      <Badge 
                        variant={professionalData?.ativo ? "default" : "secondary"}
                        className="text-xs font-medium"
                      >
                        {professionalData?.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {professionalData?.profissao && (
                      <p className="text-xl text-muted-foreground flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        {professionalData.profissao}
                        {professionalData.crp_crm && (
                          <>
                            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                            <span className="font-mono text-lg">{professionalData.crp_crm}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  
                  {/* Enhanced Info Cards */}
                  <div className="flex flex-wrap gap-4">
                    {professionalData?.preco_consulta && (
                      <Card className="p-4 bg-accent/10 border-accent/20 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/20 rounded-full">
                            <span className="text-lg">💰</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Consulta</p>
                            <p className="text-lg font-bold text-accent-foreground">
                              R$ {professionalData.preco_consulta.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                    {professionalData?.tempo_consulta && (
                      <Card className="p-4 bg-primary/10 border-primary/20 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/20 rounded-full">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duração</p>
                            <p className="text-lg font-bold text-primary">
                              {professionalData.tempo_consulta} min
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Status & Calendar Section */}
                <div className="space-y-4">
                  {/* Status Section */}
                  <Card className="p-4 bg-muted/30 border-muted">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <h4 className="text-sm font-medium">Status</h4>
                      </div>
                      <ProfessionalStatusToggle 
                        professionalData={professionalData}
                        onUpdate={handleStatusUpdate}
                      />
                    </div>
                  </Card>
                  
                  {/* Calendar Status */}
                  <Card className="p-4 bg-muted/30 border-muted">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <h4 className="text-sm font-medium">Agenda</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          googleCalendarConnected 
                            ? 'bg-green-500 shadow-green-500/50 shadow-lg animate-pulse' 
                            : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium">
                          {googleCalendarConnected ? 'Conectada' : 'Desconectada'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden space-y-6">
                {/* Avatar and Basic Info */}
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="relative">
                      <PhotoUpload
                        onPhotoSelected={handlePhotoUpload}
                        onPhotoUrlChange={() => {}}
                        currentPhotoUrl={professionalData?.foto_perfil_url || profile?.foto_perfil_url || ''}
                        selectedFile={selectedFile}
                        compact={true}
                        size="lg"
                        className="border-4 border-background shadow-2xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <h2 className="text-2xl font-bold text-foreground">
                        {professionalData?.display_name || profile?.nome}
                      </h2>
                      <Badge 
                        variant={professionalData?.ativo ? "default" : "secondary"}
                        className="text-xs font-medium"
                      >
                        {professionalData?.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {professionalData?.profissao && (
                      <p className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        {professionalData.profissao}
                        {professionalData.crp_crm && (
                          <>
                            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                            <span className="font-mono">{professionalData.crp_crm}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {professionalData?.preco_consulta && (
                    <Card className="p-4 bg-accent/10 border-accent/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/20 rounded-full">
                          <span className="text-lg">💰</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Consulta</p>
                          <p className="text-lg font-bold text-accent-foreground">
                            R$ {professionalData.preco_consulta.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                  {professionalData?.tempo_consulta && (
                    <Card className="p-4 bg-primary/10 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-full">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duração</p>
                          <p className="text-lg font-bold text-primary">
                            {professionalData.tempo_consulta} min
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Status and Calendar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-4 bg-muted/30 border-muted">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        Status do Perfil
                      </h4>
                      <ProfessionalStatusToggle 
                        professionalData={professionalData}
                        onUpdate={handleStatusUpdate}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-muted/30 border-muted">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        Status da Agenda
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          googleCalendarConnected 
                            ? 'bg-green-500 shadow-green-500/50 shadow-lg animate-pulse' 
                            : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium">
                          {googleCalendarConnected ? 'Conectada' : 'Desconectada'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Professional Description - Full width */}
              {professionalData?.resumo_profissional && (
                <div className="mt-8">
                  <Card className="p-6 bg-muted/20 border-muted">
                    <div className="space-y-4">
                      <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        Sobre o profissional
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {professionalData.resumo_profissional}
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Link */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Link do seu perfil</h3>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe este link para que pacientes vejam seu perfil
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const url = `${window.location.origin}/professional/${professionalData?.id}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Link copiado!",
                      description: "O link do seu perfil foi copiado para a área de transferência.",
                    });
                  }}
                >
                  Copiar Link do Perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modern Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-muted/30 backdrop-blur-sm rounded-xl">
              <TabsTrigger 
                value="info" 
                className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Informações</span>
              </TabsTrigger>
              <TabsTrigger 
                value="specialties" 
                className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
              >
                <Stethoscope className="h-4 w-4" />
                <span className="hidden sm:inline">Especialidades</span>
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Horários</span>
              </TabsTrigger>
              <TabsTrigger 
                value="blocks" 
                className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
              >
                <Ban className="h-4 w-4" />
                <span className="hidden sm:inline">Bloqueios</span>
              </TabsTrigger>
              <TabsTrigger 
                value="banking" 
                className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Bancários</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-8 space-y-6">
              <EditableProfileFields 
                profile={profile}
                onUpdate={() => {
                  // Trigger a refetch of profile data if needed
                }}
              />
              
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-lg"></div>
                <div className="relative">
                  <ProfessionalInfoEditor 
                    professionalData={professionalData}
                    onUpdate={(data) => updateProfessionalData(data)}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="specialties" className="mt-8">
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-lg"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Gerenciar Especialidades</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Defina suas áreas de atuação e serviços oferecidos
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <SpecialtiesSelector 
                    value={parseSpecialties(professionalData?.servicos_raw)}
                    onChange={(specialties) => {
                      if (professionalData) {
                        updateProfessionalData({
                          servicos_raw: JSON.stringify(specialties)
                        });
                      }
                    }}
                  />
                  
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={async () => {
                        if (!professionalData?.id) return;
                        
                        try {
                          const { error } = await supabase
                            .from('profissionais')
                            .update({ 
                              servicos_raw: professionalData.servicos_raw 
                            })
                            .eq('id', professionalData.id);

                          if (error) throw error;

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
                        }
                      }}
                      disabled={!professionalData?.id}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Especialidades
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-8">
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-lg"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Gerenciar Horários</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure seus dias e horários de atendimento
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <ScheduleManager professionalId={professionalData?.user_id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blocks" className="mt-8">
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-lg"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <Ban className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Gerenciar Bloqueios</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure dias e horários específicos em que você não estará disponível
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {professionalData?.id && (
                    <UnavailabilityManager 
                      professionalId={professionalData.id}
                      professionalName={professionalData.display_name}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking" className="mt-8">
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-lg"></div>
                <div className="relative">
                  <BankingInfoEditor 
                    professionalData={professionalData}
                    onUpdate={(updatedData) => {
                      updateProfessionalData(updatedData);
                    }}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="mt-8">
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-lg"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Integração com Google Calendar</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sincronize sua agenda com o Google Calendar
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <GoogleCalendarIntegration
                    isConnected={googleCalendarConnected}
                    onConnectionChange={(connected) => {
                      console.log('Google Calendar connection changed:', connected);
                      // Always refetch to update status, regardless of connection state
                      refetchGoogleCalendar();
                    }}
                  />
                  
                  {googleCalendarConnected && (
                    <BusyScheduleDisplay />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
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