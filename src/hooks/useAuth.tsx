import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  isAdmin: boolean;
  isFieldWorker: boolean;
  isSystemAdmin: boolean;
  isSiteManager: boolean;
  isBillingManager: boolean;
  isFieldSupervisor: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching user role for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        
        // Only set fallback if it's a "not found" error (profile doesn't exist)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, setting default role');
          setUserRole('field_worker');
        } else {
          // For other errors, keep role as null and let user try again
          console.log('Keeping role as null due to error:', error.message);
          setUserRole(null);
        }
        return;
      }
      
      console.log('User role fetched successfully:', data?.role);
      setUserRole(data?.role || 'field_worker');
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      // Don't set fallback on unexpected errors - keep as null
      setUserRole(null);
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
    await supabase.auth.signOut();
    toast({
      title: "Logget ut",
      description: "Du er nå logget ut av systemet.",
    });
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    isAdmin: userRole === 'admin',
    isFieldWorker: userRole === 'field_worker',
    isSystemAdmin: userRole === 'system_admin',
    isSiteManager: userRole === 'site_manager',
    isBillingManager: userRole === 'billing_manager',
    isFieldSupervisor: userRole === 'field_supervisor',
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