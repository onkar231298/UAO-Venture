import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, EyeOff, Lock, Mail, User, Building2, Phone, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  captchaToken: z.string().min(1, "Please complete the captcha verification"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  captchaToken: z.string().min(1, "Please complete the captcha verification"),
});

// Simple captcha component (you can replace with reCAPTCHA or hCaptcha)
function SimpleCaptcha({ onVerify }: { onVerify: (token: string) => void }) {
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaChallenge, setCaptchaChallenge] = useState("");
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let result;
    switch (operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = Math.abs(num1 - num2);
        break;
      case '*':
        result = num1 * num2;
        break;
      default:
        result = num1 + num2;
    }
    
    setCaptchaChallenge(`${num1} ${operator} ${num2} = ?`);
    setCaptchaValue(result.toString());
  };

  const handleInputChange = (value: string) => {
    setUserInput(value);
    if (value === captchaValue) {
      onVerify(`captcha_${Date.now()}`);
    } else {
      onVerify("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">Security Verification</Label>
      <div className="flex items-center space-x-2">
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-lg font-bold">
          {captchaChallenge}
        </div>
        <Input
          id="captcha"
          type="text"
          placeholder="Enter answer"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-24"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            generateCaptcha();
            setUserInput("");
            onVerify("");
          }}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginCaptchaToken, setLoginCaptchaToken] = useState("");
  const [registerCaptchaToken, setRegisterCaptchaToken] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      setLoading(true);
      
      const loginData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        captchaToken: loginCaptchaToken,
      };

      // Validate input
      loginSchema.parse(loginData);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Login successful", description: "Welcome back!" });
        setLocation("/");
      } else {
        toast({
          title: "Login failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      setLoading(true);
      
      const registerData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        companyName: formData.get("companyName") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        captchaToken: registerCaptchaToken,
      };

      // Validate input
      registerSchema.parse(registerData);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ 
          title: "Registration successful", 
          description: result.message || "Please check your email for verification." 
        });
        setActiveTab("login");
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "Registration failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero content */}
        <div className="hidden lg:block space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Welcome to <span className="text-green-600">BFI Organic</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your trusted partner for premium organic ingredients and natural products.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Certified organic products</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Secure authentication & data protection</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">B2B wholesale solutions</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Account Access</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to access our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <SimpleCaptcha onVerify={setLoginCaptchaToken} />

                  <Button type="submit" className="w-full" disabled={loading || !loginCaptchaToken}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="John"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Must contain uppercase, lowercase, number, and special character
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name (Optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="Your company name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <SimpleCaptcha onVerify={setRegisterCaptchaToken} />

                  <Button type="submit" className="w-full" disabled={loading || !registerCaptchaToken}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}