import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { queryClient } from "./lib/queryClient";

// Import key pages
import Landing from "@/pages/Landing";
import Products from "@/pages/Products";
import ProductDetailBFI from "@/pages/ProductDetailBFI";
import SearchResults from "@/pages/SearchResults";
import CategoryPage from "@/pages/CategoryPage";

function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CustomerAuthProvider>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/products" component={Products} />
            <Route path="/ingredients" component={Products} />
            <Route path="/ingredients/:slug" component={CategoryPage} />
            <Route path="/category/:slug" component={CategoryPage} />
            <Route path="/search/:query" component={SearchResults} />
            <Route path="/product/:slug" component={ProductDetailBFI} />
          </Switch>
          <Toaster />
        </CustomerAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default SimpleApp;