import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminTenantContextType {
  selectedTenantId: string;
  setSelectedTenantId: (tenantId: string) => void;
  tenantFilter: string | null;
  tenants: Array<{ id: string; name: string; slug: string }>;
  loading: boolean;
}

const AdminTenantContext = createContext<AdminTenantContextType | undefined>(undefined);

export const AdminTenantProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTenantId, setSelectedTenantIdState] = useState<string>(() => {
    return localStorage.getItem('admin-tenant-filter') || 'all';
  });
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setTenants(data || []);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const setSelectedTenantId = (tenantId: string) => {
    setSelectedTenantIdState(tenantId);
    localStorage.setItem('admin-tenant-filter', tenantId);
  };

  const tenantFilter = selectedTenantId === 'all' ? null : selectedTenantId;

  return (
    <AdminTenantContext.Provider
      value={{
        selectedTenantId,
        setSelectedTenantId,
        tenantFilter,
        tenants,
        loading,
      }}
    >
      {children}
    </AdminTenantContext.Provider>
  );
};

export const useAdminTenant = () => {
  const context = useContext(AdminTenantContext);
  if (context === undefined) {
    throw new Error('useAdminTenant must be used within AdminTenantProvider');
  }
  return context;
};
