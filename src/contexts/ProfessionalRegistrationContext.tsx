import React, { createContext, useContext, useState, useEffect } from 'react';

interface ProfessionalRegistrationContextType {
  isRegistering: boolean;
  startRegistration: () => void;
  endRegistration: () => void;
}

const ProfessionalRegistrationContext = createContext<ProfessionalRegistrationContextType | undefined>(undefined);

export const ProfessionalRegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRegistering, setIsRegistering] = useState<boolean>(() => {
    // Inicializar do localStorage para persistir entre reloads
    return localStorage.getItem('professional_registration_in_progress') === 'true';
  });

  useEffect(() => {
    console.log('🎯 [ProfessionalRegistration] Context state changed:', { isRegistering });
  }, [isRegistering]);

  const startRegistration = () => {
    console.log('🎯 [ProfessionalRegistration] Starting professional registration');
    console.log('🎯 [ProfessionalRegistration] Previous state:', { isRegistering });
    setIsRegistering(true);
    localStorage.setItem('professional_registration_in_progress', 'true');
    console.log('🎯 [ProfessionalRegistration] New state: isRegistering = true');
  };

  const endRegistration = () => {
    console.log('🎯 [ProfessionalRegistration] Ending professional registration');
    setIsRegistering(false);
    localStorage.removeItem('professional_registration_in_progress');
  };

  return (
    <ProfessionalRegistrationContext.Provider value={{ isRegistering, startRegistration, endRegistration }}>
      {children}
    </ProfessionalRegistrationContext.Provider>
  );
};

export const useProfessionalRegistration = () => {
  const context = useContext(ProfessionalRegistrationContext);
  if (context === undefined) {
    throw new Error('useProfessionalRegistration must be used within a ProfessionalRegistrationProvider');
  }
  return context;
};
