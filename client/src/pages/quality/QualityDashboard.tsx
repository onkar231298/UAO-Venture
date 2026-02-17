import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MyActivityWidget } from "@/components/hr/MyActivityWidget";
import { PunchInOutButton } from "@/components/hr/PunchInOutButton";
import { MyAttendance } from "@/components/hr/MyAttendance";
import {
  LayoutDashboard,
  FileText,
  FlaskConical,
  ClipboardList,
  Boxes,
  Factory,
  UserCheck,
  AlertTriangle,
  Calendar,
  Settings,
  LogOut,
  Plus,
  Eye,
  Edit,
  Activity,
  Search,
  RefreshCw,
  ChevronRight,
  Menu,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Beaker,
  ExternalLink,
} from "lucide-react";

// ==================== STATUS BADGE HELPER ====================
function getStatusBadge(status: string) {
  const s = status?.toLowerCase();
  if (["open", "pending", "received"].includes(s)) {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{status}</Badge>;
  }
  if (["in_progress", "in_testing", "under_review", "sample_received"].includes(s)) {
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{status.replace(/_/g, " ")}</Badge>;
  }
  if (["completed", "approved", "released", "closed"].includes(s)) {
    return <Badge className="bg-green-100 text-green-800 border-green-200">{status}</Badge>;
  }
  if (["rejected", "expired"].includes(s)) {
    return <Badge className="bg-red-100 text-red-800 border-red-200">{status}</Badge>;
  }
  if (["active"].includes(s)) {
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{status}</Badge>;
  }
  if (["on_hold", "suspended", "conditionally_approved"].includes(s)) {
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{status.replace(/_/g, " ")}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

// ==================== SIDEBAR NAV ITEMS ====================
const sidebarSections = [
  {
    label: "MAIN",
    items: [
      { key: "overview", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "QUALITY OPERATIONS",
    items: [
      { key: "document-requests", label: "Document Requests", icon: FileText },
      { key: "testing-requests", label: "Testing Requests (IRF/TRF)", icon: FlaskConical },
      { key: "test-reports", label: "Test Reports", icon: ClipboardList },
      { key: "batch-management", label: "Batch Management", icon: Boxes },
    ],
  },
  {
    label: "VENDOR MANAGEMENT",
    items: [
      { key: "material-vendors", label: "Material Vendors", icon: Factory },
      { key: "customer-vendor-approvals", label: "Customer Vendor Approvals", icon: UserCheck },
    ],
  },
  {
    label: "COMPLIANCE",
    items: [
      { key: "ncrs", label: "Non-Conformance Reports (NCR)", icon: AlertTriangle },
    ],
  },
  {
    label: "HR",
    items: [
      { key: "my-attendance", label: "My Attendance", icon: Calendar },
    ],
  },
  {
    label: "PROFILE",
    items: [
      { key: "profile-settings", label: "Profile Settings", icon: Settings },
    ],
  },
];

// ==================== MAIN COMPONENT ====================
export default function QualityDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [qualityUser, setQualityUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        toast({ title: "Authentication Required", description: "Please login to access quality dashboard.", variant: "destructive" });
        window.location.href = "/api/login";
        return;
      }
      const role = (user as any).role;
      if (role !== "quality_manager" && role !== "quality_executive") {
        toast({ title: "Access Denied", description: "Quality department privileges required.", variant: "destructive" });
        window.location.href = "/";
        return;
      }
      setQualityUser(user);
      setAuthLoading(false);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const roleDisplayName = (qualityUser as any)?.role?.replace(/_/g, " ").toUpperCase() || "";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading quality dashboard...</p>
        </div>
      </div>
    );
  }

  if (!qualityUser) return null;

  const sectionTitles: Record<string, string> = {
    overview: "Dashboard",
    "document-requests": "Document Requests",
    "testing-requests": "Testing Requests (IRF/TRF)",
    "test-reports": "Test Reports",
    "batch-management": "Batch Management",
    "material-vendors": "Material Vendors",
    "customer-vendor-approvals": "Customer Vendor Approvals",
    ncrs: "Non-Conformance Reports (NCR)",
    "my-attendance": "My Attendance",
    "profile-settings": "Profile Settings",
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'} md:flex w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex-col`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quality Portal</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{roleDisplayName}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {sidebarSections.map((section) => (
              <div key={section.label}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.label}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
                        className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                          activeSection === item.key
                            ? "bg-blue-100 text-blue-900 border border-blue-200"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => (window.location.href = "/api/logout")}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {sectionTitles[activeSection] || "Dashboard"}
                </h1>
                <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">{roleDisplayName} Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PunchInOutButton />
              <Badge variant="secondary" className="hidden md:inline-flex bg-blue-100 text-blue-800">
                {roleDisplayName}
              </Badge>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === "overview" && <DashboardOverview user={qualityUser} />}
          {activeSection === "document-requests" && <DocumentRequestsSection />}
          {activeSection === "testing-requests" && <TestingRequestsSection />}
          {activeSection === "test-reports" && <TestReportsSection />}
          {activeSection === "batch-management" && <BatchManagementSection />}
          {activeSection === "material-vendors" && <MaterialVendorsSection />}
          {activeSection === "customer-vendor-approvals" && <CustomerVendorApprovalsSection />}
          {activeSection === "ncrs" && <NCRsSection />}
          {activeSection === "my-attendance" && <MyAttendance />}
          {activeSection === "profile-settings" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div><Label>Name</Label><p className="text-sm mt-1">{(qualityUser as any).firstName} {(qualityUser as any).lastName}</p></div>
                  <div><Label>Email</Label><p className="text-sm mt-1">{(qualityUser as any).email}</p></div>
                  <div><Label>Role</Label><p className="text-sm mt-1">{(qualityUser as any).role?.replace(/_/g, " ")}</p></div>
                  <div><Label>Department</Label><p className="text-sm mt-1">{(qualityUser as any).department || "Quality"}</p></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// ==================== DASHBOARD OVERVIEW ====================
function DashboardOverview({ user }: { user: any }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/quality/dashboard-stats"],
    enabled: !!user,
  });

  const s = (stats as any) || {};

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.firstName || "Quality Team"}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor quality operations, testing requests, and compliance from your dashboard.
        </p>
      </div>

      <div className="mb-6">
        <MyActivityWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Document Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : s.documentRequests?.open ?? 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Testing Requests</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : s.testingRequests?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground">IRF/TRF pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : s.batches?.active ?? 0}</div>
            <p className="text-xs text-muted-foreground">Currently tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vendor Approvals</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : s.vendorApprovals?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground">Vendors awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open NCRs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : s.ncrs?.open ?? 0}</div>
            <p className="text-xs text-muted-foreground">Non-conformance reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Vendor Approvals</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : s.customerVendorApprovals?.received ?? 0}</div>
            <p className="text-xs text-muted-foreground">Pending customer approvals</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quality Activity</CardTitle>
          <CardDescription>Latest actions across quality operations</CardDescription>
        </CardHeader>
        <CardContent>
          {s.recentActivity && (s.recentActivity as any[]).length > 0 ? (
            <div className="space-y-3">
              {(s.recentActivity as any[]).map((activity: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description || activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ""}</p>
                  </div>
                  {activity.status && getStatusBadge(activity.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ==================== DOCUMENT REQUESTS SECTION ====================
function DocumentRequestsSection() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ documentType: "", productName: "", description: "", priority: "normal", notes: "", title: "" });
  const [responseNotes, setResponseNotes] = useState("");
  const [responseDocLink, setResponseDocLink] = useState("");
  const [responseStatus, setResponseStatus] = useState("");

  useEffect(() => {
    if (selectedItem) {
      setResponseNotes(selectedItem.responseNotes || "");
      setResponseDocLink(selectedItem.responseDocumentLink || "");
      setResponseStatus(selectedItem.status || "open");
    }
  }, [selectedItem]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/document-requests", { status: statusFilter, limit: 50, offset: 0 }],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/quality/document-requests", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/document-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Document request created" });
      setShowCreateDialog(false);
      setFormData({ documentType: "", productName: "", description: "", priority: "normal", notes: "", title: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await apiRequest(`/api/quality/document-requests/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/document-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Document request updated" });
      setShowDetailDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const items: any[] = (data as any)?.requests || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create New</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Document Request</DialogTitle>
              <DialogDescription>Create a new document request for quality documentation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Document Type</Label>
                <Select value={formData.documentType} onValueChange={(v) => setFormData({ ...formData, documentType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COA">Certificate of Analysis (COA)</SelectItem>
                    <SelectItem value="MSDS">Material Safety Data Sheet (MSDS)</SelectItem>
                    <SelectItem value="spec_sheet">Specification Sheet</SelectItem>
                    <SelectItem value="organic_cert">Organic Certificate</SelectItem>
                    <SelectItem value="allergen_statement">Allergen Statement</SelectItem>
                    <SelectItem value="non_gmo">Non-GMO Statement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Request title" /></div>
              <div><Label>Material / Product Name</Label><Input value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} placeholder="e.g., Organic Turmeric Powder" /></div>
              <div><Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the document requirement" /></div>
              <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                const payload = {
                  requestType: formData.documentType,
                  title: formData.title || `${formData.documentType} - ${formData.productName}`,
                  materialName: formData.productName,
                  description: formData.description,
                  priority: formData.priority,
                  notes: formData.notes,
                };
                createMutation.mutate(payload);
              }} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No document requests found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell>{item.title || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{item.requestType?.toUpperCase() || "-"}</Badge></TableCell>
                    <TableCell>{item.materialName || "-"}</TableCell>
                    <TableCell>{item.customerName || "-"}</TableCell>
                    <TableCell><Badge variant={item.priority === "urgent" ? "destructive" : "secondary"}>{item.priority}</Badge></TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowDetailDialog(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: item.id, status: "in_progress" })} title="Mark In Progress"><ArrowRight className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Document Request #{selectedItem?.id}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Request Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Title</Label><p className="text-sm mt-1">{selectedItem.title || "N/A"}</p></div>
                  <div><Label>Type</Label><p className="text-sm mt-1">{selectedItem.requestType?.toUpperCase() || "N/A"}</p></div>
                  <div><Label>Material Name</Label><p className="text-sm mt-1">{selectedItem.materialName || "N/A"}</p></div>
                  <div><Label>Customer Name</Label><p className="text-sm mt-1">{selectedItem.customerName || "N/A"}</p></div>
                  <div className="col-span-2"><Label>Description</Label><p className="text-sm mt-1">{selectedItem.description || "N/A"}</p></div>
                  <div className="col-span-2"><Label>Notes</Label><p className="text-sm mt-1">{selectedItem.notes || "N/A"}</p></div>
                  <div><Label>Priority</Label><div className="mt-1"><Badge variant={selectedItem.priority === "urgent" ? "destructive" : "secondary"}>{selectedItem.priority}</Badge></div></div>
                  <div><Label>Status</Label><div className="mt-1">{getStatusBadge(selectedItem.status)}</div></div>
                  <div><Label>Created</Label><p className="text-sm mt-1">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : "N/A"}</p></div>
                </div>
              </div>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quality Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedItem.responseNotes && (
                    <div>
                      <Label className="text-muted-foreground">Current Response Notes</Label>
                      <p className="text-sm mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedItem.responseNotes}</p>
                    </div>
                  )}
                  {selectedItem.responseDocumentLink && (
                    <div>
                      <Label className="text-muted-foreground">Current Document Link</Label>
                      <a href={selectedItem.responseDocumentLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                        <ExternalLink className="h-3 w-3" />{selectedItem.responseDocumentLink}
                      </a>
                    </div>
                  )}
                  <div>
                    <Label>Response Notes</Label>
                    <Textarea value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)} placeholder="Enter response notes..." className="mt-1" />
                  </div>
                  <div>
                    <Label>Google Drive Document Link</Label>
                    <Input value={responseDocLink} onChange={(e) => setResponseDocLink(e.target.value)} placeholder="https://drive.google.com/..." className="mt-1" />
                  </div>
                  <div>
                    <Label>Update Status</Label>
                    <Select value={responseStatus} onValueChange={setResponseStatus}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => updateMutation.mutate({ id: selectedItem.id, responseNotes, responseDocumentLink: responseDocLink, status: responseStatus })}
                    disabled={updateMutation.isPending}
                    className="w-full"
                  >
                    {updateMutation.isPending ? "Sending..." : "Send Response"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== TESTING REQUESTS SECTION ====================
function TestingRequestsSection() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ requestType: "IRF", sampleName: "", batchNumber: "", testParameters: "", priority: "normal", description: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/testing-requests", { status: statusFilter, requestType: typeFilter }],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/quality/testing-requests", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/testing-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Testing request created" });
      setShowCreateDialog(false);
      setFormData({ requestType: "IRF", sampleName: "", batchNumber: "", testParameters: "", priority: "normal", description: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await apiRequest(`/api/quality/testing-requests/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/testing-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Testing request updated" });
      setShowDetailDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const items = (data as any)?.requests || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sample_received">Sample Received</SelectItem>
              <SelectItem value="in_testing">In Testing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="IRF">IRF</SelectItem>
              <SelectItem value="TRF">TRF</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Testing Request</DialogTitle>
              <DialogDescription>Submit an IRF or TRF testing request.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Request Type</Label>
                <Select value={formData.requestType} onValueChange={(v) => setFormData({ ...formData, requestType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IRF">IRF (Incoming Raw material Form)</SelectItem>
                    <SelectItem value="TRF">TRF (Testing Request Form)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Sample Name</Label><Input value={formData.sampleName} onChange={(e) => setFormData({ ...formData, sampleName: e.target.value })} placeholder="e.g., Turmeric Powder Sample" /></div>
              <div><Label>Batch Number</Label><Input value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} placeholder="e.g., BFO-O-TUR-PWD-0226" /></div>
              <div><Label>Test Parameters</Label><Textarea value={formData.testParameters} onChange={(e) => setFormData({ ...formData, testParameters: e.target.value })} placeholder="List test parameters (moisture, ash, microbial, etc.)" /></div>
              <div><Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Additional details" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No testing requests found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell><Badge variant="outline">{item.requestType}</Badge></TableCell>
                    <TableCell>{item.sampleName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.batchNumber || "-"}</TableCell>
                    <TableCell><Badge variant={item.priority === "urgent" ? "destructive" : "secondary"}>{item.priority}</Badge></TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowDetailDialog(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: item.id, status: "in_testing" })}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Testing Request #{selectedItem?.id}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div><Label>Type</Label><p className="text-sm">{selectedItem.requestType}</p></div>
              <div><Label>Sample</Label><p className="text-sm">{selectedItem.sampleName}</p></div>
              <div><Label>Batch #</Label><p className="text-sm font-mono">{selectedItem.batchNumber || "N/A"}</p></div>
              <div><Label>Test Parameters</Label><p className="text-sm">{selectedItem.testParameters || "N/A"}</p></div>
              <div><Label>Status</Label><div className="mt-1">{getStatusBadge(selectedItem.status)}</div></div>
              <div><Label>Update Status</Label>
                <Select onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sample_received">Sample Received</SelectItem>
                    <SelectItem value="in_testing">In Testing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== TEST REPORTS SECTION ====================
function TestReportsSection() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({ testingRequestId: "", batchId: "", reportTitle: "", testResults: "", conclusion: "", testedBy: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/test-reports"],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/quality/test-reports", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/test-reports"] });
      toast({ title: "Test report created" });
      setShowCreateDialog(false);
      setFormData({ testingRequestId: "", batchId: "", reportTitle: "", testResults: "", conclusion: "", testedBy: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const items = (data as any)?.reports || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Report</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Test Report</DialogTitle>
              <DialogDescription>Create a test report for a testing request or batch.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Report Title</Label><Input value={formData.reportTitle} onChange={(e) => setFormData({ ...formData, reportTitle: e.target.value })} placeholder="e.g., Microbial Analysis Report" /></div>
              <div><Label>Testing Request ID</Label><Input value={formData.testingRequestId} onChange={(e) => setFormData({ ...formData, testingRequestId: e.target.value })} placeholder="Reference testing request" /></div>
              <div><Label>Batch ID</Label><Input value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} placeholder="Reference batch" /></div>
              <div><Label>Tested By</Label><Input value={formData.testedBy} onChange={(e) => setFormData({ ...formData, testedBy: e.target.value })} placeholder="Analyst name" /></div>
              <div><Label>Test Results</Label><Textarea value={formData.testResults} onChange={(e) => setFormData({ ...formData, testResults: e.target.value })} placeholder="Detailed test results" rows={4} /></div>
              <div><Label>Conclusion</Label>
                <Select value={formData.conclusion} onValueChange={(v) => setFormData({ ...formData, conclusion: v })}>
                  <SelectTrigger><SelectValue placeholder="Select conclusion" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass - Within Specifications</SelectItem>
                    <SelectItem value="fail">Fail - Out of Specifications</SelectItem>
                    <SelectItem value="conditional">Conditional - Partially Meets Specs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Testing Req #</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Tested By</TableHead>
                <TableHead>Conclusion</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No test reports found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell>{item.reportTitle}</TableCell>
                    <TableCell className="font-mono text-sm">{item.testingRequestId || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{item.batchId || "-"}</TableCell>
                    <TableCell>{item.testedBy}</TableCell>
                    <TableCell>{getStatusBadge(item.conclusion === "pass" ? "approved" : item.conclusion === "fail" ? "rejected" : item.conclusion || "pending")}</TableCell>
                    <TableCell className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== BATCH MANAGEMENT SECTION ====================
function BatchManagementSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "create-rm" | "create-fg">("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const [rmForm, setRmForm] = useState({
    companyShort: "BFO", organicType: "O", materialCode: "", materialForm: "PWD",
    materialName: "", manufacturingDate: "", unitOfMeasure: "KG",
    totalQuantity: "", supplierName: "", supplierBatchRef: "", storageLocation: "",
    expiryDate: "", notes: "",
    visualStatus: "pending", visualNotes: "",
    moistureExpected: "", moistureActual: "", moistureUnit: "%", moistureMin: "", moistureMax: "",
  });
  const [rmCustomTests, setRmCustomTests] = useState<any[]>([]);

  const [fgForm, setFgForm] = useState({
    companyShort: "BFO", organicType: "O", materialCode: "", materialForm: "PWD",
    materialName: "", manufacturingDate: "", unitOfMeasure: "KG",
    totalQuantity: "", notes: "",
  });
  const [fgCustomTests, setFgCustomTests] = useState<any[]>([]);
  const [selectedRmBatches, setSelectedRmBatches] = useState<Record<number, number>>({});

  const rmBatchPreview = useMemo(() => {
    return [rmForm.companyShort || "BFO", rmForm.organicType || "O", rmForm.materialCode || "XXX", rmForm.materialForm || "PWD", rmForm.manufacturingDate || "MMYY"].join("-");
  }, [rmForm.companyShort, rmForm.organicType, rmForm.materialCode, rmForm.materialForm, rmForm.manufacturingDate]);

  const fgBatchPreview = useMemo(() => {
    return [fgForm.companyShort || "BFO", fgForm.organicType || "O", fgForm.materialCode || "XXX", fgForm.materialForm || "PWD", fgForm.manufacturingDate || "MMYY"].join("-");
  }, [fgForm.companyShort, fgForm.organicType, fgForm.materialCode, fgForm.materialForm, fgForm.manufacturingDate]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/batches", { batchType: typeFilter, status: statusFilter }],
  });

  const { data: approvedRmData } = useQuery({
    queryKey: ["/api/quality/batches/approved-rm"],
    enabled: activeTab === "create-fg",
  });

  const items = (data as any)?.batches || (data as any)?.data || (Array.isArray(data) ? data : []);
  const approvedRmBatches: any[] = (approvedRmData as any)?.batches || (approvedRmData as any)?.data || (Array.isArray(approvedRmData) ? approvedRmData : []);

  const totalRmInput = useMemo(() => {
    return Object.values(selectedRmBatches).reduce((sum, qty) => sum + (qty || 0), 0);
  }, [selectedRmBatches]);
  const fgOutput = parseFloat(fgForm.totalQuantity) || 0;
  const processLoss = totalRmInput - fgOutput;
  const processLossPercent = totalRmInput > 0 ? ((processLoss / totalRmInput) * 100).toFixed(1) : "0";

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/quality/batches"] });
    queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
  };

  const createRmMutation = useMutation({
    mutationFn: async () => {
      const batchBody = {
        batchNumber: rmBatchPreview, materialName: rmForm.materialName, materialCode: rmForm.materialCode,
        materialForm: rmForm.materialForm, batchType: "raw_material", status: "created",
        companyShort: rmForm.companyShort, organicType: rmForm.organicType, manufacturingDate: rmForm.manufacturingDate,
        totalQuantity: parseFloat(rmForm.totalQuantity) || 0, unitOfMeasure: rmForm.unitOfMeasure,
        supplierName: rmForm.supplierName, supplierBatchRef: rmForm.supplierBatchRef,
        storageLocation: rmForm.storageLocation, expiryDate: rmForm.expiryDate || null,
        notes: rmForm.notes,
        visualInspectionStatus: rmForm.visualStatus, visualInspectionNotes: rmForm.visualNotes,
        customTestParameters: rmCustomTests,
      };
      const res = await apiRequest("/api/quality/batches", { method: "POST", body: JSON.stringify(batchBody) });
      const batchResult = await res.json();
      const batchId = batchResult.id || batchResult.batch?.id;
      if (batchId) {
        if (rmForm.moistureExpected || rmForm.moistureActual) {
          await apiRequest(`/api/quality/batches/${batchId}/test-results`, {
            method: "POST",
            body: JSON.stringify({
              testName: "Moisture", expectedValue: rmForm.moistureExpected, actualValue: rmForm.moistureActual,
              unit: rmForm.moistureUnit, minRange: rmForm.moistureMin, maxRange: rmForm.moistureMax,
              result: "pending",
            }),
          });
        }
        for (const ct of rmCustomTests) {
          if (ct.testName) {
            await apiRequest(`/api/quality/batches/${batchId}/test-results`, {
              method: "POST",
              body: JSON.stringify({
                testName: ct.testName, expectedValue: ct.expectedValue, unit: ct.unit,
                minRange: ct.minRange, maxRange: ct.maxRange, result: "pending",
              }),
            });
          }
        }
      }
      return batchResult;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "RM Batch created successfully" });
      setRmForm({ companyShort: "BFO", organicType: "O", materialCode: "", materialForm: "PWD", materialName: "", manufacturingDate: "", unitOfMeasure: "KG", totalQuantity: "", supplierName: "", supplierBatchRef: "", storageLocation: "", expiryDate: "", notes: "", visualStatus: "pending", visualNotes: "", moistureExpected: "", moistureActual: "", moistureUnit: "%", moistureMin: "", moistureMax: "" });
      setRmCustomTests([]);
      setActiveTab("all");
    },
    onError: (e: any) => toast({ title: "Error creating batch", description: e.message, variant: "destructive" }),
  });

  const createFgMutation = useMutation({
    mutationFn: async () => {
      const fgBatchData = {
        batchNumber: fgBatchPreview, materialName: fgForm.materialName, materialCode: fgForm.materialCode,
        materialForm: fgForm.materialForm, batchType: "finished_good", status: "created",
        companyShort: fgForm.companyShort, organicType: fgForm.organicType, manufacturingDate: fgForm.manufacturingDate,
        totalQuantity: fgOutput, unitOfMeasure: fgForm.unitOfMeasure, notes: fgForm.notes,
        customTestParameters: fgCustomTests,
      };
      const rmConsumptions = Object.entries(selectedRmBatches)
        .filter(([_, qty]) => qty > 0)
        .map(([batchId, quantityUsed]) => ({ rmBatchId: parseInt(batchId), quantityUsed }));
      const res = await apiRequest("/api/quality/batches/transfer-rm-to-fg", {
        method: "POST",
        body: JSON.stringify({ fgBatchData, rmConsumptions }),
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "FG Batch created & RM consumption recorded" });
      setFgForm({ companyShort: "BFO", organicType: "O", materialCode: "", materialForm: "PWD", materialName: "", manufacturingDate: "", unitOfMeasure: "KG", totalQuantity: "", notes: "" });
      setFgCustomTests([]);
      setSelectedRmBatches({});
      setActiveTab("all");
    },
    onError: (e: any) => toast({ title: "Error creating FG batch", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approvedQuantity }: { id: number; approvedQuantity: number }) => {
      const res = await apiRequest(`/api/quality/batches/${id}/approve`, { method: "POST", body: JSON.stringify({ approvedQuantity }) });
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Batch approved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/quality/batches/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Batch rejected" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest(`/api/quality/batches/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Status updated" }); setShowDetailDialog(false); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function getBatchStatusBadge(status: string) {
    const s = status?.toLowerCase();
    const map: Record<string, string> = {
      created: "bg-gray-100 text-gray-800 border-gray-200",
      testing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      partially_used: "bg-blue-100 text-blue-800 border-blue-200",
      consumed: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return <Badge className={map[s] || "bg-gray-100 text-gray-800"}>{status?.replace(/_/g, " ")}</Badge>;
  }

  function getVisualBadge(status: string) {
    if (!status) return <Badge variant="secondary">Pending</Badge>;
    const s = status.toLowerCase();
    if (s === "pass") return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
    if (s === "fail") return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
    if (s === "conditional") return <Badge className="bg-yellow-100 text-yellow-800">Conditional</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  }

  const tabs = [
    { key: "all" as const, label: "All Batches" },
    { key: "create-rm" as const, label: "Create RM Batch" },
    { key: "create-fg" as const, label: "Create FG Batch / RM-to-FG Transfer" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b pb-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === t.key ? "bg-blue-100 text-blue-900 border border-b-0 border-blue-200" : "text-gray-600 hover:bg-gray-100"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "all" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="partially_used">Partially Used</SelectItem>
                <SelectItem value="consumed">Consumed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="raw_material">Raw Material</SelectItem>
                <SelectItem value="finished_good">Finished Good</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visual</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : items.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No batches found. Create your first batch above.</TableCell></TableRow>
                  ) : (
                    items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium text-sm">{item.batchNumber}</TableCell>
                        <TableCell>{item.materialName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.batchType === "raw_material" ? "border-orange-300 text-orange-700" : "border-indigo-300 text-indigo-700"}>
                            {item.batchType === "raw_material" ? "RM" : "FG"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.totalQuantity ?? "-"} {item.unitOfMeasure || ""}</TableCell>
                        <TableCell>{getBatchStatusBadge(item.status)}</TableCell>
                        <TableCell>{getVisualBadge(item.visualInspectionStatus)}</TableCell>
                        <TableCell className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" title="View" onClick={() => { setSelectedBatch(item); setShowDetailDialog(true); }}><Eye className="h-4 w-4" /></Button>
                            {(item.status === "created" || item.status === "testing") && (
                              <>
                                <Button size="sm" variant="ghost" title="Approve" className="text-green-600" onClick={() => approveMutation.mutate({ id: item.id, approvedQuantity: item.totalQuantity || 0 })}><CheckCircle className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" title="Reject" className="text-red-600" onClick={() => rejectMutation.mutate(item.id)}><XCircle className="h-4 w-4" /></Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "create-rm" && (
        <Card>
          <CardHeader>
            <CardTitle>Create Raw Material Batch</CardTitle>
            <CardDescription>Register a new raw material batch with quality parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Label className="text-xs text-blue-600 uppercase tracking-wider">Batch Number Preview</Label>
              <p className="text-2xl font-bold font-mono mt-1 text-blue-900 dark:text-blue-100">{rmBatchPreview}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Company Short</Label><Input value={rmForm.companyShort} onChange={(e) => setRmForm({ ...rmForm, companyShort: e.target.value.toUpperCase() })} placeholder="BFO" maxLength={5} /></div>
              <div><Label>Organic Type</Label>
                <Select value={rmForm.organicType} onValueChange={(v) => setRmForm({ ...rmForm, organicType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="O">O - Organic</SelectItem><SelectItem value="C">C - Conventional</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Material Code</Label><Input value={rmForm.materialCode} onChange={(e) => setRmForm({ ...rmForm, materialCode: e.target.value.toUpperCase() })} placeholder="TUR/CUM/ASH" maxLength={5} /></div>
              <div><Label>Material Form</Label>
                <Select value={rmForm.materialForm} onValueChange={(v) => setRmForm({ ...rmForm, materialForm: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PWD">PWD - Powder</SelectItem><SelectItem value="WHL">WHL - Whole</SelectItem>
                    <SelectItem value="FLX">FLX - Flakes</SelectItem><SelectItem value="CUB">CUB - Cubes</SelectItem>
                    <SelectItem value="EXT">EXT - Extract</SelectItem><SelectItem value="OIL">OIL - Oil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Material Name</Label><Input value={rmForm.materialName} onChange={(e) => setRmForm({ ...rmForm, materialName: e.target.value })} placeholder="e.g., Turmeric, Cumin, Ashwagandha" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Manufacturing Date (MMYY)</Label><Input value={rmForm.manufacturingDate} onChange={(e) => setRmForm({ ...rmForm, manufacturingDate: e.target.value })} placeholder="e.g., 0226" maxLength={4} /></div>
              <div><Label>Unit of Measure</Label>
                <Select value={rmForm.unitOfMeasure} onValueChange={(v) => setRmForm({ ...rmForm, unitOfMeasure: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="KG">KG</SelectItem><SelectItem value="MT">MT</SelectItem><SelectItem value="LBS">LBS</SelectItem><SelectItem value="G">G</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Total Quantity</Label><Input type="number" value={rmForm.totalQuantity} onChange={(e) => setRmForm({ ...rmForm, totalQuantity: e.target.value })} placeholder="0" /></div>
              <div><Label>Supplier Name</Label><Input value={rmForm.supplierName} onChange={(e) => setRmForm({ ...rmForm, supplierName: e.target.value })} placeholder="Supplier name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Supplier Batch Ref</Label><Input value={rmForm.supplierBatchRef} onChange={(e) => setRmForm({ ...rmForm, supplierBatchRef: e.target.value })} placeholder="Supplier batch reference" /></div>
              <div><Label>Storage Location</Label><Input value={rmForm.storageLocation} onChange={(e) => setRmForm({ ...rmForm, storageLocation: e.target.value })} placeholder="Warehouse/Location" /></div>
            </div>
            <div><Label>Expiry Date</Label><Input type="date" value={rmForm.expiryDate} onChange={(e) => setRmForm({ ...rmForm, expiryDate: e.target.value })} /></div>

            <Card className="border-2">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" /> Visual Inspection</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Status</Label>
                  <Select value={rmForm.visualStatus} onValueChange={(v) => setRmForm({ ...rmForm, visualStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="pass">Pass</SelectItem><SelectItem value="fail">Fail</SelectItem><SelectItem value="conditional">Conditional</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Notes</Label><Textarea value={rmForm.visualNotes} onChange={(e) => setRmForm({ ...rmForm, visualNotes: e.target.value })} placeholder="Visual inspection notes" /></div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Beaker className="h-4 w-4" /> Standard Test: Moisture</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  <div><Label>Expected</Label><Input value={rmForm.moistureExpected} onChange={(e) => setRmForm({ ...rmForm, moistureExpected: e.target.value })} placeholder="e.g., 8" /></div>
                  <div><Label>Actual</Label><Input value={rmForm.moistureActual} onChange={(e) => setRmForm({ ...rmForm, moistureActual: e.target.value })} placeholder="e.g., 7.5" /></div>
                  <div><Label>Unit</Label><Input value={rmForm.moistureUnit} onChange={(e) => setRmForm({ ...rmForm, moistureUnit: e.target.value })} /></div>
                  <div><Label>Min</Label><Input value={rmForm.moistureMin} onChange={(e) => setRmForm({ ...rmForm, moistureMin: e.target.value })} placeholder="e.g., 5" /></div>
                  <div><Label>Max</Label><Input value={rmForm.moistureMax} onChange={(e) => setRmForm({ ...rmForm, moistureMax: e.target.value })} placeholder="e.g., 12" /></div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Custom Test Parameters</Label>
                <Button variant="outline" size="sm" onClick={() => setRmCustomTests([...rmCustomTests, { testName: "", expectedValue: "", unit: "", minRange: "", maxRange: "" }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Custom Test
                </Button>
              </div>
              {rmCustomTests.map((ct, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                  <div><Label className="text-xs">Test Name</Label><Input value={ct.testName} onChange={(e) => { const u = [...rmCustomTests]; u[idx].testName = e.target.value; setRmCustomTests(u); }} placeholder="e.g., Curcumin" /></div>
                  <div><Label className="text-xs">Expected</Label><Input value={ct.expectedValue} onChange={(e) => { const u = [...rmCustomTests]; u[idx].expectedValue = e.target.value; setRmCustomTests(u); }} /></div>
                  <div><Label className="text-xs">Unit</Label><Input value={ct.unit} onChange={(e) => { const u = [...rmCustomTests]; u[idx].unit = e.target.value; setRmCustomTests(u); }} placeholder="%" /></div>
                  <div><Label className="text-xs">Min</Label><Input value={ct.minRange} onChange={(e) => { const u = [...rmCustomTests]; u[idx].minRange = e.target.value; setRmCustomTests(u); }} /></div>
                  <div><Label className="text-xs">Max</Label><Input value={ct.maxRange} onChange={(e) => { const u = [...rmCustomTests]; u[idx].maxRange = e.target.value; setRmCustomTests(u); }} /></div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setRmCustomTests(rmCustomTests.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>

            <div><Label>Notes</Label><Textarea value={rmForm.notes} onChange={(e) => setRmForm({ ...rmForm, notes: e.target.value })} placeholder="Additional notes" /></div>

            <Button onClick={() => createRmMutation.mutate()} disabled={createRmMutation.isPending} className="w-full">
              {createRmMutation.isPending ? "Creating..." : "Create RM Batch"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "create-fg" && (
        <Card>
          <CardHeader>
            <CardTitle>Create FG Batch / RM-to-FG Transfer</CardTitle>
            <CardDescription>Create a finished good batch from raw materials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Label className="text-xs text-blue-600 uppercase tracking-wider">FG Batch Number Preview</Label>
              <p className="text-2xl font-bold font-mono mt-1 text-blue-900 dark:text-blue-100">{fgBatchPreview}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Company Short</Label><Input value={fgForm.companyShort} onChange={(e) => setFgForm({ ...fgForm, companyShort: e.target.value.toUpperCase() })} placeholder="BFO" maxLength={5} /></div>
              <div><Label>Organic Type</Label>
                <Select value={fgForm.organicType} onValueChange={(v) => setFgForm({ ...fgForm, organicType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="O">O - Organic</SelectItem><SelectItem value="C">C - Conventional</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Material Code</Label><Input value={fgForm.materialCode} onChange={(e) => setFgForm({ ...fgForm, materialCode: e.target.value.toUpperCase() })} placeholder="TUR/CUM/ASH" maxLength={5} /></div>
              <div><Label>Material Form</Label>
                <Select value={fgForm.materialForm} onValueChange={(v) => setFgForm({ ...fgForm, materialForm: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PWD">PWD - Powder</SelectItem><SelectItem value="WHL">WHL - Whole</SelectItem>
                    <SelectItem value="FLX">FLX - Flakes</SelectItem><SelectItem value="CUB">CUB - Cubes</SelectItem>
                    <SelectItem value="EXT">EXT - Extract</SelectItem><SelectItem value="OIL">OIL - Oil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Material Name</Label><Input value={fgForm.materialName} onChange={(e) => setFgForm({ ...fgForm, materialName: e.target.value })} placeholder="e.g., Turmeric Powder (Finished)" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Manufacturing Date (MMYY)</Label><Input value={fgForm.manufacturingDate} onChange={(e) => setFgForm({ ...fgForm, manufacturingDate: e.target.value })} placeholder="e.g., 0226" maxLength={4} /></div>
              <div><Label>Unit of Measure</Label>
                <Select value={fgForm.unitOfMeasure} onValueChange={(v) => setFgForm({ ...fgForm, unitOfMeasure: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="KG">KG</SelectItem><SelectItem value="MT">MT</SelectItem><SelectItem value="LBS">LBS</SelectItem><SelectItem value="G">G</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Total Quantity (FG Output)</Label><Input type="number" value={fgForm.totalQuantity} onChange={(e) => setFgForm({ ...fgForm, totalQuantity: e.target.value })} placeholder="0" /></div>

            <Card className="border-2">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Select Raw Materials</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {approvedRmBatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved RM batches available.</p>
                ) : (
                  approvedRmBatches.map((rm: any) => {
                    const isSelected = selectedRmBatches[rm.id] !== undefined;
                    const remaining = rm.remainingQuantity ?? (rm.approvedQuantity ?? rm.totalQuantity ?? 0) - (rm.usedQuantity ?? 0);
                    return (
                      <div key={rm.id} className={`p-3 rounded-lg border ${isSelected ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200"}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={isSelected} onChange={(e) => {
                            const next = { ...selectedRmBatches };
                            if (e.target.checked) { next[rm.id] = 0; } else { delete next[rm.id]; }
                            setSelectedRmBatches(next);
                          }} className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-mono text-sm font-medium">{rm.batchNumber}</p>
                            <p className="text-xs text-muted-foreground">{rm.materialName} — Remaining: {remaining} {rm.unitOfMeasure || ""}</p>
                          </div>
                          {isSelected && (
                            <div className="w-32">
                              <Input type="number" placeholder="Qty to use" value={selectedRmBatches[rm.id] || ""}
                                onChange={(e) => setSelectedRmBatches({ ...selectedRmBatches, [rm.id]: parseFloat(e.target.value) || 0 })}
                                max={remaining} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {Object.keys(selectedRmBatches).length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
                    <p className="text-sm"><span className="font-medium">Total RM Input:</span> {totalRmInput}</p>
                    <p className="text-sm"><span className="font-medium">FG Output:</span> {fgOutput}</p>
                    <p className="text-sm"><span className="font-medium">Process Loss:</span> {processLoss > 0 ? processLoss.toFixed(2) : 0} ({processLossPercent}%)</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Custom Tests for FG</Label>
                <Button variant="outline" size="sm" onClick={() => setFgCustomTests([...fgCustomTests, { testName: "", expectedValue: "", unit: "", minRange: "", maxRange: "" }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Test Parameter
                </Button>
              </div>
              {fgCustomTests.map((ct, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                  <div><Label className="text-xs">Test Name</Label><Input value={ct.testName} onChange={(e) => { const u = [...fgCustomTests]; u[idx].testName = e.target.value; setFgCustomTests(u); }} /></div>
                  <div><Label className="text-xs">Expected</Label><Input value={ct.expectedValue} onChange={(e) => { const u = [...fgCustomTests]; u[idx].expectedValue = e.target.value; setFgCustomTests(u); }} /></div>
                  <div><Label className="text-xs">Unit</Label><Input value={ct.unit} onChange={(e) => { const u = [...fgCustomTests]; u[idx].unit = e.target.value; setFgCustomTests(u); }} /></div>
                  <div><Label className="text-xs">Min</Label><Input value={ct.minRange} onChange={(e) => { const u = [...fgCustomTests]; u[idx].minRange = e.target.value; setFgCustomTests(u); }} /></div>
                  <div><Label className="text-xs">Max</Label><Input value={ct.maxRange} onChange={(e) => { const u = [...fgCustomTests]; u[idx].maxRange = e.target.value; setFgCustomTests(u); }} /></div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setFgCustomTests(fgCustomTests.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>

            <div><Label>Notes</Label><Textarea value={fgForm.notes} onChange={(e) => setFgForm({ ...fgForm, notes: e.target.value })} placeholder="Additional notes" /></div>

            <Button onClick={() => createFgMutation.mutate()} disabled={createFgMutation.isPending} className="w-full">
              {createFgMutation.isPending ? "Creating..." : "Create FG Batch & Record Consumption"}
            </Button>
          </CardContent>
        </Card>
      )}

      <BatchDetailDialog
        batch={selectedBatch}
        open={showDetailDialog}
        onOpenChange={(open) => { setShowDetailDialog(open); if (!open) setSelectedBatch(null); }}
        onApprove={(id, qty) => approveMutation.mutate({ id, approvedQuantity: qty })}
        onReject={(id) => rejectMutation.mutate(id)}
        onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
      />
    </div>
  );
}

function BatchDetailDialog({ batch, open, onOpenChange, onApprove, onReject, onUpdateStatus }: {
  batch: any; open: boolean; onOpenChange: (open: boolean) => void;
  onApprove: (id: number, qty: number) => void; onReject: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const { toast } = useToast();
  const [approveQty, setApproveQty] = useState("");
  const [newTestForm, setNewTestForm] = useState({ testName: "", expectedValue: "", actualValue: "", unit: "", minRange: "", maxRange: "", result: "pending", notes: "" });

  const { data: testResults, refetch: refetchTests } = useQuery({
    queryKey: ["/api/quality/batches", batch?.id, "test-results"],
    enabled: !!batch?.id && open,
  });

  const { data: consumptionsData } = useQuery({
    queryKey: ["/api/quality/batches", batch?.id, "consumptions", { type: batch?.batchType === "raw_material" ? "rm" : "fg" }],
    enabled: !!batch?.id && open,
  });

  const addTestMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest(`/api/quality/batches/${batch.id}/test-results`, { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ["/api/quality/batches"] });
      toast({ title: "Test result added" });
      setNewTestForm({ testName: "", expectedValue: "", actualValue: "", unit: "", minRange: "", maxRange: "", result: "pending", notes: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const tests: any[] = (testResults as any)?.testResults || (testResults as any)?.data || (Array.isArray(testResults) ? testResults : []);
  const consumptions: any[] = (consumptionsData as any)?.consumptions || (consumptionsData as any)?.data || (Array.isArray(consumptionsData) ? consumptionsData : []);

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Batch: {batch.batchNumber}</DialogTitle>
          <DialogDescription>Batch lifecycle details and test management</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><Label className="text-xs text-muted-foreground">Batch Number</Label><p className="font-mono font-bold">{batch.batchNumber}</p></div>
            <div><Label className="text-xs text-muted-foreground">Material</Label><p>{batch.materialName}</p></div>
            <div><Label className="text-xs text-muted-foreground">Type</Label><Badge variant="outline">{batch.batchType === "raw_material" ? "Raw Material" : "Finished Good"}</Badge></div>
            <div><Label className="text-xs text-muted-foreground">Status</Label><div className="mt-1"><Badge className={
              batch.status === "approved" ? "bg-green-100 text-green-800" :
              batch.status === "rejected" ? "bg-red-100 text-red-800" :
              batch.status === "testing" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }>{batch.status?.replace(/_/g, " ")}</Badge></div></div>
            <div><Label className="text-xs text-muted-foreground">Total Qty</Label><p>{batch.totalQuantity ?? "-"} {batch.unitOfMeasure || ""}</p></div>
            <div><Label className="text-xs text-muted-foreground">Approved Qty</Label><p>{batch.approvedQuantity ?? "-"}</p></div>
            <div><Label className="text-xs text-muted-foreground">Used Qty</Label><p>{batch.usedQuantity ?? "-"}</p></div>
            <div><Label className="text-xs text-muted-foreground">Remaining Qty</Label><p>{batch.remainingQuantity ?? "-"}</p></div>
            <div><Label className="text-xs text-muted-foreground">Visual Inspection</Label><div className="mt-1">{batch.visualInspectionStatus ? <Badge className={batch.visualInspectionStatus === "pass" ? "bg-green-100 text-green-800" : batch.visualInspectionStatus === "fail" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>{batch.visualInspectionStatus}</Badge> : <Badge variant="secondary">Pending</Badge>}</div></div>
            {batch.visualInspectionNotes && <div className="col-span-2"><Label className="text-xs text-muted-foreground">Visual Notes</Label><p className="text-sm">{batch.visualInspectionNotes}</p></div>}
            {batch.supplierName && <div><Label className="text-xs text-muted-foreground">Supplier</Label><p className="text-sm">{batch.supplierName}</p></div>}
            {batch.storageLocation && <div><Label className="text-xs text-muted-foreground">Storage</Label><p className="text-sm">{batch.storageLocation}</p></div>}
            {batch.expiryDate && <div><Label className="text-xs text-muted-foreground">Expiry</Label><p className="text-sm">{new Date(batch.expiryDate).toLocaleDateString()}</p></div>}
            {batch.processLoss !== undefined && batch.processLoss !== null && <div><Label className="text-xs text-muted-foreground">Process Loss</Label><p className="text-sm">{batch.processLoss}</p></div>}
          </div>

          {(batch.status === "created" || batch.status === "testing") && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3"><CardTitle className="text-base">Status Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                  <Button variant="outline" size="sm" onClick={() => onUpdateStatus(batch.id, "testing")}><Beaker className="h-4 w-4 mr-1" /> Start Testing</Button>
                  <div className="flex gap-2 items-end">
                    <div><Label className="text-xs">Approved Qty</Label><Input className="w-28" type="number" value={approveQty} onChange={(e) => setApproveQty(e.target.value)} placeholder={String(batch.totalQuantity || 0)} /></div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(batch.id, parseFloat(approveQty) || batch.totalQuantity || 0)}><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => onReject(batch.id)}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Test Results</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {tests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead><TableHead>Expected</TableHead><TableHead>Actual</TableHead>
                      <TableHead>Unit</TableHead><TableHead>Range</TableHead><TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((t: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{t.testName}</TableCell>
                        <TableCell>{t.expectedValue ?? "-"}</TableCell>
                        <TableCell>{t.actualValue ?? "-"}</TableCell>
                        <TableCell>{t.unit || "-"}</TableCell>
                        <TableCell>{t.minRange ?? "-"} - {t.maxRange ?? "-"}</TableCell>
                        <TableCell><Badge className={t.result === "pass" ? "bg-green-100 text-green-800" : t.result === "fail" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>{t.result || "pending"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No test results yet.</p>
              )}

              <div className="border-t pt-4 space-y-3">
                <Label className="font-semibold">Add Test Result</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label className="text-xs">Test Name</Label><Input value={newTestForm.testName} onChange={(e) => setNewTestForm({ ...newTestForm, testName: e.target.value })} placeholder="e.g., Moisture" /></div>
                  <div><Label className="text-xs">Expected</Label><Input value={newTestForm.expectedValue} onChange={(e) => setNewTestForm({ ...newTestForm, expectedValue: e.target.value })} /></div>
                  <div><Label className="text-xs">Actual</Label><Input value={newTestForm.actualValue} onChange={(e) => setNewTestForm({ ...newTestForm, actualValue: e.target.value })} /></div>
                  <div><Label className="text-xs">Unit</Label><Input value={newTestForm.unit} onChange={(e) => setNewTestForm({ ...newTestForm, unit: e.target.value })} placeholder="%" /></div>
                  <div><Label className="text-xs">Min Range</Label><Input value={newTestForm.minRange} onChange={(e) => setNewTestForm({ ...newTestForm, minRange: e.target.value })} /></div>
                  <div><Label className="text-xs">Max Range</Label><Input value={newTestForm.maxRange} onChange={(e) => setNewTestForm({ ...newTestForm, maxRange: e.target.value })} /></div>
                  <div><Label className="text-xs">Result</Label>
                    <Select value={newTestForm.result} onValueChange={(v) => setNewTestForm({ ...newTestForm, result: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="pass">Pass</SelectItem><SelectItem value="fail">Fail</SelectItem><SelectItem value="conditional">Conditional</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Notes</Label><Input value={newTestForm.notes} onChange={(e) => setNewTestForm({ ...newTestForm, notes: e.target.value })} /></div>
                </div>
                <Button size="sm" onClick={() => addTestMutation.mutate(newTestForm)} disabled={addTestMutation.isPending || !newTestForm.testName}>
                  {addTestMutation.isPending ? "Adding..." : "Add Test Result"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {batch.batchType === "raw_material" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Consumption History</CardTitle><CardDescription>FG batches that used this RM</CardDescription></CardHeader>
              <CardContent>
                {consumptions.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>FG Batch</TableHead><TableHead>Quantity Used</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {consumptions.map((c: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{c.fgBatchNumber || c.batchNumber || "-"}</TableCell>
                          <TableCell>{c.quantityUsed ?? "-"}</TableCell>
                          <TableCell className="text-sm">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">No consumption records yet.</p>}
              </CardContent>
            </Card>
          )}

          {batch.batchType === "finished_good" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Source Materials</CardTitle><CardDescription>RM batches used to create this FG</CardDescription></CardHeader>
              <CardContent>
                {consumptions.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>RM Batch</TableHead><TableHead>Material</TableHead><TableHead>Quantity Used</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {consumptions.map((c: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{c.rmBatchNumber || c.batchNumber || "-"}</TableCell>
                          <TableCell>{c.materialName || "-"}</TableCell>
                          <TableCell>{c.quantityUsed ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">No source materials recorded.</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MATERIAL VENDORS SECTION ====================
function MaterialVendorsSection() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ vendorName: "", contactPerson: "", email: "", phone: "", address: "", materialTypes: "", certifications: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/vendors", { approvalStatus: statusFilter, search: searchTerm }],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/quality/vendors", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Vendor added" });
      setShowCreateDialog(false);
      setFormData({ vendorName: "", contactPerson: "", email: "", phone: "", address: "", materialTypes: "", certifications: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await apiRequest(`/api/quality/vendors/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Vendor updated" });
      setShowDetailDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const items = (data as any)?.vendors || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 w-[220px]" placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="conditionally_approved">Conditionally Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Vendor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Material Vendor</DialogTitle>
              <DialogDescription>Register a new material vendor for quality approval.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Vendor Name</Label><Input value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} placeholder="Company name" /></div>
              <div><Label>Contact Person</Label><Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Primary contact" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@vendor.com" /></div>
                <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91..." /></div>
              </div>
              <div><Label>Address</Label><Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" /></div>
              <div><Label>Material Types Supplied</Label><Input value={formData.materialTypes} onChange={(e) => setFormData({ ...formData, materialTypes: e.target.value })} placeholder="e.g., Turmeric, Cumin, Ashwagandha" /></div>
              <div><Label>Certifications</Label><Input value={formData.certifications} onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} placeholder="e.g., FSSAI, ISO 22000, Organic" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Vendor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No vendors found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell className="font-medium">{item.vendorName}</TableCell>
                    <TableCell><div className="text-sm">{item.contactPerson}</div><div className="text-xs text-muted-foreground">{item.email}</div></TableCell>
                    <TableCell className="text-sm">{item.materialTypes}</TableCell>
                    <TableCell>{getStatusBadge(item.approvalStatus || item.status || "pending")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowDetailDialog(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: item.id, approvalStatus: "approved" })}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vendor: {selectedItem?.vendorName}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div><Label>Name</Label><p className="text-sm">{selectedItem.vendorName}</p></div>
              <div><Label>Contact</Label><p className="text-sm">{selectedItem.contactPerson} - {selectedItem.email}</p></div>
              <div><Label>Materials</Label><p className="text-sm">{selectedItem.materialTypes}</p></div>
              <div><Label>Certifications</Label><p className="text-sm">{selectedItem.certifications || "N/A"}</p></div>
              <div><Label>Approval Status</Label><div className="mt-1">{getStatusBadge(selectedItem.approvalStatus || selectedItem.status || "pending")}</div></div>
              <div><Label>Update Approval Status</Label>
                <Select onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, approvalStatus: v })}>
                  <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="conditionally_approved">Conditionally Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== CUSTOMER VENDOR APPROVALS SECTION ====================
function CustomerVendorApprovalsSection() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ customerName: "", vendorName: "", materialName: "", approvalType: "", notes: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/customer-vendor-approvals", { status: statusFilter }],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/quality/customer-vendor-approvals", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/customer-vendor-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Approval request created" });
      setShowCreateDialog(false);
      setFormData({ customerName: "", vendorName: "", materialName: "", approvalType: "", notes: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await apiRequest(`/api/quality/customer-vendor-approvals/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/customer-vendor-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Approval updated" });
      setShowDetailDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const items = (data as any)?.approvals || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Approval</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customer Vendor Approval</DialogTitle>
              <DialogDescription>Create a vendor approval request from a customer.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Customer Name</Label><Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Customer company name" /></div>
              <div><Label>Vendor Name</Label><Input value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} placeholder="Vendor being approved" /></div>
              <div><Label>Material Name</Label><Input value={formData.materialName} onChange={(e) => setFormData({ ...formData, materialName: e.target.value })} placeholder="Material being sourced" /></div>
              <div><Label>Approval Type</Label>
                <Select value={formData.approvalType} onValueChange={(v) => setFormData({ ...formData, approvalType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial Approval</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="requalification">Requalification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Submit Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No approvals found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>{item.vendorName}</TableCell>
                    <TableCell>{item.materialName}</TableCell>
                    <TableCell><Badge variant="outline">{item.approvalType}</Badge></TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowDetailDialog(true); }}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approval #{selectedItem?.id}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div><Label>Customer</Label><p className="text-sm">{selectedItem.customerName}</p></div>
              <div><Label>Vendor</Label><p className="text-sm">{selectedItem.vendorName}</p></div>
              <div><Label>Material</Label><p className="text-sm">{selectedItem.materialName}</p></div>
              <div><Label>Notes</Label><p className="text-sm">{selectedItem.notes || "N/A"}</p></div>
              <div><Label>Status</Label><div className="mt-1">{getStatusBadge(selectedItem.status)}</div></div>
              <div><Label>Update Status</Label>
                <Select onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== NCRs SECTION ====================
function NCRsSection() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", description: "", severity: "minor", category: "", batchNumber: "", affectedProduct: "", rootCause: "", correctiveAction: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/ncrs", { status: statusFilter, severity: severityFilter }],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/quality/ncrs", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/ncrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "NCR created" });
      setShowCreateDialog(false);
      setFormData({ title: "", description: "", severity: "minor", category: "", batchNumber: "", affectedProduct: "", rootCause: "", correctiveAction: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await apiRequest(`/api/quality/ncrs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/ncrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "NCR updated" });
      setShowDetailDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const items = (data as any)?.ncrs || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Severities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create NCR</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Non-Conformance Report</DialogTitle>
              <DialogDescription>Log a non-conformance issue for quality tracking.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Brief NCR title" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Severity</Label>
                  <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_material">Raw Material</SelectItem>
                      <SelectItem value="process">Process</SelectItem>
                      <SelectItem value="finished_product">Finished Product</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Affected Product</Label><Input value={formData.affectedProduct} onChange={(e) => setFormData({ ...formData, affectedProduct: e.target.value })} placeholder="Product name" /></div>
                <div><Label>Batch Number</Label><Input value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} placeholder="If applicable" /></div>
              </div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detailed description of the non-conformance" rows={3} /></div>
              <div><Label>Root Cause (if known)</Label><Textarea value={formData.rootCause} onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })} placeholder="Root cause analysis" rows={2} /></div>
              <div><Label>Corrective Action (if known)</Label><Textarea value={formData.correctiveAction} onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })} placeholder="Proposed corrective action" rows={2} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create NCR"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No NCRs found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant={item.severity === "critical" ? "destructive" : item.severity === "major" ? "default" : "secondary"}>
                        {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.category?.replace(/_/g, " ")}</TableCell>
                    <TableCell>{item.affectedProduct || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowDetailDialog(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: item.id, status: "in_progress" })}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>NCR #{selectedItem?.id}: {selectedItem?.title}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Severity</Label><div className="mt-1"><Badge variant={selectedItem.severity === "critical" ? "destructive" : "secondary"}>{selectedItem.severity}</Badge></div></div>
                <div><Label>Category</Label><p className="text-sm mt-1">{selectedItem.category?.replace(/_/g, " ")}</p></div>
              </div>
              <div><Label>Description</Label><p className="text-sm">{selectedItem.description || "N/A"}</p></div>
              <div><Label>Affected Product</Label><p className="text-sm">{selectedItem.affectedProduct || "N/A"}</p></div>
              <div><Label>Batch Number</Label><p className="text-sm font-mono">{selectedItem.batchNumber || "N/A"}</p></div>
              <div><Label>Root Cause</Label><p className="text-sm">{selectedItem.rootCause || "Not yet determined"}</p></div>
              <div><Label>Corrective Action</Label><p className="text-sm">{selectedItem.correctiveAction || "Not yet defined"}</p></div>
              <div><Label>Status</Label><div className="mt-1">{getStatusBadge(selectedItem.status)}</div></div>
              <div><Label>Update Status</Label>
                <Select onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
