import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

interface ProtectedDocumentsProps {
  product: Product;
}

export default function ProtectedDocuments({ product }: ProtectedDocumentsProps) {
  const contactHref = `/contact?subject=${encodeURIComponent(`Documents for ${product.name}`)}`;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Current Product Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Verified current documents are not available for download right now. Contact us to request the correct documents for this product.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={contactHref}>Request Documents</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
