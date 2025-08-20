import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import TestMultiCurrency from "@/pages/TestMultiCurrency";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { useAuth } from "@/hooks/useAuth";
import ReCAPTCHAProvider from "@/components/ReCAPTCHAProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { seoService } from "@/services/seoService";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import About from "@/pages/About";
import AboutUs from "@/pages/AboutUs";
import OurTeam from "@/pages/OurTeam";
import OurFarmers from "@/pages/OurFarmers";
import Contact from "@/pages/Contact";
import Ingredients from "@/pages/Ingredients";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import CategoryPage from "@/pages/CategoryPage";
import HealthSupport from "@/pages/HealthSupport";
import HealthSupportPage from "@/pages/HealthSupportPage";
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
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";
import QualityTesting from "@/pages/services/QualityTesting";
import RDSupport from "@/pages/services/RDSupport";
import RegulatoryCompliance from "@/pages/services/RegulatoryCompliance";
import CustomPackaging from "@/pages/services/CustomPackaging";
import LogisticsSolutions from "@/pages/services/LogisticsSolutions";
import Certifications from "@/pages/Certifications";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Track page views when routes change
  useAnalytics();

  return (
    <Switch>
      {/* Public routes - always accessible for everyone */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/about-us" component={AboutUs} />
      <Route path="/our-team" component={OurTeam} />
      <Route path="/our-farmers" component={OurFarmers} />
      <Route path="/certifications" component={Certifications} />
      <Route path="/contact" component={Contact} />
      <Route path="/ingredients" component={Ingredients} />
      <Route path="/landing" component={Landing} />
      <Route path="/products" component={Products} />
      <Route path="/ingredients/:slug" component={CategoryPage} />
      <Route path="/health-support" component={HealthSupport} />
      <Route path="/health-support/:slug" component={HealthSupportPage} />
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
      <Route path="/products/:slug" component={ProductDetail} />
      
      {/* Redirect old product URLs to new format */}
      <Route path="/product/:slug">
        {(params: { slug: string }) => {
          const [, setLocation] = useLocation();
          setLocation(`/products/${params.slug}`, { replace: true });
          return null;
        }}
      </Route>
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      
      {/* Service pages */}
      <Route path="/services/quality-testing" component={QualityTesting} />
      <Route path="/services/rd-support" component={RDSupport} />
      <Route path="/services/regulatory-compliance" component={RegulatoryCompliance} />
      <Route path="/services/custom-packaging" component={CustomPackaging} />
      <Route path="/services/logistics-solutions" component={LogisticsSolutions} />
      <Route path="/test-currency" component={TestMultiCurrency} />
      <Route path="/video-test" component={VideoUploadTest} />
      <Route path="/video-slider" component={() => <VideoHeroSliderManager canvaVideoUrl="" />} />
      <Route path="/test-webp-upload" component={TestWebPUpload} />
      
      {/* Protected dashboard routes - only for authenticated users */}
      {!isLoading && isAuthenticated && user ? (
        <>
          {/* Admin dashboard - for admin and super_admin roles */}
          {((user as any).role === 'admin' || (user as any).role === 'super_admin') ? (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/*" component={AdminDashboard} />
              <Route path="/dashboard" component={AdminDashboard} />
            </>
          ) : null}
          
          {/* Customer dashboard - accessible without admin auth */}
          <Route path="/customer/*" component={CustomerDashboard} />
          
          {/* Staff dashboard - for all other roles */}
          {((user as any).role !== 'admin' && (user as any).role !== 'super_admin' && (user as any).role !== 'customer') ? (
            <Route path="/staff/*" component={StaffDashboard} />
          ) : null}
        </>
      ) : null}
      
      {/* 404 for any unmatched routes */}
      <Route component={NotFound} />
    </Switch>
  );
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
    <QueryClientProvider client={queryClient}>
      <ReCAPTCHAProvider>
        <CustomerAuthProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CurrencyProvider>
        </CustomerAuthProvider>
      </ReCAPTCHAProvider>
    </QueryClientProvider>
  );
}

export default App;