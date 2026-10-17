import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Clock, Search, BookOpen, TrendingUp } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  authorId: string;
  publishedAt?: string;
  readingTime?: number;
  featuredImage?: string;
  isPublished: boolean;
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Initialize SEO for blog page
  useSEO({
    title: "Industry Insights & Knowledge Hub",
    description: "Stay informed about the latest trends, certifications, and best practices in the organic ingredients industry. Educational content for pharmaceutical and nutraceutical professionals.",
    keywords: "organic ingredients blog, industry insights, pharmaceutical trends, nutraceutical education, organic certification, sustainability",
    canonicalUrl: `${window.location.origin}/blog`,
    pageType: "blog",
    pageId: "blog-listing"
  });

  const { data: blogData, isLoading } = useQuery({
    queryKey: ["/api/blog", { category: selectedCategory === "all" ? "" : selectedCategory, published: true }],
  });

  const filteredPosts = blogData?.posts?.filter((post: BlogPost) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "industry-trends", label: "Industry Trends" },
    { value: "certifications", label: "Certifications" },
    { value: "education", label: "Education" },
    { value: "sustainability", label: "Sustainability" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Industry Insights & Knowledge Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed about the latest trends, certifications, and best practices in the organic ingredients industry.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <Card key={idx} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post: BlogPost) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200">
                {post.featuredImage && (
                  <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Badge variant="outline">{post.category}</Badge>
                    {post.readingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readingTime} min read</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg hover:text-orange-600 transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.excerpt && (
                    <CardDescription>{post.excerpt}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Atlas Ingredients Team</span>
                    </div>
                    {post.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    <Link href={`/blog/${post.slug}`} className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Read Article
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || (selectedCategory && selectedCategory !== "all") ? "No articles found" : "No articles published yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || (selectedCategory && selectedCategory !== "all")
                ? "Try adjusting your search or filter criteria."
                : "Check back soon for industry insights and educational content."
              }
            </p>
            {(searchQuery || (selectedCategory && selectedCategory !== "all")) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Featured Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Topic</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {categories.slice(1).map((category) => (
              <Card 
                key={category.value}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCategory(category.value)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Latest insights and updates
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}