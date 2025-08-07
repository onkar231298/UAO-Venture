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
    currency: "USD",
    priceType: "ex_warehouse",
    terms: `Payment Terms: 30 days net
Delivery: Ex-works
Validity: 30 days from quotation date
Quality: As per specifications
Packaging: Standard export packaging`,
    notes: "",
    // GST fields
    includeGst: false,
    gstNumber: "",
    gstPercentage: "18.00", // Default GST rate
    discountPercent: "0.00"
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

  const getSubtotal = (): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getDiscountAmount = (): number => {
    const subtotal = getSubtotal();
    const discountPercent = parseFloat(formData.discountPercent) || 0;
    return (subtotal * discountPercent) / 100;
  };

  const getGstAmount = (): number => {
    if (!formData.includeGst) return 0;
    const subtotalAfterDiscount = getSubtotal() - getDiscountAmount();
    const gstPercent = parseFloat(formData.gstPercentage) || 0;
    return (subtotalAfterDiscount * gstPercent) / 100;
  };

  const getTotalAmount = (): number => {
    return getSubtotal() - getDiscountAmount() + getGstAmount();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const gstAmount = getGstAmount();
    const totalAmount = getTotalAmount();
    
    const quotationData = {
      inquiryId: formData.inquiryId,
      customerId: formData.customerId,
      validUntil: formData.validUntil,
      totalAmount: totalAmount.toString(),
      subtotal: subtotal.toString(),
      discountPercent: formData.discountPercent,
      discountAmount: discountAmount.toString(),
      currency: formData.currency,
      priceType: formData.priceType,
      status: formData.status,
      terms: formData.terms,
      notes: formData.notes,
      includeGst: formData.includeGst,
      gstNumber: formData.includeGst ? formData.gstNumber : null,
      gstPercentage: formData.includeGst ? formData.gstPercentage : null,
      gstAmount: formData.includeGst ? gstAmount.toString() : null,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice.toString(),
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priceType">Price Type</Label>
                <Select value={formData.priceType} onValueChange={(value) => setFormData({ ...formData, priceType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ex_warehouse">Ex-Warehouse</SelectItem>
                    <SelectItem value="ex_works">Ex-Works</SelectItem>
                    <SelectItem value="fob">FOB (Free on Board)</SelectItem>
                    <SelectItem value="cif">CIF (Cost, Insurance & Freight)</SelectItem>
                    <SelectItem value="cfr">CFR (Cost & Freight)</SelectItem>
                    <SelectItem value="dap">DAP (Delivered at Place)</SelectItem>
                    <SelectItem value="ddp">DDP (Delivered Duty Paid)</SelectItem>
                    <SelectItem value="cpt">CPT (Carriage Paid To)</SelectItem>
                    <SelectItem value="cip">CIP (Carriage & Insurance Paid)</SelectItem>
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
                  <Label>Unit Price ({formData.currency})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Total ({formData.currency})</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                    <Calculator className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">{item.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Separator />
          
          {/* Pricing & Tax Calculations */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Pricing & Tax Calculations</h3>
            
            {/* Discount Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountPercent">Discount (%)</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* GST Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeGst"
                  checked={formData.includeGst}
                  onChange={(e) => setFormData({ ...formData, includeGst: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="includeGst" className="font-medium">
                  Include GST (for domestic transactions)
                </Label>
              </div>
              
              {formData.includeGst && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      placeholder="Enter GST Number"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstPercentage">GST Rate (%)</Label>
                    <Select 
                      value={formData.gstPercentage} 
                      onValueChange={(value) => setFormData({ ...formData, gstPercentage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.00">0% - Exempt</SelectItem>
                        <SelectItem value="5.00">5% - Essential goods</SelectItem>
                        <SelectItem value="12.00">12% - Standard rate</SelectItem>
                        <SelectItem value="18.00">18% - Standard rate</SelectItem>
                        <SelectItem value="28.00">28% - Luxury goods</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Price Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">{formData.currency} {getSubtotal().toFixed(2)}</span>
              </div>
              
              {parseFloat(formData.discountPercent) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({formData.discountPercent}%):</span>
                  <span className="font-medium">- {formData.currency} {getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              
              {formData.includeGst && parseFloat(formData.gstPercentage) > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>GST ({formData.gstPercentage}%):</span>
                  <span className="font-medium">+ {formData.currency} {getGstAmount().toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>{formData.currency} {getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="text-right text-sm text-gray-500">{formData.priceType.toUpperCase().replace('_', '-')}</div>
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