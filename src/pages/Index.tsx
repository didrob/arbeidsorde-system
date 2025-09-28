import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FieldWorkerDashboard } from '@/components/FieldWorkerDashboard';
import Dashboard from './Dashboard';

const Index = () => {
  const { user, loading, isFieldWorker } = useAuth();

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

  // Field workers should be redirected to /field by useSmartRouting
  // If they reach here, redirect them manually as fallback
  if (isFieldWorker) {
    window.location.href = '/field';
    return null;
  }

  // Show dashboard for admin/manager users
  return <Dashboard />;
};

export default Index;
