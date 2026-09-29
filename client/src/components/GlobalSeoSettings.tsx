import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Globe, Target, Building2, Save, BarChart3, MapPin, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GlobalSeoSettings } from "@shared/schema";

export default function GlobalSeoSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current global SEO settings
  const { data: settings, isLoading } = useQuery<GlobalSeoSettings>({
    queryKey: ["/api/admin/seo/settings"],
  });

  // Form state
  const [formData, setFormData] = useState({
    siteTitle: "",
    siteDescription: "",
    primaryKeywords: "",
    primaryTargetRegion: "Global (All Regions)",
    businessLocation: "",
    pharmaceuticalKeywords: "",
    nutraceuticalKeywords: "",
    
    // Region-specific keywords
    northAmericaKeywords: "",
    europeKeywords: "",
    asiaPacificKeywords: "",
    indiaKeywords: "",
    middleEastKeywords: "",
    latinAmericaKeywords: "",
    
    // SEO Impact Settings
    enableAutoMetaTags: true,
    enableStructuredData: true,
    enableLocalSeo: true,
    enableHreflang: false,
    
    googleAnalyticsId: "",
    googleTagManagerId: "",
    facebookPixelId: "",
    twitterHandle: "",
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle || "",
        siteDescription: settings.siteDescription || "",
        primaryKeywords: settings.primaryKeywords || "",
        primaryTargetRegion: settings.primaryTargetRegion || "Global (All Regions)",
        businessLocation: settings.businessLocation || "",
        pharmaceuticalKeywords: settings.pharmaceuticalKeywords || "",
        nutraceuticalKeywords: settings.nutraceuticalKeywords || "",
        
        // Region-specific keywords
        northAmericaKeywords: settings.northAmericaKeywords || "",
        europeKeywords: settings.europeKeywords || "",
        asiaPacificKeywords: settings.asiaPacificKeywords || "",
        indiaKeywords: settings.indiaKeywords || "",
        middleEastKeywords: settings.middleEastKeywords || "",
        latinAmericaKeywords: settings.latinAmericaKeywords || "",
        
        // SEO Impact Settings
        enableAutoMetaTags: settings.enableAutoMetaTags ?? true,
        enableStructuredData: settings.enableStructuredData ?? true,
        enableLocalSeo: settings.enableLocalSeo ?? true,
        enableHreflang: settings.enableHreflang ?? false,
        
        googleAnalyticsId: settings.googleAnalyticsId || "",
        googleTagManagerId: settings.googleTagManagerId || "",
        facebookPixelId: settings.facebookPixelId || "",
        twitterHandle: settings.twitterHandle || "",
      });
    }
  }, [settings]);

  // Update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/admin/seo/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Global SEO settings updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update SEO settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Global SEO Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading SEO settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Global SEO Configuration
        </CardTitle>
        <CardDescription>
          Configure global SEO settings, keywords, and tracking codes for your website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Meta Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Global Meta Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="siteTitle">Site Title</Label>
              <Input
                id="siteTitle"
                value={formData.siteTitle}
                onChange={(e) => handleInputChange("siteTitle", e.target.value)}
                placeholder="Bright Fame Organic - Premium Organic Ingredients Supplier"
                className="max-w-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={formData.siteDescription}
                onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                placeholder="Leading supplier of premium organic ingredients, herbs, and botanical extracts. Certified organic products for pharmaceutical, nutraceutical, and food industries worldwide."
                className="max-w-2xl min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryKeywords">Primary Keywords (comma-separated)</Label>
              <Textarea
                id="primaryKeywords"
                value={formData.primaryKeywords}
                onChange={(e) => handleInputChange("primaryKeywords", e.target.value)}
                placeholder="organic ingredients, herbal extracts, pharmaceutical raw materials, nutraceutical ingredients, organic herbs, botanical extracts, organic spices, certified organic"
                className="max-w-2xl min-h-[60px]"
              />
            </div>
          </div>

          <Separator />

          {/* Geographic Targeting */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Geographic Targeting
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryTargetRegion">Primary Target Region</Label>
                <Select 
                  value={formData.primaryTargetRegion} 
                  onValueChange={(value) => handleInputChange("primaryTargetRegion", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Global (All Regions)">Global (All Regions)</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLocation">Business Location</Label>
                <Input
                  id="businessLocation"
                  value={formData.businessLocation}
                  onChange={(e) => handleInputChange("businessLocation", e.target.value)}
                  placeholder="Mehsana, Gujarat, India"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Geographic-Specific Keywords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Region-Specific Keyword Targeting
            </h3>
            <p className="text-sm text-gray-600">Configure keywords specific to different geographic markets to improve local search performance</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="northAmericaKeywords">North America Keywords</Label>
                <Textarea
                  id="northAmericaKeywords"
                  value={formData.northAmericaKeywords}
                  onChange={(e) => handleInputChange("northAmericaKeywords", e.target.value)}
                  placeholder="FDA approved ingredients, USDA organic, dietary supplements, natural health products, organic certification"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="europeKeywords">Europe Keywords</Label>
                <Textarea
                  id="europeKeywords"
                  value={formData.europeKeywords}
                  onChange={(e) => handleInputChange("europeKeywords", e.target.value)}
                  placeholder="EU organic certification, herbal medicines, botanical extracts, phytotherapy, natural ingredients"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asiaPacificKeywords">Asia Pacific Keywords</Label>
                <Textarea
                  id="asiaPacificKeywords"
                  value={formData.asiaPacificKeywords}
                  onChange={(e) => handleInputChange("asiaPacificKeywords", e.target.value)}
                  placeholder="traditional medicine, TCM ingredients, Ayurvedic herbs, organic extracts, natural wellness"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="indiaKeywords">India Keywords</Label>
                <Textarea
                  id="indiaKeywords"
                  value={formData.indiaKeywords}
                  onChange={(e) => handleInputChange("indiaKeywords", e.target.value)}
                  placeholder="Ayurvedic ingredients, organic herbs India, pharmaceutical raw materials, herbal extracts manufacturer, Gujarat organic"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleEastKeywords">Middle East Keywords</Label>
                <Textarea
                  id="middleEastKeywords"
                  value={formData.middleEastKeywords}
                  onChange={(e) => handleInputChange("middleEastKeywords", e.target.value)}
                  placeholder="halal certified ingredients, Islamic medicine, natural health products, organic spices, herbal supplements"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latinAmericaKeywords">Latin America Keywords</Label>
                <Textarea
                  id="latinAmericaKeywords"
                  value={formData.latinAmericaKeywords}
                  onChange={(e) => handleInputChange("latinAmericaKeywords", e.target.value)}
                  placeholder="ingredientes orgánicos, extractos naturales, medicina herbaria, productos farmacéuticos naturales"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SEO Impact Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SEO Impact Configuration
            </h3>
            <p className="text-sm text-gray-600">Enable features that directly improve your search engine optimization</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAutoMetaTags">Auto Meta Tags</Label>
                    <p className="text-xs text-gray-500">Automatically generate meta titles and descriptions for products</p>
                  </div>
                  <Switch
                    id="enableAutoMetaTags"
                    checked={formData.enableAutoMetaTags}
                    onCheckedChange={(checked) => handleInputChange("enableAutoMetaTags", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableStructuredData">Structured Data</Label>
                    <p className="text-xs text-gray-500">Enable rich snippets with product schema markup</p>
                  </div>
                  <Switch
                    id="enableStructuredData"
                    checked={formData.enableStructuredData}
                    onCheckedChange={(checked) => handleInputChange("enableStructuredData", checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableLocalSeo">Local SEO</Label>
                    <p className="text-xs text-gray-500">Optimize for local search results in your business location</p>
                  </div>
                  <Switch
                    id="enableLocalSeo"
                    checked={formData.enableLocalSeo}
                    onCheckedChange={(checked) => handleInputChange("enableLocalSeo", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableHreflang">Hreflang Tags</Label>
                    <p className="text-xs text-gray-500">Add hreflang tags for international SEO targeting</p>
                  </div>
                  <Switch
                    id="enableHreflang"
                    checked={formData.enableHreflang}
                    onCheckedChange={(checked) => handleInputChange("enableHreflang", checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Industry-Specific Keywords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Industry-Specific Keywords
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pharmaceuticalKeywords">Pharmaceutical Keywords</Label>
                <Textarea
                  id="pharmaceuticalKeywords"
                  value={formData.pharmaceuticalKeywords}
                  onChange={(e) => handleInputChange("pharmaceuticalKeywords", e.target.value)}
                  placeholder="pharmaceutical grade herbs, API raw materials, pharmaceutical excipients, drug intermediates"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nutraceuticalKeywords">Nutraceutical Keywords</Label>
                <Textarea
                  id="nutraceuticalKeywords"
                  value={formData.nutraceuticalKeywords}
                  onChange={(e) => handleInputChange("nutraceuticalKeywords", e.target.value)}
                  placeholder="dietary supplement ingredients, functional food ingredients, health supplements, natural extracts"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Analytics & Tracking */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics & Tracking
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  value={formData.googleAnalyticsId}
                  onChange={(e) => handleInputChange("googleAnalyticsId", e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleTagManagerId">Google Tag Manager ID</Label>
                <Input
                  id="googleTagManagerId"
                  value={formData.googleTagManagerId}
                  onChange={(e) => handleInputChange("googleTagManagerId", e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                <Input
                  id="facebookPixelId"
                  value={formData.facebookPixelId}
                  onChange={(e) => handleInputChange("facebookPixelId", e.target.value)}
                  placeholder="123456789012345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterHandle">Twitter Handle</Label>
                <Input
                  id="twitterHandle"
                  value={formData.twitterHandle}
                  onChange={(e) => handleInputChange("twitterHandle", e.target.value)}
                  placeholder="@bfiorganic"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save SEO Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}