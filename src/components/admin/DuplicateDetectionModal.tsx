import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowDown, CheckCircle, Mail, Calendar, XCircle, AlertTriangle } from 'lucide-react';
import { DuplicateMatch } from '@/hooks/useDuplicateDetection';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DuplicateDetectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: DuplicateMatch[];
  onConsolidate: (match: DuplicateMatch) => Promise<void>;
  onIgnore: (match: DuplicateMatch) => void;
  loading?: boolean;
}

export const DuplicateDetectionModal = ({
  open,
  onOpenChange,
  matches,
  onConsolidate,
  onIgnore,
  loading
}: DuplicateDetectionModalProps) => {
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set());
  const [ignoredMatches, setIgnoredMatches] = useState<Set<number>>(new Set());

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getConfidenceBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const handleToggleSelection = (matchIndex: number) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(matchIndex)) {
      newSelected.delete(matchIndex);
    } else {
      newSelected.add(matchIndex);
    }
    setSelectedMatches(newSelected);
  };

  const handleIgnore = (matchIndex: number) => {
    const newIgnored = new Set(ignoredMatches);
    newIgnored.add(matchIndex);
    setIgnoredMatches(newIgnored);
    onIgnore(matches[matchIndex]);
  };

  const handleConsolidate = async (match: DuplicateMatch) => {
    await onConsolidate(match);
  };

  const visibleMatches = matches.filter((_, index) => !ignoredMatches.has(index));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            🔍 Verificação de Duplicatas
          </DialogTitle>
        </DialogHeader>

        {visibleMatches.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma duplicata detectada ou todas foram processadas.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {visibleMatches.length} duplicata(s) encontrada(s). Revise cada caso antes de consolidar.
              </AlertDescription>
            </Alert>

            {visibleMatches.map((match, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Match #{index + 1}
                      <Badge variant={getConfidenceBadgeVariant(match.confidence_score)}>
                        {getConfidenceIcon(match.confidence_score)}
                        Confiança: {match.confidence_score}%
                      </Badge>
                    </CardTitle>
                    <Badge variant={match.recommended_action === 'merge' ? 'default' : 'secondary'}>
                      {match.recommended_action === 'merge' ? 'Recomendado consolidar' : 'Requer revisão'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Source Profile */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarImage src={match.source_data.photo} />
                        <AvatarFallback className="text-lg">
                          {getInitials(match.source_data.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{match.source_data.name}</h4>
                            <p className="text-sm text-muted-foreground">ID: {match.source_data.id}</p>
                          </div>
                          {match.source_data.is_orphan && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Perfil Órfão
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {match.source_data.email}
                        </div>

                        {match.source_data.has_schedules && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {match.source_data.schedule_count} horário(s) cadastrado(s)
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Completude:</span>
                            <span className="font-medium">{match.source_data.completeness_score}/100</span>
                          </div>
                          <Progress value={match.source_data.completeness_score} className="h-2" />
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.source_data.photo && (
                            <Badge variant="outline" className="text-xs">Tem foto</Badge>
                          )}
                          {match.source_data.has_schedules && (
                            <Badge variant="outline" className="text-xs">Tem horários</Badge>
                          )}
                          {match.source_data.has_summary && (
                            <Badge variant="outline" className="text-xs">Tem resumo</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                      <ArrowDown className="h-6 w-6" />
                    </div>
                    <span className="ml-3 font-medium">CONSOLIDAR EM</span>
                  </div>

                  {/* Target Profile */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={match.target_data.photo} />
                        <AvatarFallback className="text-lg">
                          {getInitials(match.target_data.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{match.target_data.name}</h4>
                            <p className="text-sm text-muted-foreground">ID: {match.target_data.id}</p>
                          </div>
                          {!match.target_data.is_orphan && (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              User Ativo
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {match.target_data.email}
                        </div>

                        {match.target_data.has_schedules && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {match.target_data.schedule_count} horário(s) cadastrado(s)
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Completude:</span>
                            <span className="font-medium">{match.target_data.completeness_score}/100</span>
                          </div>
                          <Progress value={match.target_data.completeness_score} className="h-2" />
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.target_data.photo && (
                            <Badge variant="outline" className="text-xs">Tem foto</Badge>
                          )}
                          {match.target_data.has_schedules && (
                            <Badge variant="outline" className="text-xs">Tem horários</Badge>
                          )}
                          {match.target_data.has_summary && (
                            <Badge variant="outline" className="text-xs">Tem resumo</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Razões da detecção:</h5>
                    <ul className="space-y-1">
                      {match.match_reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleIgnore(index)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Ignorar
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleConsolidate(match)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Consolidar Automaticamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
