// Shared blog types to ensure consistency across frontend and backend
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[] | null;
  category: string;
  authorId: string;
  publishedAt: string | null;
  isPublished: boolean;
  featuredImage: string | null;
  readingTime: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string; // comma-separated string in form
  category: string;
  isPublished: boolean;
  featuredImage: string;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
}

export interface BlogFilters {
  category?: string;
  published?: boolean | string;
  limit?: number;
  offset?: number;
}

export const BLOG_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "industry-trends", label: "Industry Trends" },
  { value: "certifications", label: "Certifications" },
  { value: "education", label: "Education" },
  { value: "sustainability", label: "Sustainability" }
];