import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  Trash2,
  Eye,
  MoreVertical,
  Users,
} from "lucide-react";
import { type LeadWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LeadListViewProps {
  leads: LeadWithDetails[];
  onViewDetails: (lead: LeadWithDetails) => void;
  salesReps: any[];
  canAssignLeads: boolean;
  onAssign: (leadId: number, assignedTo: string) => void;
}

type SortColumn = 'companyName' | 'contactName' | 'currentStage' | 'priority' | 'expectedOrderValue' | 'createdAt' | 'assignedRep';
type SortOrder = 'asc' | 'desc';

export default function LeadListView({ leads, onViewDetails, salesReps, canAssignLeads, onAssign }: LeadListViewProps) {
  const { toast } = useToast();
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortColumn) {
      case 'companyName':
        aVal = a.company?.companyName || '';
        bVal = b.company?.companyName || '';
        break;
      case 'contactName':
        aVal = a.contactPerson?.contactName || '';
        bVal = b.contactPerson?.contactName || '';
        break;
      case 'currentStage':
        aVal = a.currentStage || '';
        bVal = b.currentStage || '';
        break;
      case 'priority':
        const priorityOrder: Record<string, number> = { hot: 3, warm: 2, cold: 1 };
        aVal = priorityOrder[a.priority || 'cold'] || 0;
        bVal = priorityOrder[b.priority || 'cold'] || 0;
        break;
      case 'expectedOrderValue':
        aVal = a.expectedOrderValue ? parseFloat(a.expectedOrderValue.toString()) : 0;
        bVal = b.expectedOrderValue ? parseFloat(b.expectedOrderValue.toString()) : 0;
        break;
      case 'createdAt':
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      case 'assignedRep':
        aVal = a.salesRep ? `${a.salesRep.firstName} ${a.salesRep.lastName}` : '';
        bVal = b.salesRep ? `${b.salesRep.firstName} ${b.salesRep.lastName}` : '';
        break;
      default:
        aVal = '';
        bVal = '';
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const isAllSelected = paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length;
  const isSomeSelected = selectedLeads.length > 0 && selectedLeads.length < paginatedLeads.length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hot": return "bg-red-500 text-white";
      case "warm": return "bg-orange-500 text-white";
      case "cold": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      new_lead: "New Lead",
      first_contact: "First Contact",
      discussion: "Discussion",
      meeting_scheduled: "Meeting Scheduled",
      meeting_completed: "Meeting Completed",
      sample_requested: "Sample Requested",
      sample_submitted: "Sample Submitted",
      sample_feedback: "Sample Feedback",
      quotation_sent: "Quotation Sent",
      negotiation: "Negotiation",
      certificates_shared: "Certificates Shared",
      order_pending: "Order Pending",
      won: "Won",
      lost: "Lost",
      on_hold: "On Hold",
    };
    return labels[stage] || stage;
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "$0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
  };

  const SortHeader = ({ column, children }: { column: SortColumn; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className="hover:bg-transparent font-semibold -ml-4"
      >
        {children}
        {sortColumn === column && (
          sortOrder === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </TableHead>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Bulk Actions Toolbar */}
      {selectedLeads.length > 0 && canAssignLeads && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-bulk-assign">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Sales Rep</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {salesReps.map((rep) => (
                  <DropdownMenuItem
                    key={rep.id}
                    onClick={() => {
                      selectedLeads.forEach(leadId => onAssign(leadId, rep.id));
                      setSelectedLeads([]);
                    }}
                    data-testid={`menu-bulk-assign-${rep.id}`}
                  >
                    <UserPlus className="h-3 w-3 mr-2" />
                    {rep.firstName} {rep.lastName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedLeads([])}
              data-testid="button-clear-selection"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {canAssignLeads && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected || isSomeSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all leads"
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
              )}
              <TableHead className="w-[120px]">Lead ID</TableHead>
              <SortHeader column="companyName">Company</SortHeader>
              <SortHeader column="contactName">Contact</SortHeader>
              <SortHeader column="currentStage">Stage</SortHeader>
              <SortHeader column="priority">Priority</SortHeader>
              <SortHeader column="expectedOrderValue">Value</SortHeader>
              <SortHeader column="assignedRep">Assigned To</SortHeader>
              <SortHeader column="createdAt">Created</SortHeader>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAssignLeads ? 10 : 9} className="text-center py-8 text-gray-500">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => onViewDetails(lead)}
                  data-testid={`row-lead-${lead.id}`}
                >
                  {canAssignLeads && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
                        aria-label={`Select lead ${lead.leadId}`}
                        data-testid={`checkbox-lead-${lead.id}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs">{lead.leadId}</TableCell>
                  <TableCell className="font-medium">
                    {lead.company?.companyName || "Unknown Company"}
                  </TableCell>
                  <TableCell>{lead.contactPerson?.contactName || "No contact"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getStageLabel(lead.currentStage || '')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getPriorityColor(lead.priority || "warm")}`}>
                      {lead.priority || "warm"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(lead.expectedOrderValue)}
                  </TableCell>
                  <TableCell>
                    {lead.salesRep ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        {lead.salesRep.firstName} {lead.salesRep.lastName}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {lead.createdAt ? formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true }) : 'N/A'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-actions-${lead.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(lead)} data-testid={`menu-view-${lead.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canAssignLeads && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                            {salesReps.map((rep) => (
                              <DropdownMenuItem
                                key={rep.id}
                                onClick={() => onAssign(lead.id, rep.id)}
                                data-testid={`menu-assign-${lead.id}-${rep.id}`}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                {rep.firstName} {rep.lastName}
                                {lead.assignedSalesRep === rep.id && " (current)"}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, sortedLeads.length)}
            </span>{' '}
            of <span className="font-medium">{sortedLeads.length}</span> leads
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8"
                    data-testid={`button-page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
