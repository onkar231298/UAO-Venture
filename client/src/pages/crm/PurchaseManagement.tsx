import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  DollarSign,
  Truck
} from "lucide-react";
import type { PurchaseOrder } from "@shared/schema";

export default function PurchaseManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: purchaseOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/purchase-orders", { status: statusFilter }],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      received: { variant: "default", label: "Received" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = statusMap[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'purchase_manager', 'purchase_executive']}>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Management</h1>
            <p className="text-gray-600">Manage vendors, purchase orders, and inventory procurement</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active POs</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vendors</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Receipts</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Spend</p>
                    <p className="text-2xl font-bold">$125K</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search purchase orders, vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Purchase Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Purchase Orders</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Purchase Order
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                      ))}
                    </div>
                  ) : purchaseOrders?.orders?.length ? (
                    <div className="space-y-4">
                      {purchaseOrders.orders.map((order: PurchaseOrder) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{order.poId}</span>
                              {getStatusBadge(order.status || 'pending')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Vendor:</span>
                              <p className="font-medium">{order.vendorId}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <p className="font-medium">${order.totalAmount}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Expected Delivery:</span>
                              <p className="font-medium">
                                {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'TBD'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Order Date:</span>
                              <p className="font-medium">{new Date(order.orderDate!).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
                      <p className="text-gray-600">Create your first purchase order to get started</p>
                      <Button className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Purchase Order
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vendors Tab */}
            <TabsContent value="vendors" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Vendor Management</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Vendor
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor management</h3>
                    <p className="text-gray-600">Manage your supplier network and vendor relationships</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Purchase Requests Tab */}
            <TabsContent value="requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Purchase Requests</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase requests</h3>
                    <p className="text-gray-600">Track and approve purchase requests from various departments</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Analytics</h3>
                      <p className="text-gray-600">View spending trends and vendor performance metrics</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Vendor Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Performance</h3>
                      <p className="text-gray-600">Track delivery times, quality scores, and compliance</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleBasedRoute>
  );
}
