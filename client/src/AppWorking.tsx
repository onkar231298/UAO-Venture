import React from "react";
import Landing from "@/pages/Landing";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";

// Working app component using createElement to avoid JSX issues
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
        React.createElement(Landing, null),
        React.createElement(Toaster, null)
      )
    )
  );
}

export default AppWorking;