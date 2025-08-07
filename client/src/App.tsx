import { Switch, Route } from "wouter";
import TestMultiCurrency from "@/pages/TestMultiCurrency";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { useAuth } from "@/hooks/useAuth";
import { seoService } from "@/services/seoService";
import { useEffect, Component, type ReactNode } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import Landing from "@/pages/Landing";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import CategoryPage from "@/pages/CategoryPage";
import SearchResults from "@/pages/SearchResults";
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
import TestWebPUpload from "@/pages/TestWebPUpload";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Track page views when routes change
  useAnalytics();

  return (
    <Switch>
      {/* Public routes - always accessible for everyone */}
      <Route path="/" component={Landing} />
      <Route path="/products" component={Products} />
      <Route path="/ingredients" component={Products} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/search/:query" component={SearchResults} />
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
      <Route path="/video-slider" component={VideoHeroSliderManager} />
      <Route path="/test-webp-upload" component={TestWebPUpload} />
      
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

// Error boundary to catch React rendering errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Ignore errors from browser extensions
    if (error.stack?.includes('extension') || 
        error.stack?.includes('chrome-') || 
        error.stack?.includes('moz-')) {
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error but don't crash the app
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page to continue.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Initialize SEO service and Google Analytics on app load
  useEffect(() => {
    try {
      seoService.initializeSettings();
      
      // Verify required environment variable is present
      if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
        console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
      } else {
        initGA();
      }
    } catch (error) {
      console.warn('App initialization error:', error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CustomerAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CustomerAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;