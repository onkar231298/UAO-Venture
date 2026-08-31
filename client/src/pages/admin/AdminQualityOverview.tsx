import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualityRequestDialog } from "@/components/quality/QualityRequestDialog";
import { CreateFieldQualityRecordDialog } from "@/pages/quality/QualityDashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  FileText,
  FlaskConical,
  Package,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Edit,
  Trash2,
} from "lucide-react";

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    received: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    in_testing: "bg-blue-100 text-blue-800",
    under_review: "bg-blue-100 text-blue-800",
    sample_received: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    released: "bg-green-100 text-green-800",
    closed: "bg-green-100 text-green-800",
    active: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-red-100 text-red-800",
    on_hold: "bg-orange-100 text-orange-800",
    suspended: "bg-orange-100 text-orange-800",
    conditionally_approved: "bg-orange-100 text-orange-800",
  };
  return (
    <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
      {status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </Badge>
  );
}

export default function AdminQualityOverview() {
  const { toast } = useToast();
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/quality/dashboard-stats"],
  });

  const { data: fieldRecords } = useQuery<any>({
    queryKey: ["/api/quality/field-records", { limit: 10 }],
    queryFn: async () => {
      const res = await fetch("/api/quality/field-records?limit=10");
      return res.json();
    },
  });

  const updateFieldRecord = useMutation({
    mutationFn: async (body: any) => {
      const { id, ...updates } = body;
      const res = await apiRequest(`/api/quality/field-records/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
      return res.json();
    },
    onSuccess: () => {
      setEditingRecord(null);
      toast({ title: "Record updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/field-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
    },
    onError: () => toast({ title: "Failed to update record", variant: "destructive" }),
  });

  const deleteFieldRecord = useMutation({
    mutationFn: async (record: any) => {
      const res = await apiRequest(`/api/quality/field-records/${record.id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      setRecordToDelete(null);
      toast({ title: "Record permanently deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/field-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
    },
    onError: () => toast({ title: "Failed to delete record", variant: "destructive" }),
  });

  const { data: docRequests } = useQuery<any>({
    queryKey: ["/api/quality/document-requests", { limit: 5 }],
  });

  const { data: testingRequests } = useQuery<any>({
    queryKey: ["/api/quality/testing-requests", { limit: 5 }],
  });

  const { data: batches } = useQuery<any>({
    queryKey: ["/api/quality/batches", { limit: 5 }],
  });

  const { data: ncrs } = useQuery<any>({
    queryKey: ["/api/quality/ncrs", { limit: 5 }],
  });

  const { data: vendors } = useQuery<any>({
    queryKey: ["/api/quality/vendors", { limit: 5 }],
  });

  const { data: approvals } = useQuery<any>({
    queryKey: ["/api/quality/customer-vendor-approvals", { limit: 5 }],
  });

  const statCards = [
    { title: "Document Requests", icon: FileText, total: stats?.documentRequests?.total || 0, open: stats?.documentRequests?.open || 0, color: "text-blue-600" },
    { title: "Testing Requests", icon: FlaskConical, total: stats?.testingRequests?.total || 0, open: stats?.testingRequests?.pending || 0, color: "text-purple-600" },
    { title: "Active Batches", icon: Package, total: stats?.batches?.total || 0, open: stats?.batches?.active || 0, color: "text-emerald-600" },
    { title: "Material Vendors", icon: Building2, total: stats?.vendorApprovals?.total || 0, open: stats?.vendorApprovals?.pending || 0, color: "text-orange-600" },
    { title: "Open NCRs", icon: AlertTriangle, total: stats?.ncrs?.total || 0, open: stats?.ncrs?.open || 0, color: "text-red-600" },
    { title: "Vendor Approvals", icon: ShieldCheck, total: stats?.customerVendorApprovals?.total || 0, open: stats?.customerVendorApprovals?.received || 0, color: "text-teal-600" },
    { title: "Testing Records", icon: MapPin, total: stats?.fieldQualityRecords?.total || 0, open: stats?.fieldQualityRecords?.inTesting || 0, color: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Quality Management Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of all quality operations across the organization
          </p>
        </div>
        <QualityRequestDialog
          triggerLabel="New Quality Request"
          triggerClassName="bg-green-600 hover:bg-green-700 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.total}</div>
              <p className="text-xs text-muted-foreground">
                {stat.open} {stat.title === 'Active Batches' ? 'active' : 'open/pending'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          <TabsTrigger value="testing" className="text-xs">Testing</TabsTrigger>
          <TabsTrigger value="batches" className="text-xs">Batches</TabsTrigger>
          <TabsTrigger value="vendors" className="text-xs">Vendors</TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs">Approvals</TabsTrigger>
          <TabsTrigger value="ncrs" className="text-xs">NCRs</TabsTrigger>
          <TabsTrigger value="field-records" className="text-xs">Field Quality Records</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Document Requests</CardTitle>
              <CardDescription>Latest document requests from sales and quality teams</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(docRequests?.requests || []).map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.documentType?.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{req.materialName || '-'}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>
                        <Badge variant={req.priority === 'urgent' ? 'destructive' : req.priority === 'high' ? 'default' : 'secondary'}>
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!docRequests?.requests || docRequests.requests.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No document requests yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Testing Requests</CardTitle>
              <CardDescription>IRF and TRF testing requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(testingRequests?.requests || []).map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.requestNumber || `TR-${req.id}`}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.requestType?.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{req.materialName || '-'}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!testingRequests?.requests || testingRequests.requests.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No testing requests yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Batch Numbers</CardTitle>
              <CardDescription>Batch tracking for raw materials and finished goods</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(batches?.batches || []).map((batch: any) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono font-medium">{batch.batchNumber}</TableCell>
                      <TableCell>{batch.materialName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{batch.batchType === 'raw_material' ? 'Raw Material' : 'Finished Good'}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(batch.status)}</TableCell>
                      <TableCell>{new Date(batch.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!batches?.batches || batches.batches.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No batch numbers created yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Material Vendors</CardTitle>
              <CardDescription>Vendor approval and management status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(vendors?.vendors || []).map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                      <TableCell>{vendor.vendorCode || '-'}</TableCell>
                      <TableCell>{vendor.contactPerson || '-'}</TableCell>
                      <TableCell>{getStatusBadge(vendor.approvalStatus)}</TableCell>
                      <TableCell>{vendor.approvalExpiry ? new Date(vendor.approvalExpiry).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {(!vendors?.vendors || vendors.vendors.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No vendors registered yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Vendor Approvals</CardTitle>
              <CardDescription>Approval documents from sales and customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(approvals?.approvals || []).map((approval: any) => (
                    <TableRow key={approval.id}>
                      <TableCell className="font-medium">{approval.customerName || '-'}</TableCell>
                      <TableCell>{approval.approvalType?.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{getStatusBadge(approval.status)}</TableCell>
                      <TableCell>{new Date(approval.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!approvals?.approvals || approvals.approvals.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No vendor approvals yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ncrs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Non-Conformance Reports</CardTitle>
              <CardDescription>Quality issues and corrective actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NCR #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ncrs?.ncrs || []).map((ncr: any) => (
                    <TableRow key={ncr.id}>
                      <TableCell className="font-mono font-medium">{ncr.ncrNumber}</TableCell>
                      <TableCell>{ncr.title || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={ncr.severity === 'critical' ? 'destructive' : ncr.severity === 'major' ? 'default' : 'secondary'}>
                          {ncr.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ncr.status)}</TableCell>
                      <TableCell>{new Date(ncr.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!ncrs?.ncrs || ncrs.ncrs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No NCRs reported yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="field-records">
          {/* Stat cards */}
          {stats?.fieldQualityRecords && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Records", value: stats.fieldQualityRecords.total, color: "text-indigo-700", bg: "bg-indigo-50" },
                { label: "IRF", value: stats.fieldQualityRecords.irf, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "TRF", value: stats.fieldQualityRecords.trf, color: "text-purple-700", bg: "bg-purple-50" },
                { label: "Loading Inspection", value: stats.fieldQualityRecords.loadingInspection, color: "text-cyan-700", bg: "bg-cyan-50" },
                { label: "In Testing", value: stats.fieldQualityRecords.inTesting, color: "text-amber-700", bg: "bg-amber-50" },
                { label: "Completed", value: stats.fieldQualityRecords.completed, color: "text-green-700", bg: "bg-green-50" },
                { label: "Accepted", value: stats.fieldQualityRecords.accepted, color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "Rejected", value: stats.fieldQualityRecords.rejected, color: "text-red-700", bg: "bg-red-50" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Testing Records
              </CardTitle>
              <CardDescription>Recent IRF, TRF and Loading Inspection records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Party / Lab</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conclusion</TableHead>
                    <TableHead>Date</TableHead>
                     <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fieldRecords?.records || []).map((rec: any) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-mono font-medium text-xs">{rec.recordNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {rec.formType === 'loading_inspection' ? 'L.I.' : rec.formType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{rec.productName}</div>
                        {rec.productCode && <div className="text-xs text-muted-foreground">{rec.productCode}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{rec.partyName || rec.labName || '-'}</TableCell>
                      <TableCell>{getStatusBadge(rec.status)}</TableCell>
                      <TableCell>
                        {rec.overallConclusion ? (
                          <Badge className={
                            rec.overallConclusion === 'accepted' ? 'bg-green-100 text-green-800' :
                            rec.overallConclusion === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'
                          }>
                            {rec.overallConclusion}
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">Pending</span>}
                      </TableCell>
                      <TableCell className="text-sm">{new Date(rec.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {(rec.formType === "IRF" || rec.formType === "TRF") && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" aria-label={`Edit ${rec.recordNumber}`} onClick={() => setEditingRecord(rec)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" aria-label={`Delete ${rec.recordNumber}`} onClick={() => setRecordToDelete(rec)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!fieldRecords?.records || fieldRecords.records.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No testing records yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editingRecord && (
        <CreateFieldQualityRecordDialog
          open={!!editingRecord}
          onOpenChange={(open) => { if (!open) setEditingRecord(null); }}
          formType={editingRecord.formType}
          initialRecord={editingRecord}
          onSubmit={(updates) => updateFieldRecord.mutate({ ...updates, id: editingRecord.id })}
          isLoading={updateFieldRecord.isPending}
        />
      )}

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => { if (!open) setRecordToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete {recordToDelete?.recordNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The record, all test results, and all attachments will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFieldRecord.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFieldRecord.isPending}
              onClick={() => recordToDelete && deleteFieldRecord.mutate(recordToDelete)}
            >
              {deleteFieldRecord.isPending ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
