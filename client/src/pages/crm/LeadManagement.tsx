import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, TrendingUp, Users, Building, DollarSign } from "lucide-react";
import { type Lead, type LeadWithDetails } from "@shared/schema";
import LeadCreationForm from "./LeadCreationForm";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LeadDetailDialog from "@/components/LeadDetailDialog";
import BulkLeadUpload from "@/components/BulkLeadUpload";

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
    <div ref={setNodeRef} className="flex flex-col w-80 shrink-0 h-full">
      {children}
    </div>
  );
}

function DraggableLeadCard({ lead, getPriorityColor, formatCurrency, onViewDetails }: DraggableLeadCardProps) {
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
            </div>
            <Badge className={`text-xs ${getPriorityColor(lead.priority || "warm")}`}>
              {lead.priority || "warm"}
            </Badge>
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
  const [showLeadCreationForm, setShowLeadCreationForm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);

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
    const queryString = params.toString();
    return `/api/crm/leads${queryString ? `?${queryString}` : ""}`;
  };

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["/api/crm/leads", searchTerm, priorityFilter, statusFilter],
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
    const previousData = queryClient.getQueryData(["/api/crm/leads", searchTerm, priorityFilter, statusFilter]);

    // Optimistic update: immediately update UI
    queryClient.setQueryData(["/api/crm/leads", searchTerm, priorityFilter, statusFilter], (old: any) => {
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
          queryClient.setQueryData(["/api/crm/leads", searchTerm, priorityFilter, statusFilter], previousData);
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your B2B sales pipeline</p>
          </div>
          <div className="flex gap-2">
            <BulkLeadUpload />
            <Button data-testid="button-create-lead" onClick={() => setShowLeadCreationForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
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
            <SelectTrigger className="w-[150px]" data-testid="select-priority-filter">
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
            <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
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
          <Button variant="outline" data-testid="button-more-filters">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute top-4 right-8 flex items-center gap-2 text-sm text-gray-500 z-10 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-md shadow-sm">
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
          <div className="w-full h-full overflow-x-auto overflow-y-hidden bg-gray-50 dark:bg-gray-900 p-4 scroll-smooth">
            <div className="flex gap-4 h-full min-w-max pb-4">
              {PIPELINE_STAGES.map((stage) => {
                const stageLeads = groupedLeads[stage.id] || [];
                const leadIds = stageLeads.map((lead: LeadWithDetails) => lead.id.toString());
                
                return (
                  <DroppableColumn key={stage.id} id={stage.id}>
                    <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
                      <div data-testid={`column-${stage.id}`} className="h-full flex flex-col">
                        <div className="mb-3">
                          <div className={`rounded-lg px-3 py-2 ${stage.color} flex items-center justify-between`}>
                            <span className="font-semibold text-sm">{stage.label}</span>
                            <Badge variant="secondary" className="bg-white/50">
                              {stageLeads.length}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-3 overflow-y-auto pr-2 min-h-[200px]">
                          {stageLeads.map((lead: LeadWithDetails) => (
                            <DraggableLeadCard
                              key={lead.id}
                              lead={lead}
                              getPriorityColor={getPriorityColor}
                              formatCurrency={formatCurrency}
                              onViewDetails={setSelectedLead}
                            />
                          ))}
                          {stageLeads.length === 0 && (
                            <div className="text-center text-sm text-gray-400 mt-8">
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
      />
    </div>
  );
}
