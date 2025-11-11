import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Calendar, Package, Eye, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function CustomerInquiries() {
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const [, setLocation] = useLocation();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: [`/api/customer/inquiries/${customer?.id}`],
    enabled: !!customer?.id,
  });

  if (!isCustomerAuthenticated || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Customer Access Required</CardTitle>
              <CardDescription>Please log in to view your inquiries</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setLocation('/login')} className="min-h-[44px]" data-testid="button-go-to-login">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Inquiries</h1>
          </div>

          {isLoading || !inquiries ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !inquiries || !(inquiries as any).inquiries || (Array.isArray((inquiries as any).inquiries) && (inquiries as any).inquiries.length === 0) ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  You haven't submitted any product inquiries yet.
                </p>
                <Button onClick={() => setLocation('/products')} className="min-h-[44px]" data-testid="button-browse-products">
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(Array.isArray((inquiries as any).inquiries) ? (inquiries as any).inquiries : []).map((inquiry: any) => (
                <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {inquiry.productName || 'Product Inquiry'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            Inquiry ID: {inquiry.inquiryId}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(inquiry.status || 'pending')} shrink-0`}>
                        {inquiry.status || 'pending'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Quantity</p>
                        <p className="font-medium text-sm sm:text-base">{inquiry.quantity} {inquiry.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Urgency</p>
                        <p className="font-medium text-sm sm:text-base capitalize">{inquiry.urgency || 'normal'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Submitted</p>
                        <p className="font-medium text-sm sm:text-base">
                          {inquiry.createdAt ? formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true }) : 'Recently'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Actions</p>
                        <Button variant="outline" size="sm" className="min-h-[44px] w-full sm:w-auto" data-testid={`button-view-inquiry-${inquiry.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>

                    {inquiry.message && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 break-words">{inquiry.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}