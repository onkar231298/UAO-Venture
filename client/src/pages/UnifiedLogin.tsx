import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Leaf, AlertCircle } from "lucide-react";

export default function UnifiedLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // First try admin login if it looks like admin credentials
    if (formData.email === "admin@bfiorganic.com" || formData.email.includes("admin")) {
      try {
        const response = await fetch("/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(formData),
          credentials: 'include', // Include cookies for session
          redirect: 'manual' // Don't auto-follow redirects
        });

        // Debug logging
        console.log("Response status:", response.status);
        console.log("Response type:", response.type);
        
        // Check if the response is a redirect
        if (response.status === 302) {
          const location = response.headers.get('location');
          console.log("Redirect location:", location);
          if (location && location.includes('/admin/dashboard')) {
            // Success - redirect to dashboard
            console.log("Admin login successful, redirecting...");
            window.location.href = "/admin/dashboard";
            return;
          } else {
            // Failed - redirect contains error
            console.log("Admin login failed, got redirect to:", location);
            setError("Invalid admin credentials. Please try again.");
            setIsLoading(false);
            return;
          }
        } else if (response.status === 200) {
          // Also check for successful response
          console.log("Got 200 response, redirecting to dashboard");
          window.location.href = "/admin/dashboard";
          return;
        } else {
          console.log("Unexpected response status:", response.status);
          setError(`Login failed with status: ${response.status}`);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setError("Invalid admin credentials. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    // If not admin email, redirect to Replit OAuth for customer login
    if (!formData.email.includes("admin")) {
      window.location.href = "/api/login";
      return;
    }

    setError("Invalid credentials. Please check your email and password.");
    setIsLoading(false);
  };

  const handleReplitLogin = () => {
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
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Email/Password Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          {/* Replit OAuth Login */}
          <Button 
            onClick={handleReplitLogin}
            variant="outline"
            className="w-full"
          >
            Continue with Replit
          </Button>
          
          {/* Admin Credentials Helper */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-700 mb-1">Admin Login:</p>
            <p className="text-xs text-blue-600">admin@bfiorganic.com / BFIAdmin2024!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}