import { Users } from "lucide-react";

interface VacancyProgressBarProps {
  current: number;
  max: number;
}

export const VacancyProgressBar = ({ current, max }: VacancyProgressBarProps) => {
  const percentage = (current / max) * 100;
  const remaining = max - current;
  
  const getColorClass = () => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTextColor = () => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {current}/{max} inscritos
          </span>
        </div>
        <span className={`font-semibold ${getTextColor()}`}>
          {remaining === 0 ? 'Esgotado' : `${remaining} vaga${remaining !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};