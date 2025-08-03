import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Eye, DollarSign, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function CustomerQuotes() {
  const { customer, isCustomerAuthenticated } = useCustomerAuth();
  const [, setLocation] = useLocation();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: [`/api/customer/quotations/${customer?.id}`],
    enabled: !!customer?.id,
  });

  if (!isCustomerAuthenticated || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Customer Access Required</CardTitle>
              <CardDescription>Please log in to view your quotations</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setLocation('/login')}>
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
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">My Quotations</h1>
          </div>

          {isLoading ? (
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
          ) : quotations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations yet</h3>
                <p className="text-gray-600 mb-4">
                  Request quotes for products and they will appear here.
                </p>
                <Button onClick={() => setLocation('/products')}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation: any) => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Quote #{quotation.quotationId}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {quotation.productName || 'Product Quotation'}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(quotation.status || 'pending')}>
                        {quotation.status || 'pending'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Quantity</p>
                        <p className="font-medium">{quotation.quantity} {quotation.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Price</p>
                        <p className="font-medium">
                          {quotation.totalPrice ? `$${quotation.totalPrice}` : 'Pending'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Valid Until</p>
                        <p className="font-medium">
                          {quotation.validUntil ? formatDistanceToNow(new Date(quotation.validUntil), { addSuffix: true }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Actions</p>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-8">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {quotation.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{quotation.notes}</p>
                      </div>
                    )}

                    {quotation.status === 'sent' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Accept Quote
                        </Button>
                        <Button variant="outline" size="sm">
                          Reject Quote
                        </Button>
                        <Button variant="outline" size="sm">
                          Request Changes
                        </Button>
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