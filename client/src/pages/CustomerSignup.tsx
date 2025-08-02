import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Leaf, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { CURRENCIES } from '@/lib/currencyUtils';
import Footer from '@/components/Footer';

// Customer signup form schema
const customerSignupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  companyName: z.string().min(2, 'Company name is required'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(10, 'Please enter your complete address'),
  // Location fields for pricing
  country: z.string().min(2, 'Please select your country'),
  // Currency and timezone are automatically set based on country
  currency: z.string().optional(),
  timezone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

type CustomerSignupForm = z.infer<typeof customerSignupSchema>;

// Common countries with their currencies
const COUNTRIES_WITH_CURRENCIES = [
  { name: 'United States', code: 'US', currency: 'USD', timezone: 'America/New_York' },
  { name: 'India', code: 'IN', currency: 'INR', timezone: 'Asia/Kolkata' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', timezone: 'Europe/London' },
  { name: 'Germany', code: 'DE', currency: 'EUR', timezone: 'Europe/Berlin' },
  { name: 'France', code: 'FR', currency: 'EUR', timezone: 'Europe/Paris' },
  { name: 'Canada', code: 'CA', currency: 'CAD', timezone: 'America/Toronto' },
  { name: 'Australia', code: 'AU', currency: 'AUD', timezone: 'Australia/Sydney' },
  { name: 'Japan', code: 'JP', currency: 'JPY', timezone: 'Asia/Tokyo' },
  { name: 'China', code: 'CN', currency: 'CNY', timezone: 'Asia/Shanghai' },
  { name: 'Brazil', code: 'BR', currency: 'BRL', timezone: 'America/Sao_Paulo' },
  { name: 'Mexico', code: 'MX', currency: 'MXN', timezone: 'America/Mexico_City' },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', timezone: 'Africa/Johannesburg' },
  { name: 'Netherlands', code: 'NL', currency: 'EUR', timezone: 'Europe/Amsterdam' },
  { name: 'Italy', code: 'IT', currency: 'EUR', timezone: 'Europe/Rome' },
  { name: 'Spain', code: 'ES', currency: 'EUR', timezone: 'Europe/Madrid' },
  { name: 'Switzerland', code: 'CH', currency: 'CHF', timezone: 'Europe/Zurich' },
  { name: 'Singapore', code: 'SG', currency: 'SGD', timezone: 'Asia/Singapore' },
  { name: 'South Korea', code: 'KR', currency: 'KRW', timezone: 'Asia/Seoul' },
  { name: 'UAE', code: 'AE', currency: 'AED', timezone: 'Asia/Dubai' },
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', timezone: 'Asia/Riyadh' },
];

export default function CustomerSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CustomerSignupForm>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      phoneNumber: '',
      address: '',
      country: '',
      currency: '',
      timezone: '',
    },
  });

  // Auto-set currency and timezone when country is selected
  const handleCountryChange = (countryName: string) => {
    const country = COUNTRIES_WITH_CURRENCIES.find(c => c.name === countryName);
    if (country) {
      form.setValue('currency', country.currency);
      form.setValue('timezone', country.timezone);
    }
  };

  const onSubmit = async (data: CustomerSignupForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiRequest('/api/customer/signup', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setSuccess(true);
      form.reset();
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-yellow-400 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white text-2xl" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Account Created!</CardTitle>
            <CardDescription>
              Welcome to BFI Organic! Your account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You can now sign in to view our products with pricing customized for your location.
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-yellow-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="text-white text-2xl" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Create Customer Account</CardTitle>
          <CardDescription>
            Join BFI Organic to access our premium organic products with location-based pricing
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
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
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a strong password" {...field} />
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

              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your company name" {...field} />
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
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your complete business address including city, state/province, and postal code"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Information for Pricing */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Information</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This information helps us show you accurate pricing and shipping costs for your region.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleCountryChange(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRIES_WITH_CURRENCIES.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>Currency:</strong> {form.watch('currency') || 'Will be set based on country'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Your currency and timezone are automatically determined by your selected country for accurate pricing.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => window.location.href = '/login'}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign In Here
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
}