import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, TrendingUp, Users, Building, DollarSign, MoreVertical, UserPlus, List, Kanban, RefreshCw, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { type Lead, type LeadWithDetails } from "@shared/schema";
import LeadCreationForm from "./LeadCreationForm";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LeadDetailDialog from "@/components/LeadDetailDialog";
import BulkLeadUpload from "@/components/BulkLeadUpload";
import LeadListView from "@/components/LeadListView";

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
  currentUserId: string;
  canAssignLeads: boolean;
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className="flex flex-col min-w-[280px] sm:min-w-[320px] shrink-0 h-full">
      {children}
    </div>
  );
}

function DraggableLeadCard({ lead, getPriorityColor, formatCurrency, onViewDetails, salesReps, onAssign, currentUserId, canAssignLeads }: DraggableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id.toString() });

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
              {/* Unread Email Badge - Urgent attention needed */}
              {(lead.unreadEmailCount ?? 0) > 0 && (
                <div className="mt-1" data-testid={`badge-unread-email-${lead.id}`}>
                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-1 animate-pulse w-fit">
                    <Mail className="h-3 w-3" />
                    {lead.unreadEmailCount} unread
                  </Badge>
                  {lead.latestUnreadEmailAt && (
                    <p className="text-[10px] text-red-600 mt-0.5">
                      Reply received {new Date(lead.latestUnreadEmailAt).toLocaleDateString()} at {new Date(lead.latestUnreadEmailAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              )}
              {/* Lead Source Badge - Prominent differentiation */}
              {lead.leadSource === 'high_volume_bid' && (
                <Badge className="mt-1 bg-blue-100 text-blue-800 border border-blue-300 text-xs">
                  High Volume Bid
                </Badge>
              )}
              {lead.leadSource === 'product_inquiry' && (
                <Badge className="mt-1 bg-green-100 text-green-800 border border-green-300 text-xs">
                  Regular Enquiry
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      data-testid={`button-menu-${lead.id}`}
                    >
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
                        data-testid={`menu-assign-${rep.id}`}
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
          {lead.salesRep && (
            <div className="flex items-center text-xs text-gray-600">
              <Users className="h-3 w-3 mr-1" />
              {lead.salesRep.firstName} {lead.salesRep.lastName}
            </div>
          )}
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(lead);
              }}
            >
              Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeadManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [salesRepFilter, setSalesRepFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showLeadCreationForm, setShowLeadCreationForm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drag sensors for better UX
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Mutation for updating lead stage
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
      toast({
        title: "Lead Updated",
        description: "Lead stage has been successfully updated",
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

  const buildLeadsUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (priorityFilter !== "all") params.append("priority", priorityFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (salesRepFilter !== "all") params.append("assignedTo", salesRepFilter);
    if (sourceFilter !== "all") params.append("leadSource", sourceFilter);
    if (stageFilter.length > 0) params.append("stage", stageFilter.join(","));
    if (dateFrom) params.append("createdFrom", dateFrom);
    if (dateTo) params.append("createdTo", dateTo);
    const queryString = params.toString();
    return `/api/crm/leads${queryString ? `?${queryString}` : ""}`;
  };

  // Complete query key for all filters
  const leadsQueryKey = ["/api/crm/leads", searchTerm, priorityFilter, statusFilter, salesRepFilter, sourceFilter, stageFilter.join(","), dateFrom, dateTo];

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

  const { data: salesReps = [] } = useQuery({
    queryKey: ["/api/crm/sales-reps"],
    enabled: !!user,
  });

  // Check if user can assign leads (admin or manager)
  const canAssignLeads = user && ['admin', 'super_admin', 'sales_manager'].includes(user.role);

  // Assignment mutation
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
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      toast({
        title: "Lead Assigned",
        description: "Lead has been successfully assigned",
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

  const handleAssignLead = (leadId: number, assignedTo: string) => {
    assignLeadMutation.mutate({ leadId, assignedTo });
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
    toast({
      title: "Leads data has been updated",
    });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
    }, 300000); // 5 minutes in milliseconds

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

    if (!over) return;

    const leadId = parseInt(active.id as string);
    
    // Get the destination stage - with droppable columns, over.id is the stage ID
    // But if dropped on a card, we need to get the container ID
    let newStage: string;
    if (over.data.current?.sortable?.containerId) {
      // Dropped on another card - get its container
      newStage = over.data.current.sortable.containerId as string;
    } else {
      // Dropped on empty space or column - over.id is the stage
      newStage = over.id as string;
    }

    // Validate that newStage is a valid pipeline stage
    const isValidStage = PIPELINE_STAGES.some(stage => stage.id === newStage);
    if (!isValidStage) {
      console.error("Invalid stage:", newStage);
      return;
    }

    // Find the lead being dragged
    const lead = leads.find((l: LeadWithDetails) => l.id === leadId);
    if (!lead) return;

    // Don't update if dropped in the same stage
    if (lead.currentStage === newStage) return;

    // Store previous state for rollback on error
    const previousData = queryClient.getQueryData(leadsQueryKey);

    // Optimistic update: immediately update UI
    queryClient.setQueryData(leadsQueryKey, (old: any) => {
      if (!old?.leads) return old;
      return {
        ...old,
        leads: old.leads.map((l: LeadWithDetails) =>
          l.id === leadId ? { ...l, currentStage: newStage, previousStage: lead.currentStage } : l
        ),
      };
    });

    // Update on server with error rollback
    updateStageMutation.mutate(
      { leadId, newStage },
      {
        onError: (error) => {
          // Rollback to previous state on error
          queryClient.setQueryData(leadsQueryKey, previousData);
          console.error("Failed to update lead stage:", error);
          toast({
            title: "Error",
            description: "Failed to update lead stage. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeLead = activeId ? leads.find((l: LeadWithDetails) => l.id === parseInt(activeId)) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your B2B sales pipeline</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-2 sm:px-3"
                data-testid="button-view-list"
              >
                <List className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-8 px-2 sm:px-3"
                data-testid="button-view-kanban"
              >
                <Kanban className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Board</span>
              </Button>
            </div>
            <BulkLeadUpload />
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-leads"
              className="hidden sm:flex"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" data-testid="button-create-lead" onClick={() => setShowLeadCreationForm(true)}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Lead</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
                  <p className="text-2xl font-bold">{(stats as any)?.totalLeads || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                  <p className="text-2xl font-bold">{(stats as any)?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Lead Age</p>
                  <p className="text-2xl font-bold">{Math.round((stats as any)?.averageLeadAge || 0)} days</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Leads</p>
                  <p className="text-2xl font-bold">{leads.filter((l: Lead) => l.status === "active").length}</p>
                </div>
                <Building className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="relative flex-1 min-w-full sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-leads"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            {canAssignLeads && (
              <Select value={salesRepFilter} onValueChange={setSalesRepFilter}>
                <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-salesrep-filter">
                  <SelectValue placeholder="Sales Rep" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales Reps</SelectItem>
                  {salesReps.map((rep: any) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.firstName} {rep.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              data-testid="button-more-filters"
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvancedFilters ? 'Less' : 'More'} Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-source-filter">
                  <SelectValue placeholder="Lead Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="website_inquiry">Website Inquiry</SelectItem>
                  <SelectItem value="high_volume_bid">High Volume Bid</SelectItem>
                  <SelectItem value="accepted_quotation">Accepted Quotation</SelectItem>
                  <SelectItem value="sample_request">Sample Request</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-[180px]" data-testid="button-stage-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    Stages {stageFilter.length > 0 && `(${stageFilter.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[250px]" align="start">
                  <DropdownMenuLabel>Select Stages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {PIPELINE_STAGES.map((stage) => (
                      <DropdownMenuItem
                        key={stage.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setStageFilter(prev =>
                            prev.includes(stage.id)
                              ? prev.filter(s => s !== stage.id)
                              : [...prev, stage.id]
                          );
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={stageFilter.includes(stage.id)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{stage.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  {stageFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setStageFilter([])}
                        className="text-red-600"
                      >
                        Clear Selection
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From Date"
                  className="w-full sm:w-[160px]"
                  data-testid="input-date-from"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To Date"
                  className="w-full sm:w-[160px]"
                  data-testid="input-date-to"
                />
              </div>

              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setPriorityFilter("all");
                  setStatusFilter("active");
                  setSalesRepFilter("all");
                  setSourceFilter("all");
                  setStageFilter([]);
                  setDateFrom("");
                  setDateTo("");
                }}
                data-testid="button-clear-filters"
                className="w-full sm:w-auto"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* List View or Kanban Board */}
      <div className="flex-1 min-h-0 relative">
        {viewMode === 'list' ? (
          <div className="h-full bg-white dark:bg-gray-800">
            <LeadListView
              leads={leads}
              onViewDetails={setSelectedLead}
              salesReps={salesReps}
              canAssignLeads={!!canAssignLeads}
              onAssign={handleAssignLead}
            />
          </div>
        ) : (
          <>
            <div className="absolute top-4 right-8 hidden md:flex items-center gap-2 text-sm text-gray-500 z-10 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-md shadow-sm">
              <span>Drag cards to update stage</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none z-[5]"></div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
          <div className="w-full h-full overflow-x-auto overflow-y-hidden bg-gray-50 dark:bg-gray-900 p-2 sm:p-4 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex gap-3 sm:gap-4 h-full min-w-max pb-4">
              {PIPELINE_STAGES.map((stage) => {
                const stageLeads = groupedLeads[stage.id] || [];
                const leadIds = stageLeads.map((lead: LeadWithDetails) => lead.id.toString());
                
                return (
                  <DroppableColumn key={stage.id} id={stage.id}>
                    <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
                      <div data-testid={`column-${stage.id}`} className="h-full flex flex-col">
                        <div className="mb-3">
                          <div className={`rounded-lg px-2 sm:px-3 py-2 ${stage.color} flex items-center justify-between`}>
                            <span className="font-semibold text-xs sm:text-sm">{stage.label}</span>
                            <Badge variant="secondary" className="bg-white/50 text-xs">
                              {stageLeads.length}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto pr-1 sm:pr-2 min-h-[200px]">
                          {stageLeads.map((lead: LeadWithDetails) => (
                            <DraggableLeadCard
                              key={lead.id}
                              lead={lead}
                              getPriorityColor={getPriorityColor}
                              formatCurrency={formatCurrency}
                              onViewDetails={setSelectedLead}
                              salesReps={salesReps}
                              onAssign={handleAssignLead}
                              currentUserId={user?.id || ''}
                              canAssignLeads={!!canAssignLeads}
                            />
                          ))}
                          {stageLeads.length === 0 && (
                            <div className="text-center text-xs sm:text-sm text-gray-400 mt-8">
                              Drop leads here
                            </div>
                          )}
                        </div>
                      </div>
                    </SortableContext>
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
          
              <DragOverlay>
                {activeLead ? (
                  <Card className="cursor-move shadow-2xl opacity-90 rotate-3">
                    <CardHeader className="p-4 pb-3">
                      <CardTitle className="text-sm font-semibold">
                        {activeLead.company?.companyName || "Unknown Company"}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {/* Lead Creation Dialog */}
      <LeadCreationForm
        open={showLeadCreationForm}
        onOpenChange={setShowLeadCreationForm}
      />

      {/* Lead Detail Dialog with Activity Timeline */}
      <LeadDetailDialog
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        salesReps={salesReps}
        onAssign={handleAssignLead}
        canAssignLeads={!!canAssignLeads}
      />
    </div>
  );
}
