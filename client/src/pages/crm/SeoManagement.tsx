import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, TrendingUp, Search, Globe, BarChart3, FileText, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SeoAuditResult {
  productId: string;
  name: string;
  slug: string;
  seoScore: number;
  issues: string[];
  recommendations: string[];
}

interface SeoIssue {
  id: number;
  url: string;
  type: string;
  status: string;
  errorMessage?: string;
  statusCode?: number;
  detectedAt: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  category: string;
  authorId: string;
  publishedAt?: string;
  isPublished: boolean;
  featuredImage?: string;
  readingTime?: number;
  createdAt: string;
  updatedAt: string;
}

interface PopularSearch {
  query: string;
  count: number;
}

export default function SeoManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("audit");

  // SEO Audit Query
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/seo/audit"],
    enabled: selectedTab === "audit"
  });

  // SEO Issues Query
  const { data: seoIssues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["/api/admin/seo/issues"],
    enabled: selectedTab === "monitoring"
  });

  // Blog Posts Query
  const { data: blogData, isLoading: blogLoading } = useQuery({
    queryKey: ["/api/blog", { published: false }],
    enabled: selectedTab === "blog"
  });

  // Popular Searches Query
  const { data: popularSearches = [], isLoading: searchLoading } = useQuery({
    queryKey: ["/api/admin/search/popular"],
    enabled: selectedTab === "analytics"
  });

  // Blog Management State
  const [blogForm, setBlogForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    category: "industry-trends",
    isPublished: false
  });

  // Create Blog Post Mutation
  const createBlogMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/blog', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Blog post created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      setBlogForm({
        title: "",
        content: "",
        excerpt: "",
        metaTitle: "",
        metaDescription: "",
        category: "industry-trends",
        isPublished: false
      });
    },
    onError: () => {
      toast({ title: "Failed to create blog post", variant: "destructive" });
    }
  });

  const handleCreateBlogPost = () => {
    if (!blogForm.title || !blogForm.content) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }

    // Generate slug from title
    const slug = blogForm.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = blogForm.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    createBlogMutation.mutate({
      ...blogForm,
      slug,
      readingTime,
      publishedAt: blogForm.isPublished ? new Date().toISOString() : null
    });
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeoScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Work</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600">Comprehensive SEO optimization and monitoring tools</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            SEO Audit
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Search Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            SEO Settings
          </TabsTrigger>
        </TabsList>

        {/* SEO Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                SEO Audit Overview
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of your product pages and overall SEO health
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Running SEO audit...</p>
                </div>
              ) : auditData ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Products</p>
                            <p className="text-2xl font-bold">{auditData.totalProducts}</p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Average SEO Score</p>
                            <p className={`text-2xl font-bold ${getSeoScoreColor(auditData.averageScore)}`}>
                              {auditData.averageScore.toFixed(1)}%
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">High Performing</p>
                            <p className="text-2xl font-bold text-green-600">
                              {auditData.results.filter((r: SeoAuditResult) => r.seoScore >= 80).length}
                            </p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Results Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Product SEO Analysis</CardTitle>
                      <CardDescription>
                        Detailed breakdown of SEO performance for each product
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>SEO Score</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Issues</TableHead>
                              <TableHead>Recommendations</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditData.results.map((result: SeoAuditResult) => (
                              <TableRow key={result.productId}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{result.name}</p>
                                    <p className="text-sm text-gray-500">{result.productId}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold ${getSeoScoreColor(result.seoScore)}`}>
                                        {result.seoScore}%
                                      </span>
                                    </div>
                                    <Progress value={result.seoScore} className="w-20" />
                                  </div>
                                </TableCell>
                                <TableCell>{getSeoScoreBadge(result.seoScore)}</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {result.issues.slice(0, 2).map((issue, idx) => (
                                      <Badge key={idx} variant="destructive" className="text-xs">
                                        {issue}
                                      </Badge>
                                    ))}
                                    {result.issues.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{result.issues.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {result.recommendations.slice(0, 2).map((rec, idx) => (
                                      <p key={idx} className="text-xs text-gray-600">{rec}</p>
                                    ))}
                                    {result.recommendations.length > 2 && (
                                      <p className="text-xs text-gray-500">
                                        +{result.recommendations.length - 2} more suggestions
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No audit data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                SEO Issues & Monitoring
              </CardTitle>
              <CardDescription>
                Track and resolve SEO issues across your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {issuesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading SEO issues...</p>
                </div>
              ) : seoIssues.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error Code</TableHead>
                      <TableHead>Detected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seoIssues.map((issue: SeoIssue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-mono text-sm">{issue.url}</TableCell>
                        <TableCell>
                          <Badge variant={issue.type === 'broken-link' ? 'destructive' : 'secondary'}>
                            {issue.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={issue.status === 'active' ? 'destructive' : 'default'}>
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{issue.statusCode || '-'}</TableCell>
                        <TableCell>{new Date(issue.detectedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No SEO issues detected!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blog Management Tab */}
        <TabsContent value="blog" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Blog Post */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Blog Post</CardTitle>
                <CardDescription>
                  Create SEO-optimized content to improve organic search rankings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter blog post title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief summary of the post"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={blogForm.content}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your blog post content here..."
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={blogForm.metaTitle}
                      onChange={(e) => setBlogForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                      placeholder="SEO title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={blogForm.category}
                      onChange={(e) => setBlogForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="industry-trends">Industry Trends</option>
                      <option value="certifications">Certifications</option>
                      <option value="education">Education</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={blogForm.metaDescription}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="SEO meta description"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={blogForm.isPublished}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  />
                  <Label htmlFor="isPublished">Publish immediately</Label>
                </div>

                <Button 
                  onClick={handleCreateBlogPost}
                  disabled={createBlogMutation.isPending}
                  className="w-full"
                >
                  {createBlogMutation.isPending ? "Creating..." : "Create Blog Post"}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Blog Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Blog Posts</CardTitle>
                <CardDescription>
                  Manage your existing blog content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blogLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading blog posts...</p>
                  </div>
                ) : blogData?.posts?.length > 0 ? (
                  <div className="space-y-4">
                    {blogData.posts.map((post: BlogPost) => (
                      <div key={post.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{post.title}</h3>
                            <p className="text-sm text-gray-600">{post.excerpt}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={post.isPublished ? "default" : "secondary"}>
                                {post.isPublished ? "Published" : "Draft"}
                              </Badge>
                              <Badge variant="outline">{post.category}</Badge>
                              {post.readingTime && (
                                <span className="text-xs text-gray-500">{post.readingTime} min read</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No blog posts yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Analytics
              </CardTitle>
              <CardDescription>
                Monitor popular search queries and user behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading search analytics...</p>
                </div>
              ) : popularSearches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Search Query</TableHead>
                      <TableHead>Search Count</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularSearches.map((search: PopularSearch, idx) => (
                      <TableRow key={search.query}>
                        <TableCell className="font-medium">{search.query}</TableCell>
                        <TableCell>{search.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600">#{idx + 1}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">No search data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical SEO Settings</CardTitle>
                <CardDescription>
                  Configure advanced SEO features and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">XML Sitemaps</p>
                      <p className="text-sm text-green-700">Automatically generated</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Robots.txt</p>
                      <p className="text-sm text-green-700">Properly configured</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Structured Data</p>
                      <p className="text-sm text-green-700">Product & FAQ schemas</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Hreflang Support</p>
                      <p className="text-sm text-blue-700">Multi-language SEO</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Available</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
                <CardDescription>
                  Core Web Vitals and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">First Input Delay (FID)</span>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Overall Performance Score</p>
                  <div className="flex items-center gap-3">
                    <Progress value={85} className="flex-1" />
                    <span className="text-sm font-bold text-green-600">85/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}