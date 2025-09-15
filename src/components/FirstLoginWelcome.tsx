import React, { useEffect } from 'react';
import { GoogleCalendarWelcomeModal } from './GoogleCalendarWelcomeModal';
import { useFirstLoginDetection } from '@/hooks/useFirstLoginDetection';

export const FirstLoginWelcome: React.FC = () => {
  const { isFirstLogin, isProfessional, loading, markFirstLoginComplete } = useFirstLoginDetection();
  const [showModal, setShowModal] = React.useState(false);

  console.log('🎯 [FirstLoginWelcome] State:', { isFirstLogin, isProfessional, loading, showModal });

  useEffect(() => {
    console.log('🎯 [FirstLoginWelcome] useEffect triggered:', { loading, isFirstLogin, isProfessional });
    
    // Só mostra o modal se for primeiro login de um profissional
    if (!loading && isFirstLogin && isProfessional) {
      console.log('🎯 [FirstLoginWelcome] Showing modal for first-time professional');
      setShowModal(true);
    }
  }, [loading, isFirstLogin, isProfessional]);

  const handleClose = () => {
    console.log('🎯 [FirstLoginWelcome] Closing modal and marking first login complete');
    setShowModal(false);
    markFirstLoginComplete();
  };

  // Não renderiza nada se não for necessário
  if (loading || !isFirstLogin || !isProfessional) {
    console.log('🎯 [FirstLoginWelcome] Not rendering modal:', { loading, isFirstLogin, isProfessional });
    return null;
  }

  console.log('🎯 [FirstLoginWelcome] Rendering GoogleCalendarWelcomeModal');

  return (
    <GoogleCalendarWelcomeModal
      isOpen={showModal}
      onClose={handleClose}
    />
  );
};