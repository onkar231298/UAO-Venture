import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CalendarDays, Mail, Phone, Building, MapPin, Package, Clock, User, MessageSquare, UserPlus, CheckCircle2 } from "lucide-react";
import { type Inquiry } from "@shared/schema";

interface InquiryDetailsDialogProps {
  inquiry: Inquiry & { productName?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToLead?: (inquiry: Inquiry) => void;
  isConvertingToLead?: boolean;
}

export default function InquiryDetailsDialog({ inquiry, open, onOpenChange, onConvertToLead, isConvertingToLead = false }: InquiryDetailsDialogProps) {
  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
        {status}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyColors = {
      urgent: 'border-red-500 text-red-700 bg-red-50',
      normal: 'border-yellow-500 text-yellow-700 bg-yellow-50',
      low: 'border-gray-500 text-gray-700 bg-gray-50'
    };
    
    return (
      <Badge variant="outline" className={urgencyColors[urgency as keyof typeof urgencyColors] || urgencyColors.normal}>
        {urgency}
      </Badge>
    );
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span>Inquiry Details - INQ-{inquiry.id}</span>
            <div className="flex items-center gap-2">
              {getStatusBadge(inquiry.status || 'pending')}
              {getUrgencyBadge(inquiry.urgency || 'normal')}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{inquiry.contactName}</p>
                      <p className="text-sm text-gray-500">Contact Person</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{inquiry.companyName}</p>
                      <p className="text-sm text-gray-500">Company Name</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{inquiry.emailAddress}</p>
                      <p className="text-sm text-gray-500">Email Address</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{inquiry.phoneNumber}</p>
                      <p className="text-sm text-gray-500">Phone Number</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product & Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Product & Inquiry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Product</p>
                    <p className="font-medium">{(inquiry as any).productName || 'Product Name'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inquiry Type</p>
                    <Badge variant="outline">
                      {inquiry.inquiryType?.replace('_', ' ').toUpperCase() || 'BULK ORDER'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity Required</p>
                    <p className="font-medium text-lg">
                      {parseFloat(inquiry.quantity || '0').toLocaleString()} {inquiry.unit}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {inquiry.targetPrice && (
                    <div>
                      <p className="text-sm text-gray-500">Target Price</p>
                      <p className="font-medium">${parseFloat(inquiry.targetPrice).toFixed(2)} per {inquiry.unit}</p>
                    </div>
                  )}
                  {inquiry.expectedDelivery && (
                    <div>
                      <p className="text-sm text-gray-500">Expected Delivery</p>
                      <p className="font-medium">{formatDate(inquiry.expectedDelivery)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Inquiry ID</p>
                    <p className="font-mono text-sm">{inquiry.inquiryId}</p>
                  </div>
                </div>
              </div>

              {inquiry.message && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Customer Message</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                    </div>
                  </div>
                </>
              )}

              {inquiry.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Additional Notes</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm whitespace-pre-wrap">{inquiry.notes}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Timeline & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Created On</p>
                      <p className="font-medium">{formatDate(inquiry.createdAt!)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{formatDate(inquiry.updatedAt!)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {inquiry.assignedTo && (
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{inquiry.assignedTo}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Current Status</p>
                  <p className="text-sm text-blue-700">This inquiry is {inquiry.status || 'pending'} and requires attention</p>
                </div>
                {getStatusBadge(inquiry.status || 'pending')}
              </div>

              {inquiry.crmLeadId && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Converted to CRM Lead</p>
                      <p className="text-sm text-green-700">This inquiry has been converted to a lead in the CRM system</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Lead ID: {inquiry.crmLeadId}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {onConvertToLead && !inquiry.crmLeadId && (
          <DialogFooter className="mt-6">
            <Button
              onClick={() => onConvertToLead(inquiry)}
              disabled={isConvertingToLead}
              data-testid="button-convert-to-lead-dialog"
              className="min-h-[44px] w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isConvertingToLead ? 'Converting...' : 'Convert to Lead'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}