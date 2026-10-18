import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, MessageSquare, FileText, ShoppingCart, User, Building, Phone, Mail, MapPin, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CustomerProfile() {
  const { customer, isCustomerAuthenticated, loginCustomer, logoutCustomer } = useCustomerAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    industryType: "",
  });

  useEffect(() => {
    if (!customer) return;
    setProfileForm({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      companyName: customer.companyName || "",
      phoneNumber: customer.phoneNumber || "",
      streetAddress: customer.streetAddress || "",
      city: customer.city || "",
      state: customer.state || "",
      postalCode: customer.postalCode || "",
      country: customer.country || "",
      industryType: customer.industryType || "",
    });
  }, [customer]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/customer/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Could not save profile");
      return result.user;
    },
    onSuccess: (updatedCustomer) => {
      loginCustomer(updatedCustomer);
      setEditing(false);
      toast({ title: "Profile updated", description: "Your account details have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
    },
  });

  if (!isCustomerAuthenticated || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Customer Access Required</CardTitle>
              <CardDescription>Please log in to view your profile</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.href = '/login'} className="min-h-[44px]" data-testid="button-go-to-login">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Welcome, {customer.firstName} {customer.lastName}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your profile and explore our premium organic ingredients
          </p>
        </div>

        {/* Customer Profile Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-5 h-5" />
                  Customer Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <form
                  className="space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    profileMutation.mutate();
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {([
                      ["firstName", "First name"],
                      ["lastName", "Last name"],
                      ["companyName", "Company"],
                      ["phoneNumber", "Phone number"],
                      ["streetAddress", "Street address"],
                      ["city", "City"],
                      ["state", "State / Province"],
                      ["postalCode", "Postal code"],
                      ["country", "Country"],
                      ["industryType", "Industry"],
                    ] as const).map(([field, label]) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`customer-profile-${field}`}>{label}</Label>
                        <Input
                          id={`customer-profile-${field}`}
                          value={profileForm[field]}
                          disabled={!editing || profileMutation.isPending}
                          required={["firstName", "lastName", "companyName"].includes(field)}
                          onChange={(event) => setProfileForm({ ...profileForm, [field]: event.target.value })}
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label>Email address</Label>
                      <Input value={customer.email} disabled />
                      <p className="text-xs text-gray-500">Contact support to change your sign-in email.</p>
                    </div>
                  </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Account Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {customer.accountStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <p className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                  <div className="flex justify-end gap-2">
                    {editing ? (
                      <>
                        <Button type="button" variant="outline" onClick={() => {
                          setProfileForm({
                            firstName: customer.firstName || "",
                            lastName: customer.lastName || "",
                            companyName: customer.companyName || "",
                            phoneNumber: customer.phoneNumber || "",
                            streetAddress: customer.streetAddress || "",
                            city: customer.city || "",
                            state: customer.state || "",
                            postalCode: customer.postalCode || "",
                            country: customer.country || "",
                            industryType: customer.industryType || "",
                          });
                          setEditing(false);
                        }}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={profileMutation.isPending}>
                          {profileMutation.isPending ? "Saving…" : "Save changes"}
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setEditing(true)}>Edit profile</Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start min-h-[44px]" variant="outline" data-testid="button-browse-products" onClick={() => setLocation('/customer/products')}>
                  <Package className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
                <Button className="w-full justify-start min-h-[44px]" variant="outline" data-testid="button-submit-inquiry" onClick={() => setLocation('/customer/inquiries')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Inquiry
                </Button>
                <Button className="w-full justify-start min-h-[44px]" variant="outline" data-testid="button-download-catalog" onClick={() => setLocation('/customer/catalogs')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download Catalog
                </Button>
                <Button className="w-full justify-start min-h-[44px]" variant="outline" data-testid="button-request-quote" onClick={() => setLocation('/customer/inquiries')}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Request Quote
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px]"
                  onClick={() => setLocation('/products')}
                  data-testid="button-explore-products"
                >
                  Explore Products
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full min-h-[44px]"
                  onClick={() => {
                    logoutCustomer();
                    setLocation('/');
                  }}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-sm">Your recent interactions with Atlas Ingredients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-base sm:text-lg">No recent activity to display</p>
              <p className="text-sm">Start exploring our products to see your activity here</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}