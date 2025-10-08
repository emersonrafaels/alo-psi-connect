import { useContext } from 'react';
import { TenantContext } from '@/contexts/TenantContext';
import { TenantContextType } from '@/types/tenant';

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};
