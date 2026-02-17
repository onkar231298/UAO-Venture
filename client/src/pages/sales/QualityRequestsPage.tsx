import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { QualityRequestDialog } from "@/components/quality/QualityRequestDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, FlaskConical, ShieldCheck, Loader2, Eye, ExternalLink, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function QualityRequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);

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
      open: { variant: "outline", label: "Open" },
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

  const hasResponse = (item: any) => item?.responseNotes || item?.responseDocumentLink;

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
              <div className="text-2xl font-bold">{docRequests.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {docRequests.filter((d: any) => d.status === 'open' || d.status === 'pending').length} open
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
              <div className="text-2xl font-bold">{testRequests.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {testRequests.filter((t: any) => t.status === 'pending').length} pending
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
              <div className="text-2xl font-bold">{approvals.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {approvals.filter((a: any) => a.status === 'pending').length} pending
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
                ) : !docRequests.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No document requests yet</p>
                    <p className="text-sm mt-1">Use the "New Quality Request" button to submit one</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {docRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDoc(req)}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-semibold text-green-700">{req.referenceId || `#${req.id}`}</span>
                              <span className="font-medium">{req.title || req.materialName || 'Document Request'}</span>
                              <Badge variant="outline" className="text-xs">{(req.requestType || req.documentType)?.toUpperCase()}</Badge>
                              {hasResponse(req) && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <MessageSquare className="w-3 h-3 mr-1" />Reply
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {req.materialName && <span>Material: {req.materialName} · </span>}
                              {req.customerName && <span>Customer: {req.customerName} · </span>}
                              {req.createdAt && <span>{format(new Date(req.createdAt), 'MMM dd, yyyy')}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(req.priority || 'normal')}
                            {getStatusBadge(req.status || 'open')}
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedDoc(req); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
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
                ) : !testRequests.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No testing requests yet</p>
                    <p className="text-sm mt-1">Use the "New Quality Request" button to submit one</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {testRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTest(req)}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-semibold text-blue-700">{req.referenceId || `#${req.id}`}</span>
                              <span className="font-medium">{req.title || req.materialName || 'Testing Request'}</span>
                              <Badge variant="outline" className="text-xs">{req.requestType?.toUpperCase()}</Badge>
                              {hasResponse(req) && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <MessageSquare className="w-3 h-3 mr-1" />Reply
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {req.materialName && <span>Material: {req.materialName} · </span>}
                              {req.createdAt && <span>{format(new Date(req.createdAt), 'MMM dd, yyyy')}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(req.priority || 'normal')}
                            {getStatusBadge(req.status || 'pending')}
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedTest(req); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
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
                ) : !approvals.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No vendor approval requests yet</p>
                    <p className="text-sm mt-1">Use the "New Quality Request" button to submit one</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {approvals.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApproval(req)}>
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
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedApproval(req); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
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

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Request: {selectedDoc?.referenceId || `#${selectedDoc?.id}`}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Reference ID</Label>
                  <p className="text-sm font-mono font-semibold text-green-700">{selectedDoc.referenceId || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Title</Label>
                  <p className="text-sm font-medium">{selectedDoc.title || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <p className="text-sm"><Badge variant="outline">{(selectedDoc.requestType || selectedDoc.documentType)?.toUpperCase()}</Badge></p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Material</Label>
                  <p className="text-sm">{selectedDoc.materialName || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Customer</Label>
                  <p className="text-sm font-medium">{selectedDoc.customerName || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Priority</Label>
                  <p className="text-sm">{getPriorityBadge(selectedDoc.priority || 'normal')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p className="text-sm">{getStatusBadge(selectedDoc.status || 'open')}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Submitted On</Label>
                  <p className="text-sm">{selectedDoc.createdAt ? format(new Date(selectedDoc.createdAt), 'MMM dd, yyyy HH:mm') : '-'}</p>
                </div>
                {selectedDoc.description && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Description</Label>
                    <p className="text-sm">{selectedDoc.description}</p>
                  </div>
                )}
                {selectedDoc.notes && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Notes</Label>
                    <p className="text-sm">{selectedDoc.notes}</p>
                  </div>
                )}
              </div>

              <Card className={hasResponse(selectedDoc) ? "border-green-200 bg-green-50" : "border-dashed"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Quality Team Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasResponse(selectedDoc) ? (
                    <div className="space-y-3">
                      {selectedDoc.responseNotes && (
                        <div>
                          <Label className="text-xs text-gray-500">Response Notes</Label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedDoc.responseNotes}</p>
                        </div>
                      )}
                      {selectedDoc.responseDocumentLink && (
                        <div>
                          <Label className="text-xs text-gray-500">Document Link</Label>
                          <a
                            href={selectedDoc.responseDocumentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-1 underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Document
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No response from Quality team yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTest} onOpenChange={(open) => !open && setSelectedTest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Testing Request: {selectedTest?.referenceId || `#${selectedTest?.id}`}
            </DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Reference ID</Label>
                  <p className="text-sm font-mono font-semibold text-blue-700">{selectedTest.referenceId || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Title</Label>
                  <p className="text-sm font-medium">{selectedTest.title || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <p className="text-sm"><Badge variant="outline">{selectedTest.requestType?.toUpperCase()}</Badge></p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Material</Label>
                  <p className="text-sm">{selectedTest.materialName || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Priority</Label>
                  <p className="text-sm">{getPriorityBadge(selectedTest.priority || 'normal')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p className="text-sm">{getStatusBadge(selectedTest.status || 'pending')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Submitted On</Label>
                  <p className="text-sm">{selectedTest.createdAt ? format(new Date(selectedTest.createdAt), 'MMM dd, yyyy HH:mm') : '-'}</p>
                </div>
                {selectedTest.description && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Description</Label>
                    <p className="text-sm">{selectedTest.description}</p>
                  </div>
                )}
                {selectedTest.notes && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Notes</Label>
                    <p className="text-sm">{selectedTest.notes}</p>
                  </div>
                )}
                {selectedTest.testResults && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Test Results</Label>
                    <p className="text-sm">{selectedTest.testResults}</p>
                  </div>
                )}
              </div>

              <Card className={hasResponse(selectedTest) ? "border-green-200 bg-green-50" : "border-dashed"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Quality Team Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasResponse(selectedTest) ? (
                    <div className="space-y-3">
                      {selectedTest.responseNotes && (
                        <div>
                          <Label className="text-xs text-gray-500">Response Notes</Label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTest.responseNotes}</p>
                        </div>
                      )}
                      {selectedTest.responseDocumentLink && (
                        <div>
                          <Label className="text-xs text-gray-500">Document Link</Label>
                          <a
                            href={selectedTest.responseDocumentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-1 underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Document
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No response from Quality team yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && setSelectedApproval(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Vendor Approval #{selectedApproval?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Customer</Label>
                  <p className="text-sm font-medium">{selectedApproval.customerName || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Vendor</Label>
                  <p className="text-sm font-medium">{selectedApproval.vendorName || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Approval Type</Label>
                  <p className="text-sm">{selectedApproval.approvalType?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p className="text-sm">{getStatusBadge(selectedApproval.status || 'pending')}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Submitted On</Label>
                  <p className="text-sm">{selectedApproval.createdAt ? format(new Date(selectedApproval.createdAt), 'MMM dd, yyyy HH:mm') : '-'}</p>
                </div>
                {selectedApproval.notes && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Notes</Label>
                    <p className="text-sm">{selectedApproval.notes}</p>
                  </div>
                )}
              </div>

              <Card className={selectedApproval.responseNotes ? "border-green-200 bg-green-50" : "border-dashed"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Quality Team Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedApproval.responseNotes ? (
                    <div>
                      <Label className="text-xs text-gray-500">Response Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedApproval.responseNotes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No response from Quality team yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SalesLayout>
  );
}
