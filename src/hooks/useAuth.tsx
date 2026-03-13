import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  needsOnboarding: boolean;
  isAdmin: boolean;
  isFieldWorker: boolean;
  isSystemAdmin: boolean;
  isSiteManager: boolean;
  isBillingManager: boolean;
  isFieldSupervisor: boolean;
  isCustomer: boolean;
  customerId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching user role for:', userId);
      
      // SECURITY: Fetch role from user_roles table (not profiles)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Also fetch profile for organization/site onboarding check + customer_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, site_id, customer_id')
        .eq('user_id', userId)
        .single();
      
      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
        setUserRole(null);
        setNeedsOnboarding(false);
        return;
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      
      // Set role from user_roles table
      const role = roleData?.role || 'field_worker';
      console.log('User role fetched successfully:', role);
      setUserRole(role);
      setCustomerId(profileData?.customer_id || null);
      
      // Customers skip onboarding — they don't need org/site assignment
      if (role === 'customer') {
        setNeedsOnboarding(false);
      } else {
        const needsOnboarding = !profileData?.organization_id || !profileData?.site_id;
        setNeedsOnboarding(needsOnboarding);
      }
      console.log('User needs onboarding:', needsOnboarding);
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      setUserRole(null);
      setCustomerId(null);
      setNeedsOnboarding(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Remove setTimeout race condition - call directly
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
          setNeedsOnboarding(false);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Innlogging feilet",
        description: error.message,
      });
    } else {
      toast({
        title: "Velkommen tilbake!",
        description: "Du er nå logget inn.",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Registrering feilet",
        description: error.message,
      });
    } else {
      toast({
        title: "Konto opprettet!",
        description: "Sjekk e-posten din for bekreftelse.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // Always clear local state first to ensure UI updates immediately
      setUser(null);
      setSession(null);
      setUserRole(null);
      setNeedsOnboarding(false);
      
      // Attempt server logout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.log('Logout error (forcing local logout):', error.message);
        // Even if server logout fails, we've already cleared local state
      }
      
      toast({
        title: "Logget ut",
        description: "Du er nå logget ut av systemet.",
      });
      
      // Force navigation to auth page
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout anyway by clearing state and redirecting
      setUser(null);
      setSession(null);
      setUserRole(null);
      setNeedsOnboarding(false);
      
      toast({
        title: "Logget ut",
        description: "Du er nå logget ut av systemet.",
      });
      
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    needsOnboarding,
    isAdmin: userRole === 'admin',
    isFieldWorker: userRole === 'field_worker',
    isSystemAdmin: userRole === 'system_admin',
    isSiteManager: userRole === 'site_manager',
    isBillingManager: userRole === 'billing_manager',
    isFieldSupervisor: userRole === 'field_supervisor',
    isCustomer: userRole === 'customer',
    customerId,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}