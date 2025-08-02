import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Image, MoveUp, MoveDown, Eye } from "lucide-react";

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  textColor: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HeroSlideFormData {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage: string;
  textColor: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function HeroSliderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Fetch hero slides
  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete slide mutation
  const deleteSlide = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/hero-slides/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
      toast({
        title: "Success",
        description: "Hero slide deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete hero slide",
        variant: "destructive",
      });
    },
  });

  // Update slide mutation
  const updateSlide = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HeroSlideFormData> }) => {
      return apiRequest(`/api/hero-slides/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
      toast({
        title: "Success",
        description: "Hero slide updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update hero slide",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (id: number, isActive: boolean) => {
    updateSlide.mutate({
      id,
      data: { isActive: !isActive }
    });
  };

  const handleOrderChange = (id: number, newOrder: number) => {
    updateSlide.mutate({
      id,
      data: { displayOrder: newOrder }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Manage your homepage hero slider. Slides are displayed in order and only active slides are shown to visitors.
      </div>

      {slides.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hero slides yet</h3>
            <p className="text-gray-600 mb-4">Create your first hero slide to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slides
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((slide, index) => (
              <Card key={slide.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Image Preview */}
                    <div className="w-48 h-32 relative bg-gray-200 flex-shrink-0">
                      {slide.backgroundImage ? (
                        <img
                          src={slide.backgroundImage}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant={slide.isActive ? "default" : "secondary"}>
                          {slide.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        #{slide.displayOrder}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {slide.title}
                          </h3>
                          {slide.subtitle && (
                            <p className="text-lg text-blue-600 mb-2">{slide.subtitle}</p>
                          )}
                          {slide.description && (
                            <p className="text-gray-600 mb-3 line-clamp-2">{slide.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Text Color: {slide.textColor}</span>
                            {slide.buttonText && (
                              <span>Button: "{slide.buttonText}"</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {/* Move Up/Down */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOrderChange(slide.id, slide.displayOrder - 1)}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOrderChange(slide.id, slide.displayOrder + 1)}
                            disabled={index === slides.length - 1}
                            title="Move Down"
                          >
                            <MoveDown className="w-4 h-4" />
                          </Button>

                          {/* Active Toggle */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Active</span>
                            <Switch
                              checked={slide.isActive}
                              onCheckedChange={() => handleToggleActive(slide.id, slide.isActive)}
                            />
                          </div>

                          {/* Edit */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingSlide(slide)}
                                title="Edit Slide"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Hero Slide</DialogTitle>
                              </DialogHeader>
                              <HeroSlideForm
                                slide={slide}
                                onSubmit={(data) => {
                                  updateSlide.mutate({ id: slide.id, data });
                                  setEditingSlide(null);
                                }}
                                isLoading={updateSlide.isPending}
                              />
                            </DialogContent>
                          </Dialog>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this slide?")) {
                                deleteSlide.mutate(slide.id);
                              }
                            }}
                            disabled={deleteSlide.isPending}
                            title="Delete Slide"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

// Import HeroSlideForm component (to be created separately)
function HeroSlideForm({ 
  slide, 
  onSubmit, 
  isLoading = false 
}: { 
  slide?: HeroSlide; 
  onSubmit: (data: HeroSlideFormData) => void; 
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState<HeroSlideFormData>({
    title: slide?.title || "",
    subtitle: slide?.subtitle || "",
    description: slide?.description || "",
    backgroundImage: slide?.backgroundImage || "",
    textColor: slide?.textColor || "white",
    buttonText: slide?.buttonText || "",
    buttonLink: slide?.buttonLink || "",
    displayOrder: slide?.displayOrder || 1,
    isActive: slide?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Subtitle</label>
        <input
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Background Image URL *</label>
        <input
          type="url"
          value={formData.backgroundImage}
          onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Text Color</label>
          <select
            value={formData.textColor}
            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
            className="w-full p-2 border rounded-lg"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Display Order</label>
          <input
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
            className="w-full p-2 border rounded-lg"
            min="1"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Button Text</label>
          <input
            type="text"
            value={formData.buttonText}
            onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Button Link</label>
          <input
            type="url"
            value={formData.buttonLink}
            onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <label htmlFor="isActive" className="text-sm font-medium">Active</label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : slide ? "Update Slide" : "Create Slide"}
        </Button>
      </div>
    </form>
  );
}