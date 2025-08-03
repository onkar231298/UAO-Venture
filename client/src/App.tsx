import { Switch, Route } from "wouter";
import TestMultiCurrency from "@/pages/TestMultiCurrency";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { useAuth } from "@/hooks/useAuth";
import { seoService } from "@/services/seoService";
import { useEffect } from "react";
import Landing from "@/pages/Landing";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import UnifiedLogin from "@/pages/UnifiedLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import VideoUploadTest from "@/pages/VideoUploadTest";
import VideoHeroSliderManager from "@/pages/VideoHeroSliderManager";
import CustomerRegistration from "@/pages/CustomerRegistration";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerProfile from "@/pages/CustomerProfile";
import CustomerInquiries from "@/pages/CustomerInquiries";
import CustomerSavedProducts from "@/pages/CustomerSavedProducts";
import CustomerQuotes from "@/pages/CustomerQuotes";
import UserManagement from "@/pages/admin/UserManagement";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - always accessible for everyone */}
      <Route path="/" component={Landing} />
      <Route path="/products" component={Products} />
      <Route path="/ingredients" component={Products} />
      <Route path="/login" component={UnifiedLogin} />

      <Route path="/register" component={CustomerRegistration} />
      <Route path="/customer/profile" component={CustomerProfile} />
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      <Route path="/customer/inquiries" component={CustomerDashboard} />
      <Route path="/customer/high-volume-bids" component={CustomerDashboard} />
      <Route path="/customer/sample-requests" component={CustomerDashboard} />
      <Route path="/customer/saved" component={CustomerDashboard} />
      <Route path="/customer/quotes" component={CustomerDashboard} />
      <Route path="/customer/downloads" component={CustomerDashboard} />
      <Route path="/customer/catalogs" component={CustomerDashboard} />
      <Route path="/customer/products" component={Products} />
      <Route path="/customer/search" component={Products} />
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
          
          {/* Customer dashboard - accessible without admin auth */}
          <Route path="/customer/*" component={CustomerDashboard} />
          
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

  return (
    <QueryClientProvider client={queryClient}>
      <CustomerAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CustomerAuthProvider>
    </QueryClientProvider>
  );
}

export default App;