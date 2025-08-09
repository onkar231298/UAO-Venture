import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductTypeSchema } from "@shared/schema";
import type { ProductType } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus } from "lucide-react";

const formSchema = insertProductTypeSchema.extend({
  id: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ProductTypesManager() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: productTypes = [], isLoading } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      displayOrder: 1,
      isActive: true,
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/product-types", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setDialogOpen(false);
      form.reset();
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: (data: FormData) => 
      apiRequest(`/api/product-types/${data.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setDialogOpen(false);
      form.reset();
      setSelectedType(null);
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/product-types/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
    },
  });

  const onSubmit = (data: FormData) => {
    if (selectedType) {
      updateTypeMutation.mutate({ ...data, id: selectedType.id });
    } else {
      createTypeMutation.mutate(data);
    }
  };

  const handleEdit = (type: ProductType) => {
    setSelectedType(type);
    form.reset({
      name: type.name,
      slug: type.slug,
      description: type.description || "",
      displayOrder: type.displayOrder,
      isActive: type.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product type?")) {
      deleteTypeMutation.mutate(id);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!selectedType) {
      form.setValue("slug", generateSlug(name));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading product types...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Product Types</h2>
          <p className="text-muted-foreground">
            Manage product types (Organic, Conventional, Wild Crafted, etc.)
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedType(null);
                form.reset({
                  name: "",
                  slug: "",
                  description: "",
                  displayOrder: productTypes.length + 1,
                  isActive: true,
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedType ? "Edit Product Type" : "Create Product Type"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Organic"
                          {...field}
                          onChange={(e) => handleNameChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., organic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this product type..."
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value || 1}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
                  >
                    {selectedType ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {productTypes.map((type: ProductType) => (
          <Card key={type.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    /{type.slug}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    disabled={deleteTypeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {type.description || "No description"}
              </p>
              <div className="flex justify-between items-center">
                <Badge variant={type.isActive ? "default" : "secondary"}>
                  {type.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Order: {type.displayOrder}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {productTypes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No product types found</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first product type
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}