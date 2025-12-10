import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'institution-portal-tour-completed';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Portal Institucional!',
    description: 'Este é o seu centro de gerenciamento. Aqui você pode acompanhar profissionais, alunos e métricas da sua instituição.',
  },
  {
    id: 'summary-cards',
    title: 'Cards de Resumo',
    description: 'Visualize rapidamente o total de instituições, profissionais ativos, alunos vinculados e taxa de atividade.',
    target: '[data-tour="summary-cards"]',
  },
  {
    id: 'tabs',
    title: 'Navegação por Abas',
    description: 'Alterne entre Visão Geral, Cupons, Métricas Avançadas e Bem-Estar dos alunos.',
    target: '[data-tour="tabs"]',
  },
  {
    id: 'wellbeing',
    title: 'Bem-Estar dos Alunos',
    description: 'Acompanhe métricas agregadas e anônimas sobre o bem-estar emocional dos alunos vinculados.',
    target: '[data-tour="wellbeing-tab"]',
  },
  {
    id: 'shortcuts',
    title: 'Atalhos de Teclado',
    description: 'Use Alt+1, Alt+2, Alt+3, Alt+4 para navegar rapidamente entre as abas. Alt+P para profissionais, Alt+A para alunos.',
  },
];

export const useInstitutionTour = () => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      // Delay para garantir que o DOM está pronto
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
    if (currentStep < TOUR_STEPS.length - 1) {
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
    totalSteps: TOUR_STEPS.length,
    currentStepData: TOUR_STEPS[currentStep],
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
};
