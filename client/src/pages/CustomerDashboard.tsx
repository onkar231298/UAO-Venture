import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CustomerSidebar from "@/components/CustomerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Heart, MessageSquare, FileText, Package, TrendingUp, Eye, Clock, User, Building, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CustomerDashboard() {
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [location] = useLocation();

  // Data fetching for customer-specific data
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: [`/api/customer/inquiries/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id
  });

  const { data: savedProducts, isLoading: savedLoading } = useQuery({
    queryKey: [`/api/customer/saved-products/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id
  });

  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: [`/api/customer/quotations/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id
  });

  const { data: sampleRequests, isLoading: sampleRequestsLoading } = useQuery({
    queryKey: [`/api/customer/sample-requests/${customer?.id}`],
    enabled: isCustomerAuthenticated && !!customer?.id
  });

  if (!isCustomerAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Please login to access your dashboard.</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'border-red-500 text-red-700';
      case 'high': return 'border-orange-500 text-orange-700';
      case 'normal': return 'border-yellow-500 text-yellow-700';
      case 'low': return 'border-gray-500 text-gray-700';
      default: return 'border-gray-500 text-gray-700';
    }
  };

  // Function to render the main content based on the current route
  const renderMainContent = () => {
    const path = location.replace('/customer/', '');
    
    switch (path) {
      case 'dashboard':
        return renderDashboardOverview();
      case 'inquiries':
        return renderInquiries();
      case 'saved':
        return renderSavedProducts();
      case 'quotes':
        return renderQuotations();
      case 'downloads':
        return renderDownloads();
      case 'catalogs':
        return renderCatalogs();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboardOverview();
    }
  };

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, {customer?.firstName} {customer?.lastName}</p>
        <p className="text-sm text-gray-500">{customer?.companyName}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{inquiries?.total || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved Products</p>
                <p className="text-2xl font-bold text-gray-900">{savedProducts?.length || 0}</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{quotations?.length || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sample Requests</p>
                <p className="text-2xl font-bold text-gray-900">{sampleRequests?.length || 0}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest inquiries and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries?.inquiries && inquiries.inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.inquiries.slice(0, 3).map((inquiry: any) => (
                <div key={inquiry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{inquiry.inquiryId}</p>
                      <p className="text-sm text-gray-500">{inquiry.productName}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(inquiry.status)}`}>
                    {inquiry.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderInquiries = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Inquiries</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Inquiry
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by product, inquiry ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            My Inquiries
          </CardTitle>
          <CardDescription>Track your product inquiries and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {inquiriesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
              ))}
            </div>
          ) : inquiries?.inquiries && inquiries.inquiries.length ? (
            <div className="space-y-4">
              {inquiries.inquiries.map((inquiry: any) => (
                <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg">{inquiry.inquiryId}</span>
                        <Badge className={getStatusColor(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                        <Badge variant="outline" className={getUrgencyColor(inquiry.urgency)}>
                          {inquiry.urgency}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Product:</span> {inquiry.productName}
                        </div>
                        <div>
                          <span className="font-medium">Quantity:</span> {inquiry.quantity} {inquiry.unit}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {inquiry.inquiryType}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          <span>{formatDistanceToNow(new Date(inquiry.createdAt))} ago</span>
                        </div>
                      </div>
                      {inquiry.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Message:</span> {inquiry.message}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No inquiries found</p>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Submit Your First Inquiry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSavedProducts = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Saved Products</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Saved Products
          </CardTitle>
          <CardDescription>Products you've saved for later reference</CardDescription>
        </CardHeader>
        <CardContent>
          {savedLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
              ))}
            </div>
          ) : savedProducts && savedProducts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProducts.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-lg font-bold">${product.price}</span>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No saved products yet</p>
              <Button className="mt-4">Browse Products</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderQuotations = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Quotations</h1>
      
      {/* Quotation Process Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TrendingUp className="w-5 h-5" />
            How the Quotation Process Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">1. Submit Inquiry</h3>
              <p className="text-xs mt-1">You submit a product inquiry with quantity and requirements</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">2. Sales Review</h3>
              <p className="text-xs mt-1">Our sales team reviews your inquiry and prepares a detailed quotation</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">3. Quotation Sent</h3>
              <p className="text-xs mt-1">You receive a formal quotation with pricing, terms, and validity period</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">4. Place Order</h3>
              <p className="text-xs mt-1">Accept the quotation to proceed with your order</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm font-medium">💡 Pro Tip:</p>
            <p className="text-xs mt-1">All quotations include multi-currency pricing (USD, EUR, GBP, INR, etc.) and international trade terms (Ex-Warehouse, FOB, CIF, DDP) for global compliance.</p>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Status Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="w-5 h-5" />
            Quotation Status Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
              <span className="text-sm">Being prepared by sales team</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
              <span className="text-sm">Quotation sent to you for review</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Accepted</Badge>
              <span className="text-sm">You've accepted, ready for order</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">Expired</Badge>
              <span className="text-sm">Validity period has ended</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Quotations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Quotations
          </CardTitle>
          <CardDescription>View and manage your quotation requests</CardDescription>
        </CardHeader>
        <CardContent>
          {quotationsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
              ))}
            </div>
          ) : quotations && quotations.quotations && quotations.quotations.length ? (
            <div className="space-y-4">
              {quotations.quotations.map((quotation: any) => (
                <div key={quotation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{quotation.quotationId}</h3>
                        <Badge className={getStatusColor(quotation.status)}>
                          {quotation.status}
                        </Badge>
                        {quotation.currency && (
                          <Badge variant="outline" className="text-xs">
                            {quotation.currency}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Amount:</span> 
                          <span className="ml-1 text-lg font-bold text-green-600">
                            {quotation.currency || 'USD'} {quotation.totalAmount}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Price Type:</span> 
                          <span className="ml-1 capitalize">{quotation.priceType?.replace('_', ' ') || 'Ex-Warehouse'}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          <span>
                            Valid until: {quotation.validUntil ? 
                              new Date(quotation.validUntil).toLocaleDateString() : 
                              'Not specified'
                            }
                          </span>
                        </div>
                      </div>
                      {quotation.terms && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Terms & Conditions:</span>
                          <p className="mt-1 whitespace-pre-line">{quotation.terms}</p>
                        </div>
                      )}
                      {quotation.notes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium">Notes:</span> {quotation.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {quotation.status === 'sent' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Package className="w-4 h-4 mr-1" />
                          Accept Quote
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No quotations found</p>
              <p className="text-xs text-gray-400 mb-4">
                Submit an inquiry to receive your first quotation
              </p>
              <Button onClick={() => setLocation('/customer/inquiries')}>
                <Plus className="w-4 h-4 mr-2" />
                Submit New Inquiry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderDownloads = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Downloads</h1>
      <Card>
        <CardHeader>
          <CardTitle>Available Downloads</CardTitle>
          <CardDescription>Access your certificates, specifications and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No downloads available yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCatalogs = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Product Catalogs</h1>
      <Card>
        <CardHeader>
          <CardTitle>Available Catalogs</CardTitle>
          <CardDescription>Browse our latest product catalogs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No catalogs available yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Manage your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">First Name</label>
                <p className="text-lg">{customer?.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Name</label>
                <p className="text-lg">{customer?.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-lg">{customer?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Company</label>
                <p className="text-lg">{customer?.companyName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <CustomerSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Render main content based on route */}
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}