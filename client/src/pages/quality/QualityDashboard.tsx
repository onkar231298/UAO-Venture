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
      {/* ==================== SIDEBAR ==================== */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quality Portal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{roleDisplayName}</p>
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
                        onClick={() => setActiveSection(item.key)}
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
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {sectionTitles[activeSection] || "Dashboard"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{roleDisplayName} Portal</p>
            </div>
            <div className="flex items-center gap-3">
              <PunchInOutButton />
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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
  const [formData, setFormData] = useState({ documentType: "", productName: "", description: "", priority: "normal", requestedBy: "" });

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
      setFormData({ documentType: "", productName: "", description: "", priority: "normal", requestedBy: "" });
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

  const items = (data as any)?.data || (Array.isArray(data) ? data : []);

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
              <div><Label>Product Name</Label><Input value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} placeholder="e.g., Organic Turmeric Powder" /></div>
              <div><Label>Requested By</Label><Input value={formData.requestedBy} onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })} placeholder="Requester name or department" /></div>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
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
                <TableHead>Document Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Requested By</TableHead>
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
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No document requests found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell>{item.documentType}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.requestedBy}</TableCell>
                    <TableCell><Badge variant={item.priority === "urgent" ? "destructive" : "secondary"}>{item.priority}</Badge></TableCell>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Document Request #{selectedItem?.id}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div><Label>Type</Label><p className="text-sm">{selectedItem.documentType}</p></div>
              <div><Label>Product</Label><p className="text-sm">{selectedItem.productName}</p></div>
              <div><Label>Description</Label><p className="text-sm">{selectedItem.description || "N/A"}</p></div>
              <div><Label>Status</Label><div className="mt-1">{getStatusBadge(selectedItem.status)}</div></div>
              <div><Label>Update Status</Label>
                <Select onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
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

  const items = (data as any)?.data || (Array.isArray(data) ? data : []);

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

  const items = (data as any)?.data || (Array.isArray(data) ? data : []);

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
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [batchForm, setBatchForm] = useState({
    companyShort: "BFO",
    organicType: "O",
    materialCode: "",
    materialName: "",
    materialForm: "PWD",
    manufacturingDate: "",
    batchType: "raw_material",
  });

  const batchNumberPreview = useMemo(() => {
    const parts = [
      batchForm.companyShort || "BFO",
      batchForm.organicType || "O",
      batchForm.materialCode || "XXX",
      batchForm.materialForm || "PWD",
      batchForm.manufacturingDate || "MMYY",
    ];
    return parts.join("-");
  }, [batchForm]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/quality/batches", { batchType: typeFilter, status: statusFilter }],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest("/api/quality/batches", { method: "POST", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Batch created successfully" });
      setShowCreateDialog(false);
      setBatchForm({ companyShort: "BFO", organicType: "O", materialCode: "", materialName: "", materialForm: "PWD", manufacturingDate: "", batchType: "raw_material" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await apiRequest(`/api/quality/batches/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quality/dashboard-stats"] });
      toast({ title: "Batch updated" });
      setShowDetailDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const items = (data as any)?.data || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Batch Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="raw_material">Raw Material</SelectItem>
              <SelectItem value="finished_good">Finished Good</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Batch</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Batch Number</DialogTitle>
              <DialogDescription>Generate a batch number for tracking.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Label className="text-xs text-blue-600 uppercase tracking-wider">Batch Number Preview</Label>
                <p className="text-2xl font-bold font-mono mt-1 text-blue-900 dark:text-blue-100">{batchNumberPreview}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Company Short</Label><Input value={batchForm.companyShort} onChange={(e) => setBatchForm({ ...batchForm, companyShort: e.target.value.toUpperCase() })} placeholder="BFO" maxLength={5} /></div>
                <div><Label>Organic Type</Label>
                  <Select value={batchForm.organicType} onValueChange={(v) => setBatchForm({ ...batchForm, organicType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O">O - Organic</SelectItem>
                      <SelectItem value="C">C - Conventional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Material Code</Label><Input value={batchForm.materialCode} onChange={(e) => setBatchForm({ ...batchForm, materialCode: e.target.value.toUpperCase() })} placeholder="e.g., TUR, CUM, ASH, MOR" maxLength={5} /></div>
                <div><Label>Material Form</Label>
                  <Select value={batchForm.materialForm} onValueChange={(v) => setBatchForm({ ...batchForm, materialForm: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PWD">PWD - Powder</SelectItem>
                      <SelectItem value="WHL">WHL - Whole</SelectItem>
                      <SelectItem value="FLX">FLX - Flakes</SelectItem>
                      <SelectItem value="CUB">CUB - Cubes</SelectItem>
                      <SelectItem value="EXT">EXT - Extract</SelectItem>
                      <SelectItem value="OIL">OIL - Oil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Material Name</Label><Input value={batchForm.materialName} onChange={(e) => setBatchForm({ ...batchForm, materialName: e.target.value })} placeholder="e.g., Turmeric, Cumin, Ashwagandha" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Manufacturing Date (MMYY)</Label><Input value={batchForm.manufacturingDate} onChange={(e) => setBatchForm({ ...batchForm, manufacturingDate: e.target.value })} placeholder="e.g., 0226" maxLength={4} /></div>
                <div><Label>Batch Type</Label>
                  <Select value={batchForm.batchType} onValueChange={(v) => setBatchForm({ ...batchForm, batchType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_material">Raw Material</SelectItem>
                      <SelectItem value="finished_good">Finished Good</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ ...batchForm, batchNumber: batchNumberPreview })} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Batch"}
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
                <TableHead>Batch Number</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No batches found</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-medium">{item.batchNumber}</TableCell>
                    <TableCell>{item.materialName}</TableCell>
                    <TableCell><Badge variant="outline">{item.batchType?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{item.materialForm}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowDetailDialog(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: item.id, status: "released" })}><Edit className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Batch: {selectedItem?.batchNumber}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div><Label>Batch Number</Label><p className="text-sm font-mono font-bold">{selectedItem.batchNumber}</p></div>
              <div><Label>Material</Label><p className="text-sm">{selectedItem.materialName}</p></div>
              <div><Label>Batch Type</Label><p className="text-sm">{selectedItem.batchType?.replace(/_/g, " ")}</p></div>
              <div><Label>Status</Label><div className="mt-1">{getStatusBadge(selectedItem.status)}</div></div>
              <div><Label>Update Status</Label>
                <Select onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
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

  const items = (data as any)?.data || (Array.isArray(data) ? data : []);

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

  const items = (data as any)?.data || (Array.isArray(data) ? data : []);

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

  const items = (data as any)?.data || (Array.isArray(data) ? data : []);

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
