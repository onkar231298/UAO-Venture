import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, CheckCircle } from "lucide-react";

interface NewsletterSubscriptionProps {
  variant?: "default" | "footer" | "compact";
  source?: string;
}

export default function NewsletterSubscription({ 
  variant = "default",
  source = "blog" 
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          source
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setIsSubscribed(true);
      setEmail("");
      
      toast({
        title: "Successfully Subscribed!",
        description: "Thank you for subscribing to our newsletter. You'll receive the latest updates from BFI Organic.",
        duration: 5000,
      });

      // Invalidate newsletter subscriptions cache if user is admin
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/subscriptions'] });
      
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      
      let errorMessage = "Failed to subscribe to newsletter. Please try again.";
      if (error.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes("already subscribed")) {
        errorMessage = "You're already subscribed to our newsletter!";
        setIsSubscribed(true);
      }
      
      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={`text-center ${variant === "footer" ? "py-4" : "py-6"}`}>
        <div className="flex items-center justify-center mb-2">
          <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-green-700">
            Thanks for Subscribing!
          </h3>
        </div>
        <p className="text-gray-600">
          You'll receive our latest updates and insights soon.
        </p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <Mail className="h-5 w-5 text-orange-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Newsletter</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Get updates on new products and industry insights
        </p>
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="text-sm"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isLoading ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
    );
  }

  // Default variant
  return (
    <div className="bg-gray-100 rounded-lg p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Stay Updated
        </h3>
        <p className="text-gray-600 mb-4">
          Get the latest insights and updates from BFI Organic delivered to your inbox.
        </p>
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </div>
  );
}