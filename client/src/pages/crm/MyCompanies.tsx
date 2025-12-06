import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Search, List, Kanban, RefreshCw, Phone, Mail, MapPin, 
  Globe, Calendar, ExternalLink, User, Clock
} from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { CompanyNotes } from "@/components/crm/CompanyNotes";

interface CompanyActivity {
  id: number;
  companyId: number;
  activityType: string;
  subject: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

function CompanyActivityTimeline({ companyId }: { companyId: number }) {
  const { data: activities, isLoading } = useQuery<CompanyActivity[]>({
    queryKey: ['/api/crm/companies', companyId, 'activities'],
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/activities`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'call':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'stage_change':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activities recorded yet</p>
            <p className="text-sm">Click email or phone to log activities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 border-b last:border-b-0 pb-3 last:pb-0">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.activityType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.subject}</p>
                {activity.description && (
                  <p className="text-sm text-gray-600">{activity.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface Company {
  id: number;
  companyName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  addressCity: string | null;
  addressCountry: string | null;
  origin: string | null;
  status: string | null;
  companyStage: string | null;
  priority: string | null;
  assignedTo: string | null;
  createdAt: string;
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  website: string | null;
}

const COMPANY_STAGES = [
  { id: "new", label: "New", color: "bg-gray-100 text-gray-800" },
  { id: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800" },
  { id: "engaged", label: "Engaged", color: "bg-cyan-100 text-cyan-800" },
  { id: "qualified", label: "Qualified", color: "bg-purple-100 text-purple-800" },
  { id: "customer", label: "Customer", color: "bg-green-100 text-green-800" },
  { id: "churned", label: "Churned", color: "bg-red-100 text-red-800" },
];

const PRIORITY_COLORS: Record<string, string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-orange-100 text-orange-800",
  cold: "bg-blue-100 text-blue-800",
  normal: "bg-gray-100 text-gray-800",
};

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col min-w-[280px] sm:min-w-[300px] shrink-0 h-full transition-colors ${isOver ? 'bg-blue-50' : ''}`}
    >
      {children}
    </div>
  );
}

interface DraggableCompanyCardProps {
  company: Company;
  onClick: (company: Company) => void;
}

function DraggableCompanyCard({ company, onClick }: DraggableCompanyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = PRIORITY_COLORS[company.priority || "normal"] || PRIORITY_COLORS.normal;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        className="cursor-move hover:shadow-lg transition-shadow mb-2" 
        data-testid={`card-company-${company.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick(company);
        }}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                {company.companyName}
              </CardTitle>
              {company.origin === 'website' && (
                <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700 border-green-200">
                  Website
                </Badge>
              )}
            </div>
            <Badge className={`text-xs ${priorityColor}`}>
              {company.priority || "normal"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-1.5">
          {company.primaryEmail && (
            <div className="flex items-center text-xs text-gray-600 truncate">
              <Mail className="h-3 w-3 mr-1.5 shrink-0" />
              <span className="truncate">{company.primaryEmail}</span>
            </div>
          )}
          {company.primaryPhone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="h-3 w-3 mr-1.5 shrink-0" />
              {company.primaryPhone}
            </div>
          )}
          {(company.addressCity || company.addressCountry) && (
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
              {[company.addressCity, company.addressCountry].filter(Boolean).join(", ")}
            </div>
          )}
          {company.nextFollowUpDate && (
            <div className="flex items-center text-xs text-amber-600 font-medium mt-2">
              <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
              Follow up: {format(new Date(company.nextFollowUpDate), 'MMM dd')}
            </div>
          )}
          <div className="pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 w-full"
              onClick={(e) => {
                e.stopPropagation();
                onClick(company);
              }}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyCompanies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: companiesData, isLoading, refetch } = useQuery<{ companies: Company[] }>({
    queryKey: ['/api/crm/companies', { assignedTo: user?.id }],
  });

  const myCompanies = (companiesData?.companies || []).filter(
    (company) => company.assignedTo === user?.id
  );

  const updateStageMutation = useMutation({
    mutationFn: async ({ companyId, stage }: { companyId: number; stage: string }) => {
      return apiRequest(`/api/crm/companies/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ companyStage: stage }),
      });
    },
    onMutate: async ({ companyId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/crm/companies'] });
      const previousData = queryClient.getQueryData<{ companies: Company[] }>(['/api/crm/companies', { assignedTo: user?.id }]);
      
      if (previousData) {
        queryClient.setQueryData<{ companies: Company[] }>(
          ['/api/crm/companies', { assignedTo: user?.id }],
          {
            ...previousData,
            companies: previousData.companies.map(c => 
              c.id === companyId ? { ...c, companyStage: stage } : c
            ),
          }
        );
      }
      
      return { previousData };
    },
    onSuccess: () => {
      toast({ title: "Company stage updated" });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/crm/companies', { assignedTo: user?.id }], context.previousData);
      }
      toast({ title: "Failed to update stage", description: error.message || "Please try again", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });
    },
  });

  // Activity logging mutation
  const logActivityMutation = useMutation({
    mutationFn: async ({ companyId, activityType, subject, description }: { 
      companyId: number; 
      activityType: string; 
      subject: string; 
      description: string;
    }) => {
      return apiRequest(`/api/crm/companies/${companyId}/activities`, {
        method: 'POST',
        body: JSON.stringify({ activityType, subject, description }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', variables.companyId, 'activities'] });
    },
  });

  // Handler for email action
  const handleEmailAction = (company: Company) => {
    if (company.primaryEmail) {
      logActivityMutation.mutate({
        companyId: company.id,
        activityType: 'email',
        subject: 'Email Sent',
        description: `Initiated email to ${company.primaryEmail}`,
      });
      window.open(`mailto:${company.primaryEmail}`, '_blank');
    }
  };

  // Handler for call action
  const handleCallAction = (company: Company) => {
    if (company.primaryPhone) {
      logActivityMutation.mutate({
        companyId: company.id,
        activityType: 'call',
        subject: 'Call Made',
        description: `Initiated call to ${company.primaryPhone}`,
      });
      window.open(`tel:${company.primaryPhone}`, '_blank');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({ title: "Data refreshed" });
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const companyId = parseInt(active.id.toString());
    const newStage = over.id.toString();

    const company = myCompanies.find(c => c.id === companyId);
    if (!company || company.companyStage === newStage) return;

    updateStageMutation.mutate({ companyId, stage: newStage });
  };

  const filteredCompanies = myCompanies.filter((company) => {
    const matchesSearch = company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.primaryEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesPriority = priorityFilter === "all" || company.priority === priorityFilter;
    const matchesStage = stageFilter === "all" || company.companyStage === stageFilter;
    return matchesSearch && matchesPriority && matchesStage;
  });

  const getCompaniesByStage = (stageId: string) => {
    return filteredCompanies.filter((company) => (company.companyStage || "new") === stageId);
  };

  const activeCompany = activeId ? myCompanies.find(c => c.id.toString() === activeId) : null;

  const stats = {
    total: myCompanies.length,
    new: myCompanies.filter(c => c.companyStage === 'new').length,
    engaged: myCompanies.filter(c => c.companyStage === 'engaged' || c.companyStage === 'qualified').length,
    customers: myCompanies.filter(c => c.companyStage === 'customer').length,
  };

  if (isLoading) {
    return (
      <SalesLayout title="My Companies" subtitle="Manage companies assigned to you">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </SalesLayout>
    );
  }

  return (
    <SalesLayout title="My Companies" subtitle="Manage companies assigned to you">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="rounded-l-none"
                data-testid="button-view-kanban"
              >
                <Kanban className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <p className="text-xs text-muted-foreground">New Companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.engaged}</div>
            <p className="text-xs text-muted-foreground">Engaged/Qualified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-stage">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {COMPANY_STAGES.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={(args) => {
            const { droppableContainers, active } = args;
            const containers = Array.from(droppableContainers);
            for (const container of containers) {
              const rect = container[1].rect.current;
              if (rect) {
                const pointerX = args.pointerCoordinates?.x ?? 0;
                const pointerY = args.pointerCoordinates?.y ?? 0;
                if (
                  pointerX >= rect.left &&
                  pointerX <= rect.right &&
                  pointerY >= rect.top &&
                  pointerY <= rect.bottom
                ) {
                  return [{ id: container[0] }];
                }
              }
            }
            return [];
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="relative">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {COMPANY_STAGES.map((stage) => {
                  const stageCompanies = getCompaniesByStage(stage.id);
                  return (
                    <DroppableColumn key={stage.id} id={stage.id}>
                      <Card className="h-full min-h-[500px] flex flex-col">
                        <CardHeader className="p-3 border-b">
                          <div className="flex items-center justify-between">
                            <Badge className={stage.color}>{stage.label}</Badge>
                            <span className="text-sm text-muted-foreground">{stageCompanies.length}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-2 flex-1 overflow-y-auto">
                          <SortableContext
                            items={stageCompanies.map(c => c.id.toString())}
                            strategy={verticalListSortingStrategy}
                          >
                            {stageCompanies.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                No companies
                              </div>
                            ) : (
                              stageCompanies.map((company) => (
                                <DraggableCompanyCard
                                  key={company.id}
                                  company={company}
                                  onClick={setSelectedCompany}
                                />
                              ))
                            )}
                          </SortableContext>
                        </CardContent>
                      </Card>
                    </DroppableColumn>
                  );
                })}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeCompany && (
              <Card className="cursor-move shadow-xl w-[280px]">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-semibold">{activeCompany.companyName}</CardTitle>
                </CardHeader>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Company</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Stage</th>
                  <th className="text-left p-3 font-medium">Priority</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => {
                    const stageInfo = COMPANY_STAGES.find(s => s.id === company.companyStage) || COMPANY_STAGES[0];
                    return (
                      <tr 
                        key={company.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedCompany(company)}
                        data-testid={`row-company-${company.id}`}
                      >
                        <td className="p-3">
                          <div className="font-medium">{company.companyName}</div>
                          {company.origin === 'website' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 mt-1">
                              Website
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{company.primaryEmail || '-'}</div>
                          <div className="text-xs text-gray-500">{company.primaryPhone || '-'}</div>
                        </td>
                        <td className="p-3 text-sm">
                          {[company.addressCity, company.addressCountry].filter(Boolean).join(", ") || '-'}
                        </td>
                        <td className="p-3">
                          <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={PRIORITY_COLORS[company.priority || "normal"]}>
                            {company.priority || "normal"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompany(company);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedCompany?.companyName}
            </DialogTitle>
          </DialogHeader>

          {selectedCompany && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Company Information Section */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Company Name</p>
                        <p className="font-medium">{selectedCompany.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Industry</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <p className="font-medium">
                          {selectedCompany.website ? (
                            <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {selectedCompany.website}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">
                          {[selectedCompany.addressCity, selectedCompany.addressCountry].filter(Boolean).join(", ") || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Contact Section */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Primary Contact
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Contact Name</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Designation</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {selectedCompany.primaryEmail ? (
                            <a 
                              href={`mailto:${selectedCompany.primaryEmail}`} 
                              className="text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEmailAction(selectedCompany);
                              }}
                            >
                              {selectedCompany.primaryEmail}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {selectedCompany.primaryPhone ? (
                            <a 
                              href={`tel:${selectedCompany.primaryPhone}`} 
                              className="text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCallAction(selectedCompany);
                              }}
                            >
                              {selectedCompany.primaryPhone}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage & Origin Section */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Status Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Stage</p>
                        <div className="mt-1">
                          <Select 
                            value={selectedCompany.companyStage || 'new'}
                            onValueChange={(value) => {
                              updateStageMutation.mutate({ companyId: selectedCompany.id, stage: value });
                              setSelectedCompany({ ...selectedCompany, companyStage: value });
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_STAGES.map(stage => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  {stage.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Origin</p>
                        <p className="font-medium mt-1">
                          {selectedCompany.origin === 'website' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">Website Registration</Badge>
                          ) : (
                            <Badge variant="outline">Manual Entry</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <CompanyNotes 
                  companyId={selectedCompany.id} 
                  currentUserId={user?.id || ''} 
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <CompanyActivityTimeline companyId={selectedCompany.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </SalesLayout>
  );
}
