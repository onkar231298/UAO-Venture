import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import ProductDetail from "@/pages/ProductDetail";
import UnifiedLogin from "@/pages/UnifiedLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - always accessible for everyone */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={UnifiedLogin} />
      <Route path="/product/:slug" component={ProductDetail} />
      
      {/* Protected dashboard routes - only for authenticated users */}
      {!isLoading && isAuthenticated && user && (
        <>
          {/* Admin dashboard - for admin and super_admin roles */}
          {((user as any).role === 'admin' || (user as any).role === 'super_admin') && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/*" component={AdminDashboard} />
            </>
          )}
          
          {/* Customer dashboard - for customer role */}
          {(user as any).role === 'customer' && (
            <Route path="/dashboard" component={CustomerDashboard} />
          )}
          
          {/* Staff dashboard - for all other roles */}
          {((user as any).role !== 'admin' && (user as any).role !== 'super_admin' && (user as any).role !== 'customer') && (
            <Route path="/staff/*" component={StaffDashboard} />
          )}
        </>
      )}
      
      {/* 404 for any unmatched routes */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;