import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import ProductCatalog from "@/components/ProductCatalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MessageSquare, FileText, ShoppingCart, BarChart3, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated or not a customer
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        window.location.href = "/api/login";
        return;
      }
      
      if ((user as any).role !== 'customer') {
        toast({
          title: "Access Denied",
          description: "Customer access required.",
          variant: "destructive",
        });
        window.location.reload();
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {(user as any).firstName || 'Valued Customer'}!
          </h1>
          <p className="text-gray-600">
            Discover our premium organic ingredients and manage your orders
          </p>
        </div>

        {/* Customer Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">My Inquiries</h3>
              <p className="text-sm text-gray-600 mb-3">Track your product inquiries</p>
              <Button size="sm" variant="outline">View</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Quotations</h3>
              <p className="text-sm text-gray-600 mb-3">View your price quotes</p>
              <Button size="sm" variant="outline">View</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <ShoppingCart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Orders</h3>
              <p className="text-sm text-gray-600 mb-3">Track your orders</p>
              <Button size="sm" variant="outline">View</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Products</h3>
              <p className="text-sm text-gray-600 mb-3">Browse our catalog</p>
              <Button size="sm" variant="outline">Browse</Button>
            </CardContent>
          </Card>
        </div>

        {/* Product Catalog */}
        <ProductCatalog />
      </div>
    </div>
  );
}