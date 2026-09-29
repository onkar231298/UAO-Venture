import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Users, Phone, Mail, RefreshCw, UserPlus, MoreVertical, Edit2, Pin, Trash2 } from "lucide-react";
import { WhatsAppButton } from "@/components/crm/Dialer";
import { AiSalesEmailDialog } from "./AiSalesEmailDialog";
import { isCompanyPrimaryContact } from "./CompanyContactSummary";

interface CompanyContact {
  id: number;
  companyId: number;
  contactName: string;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  isPrimary: boolean;
  role?: string | null;
  isActive: boolean;
}

interface CompanyDetails {
  id: number;
  companyName: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  website?: string | null;
}

const contactSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  designation: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  role: z.string().optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface CompanyContactsTabProps {
  companyId: number;
  companyDetails?: CompanyDetails | null;
}

export function CompanyContactsTab({ companyId, companyDetails }: CompanyContactsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<CompanyContact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<CompanyContact | null>(null);
  const [aiRecipient, setAiRecipient] = useState<{ email: string; contactId?: number } | null>(null);

  const { data: contacts, isLoading } = useQuery<CompanyContact[]>({
    queryKey: ['/api/crm/companies', companyId, 'contacts'],
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/contacts`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  const addContactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contactName: "",
      designation: "",
      email: "",
      phone: "",
      whatsapp: "",
      role: "",
      isPrimary: false,
      isActive: true,
    },
  });

  const editContactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contactName: "",
      designation: "",
      email: "",
      phone: "",
      whatsapp: "",
      role: "",
      isPrimary: false,
      isActive: true,
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactSchema>) => {
      const response = await apiRequest(`/api/crm/companies/${companyId}/contacts`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'contacts'] });
      toast({ title: "Contact added successfully" });
      setAddContactDialogOpen(false);
      addContactForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to add contact", variant: "destructive" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, data }: { contactId: number; data: z.infer<typeof contactSchema> }) => {
      const response = await apiRequest(`/api/crm/contacts/${contactId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'contacts'] });
      toast({ title: "Contact updated successfully" });
      setEditContactDialogOpen(false);
      setContactToEdit(null);
    },
    onError: () => {
      toast({ title: "Failed to update contact", variant: "destructive" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await apiRequest(`/api/crm/contacts/${contactId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'contacts'] });
      toast({ title: "Contact deleted successfully" });
      setDeleteContactDialogOpen(false);
      setContactToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete contact", variant: "destructive" });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await apiRequest(`/api/crm/companies/${companyId}/contacts/${contactId}/set-primary`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });
      toast({ title: "Primary contact updated" });
    },
    onError: () => {
      toast({ title: "Failed to set primary contact", variant: "destructive" });
    },
  });

  const handleEditContact = (contact: CompanyContact) => {
    setContactToEdit(contact);
    editContactForm.reset({
      contactName: contact.contactName || "",
      designation: contact.designation || "",
      email: contact.email || "",
      phone: contact.phone || "",
      whatsapp: contact.whatsapp || "",
      role: contact.role || "",
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
    });
    setEditContactDialogOpen(true);
  };

  const handleDeleteContact = (contact: CompanyContact) => {
    setContactToDelete(contact);
    setDeleteContactDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="text-center py-6 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Loading contacts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPrimaryInfo = companyDetails?.primaryEmail || companyDetails?.primaryPhone;
  const hasContacts = contacts && contacts.length > 0;

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  addContactForm.reset();
                  setAddContactDialogOpen(true);
                }}
                data-testid="button-add-contact"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>

            {hasPrimaryInfo && (
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Primary Contact</p>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Company Primary</Badge>
                  </div>
                  {companyDetails?.primaryEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <button type="button" onClick={() => setAiRecipient({ email: companyDetails.primaryEmail! })} className="text-blue-600 hover:underline">
                        {companyDetails.primaryEmail}
                      </button>
                    </div>
                  )}
                  {companyDetails?.primaryPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${companyDetails.primaryPhone}`} className="text-blue-600 hover:underline">
                        {companyDetails.primaryPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {hasContacts ? (
              <>
                <h4 className="font-medium text-sm text-muted-foreground pt-2">Saved contacts ({contacts!.length})</h4>
                {contacts!.map((contact) => (
                  <div key={contact.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{contact.contactName}</p>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {isCompanyPrimaryContact(contact, companyDetails?.primaryEmail) ? "Primary" : "Additional"}
                        </Badge>
                        {contact.designation && (
                          <Badge variant="outline" className="text-xs">{contact.designation}</Badge>
                        )}
                        {contact.role && (
                          <Badge variant="outline" className="text-xs bg-purple-50">{contact.role}</Badge>
                        )}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <button type="button" onClick={() => setAiRecipient({ email: contact.email!, contactId: contact.id })} className="text-blue-600 hover:underline">
                            {contact.email}
                          </button>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                            {contact.phone}
                          </a>
                          <WhatsAppButton
                            phoneNumber={contact.phone}
                            contactName={contact.contactName}
                            companyName={companyDetails?.companyName}
                          />
                        </div>
                      )}
                      {contact.whatsapp && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-green-600">WhatsApp:</span>
                          <WhatsAppButton
                            phoneNumber={contact.whatsapp}
                            contactName={contact.contactName}
                            companyName={companyDetails?.companyName}
                            showNumber
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!contact.isActive && (
                        <Badge variant="outline" className="text-orange-600">Inactive</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-contact-menu-${contact.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditContact(contact)} data-testid={`button-edit-contact-${contact.id}`}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!contact.isPrimary && (
                            <DropdownMenuItem onClick={() => setPrimaryMutation.mutate(contact.id)} data-testid={`button-set-primary-${contact.id}`}>
                              <Pin className="h-4 w-4 mr-2" />
                              Set as Primary
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => handleDeleteContact(contact)}
                            data-testid={`button-delete-contact-${contact.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </>
            ) : !hasPrimaryInfo && (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No contacts linked to this company yet</p>
                <p className="text-sm">Click "Add Contact" to add team members</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addContactDialogOpen} onOpenChange={setAddContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Contact
            </DialogTitle>
            <DialogDescription>
              Add a new contact person for this company
            </DialogDescription>
          </DialogHeader>

          <Form {...addContactForm}>
            <form onSubmit={addContactForm.handleSubmit((data) => createContactMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addContactForm.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" data-testid="input-contact-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addContactForm.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Purchase Manager, CEO, Sales Head" data-testid="input-contact-designation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addContactForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="john@company.com" data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addContactForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 98765 43210" data-testid="input-contact-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addContactForm.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 98765 43210" data-testid="input-contact-whatsapp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addContactForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department/Role</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Procurement, Operations, Finance" data-testid="input-contact-role" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                <FormField
                  control={addContactForm.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-contact-primary" />
                      </FormControl>
                      <FormLabel className="!mt-0">Set as Primary Contact</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setAddContactDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContactMutation.isPending} data-testid="button-save-contact">
                  {createContactMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editContactDialogOpen} onOpenChange={setEditContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Contact
            </DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>

          <Form {...editContactForm}>
            <form onSubmit={editContactForm.handleSubmit((data) => {
              if (contactToEdit) {
                updateContactMutation.mutate({ contactId: contactToEdit.id, data });
              }
            })} className="space-y-4">
              <FormField
                control={editContactForm.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" data-testid="input-edit-contact-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editContactForm.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Purchase Manager, CEO, Sales Head" data-testid="input-edit-contact-designation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editContactForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="john@company.com" data-testid="input-edit-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editContactForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 98765 43210" data-testid="input-edit-contact-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editContactForm.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 98765 43210" data-testid="input-edit-contact-whatsapp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editContactForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department/Role</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Procurement, Operations, Finance" data-testid="input-edit-contact-role" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                <FormField
                  control={editContactForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-edit-contact-active" />
                      </FormControl>
                      <FormLabel className="!mt-0">Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditContactDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateContactMutation.isPending} data-testid="button-update-contact">
                  {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contactToDelete?.contactName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && deleteContactMutation.mutate(contactToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-contact"
            >
              {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AiSalesEmailDialog
        companyId={companyId}
        companyName={companyDetails?.companyName}
        open={!!aiRecipient}
        onOpenChange={(open) => !open && setAiRecipient(null)}
        initialRecipientEmail={aiRecipient?.email || ""}
        initialContactId={aiRecipient?.contactId}
      />
    </>
  );
}
