import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MessageSquare, 
  FileText, 
  ShoppingCart, 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Heart,
  Download,
  TrendingUp,
  Clock,
  Search,
  Filter
} from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import CustomerSidebar from "@/components/CustomerSidebar";

export default function CustomerDashboard() {
  const { customer, isCustomerAuthenticated, logoutCustomer } = useCustomerAuth();
  const [, setLocation] = useLocation();

  // Fetch customer's inquiries
  const { data: inquiriesData } = useQuery({
    queryKey: ["/api/customer/inquiries", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return { inquiries: [], total: 0 };
      try {
        const response = await fetch(`/api/customer/inquiries/${customer.id}`);
        if (!response.ok) return { inquiries: [], total: 0 };
        const data = await response.json();
        return Array.isArray(data) ? { inquiries: data, total: data.length } : data;
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        return { inquiries: [], total: 0 };
      }
    },
    enabled: !!customer?.id,
  });

  // Fetch customer's sample requests
  const { data: sampleRequestsData } = useQuery({
    queryKey: ["/api/customer/sample-requests", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return { requests: [], total: 0 };
      try {
        const response = await fetch(`/api/customer/sample-requests/${customer.id}`);
        if (!response.ok) return { requests: [], total: 0 };
        const data = await response.json();
        return Array.isArray(data) ? { requests: data, total: data.length } : data;
      } catch (error) {
        console.error('Error fetching sample requests:', error);
        return { requests: [], total: 0 };
      }
    },
    enabled: !!customer?.id,
  });

  // Fetch customer's quotations
  const { data: quotationsData } = useQuery({
    queryKey: ["/api/customer/quotations", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return { quotations: [], total: 0 };
      try {
        const response = await fetch(`/api/customer/quotations/${customer.id}`);
        if (!response.ok) return { quotations: [], total: 0 };
        const data = await response.json();
        return Array.isArray(data) ? { quotations: data, total: data.length } : data;
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return { quotations: [], total: 0 };
      }
    },
    enabled: !!customer?.id,
  });

  // Fetch popular products for recommendations
  const { data: productsData } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", "popular"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products?limit=6&sort=popular');
        if (!response.ok) return { products: [], total: 0 };
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching products:', error);
        return { products: [], total: 0 };
      }
    },
  });

  if (!isCustomerAuthenticated || !customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Customer Access Required</CardTitle>
            <CardDescription>Please log in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Customer Sidebar */}
      <CustomerSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Dashboard Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {customer.firstName}!
                </h1>
                <p className="text-gray-600">Manage your organic ingredient needs</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/products')}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Dashboard Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900">{inquiriesData?.total || 0}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sample Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{sampleRequestsData?.total || 0}</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Quotations</p>
                    <p className="text-2xl font-bold text-gray-900">{quotationsData?.total || 0}</p>
                  </div>
                  <Download className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Status</p>
                    <Badge className="bg-green-100 text-green-700">
                      {customer.accountStatus}
                    </Badge>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Quick Actions & Products */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Start exploring our premium organic ingredients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button 
                      className="h-auto p-4 justify-start" 
                      variant="outline"
                      onClick={() => setLocation('/products')}
                    >
                      <div className="flex items-center space-x-3">
                        <Package className="w-6 h-6 text-green-600" />
                        <div className="text-left">
                          <div className="font-semibold">Browse Products</div>
                          <div className="text-sm text-gray-500">Explore our ingredient catalog</div>
                        </div>
                      </div>
                    </Button>

                    <Button 
                      className="h-auto p-4 justify-start" 
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement inquiry form
                        alert('Inquiry form coming soon!');
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                        <div className="text-left">
                          <div className="font-semibold">Submit Inquiry</div>
                          <div className="text-sm text-gray-500">Get product information</div>
                        </div>
                      </div>
                    </Button>

                    <Button 
                      className="h-auto p-4 justify-start" 
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement catalog download
                        alert('Catalog download coming soon!');
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-purple-600" />
                        <div className="text-left">
                          <div className="font-semibold">Download Catalog</div>
                          <div className="text-sm text-gray-500">Get our complete product list</div>
                        </div>
                      </div>
                    </Button>

                    <Button 
                      className="h-auto p-4 justify-start" 
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement quote request
                        alert('Quote request coming soon!');
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <ShoppingCart className="w-6 h-6 text-orange-600" />
                        <div className="text-left">
                          <div className="font-semibold">Request Quote</div>
                          <div className="text-sm text-gray-500">Get pricing for bulk orders</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Products</CardTitle>
                  <CardDescription>Popular organic ingredients from our catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  {productsData?.products && productsData.products.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {productsData.products.slice(0, 4).map((product) => (
                        <div 
                          key={product.id} 
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setLocation(`/product/${product.slug}`)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm line-clamp-2">{product.name}</h4>
                            <Badge variant="outline" className="text-xs ml-2">
                              {product.origin}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{product.productId}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-green-600 font-semibold">${product.priceUSD}</span>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Loading product recommendations...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent interactions with BFI Organic</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                    <p className="text-sm">Start exploring products to see activity here</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Profile & Company Info */}
            <div className="space-y-6">
              {/* Customer Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="font-semibold">{customer.firstName} {customer.lastName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {customer.email}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {customer.phoneNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {customer.country}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation('/customer/profile')}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Company Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company Name</label>
                    <p className="font-semibold">{customer.companyName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Industry</label>
                    <p>{customer.industryType}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/products')}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Products
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/products?category=herbal-powders')}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Browse by Category
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/blog')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Read Our Blog
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}