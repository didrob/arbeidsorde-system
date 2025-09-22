import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { useSmartRouting } from "@/hooks/useSmartRouting";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
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

// Protected route wrapper with role-based routing
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading, isFieldWorker } = useAuth();
  
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PWAWrapper />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/field" element={<FieldWorker />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/work-orders" element={<WorkOrders />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customer-agreements" element={<CustomerAgreements />} />
                    <Route path="/materials" element={<Materials />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/time-tracking" element={<TimeTracking />} />
                    <Route path="/map" element={<Map />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
