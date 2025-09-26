import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { useSmartRouting } from "@/hooks/useSmartRouting";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserOnboarding } from "@/components/onboarding/UserOnboarding";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FieldWorker from "./pages/FieldWorker";
import NotFound from "./pages/NotFound";
import WorkOrders from "./pages/WorkOrders";
import Customers from "./pages/Customers";
import Materials from "./pages/Materials";
import TimeTracking from "./pages/TimeTracking";
import Map from "./pages/Map";
import Reports from "./pages/Reports";
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import CustomerAgreements from './pages/CustomerAgreements';
import Invoices from './pages/Invoices';

const queryClient = new QueryClient();

// PWA Install Prompt wrapper - only show when not on auth pages
function PWAWrapper() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');
  
  if (isAuthPage) return null;
  return <PWAInstallPrompt />;
}

// Protected route wrapper with role-based routing and onboarding
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading, isFieldWorker, needsOnboarding } = useAuth();
  
  // Use smart routing for field workers
  useSmartRouting();

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show onboarding for users who need it (unless they're system admins who can manage themselves)
  if (needsOnboarding && userRole !== 'system_admin') {
    return <UserOnboarding />;
  }

  // Field workers should use mobile interface
  if (isFieldWorker) {
    return (
      <ResponsiveLayout showMobileNav={true}>
        {children}
      </ResponsiveLayout>
    );
  }

  // Admin/Manager users get responsive layout with sidebar on desktop
  return (
    <ResponsiveLayout showMobileNav={false}>
      {children}
    </ResponsiveLayout>
  );
}

const App = () => (
  <TooltipProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <PWAWrapper />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/field" element={<FieldWorker />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/customer-agreements" element={<ProtectedRoute><CustomerAgreements /></ProtectedRoute>} />
            <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </TooltipProvider>
);

export default App;
