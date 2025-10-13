import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Se o evento é TOKEN_REFRESHED e falhou, fazer logout
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('🔒 [useAuth] Token refresh failed - user might be deleted');
          await signOut();
          return;
        }
        
        // Se há sessão, verificar se usuário ainda existe
        if (session?.user) {
          try {
            const { error } = await supabase.auth.getUser();
            if (error?.status === 403 || error?.message?.includes('not found')) {
              console.log('🔒 [useAuth] User no longer exists - forcing logout');
              await signOut();
              return;
            }
          } catch (e) {
            console.error('🔒 [useAuth] Error checking user existence:', e);
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Always clear local state first
      setSession(null);
      setUser(null);
      
      // Clear any localStorage/sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Attempt server logout (but don't fail if it errors)
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error (continuing anyway):', error);
    } finally {
      // Force redirect to home page using window.location for logout
      window.location.href = '/';
    }
  };

  // Estabilizar objetos para evitar re-renders desnecessários
  const authValue = useMemo(() => ({ 
    session, 
    user, 
    loading, 
    signOut 
  }), [session, user, loading]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};