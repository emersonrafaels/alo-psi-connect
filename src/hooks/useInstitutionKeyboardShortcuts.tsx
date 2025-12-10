import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from './useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

interface UseInstitutionKeyboardShortcutsProps {
  setActiveTab: (tab: string) => void;
}

export const useInstitutionKeyboardShortcuts = ({
  setActiveTab,
}: UseInstitutionKeyboardShortcutsProps) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorar se estiver em input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('overview');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('coupons');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('metrics');
            break;
          case '4':
            e.preventDefault();
            setActiveTab('wellbeing');
            break;
          case 'p':
          case 'P':
            e.preventDefault();
            navigate(buildTenantPath(tenant?.slug, '/portal-institucional/profissionais'));
            break;
          case 'a':
          case 'A':
            e.preventDefault();
            navigate(buildTenantPath(tenant?.slug, '/portal-institucional/alunos'));
            break;
        }
      }
    },
    [setActiveTab, navigate, tenant?.slug]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const KEYBOARD_SHORTCUTS = [
  { key: 'Alt + 1', description: 'Visão Geral' },
  { key: 'Alt + 2', description: 'Cupons' },
  { key: 'Alt + 3', description: 'Métricas Avançadas' },
  { key: 'Alt + 4', description: 'Bem-Estar' },
  { key: 'Alt + P', description: 'Profissionais' },
  { key: 'Alt + A', description: 'Alunos' },
];
