import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { customerRegistrationSchema, type CustomerRegistration } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { CheckCircle, UserPlus, Building, Globe, Phone, Mail, Lock } from "lucide-react";

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
  'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'India', 'China', 'Brazil',
  'Mexico', 'Argentina', 'South Africa', 'Egypt', 'UAE', 'Saudi Arabia', 'Russia', 'Poland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria', 'Belgium', 'Portugal',
  'Ireland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Turkey', 'Israel',
  'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia', 'Taiwan', 'Hong Kong'
];

const industries = [
  'Food & Beverage', 'Nutraceuticals', 'Cosmetics & Personal Care', 'Pharmaceuticals',
  'Dietary Supplements', 'Herbal Medicine', 'Essential Oils', 'Animal Feed',
  'Agriculture', 'Research & Development', 'Trading & Distribution', 'Manufacturing',
  'Retail', 'E-commerce', 'Healthcare', 'Wellness', 'Other'
];

export default function CustomerRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);

  const form = useForm<CustomerRegistration>({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      country: "",
      industryType: "",
      password: "",
      captchaToken: "",
    },
  });

  // Load reCAPTCHA script
  const loadCaptcha = () => {
    if (window.grecaptcha || document.querySelector('script[src*="recaptcha"]')) {
      setCaptchaLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`;
    script.onload = () => setCaptchaLoaded(true);
    document.head.appendChild(script);
  };

  useState(() => {
    loadCaptcha();
  });

  const onSubmit = async (data: CustomerRegistration) => {
    setIsSubmitting(true);
    
    try {
      if (!captchaLoaded || !window.grecaptcha) {
        throw new Error("CAPTCHA not loaded. Please refresh the page and try again.");
      }

      // Get reCAPTCHA token
      const captchaToken = await window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, {
        action: 'customer_registration'
      });

      const registrationData = {
        ...data,
        captchaToken,
      };

      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Registration Successful!",
          description: "Your account has been created successfully. You can now log in.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Welcome to BFI Organic!</CardTitle>
            <CardDescription>
              Your account has been created successfully. You can now log in to explore our premium organic ingredients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setLocation('/login')} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue to Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')} 
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join BFI Organic</h1>
          <p className="text-gray-600">Create your account to access premium organic ingredients</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Registration</CardTitle>
            <CardDescription>
              Fill in your business details to get started with our B2B platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company Ltd." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Country *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {industries.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Account Security */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Account Security
                  </h3>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minimum 8 characters" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    disabled={isSubmitting || !captchaLoaded}
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                    Sign in here
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          This site is protected by reCAPTCHA and the Google{" "}
          <a href="https://policies.google.com/privacy" className="underline">Privacy Policy</a> and{" "}
          <a href="https://policies.google.com/terms" className="underline">Terms of Service</a> apply.
        </div>
      </div>
    </div>
  );
}