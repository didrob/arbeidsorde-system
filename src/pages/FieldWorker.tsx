import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MobileFieldWorker } from '@/components/MobileFieldWorker';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';

const FieldWorker = () => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show mobile-optimized field worker interface with proper navigation
  return (
    <ResponsiveLayout showMobileNav={true}>
      <MobileFieldWorker />
    </ResponsiveLayout>
  );
};

export default FieldWorker;