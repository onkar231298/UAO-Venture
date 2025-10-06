import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface ParsedLead {
  companyName: string;
  contactName: string;
  contactEmail: string;
  countryCode: string;
  contactPhone: string;
  expectedValue: string;
  leadSource: string;
  assignedToEmail?: string;
  rowNumber: number;
}

interface UploadResult {
  success: any[];
  errors: { row: number; error: string }[];
}

export default function BulkLeadUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [defaultAssignee, setDefaultAssignee] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch sales reps for dropdown
  const { data: salesReps = [] } = useQuery<User[]>({
    queryKey: ["/api/crm/sales-reps"],
    enabled: isOpen,
  });

  // Parse CSV file
  const parseCSV = (text: string): ParsedLead[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV file must contain header row and at least one data row");
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const leads: ParsedLead[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      
      if (values.length < 7) continue; // Skip invalid rows
      
      leads.push({
        companyName: values[0] || "",
        contactName: values[1] || "",
        contactEmail: values[2] || "",
        countryCode: values[3] || "",
        contactPhone: values[4] || "",
        expectedValue: values[5] || "0",
        leadSource: values[6] || "manual",
        assignedToEmail: values[7] || undefined,
        rowNumber: i + 1,
      });
    }

    return leads;
  };

  // Handle file selection
  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const leads = parseCSV(text);
      setParsedLeads(leads);
      setUploadResult(null);
      toast({
        title: "File Parsed",
        description: `Successfully parsed ${leads.length} leads`,
      });
    } catch (error: any) {
      toast({
        title: "Parse Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = `Company Name,Contact Person,Email,Country Code,Phone,Expected Value,Lead Source,Assigned Sales Rep Email
Acme Corp,John Smith,john@acme.com,+1,234-567-8900,50000,website,salesrep1@bfiorganic.com
Beta Industries,Jane Doe,jane@beta.com,+91,234-567-8901,75000,referral,salesrep2@bfiorganic.com`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lead_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (leadsData: any[]) => {
      try {
        const response = await apiRequest("POST", "/api/crm/leads/bulk-upload", { leads: leadsData });
        
        // Check if response is OK
        if (!response.ok) {
          const text = await response.text();
          console.error("Upload error response:", text);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json() as UploadResult;
        return result;
      } catch (error: any) {
        console.error("Upload mutation error:", error);
        throw error;
      }
    },
    onSuccess: (result: UploadResult) => {
      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      
      if (result.errors.length === 0) {
        toast({
          title: "Success",
          description: `Successfully imported ${result.success.length} leads`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Imported ${result.success.length} leads with ${result.errors.length} errors`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle upload
  const handleUpload = async () => {
    if (parsedLeads.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    // Map parsed leads to the format expected by the API
    const leadsData = await Promise.all(parsedLeads.map(async (lead) => {
      // Find company by name or create placeholder
      let assignedTo = defaultAssignee || undefined;
      
      // If lead has specific assignment email, try to match it
      if (lead.assignedToEmail) {
        const matchedRep = salesReps.find(rep => rep.email === lead.assignedToEmail);
        if (matchedRep) {
          assignedTo = matchedRep.id;
        }
      }

      return {
        companyName: lead.companyName,
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        countryCode: lead.countryCode,
        contactPhone: lead.contactPhone,
        expectedOrderValue: lead.expectedValue,
        leadSource: lead.leadSource,
        assignedSalesRep: assignedTo,
        currentStage: "new_lead",
        priority: "warm",
        status: "active",
      };
    }));

    uploadMutation.mutate(leadsData);
  };

  // Reset state when closing
  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setParsedLeads([]);
    setUploadResult(null);
    setDefaultAssignee("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      else setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-bulk-upload">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Lead Upload</DialogTitle>
          <DialogDescription>
            Upload multiple leads from a CSV file. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-sm">Need a template?</h4>
              <p className="text-xs text-gray-600 mt-1">Download our CSV template with example data and correct format</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
              data-testid="input-csv-file"
            />
            
            <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm font-medium mb-2">
              {file ? file.name : "Drag and drop CSV file here"}
            </p>
            <p className="text-xs text-gray-500 mb-4">or</p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-choose-file"
            >
              Choose File
            </Button>
          </div>

          {/* Default Assignee Selection */}
          {parsedLeads.length > 0 && (
            <div className="space-y-2">
              <Label>Default Sales Rep (optional)</Label>
              <Select value={defaultAssignee} onValueChange={setDefaultAssignee}>
                <SelectTrigger data-testid="select-default-assignee">
                  <SelectValue placeholder="Assign all leads to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default assignment</SelectItem>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.firstName} {rep.lastName} ({rep.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                This assignment will be used for leads without a specific assignee in the CSV
              </p>
            </div>
          )}

          {/* Preview Table */}
          {parsedLeads.length > 0 && !uploadResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview ({parsedLeads.length} leads)</Label>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadMutation.isPending}
                  data-testid="button-import-leads"
                >
                  {uploadMutation.isPending ? "Importing..." : "Import Leads"}
                </Button>
              </div>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Assignee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedLeads.map((lead, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs">{lead.rowNumber}</TableCell>
                        <TableCell className="text-xs">{lead.companyName}</TableCell>
                        <TableCell className="text-xs">{lead.contactName}</TableCell>
                        <TableCell className="text-xs">{lead.contactEmail}</TableCell>
                        <TableCell className="text-xs">{lead.countryCode} {lead.contactPhone}</TableCell>
                        <TableCell className="text-xs">${lead.expectedValue}</TableCell>
                        <TableCell className="text-xs">{lead.assignedToEmail || "Default"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm">
                  Successfully imported {uploadResult.success.length} leads
                </AlertDescription>
              </Alert>

              {uploadResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {uploadResult.errors.length} errors occurred:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {uploadResult.errors.map((error, idx) => (
                        <li key={idx} className="text-xs">
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleClose} className="w-full" data-testid="button-close-results">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
