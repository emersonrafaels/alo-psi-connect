import { Clock } from 'lucide-react';

interface StepEstimatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_TIMES = {
  1: 2, // Dados pessoais
  2: 2, // Dados profissionais
  3: 1, // Foto
  4: 3, // Resumo profissional
  5: 2, // Especialidades e preço
  6: 3, // Horários
  7: 1, // Senha
  8: 1, // Revisão
};

export const StepEstimator = ({ currentStep, totalSteps }: StepEstimatorProps) => {
  const calculateRemainingTime = () => {
    let totalMinutes = 0;
    for (let step = currentStep + 1; step <= totalSteps; step++) {
      totalMinutes += STEP_TIMES[step as keyof typeof STEP_TIMES] || 0;
    }
    return totalMinutes;
  };

  const remainingMinutes = calculateRemainingTime();

  if (currentStep >= totalSteps) return null;

  return (
    <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-primary" />
      <span className="font-medium">
        Tempo estimado restante: {remainingMinutes} {remainingMinutes === 1 ? 'minuto' : 'minutos'}
      </span>
    </div>
  );
};
