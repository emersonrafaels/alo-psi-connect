import React, { useEffect } from 'react';
import { GoogleCalendarWelcomeModal } from './GoogleCalendarWelcomeModal';
import { useFirstLoginDetection } from '@/hooks/useFirstLoginDetection';

export const FirstLoginWelcome: React.FC = () => {
  const { isFirstLogin, isProfessional, loading, markFirstLoginComplete } = useFirstLoginDetection();
  const [showModal, setShowModal] = React.useState(false);

  useEffect(() => {
    // Só mostra o modal se for primeiro login de um profissional
    if (!loading && isFirstLogin && isProfessional) {
      setShowModal(true);
    }
  }, [loading, isFirstLogin, isProfessional]);

  const handleClose = () => {
    setShowModal(false);
    markFirstLoginComplete();
  };

  // Não renderiza nada se não for necessário
  if (loading || !isFirstLogin || !isProfessional) {
    return null;
  }

  return (
    <GoogleCalendarWelcomeModal
      isOpen={showModal}
      onClose={handleClose}
    />
  );
};