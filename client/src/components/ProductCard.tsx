import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InquiryForm from "./InquiryForm";
import { Shield, Leaf, Award, Star, Heart, MessageSquare } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const productImage = (product.images as string[])?.[0] || 
    "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250";

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <Link href={`/product/${product.slug}`}>
        <div className="cursor-pointer">
          <div className="relative overflow-hidden rounded-t-xl">
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {product.isOrganic && (
              <Badge className="absolute top-2 left-2 bg-green-600">
                <Leaf className="w-3 h-3 mr-1" />
                Organic
              </Badge>
            )}
            <div className="absolute top-2 right-2">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs text-gray-500">In Stock</span>
              <div className="flex space-x-1">
                {product.certifications && (product.certifications as string[]).slice(0, 3).map((cert, index) => (
                  <div key={index} className="w-4 h-4 text-xs">
                    {cert.includes('USDA') && <Shield className="w-4 h-4 text-green-500" />}
                    {cert.includes('Organic') && <Leaf className="w-4 h-4 text-green-500" />}
                    {cert.includes('ISO') && <Award className="w-4 h-4 text-blue-500" />}
                    {cert.includes('Kosher') && <Star className="w-4 h-4 text-yellow-500" />}
                  </div>
                ))}
              </div>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">SKU: {product.productId}</p>
            
            {product.botanicalName && (
              <p className="text-xs text-gray-500 mb-3 italic">{product.botanicalName}</p>
            )}
          </CardContent>
        </div>
      </Link>
      
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-sm">
                <MessageSquare className="w-4 h-4 mr-1" />
                Get Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Request Quote for {product.name}</DialogTitle>
              </DialogHeader>
              <InquiryForm product={product} />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" className="text-sm">
            Sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
