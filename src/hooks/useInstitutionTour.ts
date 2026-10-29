import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'institution-portal-tour-v2';

export interface TourStep {
  id: string;
  group: string;
  title: string;
  description: string;
  /** Itens do menu lateral apresentados nesta etapa (ids de PortalSidebar). */
  navIds: string[];
  highlights?: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    group: 'Boas-vindas',
    title: 'Bem-vindo ao Portal Institucional',
    description: 'Acompanhe o cuidado da sua comunidade com dados sempre agregados. Os alunos aparecem apenas como "Aluno #N" — nenhuma identidade ou texto privado é exposto.',
    navIds: [],
    highlights: ['Privacidade por padrão', 'Grupos com menos de 10 pessoas ficam ocultos', 'Buddy como copiloto'],
  },
  {
    id: 'panel',
    group: 'Painel',
    title: 'Comece pela Visão Geral',
    description: 'Veja as ações que precisam da sua atenção, o resumo executivo do Buddy com histórico, métricas de uso e o diário emocional agregado.',
    navIds: ['overview', 'metrics', 'wellbeing'],
  },
  {
    id: 'care',
    group: 'Cuidado',
    title: 'Cuide de quem precisa',
    description: 'Priorize a Triagem por sinais, envie mensagens para unidades, turmas ou alunos específicos, registre notas internas e converse com o Buddy.',
    navIds: ['triage-page', 'messages-page', 'notes', 'buddy'],
  },
  {
    id: 'management',
    group: 'Gestão',
    title: 'Organize sua rede',
    description: 'Gerencie alunos e estrutura acadêmica, profissionais, a Biblioteca de Apoios, cupons de acesso e o Radar Institucional.',
    navIds: ['students-page', 'professionals-page', 'supports-page', 'coupons', 'radar-page'],
  },
  {
    id: 'analytics',
    group: 'Análises',
    title: 'Compare e decida com o Comparador',
    description: 'Visão geral, Jornada de cuidado, Atendimentos, Diário emocional, Conteúdos e práticas, NED Nacional e Radar de Permanência — tudo em tela cheia.',
    navIds: ['comparator-page'],
  },
  {
    id: 'done',
    group: 'Pronto',
    title: 'Tudo pronto para começar',
    description: 'Escolha um atalho para ir direto às páginas mais novas. Você pode rever este tour a qualquer momento pelo botão no topo.',
    navIds: ['triage-page', 'comparator-page', 'messages-page', 'supports-page'],
  },
];

export const useInstitutionTour = () => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_STORAGE_KEY)) {
      const timer = setTimeout(() => setShowTour(true), 800);
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
    if (currentStep < TOUR_STEPS.length - 1) setCurrentStep((p) => p + 1);
    else completeTour();
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  }, [currentStep]);

  return {
    showTour,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    currentStepData: TOUR_STEPS[currentStep],
    nextStep,
    prevStep,
    goToStep: setCurrentStep,
    skipTour: completeTour,
    completeTour,
    resetTour,
  };
};
