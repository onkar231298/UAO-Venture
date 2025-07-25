import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, AlertCircle, Users, Shield } from "lucide-react";

export default function Login() {
  const [adminFormData, setAdminFormData] = useState({
    email: "admin@bfiorganic.com",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(adminFormData),
      });

      if (response.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        setError("Invalid admin credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-yellow-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="text-white text-2xl" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">BFI ORGANIC</CardTitle>
          <CardDescription>Login to Your Account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Customer</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Login with your Replit account to access customer features
                </p>
                <Button 
                  onClick={handleCustomerLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue with Replit
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminFormData.email}
                    onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Login as Admin"}
                </Button>
              </form>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-xs text-blue-900 mb-1">Admin Credentials:</h4>
                <p className="text-xs text-blue-700">Email: admin@bfiorganic.com</p>
                <p className="text-xs text-blue-700">Password: BFIAdmin2024!</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}