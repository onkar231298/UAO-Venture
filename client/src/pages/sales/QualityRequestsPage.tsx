import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { QualityRequestDialog } from "@/components/quality/QualityRequestDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, FlaskConical, ShieldCheck, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function QualityRequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("documents");

  const { data: docData, isLoading: docsLoading } = useQuery<any>({
    queryKey: ['/api/quality/document-requests'],
    enabled: !!user,
  });
  const docRequests: any[] = docData?.requests || (Array.isArray(docData) ? docData : []);

  const { data: testData, isLoading: testsLoading } = useQuery<any>({
    queryKey: ['/api/quality/testing-requests'],
    enabled: !!user,
  });
  const testRequests: any[] = testData?.requests || (Array.isArray(testData) ? testData : []);

  const { data: approvalData, isLoading: approvalsLoading } = useQuery<any>({
    queryKey: ['/api/quality/customer-vendor-approvals'],
    enabled: !!user,
  });
  const approvals: any[] = approvalData?.approvals || (Array.isArray(approvalData) ? approvalData : []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      in_progress: { variant: "secondary", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
      rejected: { variant: "destructive", label: "Rejected" },
      approved: { variant: "default", label: "Approved" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      normal: "bg-blue-100 text-blue-800",
      low: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[priority] || colors.normal}>{priority}</Badge>;
  };

  return (
    <SalesLayout title="Quality Requests" subtitle="Submit and track quality requests for your companies">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Submit document requests, testing requests, and vendor approvals to the Quality team
            </p>
          </div>
          <QualityRequestDialog
            triggerLabel="New Quality Request"
            triggerClassName="bg-green-600 hover:bg-green-700 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Document Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docRequests?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {docRequests?.filter((d: any) => d.status === 'pending').length || 0} pending
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Testing Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testRequests?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {testRequests?.filter((t: any) => t.status === 'pending').length || 0} pending
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Vendor Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvals?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {approvals?.filter((a: any) => a.status === 'pending').length || 0} pending
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="documents">Document Requests</TabsTrigger>
            <TabsTrigger value="testing">Testing Requests</TabsTrigger>
            <TabsTrigger value="approvals">Vendor Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Requests</CardTitle>
                <CardDescription>COA, Specifications, MSDS, Organic Certificates, and more</CardDescription>
              </CardHeader>
              <CardContent>
                {docsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : !docRequests?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No document requests yet</p>
                    <p className="text-sm mt-1">Use the "New Quality Request" button to submit one</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {docRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{req.materialName}</span>
                              <Badge variant="outline" className="text-xs">{req.documentType?.toUpperCase()}</Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {req.customerName && <span>Customer: {req.customerName} · </span>}
                              {req.createdAt && <span>{format(new Date(req.createdAt), 'MMM dd, yyyy')}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(req.priority || 'normal')}
                            {getStatusBadge(req.status || 'pending')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle>Testing Requests</CardTitle>
                <CardDescription>IRF and TRF testing workflows</CardDescription>
              </CardHeader>
              <CardContent>
                {testsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : !testRequests?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No testing requests yet</p>
                    <p className="text-sm mt-1">Use the "New Quality Request" button to submit one</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {testRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{req.materialName}</span>
                              <Badge variant="outline" className="text-xs">{req.requestType?.toUpperCase()}</Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {req.testParameters && <span>Tests: {req.testParameters} · </span>}
                              {req.createdAt && <span>{format(new Date(req.createdAt), 'MMM dd, yyyy')}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(req.priority || 'normal')}
                            {getStatusBadge(req.status || 'pending')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Approvals</CardTitle>
                <CardDescription>Customer vendor approval requests</CardDescription>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : !approvals?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No vendor approval requests yet</p>
                    <p className="text-sm mt-1">Use the "New Quality Request" button to submit one</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {approvals.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{req.customerName}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-sm">{req.vendorName}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Type: {req.approvalType?.replace('_', ' ')} · 
                              {req.createdAt && <span> {format(new Date(req.createdAt), 'MMM dd, yyyy')}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(req.status || 'pending')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SalesLayout>
  );
}
