import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CalendarDays, Mail, Phone, Building, MapPin, Package, Clock, User, MessageSquare, UserPlus, CheckCircle2, FileText, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { type Inquiry } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface InquiryDetailsDialogProps {
  inquiry: Inquiry & { productName?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToLead?: (inquiry: Inquiry) => void;
  isConvertingToLead?: boolean;
}

export default function InquiryDetailsDialog({ inquiry, open, onOpenChange, onConvertToLead, isConvertingToLead = false }: InquiryDetailsDialogProps) {
  // Fetch quotations for this inquiry
  const { data: quotationsData } = useQuery({
    queryKey: [`/api/inquiries/${inquiry.id}/quotations`],
    enabled: open && !!inquiry.id,
  });

  const quotations = quotationsData?.quotations || [];
  const latestQuotation = quotations.length > 0 ? quotations[0] : null;

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

  const getQuotationStatusBadge = (status: string) => {
    const statusColors = {
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.draft}>
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

          {/* Quotation Status - Show if quotation exists */}
          {latestQuotation && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Quotation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-1">{latestQuotation.quotationId}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Total Amount:</span>{' '}
                        <span className="font-medium">{latestQuotation.currency} {parseFloat(latestQuotation.totalAmount || '0').toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Valid Until:</span>{' '}
                        <span className="font-medium">{latestQuotation.validUntil ? new Date(latestQuotation.validUntil).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  {getQuotationStatusBadge(latestQuotation.status)}
                </div>

                {/* Customer Response - Show accepted/rejected with prominent visual */}
                {latestQuotation.status === 'accepted' && (
                  <div className="flex items-start p-4 bg-green-50 rounded-lg border-2 border-green-300">
                    <ThumbsUp className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900 mb-1">Customer Accepted the Quote</p>
                      <p className="text-sm text-green-700">
                        The customer has accepted this quotation. You can now proceed with converting this inquiry to a lead.
                      </p>
                    </div>
                  </div>
                )}

                {latestQuotation.status === 'rejected' && (
                  <div className="flex items-start p-4 bg-red-50 rounded-lg border-2 border-red-300">
                    <ThumbsDown className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Customer Rejected the Quote</p>
                      <p className="text-sm text-red-700">
                        The customer has rejected this quotation. Consider reaching out to understand their concerns or create a revised quotation.
                      </p>
                    </div>
                  </div>
                )}

                {latestQuotation.status === 'sent' && (
                  <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">Awaiting Customer Response</p>
                      <p className="text-sm text-blue-700">
                        The quotation has been sent to the customer and is pending their review and acceptance.
                      </p>
                    </div>
                  </div>
                )}

                {latestQuotation.status === 'expired' && (
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-300">
                    <Clock className="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Quotation Expired</p>
                      <p className="text-sm text-gray-700">
                        This quotation has passed its validity date. Consider creating a new quotation if the customer is still interested.
                      </p>
                    </div>
                  </div>
                )}

                {/* Counter Offer Information if exists */}
                {latestQuotation.customerCounterPrice && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900 mb-2">Customer Counter-Offer</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-gray-600">Proposed Price:</span>{' '}
                        <span className="font-medium text-yellow-900">
                          {latestQuotation.currency} {parseFloat(latestQuotation.customerCounterPrice).toLocaleString()}
                        </span>
                      </p>
                      {latestQuotation.counterOfferNotes && (
                        <div className="mt-2">
                          <span className="text-gray-600">Notes:</span>
                          <p className="text-gray-700 mt-1 italic">&quot;{latestQuotation.counterOfferNotes}&quot;</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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