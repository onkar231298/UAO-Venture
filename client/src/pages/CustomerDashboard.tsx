import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Heart, MessageSquare, FileText, Package, TrendingUp, Eye, Clock, User, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CustomerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Data fetching for customer-specific data
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: [`/api/customer/inquiries/${user?.id}`],
    enabled: !authLoading && !!user?.id && (user as any)?.userType === 'customer'
  });

  const { data: savedProducts, isLoading: savedLoading } = useQuery({
    queryKey: [`/api/customer/saved-products/${user?.id}`],
    enabled: !authLoading && !!user?.id && (user as any)?.userType === 'customer'
  });

  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: [`/api/customer/quotations/${user?.id}`],
    enabled: !authLoading && !!user?.id && (user as any)?.userType === 'customer'
  });

  const { data: sampleRequests, isLoading: sampleRequestsLoading } = useQuery({
    queryKey: [`/api/customer/sample-requests/${user?.id}`],
    enabled: !authLoading && !!user?.id && (user as any)?.userType === 'customer'
  });

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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

  return (
    <RoleBasedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
            <p className="text-gray-600">Welcome back, {(user as any)?.firstName} {(user as any)?.lastName}</p>
            <p className="text-sm text-gray-500">{(user as any)?.companyName}</p>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by product, inquiry ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horizontal Tabs Layout */}
          <Tabs defaultValue="my-inquiries" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="my-inquiries">My Inquiries</TabsTrigger>
              <TabsTrigger value="saved-products">Saved Products</TabsTrigger>
              <TabsTrigger value="my-quotations">My Quotations</TabsTrigger>
              <TabsTrigger value="sample-requests">Sample Requests</TabsTrigger>
            </TabsList>

            {/* My Inquiries Tab */}
            <TabsContent value="my-inquiries" className="mt-6">
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
                  ) : inquiries && (inquiries as any).inquiries?.length ? (
                    <div className="space-y-4">
                      {(inquiries as any).inquiries.map((inquiry: any) => (
                        <div key={inquiry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{inquiry.inquiryId}</span>
                              <Badge className={getStatusColor(inquiry.status)}>
                                {inquiry.status}
                              </Badge>
                              <Badge variant="outline" className={getUrgencyColor(inquiry.urgency)}>
                                {inquiry.urgency}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Product:</span>
                              <p className="font-medium">{inquiry.productName}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <p className="font-medium">{inquiry.quantity} {inquiry.unit}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <p className="font-medium capitalize">{inquiry.inquiryType?.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {inquiry.message && (
                            <div className="mt-2">
                              <span className="text-gray-600 text-sm">Message:</span>
                              <p className="text-sm mt-1">{inquiry.message}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries yet</h3>
                      <p className="text-gray-600">Your product inquiries will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Saved Products Tab */}
            <TabsContent value="saved-products" className="mt-6">
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-48 rounded"></div>
                      ))}
                    </div>
                  ) : savedProducts && (savedProducts as any).length ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(savedProducts as any).map((product: any) => (
                        <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3"></div>
                          <h3 className="font-medium mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{product.productId}</span>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved products yet</h3>
                      <p className="text-gray-600">Save products to your wishlist for quick access later</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Quotations Tab */}
            <TabsContent value="my-quotations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    My Quotations
                  </CardTitle>
                  <CardDescription>Quotations received for your inquiries</CardDescription>
                </CardHeader>
                <CardContent>
                  {quotationsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-20 rounded"></div>
                      ))}
                    </div>
                  ) : quotations && (quotations as any).quotations?.length ? (
                    <div className="space-y-4">
                      {(quotations as any).quotations.map((quotation: any) => (
                        <div key={quotation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">QUO-{quotation.id}</span>
                              <Badge className={getStatusColor(quotation.status)}>
                                {quotation.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(quotation.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Product:</span>
                              <p className="font-medium">{quotation.productName}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <p className="font-medium">{quotation.quantity} {quotation.unit}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Price:</span>
                              <p className="font-medium">${quotation.unitPrice} per {quotation.unit}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotations yet</h3>
                      <p className="text-gray-600">Quotations for your inquiries will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sample Requests Tab */}
            <TabsContent value="sample-requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Sample Requests
                  </CardTitle>
                  <CardDescription>Track your product sample requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {sampleRequestsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                      ))}
                    </div>
                  ) : sampleRequests && (sampleRequests as any).requests?.length ? (
                    <div className="space-y-4">
                      {(sampleRequests as any).requests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">SAM-{request.id}</span>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Product:</span>
                              <p className="font-medium">{request.productName}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Sample Type:</span>
                              <p className="font-medium capitalize">{request.sampleType}</p>
                            </div>
                          </div>
                          {request.notes && (
                            <div className="mt-2">
                              <span className="text-gray-600 text-sm">Notes:</span>
                              <p className="text-sm mt-1">{request.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No sample requests yet</h3>
                      <p className="text-gray-600">Your product sample requests will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleBasedRoute>
  );
}