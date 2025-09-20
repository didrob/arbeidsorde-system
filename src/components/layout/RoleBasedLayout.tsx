import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ResponsiveLayout } from './ResponsiveLayout';
import { Navigate } from 'react-router-dom';

interface RoleBasedLayoutProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallbackRoute?: string;
}

export function RoleBasedLayout({ 
  children, 
  allowedRoles = ['admin', 'field_worker'],
  fallbackRoute = '/'
}: RoleBasedLayoutProps) {
  const { userRole, isFieldWorker, loading } = useAuth();

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

  // Check if user has required role
  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={fallbackRoute} replace />;
  }

  // Field workers always get mobile-optimized layout
  if (isFieldWorker) {
    return (
      <ResponsiveLayout showMobileNav={true}>
        {children}
      </ResponsiveLayout>
    );
  }

  // Admin/Manager users get responsive layout
  return (
    <ResponsiveLayout showMobileNav={false}>
      {children}
    </ResponsiveLayout>
  );
}