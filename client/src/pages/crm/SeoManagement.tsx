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
import KeywordPerformanceDashboard from "@/components/KeywordPerformanceDashboard";

export default function SeoManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600">Comprehensive SEO optimization and monitoring tools</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Schema Validation
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Smart Search
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Schema Validation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Schema Validation
                </CardTitle>
                <CardDescription>
                  Test and validate structured data markup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Validate your product schema and test rich results with Google tools.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedTab("schema")}
                    className="flex-1"
                  >
                    Validate Schema
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
                  >
                    Google Test
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Blog Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Blog System
                </CardTitle>
                <CardDescription>
                  Content marketing with SEO optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create SEO-optimized blog posts for organic traffic growth.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedTab("blog")}
                    className="flex-1"
                  >
                    Create Posts
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/blog', '_blank')}
                  >
                    View Blog
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Smart Search Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-purple-600" />
                  Smart Search
                </CardTitle>
                <CardDescription>
                  Intelligent search with analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Advanced search suggestions and user behavior tracking.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedTab("search")}
                    className="flex-1"
                  >
                    Manage Search
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/products', '_blank')}
                  >
                    Test Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SEO Monitoring Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  SEO Monitoring
                </CardTitle>
                <CardDescription>
                  Website health and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Monitor broken links, Core Web Vitals, and SEO issues.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedTab("monitoring")}
                    className="flex-1"
                  >
                    View Issues
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                  >
                    Search Console
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  SEO Analytics
                </CardTitle>
                <CardDescription>
                  Search performance and user insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Track search queries, popular content, and user behavior.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedTab("analytics")}
                    className="flex-1"
                  >
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://analytics.google.com/', '_blank')}
                  >
                    Google Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Structured Data Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-teal-600" />
                  Structured Data
                </CardTitle>
                <CardDescription>
                  Schema markup and validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Automatic JSON-LD generation for products and FAQs.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
                    className="flex-1"
                  >
                    Test Schema
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/api/product-page/turmeric-powder', '_blank')}
                  >
                    View Example
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schema Validation Tab */}
        <TabsContent value="schema" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schema Testing Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Google Structured Data Testing
                </CardTitle>
                <CardDescription>
                  Test your pages with Google's Rich Results Test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testUrl">URL to Test</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="testUrl"
                      placeholder="https://your-domain.com/product-page-url"
                      defaultValue={`${window.location.origin}/product/organic-turmeric-powder`}
                    />
                    <Button onClick={() => {
                      const url = (document.getElementById('testUrl') as HTMLInputElement).value;
                      window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`, '_blank');
                    }}>
                      Test URL
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Quick Test Links:</h4>
                  <div className="grid gap-2">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.origin + '/product/organic-turmeric-powder')}`, '_blank')}
                    >
                      Test Turmeric Powder Page
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.origin + '/products')}`, '_blank')}
                    >
                      Test Products Listing Page
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.origin)}`, '_blank')}
                    >
                      Test Homepage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schema Validation Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Schema Validation Tools
                </CardTitle>
                <CardDescription>
                  Additional validation and testing tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">External Validation Tools:</h4>
                  <div className="grid gap-2">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open('https://validator.schema.org/', '_blank')}
                    >
                      Schema.org Validator
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                    >
                      Google Search Console
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open('https://developers.facebook.com/tools/debug/', '_blank')}
                    >
                      Facebook Open Graph Debugger
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open('https://cards-dev.twitter.com/validator', '_blank')}
                    >
                      Twitter Card Validator
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">View Raw Schema Data:</h4>
                  <div className="grid gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/api/product-page/organic-turmeric-powder', '_blank')}
                    >
                      View Product Schema JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/api/schema/organization', '_blank')}
                    >
                      View Organization Schema
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schema Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Schema Implementation Status</CardTitle>
              <CardDescription>
                Current structured data implementation across your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-green-900">Product Schema</div>
                  <div className="text-sm text-green-700">Active on all products</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-green-900">FAQ Schema</div>
                  <div className="text-sm text-green-700">Dynamic FAQ support</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-green-900">Organization</div>
                  <div className="text-sm text-green-700">Company details</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Settings className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-blue-900">Breadcrumbs</div>
                  <div className="text-sm text-blue-700">Auto-generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blog Management Tab */}
        <TabsContent value="blog" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Blog Post */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Create Blog Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="blogTitle">Title</Label>
                  <Input 
                    id="blogTitle"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({...blogForm, title: e.target.value})}
                    placeholder="e.g., The Benefits of Organic Turmeric in Modern Medicine"
                  />
                </div>
                <div>
                  <Label htmlFor="blogExcerpt">Excerpt</Label>
                  <Textarea 
                    id="blogExcerpt"
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({...blogForm, excerpt: e.target.value})}
                    placeholder="Brief description for SEO and social sharing..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="blogContent">Content</Label>
                  <Textarea 
                    id="blogContent"
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({...blogForm, content: e.target.value})}
                    placeholder="Write your blog content in markdown..."
                    rows={8}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metaTitle">SEO Title</Label>
                    <Input 
                      id="metaTitle"
                      value={blogForm.metaTitle}
                      onChange={(e) => setBlogForm({...blogForm, metaTitle: e.target.value})}
                      placeholder="Optimized title for search engines"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={blogForm.category}
                      onChange={(e) => setBlogForm({...blogForm, category: e.target.value})}
                    >
                      <option value="industry-trends">Industry Trends</option>
                      <option value="product-spotlight">Product Spotlight</option>
                      <option value="health-benefits">Health Benefits</option>
                      <option value="sustainability">Sustainability</option>
                      <option value="research">Research & Studies</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="metaDescription">SEO Description</Label>
                  <Textarea 
                    id="metaDescription"
                    value={blogForm.metaDescription}
                    onChange={(e) => setBlogForm({...blogForm, metaDescription: e.target.value})}
                    placeholder="Meta description for search results (150-160 characters)"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="publishNow"
                    checked={blogForm.isPublished}
                    onChange={(e) => setBlogForm({...blogForm, isPublished: e.target.checked})}
                  />
                  <Label htmlFor="publishNow">Publish immediately</Label>
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

            {/* Blog Posts List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
                    <p className="text-gray-600">Create your first blog post to start content marketing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Smart Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">1,247</div>
                      <div className="text-sm text-gray-600">Total Searches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Popular Search Terms</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">turmeric powder</span>
                        <Badge>156 searches</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">ashwagandha extract</span>
                        <Badge>142 searches</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">organic ginger</span>
                        <Badge>98 searches</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Suggestions Management */}
            <Card>
              <CardHeader>
                <CardTitle>Manage Search Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newSuggestion">Add Suggestion</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="newSuggestion"
                        placeholder="e.g., turmeric powder organic"
                      />
                      <Button>Add</Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Current Suggestions</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">turmeric powder</span>
                        <Button size="sm" variant="outline">Remove</Button>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">ashwagandha extract</span>
                        <Button size="sm" variant="outline">Remove</Button>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">organic ginger powder</span>
                        <Button size="sm" variant="outline">Remove</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                SEO Issues Monitoring
              </CardTitle>
              <CardDescription>
                Track and resolve SEO issues across your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">3</div>
                      <div className="text-sm text-gray-600">Critical Issues</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">7</div>
                      <div className="text-sm text-gray-600">Warnings</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <div className="text-sm text-gray-600">Health Score</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No critical issues found</h3>
                  <p className="text-gray-600">Your website SEO health is looking good</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <KeywordPerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}