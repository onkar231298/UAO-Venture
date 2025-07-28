import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Beaker, User, MapPin, Package, TestTube, Truck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  productId: string;
}

interface SampleRequestFormProps {
  product: Product;
  isAuthenticated: boolean;
}

export function SampleRequestForm({ product, isAuthenticated }: SampleRequestFormProps) {
  const [formData, setFormData] = useState({
    // Contact Information (required for all users)
    contactName: "",
    companyName: "",
    phoneNumber: "",
    emailAddress: "",
    
    // Sample Details
    sampleSize: "50g",
    purpose: "",
    expectedOrderQuantity: "",
    message: "",
    
    // Shipping Details
    shippingAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States"
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSampleRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/sample-requests`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sample Request Submitted",
        description: "We'll process your sample request and send it within 3-5 business days.",
      });
      setIsDialogOpen(false);
      setFormData({
        contactName: "",
        companyName: "",
        phoneNumber: "",
        emailAddress: "",
        sampleSize: "50g",
        purpose: "",
        expectedOrderQuantity: "",
        message: "",
        shippingAddress: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sample-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Sample Request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - all contact and shipping fields are required
    const requiredFields = [
      'contactName', 'companyName', 'phoneNumber', 'emailAddress',
      'purpose', 'shippingAddress', 'city', 'state', 'postalCode', 'country'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const sampleRequestData = {
      productId: product.id,
      ...formData,
    };

    createSampleRequestMutation.mutate(sampleRequestData);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          <Beaker className="w-4 h-4 mr-2" />
          Request Sample
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Beaker className="w-5 h-5 text-orange-600" />
            Sample Request - {product.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sample Information */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Sample Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sampleSize">Sample Size</Label>
                  <Select value={formData.sampleSize} onValueChange={(value) => setFormData({ ...formData, sampleSize: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25g">25 grams (Small)</SelectItem>
                      <SelectItem value="50g">50 grams (Standard)</SelectItem>
                      <SelectItem value="100g">100 grams (Large)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testing">Quality Testing</SelectItem>
                      <SelectItem value="analysis">Lab Analysis</SelectItem>
                      <SelectItem value="product_development">Product Development</SelectItem>
                      <SelectItem value="trial_production">Trial Production</SelectItem>
                      <SelectItem value="customer_approval">Customer Approval</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expectedOrderQuantity">Expected Order Quantity (kg)</Label>
                  <Input
                    id="expectedOrderQuantity"
                    type="number"
                    value={formData.expectedOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, expectedOrderQuantity: e.target.value })}
                    placeholder="Future order quantity"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Additional Requirements</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  placeholder="Any specific requirements, testing parameters, or additional information..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
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
                  placeholder="+91-7249847439"
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

          {/* Shipping Information */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Information (Required)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shippingAddress">Shipping Address *</Label>
                <Textarea
                  id="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  required
                  rows={2}
                  placeholder="Enter complete shipping address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                    placeholder="Enter state or province"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    required
                    placeholder="Enter postal/ZIP code"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Information Note */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Sample Shipping Information:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Samples are shipped within 3-5 business days</li>
                    <li>• Free samples for qualified businesses (shipping charges may apply)</li>
                    <li>• International shipping available with additional charges</li>
                    <li>• Samples include COA (Certificate of Analysis) and technical specifications</li>
                  </ul>
                </div>
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
              disabled={createSampleRequestMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createSampleRequestMutation.isPending ? "Submitting..." : "Submit Sample Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}