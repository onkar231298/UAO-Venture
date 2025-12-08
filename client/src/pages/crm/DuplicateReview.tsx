import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  GitMerge, 
  ArrowRight,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface PotentialMatch {
  companyId: number;
  companyName: string;
  matchType: string;
  confidence: number;
  matchedFields?: string[];
  matchDetails?: string;
}

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
  createdAt: string;
  duplicateStatus?: string | null;
  duplicateConfidence?: string | null;
  potentialMatches?: PotentialMatch[];
}

export default function DuplicateReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateCompany | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [masterCompanyId, setMasterCompanyId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'unique' | 'merge' | null>(null);

  const { data: duplicates, isLoading, refetch, isRefetching } = useQuery<DuplicateCompany[]>({
    queryKey: ['/api/admin/companies/duplicates'],
  });

  const markUniqueMutation = useMutation({
    mutationFn: async (companyId: number) => {
      return await apiRequest(`/api/admin/companies/${companyId}/mark-unique`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company marked as unique (not a duplicate)",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies/duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setSelectedDuplicate(null);
      setConfirmDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company status",
        variant: "destructive",
      });
    },
  });

  const mergeCompaniesMutation = useMutation({
    mutationFn: async ({ masterCompanyId, duplicateCompanyId }: { masterCompanyId: number; duplicateCompanyId: number }) => {
      return await apiRequest('/api/admin/companies/merge', {
        method: 'POST',
        body: JSON.stringify({
          masterCompanyId,
          duplicateCompanyId,
        }),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Companies Merged",
        description: data.message || "Companies merged successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies/duplicates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setMergeDialogOpen(false);
      setSelectedDuplicate(null);
      setMasterCompanyId(null);
      setConfirmDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to merge companies",
        variant: "destructive",
      });
    },
  });

  const handleMarkUnique = (company: DuplicateCompany) => {
    setSelectedDuplicate(company);
    setConfirmAction('unique');
    setConfirmDialogOpen(true);
  };

  const handleMerge = (company: DuplicateCompany) => {
    setSelectedDuplicate(company);
    setMergeDialogOpen(true);
  };

  const confirmMarkUnique = () => {
    if (selectedDuplicate) {
      markUniqueMutation.mutate(selectedDuplicate.id);
    }
  };

  const confirmMerge = () => {
    if (selectedDuplicate && masterCompanyId) {
      mergeCompaniesMutation.mutate({
        masterCompanyId,
        duplicateCompanyId: selectedDuplicate.id,
      });
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return <Badge variant="destructive" data-testid="badge-confidence-high">{confidence}% Match</Badge>;
    } else if (confidence >= 70) {
      return <Badge className="bg-orange-500 text-white" data-testid="badge-confidence-medium">{confidence}% Match</Badge>;
    } else {
      return <Badge variant="secondary" data-testid="badge-confidence-low">{confidence}% Match</Badge>;
    }
  };

  const getOriginBadge = (origin?: string | null) => {
    if (origin === 'website') {
      return <Badge className="bg-blue-100 text-blue-800" data-testid="badge-origin-website">Website</Badge>;
    } else if (origin === 'manual') {
      return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-origin-manual">Manual</Badge>;
    } else if (origin === 'import') {
      return <Badge className="bg-purple-100 text-purple-800" data-testid="badge-origin-import">Import</Badge>;
    }
    return <Badge variant="outline" data-testid="badge-origin-unknown">Unknown</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-duplicates">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="duplicate-review-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Duplicate Review Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and resolve potential duplicate company records
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {(!duplicates || duplicates.length === 0) ? (
        <Card data-testid="card-no-duplicates">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold" data-testid="text-no-duplicates-title">No Duplicates Found</h3>
            <p className="text-muted-foreground text-center mt-2">
              All company records appear to be unique. Great job maintaining data quality!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground" data-testid="text-duplicate-count">
            Found {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''} for review
          </p>
          
          {duplicates.map((company) => (
            <Card key={company.id} className="border-l-4 border-l-amber-500" data-testid={`card-duplicate-${company.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2" data-testid={`text-company-name-${company.id}`}>
                      <Building2 className="h-5 w-5" />
                      {company.companyName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      {getOriginBadge(company.origin)}
                      {company.duplicateConfidence && (
                        <Badge variant="outline" data-testid={`badge-stored-confidence-${company.id}`}>
                          {company.duplicateConfidence}% stored confidence
                        </Badge>
                      )}
                      <span className="text-xs" data-testid={`text-created-${company.id}`}>
                        Created {format(new Date(company.createdAt), 'MMM d, yyyy')}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkUnique(company)}
                      disabled={markUniqueMutation.isPending}
                      data-testid={`button-mark-unique-${company.id}`}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Not a Duplicate
                    </Button>
                    {company.potentialMatches && company.potentialMatches.length > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMerge(company)}
                        data-testid={`button-merge-${company.id}`}
                      >
                        <GitMerge className="h-4 w-4 mr-1" />
                        Merge
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {company.primaryEmail && (
                    <div className="flex items-center gap-2 text-sm" data-testid={`text-email-${company.id}`}>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {company.primaryEmail}
                    </div>
                  )}
                  {company.primaryPhone && (
                    <div className="flex items-center gap-2 text-sm" data-testid={`text-phone-${company.id}`}>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {company.primaryPhone}
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2 text-sm" data-testid={`text-website-${company.id}`}>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {company.website}
                    </div>
                  )}
                  {(company.addressCity || company.addressCountry) && (
                    <div className="flex items-center gap-2 text-sm" data-testid={`text-location-${company.id}`}>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {[company.addressCity, company.addressState, company.addressCountry].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                {company.potentialMatches && company.potentialMatches.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2" data-testid={`text-matches-header-${company.id}`}>
                        <Users className="h-4 w-4" />
                        Potential Matches ({company.potentialMatches.length})
                      </h4>
                      <div className="space-y-2">
                        {company.potentialMatches.map((match) => (
                          <div
                            key={match.companyId}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            data-testid={`match-${company.id}-${match.companyId}`}
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="font-medium" data-testid={`text-match-name-${match.companyId}`}>
                                  {match.companyName}
                                </span>
                                <div className="text-xs text-muted-foreground" data-testid={`text-match-fields-${match.companyId}`}>
                                  {match.matchedFields ? `Matched on: ${match.matchedFields.join(', ')}` : match.matchDetails || match.matchType}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getConfidenceBadge(match.confidence)}
                              <Badge variant="outline" data-testid={`badge-match-type-${match.companyId}`}>
                                {match.matchType}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent data-testid="dialog-confirm-unique">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{selectedDuplicate?.companyName}" as unique (not a duplicate)?
              This will remove it from the review queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unique">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkUnique}
              disabled={markUniqueMutation.isPending}
              data-testid="button-confirm-unique"
            >
              {markUniqueMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-merge">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Merge Companies
            </DialogTitle>
            <DialogDescription>
              Choose which company should be the master record. The duplicate will be merged into the master.
            </DialogDescription>
          </DialogHeader>

          {selectedDuplicate && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-amber-50 border-amber-200" data-testid="merge-source-company">
                <h4 className="font-medium flex items-center gap-2 text-amber-800">
                  <Building2 className="h-4 w-4" />
                  Duplicate Company (will be archived)
                </h4>
                <p className="text-sm mt-1" data-testid="text-merge-source-name">{selectedDuplicate.companyName}</p>
                {selectedDuplicate.primaryEmail && (
                  <p className="text-xs text-muted-foreground">{selectedDuplicate.primaryEmail}</p>
                )}
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Master Company</label>
                <Select
                  value={masterCompanyId?.toString() || ""}
                  onValueChange={(val) => setMasterCompanyId(parseInt(val))}
                >
                  <SelectTrigger data-testid="select-master-company">
                    <SelectValue placeholder="Choose the master record..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDuplicate.potentialMatches?.map((match) => (
                      <SelectItem
                        key={match.companyId}
                        value={match.companyId.toString()}
                        data-testid={`select-option-${match.companyId}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{match.companyName}</span>
                          <Badge variant="secondary" className="ml-2">
                            {match.confidence}% match
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {masterCompanyId && (
                <div className="p-4 border rounded-lg bg-green-50 border-green-200" data-testid="merge-target-company">
                  <h4 className="font-medium flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Master Company (will receive all data)
                  </h4>
                  <p className="text-sm mt-1">
                    {selectedDuplicate.potentialMatches?.find(m => m.companyId === masterCompanyId)?.companyName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    All contacts, leads, activities, and notes from the duplicate will be transferred to this company.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMergeDialogOpen(false);
                setMasterCompanyId(null);
              }}
              data-testid="button-cancel-merge"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmMerge}
              disabled={!masterCompanyId || mergeCompaniesMutation.isPending}
              data-testid="button-confirm-merge"
            >
              {mergeCompaniesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <GitMerge className="h-4 w-4 mr-2" />
              )}
              Merge Companies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
