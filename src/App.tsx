import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SimpleSidebar } from "@/components/SimpleSidebar";
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

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/field" element={<FieldWorker />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <div className="flex min-h-screen w-full">
                    <SimpleSidebar />
                    <div className="flex-1 flex flex-col">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/work-orders" element={<WorkOrders />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/materials" element={<Materials />} />
                        <Route path="/resources" element={<Resources />} />
                        <Route path="/time-tracking" element={<TimeTracking />} />
                        <Route path="/map" element={<Map />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </div>
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
