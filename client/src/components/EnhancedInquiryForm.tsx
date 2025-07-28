import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, TrendingUp, ShoppingCart, Calendar, Phone, Mail, Building2, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Product {
  id: number;
  name: string;
  productId: string;
  moq: string;
  priceUnit: string;
  basePrice: string;
}

interface EnhancedInquiryFormProps {
  product: Product;
  isAuthenticated: boolean;
}

export function EnhancedInquiryForm({ product, isAuthenticated }: EnhancedInquiryFormProps) {
  const [inquiryType, setInquiryType] = useState<string>("bulk_order");
  const [formData, setFormData] = useState({
    // Contact Information (for non-logged users)
    contactName: "",
    companyName: "",
    phoneNumber: "",
    emailAddress: "",
    
    // Inquiry Details
    quantity: "",
    unit: product.priceUnit || "kg",
    targetPrice: "",
    expectedDelivery: "",
    message: "",
    urgency: "normal"
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createInquiryMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/inquiries-enhanced`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Submitted Successfully",
        description: "We'll get back to you with a quotation within 24 hours.",
      });
      setIsDialogOpen(false);
      setFormData({
        contactName: "",
        companyName: "",
        phoneNumber: "",
        emailAddress: "",
        quantity: "",
        unit: product.priceUnit || "kg",
        targetPrice: "",
        expectedDelivery: "",
        message: "",
        urgency: "normal"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Inquiry",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for non-authenticated users
    if (!isAuthenticated) {
      if (!formData.contactName || !formData.companyName || !formData.phoneNumber || !formData.emailAddress) {
        toast({
          title: "Missing Required Information",
          description: "Please fill in all contact details.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!formData.quantity || !formData.message) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in quantity and message.",
        variant: "destructive",
      });
      return;
    }

    const inquiryData = {
      productId: product.id,
      inquiryType,
      ...formData,
    };

    createInquiryMutation.mutate(inquiryData);
  };

  const getInquiryTypeConfig = (type: string) => {
    switch (type) {
      case "high_volume_bid":
        return {
          title: "High Volume Bidding",
          description: "For large-scale procurement with competitive pricing",
          icon: <TrendingUp className="w-5 h-5" />,
          color: "bg-blue-50 border-blue-200",
          badge: "bg-blue-100 text-blue-800"
        };
      case "quote_request":
        return {
          title: "Quote Request",
          description: "Get detailed pricing for your specific requirements",
          icon: <MessageSquarePlus className="w-5 h-5" />,
          color: "bg-green-50 border-green-200",
          badge: "bg-green-100 text-green-800"
        };
      default:
        return {
          title: "Bulk Order Inquiry",
          description: "Standard bulk order inquiry for regular procurement",
          icon: <ShoppingCart className="w-5 h-5" />,
          color: "bg-orange-50 border-orange-200",
          badge: "bg-orange-100 text-orange-800"
        };
    }
  };

  const currentConfig = getInquiryTypeConfig(inquiryType);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Send Inquiry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {currentConfig.icon}
            Product Inquiry - {product.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inquiry Type Selection */}
          <Card className={`${currentConfig.color} border`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Inquiry Type
                <Badge className={currentConfig.badge}>
                  {currentConfig.title}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={inquiryType}
                onValueChange={setInquiryType}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-white/50 cursor-pointer">
                  <RadioGroupItem value="bulk_order" id="bulk_order" />
                  <Label htmlFor="bulk_order" className="cursor-pointer flex-1">
                    <div className="font-medium">Bulk Order</div>
                    <div className="text-xs text-gray-600">Regular procurement</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-white/50 cursor-pointer">
                  <RadioGroupItem value="high_volume_bid" id="high_volume_bid" />
                  <Label htmlFor="high_volume_bid" className="cursor-pointer flex-1">
                    <div className="font-medium">High Volume</div>
                    <div className="text-xs text-gray-600">Competitive pricing</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-white/50 cursor-pointer">
                  <RadioGroupItem value="quote_request" id="quote_request" />
                  <Label htmlFor="quote_request" className="cursor-pointer flex-1">
                    <div className="font-medium">Quote Request</div>
                    <div className="text-xs text-gray-600">Detailed pricing</div>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-gray-600 mt-2">{currentConfig.description}</p>
            </CardContent>
          </Card>

          {/* Contact Information (for non-authenticated users) */}
          {!isAuthenticated && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information (Required)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="emailAddress">Email Address *</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inquiry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity Required *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    placeholder="Enter quantity"
                    min={product.moq}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Minimum order: {product.moq} {product.priceUnit}
                  </p>
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="mt">Metric Ton (mt)</SelectItem>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      <SelectItem value="g">Grams (g)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {inquiryType === "high_volume_bid" && (
                <div>
                  <Label htmlFor="targetPrice">Target Price (Optional)</Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                    placeholder="Enter your target price per unit"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Current base price: ${product.basePrice}/{product.priceUnit}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                  <Input
                    id="expectedDelivery"
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - No rush</SelectItem>
                      <SelectItem value="normal">Normal - Standard timeline</SelectItem>
                      <SelectItem value="urgent">Urgent - Need ASAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message & Requirements *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  placeholder="Please describe your specific requirements, quality standards, packaging preferences, shipping location, and any other relevant details..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createInquiryMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createInquiryMutation.isPending ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}