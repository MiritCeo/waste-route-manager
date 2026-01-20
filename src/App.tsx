import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RouteProvider } from "@/contexts/RouteContext";
import { LoginPage } from "./pages/shared/LoginPage";
import { Unauthorized } from "./pages/shared/Unauthorized";
import NotFound from "./pages/shared/NotFound";
import { DriverRoutes } from "./routes/DriverRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { ROUTES } from "./constants/routes";

const queryClient = new QueryClient();

// Root redirect component
const RootRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Redirect based on user role
  if (user?.role === 'ADMIN') {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  return <Navigate to={ROUTES.DRIVER.ROUTES} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <RouteProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Auth routes */}
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
              
              {/* Driver routes */}
              <Route path="/driver/*" element={<DriverRoutes />} />
              
              {/* Admin routes */}
              <Route path="/admin/*" element={<AdminRoutes />} />
              
              {/* 404 catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </RouteProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
