import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Search, Plus, MapPin, Globe, Users, X, Phone, Mail, RefreshCw, Filter, UserPlus, MoreVertical, List, Kanban, Upload, Calendar, History, CheckSquare, StickyNote, Pin, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CompanyNotes } from "@/components/crm/CompanyNotes";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const COMPANY_STAGES = [
  { id: "new", label: "New", color: "bg-gray-100 text-gray-800" },
  { id: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800" },
  { id: "qualified", label: "Qualified", color: "bg-cyan-100 text-cyan-800" },
  { id: "active", label: "Active Customer", color: "bg-green-100 text-green-800" },
  { id: "inactive", label: "Inactive", color: "bg-slate-100 text-slate-800" },
  { id: "churned", label: "Churned", color: "bg-red-100 text-red-800" },
];

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  primaryEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  gstNumber: z.string().optional(),
  industryType: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  
  // Primary Address
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressCountry: z.string().optional(),
  addressZip: z.string().optional(),
  
  // Factory/Warehouse Address
  factoryAddressStreet: z.string().optional(),
  factoryAddressCity: z.string().optional(),
  factoryAddressState: z.string().optional(),
  factoryAddressCountry: z.string().optional(),
  factoryAddressZip: z.string().optional(),
  
  // Department contact phones
  departmentPhones: z.array(z.object({
    department: z.string(),
    phone: z.string(),
  })).optional(),
  
  // Additional emails with positions
  additionalEmails: z.array(z.object({
    position: z.string(),
    email: z.string().email("Invalid email"),
  })).optional(),
});

interface Company {
  id: number;
  companyName: string;
  gstNumber?: string | null;
  industryType?: string | null;
  companySize?: string | null;
  website?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressCountry?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  createdAt: string;
  origin?: string | null;
  status?: string | null;
  companyStage?: string | null;
  priority?: string | null;
  linkedUserId?: string | null;
}

interface SalesRep {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CompanyManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Company form
  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      primaryEmail: "",
      primaryPhone: "",
      gstNumber: "",
      industryType: "",
      companySize: "",
      website: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressCountry: "",
      addressZip: "",
      factoryAddressStreet: "",
      factoryAddressCity: "",
      factoryAddressState: "",
      factoryAddressCountry: "",
      factoryAddressZip: "",
      departmentPhones: [],
      additionalEmails: [],
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
      return await apiRequest("/api/crm/companies", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Company created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    },
  });

  // Fetch sales reps for assignment
  const { data: salesReps = [] } = useQuery<SalesRep[]>({
    queryKey: ["/api/users/sales-reps"],
  });

  // Fetch companies with RBAC filtering
  const buildCompaniesUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (industryFilter && industryFilter !== "all") params.append("industryType", industryFilter);
    if (originFilter && originFilter !== "all") params.append("origin", originFilter);
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (stageFilter && stageFilter !== "all") params.append("companyStage", stageFilter);
    if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
    if (assignedToFilter && assignedToFilter !== "all") params.append("assignedTo", assignedToFilter);
    if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
    if (dateTo) params.append("dateTo", dateTo.toISOString());
    return `/api/crm/companies?${params.toString()}`;
  };

  const companiesQueryKey = ["/api/crm/companies", searchTerm, industryFilter, originFilter, statusFilter, stageFilter, priorityFilter, assignedToFilter, dateFrom?.toISOString(), dateTo?.toISOString()];

  const { data: companiesData, isLoading } = useQuery<{ companies: Company[]; total: number }>({
    queryKey: companiesQueryKey,
    queryFn: async () => {
      const response = await fetch(buildCompaniesUrl(), {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
  });

  const companies = companiesData?.companies || [];
  const total = companiesData?.total || 0;

  // Company assignment mutation
  const assignCompanyMutation = useMutation({
    mutationFn: async ({ companyId, assignedTo }: { companyId: number; assignedTo: string }) => {
      const response = await apiRequest(`/api/crm/companies/${companyId}/assign`, {
        method: "POST",
        body: JSON.stringify({ assignedTo }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast({
        title: "Company Assigned",
        description: "Company has been successfully assigned",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignCompany = (companyId: number, assignedTo: string) => {
    assignCompanyMutation.mutate({ companyId, assignedTo });
  };

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ companyIds, assignedTo }: { companyIds: number[]; assignedTo: string }) => {
      const response = await apiRequest(`/api/crm/companies/bulk-assign`, {
        method: "POST",
        body: JSON.stringify({ companyIds, assignedTo }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setSelectedCompanies([]);
      setBulkAssignDialogOpen(false);
      toast({
        title: "Companies Assigned",
        description: `${selectedCompanies.length} companies have been assigned successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectCompany = (companyId: number, checked: boolean) => {
    if (checked) {
      setSelectedCompanies(prev => [...prev, companyId]);
    } else {
      setSelectedCompanies(prev => prev.filter(id => id !== companyId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(companies.map(c => c.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  const handleBulkAssign = (assignedTo: string) => {
    bulkAssignMutation.mutate({ companyIds: selectedCompanies, assignedTo });
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Stage update mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ companyId, stage }: { companyId: number; stage: string }) => {
      const response = await apiRequest(`/api/crm/companies/${companyId}/stage`, {
        method: "POST",
        body: JSON.stringify({ stage }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast({
        title: "Stage Updated",
        description: "Company stage has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStageColor = (stage: string | null | undefined) => {
    const stageInfo = COMPANY_STAGES.find(s => s.id === stage);
    return stageInfo?.color || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    switch (priority) {
      case "hot": return "bg-red-100 text-red-800";
      case "warm": return "bg-orange-100 text-orange-800";
      case "cold": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  const isAdmin = user && (user as any).role ? adminRoles.includes((user as any).role) : false;

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Companies data has been updated",
      });
    }, 500);
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-company-management">
            {isAdmin ? "Company Management" : "My Companies"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage all companies - both website customers and manually added"
              : "View companies assigned to you or created by you"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              data-testid="button-view-kanban"
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh-companies"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button data-testid="button-create-company" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>
      
      {/* Stage Filter Tabs */}
      <Tabs value={stageFilter} onValueChange={setStageFilter} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="all" className="text-xs" data-testid="tab-all-stages">All</TabsTrigger>
          {COMPANY_STAGES.map(stage => (
            <TabsTrigger 
              key={stage.id} 
              value={stage.id} 
              className="text-xs"
              data-testid={`tab-stage-${stage.id}`}
            >
              {stage.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, GST, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-companies"
              />
            </div>
            
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-origin-filter">
                <SelectValue placeholder="Origin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Origins</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="import">Imported</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-industry-filter">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="pharma">Pharmaceuticals</SelectItem>
                <SelectItem value="cosmetics">Cosmetics & Personal Care</SelectItem>
                <SelectItem value="nutraceuticals">Nutraceuticals</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-priority-filter">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              
              {isAdmin && (
                <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-assigned-filter">
                    <SelectValue placeholder="Assigned To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignments</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {salesReps.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id}>
                        {rep.firstName} {rep.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px]" data-testid="button-date-from">
                      <Calendar className="h-3 w-3 mr-1" />
                      {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-muted-foreground">to</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px]" data-testid="button-date-to">
                      <Calendar className="h-3 w-3 mr-1" />
                      {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilter} data-testid="button-clear-dates">
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold" data-testid="text-total-companies">{total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-website-companies">
                  {companies.filter(c => c.origin === 'website').length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-assigned-companies">
                  {companies.filter(c => c.assignedTo).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold text-amber-600" data-testid="text-unassigned-companies">
                  {companies.filter(c => !c.assignedTo).length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCompanies.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedCompanies.length} companies selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-bulk-assign">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign to
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Assign selected companies to</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {salesReps.map((rep) => (
                      <DropdownMenuItem 
                        key={rep.id}
                        onClick={() => handleBulkAssign(rep.id)}
                        data-testid={`bulk-assign-${rep.id}`}
                      >
                        <UserPlus className="h-3 w-3 mr-2" />
                        {rep.firstName} {rep.lastName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCompanies([])}
                  data-testid="button-clear-selection"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No companies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden sm:rounded-lg">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="md:sticky md:top-0 md:z-10 md:bg-white md:dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={selectedCompanies.length === companies.length && companies.length > 0}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => {
                        const assignedRep = salesReps.find(r => r.id === company.assignedTo);
                        const isSelected = selectedCompanies.includes(company.id);
                        return (
                          <TableRow 
                            key={company.id} 
                            data-testid={`row-company-${company.id}`}
                            className={isSelected ? "bg-blue-50" : ""}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectCompany(company.id, !!checked)}
                                data-testid={`checkbox-company-${company.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-2">
                                <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                  <p className="font-medium" data-testid={`text-company-name-${company.id}`}>
                                    {company.companyName}
                                  </p>
                                  {company.primaryEmail && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {company.primaryEmail}
                                    </p>
                                  )}
                                  {company.industryType && (
                                    <Badge variant="outline" className="mt-1 text-[10px]">
                                      {company.industryType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={company.origin === 'website' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                                }
                              >
                                {company.origin === 'website' ? 'Website' : company.origin || 'Manual'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStageColor(company.companyStage)}>
                                {COMPANY_STAGES.find(s => s.id === company.companyStage)?.label || 'New'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(company.priority)}>
                                {company.priority || 'warm'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {company.addressCity && (
                                  <>
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">
                                      {company.addressCity}
                                      {company.addressState && `, ${company.addressState}`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {company.createdAt ? format(new Date(company.createdAt), 'MMM dd, yyyy') : '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {assignedRep ? (
                                <span className="text-sm font-medium">
                                  {assignedRep.firstName} {assignedRep.lastName}
                                </span>
                              ) : (
                                <span className="text-sm text-amber-600">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setViewDetailsOpen(true);
                                  }}
                                  data-testid={`button-view-company-${company.id}`}
                                >
                                  View
                                </Button>
                                
                                {isAdmin && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        data-testid={`button-menu-${company.id}`}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {salesReps.map((rep) => (
                                        <DropdownMenuItem 
                                          key={rep.id}
                                          onClick={() => handleAssignCompany(company.id, rep.id)}
                                          data-testid={`menu-assign-${rep.id}`}
                                        >
                                          <UserPlus className="h-3 w-3 mr-2" />
                                          {rep.firstName} {rep.lastName}
                                          {company.assignedTo === rep.id && " (current)"}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Company Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to the CRM system
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@company.com" {...field} data-testid="input-primary-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="primaryPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1-xxx-xxx-xxxx" {...field} data-testid="input-primary-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="GST number" {...field} data-testid="input-gst-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-industry-type">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="pharma">Pharmaceuticals</SelectItem>
                          <SelectItem value="cosmetics">Cosmetics & Personal Care</SelectItem>
                          <SelectItem value="nutraceuticals">Nutraceuticals</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-size">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Department Phone Numbers */}
              <div className="space-y-4 pt-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Department Phone Numbers (Optional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentPhones = form.getValues("departmentPhones") || [];
                      form.setValue("departmentPhones", [...currentPhones, { department: "", phone: "" }]);
                    }}
                    data-testid="button-add-department-phone"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Department Phone
                  </Button>
                </div>
                {(form.watch("departmentPhones") || []).map((_, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`departmentPhones.${index}.department`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Department (e.g., Sales, Support)" {...field} data-testid={`input-dept-name-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`departmentPhones.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} data-testid={`input-dept-phone-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentPhones = form.getValues("departmentPhones") || [];
                        form.setValue("departmentPhones", currentPhones.filter((_, i) => i !== index));
                      }}
                      data-testid={`button-remove-dept-phone-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Additional Emails with Positions */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Additional Emails with Positions (Optional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentEmails = form.getValues("additionalEmails") || [];
                      form.setValue("additionalEmails", [...currentEmails, { position: "", email: "" }]);
                    }}
                    data-testid="button-add-additional-email"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Email
                  </Button>
                </div>
                {(form.watch("additionalEmails") || []).map((_, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`additionalEmails.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Position (e.g., Purchasing Manager)" {...field} data-testid={`input-email-position-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`additionalEmails.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="email" placeholder="email@company.com" {...field} data-testid={`input-additional-email-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentEmails = form.getValues("additionalEmails") || [];
                        form.setValue("additionalEmails", currentEmails.filter((_, i) => i !== index));
                      }}
                      data-testid={`button-remove-additional-email-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Primary Address */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Primary Address</h3>
                <FormField
                  control={form.control}
                  name="addressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} data-testid="input-address-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="addressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-address-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} data-testid="input-address-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="addressCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} data-testid="input-address-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal/ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP code" {...field} data-testid="input-address-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Factory/Warehouse Address */}
              <div className="space-y-4 pt-4">
                <h3 className="font-semibold text-sm">Factory/Warehouse Address</h3>
                <FormField
                  control={form.control}
                  name="factoryAddressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} data-testid="input-factory-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="factoryAddressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-factory-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="factoryAddressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} data-testid="input-factory-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="factoryAddressCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} data-testid="input-factory-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="factoryAddressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal/ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP code" {...field} data-testid="input-factory-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCompanyMutation.isPending}
                  data-testid="button-submit-company"
                >
                  {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Company Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedCompany?.companyName}
            </DialogTitle>
            <DialogDescription>
              View and manage company details
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-4">
              {/* Status Badges Row */}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge 
                  variant="outline" 
                  className={selectedCompany.origin === 'website' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                  }
                >
                  {selectedCompany.origin === 'website' ? 'Website Customer' : 'Manually Added'}
                </Badge>
                <Badge className={getStageColor(selectedCompany.companyStage)}>
                  {COMPANY_STAGES.find(s => s.id === selectedCompany.companyStage)?.label || 'Prospect'}
                </Badge>
                <Badge className={getPriorityColor(selectedCompany.priority)}>
                  {selectedCompany.priority || 'warm'}
                </Badge>
              </div>
              
              {/* Quick Actions */}
              {isAdmin && (
                <div className="flex gap-2">
                  <Select 
                    value={selectedCompany.companyStage || 'prospect'}
                    onValueChange={(value) => {
                      updateStageMutation.mutate({ companyId: selectedCompany.id, stage: value });
                    }}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="select-change-stage">
                      <SelectValue placeholder="Change Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_STAGES.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={selectedCompany.assignedTo || ""}
                    onValueChange={(value) => handleAssignCompany(selectedCompany.id, value)}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="select-assign-rep">
                      <SelectValue placeholder="Assign to Rep" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesReps.map(rep => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.firstName} {rep.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Tabs defaultValue="info" className="w-full">
                <TabsList>
                  <TabsTrigger value="info" data-testid="tab-info">Info</TabsTrigger>
                  <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
                  <TabsTrigger value="contacts" data-testid="tab-contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="address" data-testid="tab-address">Addresses</TabsTrigger>
                  <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  {/* Basic Information */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Company Name</p>
                          <p className="font-medium">{selectedCompany.companyName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">GST Number</p>
                          <p className="font-medium">{selectedCompany.gstNumber || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Primary Email</p>
                          <p className="font-medium flex items-center gap-1">
                            {selectedCompany.primaryEmail ? (
                              <a href={`mailto:${selectedCompany.primaryEmail}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {selectedCompany.primaryEmail}
                              </a>
                            ) : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Primary Phone</p>
                          <p className="font-medium flex items-center gap-1">
                            {selectedCompany.primaryPhone ? (
                              <a href={`tel:${selectedCompany.primaryPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {selectedCompany.primaryPhone}
                              </a>
                            ) : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Industry Type</p>
                          <p className="font-medium">{selectedCompany.industryType || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Company Size</p>
                          <p className="font-medium">{selectedCompany.companySize || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Website</p>
                          {selectedCompany.website ? (
                            <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {selectedCompany.website}
                            </a>
                          ) : (
                            <p className="font-medium">-</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Assignment & Metadata */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-3">Assignment & Metadata</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Assigned To</p>
                          <p className="font-medium flex items-center gap-1">
                            <UserPlus className="h-3 w-3" />
                            {salesReps.find(r => r.id === selectedCompany.assignedTo)
                              ? `${salesReps.find(r => r.id === selectedCompany.assignedTo)?.firstName} ${salesReps.find(r => r.id === selectedCompany.assignedTo)?.lastName}`
                              : <span className="text-amber-600">Unassigned</span>
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created By</p>
                          <p className="font-medium">{selectedCompany.createdBy || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Origin</p>
                          <p className="font-medium">{selectedCompany.origin || "manual"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created At</p>
                          <p className="font-medium">{new Date(selectedCompany.createdAt).toLocaleString()}</p>
                        </div>
                        {selectedCompany.linkedUserId && (
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Linked User ID</p>
                            <p className="font-medium">{selectedCompany.linkedUserId}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <CompanyNotes 
                        companyId={selectedCompany.id} 
                        currentUserId={user?.id || ''} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="contacts" className="mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No contacts linked to this company yet</p>
                        <p className="text-sm">Contacts will appear here when linked through registrations</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="address" className="space-y-4 mt-4">
                  {/* Primary Address */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Primary Address
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Street Address</p>
                          <p className="font-medium">{(selectedCompany as any).addressStreet || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">City</p>
                          <p className="font-medium">{selectedCompany.addressCity || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">State</p>
                          <p className="font-medium">{selectedCompany.addressState || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Country</p>
                          <p className="font-medium">{selectedCompany.addressCountry || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ZIP Code</p>
                          <p className="font-medium">{(selectedCompany as any).addressZip || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Factory/Warehouse Address */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Factory/Warehouse Address
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Street Address</p>
                          <p className="font-medium">{(selectedCompany as any).factoryAddressStreet || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">City</p>
                          <p className="font-medium">{(selectedCompany as any).factoryAddressCity || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">State</p>
                          <p className="font-medium">{(selectedCompany as any).factoryAddressState || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Country</p>
                          <p className="font-medium">{(selectedCompany as any).factoryAddressCountry || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ZIP Code</p>
                          <p className="font-medium">{(selectedCompany as any).factoryAddressZip || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activity" className="mt-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center py-6 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Activity timeline coming soon</p>
                        <p className="text-sm">Track all interactions and updates with this company</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setViewDetailsOpen(false)} data-testid="button-close-details">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
