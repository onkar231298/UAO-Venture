import { Switch, Route } from "wouter";
import TestMultiCurrency from "@/pages/TestMultiCurrency";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useLocationSync } from "@/hooks/useLocationSync";
import { seoService } from "@/services/seoService";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import Landing from "@/pages/Landing";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import UnifiedLogin from "@/pages/UnifiedLogin";
import CustomerSignup from "@/pages/CustomerSignup";
import CustomerLogin from "@/pages/CustomerLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import VideoUploadTest from "@/pages/VideoUploadTest";
import VideoHeroSliderManager from "@/pages/VideoHeroSliderManager";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Track page views when routes change
  useAnalytics();
  
  // Sync user location data after authentication
  useLocationSync();

  return (
    <Switch>
      {/* Public routes - always accessible for everyone */}
      <Route path="/" component={Landing} />
      <Route path="/products" component={Products} />
      <Route path="/ingredients" component={Products} />
      <Route path="/login" component={CustomerLogin} />
      <Route path="/signup" component={CustomerSignup} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/test-currency" component={TestMultiCurrency} />
      <Route path="/video-test" component={VideoUploadTest} />
      <Route path="/video-slider" component={() => <VideoHeroSliderManager canvaVideoUrl="" />} />
      
      {/* Protected dashboard routes - only for authenticated users */}
      {!isLoading && isAuthenticated && user && (
        <>
          {/* Admin dashboard - for admin and super_admin roles */}
          {((user as any).role === 'admin' || (user as any).role === 'super_admin') && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/*" component={AdminDashboard} />
              <Route path="/dashboard" component={AdminDashboard} />
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
  // Initialize SEO service on app load
  useEffect(() => {
    seoService.initializeSettings();
  }, []);

  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

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