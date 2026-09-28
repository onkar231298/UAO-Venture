import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import Footer from "@/components/Footer";

import { Leaf, AlertCircle, Users, UserCheck } from "lucide-react";

export default function UnifiedLogin() {
  const [adminData, setAdminData] = useState({ email: "", password: "" });
  const [customerData, setCustomerData] = useState({ email: "", password: "" });
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { loginCustomer } = useCustomerAuth();

  // Check for error parameter in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorType = urlParams.get('error');
    if (errorType) {
      if (errorType === 'invalid_credentials') {
        setError("Invalid email or password. Please try again.");
      } else if (errorType === 'login_failed') {
        setError("Login failed. Please try again.");
      } else if (errorType === 'admin_failed') {
        setError("Invalid credentials. Please try again.");
      } else if (errorType === 'customer_failed') {
        setError("Invalid customer credentials. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
      window.history.replaceState(null, '', '/login');
    }
  }, []);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    setError("");
    
    // Create form and submit for admin login (existing Replit Auth)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/admin/login';
    
    const emailInput = document.createElement('input');
    emailInput.type = 'hidden';
    emailInput.name = 'email';
    emailInput.value = adminData.email;
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'hidden';
    passwordInput.name = 'password';
    passwordInput.value = adminData.password;
    
    form.appendChild(emailInput);
    form.appendChild(passwordInput);
    document.body.appendChild(form);
    form.submit();
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCustomerLoading(true);
    setError("");
    
    try {
      const response = await apiRequest('/api/auth/customer-login', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        const result = await response.json();
        // Use the customer auth context to login
        loginCustomer(result.user);
        toast({
          title: "Login Successful!",
          description: `Welcome back, ${result.user.firstName}!`,
        });
        // Redirect to home page
        setLocation('/');
      } else {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Customer login error:", error);
      setError(error.message || "Invalid credentials. Please try again.");
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCustomerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-yellow-400 flex flex-col">
      {/* Main content area with centered card */}
      <div className="flex-1 flex items-center justify-center p-4 pb-8">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="text-white text-2xl" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Cape NatureX ORGANIC</CardTitle>
          <CardDescription>Welcome to Cape NatureX Organic Login Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customer Login
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Staff Login
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="space-y-4">
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer-password">Password</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    value={customerData.password}
                    onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isCustomerLoading}>
                  {isCustomerLoading ? "Signing in..." : "Customer Login"}
                </Button>
                
                <div className="text-center">
                  <a 
                    href="/forgot-password" 
                    className="text-sm text-green-600 hover:text-green-700 hover:underline"
                    data-testid="link-forgot-password"
                  >
                    Forgot your password?
                  </a>
                </div>
              </form>
              
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <a href="/register" className="text-green-600 hover:text-green-700 font-medium">
                  Register here
                </a>
              </div>
              

            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    placeholder="Enter admin email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isAdminLoading}>
                  {isAdminLoading ? "Signing in..." : "Staff Login"}
                </Button>
              </form>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-800 font-medium mb-1">Staff Access:</p>
                <div className="text-xs text-gray-700">
                  <p>For Cape NatureX Organic team members only</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </CardContent>
        </Card>
      </div>
      
      {/* Footer at the bottom - hidden on mobile to prevent overlap */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}