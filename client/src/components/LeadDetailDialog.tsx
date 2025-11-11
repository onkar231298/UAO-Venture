import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, User, DollarSign, Calendar, Phone, Mail, MapPin, FileText, UserPlus, Package } from "lucide-react";
import { type LeadWithDetails, type Product } from "@shared/schema";
import ActivityTimeline from "./ActivityTimeline";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface LeadDetailDialogProps {
  lead: LeadWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesReps?: any[];
  onAssign?: (leadId: number, assignedTo: string) => void;
  canAssignLeads?: boolean;
}

export default function LeadDetailDialog({ lead, open, onOpenChange, salesReps = [], onAssign, canAssignLeads = false }: LeadDetailDialogProps) {
  const [selectedAssignee, setSelectedAssignee] = useState(lead?.assignedSalesRep || "");
  
  if (!lead) return null;

  const productIds = lead.productsInterested || [];
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/bulk', { ids: productIds.join(',') }],
    enabled: productIds.length > 0 && open,
  });

  const handleAssignmentChange = (value: string) => {
    setSelectedAssignee(value);
    if (onAssign) {
      onAssign(lead.id, value);
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "$0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hot": return "bg-red-500 text-white";
      case "warm": return "bg-orange-500 text-white";
      case "cold": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatStageName = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {lead.company?.companyName || "Unknown Company"}
              </DialogTitle>
              <DialogDescription>
                {lead.leadId} • Created {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, yyyy') : 'N/A'}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(lead.priority || "warm")}>
                {lead.priority || "warm"}
              </Badge>
              <Badge variant="outline">
                {lead.currentStage ? formatStageName(lead.currentStage) : 'N/A'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Company Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="font-medium">{lead.company?.companyName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{lead.company?.industryType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium text-blue-600">
                      {lead.company?.website ? (
                        <a href={lead.company.website} target="_blank" rel="noopener noreferrer">
                          {lead.company.website}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{lead.company?.industryType || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Primary Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium">{lead.contactPerson?.contactName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="font-medium">{lead.contactPerson?.designation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {lead.contactPerson?.email ? (
                        <a href={`mailto:${lead.contactPerson.email}`} className="text-blue-600">
                          {lead.contactPerson.email}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {lead.contactPerson?.phone ? (
                        <a href={`tel:${lead.contactPerson.countryCode}${lead.contactPerson.phone}`} className="text-blue-600">
                          {lead.contactPerson.countryCode && !lead.contactPerson.countryCode.startsWith('+') ? '+' : ''}{lead.contactPerson.countryCode} {lead.contactPerson.phone}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Deal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Expected Order Value</p>
                    <p className="font-medium text-lg">{formatCurrency(lead.expectedOrderValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Buying Timeline</p>
                    <p className="font-medium">{lead.buyingTimeline || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lead Source</p>
                    <p className="font-medium">{lead.leadSource || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Days in Current Stage</p>
                    <p className="font-medium">{lead.daysInCurrentStage || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Team & Assignment */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sales Team & Assignment
                </h3>
                <div className="space-y-4">
                  {/* Current Assignment */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Currently Assigned To</p>
                    {lead.salesRep ? (
                      <p className="font-medium">
                        {lead.salesRep.firstName} {lead.salesRep.lastName}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">Unassigned</p>
                    )}
                  </div>
                  
                  {/* Assignment Dropdown (Only for admins/managers) */}
                  {canAssignLeads && salesReps.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Change Assignment</p>
                      <div className="flex gap-2 items-center">
                        <Select value={selectedAssignee} onValueChange={handleAssignmentChange}>
                          <SelectTrigger className="w-full" data-testid="select-assign-lead">
                            <SelectValue placeholder="Select sales rep..." />
                          </SelectTrigger>
                          <SelectContent>
                            {salesReps.map((rep: any) => (
                              <SelectItem key={rep.id} value={rep.id}>
                                {rep.firstName} {rep.lastName} ({rep.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select a sales representative to assign this lead
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Special Requirements */}
            {lead.specialRequirements && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Special Requirements
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.specialRequirements}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityTimeline leadId={lead.id} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {productsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-500">Loading products...</p>
                </CardContent>
              </Card>
            ) : productIds.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-500">No products associated with this lead</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Product Cards */}
                <div className="grid gap-4">
                  {products.map((product) => (
                    <Card key={product.id} data-testid={`product-card-${product.id}`}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          {product.mainImage && (
                            <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                              <img 
                                src={product.mainImage} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                data-testid={`product-image-${product.id}`}
                              />
                            </div>
                          )}
                          
                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-lg" data-testid={`product-name-${product.id}`}>
                                  {product.name}
                                </h4>
                                <p className="text-sm text-gray-500" data-testid={`product-id-${product.id}`}>
                                  SKU: {product.productId}
                                </p>
                              </div>
                              <Badge variant="outline" data-testid={`product-status-${product.id}`}>
                                {product.status || 'Active'}
                              </Badge>
                            </div>

                            {/* Product Info Grid */}
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              {lead.requiredQuantity && (
                                <div>
                                  <p className="text-xs text-gray-500">Required Quantity</p>
                                  <p className="font-medium" data-testid={`product-quantity-${product.id}`}>
                                    {lead.requiredQuantity} {lead.unit || 'units'}
                                  </p>
                                </div>
                              )}
                              
                              {product.moq && (
                                <div>
                                  <p className="text-xs text-gray-500">MOQ</p>
                                  <p className="font-medium">{product.moq}</p>
                                </div>
                              )}
                              
                              {product.packingSize && (
                                <div>
                                  <p className="text-xs text-gray-500">Packing Size</p>
                                  <p className="font-medium">{product.packingSize}</p>
                                </div>
                              )}
                              
                              {product.leadTime && (
                                <div>
                                  <p className="text-xs text-gray-500">Lead Time</p>
                                  <p className="font-medium">{product.leadTime}</p>
                                </div>
                              )}
                            </div>

                            {/* Product Description */}
                            {product.description && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Deal Summary */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Deal Summary
                    </h3>
                    <div className="space-y-3">
                      {lead.requiredQuantity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Quantity</span>
                          <span className="font-medium" data-testid="deal-total-quantity">
                            {lead.requiredQuantity} {lead.unit || 'units'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="font-semibold">Expected Order Value</span>
                        <span className="font-bold text-lg" data-testid="deal-expected-value">
                          {formatCurrency(lead.expectedOrderValue)}
                        </span>
                      </div>
                      {!lead.expectedOrderValue && (
                        <p className="text-sm text-gray-500 italic">
                          Price pending - quotation in progress
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Special Requirements */}
                {lead.specialRequirements && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Additional Details
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap" data-testid="product-special-requirements">
                        {lead.specialRequirements}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
