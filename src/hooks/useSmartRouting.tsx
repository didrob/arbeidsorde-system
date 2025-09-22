import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

export const useSmartRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, isFieldWorker } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user || !userRole) return;

    // Skip if already on correct route or on auth pages
    if (location.pathname.includes('/auth')) {
      return;
    }

    // Route field workers to field interface if they're not already there
    if (isFieldWorker && !location.pathname.startsWith('/field')) {
      navigate('/field', { replace: true });
      return;
    }
    
    // Route non-field workers away from field interface to dashboard
    if (!isFieldWorker && location.pathname.startsWith('/field')) {
      navigate('/', { replace: true });
      return;
    }
  }, [user, userRole, isFieldWorker, location.pathname, navigate]);
};