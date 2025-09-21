import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InsightHistory {
  id: string;
  insight_content: string;
  mood_data: any[];
  created_at: string;
  feedback_rating?: boolean;
  feedback_comment?: string;
  feedback_submitted_at?: string;
}

interface InsightHistoryCardProps {
  history: InsightHistory[];
  loading: boolean;
  onSubmitFeedback: (insightId: string, rating: boolean, comment?: string) => Promise<void>;
}

const InsightHistoryCard: React.FC<InsightHistoryCardProps> = ({
  history,
  loading,
  onSubmitFeedback
}) => {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { 
    rating?: boolean; 
    comment: string; 
    submitting: boolean 
  }>>({});

  const toggleExpanded = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const handleFeedbackSubmit = async (insightId: string) => {
    const state = feedbackStates[insightId];
    if (!state || state.rating === undefined) return;

    setFeedbackStates(prev => ({
      ...prev,
      [insightId]: { ...prev[insightId], submitting: true }
    }));

    try {
      await onSubmitFeedback(insightId, state.rating, state.comment || undefined);
      // Clear feedback state after successful submission
      setFeedbackStates(prev => {
        const newState = { ...prev };
        delete newState[insightId];
        return newState;
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setFeedbackStates(prev => ({
        ...prev,
        [insightId]: { ...prev[insightId], submitting: false }
      }));
    }
  };

  const setFeedbackRating = (insightId: string, rating: boolean) => {
    setFeedbackStates(prev => ({
      ...prev,
      [insightId]: { ...prev[insightId], rating, comment: prev[insightId]?.comment || '' }
    }));
  };

  const setFeedbackComment = (insightId: string, comment: string) => {
    setFeedbackStates(prev => ({
      ...prev,
      [insightId]: { ...prev[insightId], comment, rating: prev[insightId]?.rating }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum insight gerado ainda. Clique em "Gerar Insights de IA" para começar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico de Insights ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((insight) => {
            const isExpanded = expandedInsights.has(insight.id);
            const feedbackState = feedbackStates[insight.id];
            const hasFeedback = insight.feedback_submitted_at;

            return (
              <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(insight.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {hasFeedback && (
                    <Badge variant={insight.feedback_rating ? "default" : "secondary"}>
                      {insight.feedback_rating ? (
                        <><ThumbsUp className="h-3 w-3 mr-1" /> Gostou</>
                      ) : (
                        <><ThumbsDown className="h-3 w-3 mr-1" /> Não gostou</>
                      )}
                    </Badge>
                  )}
                </div>

                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(insight.id)}>
                  <div className="space-y-3">
                    <div className="text-sm leading-relaxed line-clamp-3">
                      {insight.insight_content}
                    </div>
                    
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full">
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Ver mais
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-4">
                      <div className="text-sm leading-relaxed">
                        {insight.insight_content}
                      </div>

                      {hasFeedback && insight.feedback_comment && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Seu comentário:</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.feedback_comment}</p>
                        </div>
                      )}

                      {!hasFeedback && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">O que achou deste insight?</h4>
                            
                            <div className="flex gap-2">
                              <Button
                                variant={feedbackState?.rating === true ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFeedbackRating(insight.id, true)}
                                className="flex-1"
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Gostei
                              </Button>
                              <Button
                                variant={feedbackState?.rating === false ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFeedbackRating(insight.id, false)}
                                className="flex-1"
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                Não gostei
                              </Button>
                            </div>

                            <Textarea
                              placeholder="Comentário opcional sobre este insight..."
                              value={feedbackState?.comment || ''}
                              onChange={(e) => setFeedbackComment(insight.id, e.target.value)}
                              className="min-h-[80px]"
                            />

                            <Button
                              onClick={() => handleFeedbackSubmit(insight.id)}
                              disabled={!feedbackState?.rating || feedbackState?.submitting}
                              className="w-full"
                            >
                              {feedbackState?.submitting ? 'Enviando...' : 'Enviar Feedback'}
                            </Button>
                          </div>
                        </>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightHistoryCard;