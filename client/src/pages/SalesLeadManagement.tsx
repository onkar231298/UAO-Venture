import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Plus, Filter, TrendingUp, Users, Building, DollarSign, MoreVertical, 
  UserPlus, List, Kanban, RefreshCw, ArrowLeft, Calendar, Home
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { type LeadWithDetails } from "@shared/schema";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LeadDetailDialog from "@/components/LeadDetailDialog";
import LeadListView from "@/components/LeadListView";
import { Link } from "wouter";

const PIPELINE_STAGES = [
  { id: "new_lead", label: "New Lead", color: "bg-gray-100 text-gray-800" },
  { id: "first_contact", label: "First Contact", color: "bg-blue-100 text-blue-800" },
  { id: "discussion", label: "Discussion", color: "bg-cyan-100 text-cyan-800" },
  { id: "meeting_scheduled", label: "Meeting Scheduled", color: "bg-indigo-100 text-indigo-800" },
  { id: "meeting_completed", label: "Meeting Completed", color: "bg-purple-100 text-purple-800" },
  { id: "sample_requested", label: "Sample Requested", color: "bg-pink-100 text-pink-800" },
  { id: "sample_submitted", label: "Sample Submitted", color: "bg-rose-100 text-rose-800" },
  { id: "sample_feedback", label: "Sample Feedback", color: "bg-orange-100 text-orange-800" },
  { id: "quotation_sent", label: "Quotation Sent", color: "bg-amber-100 text-amber-800" },
  { id: "negotiation", label: "Negotiation", color: "bg-yellow-100 text-yellow-800" },
  { id: "certificates_shared", label: "Certificates Shared", color: "bg-lime-100 text-lime-800" },
  { id: "order_pending", label: "Order Pending", color: "bg-emerald-100 text-emerald-800" },
  { id: "won", label: "Won", color: "bg-green-100 text-green-800" },
  { id: "lost", label: "Lost", color: "bg-red-100 text-red-800" },
  { id: "on_hold", label: "On Hold", color: "bg-slate-100 text-slate-800" },
];

interface DraggableLeadCardProps {
  lead: LeadWithDetails;
  getPriorityColor: (priority: string) => string;
  formatCurrency: (amount: number | string | null) => string;
  onViewDetails: (lead: LeadWithDetails) => void;
  salesReps: any[];
  onAssign: (leadId: number, assignedTo: string) => void;
  canAssignLeads: boolean;
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex flex-col min-w-[280px] sm:min-w-[320px] shrink-0 h-full">
      {children}
    </div>
  );
}

function DraggableLeadCard({ lead, getPriorityColor, formatCurrency, onViewDetails, salesReps, onAssign, canAssignLeads }: DraggableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id.toString() });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-move hover:shadow-lg transition-shadow" data-testid={`card-lead-${lead.id}`}>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold">
                {lead.company?.companyName || "Unknown Company"}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">{lead.leadId}</p>
              {lead.leadSource === 'high_volume_bid' && (
                <Badge className="mt-1 bg-blue-100 text-blue-800 border border-blue-300 text-xs">
                  High Volume Bid
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge className={`text-xs ${getPriorityColor(lead.priority || "warm")}`}>
                {lead.priority || "warm"}
              </Badge>
              {canAssignLeads && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {salesReps.map((rep) => (
                      <DropdownMenuItem 
                        key={rep.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssign(lead.id, rep.id);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-2" />
                        {rep.firstName} {rep.lastName}
                        {lead.assignedSalesRep === rep.id && " (current)"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <Users className="h-3 w-3 mr-1" />
            {lead.contactPerson?.contactName || "No contact"}
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <DollarSign className="h-3 w-3 mr-1" />
            {formatCurrency(lead.expectedOrderValue)}
          </div>
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(lead);
              }}
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SalesLeadManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userWithRole = user as { id?: string; role?: string } | null;
  const isSalesManager = userWithRole?.role === 'sales_manager';
  const isSalesRep = userWithRole?.role?.includes('sales') && !isSalesManager;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: number; newStage: string }) => {
      const response = await fetch(`/api/crm/leads/${leadId}/update-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update stage');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/my-leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      toast({ title: "Lead Updated", description: "Lead stage has been successfully updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const buildLeadsUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (priorityFilter !== "all") params.append("priority", priorityFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (sourceFilter !== "all") params.append("leadSource", sourceFilter);
    if (stageFilter.length > 0) params.append("stage", stageFilter.join(","));
    if (dateFrom) params.append("createdFrom", dateFrom);
    if (dateTo) params.append("createdTo", dateTo);
    
    // For sales managers, show all team leads. For sales reps, show only their leads.
    if (isSalesRep && userWithRole?.id) {
      params.set("assignedTo", userWithRole.id);
    }
    
    const queryString = params.toString();
    return `/api/crm/leads${queryString ? `?${queryString}` : ""}`;
  };

  const leadsQueryKey = ["/api/crm/leads", "sales", searchTerm, priorityFilter, statusFilter, sourceFilter, stageFilter.join(","), dateFrom, dateTo, userWithRole?.id];

  const { data: leadsData, isLoading } = useQuery({
    queryKey: leadsQueryKey,
    queryFn: async () => {
      const response = await fetch(buildLeadsUrl());
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/crm/stats"],
    enabled: !!user,
  });

  // Fetch sales reps for assignment functionality (not for filtering)
  const { data: salesReps = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/sales-reps"],
    enabled: !!user && isSalesManager,
  });

  const canAssignLeads = isSalesManager;

  const assignLeadMutation = useMutation({
    mutationFn: async ({ leadId, assignedTo }: { leadId: number; assignedTo: string }) => {
      const response = await fetch(`/api/crm/leads/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign lead');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
      toast({ title: "Lead Assigned", description: "Lead has been successfully assigned" });
    },
    onError: (error: Error) => {
      toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleAssignLead = (leadId: number, assignedTo: string) => {
    assignLeadMutation.mutate({ leadId, assignedTo });
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
    toast({ title: "Leads data has been updated" });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey });
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const leads = (leadsData as any)?.leads || [];

  const groupedLeads = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = leads.filter((lead: LeadWithDetails) => lead.currentStage === stage.id);
    return acc;
  }, {} as Record<string, LeadWithDetails[]>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hot": return "bg-red-500 text-white";
      case "warm": return "bg-orange-500 text-white";
      case "cold": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "$0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const leadId = parseInt(active.id as string);
      const targetStage = over.id as string;
      
      if (PIPELINE_STAGES.some(s => s.id === targetStage)) {
        updateStageMutation.mutate({ leadId, newStage: targetStage });
      }
    }
  };

  const activeLeadForDrag = activeId ? leads.find((l: LeadWithDetails) => l.id.toString() === activeId) : null;

  // Stats for sales view
  const totalLeads = leads.length;
  const activeLeads = leads.filter((l: any) => l.status === 'active').length;
  const wonLeads = leads.filter((l: any) => l.currentStage === 'won').length;
  const lostLeads = leads.filter((l: any) => l.currentStage === 'lost').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const avgLeadAge = 0; // Could calculate from createdAt if needed
  const totalValue = leads.reduce((sum: number, l: any) => sum + (parseFloat(l.expectedOrderValue) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sales">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Lead Management</h1>
                <p className="text-gray-500 text-sm">
                  {isSalesManager ? "Manage your team's B2B sales pipeline" : "Manage your B2B sales pipeline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={viewMode === 'kanban' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Kanban className="w-4 h-4 mr-1" />
                Board
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-bold">{conversionRate}%</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Leads</p>
                  <p className="text-2xl font-bold">{activeLeads}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
                <Building className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads, companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                More Filters
              </Button>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Lead Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="product_inquiry">Regular Enquiry</SelectItem>
                    <SelectItem value="high_volume_bid">High Volume Bid</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[140px]"
                    placeholder="From"
                  />
                  <span className="text-gray-400">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[140px]"
                    placeholder="To"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
          </div>
        ) : viewMode === 'list' ? (
          <Card>
            <CardContent className="p-0">
              <LeadListView
                leads={leads}
                onViewDetails={(lead) => setSelectedLead(lead)}
                salesReps={salesReps}
                canAssignLeads={canAssignLeads}
                onAssign={handleAssignLead}
              />
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
              {PIPELINE_STAGES.map((stage) => (
                <DroppableColumn key={stage.id} id={stage.id}>
                  <div className="bg-gray-100 rounded-lg p-3 h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{stage.label}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {groupedLeads[stage.id]?.length || 0}
                      </Badge>
                    </div>
                    <SortableContext
                      items={(groupedLeads[stage.id] || []).map(l => l.id.toString())}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 min-h-[100px]">
                        {(groupedLeads[stage.id] || []).map((lead) => (
                          <DraggableLeadCard
                            key={lead.id}
                            lead={lead}
                            getPriorityColor={getPriorityColor}
                            formatCurrency={formatCurrency}
                            onViewDetails={() => setSelectedLead(lead)}
                            salesReps={salesReps}
                            onAssign={handleAssignLead}
                            canAssignLeads={canAssignLeads}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </DroppableColumn>
              ))}
            </div>
            <DragOverlay>
              {activeLeadForDrag && (
                <Card className="shadow-xl">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">
                      {activeLeadForDrag.company?.companyName}
                    </CardTitle>
                  </CardHeader>
                </Card>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
        />
      )}
    </div>
  );
}
