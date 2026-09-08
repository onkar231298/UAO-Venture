import { trackProjectEvent } from "@/lib/projectAnalytics";
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
import { CheckCircle, UserPlus, Building, Globe, Phone, Mail, Lock, Shield } from "lucide-react";
import { useReCAPTCHA } from "@/hooks/useReCAPTCHA";

// Customer registration form component

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
  const { executeReCaptcha, isReady } = useReCAPTCHA();

  const form = useForm<CustomerRegistration>({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      website: "",
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      industryType: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: CustomerRegistration) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    setIsSubmitting(true);
    
    try {
      // Get reCAPTCHA token
      let recaptchaToken = null;
      if (isReady) {
        try {
          recaptchaToken = await executeReCaptcha("registration");
          if (!recaptchaToken) {
            throw new Error("Failed to complete security verification. Please try again.");
          }
          console.log("reCAPTCHA token obtained successfully");
        } catch (error) {
          console.error("reCAPTCHA error:", error);
          throw new Error("Security verification failed. Please refresh the page and try again.");
        }
      } else {
        throw new Error("Security verification is not ready. Please wait a moment and try again.");
      }

      console.log("Sending registration data:", data);
      const response = await apiRequest('/api/auth/register-customer', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          recaptchaToken
        }),
      });

      if (response.ok) {
        trackProjectEvent("customer_registered");
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
            <CardTitle className="text-2xl text-green-700">Welcome to Bright Fame Organic!</CardTitle>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Bright Fame Organic</h1>
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
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Company Website
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="www.yourcompany.com" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business Street, Suite 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province *</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal/ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="industryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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

                {/* Account Security */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Account Security
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Security Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Verification
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {isReady ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Security verification is active and ready</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span>Loading security verification...</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This registration is protected by reCAPTCHA v3 and Google's Privacy Policy and Terms of Service apply.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    disabled={isSubmitting || !isReady}
                  >
                    {isSubmitting ? "Creating Account..." : !isReady ? "Loading Security..." : "Create Account"}
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
          By creating an account, you agree to our{" "}
          <a href="#" className="underline">Terms of Service</a> and{" "}
          <a href="#" className="underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}