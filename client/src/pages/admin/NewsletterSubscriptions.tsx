import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Download, Search, Filter, Users, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";

interface NewsletterSubscription {
  id: number;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewsletterSubscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ["/api/admin/newsletter/subscriptions", { 
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      limit: 100 
    }],
  });

  const subscriptions = (subscriptionsData as any)?.subscriptions || [];
  const totalSubscriptions = (subscriptionsData as any)?.total || 0;

  // Filter subscriptions based on search and filters
  const filteredSubscriptions = subscriptions.filter((subscription: NewsletterSubscription) => {
    const matchesSearch = subscription.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "all" || subscription.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const activeSubscriptions = subscriptions.filter((sub: NewsletterSubscription) => sub.isActive).length;
  const inactiveSubscriptions = subscriptions.filter((sub: NewsletterSubscription) => !sub.isActive).length;

  const handleExport = () => {
    const csvContent = [
      ["Email", "Status", "Source", "Subscribed Date", "Last Updated"],
      ...filteredSubscriptions.map((sub: NewsletterSubscription) => [
        sub.email,
        sub.isActive ? "Active" : "Inactive",
        sub.source,
        format(new Date(sub.subscribedAt), "yyyy-MM-dd HH:mm:ss"),
        format(new Date(sub.updatedAt), "yyyy-MM-dd HH:mm:ss")
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscriptions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "blog": return "bg-blue-100 text-blue-800";
      case "blog-post": return "bg-green-100 text-green-800";
      case "footer": return "bg-purple-100 text-purple-800";
      case "popup": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscriptions</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscriptions</h1>
          <p className="text-gray-600">Manage your newsletter subscriber list</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              All newsletter subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently subscribed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              No longer subscribed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by email address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="blog">Blog Page</SelectItem>
                <SelectItem value="blog-post">Blog Post</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Subscriptions ({filteredSubscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || sourceFilter !== "all" || statusFilter !== "all"
                  ? "No subscriptions found"
                  : "No newsletter subscriptions yet"
                }
              </h3>
              <p className="text-gray-600">
                {searchQuery || sourceFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "When users subscribe to your newsletter, they'll appear here."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed Date</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription: NewsletterSubscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={subscription.isActive ? "default" : "secondary"}
                          className={subscription.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {subscription.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getSourceBadgeColor(subscription.source)}
                        >
                          {subscription.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscription.subscribedAt), "MMM dd, yyyy 'at' HH:mm")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscription.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}