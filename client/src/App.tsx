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
      {/* Public routes - always accessible */}
      <Route path="/login" component={UnifiedLogin} />
      <Route path="/product/:slug" component={ProductDetail} />
      
      {/* Protected routes based on authentication and role */}
      {!isLoading && isAuthenticated && user ? (
        <>
          {/* Admin users get admin dashboard */}
          {((user as any).role === 'admin' || (user as any).role === 'super_admin') && (
            <Route path="/" component={AdminDashboard} />
          )}
          
          {/* Customer users get customer dashboard */}
          {(user as any).role === 'customer' && (
            <Route path="/" component={CustomerDashboard} />
          )}
          
          {/* Staff users (all other roles) get staff dashboard */}
          {((user as any).role !== 'admin' && (user as any).role !== 'super_admin' && (user as any).role !== 'customer') && (
            <Route path="/" component={StaffDashboard} />
          )}
        </>
      ) : (
        /* Non-authenticated users see landing page */
        <Route path="/" component={Landing} />
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