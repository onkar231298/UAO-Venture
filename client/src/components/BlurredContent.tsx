import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, User } from 'lucide-react';

interface BlurredContentProps {
  children: ReactNode;
  isAuthenticated: boolean;
  title?: string;
  message?: string;
  onLoginClick?: () => void;
  className?: string;
}

export default function BlurredContent({
  children,
  isAuthenticated,
  title = "Member-Only Content",
  message = "Please log in to view pricing and download documents",
  onLoginClick,
  className = ""
}: BlurredContentProps) {
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Lock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {message}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={onLoginClick || (() => window.location.href = '/login')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <User className="h-4 w-4 mr-2" />
                Login to View
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/register'}
                className="w-full"
              >
                Create Free Account
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Join thousands of businesses accessing our premium B2B marketplace
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}