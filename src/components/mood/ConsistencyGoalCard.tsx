import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useMoodGoals, calculateGoalProgress } from '@/hooks/useMoodGoals';
import { Target } from 'lucide-react';

interface ConsistencyGoalCardProps {
  entries: { date: string }[];
}

export function ConsistencyGoalCard({ entries }: ConsistencyGoalCardProps) {
  const { data: goals = [], upsertGoal } = useMoodGoals();
  const goal = goals[0];
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(goal?.target_value || 5);

  const progress = goal ? calculateGoalProgress(entries, goal) : null;
  const completed = progress && progress.current >= progress.target;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Meta de consistência
        </CardTitle>
        <CardDescription>
          {goal
            ? `Registrar ${goal.target_value}x por semana`
            : 'Defina uma meta leve de quantos registros quer fazer por semana.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress && (
          <>
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress.current} de {progress.target} registros nesta semana
              {completed && ' — meta concluída! 🎉'}
            </p>
          </>
        )}
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={14}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-24"
            />
            <Button
              size="sm"
              onClick={() => {
                upsertGoal.mutate(
                  { ...(goal || {}), goal_type: 'entries_per_week', target_value: target, period: 'week', id: goal?.id as any },
                );
                setEditing(false);
              }}
            >
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            {goal ? 'Editar meta' : 'Definir meta'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
