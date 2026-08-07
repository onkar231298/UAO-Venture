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
import { CallStateProvider } from "@/contexts/CallStateContext";
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
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import QualityDashboard from "@/pages/quality/QualityDashboard";
import SalesPersonDashboard from "@/pages/SalesPersonDashboard";
import SalesLeadManagement from "@/pages/SalesLeadManagement";
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
import Industries from "@/pages/Industries";
import FoodIngredients from "@/pages/FoodIngredients";
import OrganicHerbs from "@/pages/OrganicHerbs";
import EUOrganicSpices from "@/pages/EUOrganicSpices";
import BulkOrganicExporter from "@/pages/BulkOrganicExporter";
import OrganicSupplierIndia from "@/pages/OrganicSupplierIndia";
import Presentation from "@/pages/Presentation";
import PackagingSolutions from "@/pages/PackagingSolutions";
import EmailSettings from "@/pages/crm/EmailSettings";
import MyCompanies from "@/pages/crm/MyCompanies";
import MySalesAndQuotations from "@/pages/crm/MySalesAndQuotations";
import MyAttendancePage from "@/pages/sales/MyAttendancePage";
import QualityRequestsPage from "@/pages/sales/QualityRequestsPage";
import MyActivityLog from "@/pages/sales/MyActivityLog";
import FollowUpsPage from "@/pages/sales/FollowUpsPage";
import SalesOrdersPage from "@/pages/crm/SalesOrdersPage";

import { useActivityHeartbeat } from "@/hooks/useActivityHeartbeat";

// Helper component for product URL redirect
function ProductRedirect({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(`/products/${params.slug}`, { replace: true });
  }, [params.slug, setLocation]);
  
  return null;
}

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
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

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
      <Route path="/product/:slug" component={ProductRedirect} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      
      {/* Industry-specific landing pages for SEO */}
      <Route path="/industries" component={Industries} />
      <Route path="/food-ingredients" component={FoodIngredients} />
      <Route path="/organic-herbs" component={OrganicHerbs} />
      <Route path="/eu-organic-spices" component={EUOrganicSpices} />
      <Route path="/bulk-organic-exporter-india" component={BulkOrganicExporter} />
      <Route path="/organic-spice-supplier-india" component={OrganicSupplierIndia} />
      <Route path="/presentation" component={Presentation} />
      <Route path="/packaging-solutions" component={PackagingSolutions} />
      
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
      
      {/* Admin dashboard routes - always registered, authentication handled inside AdminDashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/*" component={AdminDashboard} />
      <Route path="/dashboard" component={AdminDashboard} />
      
      {/* Protected dashboard routes - only for authenticated users */}
      {!isLoading && isAuthenticated && user ? (
        <>          
          {/* Customer dashboard - accessible without admin auth */}
          <Route path="/customer/*" component={CustomerDashboard} />
          
          {/* Sales person dashboard - only for sales_executive and sales_manager */}
          {((user as any).role === 'sales_executive' || (user as any).role === 'sales_manager') ? (
            <>
              <Route path="/sales" component={SalesPersonDashboard} />
              <Route path="/sales/leads" component={SalesLeadManagement} />
              <Route path="/sales/my-companies" component={MyCompanies} />
              <Route path="/sales/follow-ups" component={FollowUpsPage} />
              <Route path="/sales/my-sales" component={MySalesAndQuotations} />
              <Route path="/sales/my-attendance" component={MyAttendancePage} />
              <Route path="/sales/quality-requests" component={QualityRequestsPage} />
              <Route path="/sales/my-activity-log" component={MyActivityLog} />
              <Route path="/sales/*" component={SalesPersonDashboard} />
              <Route path="/crm/email-settings" component={EmailSettings} />
            </>
          ) : null}
          
          {/* Staff dashboard - for all other roles */}
          {((user as any).role !== 'admin' && (user as any).role !== 'super_admin' && (user as any).role !== 'customer') ? (
            <>
              <Route path="/staff/*" component={StaffDashboard} />
              <Route path="/quality/dashboard" component={QualityDashboard} />
              <Route path="/quality/dashboard/*" component={QualityDashboard} />
            </>
          ) : null}
        </>
      ) : null}
      
      {/* 404 for any unmatched routes */}
      <Route component={NotFound} />
    </Switch>
  );
}

function ActivityHeartbeatTracker() {
  useActivityHeartbeat();
  return null;
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
            <CallStateProvider>
              <TooltipProvider>
                <Toaster />

                <ActivityHeartbeatTracker />
                <Router />
              </TooltipProvider>
            </CallStateProvider>
          </CurrencyProvider>
        </CustomerAuthProvider>
      </ReCAPTCHAProvider>
    </QueryClientProvider>
  );
}

export default App;