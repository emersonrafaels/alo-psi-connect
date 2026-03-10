import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MoodSlider } from "@/components/ui/mood-slider";
import { EnergySlider } from "@/components/ui/energy-slider";
import { AnxietySlider } from "@/components/ui/anxiety-slider";
import { SleepSlider } from "@/components/ui/sleep-slider";
import { useMoodExperience } from "@/hooks/useMoodExperience";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { generateProfessionalPDF, downloadPDF } from "@/utils/pdfGenerator";
import { generateWhatsAppMessage, shareWhatsApp, shareTelegram, shareEmail, copyToClipboard } from "@/utils/shareHelpers";
import { useShareConfig } from "@/hooks/useShareConfig";
import { Calendar, FileText, Share2, TrendingUp, Heart, Brain, Zap, Moon, Tag, Download, MessageCircle, Sparkles, Target, Mail, Copy } from "lucide-react";
import { formatDateBR, getTodayLocalDateString, normalizeDateForStorage } from "@/lib/utils";

const MoodExperience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  const { getShareConfig } = useShareConfig();
  
  const { 
    demoEntries, 
    canAddMore, 
    entriesLeft, 
    addDemoEntry, 
    clearDemoData, 
    getDemoStats, 
    isAtLimit,
    limit,
    loading: configLoading
  } = useMoodExperience();

  // All state must be declared at the top level
  const [formData, setFormData] = useState({
    date: getTodayLocalDateString(),
    mood_score: [5],
    energy_level: [3],
    anxiety_level: [3],
    sleep_hours: '',
    sleep_quality: [3],
    journal_text: '',
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');

  // Redirect authenticated users to the main diary page
  useEffect(() => {
    if (!authLoading && user) {
      navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional'));
    }
  }, [user, authLoading, navigate, tenant]);

  // Block guest access if tenant has mood_diary_guest_disabled enabled
  useEffect(() => {
    if (!authLoading && !user && tenant?.modules_enabled?.mood_diary_guest_disabled === true) {
      navigate(buildTenantPath(tenant?.slug || 'alopsi', '/auth'), { replace: true });
    }
  }, [user, authLoading, navigate, tenant]);

  // Show loading while checking authentication or loading configuration
  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!canAddMore) {
      toast({
        title: "Limite alcançado",
        description: `Você atingiu o limite de ${limit} entradas para a experiência demo. Faça login para continuar!`,
        variant: "destructive",
      });
      return;
    }

    const success = addDemoEntry({
      date: normalizeDateForStorage(formData.date),
      mood_score: formData.mood_score[0],
      energy_level: formData.energy_level[0],
      anxiety_level: formData.anxiety_level[0],
      sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : undefined,
      sleep_quality: formData.sleep_quality[0],
      journal_text: formData.journal_text || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    });

    if (success) {
      toast({
        title: "Entrada adicionada!",
        description: `Você tem ${entriesLeft - 1} entradas restantes na experiência demo.`,
      });
      
      // Reset form
      setFormData({
        date: getTodayLocalDateString(),
        mood_score: [5],
        energy_level: [3],
        anxiety_level: [3],
        sleep_hours: '',
        sleep_quality: [3],
        journal_text: '',
        tags: [],
      });
      setNewTag('');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const exportToPDF = async () => {
    try {
      const currentEntry = {
        id: Date.now().toString(),
        date: formData.date,
        mood_score: formData.mood_score[0],
        energy_level: formData.energy_level[0],
        anxiety_level: formData.anxiety_level[0],
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : undefined,
        sleep_quality: formData.sleep_quality[0],
        journal_text: formData.journal_text,
        tags: formData.tags,
      };

      const stats = getDemoStats();
      const pdf = generateProfessionalPDF(currentEntry, stats, {
        includeLogo: true,
        includeStats: true,
        includeGraphs: false
      });
      
      downloadPDF(pdf, 'diario-emocional-alopsi');
      
      toast({
        title: "PDF exportado com sucesso!",
        description: "Seu diário emocional foi salvo como PDF profissional.",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro ao gerar o arquivo PDF.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform: 'whatsapp' | 'telegram' | 'email' | 'copy') => {
    const currentEntry = {
      id: Date.now().toString(),
      date: formData.date,
      mood_score: formData.mood_score[0],
      energy_level: formData.energy_level[0],
      anxiety_level: formData.anxiety_level[0],
      sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : undefined,
      sleep_quality: formData.sleep_quality[0],
      journal_text: formData.journal_text,
      tags: formData.tags,
    };

    const stats = getDemoStats();
    const shareConfig = getShareConfig();

    try {
      switch (platform) {
        case 'whatsapp':
          shareWhatsApp(currentEntry, stats, shareConfig);
          break;
        case 'telegram':
          shareTelegram(currentEntry, stats, shareConfig);
          break;
        case 'email':
          shareEmail(currentEntry, stats, shareConfig);
          break;
        case 'copy':
          const success = await copyToClipboard(currentEntry, stats, shareConfig);
          if (success) {
            toast({
              title: "Copiado!",
              description: "Texto copiado para a área de transferência.",
            });
          } else {
            throw new Error('Falha ao copiar');
          }
          break;
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Ocorreu um erro ao compartilhar o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const stats = getDemoStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Botões principais no topo */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Experimente o Diário Emocional
              </h1>
              <p className="text-muted-foreground mb-4">
                Registre suas emoções e reflexões diárias. Você pode fazer até {limit} entradas gratuitas.
              </p>
              
              {/* Botões de ação destacados */}
              {(formData.journal_text || formData.tags.length > 0 || formData.mood_score[0] !== 5) && (
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  <Button 
                    onClick={exportToPDF}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button 
                    onClick={() => handleShare('whatsapp')}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                    size="lg"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Compartilhar
                  </Button>
                  <Button 
                    onClick={() => handleShare('copy')}
                    variant="outline"
                    size="lg"
                    className="border-2 hover:bg-muted/50"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                </div>
              )}

              {isAtLimit && (
                <div className="bg-card border border-border rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Limite de entradas atingido
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Você já fez {limit} entradas de demonstração. Para continuar usando o diário emocional e acessar recursos exclusivos, faça login ou crie sua conta.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'))} className="bg-primary hover:bg-primary/90">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Fazer Login
                    </Button>
                    <Button onClick={() => navigate(buildTenantPath(tenantSlug, '/cadastro/tipo-usuario'))} variant="outline">
                      Criar Conta Gratuita
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de entrada */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Como você está se sentindo hoje?
                </CardTitle>
                <CardDescription>
                  Registre suas emoções e reflexões do dia ({entriesLeft} entradas restantes)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {canAddMore ? (
                  <>
                    {/* Data */}
                    <div className="space-y-2">
                      <Label htmlFor="date" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        max={getTodayLocalDateString()}
                      />
                    </div>

                    {/* Humor */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Humor: {formData.mood_score[0]}/10
                      </Label>
                      <MoodSlider
                        value={formData.mood_score}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, mood_score: value }))}
                      />
                    </div>

                    {/* Energia */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Energia: {formData.energy_level[0]}/5
                      </Label>
                      <EnergySlider
                        value={formData.energy_level}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, energy_level: value }))}
                      />
                    </div>

                    {/* Ansiedade */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Ansiedade: {formData.anxiety_level[0]}/5
                      </Label>
                      <AnxietySlider
                        value={formData.anxiety_level}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, anxiety_level: value }))}
                      />
                    </div>

                    {/* Sono */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sleep_hours" className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-blue-500" />
                          Horas de Sono
                        </Label>
                        <Input
                          id="sleep_hours"
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={formData.sleep_hours}
                          onChange={(e) => setFormData(prev => ({ ...prev, sleep_hours: e.target.value }))}
                          placeholder="Ex: 8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Qualidade: {formData.sleep_quality[0]}/5</Label>
                        <SleepSlider
                          value={formData.sleep_quality}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, sleep_quality: value }))}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-500" />
                        Tags (opcional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Ex: trabalho, exercício, família"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          Adicionar
                        </Button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                              onClick={() => removeTag(tag)}
                            >
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reflexões */}
                    <div className="space-y-2">
                      <Label htmlFor="journal" className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        Reflexões do Dia (opcional)
                      </Label>
                      <Textarea
                        id="journal"
                        value={formData.journal_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, journal_text: e.target.value }))}
                        placeholder="Como foi seu dia? O que você aprendeu? Como se sentiu..."
                        className="min-h-24"
                      />
                    </div>

                    <div className="space-y-4">
                      <Button onClick={handleSubmit} className="w-full" size="lg">
                        <Heart className="mr-2 h-4 w-4" />
                        Registrar Entrada ({entriesLeft} restantes)
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleShare('whatsapp')}
                          variant="outline" 
                          size="sm"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          WhatsApp
                        </Button>
                        <Button 
                          onClick={() => handleShare('telegram')}
                          variant="outline" 
                          size="sm"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Telegram
                        </Button>
                        <Button 
                          onClick={() => handleShare('email')}
                          variant="outline" 
                          size="sm"
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Email
                        </Button>
                        <Button 
                          onClick={exportToPDF}
                          variant="outline" 
                          size="sm"
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Salvar PDF
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-semibold">Limite atingido</h3>
                    <p className="text-muted-foreground">
                      Você já fez {limit} entradas de demonstração.
                    </p>
                    <div className="space-y-2">
                      <Button onClick={() => navigate(buildTenantPath(tenantSlug, '/auth'))} className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Fazer Login / Cadastro
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        100% gratuito • Sem limite de entradas • Análises avançadas
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas demo */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Suas Estatísticas Demo
                </CardTitle>
                <CardDescription>
                  Veja um resumo de suas entradas registradas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{stats.avgMood}</div>
                        <div className="text-sm text-muted-foreground">Humor Médio</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
                        <div className="text-sm text-muted-foreground">Entradas</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                        <div className="text-2xl font-bold text-yellow-600">{stats.avgEnergy}</div>
                        <div className="text-sm text-muted-foreground">Energia Média</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-purple-600">{stats.avgAnxiety}</div>
                        <div className="text-sm text-muted-foreground">Ansiedade Média</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold">Suas Entradas Recentes</h4>
                      {demoEntries.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="p-3 bg-muted/50 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium">{formatDateBR(entry.date)}</span>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                😊 {entry.mood_score}/10
                              </Badge>
                            </div>
                          </div>
                          {entry.journal_text && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {entry.journal_text}
                            </p>
                          )}
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {entry.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {entry.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{entry.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold">Recursos Disponíveis na Versão Completa</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Entradas ilimitadas no diário
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Gráficos e análises avançadas
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Histórico completo de entradas
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Backup automático na nuvem
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Lembretes personalizados
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Relatórios em PDF profissionais
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      Registre sua primeira entrada para ver suas estatísticas!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MoodExperience;