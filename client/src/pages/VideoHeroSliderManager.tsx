import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Video, Image, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { HeroSlider } from '@shared/schema';

interface VideoHeroSliderManagerProps {
  canvaVideoUrl?: string;
}

export default function VideoHeroSliderManager({ canvaVideoUrl }: VideoHeroSliderManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSlider, setEditingSlider] = useState<HeroSlider | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing sliders
  const { data: sliders = [], isLoading } = useQuery<HeroSlider[]>({
    queryKey: ["/api/admin/sliders"],
  });

  // Create slider mutation
  const createSliderMutation = useMutation({
    mutationFn: async (sliderData: any) => {
      return apiRequest("/api/admin/sliders", {
        method: "POST",
        body: JSON.stringify(sliderData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hero slider created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sliders"] });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create slider",
        variant: "destructive",
      });
    },
  });

  // Update slider mutation
  const updateSliderMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/admin/sliders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hero slider updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sliders"] });
      setEditingSlider(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update slider",
        variant: "destructive",
      });
    },
  });

  // Delete slider mutation
  const deleteSliderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/sliders/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hero slider deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sliders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete slider",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (formData: any) => {
    if (editingSlider) {
      updateSliderMutation.mutate({ id: editingSlider.id, ...formData });
    } else {
      createSliderMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Video Hero Slider Manager</h1>
            <p className="text-gray-600">Manage hero sliders with video and image support</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Slider
          </Button>
        </div>

        {/* Quick Video Slider Creation */}
        {canvaVideoUrl && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Video className="h-5 w-5" />
                Quick Create: Canva Video Slider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Video URL</Label>
                  <Input value={canvaVideoUrl} readOnly className="bg-white" />
                </div>
                
                <Button
                  onClick={() => {
                    const videoSliderData = {
                      title: "Premium Organic Ingredients",
                      subtitle: "Experience quality and innovation in every product",
                      mediaType: "video",
                      videoUrl: canvaVideoUrl,
                      buttonText: "Explore Products",
                      buttonUrl: "/products",
                      status: "active",
                      sortOrder: 1
                    };
                    createSliderMutation.mutate(videoSliderData);
                  }}
                  disabled={createSliderMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Create Video Hero Slider
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sliders.map((slider) => (
            <Card key={slider.id} className="overflow-hidden">
              <div className="aspect-video relative">
                {slider.mediaType === 'video' && slider.videoUrl ? (
                  <video
                    src={slider.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : slider.imageUrl ? (
                  <img
                    src={slider.imageUrl}
                    alt={slider.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-gray-500 text-center">
                      {slider.mediaType === 'video' ? (
                        <Video className="h-8 w-8 mx-auto mb-2" />
                      ) : (
                        <Image className="h-8 w-8 mx-auto mb-2" />
                      )}
                      <p>No {slider.mediaType || 'media'}</p>
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {slider.status === 'active' ? (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Active
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Inactive
                    </div>
                  )}
                </div>

                {/* Media Type Badge */}
                <div className="absolute top-2 left-2">
                  <div className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    {slider.mediaType === 'video' ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <Image className="h-3 w-3" />
                    )}
                    {slider.mediaType || 'image'}
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{slider.title}</h3>
                {slider.subtitle && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{slider.subtitle}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Order: {slider.sortOrder}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSlider(slider)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSliderMutation.mutate(slider.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingSlider) && (
          <SliderForm
            slider={editingSlider}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingSlider(null);
            }}
            isPending={createSliderMutation.isPending || updateSliderMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

interface SliderFormProps {
  slider?: HeroSlider | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}

function SliderForm({ slider, onSubmit, onCancel, isPending }: SliderFormProps) {
  const [formData, setFormData] = useState({
    title: slider?.title || '',
    subtitle: slider?.subtitle || '',
    mediaType: slider?.mediaType || 'image',
    imageUrl: slider?.imageUrl || '',
    videoUrl: slider?.videoUrl || '',
    buttonText: slider?.buttonText || '',
    buttonUrl: slider?.buttonUrl || '',
    sortOrder: slider?.sortOrder || 1,
    status: slider?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{slider ? 'Edit Slider' : 'Create New Slider'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="mediaType">Media Type</Label>
              <select
                id="mediaType"
                value={formData.mediaType}
                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'image' | 'video' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              rows={2}
            />
          </div>

          {formData.mediaType === 'video' ? (
            <div>
              <Label htmlFor="videoUrl">Video URL (Canva/External)</Label>
              <Input
                id="videoUrl"
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://export-download.canva.com/..."
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="buttonUrl">Button URL</Label>
              <Input
                id="buttonUrl"
                value={formData.buttonUrl}
                onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortOrder">Display Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : (slider ? 'Update' : 'Create')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}