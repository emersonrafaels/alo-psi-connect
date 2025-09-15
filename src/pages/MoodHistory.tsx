import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMoodEntries } from '@/hooks/useMoodEntries';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Search, Edit, Trash2, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const MoodHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entries, loading, deleteEntry } = useMoodEntries();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Redirect non-authenticated users
  if (!user) {
    navigate('/diario-emocional/experiencia');
    return null;
  }

  // Filter entries based on search term and selected month
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.journal_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMonth = !selectedMonth || 
      entry.date.startsWith(selectedMonth);
    
    return matchesSearch && matchesMonth;
  });

  // Group entries by month
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const monthKey = entry.date.substring(0, 7); // YYYY-MM
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(entry);
    return groups;
  }, {} as Record<string, typeof entries>);

  const handleDelete = async (entryId: string) => {
    await deleteEntry(entryId);
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMoodLabel = (score: number) => {
    if (score >= 8) return 'Excelente';
    if (score >= 6) return 'Bom';
    if (score >= 4) return 'Regular';
    return 'Ruim';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonth = (monthKey: string) => {
    return new Date(monthKey + '-01').toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/diario-emocional')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Histórico do Diário</h1>
              <p className="text-muted-foreground">
                {entries.length} entradas registradas
              </p>
            </div>
            <Button 
              onClick={() => navigate('/diario-emocional/nova-entrada')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Entrada
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Buscar nas reflexões e tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mês</label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries */}
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma entrada encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedMonth 
                    ? 'Tente ajustar os filtros ou'
                    : 'Você ainda não tem entradas registradas.'
                  }
                </p>
                <Button onClick={() => navigate('/diario-emocional/nova-entrada')}>
                  Criar primeira entrada
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEntries)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([monthKey, monthEntries]) => (
                  <Card key={monthKey}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {formatMonth(monthKey)}
                      </CardTitle>
                      <CardDescription>
                        {monthEntries.length} entrada{monthEntries.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {monthEntries
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => (
                            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                              {/* Entry Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full ${getMoodColor(entry.mood_score)}`} />
                                  <div>
                                    <h4 className="font-medium">{formatDate(entry.date)}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Humor: {entry.mood_score}/10 ({getMoodLabel(entry.mood_score)})
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/diario-emocional/nova-entrada?date=${entry.date}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. A entrada do dia {formatDate(entry.date)} será permanentemente excluída.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* Entry Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Energia:</span>
                                  <span className="ml-1 font-medium">{entry.energy_level}/5</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Ansiedade:</span>
                                  <span className="ml-1 font-medium">{entry.anxiety_level}/5</span>
                                </div>
                                {entry.sleep_hours && (
                                  <div>
                                    <span className="text-muted-foreground">Sono:</span>
                                    <span className="ml-1 font-medium">{entry.sleep_hours}h</span>
                                  </div>
                                )}
                                {entry.sleep_quality && (
                                  <div>
                                    <span className="text-muted-foreground">Qualidade:</span>
                                    <span className="ml-1 font-medium">{entry.sleep_quality}/5</span>
                                  </div>
                                )}
                              </div>

                              {/* Tags */}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {entry.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Journal Text */}
                              {entry.journal_text && (
                                <div className="bg-muted/30 rounded-md p-3">
                                  <p className="text-sm text-muted-foreground mb-1">Reflexões:</p>
                                  <p className="text-sm">{entry.journal_text}</p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodHistory;