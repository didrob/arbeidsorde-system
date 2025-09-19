import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

export const useSmartRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role
  useEffect(() => {
    if (!user) return;
    
    const fetchUserRole = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserRole(data.role);
      }
    };
    
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (!user || !userRole) return;

    // Skip if already on correct route or on auth pages
    if (location.pathname.includes('/auth') || location.pathname.includes('/field')) {
      return;
    }

    // Route field workers to mobile interface when on mobile
    if (userRole === 'field_worker' && isMobile) {
      navigate('/field', { replace: true });
    }
    
    // Route non-field workers away from field interface
    if (userRole !== 'field_worker' && location.pathname.startsWith('/field')) {
      navigate('/', { replace: true });
    }
  }, [user, userRole, isMobile, location.pathname, navigate]);
};