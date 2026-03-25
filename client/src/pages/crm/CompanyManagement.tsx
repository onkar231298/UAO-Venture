import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Search, Plus, MapPin, Globe, Users, X, Phone, Mail, RefreshCw, Filter, UserPlus, MoreVertical, List, Kanban, Upload, Calendar, History, CheckSquare, StickyNote, Pin, Trash2, Edit2, AlertTriangle, ArrowRight, ChevronDown, Send, Eye, Reply, CheckCircle, PhoneMissed, Clock, User, ChevronsUpDown, Check, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CompanyNotes } from "@/components/crm/CompanyNotes";
import { ClickToCall, SendSmsButton, Dialer } from "@/components/crm/Dialer";
import { CompanyActivityTimeline } from "@/components/crm/CompanyActivityTimeline";
import { CompanyEmailsTab } from "@/components/crm/CompanyEmailsTab";
import { CompanyCallsTab } from "@/components/crm/CompanyCallsTab";
import { BulkEmailComposer } from "@/components/crm/BulkEmailComposer";
import { QualityRequestDialog } from "@/components/quality/QualityRequestDialog";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const COMPANY_STAGES = [
  { id: "new", label: "New", color: "bg-gray-100 text-gray-800" },
  { id: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800" },
  { id: "qualified", label: "Qualified", color: "bg-cyan-100 text-cyan-800" },
  { id: "active", label: "Active Customer", color: "bg-green-100 text-green-800" },
  { id: "inactive", label: "Inactive", color: "bg-slate-100 text-slate-800" },
  { id: "churned", label: "Churned", color: "bg-red-100 text-red-800" },
];

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  primaryEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  gstNumber: z.string().optional(),
  industryType: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().optional().or(z.literal("")),
  
  // Primary Address
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressCountry: z.string().optional(),
  addressZip: z.string().optional(),
  
  // Factory/Warehouse Address
  factoryAddressStreet: z.string().optional(),
  factoryAddressCity: z.string().optional(),
  factoryAddressState: z.string().optional(),
  factoryAddressCountry: z.string().optional(),
  factoryAddressZip: z.string().optional(),
  
  // Department contact phones
  departmentPhones: z.array(z.object({
    department: z.string(),
    phone: z.string(),
  })).optional(),
  
  // Additional emails with positions
  additionalEmails: z.array(z.object({
    position: z.string(),
    email: z.string().email("Invalid email"),
  })).optional(),
});

interface Company {
  id: number;
  companyName: string;
  gstNumber?: string | null;
  industryType?: string | null;
  companySize?: string | null;
  website?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressCountry?: string | null;
  addressZip?: string | null;
  factoryAddressStreet?: string | null;
  factoryAddressCity?: string | null;
  factoryAddressState?: string | null;
  factoryAddressCountry?: string | null;
  factoryAddressZip?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  createdAt: string;
  origin?: string | null;
  status?: string | null;
  companyStage?: string | null;
  priority?: string | null;
  linkedUserId?: string | null;
}

interface SalesRep {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

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

function CompanyContactsTab({ companyId, companyDetails }: { companyId: number; companyDetails?: CompanyDetails | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<CompanyContact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<CompanyContact | null>(null);

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
      const response = await apiRequest("POST", `/api/crm/companies/${companyId}/contacts`, data);
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
      const response = await apiRequest("PATCH", `/api/crm/contacts/${contactId}`, data);
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
      const response = await apiRequest("DELETE", `/api/crm/contacts/${contactId}`);
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
      const response = await apiRequest("POST", `/api/crm/companies/${companyId}/contacts/${contactId}/set-primary`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'contacts'] });
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
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Add Contact Button */}
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

          {/* Primary Contact Info from Company */}
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
                    <a href={`mailto:${companyDetails.primaryEmail}`} className="text-blue-600 hover:underline">
                      {companyDetails.primaryEmail}
                    </a>
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
          
          {/* Department Contacts */}
          {hasContacts ? (
            <>
              <h4 className="font-medium text-sm text-muted-foreground pt-2">Department Contacts</h4>
              {contacts!.map((contact) => (
                <div key={contact.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{contact.contactName}</p>
                      {contact.isPrimary && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Primary</Badge>
                      )}
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
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.whatsapp && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">WhatsApp: {contact.whatsapp}</span>
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

      {/* Add Contact Dialog */}
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

      {/* Edit Contact Dialog */}
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

      {/* Delete Contact Confirmation */}
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
    </Card>
  );
}

export default function CompanyManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const trackView = (entityType: string, entityId: number, entityName: string) => {
    fetch('/api/crm/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId, entityName }),
      credentials: 'include',
    }).catch(() => {});
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    hasPotentialDuplicates: boolean;
    matches: Array<{
      companyId: number;
      companyName: string;
      matchType: string;
      confidence: number;
      matchedFields: string[];
      assignedToUserId?: string | null;
      assignedToUserName?: string | null;
    }>;
    highestConfidence: number;
  } | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  
  // Bulk upload state
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<Array<{ row: number; field: string; message: string }>>([]);
  const [bulkUploadStep, setBulkUploadStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [isValidatingBulk, setIsValidatingBulk] = useState(false);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  
  // Convert to Lead state (multi-product)
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [convertProducts, setConvertProducts] = useState<Array<{
    productId: number | null;
    productName: string;
    quantity: string;
    unit: string;
  }>>([{ productId: null, productName: '', quantity: '', unit: 'kg' }]);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [convertFormData, setConvertFormData] = useState({
    selectedProductId: null as number | null,
    productName: '',
    productDescription: '',
    quantity: '',
    unit: 'kg',
  });
  const [activityFilter, setActivityFilter] = useState<'email' | 'call' | null>(null);
  const [showBulkEmailComposer, setShowBulkEmailComposer] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Company form
  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      primaryEmail: "",
      primaryPhone: "",
      gstNumber: "",
      industryType: "",
      companySize: "",
      website: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressCountry: "",
      addressZip: "",
      factoryAddressStreet: "",
      factoryAddressCity: "",
      factoryAddressState: "",
      factoryAddressCountry: "",
      factoryAddressZip: "",
      departmentPhones: [],
      additionalEmails: [],
    },
  });

  // Check for duplicates when company details change
  const checkForDuplicates = async (companyName: string, email?: string, phone?: string) => {
    if (!companyName || companyName.length < 3) {
      setDuplicateWarning(null);
      return;
    }
    
    setIsCheckingDuplicates(true);
    try {
      const response = await fetch('/api/check-duplicate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, email: email || undefined, phone: phone || undefined }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setDuplicateWarning(result);
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Debounce duplicate check
  useEffect(() => {
    const companyName = form.watch('companyName');
    const email = form.watch('primaryEmail');
    const phone = form.watch('primaryPhone');
    
    if (!createDialogOpen) {
      setDuplicateWarning(null);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      checkForDuplicates(companyName, email, phone);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [form.watch('companyName'), form.watch('primaryEmail'), form.watch('primaryPhone'), createDialogOpen]);

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
      return await apiRequest("/api/crm/companies", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setCreateDialogOpen(false);
      form.reset();
      setDuplicateWarning(null);
      toast({
        title: "Success",
        description: "Company created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    },
  });

  // Delete company mutation (super_admin only)
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      return await apiRequest(`/api/crm/companies/${companyId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      });
    },
  });

  // Bulk delete companies mutation (admin only)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (companyIds: number[]) => {
      return await apiRequest(`/api/crm/companies/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ companyIds }),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setBulkDeleteDialogOpen(false);
      setSelectedCompanies([]);
      toast({
        title: "Success",
        description: `${data.deleted || selectedCompanies.length} companies deleted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete companies",
        variant: "destructive",
      });
    },
  });

  // Edit company mutation
  const editCompanyMutation = useMutation({
    mutationFn: async ({ companyId, data }: { companyId: number; data: z.infer<typeof companySchema> }) => {
      // Exclude departmentPhones and additionalEmails from the payload to prevent data loss
      const { departmentPhones, additionalEmails, ...updateData } = data;
      return await apiRequest(`/api/crm/companies/${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setEditDialogOpen(false);
      setCompanyToEdit(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company",
        variant: "destructive",
      });
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      primaryEmail: "",
      primaryPhone: "",
      gstNumber: "",
      industryType: "",
      companySize: "",
      website: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressCountry: "",
      addressZip: "",
      factoryAddressStreet: "",
      factoryAddressCity: "",
      factoryAddressState: "",
      factoryAddressCountry: "",
      factoryAddressZip: "",
      departmentPhones: [],
      additionalEmails: [],
    },
  });

  // Open edit dialog with company data
  const handleOpenEditDialog = (company: Company) => {
    setCompanyToEdit(company);
    editForm.reset({
      companyName: company.companyName || "",
      primaryEmail: company.primaryEmail || "",
      primaryPhone: company.primaryPhone || "",
      gstNumber: company.gstNumber || "",
      industryType: company.industryType || "",
      companySize: company.companySize || "",
      website: company.website || "",
      addressStreet: company.addressStreet || "",
      addressCity: company.addressCity || "",
      addressState: company.addressState || "",
      addressCountry: company.addressCountry || "",
      addressZip: company.addressZip || "",
      factoryAddressStreet: company.factoryAddressStreet || "",
      factoryAddressCity: company.factoryAddressCity || "",
      factoryAddressState: company.factoryAddressState || "",
      factoryAddressCountry: company.factoryAddressCountry || "",
      factoryAddressZip: company.factoryAddressZip || "",
      departmentPhones: [],
      additionalEmails: [],
    });
    setEditDialogOpen(true);
  };

  // Check if user can edit company (admin/sales_manager or assigned sales agent)
  const canEditCompany = (company: Company) => {
    if (!user) return false;
    const userRole = (user as any).role;
    const adminRoles = ['admin', 'super_admin', 'sales_manager'];
    const salesRoles = ['sales', 'sales_executive'];
    
    // Admins and sales managers can edit any company
    if (adminRoles.includes(userRole)) return true;
    // Sales agents can only edit companies assigned to them
    if (salesRoles.includes(userRole) && company.assignedTo === (user as any).id) return true;
    return false;
  };

  // Fetch sales reps for assignment
  const { data: salesReps = [] } = useQuery<SalesRep[]>({
    queryKey: ["/api/users/sales-reps"],
  });

  // Fetch distinct countries for the country filter dropdown
  const { data: distinctCountries = [] } = useQuery<string[]>({
    queryKey: ["/api/crm/companies/distinct-countries"],
    queryFn: async () => {
      const response = await fetch("/api/crm/companies/distinct-countries", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch products for the Convert to Lead dropdown
  const { data: productsData } = useQuery<{ products: Array<{ id: number; productId: string; name: string; description: string | null }> }>({
    queryKey: ['/api/products', { limit: 1000 }],
    enabled: showConvertDialog,
  });

  // Convert company to lead mutation (multi-product)
  const convertToLeadMutation = useMutation({
    mutationFn: async ({ companyId, data }: { 
      companyId: number; 
      data: {
        products: Array<{ productId: number; productName: string; quantity: string; unit: string }>;
      };
    }) => {
      return apiRequest(`/api/crm/companies/${companyId}/convert-to-lead`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      setShowConvertDialog(false);
      setViewDetailsOpen(false);
      setSelectedCompany(null);
      setConvertProducts([{ productId: null, productName: '', quantity: '', unit: 'kg' }]);
      setActiveProductIndex(0);
      toast({ 
        title: "Lead Created Successfully", 
        description: `Lead ${result.lead?.leadId || ''} has been created with ${convertProducts.filter(p => p.productId).length} product(s).` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create lead", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    },
  });

  // Fetch companies with RBAC filtering
  const buildCompaniesUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (industryFilter && industryFilter !== "all") params.append("industryType", industryFilter);
    if (originFilter && originFilter !== "all") params.append("origin", originFilter);
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (stageFilter && stageFilter !== "all") params.append("companyStage", stageFilter);
    if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
    if (assignedToFilter && assignedToFilter !== "all") params.append("assignedTo", assignedToFilter);
    if (countryFilter && countryFilter !== "all") params.append("country", countryFilter);
    if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
    if (dateTo) params.append("dateTo", dateTo.toISOString());
    return `/api/crm/companies?${params.toString()}`;
  };

  const companiesQueryKey = ["/api/crm/companies", searchTerm, industryFilter, originFilter, statusFilter, stageFilter, priorityFilter, assignedToFilter, countryFilter, dateFrom?.toISOString(), dateTo?.toISOString()];

  const { data: companiesData, isLoading } = useQuery<{ companies: Company[]; total: number }>({
    queryKey: companiesQueryKey,
    queryFn: async () => {
      const response = await fetch(buildCompaniesUrl(), {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
  });

  const companies = companiesData?.companies || [];
  const total = companiesData?.total || 0;

  // Calculate paginated companies
  const totalPages = Math.ceil(companies.length / itemsPerPage);
  const paginatedCompanies = companies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, industryFilter, originFilter, statusFilter, stageFilter, priorityFilter, assignedToFilter, dateFrom, dateTo]);

  // Company assignment mutation
  const assignCompanyMutation = useMutation({
    mutationFn: async ({ companyId, assignedTo }: { companyId: number; assignedTo: string }) => {
      const response = await apiRequest(`/api/crm/companies/${companyId}/assign`, {
        method: "POST",
        body: JSON.stringify({ assignedTo }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast({
        title: "Company Assigned",
        description: "Company has been successfully assigned",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignCompany = (companyId: number, assignedTo: string) => {
    assignCompanyMutation.mutate({ companyId, assignedTo });
  };

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ companyIds, assignedTo }: { companyIds: number[]; assignedTo: string }) => {
      const response = await apiRequest(`/api/crm/companies/bulk-assign`, {
        method: "POST",
        body: JSON.stringify({ companyIds, assignedTo }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setSelectedCompanies([]);
      setBulkAssignDialogOpen(false);
      toast({
        title: "Companies Assigned",
        description: `${selectedCompanies.length} companies have been assigned successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectCompany = (companyId: number, checked: boolean) => {
    if (checked) {
      setSelectedCompanies(prev => [...prev, companyId]);
    } else {
      setSelectedCompanies(prev => prev.filter(id => id !== companyId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(paginatedCompanies.map(c => c.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  const handleBulkAssign = (assignedTo: string) => {
    bulkAssignMutation.mutate({ companyIds: selectedCompanies, assignedTo });
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Stage update mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ companyId, stage }: { companyId: number; stage: string }) => {
      const response = await apiRequest(`/api/crm/companies/${companyId}/stage`, {
        method: "POST",
        body: JSON.stringify({ stage }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast({
        title: "Stage Updated",
        description: "Company stage has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStageColor = (stage: string | null | undefined) => {
    const stageInfo = COMPANY_STAGES.find(s => s.id === stage);
    return stageInfo?.color || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    switch (priority) {
      case "hot": return "bg-red-100 text-red-800";
      case "warm": return "bg-orange-100 text-orange-800";
      case "cold": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const adminRoles = ['admin', 'super_admin', 'sales_manager'];
  const isAdmin = user && (user as any).role ? adminRoles.includes((user as any).role) : false;
  const isSuperAdmin = user && (user as any).role === 'super_admin';

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Companies data has been updated",
      });
    }, 500);
  };

  // Download all companies as Excel (super admin only)
  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/crm/companies/export", { credentials: "include" });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const today = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `companies_export_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: "The Excel file is being downloaded." });
    } catch {
      toast({ title: "Download failed", description: "Could not export company data.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-company-management">
            {isAdmin ? "Company Management" : "My Companies"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage all companies - both website customers and manually added"
              : "View companies assigned to you or created by you"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              data-testid="button-view-kanban"
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh-companies"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          {isSuperAdmin && (
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              disabled={isDownloading}
              data-testid="button-download-all-companies"
            >
              {isDownloading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? "Exporting..." : "Download All"}
            </Button>
          )}

          <Button 
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button 
            variant="outline"
            data-testid="button-bulk-upload" 
            onClick={() => {
              setBulkUploadDialogOpen(true);
              setBulkUploadStep('upload');
              setBulkUploadFile(null);
              setBulkUploadPreview([]);
              setBulkUploadErrors([]);
              setImportResults(null);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          
          <Button data-testid="button-create-company" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>
      
      {/* Stage Filter Tabs */}
      <Tabs value={stageFilter} onValueChange={setStageFilter} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="all" className="text-xs" data-testid="tab-all-stages">All</TabsTrigger>
          {COMPANY_STAGES.map(stage => (
            <TabsTrigger 
              key={stage.id} 
              value={stage.id} 
              className="text-xs"
              data-testid={`tab-stage-${stage.id}`}
            >
              {stage.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, GST, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-companies"
              />
            </div>
            
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-origin-filter">
                <SelectValue placeholder="Origin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Origins</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="import">Imported</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-industry-filter">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="pharma">Pharmaceuticals</SelectItem>
                <SelectItem value="cosmetics">Cosmetics & Personal Care</SelectItem>
                <SelectItem value="nutraceuticals">Nutraceuticals</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Country Filter — always visible */}
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-country-filter">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {distinctCountries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-priority-filter">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="merged">Merged (Duplicates)</SelectItem>
                </SelectContent>
              </Select>
              
              {isAdmin && (
                <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-assigned-filter">
                    <SelectValue placeholder="Assigned To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignments</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {salesReps.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id}>
                        {rep.firstName} {rep.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px]" data-testid="button-date-from">
                      <Calendar className="h-3 w-3 mr-1" />
                      {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-muted-foreground">to</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px]" data-testid="button-date-to">
                      <Calendar className="h-3 w-3 mr-1" />
                      {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilter} data-testid="button-clear-dates">
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold" data-testid="text-total-companies">{total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-website-companies">
                  {companies.filter(c => c.origin === 'website').length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-assigned-companies">
                  {companies.filter(c => c.assignedTo).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold text-amber-600" data-testid="text-unassigned-companies">
                  {companies.filter(c => !c.assignedTo).length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCompanies.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedCompanies.length} companies selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-bulk-assign">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign to
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Assign selected companies to</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {salesReps.map((rep) => (
                      <DropdownMenuItem 
                        key={rep.id}
                        onClick={() => handleBulkAssign(rep.id)}
                        data-testid={`bulk-assign-${rep.id}`}
                      >
                        <UserPlus className="h-3 w-3 mr-2" />
                        {rep.firstName} {rep.lastName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowBulkEmailComposer(true)}
                  data-testid="button-bulk-email"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Bulk Email
                </Button>
                <QualityRequestDialog triggerLabel="Request Quality" />
                {isAdmin && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    data-testid="button-bulk-delete"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCompanies([])}
                  data-testid="button-clear-selection"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No companies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden sm:rounded-lg">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="md:sticky md:top-0 md:z-10 md:bg-white md:dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={selectedCompanies.length === paginatedCompanies.length && paginatedCompanies.length > 0}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCompanies.map((company) => {
                        const assignedRep = salesReps.find(r => r.id === company.assignedTo);
                        const isSelected = selectedCompanies.includes(company.id);
                        return (
                          <TableRow 
                            key={company.id} 
                            data-testid={`row-company-${company.id}`}
                            className={isSelected ? "bg-blue-50" : ""}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectCompany(company.id, !!checked)}
                                data-testid={`checkbox-company-${company.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-2">
                                <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                  <p className="font-medium" data-testid={`text-company-name-${company.id}`}>
                                    {company.companyName}
                                  </p>
                                  {company.primaryEmail && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {company.primaryEmail}
                                    </p>
                                  )}
                                  {company.industryType && (
                                    <Badge variant="outline" className="mt-1 text-[10px]">
                                      {company.industryType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={company.origin === 'website' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                                }
                              >
                                {company.origin === 'website' ? 'Website' : company.origin || 'Manual'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStageColor(company.companyStage)}>
                                {COMPANY_STAGES.find(s => s.id === company.companyStage)?.label || 'New'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(company.priority)}>
                                {company.priority || 'warm'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {company.addressCity && (
                                  <>
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">
                                      {company.addressCity}
                                      {company.addressState && `, ${company.addressState}`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {company.createdAt ? format(new Date(company.createdAt), 'MMM dd, yyyy') : '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {assignedRep ? (
                                <span className="text-sm font-medium">
                                  {assignedRep.firstName} {assignedRep.lastName}
                                </span>
                              ) : (
                                <span className="text-sm text-amber-600">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setViewDetailsOpen(true);
                                    trackView('company', company.id, company.companyName);
                                  }}
                                  data-testid={`button-view-company-${company.id}`}
                                >
                                  View
                                </Button>
                                
                                {isAdmin && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        data-testid={`button-menu-${company.id}`}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {salesReps.map((rep) => (
                                        <DropdownMenuItem 
                                          key={rep.id}
                                          onClick={() => handleAssignCompany(company.id, rep.id)}
                                          data-testid={`menu-assign-${rep.id}`}
                                        >
                                          <UserPlus className="h-3 w-3 mr-2" />
                                          {rep.firstName} {rep.lastName}
                                          {company.assignedTo === rep.id && " (current)"}
                                        </DropdownMenuItem>
                                      ))}
                                      {isSuperAdmin && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              setCompanyToDelete(company);
                                              setDeleteDialogOpen(true);
                                            }}
                                            className="text-red-600 focus:text-red-600"
                                            data-testid={`menu-delete-${company.id}`}
                                          >
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Delete Company
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          
          {/* Pagination Controls */}
          {companies.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Companies per page:</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]" data-testid="select-items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value={companies.length.toString()}>All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, companies.length)} of {companies.length} companies
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  data-testid="button-first-page"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  data-testid="button-last-page"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Company Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to the CRM system
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-4">
              {/* Duplicate Warning Alert */}
              {duplicateWarning && duplicateWarning.hasPotentialDuplicates && (
                <div 
                  className={`p-4 rounded-lg border ${
                    duplicateWarning.highestConfidence >= 80 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : duplicateWarning.highestConfidence >= 60 
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                  data-testid="alert-duplicate-warning"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {duplicateWarning.highestConfidence >= 80 
                          ? 'Possible Duplicate Detected!' 
                          : 'Similar Companies Found'}
                      </h4>
                      <p className="text-sm mt-1">
                        {duplicateWarning.highestConfidence >= 80 
                          ? 'This company may already exist in the system. Please review before creating.'
                          : 'Similar companies exist. You may want to verify this is a new company.'}
                      </p>
                      <div className="mt-2 space-y-2">
                        {duplicateWarning.matches.slice(0, 3).map((match) => (
                          <div 
                            key={match.companyId} 
                            className="text-sm"
                            data-testid={`duplicate-match-${match.companyId}`}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              <span className="font-medium">{match.companyName}</span>
                              <Badge variant="outline" className="text-xs">
                                {match.confidence}% match
                              </Badge>
                            </div>
                            <div className="ml-5 text-xs mt-0.5">
                              {match.assignedToUserName ? (
                                <span className="text-amber-700 dark:text-amber-400 font-medium">
                                  Assigned to: {match.assignedToUserName}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} data-testid="input-company-name" />
                      </FormControl>
                      {isCheckingDuplicates && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@company.com" {...field} data-testid="input-primary-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="primaryPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1-xxx-xxx-xxxx" {...field} data-testid="input-primary-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="GST number" {...field} data-testid="input-gst-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-industry-type">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="pharma">Pharmaceuticals</SelectItem>
                          <SelectItem value="cosmetics">Cosmetics & Personal Care</SelectItem>
                          <SelectItem value="nutraceuticals">Nutraceuticals</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-size">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Department Phone Numbers */}
              <div className="space-y-4 pt-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Department Phone Numbers (Optional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentPhones = form.getValues("departmentPhones") || [];
                      form.setValue("departmentPhones", [...currentPhones, { department: "", phone: "" }]);
                    }}
                    data-testid="button-add-department-phone"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Department Phone
                  </Button>
                </div>
                {(form.watch("departmentPhones") || []).map((_, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`departmentPhones.${index}.department`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Department (e.g., Sales, Support)" {...field} data-testid={`input-dept-name-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`departmentPhones.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} data-testid={`input-dept-phone-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentPhones = form.getValues("departmentPhones") || [];
                        form.setValue("departmentPhones", currentPhones.filter((_, i) => i !== index));
                      }}
                      data-testid={`button-remove-dept-phone-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Additional Emails with Positions */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Additional Emails with Positions (Optional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentEmails = form.getValues("additionalEmails") || [];
                      form.setValue("additionalEmails", [...currentEmails, { position: "", email: "" }]);
                    }}
                    data-testid="button-add-additional-email"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Email
                  </Button>
                </div>
                {(form.watch("additionalEmails") || []).map((_, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`additionalEmails.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Position (e.g., Purchasing Manager)" {...field} data-testid={`input-email-position-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`additionalEmails.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="email" placeholder="email@company.com" {...field} data-testid={`input-additional-email-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentEmails = form.getValues("additionalEmails") || [];
                        form.setValue("additionalEmails", currentEmails.filter((_, i) => i !== index));
                      }}
                      data-testid={`button-remove-additional-email-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Primary Address */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Primary Address</h3>
                <FormField
                  control={form.control}
                  name="addressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} data-testid="input-address-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="addressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-address-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} data-testid="input-address-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="addressCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} data-testid="input-address-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal/ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP code" {...field} data-testid="input-address-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Factory/Warehouse Address */}
              <div className="space-y-4 pt-4">
                <h3 className="font-semibold text-sm">Factory/Warehouse Address</h3>
                <FormField
                  control={form.control}
                  name="factoryAddressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} data-testid="input-factory-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="factoryAddressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-factory-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="factoryAddressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} data-testid="input-factory-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="factoryAddressCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} data-testid="input-factory-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="factoryAddressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal/ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP code" {...field} data-testid="input-factory-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCompanyMutation.isPending}
                  data-testid="button-submit-company"
                >
                  {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Company Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedCompany?.companyName}
            </DialogTitle>
            <DialogDescription>
              View and manage company details
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-4">
              {/* Status Badges Row */}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge 
                  variant="outline" 
                  className={selectedCompany.origin === 'website' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                  }
                >
                  {selectedCompany.origin === 'website' ? 'Website Customer' : 'Manually Added'}
                </Badge>
                <Badge className={getStageColor(selectedCompany.companyStage)}>
                  {COMPANY_STAGES.find(s => s.id === selectedCompany.companyStage)?.label || 'Prospect'}
                </Badge>
                <Badge className={getPriorityColor(selectedCompany.priority)}>
                  {selectedCompany.priority || 'warm'}
                </Badge>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
                {canEditCompany(selectedCompany) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewDetailsOpen(false);
                      handleOpenEditDialog(selectedCompany);
                    }}
                    data-testid="button-edit-company"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Company
                  </Button>
                )}
                
                {/* Convert to Lead button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowConvertDialog(true)}
                  data-testid="button-convert-to-lead"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convert to Lead
                </Button>
                
                {isAdmin && (
                  <>
                    <Select 
                      value={selectedCompany.companyStage || 'prospect'}
                      onValueChange={(value) => {
                        updateStageMutation.mutate({ companyId: selectedCompany.id, stage: value });
                      }}
                    >
                      <SelectTrigger className="w-[180px]" data-testid="select-change-stage">
                        <SelectValue placeholder="Change Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_STAGES.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={selectedCompany.assignedTo || ""}
                      onValueChange={(value) => handleAssignCompany(selectedCompany.id, value)}
                    >
                      <SelectTrigger className="w-[180px]" data-testid="select-assign-rep">
                        <SelectValue placeholder="Assign to Rep" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesReps.map(rep => (
                          <SelectItem key={rep.id} value={rep.id}>
                            {rep.firstName} {rep.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="info" data-testid="tab-info">Info</TabsTrigger>
                  <TabsTrigger value="contacts" data-testid="tab-contacts" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Contacts
                  </TabsTrigger>
                  <TabsTrigger value="emails" data-testid="tab-emails" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Emails
                  </TabsTrigger>
                  <TabsTrigger value="calls" data-testid="tab-calls" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Calls
                  </TabsTrigger>
                  <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
                  <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  {/* Company Information Section */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Company Name</p>
                          <p className="font-medium">{selectedCompany.companyName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Industry</p>
                          <p className="font-medium">{selectedCompany.industryType || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Website</p>
                          <p className="font-medium">
                            {selectedCompany.website ? (
                              <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {selectedCompany.website}
                              </a>
                            ) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">
                            {[selectedCompany.addressCity, selectedCompany.addressCountry].filter(Boolean).join(", ") || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Primary Contact Section */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Primary Contact
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Contact Name</p>
                          <p className="font-medium">N/A</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Designation</p>
                          <p className="font-medium">N/A</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">
                            {selectedCompany.primaryEmail ? (
                              <a 
                                href={`mailto:${selectedCompany.primaryEmail}`} 
                                className="text-blue-600 hover:underline"
                              >
                                {selectedCompany.primaryEmail}
                              </a>
                            ) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <div className="font-medium flex items-center gap-2">
                            {selectedCompany.primaryPhone ? (
                              <>
                                <ClickToCall
                                  phoneNumber={selectedCompany.primaryPhone}
                                  contactName={selectedCompany.companyName}
                                  companyId={selectedCompany.id}
                                />
                                <SendSmsButton
                                  phoneNumber={selectedCompany.primaryPhone}
                                  contactName={selectedCompany.companyName}
                                  companyId={selectedCompany.id}
                                />
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dialer Integration */}
                      {selectedCompany.primaryPhone && (
                        <div className="mt-4 pt-4 border-t">
                          <Dialer
                            companyId={selectedCompany.id}
                            contactName={selectedCompany.companyName}
                            phoneNumber={selectedCompany.primaryPhone}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stage & Status Section */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Status Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Stage</p>
                          <div className="mt-1">
                            <Badge className={getStageColor(selectedCompany.companyStage)}>
                              {COMPANY_STAGES.find(s => s.id === selectedCompany.companyStage)?.label || 'New'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Origin</p>
                          <p className="font-medium mt-1">
                            {selectedCompany.origin === 'website' ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Website Registration</Badge>
                            ) : (
                              <Badge variant="outline">Manual Entry</Badge>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Assigned To</p>
                          <p className="font-medium flex items-center gap-1 mt-1">
                            <UserPlus className="h-3 w-3" />
                            {salesReps.find(r => r.id === selectedCompany.assignedTo)
                              ? `${salesReps.find(r => r.id === selectedCompany.assignedTo)?.firstName} ${salesReps.find(r => r.id === selectedCompany.assignedTo)?.lastName}`
                              : <span className="text-amber-600">Unassigned</span>
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created At</p>
                          <p className="font-medium mt-1">{new Date(selectedCompany.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-4">
                  <CompanyContactsTab 
                    companyId={selectedCompany.id} 
                    companyDetails={selectedCompany as any}
                  />
                </TabsContent>

                <TabsContent value="emails" className="mt-4">
                  <CompanyEmailsTab companyId={selectedCompany.id} companyEmail={selectedCompany.primaryEmail || null} />
                </TabsContent>

                <TabsContent value="calls" className="mt-4">
                  <CompanyCallsTab companyId={selectedCompany.id} />
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <CompanyNotes 
                    companyId={selectedCompany.id} 
                    currentUserId={user?.id || ''} 
                  />
                </TabsContent>
                
                <TabsContent value="activity" className="mt-4">
                  <CompanyActivityTimeline companyId={selectedCompany.id} />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setViewDetailsOpen(false)} data-testid="button-close-details">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialogOpen} onOpenChange={setBulkUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-bulk-upload">
          <DialogHeader>
            <DialogTitle>Bulk Company Upload</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import multiple companies at once.
            </DialogDescription>
          </DialogHeader>

          {bulkUploadStep === 'upload' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/crm/companies/import/template');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'company_import_template.csv';
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to download template", variant: "destructive" });
                    }
                  }}
                  data-testid="button-download-template"
                >
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBulkUploadFile(file);
                      setIsValidatingBulk(true);
                      setBulkUploadErrors([]);

                      const formData = new FormData();
                      formData.append('file', file);

                      try {
                        const response = await fetch('/api/crm/companies/import/validate', {
                          method: 'POST',
                          body: formData,
                        });
                        const result = await response.json();
                        
                        if (response.ok) {
                          setBulkUploadPreview(result.companies || []);
                          setBulkUploadErrors(result.errors || []);
                          setBulkUploadStep('preview');
                        } else {
                          toast({ title: "Error", description: result.message || "Failed to validate file", variant: "destructive" });
                        }
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to validate file", variant: "destructive" });
                      } finally {
                        setIsValidatingBulk(false);
                      }
                    }
                  }}
                  className="hidden"
                  id="bulk-upload-input"
                  data-testid="input-bulk-upload-file"
                />
                <label htmlFor="bulk-upload-input">
                  <Button variant="secondary" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
                {bulkUploadFile && (
                  <p className="mt-2 text-sm text-muted-foreground">Selected: {bulkUploadFile.name}</p>
                )}
              </div>

              {isValidatingBulk && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Validating file...</span>
                </div>
              )}
            </div>
          )}

          {bulkUploadStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {(() => {
                    const blocked = bulkUploadPreview.filter((c: any) => c.isBlocked).length;
                    const ready = bulkUploadPreview.length - blocked;
                    return (
                      <>
                        <p className="font-medium">{ready} companies ready to import</p>
                        {blocked > 0 && (
                          <p className="text-sm text-red-600 font-medium">{blocked} blocked (duplicates detected)</p>
                        )}
                        {bulkUploadErrors.length > 0 && (
                          <p className="text-sm text-orange-600">{bulkUploadErrors.length} validation issues</p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <Button variant="outline" onClick={() => setBulkUploadStep('upload')} data-testid="button-back-to-upload">
                  Back
                </Button>
              </div>

              {bulkUploadErrors.length > 0 && (() => {
                const dupErrors = bulkUploadErrors.filter(e => e.message.includes('already exists') || e.message.includes('Duplicate within file') || e.message.includes('same email domain'));
                const otherErrors = bulkUploadErrors.filter(e => !dupErrors.includes(e));
                return (
                  <>
                    {dupErrors.length > 0 && (
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-800">Duplicate Entries Blocked ({dupErrors.length})</p>
                              <p className="text-xs text-red-600 mb-1">These entries will NOT be imported</p>
                              <ul className="text-sm text-red-700 mt-1 space-y-1">
                                {dupErrors.slice(0, 8).map((error, i) => (
                                  <li key={i}>Row {error.row}: {error.message}</li>
                                ))}
                                {dupErrors.length > 8 && (
                                  <li>...and {dupErrors.length - 8} more blocked</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {otherErrors.length > 0 && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-800">Validation Warnings</p>
                              <ul className="text-sm text-orange-700 mt-1 space-y-1">
                                {otherErrors.slice(0, 5).map((error, i) => (
                                  <li key={i}>Row {error.row}: {error.field} - {error.message}</li>
                                ))}
                                {otherErrors.length > 5 && (
                                  <li>...and {otherErrors.length - 5} more warnings</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-auto overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-background">Company Name</TableHead>
                        <TableHead className="sticky top-0 bg-background">Email</TableHead>
                        <TableHead className="sticky top-0 bg-background">Phone</TableHead>
                        <TableHead className="sticky top-0 bg-background">Additional Contacts</TableHead>
                        <TableHead className="sticky top-0 bg-background">Industry</TableHead>
                        <TableHead className="sticky top-0 bg-background">City</TableHead>
                        <TableHead className="sticky top-0 bg-background">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkUploadPreview.slice(0, 50).map((company, index) => {
                        const extraEmails = [company.additionalEmail1, company.additionalEmail2, company.additionalEmail3].filter(Boolean).length;
                        const extraPhones = [company.departmentPhone1, company.departmentPhone2, company.departmentPhone3].filter(Boolean).length;
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{company.companyName}</TableCell>
                            <TableCell>{company.primaryEmail || '-'}</TableCell>
                            <TableCell>{company.primaryPhone || '-'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {extraEmails > 0 && <span className="block">+{extraEmails} emails</span>}
                              {extraPhones > 0 && <span className="block">+{extraPhones} phones</span>}
                              {extraEmails === 0 && extraPhones === 0 && '-'}
                            </TableCell>
                            <TableCell>{company.industryType || '-'}</TableCell>
                            <TableCell>{company.addressCity || '-'}</TableCell>
                            <TableCell>
                              {company.isBlocked ? (
                                <Badge variant="destructive" className="text-xs">
                                  Blocked - Duplicate
                                </Badge>
                              ) : company.duplicateWarning ? (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  Similar Match
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  Ready
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {bulkUploadPreview.length > 50 && (
                  <p className="text-sm text-muted-foreground p-2 bg-muted text-center">
                    Showing first 50 of {bulkUploadPreview.length} companies
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBulkUploadDialogOpen(false)} data-testid="button-cancel-import">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const importableCompanies = bulkUploadPreview.filter((c: any) => !c.isBlocked);
                    if (importableCompanies.length === 0) {
                      toast({ title: "No companies to import", description: "All entries are blocked as duplicates", variant: "destructive" });
                      return;
                    }
                    setIsImportingBulk(true);
                    setBulkUploadStep('importing');
                    
                    try {
                      const response = await fetch('/api/crm/companies/import/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ companies: importableCompanies }),
                      });
                      const result = await response.json();
                      
                      if (response.ok) {
                        setImportResults(result);
                        queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });
                        const parts = [`Successfully imported ${result.success} companies`];
                        if (result.skippedDuplicates > 0) parts.push(`${result.skippedDuplicates} skipped (duplicates)`);
                        if (result.failed > 0) parts.push(`${result.failed} failed`);
                        toast({
                          title: "Import Complete",
                          description: parts.join(', '),
                        });
                      } else {
                        toast({ title: "Error", description: result.message || "Failed to import companies", variant: "destructive" });
                        setBulkUploadStep('preview');
                      }
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to import companies", variant: "destructive" });
                      setBulkUploadStep('preview');
                    } finally {
                      setIsImportingBulk(false);
                    }
                  }}
                  disabled={bulkUploadPreview.filter((c: any) => !c.isBlocked).length === 0 || isImportingBulk}
                  data-testid="button-confirm-import"
                >
                  {isImportingBulk ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>Import {bulkUploadPreview.filter((c: any) => !c.isBlocked).length} Companies</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {bulkUploadStep === 'importing' && importResults && (
            <div className="space-y-4 text-center py-8">
              <CheckSquare className="h-16 w-16 mx-auto text-green-600" />
              <h3 className="text-xl font-semibold">Import Complete</h3>
              <p className="text-muted-foreground">
                Successfully imported {importResults.success} companies
                {importResults.failed > 0 && `, ${importResults.failed} failed`}
              </p>
              
              {importResults.errors && importResults.errors.length > 0 && (
                <Card className="text-left border-red-200 bg-red-50">
                  <CardContent className="pt-4">
                    <p className="font-medium text-red-800 mb-2">Failed Imports:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResults.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Button onClick={() => setBulkUploadDialogOpen(false)} data-testid="button-close-import">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Company
            </DialogTitle>
            <DialogDescription>
              Update company information
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => {
              if (companyToEdit) {
                editCompanyMutation.mutate({ companyId: companyToEdit.id, data });
              }
            })} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-company-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-gst" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="primaryEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-edit-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="primaryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="industryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry Type</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-industry">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                            <SelectItem value="retailer">Retailer</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="exporter">Exporter</SelectItem>
                            <SelectItem value="importer">Importer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-size">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="500+">500+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://example.com" {...field} data-testid="input-edit-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Primary Address */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Primary Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="addressStreet"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="addressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="addressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="addressCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="addressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Factory/Warehouse Address */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Factory/Warehouse Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="factoryAddressStreet"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-factory-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="factoryAddressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-factory-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="factoryAddressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-factory-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="factoryAddressCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-factory-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="factoryAddressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-factory-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setCompanyToEdit(null);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editCompanyMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {editCompanyMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Convert to Lead Dialog - Multi-Product */}
      <Dialog open={showConvertDialog} onOpenChange={(open) => {
        setShowConvertDialog(open);
        if (!open) {
          setConvertProducts([{ productId: null, productName: '', quantity: '', unit: 'kg' }]);
          setActiveProductIndex(0);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-600" />
              Convert Company to Lead
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Converting:</strong> {selectedCompany?.companyName}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Add one or more products with quantities to create a lead. You can add multiple products for a multi-product enquiry.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Products <span className="text-red-500">*</span></Label>
                <span className="text-xs text-muted-foreground">{convertProducts.filter(p => p.productId).length} product(s) added</span>
              </div>

              {convertProducts.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Product #{index + 1}</span>
                    {convertProducts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => {
                          const updated = convertProducts.filter((_, i) => i !== index);
                          setConvertProducts(updated);
                          if (activeProductIndex >= updated.length) setActiveProductIndex(Math.max(0, updated.length - 1));
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <Popover open={productSearchOpen && activeProductIndex === index} onOpenChange={(open) => {
                      setProductSearchOpen(open);
                      if (open) setActiveProductIndex(index);
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between text-sm"
                          data-testid={`button-product-select-${index}`}
                        >
                          {item.productName || "Search and select a product..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search products..." />
                          <CommandList>
                            <CommandEmpty>No products found.</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-auto">
                              {productsData?.products?.filter(product => 
                                !convertProducts.some((cp, ci) => ci !== index && cp.productId === product.id)
                              ).map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={`${product.name} ${product.productId}`}
                                  onSelect={() => {
                                    const updated = [...convertProducts];
                                    updated[index] = {
                                      ...updated[index],
                                      productId: product.id,
                                      productName: `${product.name} (${product.productId})`,
                                    };
                                    setConvertProducts(updated);
                                    setProductSearchOpen(false);
                                  }}
                                  data-testid={`product-option-${product.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      item.productId === product.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.productId}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...convertProducts];
                        updated[index] = { ...updated[index], quantity: e.target.value };
                        setConvertProducts(updated);
                      }}
                      className="flex-1"
                      data-testid={`input-quantity-${index}`}
                    />
                    <Select 
                      value={item.unit} 
                      onValueChange={(value) => {
                        const updated = [...convertProducts];
                        updated[index] = { ...updated[index], unit: value };
                        setConvertProducts(updated);
                      }}
                    >
                      <SelectTrigger className="w-24" data-testid={`select-unit-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="mt">MT</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="ton">Ton</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => {
                  setConvertProducts([...convertProducts, { productId: null, productName: '', quantity: '', unit: 'kg' }]);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Product
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConvertDialog(false);
                  setConvertProducts([{ productId: null, productName: '', quantity: '', unit: 'kg' }]);
                  setActiveProductIndex(0);
                }}
                data-testid="button-cancel-convert"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const validProducts = convertProducts.filter(p => p.productId && p.quantity);
                  if (validProducts.length === 0) {
                    toast({
                      title: "Required Fields Missing",
                      description: "Please select at least one product and enter its quantity",
                      variant: "destructive"
                    });
                    return;
                  }
                  const incomplete = convertProducts.some(p => (p.productId && !p.quantity) || (!p.productId && p.quantity));
                  if (incomplete) {
                    toast({
                      title: "Incomplete Product Entries",
                      description: "Each product must have both a product selected and a quantity entered",
                      variant: "destructive"
                    });
                    return;
                  }
                  if (selectedCompany) {
                    convertToLeadMutation.mutate({
                      companyId: selectedCompany.id,
                      data: {
                        products: validProducts.map(p => ({
                          productId: p.productId!,
                          productName: p.productName,
                          quantity: p.quantity,
                          unit: p.unit,
                        })),
                      }
                    });
                  }
                }}
                disabled={convertToLeadMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm-convert"
              >
                {convertToLeadMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Lead...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Create Lead ({convertProducts.filter(p => p.productId && p.quantity).length} product{convertProducts.filter(p => p.productId && p.quantity).length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Super Admin Only */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-company">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{companyToDelete?.companyName}</strong>? 
              This action cannot be undone and will permanently remove all associated data including contacts, activities, and notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => companyToDelete && deleteCompanyMutation.mutate(companyToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteCompanyMutation.isPending ? "Deleting..." : "Delete Company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog - Admin Only */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-bulk-delete-companies">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete {selectedCompanies.length} Companies
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCompanies.length} selected companies</strong>? 
              This action cannot be undone and will permanently remove all associated data including contacts, activities, and notes for each company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(selectedCompanies)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedCompanies.length} Companies`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Email Composer */}
      <BulkEmailComposer
        open={showBulkEmailComposer}
        onOpenChange={setShowBulkEmailComposer}
        preSelectedCompanyIds={selectedCompanies}
      />
    </div>
  );
}
