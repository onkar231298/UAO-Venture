import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import ProductCatalog from "@/components/ProductCatalog";
import Dashboard from "@/pages/Dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MessageSquare, FileText, ShoppingCart, BarChart3, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { user } = useAuth() as { user: any };

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // For customers, show product catalog
  if (user?.role === 'customer') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName || 'Valued Customer'}!
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
                <h3 className="font-semibold mb-1">Documents</h3>
                <p className="text-sm text-gray-600 mb-3">Download COAs & certificates</p>
                <Button size="sm" variant="outline">View</Button>
              </CardContent>
            </Card>
          </div>

          <ProductCatalog />
        </div>
      </div>
    );
  }

  // For internal users, show role-based dashboard
  return <Dashboard />;
}
