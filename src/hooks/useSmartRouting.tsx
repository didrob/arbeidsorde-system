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

    if (location.pathname.includes('/auth')) return;

    // Field workers on mobile → /field
    if (isFieldWorker && isMobile && !location.pathname.startsWith('/field')) {
      navigate('/field', { replace: true });
      return;
    }

    // Field workers on desktop → / (admin dashboard)
    if (isFieldWorker && !isMobile && location.pathname.startsWith('/field')) {
      navigate('/', { replace: true });
      return;
    }
    
    // Non-field workers away from /field
    if (!isFieldWorker && location.pathname.startsWith('/field')) {
      navigate('/', { replace: true });
      return;
    }
  }, [user, userRole, isFieldWorker, isMobile, location.pathname, navigate]);
};