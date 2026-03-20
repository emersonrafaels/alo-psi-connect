import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useAuth } from '@/hooks/useAuth';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useUserType } from '@/hooks/useUserType';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarStatus';
import { useFirstLoginPhotoUpload } from '@/hooks/useFirstLoginPhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { usePatientInstitutions } from '@/hooks/usePatientInstitutions';
import { useCurrentProfessionalInstitutions } from '@/hooks/useCurrentProfessionalInstitutions';
import { useAdminInstitutions } from '@/hooks/useAdminInstitutions';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration';
import { PatientInstitutionsCard } from '@/components/PatientInstitutionsCard';
import { ProfessionalInstitutionsCard } from '@/components/ProfessionalInstitutionsCard';
import { AdminInstitutionsCard } from '@/components/AdminInstitutionsCard';
import { PatientCouponsCard } from '@/components/PatientCouponsCard';
import { InstitutionLinkRequestCard } from '@/components/InstitutionLinkRequestCard';
import { Combobox } from '@/components/ui/combobox';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Camera, Check, User, GraduationCap, Briefcase, Shield, Heart, Plus, Trash2, Phone, Mail } from 'lucide-react';

interface EmergencyContact {
  id?: string;
  nome: string;
  relacao: string;
  telefone: string;
  email: string;
}

const emptyContact: EmergencyContact = { nome: '', relacao: '', telefone: '', email: '' };

const relationOptions = [
  { value: 'pai_mae', label: 'Pai/Mãe' },
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'irmao', label: 'Irmão/Irmã' },
  { value: 'filho', label: 'Filho/Filha' },
  { value: 'amigo', label: 'Amigo/Amiga' },
  { value: 'tutor', label: 'Tutor/Responsável' },
  { value: 'outro', label: 'Outro' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadProfilePhoto } = useProfileManager();
  const { isProfessional } = useUserType();
  const { isConnected: googleCalendarConnected, refetch: refetchGoogleCalendar } = useGoogleCalendarStatus();
  const { linkedInstitutions, isLoading: loadingInstitutions } = usePatientInstitutions();
  const { linkedInstitutions: professionalLinkedInstitutions, isLoading: loadingProfessionalInstitutions } = useCurrentProfessionalInstitutions();
  const { institutions: adminInstitutions, isLoading: loadingAdminInstitutions } = useAdminInstitutions();
  const { isUploading: isUploadingPendingPhoto } = useFirstLoginPhotoUpload();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  
  const isAdmin = profile?.tipo_usuario === 'admin';
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    data_nascimento: '',
    genero: '',
    cpf: '',
    foto_perfil_url: '',
    como_conheceu: '',
    raca: '',
    sexualidade: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Patient-specific data
  const [patientData, setPatientData] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [savingContacts, setSavingContacts] = useState(false);

  // Popula o formulário quando o perfil é carregado
  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        email: profile.email || user?.email || '',
        data_nascimento: profile.data_nascimento || '',
        genero: profile.genero || '',
        cpf: profile.cpf || '',
        foto_perfil_url: profile.foto_perfil_url || '',
        como_conheceu: profile.como_conheceu || '',
        raca: profile.raca || '',
        sexualidade: profile.sexualidade || ''
      });
    } else if (user && !profileLoading) {
      setFormData({
        nome: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        data_nascimento: '',
        genero: '',
        cpf: '',
        foto_perfil_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        como_conheceu: '',
        raca: '',
        sexualidade: ''
      });
    }
  }, [profile, user, profileLoading]);

  // Fetch patient data and emergency contacts
  useEffect(() => {
    if (!profile?.id || isProfessional || isAdmin) return;
    
    const fetchPatientData = async () => {
      const { data } = await supabase
        .from('pacientes')
        .select('id, eh_estudante, instituicao_ensino')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (data) {
        // Resolve institution name from UUID
        if (data.instituicao_ensino) {
          const { data: inst } = await supabase
            .from('educational_institutions')
            .select('name')
            .eq('id', data.instituicao_ensino)
            .maybeSingle();
          if (inst) {
            (data as any).institution_name = inst.name;
          }
        }
        
        setPatientData(data);
        
        // Fetch emergency contacts
        const { data: contacts } = await supabase
          .from('patient_emergency_contacts')
          .select('*')
          .eq('patient_id', data.id)
          .order('created_at');
        
        if (contacts && contacts.length > 0) {
          // Map relation labels back to values for the Select component
          const labelToValue = (label: string) => {
            const found = relationOptions.find(o => o.label === label || o.value === label);
            return found?.value || label;
          };
          
          setEmergencyContacts(contacts.map((c: any) => ({
            id: c.id,
            nome: c.nome,
            relacao: labelToValue(c.relacao),
            telefone: c.telefone || '',
            email: c.email || ''
          })));
        }
      }
    };
    
    fetchPatientData();
  }, [profile?.id, isProfessional, isAdmin]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let finalFormData = { ...formData };
      if (selectedFile) {
        const photoUrl = await uploadProfilePhoto(selectedFile);
        if (photoUrl) {
          finalFormData.foto_perfil_url = photoUrl;
        } else {
          toast({ title: "Erro no upload", description: "Erro ao fazer upload da foto.", variant: "destructive" });
        }
      }

      const { error } = await updateProfile(finalFormData);
      if (!error) {
        setSelectedFile(null);
        toast({ title: "Perfil atualizado", description: "Suas informações foram salvas com sucesso." });
      } else {
        toast({ title: "Erro ao atualizar", description: "Houve um problema ao salvar suas informações.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message || "Erro ao fazer upload da foto", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelected = (file: File | null) => setSelectedFile(file);
  const handlePhotoUrlChange = (url: string) => updateFormData('foto_perfil_url', url);

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Emergency contacts handlers
  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setEmergencyContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addContact = () => {
    if (emergencyContacts.length < 3) {
      setEmergencyContacts(prev => [...prev, { ...emptyContact }]);
    }
  };

  const removeContact = (index: number) => {
    if (emergencyContacts.length > 0) {
      setEmergencyContacts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const saveEmergencyContacts = async () => {
    if (!patientData?.id) return;
    setSavingContacts(true);
    
    try {
      // Delete existing
      await supabase.from('patient_emergency_contacts').delete().eq('patient_id', patientData.id);
      
      // Insert new ones (only non-empty)
      const validContacts = emergencyContacts.filter(c => c.nome && c.relacao && c.telefone);
      if (validContacts.length > 0) {
        const { error } = await supabase.from('patient_emergency_contacts').insert(
          validContacts.map(c => ({
            patient_id: patientData.id,
            nome: c.nome,
            relacao: c.relacao,
            telefone: c.telefone || null,
            email: c.email || null
          }))
        );
        if (error) throw error;
      }
      
      toast({ title: "Contatos salvos", description: "Contatos de emergência atualizados com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro", description: "Erro ao salvar contatos de emergência.", variant: "destructive" });
    } finally {
      setSavingContacts(false);
    }
  };

  const getRelationLabel = (value: string) => {
    return relationOptions.find(o => o.value === value)?.label || value;
  };

  // Shared personal info form
  const renderPersonalInfoFields = () => (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" value={formData.nome} onChange={(e) => updateFormData('nome', e.target.value)} placeholder="Seu nome completo" />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} disabled />
        <p className="text-xs text-muted-foreground mt-1">Para alterar o email, entre em contato com o suporte</p>
      </div>

      <div>
        <Label htmlFor="dataNascimento">Data de nascimento</Label>
        <Input id="dataNascimento" type="date" value={formData.data_nascimento} onChange={(e) => updateFormData('data_nascimento', e.target.value)} />
      </div>

      <div>
        <Label htmlFor="genero">Gênero</Label>
        <Select value={formData.genero} onValueChange={(value) => updateFormData('genero', value)}>
          <SelectTrigger><SelectValue placeholder="Selecione seu gênero" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="masculino">Masculino</SelectItem>
            <SelectItem value="feminino">Feminino</SelectItem>
            <SelectItem value="nao_binario">Não binário</SelectItem>
            <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="raca">Raça/Etnia</Label>
        <Select value={formData.raca} onValueChange={(value) => updateFormData('raca', value)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="branca">Branca</SelectItem>
            <SelectItem value="preta">Preta</SelectItem>
            <SelectItem value="parda">Parda</SelectItem>
            <SelectItem value="amarela">Amarela</SelectItem>
            <SelectItem value="indigena">Indígena</SelectItem>
            <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sexualidade">Sexualidade</Label>
        <Select value={formData.sexualidade} onValueChange={(value) => updateFormData('sexualidade', value)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="heterossexual">Heterossexual</SelectItem>
            <SelectItem value="homossexual">Homossexual</SelectItem>
            <SelectItem value="bissexual">Bissexual</SelectItem>
            <SelectItem value="pansexual">Pansexual</SelectItem>
            <SelectItem value="assexual">Assexual</SelectItem>
            <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          value={formData.cpf}
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, '').slice(0, 11);
            value = value
              .replace(/^(\d{3})(\d)/, '$1.$2')
              .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
              .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
            updateFormData('cpf', value);
          }}
          placeholder="000.000.000-00"
          required
          maxLength={14}
          pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
          inputMode="numeric"
        />
        {formData.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf) && (
          <p className="text-sm text-destructive mt-1">CPF deve ter 11 dígitos no formato XXX.XXX.XXX-XX</p>
        )}
      </div>

      <Separator />

      <div>
        <Label htmlFor="comoConheceu">Como conheceu o Rede Bem Estar?</Label>
        <Select value={formData.como_conheceu} onValueChange={(value) => updateFormData('como_conheceu', value)}>
          <SelectTrigger><SelectValue placeholder="Selecione uma opção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Google/Busca online</SelectItem>
            <SelectItem value="redes_sociais">Redes sociais</SelectItem>
            <SelectItem value="indicacao_amigo">Indicação de amigo</SelectItem>
            <SelectItem value="indicacao_profissional">Indicação profissional</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSaveButton = () => (
    <div className="flex justify-end pt-6">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja salvar as alterações em seu perfil? Esta ação atualizará suas informações pessoais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate(buildTenantPath(tenantSlug, '/'))} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          {/* Header do Perfil */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-1 bg-primary mx-auto mb-4"></div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Meu Perfil</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Gerenciar Conta</h1>
            <p className="text-muted-foreground">Atualize suas informações pessoais e preferências</p>
          </div>

          {/* Card do Avatar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.foto_perfil_url} alt={formData.nome} />
                    <AvatarFallback className="text-2xl">{getInitials(formData.nome || user?.email || 'U')}</AvatarFallback>
                  </Avatar>
                  {isUploadingPendingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold">{formData.nome || user?.email}</h2>
                  <p className="text-muted-foreground">{formData.email}</p>
                  {user?.user_metadata?.email_verified && (
                    <Badge variant="secondary" className="mt-2"><Check className="h-3 w-3 mr-1" />Verificado pelo Google</Badge>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <PhotoUpload onPhotoSelected={handlePhotoSelected} onPhotoUrlChange={handlePhotoUrlChange} selectedFile={selectedFile} currentPhotoUrl={formData.foto_perfil_url} compact={true} />
                  <p className="text-sm text-muted-foreground text-center">Passe o mouse sobre a foto para alterar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Tabs para Admins Institucionais */}
          {isAdmin ? (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="personal" className="flex items-center gap-2"><User className="h-4 w-4" />Informações Pessoais</TabsTrigger>
                <TabsTrigger value="institution" className="flex items-center gap-2"><Shield className="h-4 w-4" />Instituição</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 mt-0">
                <Card>
                  <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="nome">Nome completo</Label>
                          <Input id="nome" value={formData.nome} onChange={(e) => updateFormData('nome', e.target.value)} placeholder="Seu nome completo" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={formData.email} disabled />
                          <p className="text-xs text-muted-foreground mt-1">Para alterar o email, entre em contato com o suporte</p>
                        </div>
                      </div>
                      {renderSaveButton()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="institution" className="space-y-6 mt-0">
                <AdminInstitutionsCard institutions={adminInstitutions} loading={loadingAdminInstitutions} />
              </TabsContent>
            </Tabs>
          ) : !isProfessional ? (
            /* Sistema de Tabs para Pacientes */
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="personal" className="flex items-center gap-2"><User className="h-4 w-4" />Dados Pessoais</TabsTrigger>
                <TabsTrigger value="emergency" className="flex items-center gap-2"><Heart className="h-4 w-4" />Saúde & Emergência</TabsTrigger>
                <TabsTrigger value="institution" className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Instituição</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 mt-0">
                <Card>
                  <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {renderPersonalInfoFields()}
                      {renderSaveButton()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emergency" className="space-y-6 mt-0">
                {/* Informações Acadêmicas */}
                {patientData && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Informações Acadêmicas</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium text-muted-foreground">Status acadêmico</span>
                          <Badge variant="secondary">
                            {patientData.eh_estudante === true ? 'Estudante' : patientData.eh_estudante === false ? 'Formado(a)' : 'Não informado'}
                          </Badge>
                        </div>
                        {patientData.instituicao_ensino && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground">Instituição de ensino</span>
                            <span className="text-sm font-medium">{patientData.institution_name || patientData.instituicao_ensino}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Estas informações são definidas durante o cadastro.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Contatos de Emergência */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />Contatos de Emergência</CardTitle>
                      {emergencyContacts.length < 3 && (
                        <Button variant="outline" size="sm" onClick={addContact} className="flex items-center gap-1">
                          <Plus className="h-4 w-4" />Adicionar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {emergencyContacts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum contato de emergência cadastrado</p>
                        <Button variant="outline" size="sm" onClick={addContact} className="mt-3">
                          <Plus className="h-4 w-4 mr-1" />Adicionar contato
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {emergencyContacts.map((contact, index) => (
                          <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Contato {index + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeContact(index)} className="text-destructive hover:text-destructive h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid gap-3">
                              <div>
                                <Label className="text-xs">Nome *</Label>
                                <Input value={contact.nome} onChange={(e) => updateContact(index, 'nome', e.target.value)} placeholder="Nome do contato" />
                              </div>
                              <div>
                                <Label className="text-xs">Relação *</Label>
                                <Select value={contact.relacao} onValueChange={(v) => updateContact(index, 'relacao', v)}>
                                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                  <SelectContent>
                                    {relationOptions.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Telefone *</Label>
                                <Input value={contact.telefone} onChange={(e) => updateContact(index, 'telefone', e.target.value)} placeholder="(00) 00000-0000" />
                              </div>
                              <div>
                                <Label className="text-xs">Email</Label>
                                <Input type="email" value={contact.email} onChange={(e) => updateContact(index, 'email', e.target.value)} placeholder="email@exemplo.com" />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end pt-2">
                          <Button onClick={saveEmergencyContacts} disabled={savingContacts} className="w-full sm:w-auto">
                            {savingContacts ? 'Salvando...' : 'Salvar Contatos'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="institution" className="space-y-6 mt-0">
                <PatientInstitutionsCard institutions={linkedInstitutions} loading={loadingInstitutions} />
                <InstitutionLinkRequestCard userType="paciente" />
                <PatientCouponsCard loading={loadingInstitutions} />
              </TabsContent>
            </Tabs>
          ) : (
            /* Sistema de Tabs para Profissionais */
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="personal" className="flex items-center gap-2"><User className="h-4 w-4" />Informações Pessoais</TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-2"><Briefcase className="h-4 w-4" />Perfil Profissional</TabsTrigger>
                <TabsTrigger value="institution" className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Instituição</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 mt-0">
                <Card>
                  <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {renderPersonalInfoFields()}
                      {renderSaveButton()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="professional" className="space-y-6 mt-0">
                <Card>
                  <CardHeader><CardTitle>Perfil Profissional</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Acesse a área completa para gerenciar especialidades, horários, bloqueios e integração com Google Calendar
                      </p>
                      <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${googleCalendarConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium">{googleCalendarConnected ? 'Google Calendar conectado' : 'Google Calendar desconectado'}</span>
                      </div>
                      <Button onClick={() => navigate(buildTenantPath(tenantSlug, '/professional-profile'))} className="w-full">
                        Gerenciar Perfil Profissional
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="institution" className="space-y-6 mt-0">
                <ProfessionalInstitutionsCard institutions={professionalLinkedInstitutions} loading={loadingProfessionalInstitutions} />
                <InstitutionLinkRequestCard userType="profissional" />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
