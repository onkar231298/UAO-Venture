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
  Truck, 
  Package, 
  MapPin, 
  Clock,
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  BarChart3,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function LogisticsManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("shipments");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: salesOrders } = useQuery({
    queryKey: ["/api/sales-orders"],
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const getShipmentStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "Pending", icon: Clock },
      packed: { variant: "default", label: "Packed", icon: Package },
      shipped: { variant: "default", label: "Shipped", icon: Truck },
      delivered: { variant: "default", label: "Delivered", icon: CheckCircle },
      cancelled: { variant: "destructive", label: "Cancelled", icon: AlertCircle },
    };

    const config = statusMap[status] || { variant: "secondary", label: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  return (
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'logistics_manager', 'logistics_executive', 'inventory_manager', 'inventory_executive']}>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Logistics Management</h1>
            <p className="text-gray-600">Manage shipments, packing lists, and delivery tracking</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Shipments</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Transit</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Delivered Today</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">On-Time Delivery</p>
                    <p className="text-2xl font-bold">94%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
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
                    placeholder="Search orders, tracking numbers..."
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
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="shipments">Shipments</TabsTrigger>
              <TabsTrigger value="packing">Packing Lists</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Shipments Tab */}
            <TabsContent value="shipments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Active Shipments</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Shipment
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salesOrders?.orders?.length ? (
                    <div className="space-y-4">
                      {salesOrders.orders.slice(0, 10).map((order: any) => (
                        <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{order.orderId}</span>
                              {getShipmentStatusBadge(order.status || 'pending')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button size="sm">
                                <Package className="w-4 h-4 mr-1" />
                                Create Packing List
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Customer:</span>
                              <p className="font-medium">{order.customerId}</p>
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
                              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {order.shippingAddress && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600">Shipping Address:</span>
                              <p className="mt-1">{order.shippingAddress}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
                      <p className="text-gray-600">Orders ready for shipment will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packing Lists Tab */}
            <TabsContent value="packing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Packing Lists</span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Packing List
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Packing List Management</h3>
                    <p className="text-gray-600">Create and manage packing lists for sales orders</p>
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Packing List Workflow</h4>
                      <ol className="text-sm text-blue-800 text-left space-y-1">
                        <li>1. Select sales order</li>
                        <li>2. Create packing list with products and quantities</li>
                        <li>3. System automatically deducts stock from inventory</li>
                        <li>4. Order status updates to "Dispatched"</li>
                        <li>5. Generate shipping documents</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tracking Tab */}
            <TabsContent value="tracking" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
                    <p className="text-gray-600">Track shipments and provide delivery updates to customers</p>
                    
                    <div className="mt-6 grid md:grid-cols-2 gap-4 text-left">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Tracking Features</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Real-time location updates</li>
                          <li>• Estimated delivery time</li>
                          <li>• Customer notifications</li>
                          <li>• Proof of delivery</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Integration Support</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Multiple carrier APIs</li>
                          <li>• Tracking number validation</li>
                          <li>• Automated status updates</li>
                          <li>• Exception handling</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Metrics</h3>
                      <p className="text-gray-600">Track delivery times, success rates, and customer satisfaction</p>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-green-50 rounded">
                          <p className="font-semibold text-green-900">On-Time Rate</p>
                          <p className="text-2xl font-bold text-green-600">94%</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="font-semibold text-blue-900">Avg. Transit Time</p>
                          <p className="text-2xl font-bold text-blue-600">2.3 days</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Cost Analysis</h3>
                      <p className="text-gray-600">Monitor shipping costs and optimize carrier selection</p>
                      
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>This Month:</span>
                          <span className="font-semibold">$12,450</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>Last Month:</span>
                          <span className="font-semibold">$11,230</span>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded">
                          <span>Cost per Shipment:</span>
                          <span className="font-semibold text-green-600">$24.50</span>
                        </div>
                      </div>
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
