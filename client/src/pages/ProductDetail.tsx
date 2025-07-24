import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import InquiryForm from "@/components/InquiryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Shield, Leaf, Award, Download, Heart, Share2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductDocument } from "@shared/schema";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products/slug", slug],
  });

  const { data: documents } = useQuery<ProductDocument[]>({
    queryKey: ["/api/products", product?.id, "documents"],
    enabled: !!product?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-80 bg-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = (document: ProductDocument) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to download documents.",
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement document download
    toast({
      title: "Download Started",
      description: `Downloading ${document.name}...`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <span>Home</span> / <span>Products</span> / <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="relative mb-4">
              <img
                src={(product.images as string[])?.[0] || "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"}
                alt={product.name}
                className="w-full h-80 object-cover rounded-xl"
              />
              {product.isOrganic && (
                <Badge className="absolute top-4 left-4 bg-green-600">
                  <Leaf className="w-3 h-3 mr-1" />
                  Organic
                </Badge>
              )}
            </div>
            
            {/* Certifications */}
            <div className="flex items-center space-x-2 mb-4">
              {product.certifications && (product.certifications as string[]).map((cert: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {cert}
                </Badge>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-1">SKU: {product.productId}</p>
            {product.botanicalName && (
              <p className="text-gray-600 mb-4 italic">Botanical Name: {product.botanicalName}</p>
            )}

            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast({ title: "Added to Wishlist" })}
              >
                <Heart className="w-4 h-4 mr-2" />
                Add to Wishlist
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Quick Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {product.plantPart && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plant Part:</span>
                    <span className="font-medium">{product.plantPart}</span>
                  </div>
                )}
                {product.origin && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origin:</span>
                    <span className="font-medium">{product.origin}</span>
                  </div>
                )}
                {product.form && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Form:</span>
                    <span className="font-medium">{product.form}</span>
                  </div>
                )}
                {product.meshSize && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mesh Size:</span>
                    <span className="font-medium">{product.meshSize}</span>
                  </div>
                )}
                {product.moq && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MOQ:</span>
                    <span className="font-medium">{product.moq} {product.unit}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Quote
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Request Quote for {product.name}</DialogTitle>
                  </DialogHeader>
                  <InquiryForm product={product} />
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="lg" className="w-full">
                Request Sample
              </Button>
            </div>

            {/* Login Prompt for Guests */}
            {!isAuthenticated && (
              <Card className="mt-6 border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">Hi Guest user,</h3>
                  <p className="text-sm text-orange-700 mb-3">
                    Log in to view detailed product information, access documents, place orders, and chat with our experts.
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Log In
                    </Button>
                    <Button variant="outline" size="sm">
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="related">Related Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Product Description</h3>
                  {product.description ? (
                    <div className="prose max-w-none">
                      <p>{product.description}</p>
                    </div>
                  ) : (
                    <p className="text-gray-600">No description available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Technical Specifications</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Physical Analysis</h4>
                      <div className="space-y-2 text-sm">
                        {product.curcuminContent && (
                          <div className="flex justify-between">
                            <span>Curcumin Content:</span>
                            <span className="font-medium">{product.curcuminContent}</span>
                          </div>
                        )}
                        {product.moisture && (
                          <div className="flex justify-between">
                            <span>Moisture:</span>
                            <span className="font-medium">{product.moisture}</span>
                          </div>
                        )}
                        {product.totalAsh && (
                          <div className="flex justify-between">
                            <span>Total Ash:</span>
                            <span className="font-medium">{product.totalAsh}</span>
                          </div>
                        )}
                        {product.bulkDensity && (
                          <div className="flex justify-between">
                            <span>Bulk Density:</span>
                            <span className="font-medium">{product.bulkDensity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Storage & Handling</h4>
                      <div className="space-y-2 text-sm">
                        {product.shelfLife && (
                          <div className="flex justify-between">
                            <span>Shelf Life:</span>
                            <span className="font-medium">{product.shelfLife}</span>
                          </div>
                        )}
                        {product.storageConditions && (
                          <div>
                            <span>Storage Conditions:</span>
                            <p className="text-gray-600 mt-1">{product.storageConditions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Product Documents</h3>
                  {documents && documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc: ProductDocument) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{doc.name}</h4>
                            <p className="text-sm text-gray-600">{doc.type}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No documents available for this product.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="related" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Related Products</h3>
                  <p className="text-gray-600">Related products will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
