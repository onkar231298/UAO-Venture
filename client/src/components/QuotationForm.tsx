import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calculator } from "lucide-react";
import { type Inquiry } from "@shared/schema";

interface QuotationFormProps {
  inquiry: Inquiry & { productName?: string };
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

interface QuotationItem {
  productId: number;
  productName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: number;
  specifications: string;
}

export default function QuotationForm({ inquiry, onSubmit, isLoading }: QuotationFormProps) {
  const [formData, setFormData] = useState({
    inquiryId: inquiry.id,
    customerId: inquiry.customerId,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: "draft",
    terms: `Payment Terms: 30 days net
Delivery: Ex-works
Validity: 30 days from quotation date
Quality: As per specifications
Packaging: Standard export packaging`,
    notes: ""
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      productId: inquiry.productId || 0,
      productName: (inquiry as any).productName || "Product",
      quantity: inquiry.quantity?.toString() || "0",
      unit: inquiry.unit || "kg",
      unitPrice: "",
      totalPrice: 0,
      specifications: ""
    }
  ]);

  const calculateItemTotal = (quantity: string, unitPrice: string): number => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = calculateItemTotal(
        newItems[index].quantity,
        newItems[index].unitPrice
      );
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      productId: 0,
      productName: "",
      quantity: "",
      unit: "kg",
      unitPrice: "",
      totalPrice: 0,
      specifications: ""
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getTotalAmount = (): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quotationData = {
      ...formData,
      totalAmount: getTotalAmount(),
      quotationId: `QUO${Date.now()}`,
      items: items.map(item => ({
        productId: item.productId,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice) || 0,
        totalPrice: item.totalPrice,
        specifications: item.specifications
      }))
    };

    onSubmit(quotationData);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Inquiry Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer & Inquiry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Customer</Label>
              <p className="text-sm">{inquiry.contactName}</p>
              <p className="text-xs text-gray-500">{inquiry.companyName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Contact</Label>
              <p className="text-sm">{inquiry.emailAddress}</p>
              <p className="text-xs text-gray-500">{inquiry.phoneNumber}</p>
            </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Original Message</Label>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{inquiry.message}</p>
            </div>
          </CardContent>
      </Card>

        {/* Quotation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Send to Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Line Items
            <Button type="button" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Item {index + 1}</span>
                {items.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={item.productName}
                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Specifications</Label>
                  <Input
                    value={item.specifications}
                    onChange={(e) => updateItem(index, 'specifications', e.target.value)}
                    placeholder="Quality, grade, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={item.unit} onValueChange={(value) => updateItem(index, 'unit', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="tons">tons</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="grams">grams</SelectItem>
                      <SelectItem value="pieces">pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Total ($)</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                    <Calculator className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">{item.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Separator />
          
          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-lg font-semibold">
                Total Amount: ${getTotalAmount().toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">USD</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={5}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Internal notes for sales team..."
            />
          </div>
        </CardContent>
      </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-3 sticky bottom-0 bg-white pt-4 border-t">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : formData.status === "sent" ? "Send Quotation" : "Create Quotation"}
          </Button>
        </div>
      </form>
    </div>
  );
}