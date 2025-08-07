import React from "react";
import { Switch, Route } from "wouter";
import Landing from "@/pages/Landing";
import Products from "@/pages/Products";
import ProductDetailBFI from "@/pages/ProductDetailBFI";
import SearchResults from "@/pages/SearchResults";
import CategoryPage from "@/pages/CategoryPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";

// Working app component using createElement to avoid JSX issues
function AppRoutes() {
  return React.createElement(
    Switch,
    null,
    React.createElement(Route, { path: "/", component: Landing }),
    React.createElement(Route, { path: "/products", component: Products }),
    React.createElement(Route, { path: "/ingredients", component: Products }),
    React.createElement(Route, { path: "/category/:slug", component: CategoryPage }),
    React.createElement(Route, { path: "/search/:query", component: SearchResults }),
    React.createElement(Route, { path: "/product/:slug", component: ProductDetailBFI })
  );
}

function AppWorking() {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      TooltipProvider,
      null,
      React.createElement(
        CustomerAuthProvider,
        null,
        React.createElement(AppRoutes, null),
        React.createElement(Toaster, null)
      )
    )
  );
}

export default AppWorking;