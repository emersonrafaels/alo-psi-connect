import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

export const useAuthRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const saveCurrentLocationAndRedirect = () => {
    // Salvar a URL atual (incluindo query params) antes de redirecionar
    const currentUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('authReturnTo', currentUrl);
    navigate('/auth');
  };

  const redirectToAuth = () => {
    if (!user) {
      saveCurrentLocationAndRedirect();
    }
  };

  return {
    redirectToAuth,
    saveCurrentLocationAndRedirect,
    isAuthenticated: !!user
  };
};