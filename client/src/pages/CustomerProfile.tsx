import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MessageSquare, FileText, ShoppingCart, User, Building, Phone, Mail, MapPin, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useLocation } from "wouter";

export default function CustomerProfile() {
  const { customer, isCustomerAuthenticated, logoutCustomer } = useCustomerAuth();
  const [, setLocation] = useLocation();

  if (!isCustomerAuthenticated || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Customer Access Required</CardTitle>
              <CardDescription>Please log in to view your profile</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.href = '/login'}>
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {customer.firstName} {customer.lastName}!
          </h1>
          <p className="text-gray-600">
            Manage your profile and explore our premium organic ingredients
          </p>
        </div>

        {/* Customer Profile Info */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-lg font-semibold">{customer.firstName} {customer.lastName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {customer.email}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {customer.phoneNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        {customer.companyName}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Country</label>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {customer.country}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Industry</label>
                      <p>{customer.industryType}</p>
                    </div>
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
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Inquiry
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Catalog
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Request Quote
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation('/products')}
                >
                  Explore Products
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    logoutCustomer();
                    setLocation('/');
                  }}
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent interactions with BFI Organic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity to display</p>
              <p className="text-sm">Start exploring our products to see your activity here</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}