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
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { Product } from "@shared/schema";

interface InquiryFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export default function InquiryForm({ product, onSuccess }: InquiryFormProps) {
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    productId: product?.id || "",
    quantity: "",
    unit: product?.unit || "kg",
    message: "",
    urgency: "normal",
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!isAuthenticated) {
        throw new Error("Authentication required");
      }

      return await apiRequest("POST", "/api/inquiries", {
        productId: parseInt(data.productId.toString()),
        quantity: parseFloat(data.quantity),
        unit: data.unit,
        message: data.message,
        urgency: data.urgency,
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Submitted",
        description: "Your inquiry has been submitted successfully. Our team will contact you soon.",
      });
      
      // Reset form
      setFormData({
        productId: product?.id || "",
        quantity: "",
        unit: product?.unit || "kg",
        message: "",
        urgency: "normal",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      
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
    
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to submit an inquiry.",
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

    inquiryMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to submit a product inquiry. 
          <Button 
            variant="link" 
            className="p-0 ml-1" 
            onClick={() => window.location.href = "/api/login"}
          >
            Login here
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Product Inquiry</span>
          {product && <span className="text-sm font-normal text-gray-600">for {product.name}</span>}
        </CardTitle>
      </CardHeader>
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

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Requirements</Label>
            <Textarea
              id="message"
              placeholder="Please specify any special requirements, certifications needed, packaging preferences, or other details..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={4}
            />
          </div>

          {/* User Information Display */}
          {user && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Contact Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                {user.companyName && (
                  <p><span className="font-medium">Company:</span> {user.companyName}</p>
                )}
                {user.phoneNumber && (
                  <p><span className="font-medium">Phone:</span> {user.phoneNumber}</p>
                )}
              </div>
            </div>
          )}

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
    </Card>
  );
}
