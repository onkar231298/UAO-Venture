import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp,
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import type { Inventory, Product } from "@shared/schema";

export default function InventoryManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products", { limit: 1000 }],
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ productId, quantity, batchNumber }: { productId: number; quantity: number; batchNumber?: string }) => {
      return await apiRequest("PUT", `/api/inventory/${productId}`, {
        quantity,
        batchNumber,
      });
    },
    onSuccess: () => {
      toast({ title: "Inventory updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    },
  });

  const getStockStatus = (quantity: number, moq: number = 0) => {
    if (quantity === 0) {
      return { status: "Out of Stock", variant: "destructive" as const, color: "text-red-600" };
    } else if (quantity <= moq * 2) {
      return { status: "Low Stock", variant: "destructive" as const, color: "text-orange-600" };
    } else if (quantity <= moq * 5) {
      return { status: "Medium Stock", variant: "secondary" as const, color: "text-yellow-600" };
    } else {
      return { status: "In Stock", variant: "default" as const, color: "text-green-600" };
    }
  };

  const filteredInventory = inventory?.filter((item: Inventory) => {
    const product = products?.products?.find((p: Product) => p.id === item.productId);
    const matchesSearch = !searchQuery || 
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product?.productId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProduct = !productFilter || item.productId.toString() === productFilter;
    
    return matchesSearch && matchesProduct;
  });

  return (
    <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'inventory_manager', 'inventory_executive', 'logistics_manager', 'logistics_executive']}>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Track stock levels, manage batches, and monitor inventory movements</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold">{products?.total || 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {filteredInventory?.filter((item: Inventory) => {
                        const product = products?.products?.find((p: Product) => p.id === item.productId);
                        const quantity = parseFloat(item.quantityInStock || "0");
                        const moq = product?.moq || 0;
                        return quantity <= moq * 2 && quantity > 0;
                      }).length || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">
                      {filteredInventory?.filter((item: Inventory) => parseFloat(item.quantityInStock || "0") === 0).length || 0}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold">
                      ${filteredInventory?.reduce((sum: number, item: Inventory) => {
                        const cost = parseFloat(item.cost || "0");
                        const quantity = parseFloat(item.quantityInStock || "0");
                        return sum + (cost * quantity);
                      }, 0).toLocaleString() || "0"}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
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
                    placeholder="Search products, SKU, batch numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Products</SelectItem>
                    {products?.products?.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
              <TabsTrigger value="movements">Stock Movements</TabsTrigger>
              <TabsTrigger value="batches">Batch Management</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Current Inventory Tab */}
            <TabsContent value="inventory" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Current Inventory</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Adjust Stock
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Stock Adjustment</DialogTitle>
                          </DialogHeader>
                          <StockAdjustmentForm 
                            products={products?.products || []}
                            onSubmit={(data) => updateInventoryMutation.mutate(data)}
                            isLoading={updateInventoryMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                      ))}
                    </div>
                  ) : filteredInventory?.length ? (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Current Stock</th>
                            <th>Unit</th>
                            <th>Batch Number</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map((item: Inventory) => {
                            const product = products?.products?.find((p: Product) => p.id === item.productId);
                            const quantity = parseFloat(item.quantityInStock || "0");
                            const stockStatus = getStockStatus(quantity, product?.moq);
                            
                            return (
                              <tr key={item.id}>
                                <td>
                                  <div>
                                    <p className="font-medium">{product?.name}</p>
                                    <p className="text-sm text-gray-500">{product?.botanicalName}</p>
                                  </div>
                                </td>
                                <td className="font-mono text-sm">{product?.productId}</td>
                                <td className={`font-semibold ${stockStatus.color}`}>
                                  {quantity.toLocaleString()}
                                </td>
                                <td>{item.unit}</td>
                                <td className="font-mono text-sm">{item.batchNumber || '-'}</td>
                                <td>
                                  {item.expiryDate ? (
                                    <span className={
                                      new Date(item.expiryDate) < new Date() ? 'text-red-600' :
                                      new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-orange-600' :
                                      'text-gray-900'
                                    }>
                                      {new Date(item.expiryDate).toLocaleDateString()}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td>
                                  <Badge variant={stockStatus.variant}>
                                    {stockStatus.status}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory found</h3>
                      <p className="text-gray-600">Start by adding products to your inventory</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs with placeholder content */}
            <TabsContent value="movements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Movement History</h3>
                    <p className="text-gray-600">Track all inventory movements including receipts, dispatches, and adjustments</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="batches" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Batch Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Batch Tracking</h3>
                    <p className="text-gray-600">Manage product batches, lot numbers, and expiry dates</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Analytics</h3>
                    <p className="text-gray-600">Generate reports on stock levels, movements, and valuation</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleBasedRoute>
  );
}

// Stock Adjustment Form Component
function StockAdjustmentForm({ 
  products, 
  onSubmit, 
  isLoading 
}: { 
  products: Product[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    batchNumber: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      productId: parseInt(formData.productId),
      quantity: parseFloat(formData.quantity),
      batchNumber: formData.batchNumber || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Product</Label>
        <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product: Product) => (
              <SelectItem key={product.id} value={product.id.toString()}>
                {product.name} ({product.productId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>New Quantity</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label>Batch Number (Optional)</Label>
        <Input
          value={formData.batchNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
          placeholder="Enter batch number"
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Stock"}
      </Button>
    </form>
  );
}
