import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar, Plus, TrendingUp, Heart, BarChart3, Share2, Mail, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generateWhatsAppMessage, shareWhatsApp, shareTelegram, shareEmail, copyToClipboard } from '@/utils/shareHelpers';
import { useShareConfig } from '@/hooks/useShareConfig';
import { generateProfessionalPDF, downloadPDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { getTodayLocalDateString } from '@/lib/utils';

const MoodDiary = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { entries, loading: entriesLoading } = useMoodEntries();
  const { toast } = useToast();
  const { getShareConfig } = useShareConfig();

  // Redirect non-authenticated users to experience page
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/diario-emocional/experiencia');
    }
  }, [user, authLoading, navigate]);

  const handleShare = async (platform: string, entry?: any) => {
    const shareData = entry || (entries.length > 0 ? entries[0] : null);
    
    if (!shareData) {
      toast({
        title: "Nenhuma entrada encontrada",
        description: "Adicione uma entrada primeiro para compartilhar.",
        variant: "destructive",
      });
      return;
    }

    const stats = {
      totalEntries: entries.length,
      avgMood: entries.length > 0 ? entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length : 0,
      avgEnergy: entries.length > 0 ? entries.reduce((sum, e) => sum + e.energy_level, 0) / entries.length : 0,
      avgAnxiety: entries.length > 0 ? entries.reduce((sum, e) => sum + e.anxiety_level, 0) / entries.length : 0,
    };

    const shareConfig = getShareConfig();

    try {
      switch (platform) {
        case 'whatsapp':
          shareWhatsApp(shareData, stats, shareConfig);
          break;
        case 'telegram':
          shareTelegram(shareData, stats, shareConfig);
          break;
        case 'email':
          shareEmail(shareData, stats, shareConfig);
          break;
        case 'copy':
          const success = await copyToClipboard(shareData, stats, shareConfig);
          if (success) {
            toast({
              title: "Copiado!",
              description: "Conteúdo copiado para a área de transferência.",
            });
          }
          break;
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    if (entries.length === 0) {
      toast({
        title: "Nenhuma entrada encontrada",
        description: "Adicione uma entrada primeiro para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    const recentEntry = entries[0];
    const stats = {
      totalEntries: entries.length,
      avgMood: entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length,
      avgEnergy: entries.reduce((sum, e) => sum + e.energy_level, 0) / entries.length,
      avgAnxiety: entries.reduce((sum, e) => sum + e.anxiety_level, 0) / entries.length,
    };

    try {
      const pdf = generateProfessionalPDF(recentEntry, stats, { 
        includeLogo: true, 
        includeStats: true, 
        includeGraphs: false 
      });
      downloadPDF(pdf, 'diario-emocional');
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "Seu relatório foi baixado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || entriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const today = getTodayLocalDateString();
  const todayEntry = entries.find(entry => entry.date === today);
  
  const recentEntries = entries.slice(0, 7);
  const avgMood = recentEntries.length > 0 
    ? recentEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / recentEntries.length 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Diário Emocional
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Acompanhe seu bem-estar emocional diariamente e descubra padrões que podem melhorar sua qualidade de vida.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Humor Médio (7 dias)</CardTitle>
                <Heart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentEntries.length > 0 ? `${avgMood.toFixed(1)}/10` : 'Sem dados'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {recentEntries.length > 0 ? 'Baseado nas últimas entradas' : 'Adicione sua primeira entrada'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
                <Calendar className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{entries.length}</div>
                <p className="text-xs text-muted-foreground">
                  Entradas registradas no total
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentEntries.length}</div>
                <p className="text-xs text-muted-foreground">
                  Entradas nos últimos 7 dias
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Como você está se sentindo hoje?
              </CardTitle>
              <CardDescription>
                {todayEntry 
                  ? 'Você já registrou uma entrada hoje. Pode editá-la ou ver suas análises.'
                  : 'Registre como foi seu dia hoje e acompanhe sua evolução emocional.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayEntry ? (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">Entrada de hoje:</p>
                  <div className="flex gap-4">
                    <span className="text-sm"><strong>Humor:</strong> {todayEntry.mood_score}/10</span>
                    <span className="text-sm"><strong>Energia:</strong> {todayEntry.energy_level}/5</span>
                    <span className="text-sm"><strong>Ansiedade:</strong> {todayEntry.anxiety_level}/5</span>
                  </div>
                  {todayEntry.journal_text && (
                    <p className="text-sm text-muted-foreground mt-2">
                      "{todayEntry.journal_text.substring(0, 150)}..."
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Ainda não há registro para hoje
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button 
                    onClick={() => navigate('/diario-emocional/nova-entrada')}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Plus className="h-4 w-4" />
                    {todayEntry ? 'Editar Entrada de Hoje' : 'Nova Entrada'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/diario-emocional/historico')}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Ver Histórico
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/diario-emocional/analises')}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Ver Análises
                  </Button>
                </div>
                
                {entries.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground text-center mb-3">
                      Compartilhar progresso:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries Preview */}
          {entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Entradas Recentes</CardTitle>
                <CardDescription>
                  Suas últimas entradas do diário emocional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {new Date(entry.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Humor: {entry.mood_score}/10</span>
                          <span>Energia: {entry.energy_level}/5</span>
                          <span>Ansiedade: {entry.anxiety_level}/5</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.mood_score >= 7 ? 'bg-green-500' : 
                          entry.mood_score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
                {entries.length > 5 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate('/diario-emocional/historico')}
                    >
                      Ver todas as entradas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodDiary;