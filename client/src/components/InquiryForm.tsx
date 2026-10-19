import { trackProjectEvent } from "@/lib/projectAnalytics";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, User } from "lucide-react";
import type { Product } from "@shared/schema";

interface InquiryFormProps {
  product?: Product;
  onSuccess?: () => void;
  customerData?: any;
  isCustomerAuthenticated?: boolean;
}

export default function InquiryForm({ product, onSuccess, customerData, isCustomerAuthenticated }: InquiryFormProps) {
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-fill form data if customer is logged in
  const [formData, setFormData] = useState({
    productId: product?.id || "",
    quantity: "",
    unit: "kg",
    message: "",
    urgency: "normal",
    inquiryType: "quote_request",
    // Contact Information - auto-filled if customer is logged in
    contactName: customerData ? `${customerData.firstName} ${customerData.lastName}` : "",
    companyName: customerData?.companyName || "",
    phoneNumber: customerData?.phoneNumber || "",
    emailAddress: customerData?.email || "",
    notes: "",
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit inquiry');
      }
      
      return response.json();
    },
    onSuccess: () => {
      trackProjectEvent("inquiry_submitted", { form: "standard" });
      toast({
        title: "Inquiry Submitted",
        description: isCustomerAuthenticated
          ? "Your inquiry is now available under My Enquiry in your customer dashboard. Our team will contact you soon."
          : "Your inquiry has been submitted successfully. Our team will contact you soon.",
      });
      
      // Reset form
      setFormData({
        productId: product?.id || "",
        quantity: "",
        unit: "kg",
        message: "",
        urgency: "normal",
        inquiryType: "quote_request",
        contactName: "",
        companyName: "",
        phoneNumber: "",
        emailAddress: "",
        notes: "",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      if (customerData?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/customer/inquiries/${customerData.id}`] });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated && !isCustomerAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to submit an inquiry.",
        variant: "destructive",
      });
      return;
    }

    // Validate required contact information (required for ALL users)
    if (!formData.contactName || !formData.companyName || !formData.phoneNumber || !formData.emailAddress) {
      toast({
        title: "Missing Contact Information",
        description: "Please fill in all contact details (Name, Company, Phone, Email).",
        variant: "destructive",
      });
      return;
    }

    if (!formData.productId || !formData.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const inquiryData = {
      ...formData,
      customerId: isCustomerAuthenticated ? customerData?.id : null,
    };
    
    inquiryMutation.mutate(inquiryData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated && !isCustomerAuthenticated) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to submit a product inquiry. 
          <Button 
            variant="link" 
            className="p-0 ml-1" 
            onClick={() => window.location.href = "/login"}
          >
            Login here
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-2">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection (if not pre-selected) */}
          {!product && (
            <div className="space-y-2">
              <Label htmlFor="productId">Product *</Label>
              <Input
                id="productId"
                placeholder="Enter product ID or name"
                value={formData.productId}
                onChange={(e) => handleInputChange("productId", e.target.value)}
                required
              />
            </div>
          )}

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  <SelectItem value="tons">Metric Tons</SelectItem>
                  <SelectItem value="grams">Grams (g)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency</Label>
            <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information - Required for ALL users */}
          <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information (Required)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Full Name *</Label>
                <Input
                  id="contactName"
                  placeholder="Enter your full name"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange("contactName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+91-7249847439"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.emailAddress}
                  onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Requirements & Message *</Label>
            <Textarea
              id="message"
              placeholder="Please specify your requirements, certifications needed, packaging preferences, quantity details, and any other details..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information, special instructions, or comments..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={inquiryMutation.isPending}
          >
            {inquiryMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Inquiry
              </>
            )}
          </Button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            By submitting this inquiry, you agree to our terms of service and privacy policy. 
            Our team will contact you within 24 hours.
          </p>
        </form>
      </CardContent>
    </div>
  );
}
