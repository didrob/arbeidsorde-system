import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SiteFilterProvider } from "@/hooks/useSiteFilter";
import { WorkOrderWizardProvider } from "@/contexts/WorkOrderWizardContext";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { GlobalWorkOrderWizardPortal } from "@/components/GlobalWorkOrderWizardPortal";
import { useSmartRouting } from "@/hooks/useSmartRouting";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserOnboarding } from "@/components/onboarding/UserOnboarding";
import { CustomerLayout } from "@/components/portal/CustomerLayout";
import { ThemeProvider } from "next-themes";

// Eager-loaded pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded employee pages
const Index = lazy(() => import("./pages/Index"));
const FieldWorker = lazy(() => import("./pages/FieldWorker"));
const WorkOrders = lazy(() => import("./pages/WorkOrders"));
const Customers = lazy(() => import("./pages/Customers"));
const Materials = lazy(() => import("./pages/Materials"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const Map = lazy(() => import("./pages/Map"));
const Reports = lazy(() => import("./pages/Reports"));
const Resources = lazy(() => import("./pages/Resources"));
const Settings = lazy(() => import("./pages/Settings"));
const CustomerAgreements = lazy(() => import("./pages/CustomerAgreements"));
const SalesOrders = lazy(() => import("./pages/SalesOrders"));
const Planner = lazy(() => import("./pages/Planner"));
const RegisterCustomer = lazy(() => import("./pages/RegisterCustomer"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));

// Lazy-loaded portal pages
const PortalLogin = lazy(() => import("./pages/portal/PortalLogin"));
const CustomerDashboard = lazy(() => import("./pages/portal/CustomerDashboard"));
const CustomerOrders = lazy(() => import("./pages/portal/CustomerOrders"));
const NewOrder = lazy(() => import("./pages/portal/NewOrder"));

const queryClient = new QueryClient();

function LazyFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );
}

// PWA Install Prompt wrapper
function PWAWrapper() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname === '/';
  if (isAuthPage) return null;
  return <PWAInstallPrompt />;
}

// Protected route for employees
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading, isCustomer, needsOnboarding } = useAuth();
  const isMobile = useIsMobile();
  
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

  if (!user) return <Navigate to="/" replace />;
  if (isCustomer) return <Navigate to="/portal" replace />;

  if (needsOnboarding && userRole !== 'system_admin') {
    return <UserOnboarding />;
  }

  return (
    <ResponsiveLayout showMobileNav={isMobile}>
      {children}
    </ResponsiveLayout>
  );
}

// Protected route for customers
function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isCustomer } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/portal/login" replace />;
  if (!isCustomer) return <Navigate to="/dashboard" replace />;

  return <CustomerLayout>{children}</CustomerLayout>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" storageKey="asco-theme">
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WorkOrderWizardProvider>
            <SiteFilterProvider>
              <BrowserRouter>
              <Toaster />
              <Sonner />
              <PWAWrapper />
              <GlobalWorkOrderWizardPortal />
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/register-customer" element={<RegisterCustomer />} />

                  {/* Customer portal */}
                  <Route path="/portal/login" element={<PortalLogin />} />
                  <Route path="/portal" element={<CustomerProtectedRoute><CustomerDashboard /></CustomerProtectedRoute>} />
                  <Route path="/portal/orders" element={<CustomerProtectedRoute><CustomerOrders /></CustomerProtectedRoute>} />
                  <Route path="/portal/new-order" element={<CustomerProtectedRoute><NewOrder /></CustomerProtectedRoute>} />

                  {/* Employee */}
                  <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/field" element={<FieldWorker />} />
                  <Route path="/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
                  <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                  <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
                  <Route path="/customer-agreements" element={<ProtectedRoute><CustomerAgreements /></ProtectedRoute>} />
                  <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
                  <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                  <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
                  <Route path="/time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
                  <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </BrowserRouter>
            </SiteFilterProvider>
          </WorkOrderWizardProvider>
        </AuthProvider>
      </QueryClientProvider>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
