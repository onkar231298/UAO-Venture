import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2,
  Mail,
  MapPin,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  Shield,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";
import { format } from "date-fns";

interface DuplicateCompany {
  id: number;
  companyName: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  website?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressCountry?: string | null;
  origin?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  createdAt: string;
  duplicateStatus?: string | null;
  isOldest: boolean;
  suggestion: 'keep' | 'delete' | 'review';
}

interface DuplicateGroup {
  groupName: string;
  matchType: string;
  confidence: number;
  companies: DuplicateCompany[];
}

export default function DuplicateReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; company: DuplicateCompany | null }>({ open: false, company: null });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ open: boolean; companyIds: number[]; count: number }>({ open: false, companyIds: [], count: 0 });

  const { data: duplicateGroups, isLoading, refetch, isRefetching } = useQuery<DuplicateGroup[]>({
    queryKey: ['/api/admin/companies/duplicates'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (companyId: number) => {
      return await apiRequest(`/api/crm/companies/${companyId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Company deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies/duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setDeleteConfirm({ open: false, company: null });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete company", description: err.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (companyIds: number[]) => {
      return await apiRequest('/api/crm/companies/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ companyIds }),
      });
    },
    onSuccess: (_, deletedIds) => {
      toast({ title: `${deletedIds.length} companies deleted successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies/duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setBulkDeleteConfirm({ open: false, companyIds: [], count: 0 });
      setSelectedIds(prev => {
        const next = new Set(prev);
        deletedIds.forEach(id => next.delete(id));
        return next;
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete companies", description: err.message, variant: "destructive" });
    },
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (group: DuplicateGroup) => {
    const nonKeepIds = group.companies.filter(c => c.suggestion !== 'keep').map(c => c.id);
    const allSelected = nonKeepIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        nonKeepIds.forEach(id => next.delete(id));
      } else {
        nonKeepIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectAllDuplicates = () => {
    if (!duplicateGroups) return;
    const allDuplicateIds = duplicateGroups.flatMap(g => g.companies.filter(c => c.suggestion !== 'keep').map(c => c.id));
    const allSelected = allDuplicateIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allDuplicateIds));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteConfirm({ open: true, companyIds: Array.from(selectedIds), count: selectedIds.size });
  };

  const handleDeleteSuggested = (group: DuplicateGroup) => {
    const toDelete = group.companies.filter(c => c.suggestion === 'delete').map(c => c.id);
    if (toDelete.length > 0) {
      setBulkDeleteConfirm({ open: true, companyIds: toDelete, count: toDelete.length });
    }
  };

  const selectedCompanyDetails = useMemo(() => {
    if (!duplicateGroups || bulkDeleteConfirm.companyIds.length === 0) return [];
    const idSet = new Set(bulkDeleteConfirm.companyIds);
    return duplicateGroups.flatMap(g => g.companies).filter(c => idSet.has(c.id));
  }, [duplicateGroups, bulkDeleteConfirm.companyIds]);

  const totalDuplicates = duplicateGroups?.reduce((sum, g) => sum + g.companies.length - 1, 0) || 0;
  const allDuplicateIds = useMemo(() => {
    if (!duplicateGroups) return [];
    return duplicateGroups.flatMap(g => g.companies.filter(c => c.suggestion !== 'keep').map(c => c.id));
  }, [duplicateGroups]);
  const allSelected = allDuplicateIds.length > 0 && allDuplicateIds.every(id => selectedIds.has(id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Duplicate Review Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and resolve duplicate company records. Select entries and delete them in bulk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedIds.size} Selected
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {(!duplicateGroups || duplicateGroups.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">No Duplicates Found</h3>
            <p className="text-muted-foreground text-center mt-2">
              All company records appear to be unique. Great job maintaining data quality!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={selectAllDuplicates}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All Duplicates ({allDuplicateIds.length} entries)
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-amber-600">{duplicateGroups.length} groups</span> with{' '}
              <span className="font-semibold text-red-600">{totalDuplicates} duplicate entries</span> to review
            </p>
          </div>
          
          {duplicateGroups.map((group, idx) => {
            const groupKey = `${group.groupName}-${idx}`;
            const isExpanded = expandedGroups.has(groupKey);
            const deleteSuggestions = group.companies.filter(c => c.suggestion === 'delete');
            const nonKeepIds = group.companies.filter(c => c.suggestion !== 'keep').map(c => c.id);
            const groupAllSelected = nonKeepIds.length > 0 && nonKeepIds.every(id => selectedIds.has(id));
            const groupSomeSelected = nonKeepIds.some(id => selectedIds.has(id));
            const groupSelectedCount = nonKeepIds.filter(id => selectedIds.has(id)).length;
            
            return (
              <Card key={groupKey} className="border-l-4 border-l-amber-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={groupAllSelected}
                        onCheckedChange={() => toggleSelectGroup(group)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                        onClick={() => toggleGroup(groupKey)}
                      >
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5" />
                            {group.groupName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={group.confidence === 100 ? "destructive" : "secondary"}>
                              {group.confidence}% Match
                            </Badge>
                            <Badge variant="outline">
                              {group.matchType === 'exact_name' ? 'Exact Name Match' : 'Similar Name'}
                            </Badge>
                            <span className="text-xs">
                              {group.companies.length} entries found
                            </span>
                            {deleteSuggestions.length > 0 && (
                              <Badge className="bg-red-100 text-red-800">
                                {deleteSuggestions.length} suggested for deletion
                              </Badge>
                            )}
                            {groupSelectedCount > 0 && (
                              <Badge className="bg-blue-100 text-blue-800">
                                {groupSelectedCount} selected
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    {deleteSuggestions.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSuggested(group); }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete {deleteSuggestions.length} Duplicate{deleteSuggestions.length > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={groupAllSelected}
                                onCheckedChange={() => toggleSelectGroup(group)}
                              />
                            </TableHead>
                            <TableHead className="w-[80px]">Suggestion</TableHead>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Origin</TableHead>
                            <TableHead>Added Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.companies.map((company) => (
                            <TableRow 
                              key={company.id}
                              className={
                                selectedIds.has(company.id) 
                                  ? 'bg-blue-50/70' 
                                  : company.suggestion === 'keep' 
                                    ? 'bg-green-50/50' 
                                    : company.suggestion === 'delete' 
                                      ? 'bg-red-50/50' 
                                      : ''
                              }
                            >
                              <TableCell>
                                {company.suggestion === 'keep' ? (
                                  <Checkbox disabled checked={false} />
                                ) : (
                                  <Checkbox
                                    checked={selectedIds.has(company.id)}
                                    onCheckedChange={() => toggleSelect(company.id)}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {company.suggestion === 'keep' ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Keep
                                  </Badge>
                                ) : company.suggestion === 'delete' ? (
                                  <Badge className="bg-red-100 text-red-800 text-xs">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Review
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{company.companyName}</div>
                                <div className="text-xs text-muted-foreground">ID: {company.id}</div>
                              </TableCell>
                              <TableCell>
                                {company.assignedToName ? (
                                  <div className="flex items-center gap-1 text-sm">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    {company.assignedToName}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {company.primaryEmail ? (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate max-w-[200px]">{company.primaryEmail}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {(company.addressCity || company.addressCountry) ? (
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    {[company.addressCity, company.addressCountry].filter(Boolean).join(', ')}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {company.origin || 'unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {format(new Date(company.createdAt), 'MMM d, yyyy')}
                                </div>
                                {company.isOldest && (
                                  <div className="text-xs text-green-600 font-medium">Oldest entry</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {company.status || 'active'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDeleteConfirm({ open: true, company })}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, company: open ? deleteConfirm.company : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm.company?.companyName}" (ID: {deleteConfirm.company?.id})?
              {deleteConfirm.company?.assignedToName && (
                <span className="block mt-2 font-medium">
                  This company is assigned to: {deleteConfirm.company.assignedToName}
                </span>
              )}
              <span className="block mt-2">
                Added on: {deleteConfirm.company?.createdAt ? format(new Date(deleteConfirm.company.createdAt), 'MMM d, yyyy') : 'Unknown'}
              </span>
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm.company && deleteMutation.mutate(deleteConfirm.company.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirm.open} onOpenChange={(open) => !open && setBulkDeleteConfirm({ open: false, companyIds: [], count: 0 })}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkDeleteConfirm.count} Companies</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span className="block mb-2">
                  The following {bulkDeleteConfirm.count} duplicate entries will be permanently deleted:
                </span>
                <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
                  {selectedCompanyDetails.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm bg-red-50 rounded p-2">
                      <span className="font-medium">{c.companyName} <span className="text-muted-foreground font-normal">(ID: {c.id})</span></span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {c.assignedToName && <span>{c.assignedToName}</span>}
                        <span>{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <span className="block mt-3 text-red-600 font-medium">
                  This action cannot be undone. All contacts, leads, and activities linked to these companies will also be removed.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(bulkDeleteConfirm.companyIds)}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete {bulkDeleteConfirm.count} Companies
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
