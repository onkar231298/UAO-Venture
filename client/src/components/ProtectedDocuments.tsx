import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface ProtectedDocumentsProps {
  product: Product;
}

export default function ProtectedDocuments({ product }: ProtectedDocumentsProps) {
  const { isAuthenticated } = useAuth();
  const { isCustomerAuthenticated } = useCustomerAuth();
  const { toast } = useToast();

  const isLoggedIn = isAuthenticated || isCustomerAuthenticated;

  const companyDocs = [
    { name: 'Business License', url: product.businessLicense },
    { name: 'Certificate of Registration', url: product.registrationCert },
    { name: 'KOSHER-OK', url: product.kosherCert },
    { name: 'Organic-NOP(USDA)', url: product.organicNopCert }
  ];

  const productDocs = [
    { name: 'COA Document', url: product.coaDocument },
    { name: 'Specification Sheet', url: product.specDocument },
    { name: 'MSDS Documents', url: product.msdsDocument },
    { name: 'Non GMO Statement', url: product.nonGmoDocument }
  ];

  const additionalDocs = product.additionalDocs && Array.isArray(product.additionalDocs) 
    ? product.additionalDocs.map((url: string, index: number) => ({
        name: `Additional Document ${index + 1}`,
        url
      }))
    : [];

  const allDocs = [
    ...companyDocs.filter(doc => doc.url),
    ...productDocs.filter(doc => doc.url),
    ...additionalDocs
  ];

  const handleDownloadAll = () => {
    if (allDocs.length === 0) {
      toast({
        title: "No Documents",
        description: "No documents are available for this product",
        variant: "destructive"
      });
      return;
    }
    
    allDocs.forEach(doc => window.open(doc.url, '_blank'));
  };

  const DocumentList = ({ docs, title }: { docs: any[], title: string }) => (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-700 mb-2">{title}</p>
      {docs.map((doc) => (
        <Button 
          key={doc.name} 
          variant="ghost" 
          size="sm" 
          className={`w-full justify-start text-xs h-8 ${!doc.url ? 'opacity-50 cursor-not-allowed' : ''} ${!isLoggedIn ? 'blur-sm pointer-events-none' : ''}`}
          onClick={() => isLoggedIn && doc.url ? window.open(doc.url, '_blank') : null}
          disabled={!doc.url || !isLoggedIn}
        >
          <FileText className="w-3 h-3 mr-2" />
          {doc.name} 
          <span className={`ml-auto ${doc.url ? 'text-blue-600' : 'text-gray-400'}`}>
            {doc.url ? 'Download PDF' : 'Not Available'}
          </span>
        </Button>
      ))}
    </div>
  );

  return (
    <Card className="mb-6 relative">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          All Product Documents
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2 relative">
        {!isLoggedIn && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-b-lg">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg border">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">You must log in to view documents</p>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = '/login'}
              >
                Log in
              </Button>
            </div>
          </div>
        )}
        
        {/* Always show content but blur it when not logged in */}
        <div className={!isLoggedIn ? 'blur-sm' : ''}>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleDownloadAll}
            disabled={!isLoggedIn}
          >
            <Download className="w-4 h-4 mr-2" />
            Download All ({allDocs.length})
          </Button>
          <Separator />
          
          {/* Company Documents */}
          <DocumentList docs={companyDocs} title="Company Specific Documents" />
          
          <Separator />
          
          {/* Product Documents */}
          <DocumentList docs={productDocs} title="Product Specific Documents" />
          
          {/* Additional Documents */}
          {additionalDocs.length > 0 && (
            <>
              <Separator />
              <DocumentList docs={additionalDocs} title="Additional Documents" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}