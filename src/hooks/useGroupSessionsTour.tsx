import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'group-sessions-tour-completed';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
}

export const GROUP_SESSIONS_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo aos seus Encontros!',
    description: 'Aqui você gerencia inscrições, cria novos encontros e acompanha seus indicadores.',
  },
  {
    id: 'tabs',
    title: 'Navegação por Abas',
    description: 'Alterne entre Encontros Inscritos, Meus Encontros Criados e Criar Encontro.',
    target: '[data-tour="sessions-tabs"]',
  },
  {
    id: 'my-sessions',
    title: 'Encontros Inscritos',
    description: 'Veja seus próximos encontros, acesse links de reunião e gerencie inscrições.',
    target: '[data-tour="my-sessions-tab"]',
  },
  {
    id: 'created-sessions',
    title: 'Meus Encontros Criados',
    description: 'Acompanhe indicadores como inscritos, taxa de ocupação e status dos encontros que você criou.',
    target: '[data-tour="created-sessions-tab"]',
  },
  {
    id: 'create-session',
    title: 'Criar Encontro',
    description: 'Crie novos encontros em grupo preenchendo o formulário com título, data, formato e descrição.',
    target: '[data-tour="create-session-tab"]',
  },
];

export const useGroupSessionsTour = () => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setShowTour(false);
    setCurrentStep(0);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setCurrentStep(0);
    setShowTour(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < GROUP_SESSIONS_TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  return {
    showTour,
    currentStep,
    totalSteps: GROUP_SESSIONS_TOUR_STEPS.length,
    currentStepData: GROUP_SESSIONS_TOUR_STEPS[currentStep],
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
};
