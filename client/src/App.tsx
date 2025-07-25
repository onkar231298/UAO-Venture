import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Dashboard from "@/pages/Dashboard";
import SalesManagement from "@/pages/crm/SalesManagement";
import PurchaseManagement from "@/pages/crm/PurchaseManagement";
import InventoryManagement from "@/pages/crm/InventoryManagement";
import LogisticsManagement from "@/pages/crm/LogisticsManagement";
import AccountsManagement from "@/pages/crm/AccountsManagement";
import WebsiteManagement from "@/pages/crm/WebsiteManagement";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/admin/dashboard" component={AdminDashboard} />
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/product/:slug" component={ProductDetail} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/product/:slug" component={ProductDetail} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/crm/sales" component={SalesManagement} />
          <Route path="/crm/purchase" component={PurchaseManagement} />
          <Route path="/crm/inventory" component={InventoryManagement} />
          <Route path="/crm/logistics" component={LogisticsManagement} />
          <Route path="/crm/accounts" component={AccountsManagement} />
          <Route path="/crm/website" component={WebsiteManagement} />
        </>
      )}
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
