import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Search, Plus, MapPin, Globe, Users } from "lucide-react";

interface Company {
  id: number;
  companyName: string;
  gstNumber?: string | null;
  industryType?: string | null;
  companySize?: string | null;
  website?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressCountry?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export default function CompanyManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  // Fetch companies with RBAC filtering
  const { data: companiesData, isLoading } = useQuery<{ companies: Company[]; total: number }>({
    queryKey: ["/api/crm/companies", { search: searchTerm, industryType: industryFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (industryFilter && industryFilter !== "all") params.append("industryType", industryFilter);
      
      const response = await fetch(`/api/crm/companies?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
  });

  const companies = companiesData?.companies || [];
  const total = companiesData?.total || 0;

  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  const isAdmin = user && (user as any).role ? adminRoles.includes((user as any).role) : false;

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
              ? "Manage all companies and assignments"
              : "View companies assigned to you or created by you"}
          </p>
        </div>
        <Button data-testid="button-create-company">
          <Plus className="h-4 w-4 mr-2" />
          New Company
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, GST, or website..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-companies"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-industry-filter">
                <SelectValue placeholder="All Industries" />
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
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Companies</p>
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
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold" data-testid="text-assigned-companies">
                  {companies.filter(c => c.assignedTo).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold" data-testid="text-unassigned-companies">
                  {companies.filter(c => !c.assignedTo).length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium" data-testid={`text-company-name-${company.id}`}>
                            {company.companyName}
                          </p>
                          {company.website && (
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              {company.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {company.industryType || "-"}
                      </span>
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
                        {company.companySize || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {company.assignedTo || (
                          <span className="text-amber-600">Unassigned</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-view-company-${company.id}`}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
