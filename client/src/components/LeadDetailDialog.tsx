import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, User, DollarSign, Calendar, Phone, Mail, MapPin, FileText } from "lucide-react";
import { type LeadWithDetails } from "@shared/schema";
import ActivityTimeline from "./ActivityTimeline";
import { format } from "date-fns";

interface LeadDetailDialogProps {
  lead: LeadWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailDialog({ lead, open, onOpenChange }: LeadDetailDialogProps) {
  if (!lead) return null;

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
                {lead.leadId} • Created {format(new Date(lead.createdAt), 'MMM d, yyyy')}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(lead.priority || "warm")}>
                {lead.priority || "warm"}
              </Badge>
              <Badge variant="outline">
                {formatStageName(lead.currentStage)}
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
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{lead.company?.address || "N/A"}</p>
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
                        <a href={`tel:${lead.contactPerson.phone}`} className="text-blue-600">
                          {lead.contactPerson.phone}
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
                    <p className="text-sm text-gray-500">Expected Close Date</p>
                    <p className="font-medium">
                      {lead.expectedCloseDate ? format(new Date(lead.expectedCloseDate), 'MMM d, yyyy') : "N/A"}
                    </p>
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

            {/* Sales Team */}
            {lead.salesRep && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sales Team
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Sales Representative</p>
                      <p className="font-medium">
                        {lead.salesRep.firstName} {lead.salesRep.lastName}
                      </p>
                    </div>
                    {lead.manager && (
                      <div>
                        <p className="text-sm text-gray-500">Sales Manager</p>
                        <p className="font-medium">
                          {lead.manager.firstName} {lead.manager.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {lead.notes && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityTimeline leadId={lead.id} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">Product information will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
