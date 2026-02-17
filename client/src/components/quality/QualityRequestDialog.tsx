import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, FileText, FlaskConical, ShieldCheck, Loader2 } from "lucide-react";

interface QualityRequestDialogProps {
  companyName?: string;
  customerName?: string;
  triggerClassName?: string;
  triggerLabel?: string;
}

export function QualityRequestDialog({ companyName, customerName, triggerClassName, triggerLabel }: QualityRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("document");
  const { toast } = useToast();

  const [docForm, setDocForm] = useState({
    documentType: "coa",
    materialName: "",
    customerName: customerName || companyName || "",
    priority: "normal",
    notes: "",
  });

  const [testForm, setTestForm] = useState({
    requestType: "irf",
    materialName: "",
    sampleDetails: "",
    testParameters: "",
    priority: "normal",
    notes: "",
  });

  const [approvalForm, setApprovalForm] = useState({
    customerName: customerName || companyName || "",
    vendorName: "",
    approvalType: "initial_approval",
    documentTypes: "",
    notes: "",
  });

  const docMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/quality/document-requests", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document request submitted to Quality team" });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/document-requests"] });
      setOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/quality/testing-requests", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Testing request submitted to Quality team" });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/testing-requests"] });
      setOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/quality/customer-vendor-approvals", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vendor approval request submitted to Quality team" });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/customer-vendor-approvals"] });
      setOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    },
  });

  const resetForms = () => {
    setDocForm({ documentType: "coa", materialName: "", customerName: customerName || companyName || "", priority: "normal", notes: "" });
    setTestForm({ requestType: "irf", materialName: "", sampleDetails: "", testParameters: "", priority: "normal", notes: "" });
    setApprovalForm({ customerName: customerName || companyName || "", vendorName: "", approvalType: "initial_approval", documentTypes: "", notes: "" });
  };

  const handleDocSubmit = () => {
    if (!docForm.materialName) {
      toast({ title: "Material name is required", variant: "destructive" });
      return;
    }
    docMutation.mutate(docForm);
  };

  const handleTestSubmit = () => {
    if (!testForm.materialName) {
      toast({ title: "Material name is required", variant: "destructive" });
      return;
    }
    testMutation.mutate(testForm);
  };

  const handleApprovalSubmit = () => {
    if (!approvalForm.customerName) {
      toast({ title: "Customer name is required", variant: "destructive" });
      return;
    }
    approvalMutation.mutate(approvalForm);
  };

  const isPending = docMutation.isPending || testMutation.isPending || approvalMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          {triggerLabel || "Request Quality"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Submit Request to Quality
          </DialogTitle>
          <DialogDescription>
            Submit a document, testing, or vendor approval request to the Quality team
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="document" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />Document
            </TabsTrigger>
            <TabsTrigger value="testing" className="text-xs">
              <FlaskConical className="h-3 w-3 mr-1" />Testing
            </TabsTrigger>
            <TabsTrigger value="approval" className="text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />Vendor Approval
            </TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docForm.documentType} onValueChange={(v) => setDocForm({ ...docForm, documentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coa">Certificate of Analysis (COA)</SelectItem>
                  <SelectItem value="specification">Product Specification</SelectItem>
                  <SelectItem value="msds">MSDS / Safety Data Sheet</SelectItem>
                  <SelectItem value="organic_certificate">Organic Certificate</SelectItem>
                  <SelectItem value="allergen_statement">Allergen Statement</SelectItem>
                  <SelectItem value="vendor_questionnaire">Vendor Questionnaire</SelectItem>
                  <SelectItem value="other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material Name *</Label>
              <Input value={docForm.materialName} onChange={(e) => setDocForm({ ...docForm, materialName: e.target.value })} placeholder="e.g., Organic Turmeric Powder" />
            </div>
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input value={docForm.customerName} onChange={(e) => setDocForm({ ...docForm, customerName: e.target.value })} placeholder="Customer requesting document" />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={docForm.priority} onValueChange={(v) => setDocForm({ ...docForm, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} placeholder="Additional details..." rows={3} />
            </div>
            <Button onClick={handleDocSubmit} disabled={isPending} className="w-full">
              {docMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Document Request
            </Button>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select value={testForm.requestType} onValueChange={(v) => setTestForm({ ...testForm, requestType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="irf">IRF - Incoming Raw Material</SelectItem>
                  <SelectItem value="trf">TRF - Testing Request Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material Name *</Label>
              <Input value={testForm.materialName} onChange={(e) => setTestForm({ ...testForm, materialName: e.target.value })} placeholder="e.g., Organic Ashwagandha Root" />
            </div>
            <div className="space-y-2">
              <Label>Sample Details</Label>
              <Input value={testForm.sampleDetails} onChange={(e) => setTestForm({ ...testForm, sampleDetails: e.target.value })} placeholder="Batch, quantity, source..." />
            </div>
            <div className="space-y-2">
              <Label>Test Parameters</Label>
              <Input value={testForm.testParameters} onChange={(e) => setTestForm({ ...testForm, testParameters: e.target.value })} placeholder="Microbiology, heavy metals, etc." />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={testForm.priority} onValueChange={(v) => setTestForm({ ...testForm, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={testForm.notes} onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })} placeholder="Additional instructions..." rows={3} />
            </div>
            <Button onClick={handleTestSubmit} disabled={isPending} className="w-full">
              {testMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Testing Request
            </Button>
          </TabsContent>

          <TabsContent value="approval" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={approvalForm.customerName} onChange={(e) => setApprovalForm({ ...approvalForm, customerName: e.target.value })} placeholder="Customer company name" />
            </div>
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input value={approvalForm.vendorName} onChange={(e) => setApprovalForm({ ...approvalForm, vendorName: e.target.value })} placeholder="Vendor being approved" />
            </div>
            <div className="space-y-2">
              <Label>Approval Type</Label>
              <Select value={approvalForm.approvalType} onValueChange={(v) => setApprovalForm({ ...approvalForm, approvalType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial_approval">Initial Approval</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="requalification">Requalification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Required Documents</Label>
              <Input value={approvalForm.documentTypes} onChange={(e) => setApprovalForm({ ...approvalForm, documentTypes: e.target.value })} placeholder="COA, Organic Cert, Audit Report..." />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={approvalForm.notes} onChange={(e) => setApprovalForm({ ...approvalForm, notes: e.target.value })} placeholder="Additional details..." rows={3} />
            </div>
            <Button onClick={handleApprovalSubmit} disabled={isPending} className="w-full">
              {approvalMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Vendor Approval Request
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
