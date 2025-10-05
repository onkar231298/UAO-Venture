import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Building2, User, Package, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

// Form schemas - simplified and tailored for the form fields
const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  gstNumber: z.string().optional(),
  industryType: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressCountry: z.string().optional(),
});

const leadSchema = z.object({
  companyId: z.number().min(1, "Company is required"),
  contactPersonId: z.number().optional(),
  leadSource: z.string().min(1, "Lead source is required"),
  buyingTimeline: z.string().optional(),
  expectedOrderValue: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  currentStage: z.string().default("new_lead"),
  assignedTo: z.string().optional(),
  specialRequirements: z.string().optional(),
  currentSupplier: z.string().optional(),
  reasonForChange: z.string().optional(),
});

interface LeadCreationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadCreationForm({ open, onOpenChange }: LeadCreationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);

  // Fetch companies for selection
  const { data: companiesData } = useQuery<{ companies: any[]; total: number }>({
    queryKey: ["/api/crm/companies"],
    enabled: open && !showNewCompanyForm,
  });
  const companies = companiesData?.companies || [];

  // Fetch contacts for selected company
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/companies", selectedCompanyId, "contacts"],
    enabled: !!selectedCompanyId && step === 2,
  });

  // Fetch sales reps for assignment
  const { data: salesReps = [] } = useQuery<any[]>({
    queryKey: ["/api/users/sales-reps"],
    enabled: open && step === 2,
  });

  // Company form
  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      gstNumber: "",
      industryType: "",
      companySize: "",
      website: "",
      addressCity: "",
      addressState: "",
      addressCountry: "",
    },
  });

  // Lead form
  const leadForm = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      companyId: 0,
      contactPersonId: undefined,
      leadSource: "",
      buyingTimeline: "",
      expectedOrderValue: "",
      priority: "medium",
      currentStage: "new_lead",
      assignedTo: (user as any)?.id || "",
      specialRequirements: "",
      currentSupplier: "",
      reasonForChange: "",
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation<any, Error, z.infer<typeof companySchema>>({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
      const response = await apiRequest("/api/crm/companies", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      setSelectedCompanyId(newCompany.id);
      leadForm.setValue("companyId", newCompany.id);
      setShowNewCompanyForm(false);
      setStep(2);
      toast({
        title: "Company created",
        description: "Company has been successfully added",
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

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leadSchema>) => {
      const response = await apiRequest("/api/crm/leads", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate all lead queries to refresh the Kanban board
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/stats"] });
      toast({
        title: "Lead created",
        description: "New lead has been successfully added to the pipeline",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const handleCompanySubmit = (data: z.infer<typeof companySchema>) => {
    createCompanyMutation.mutate(data);
  };

  const handleLeadSubmit = (data: z.infer<typeof leadSchema>) => {
    createLeadMutation.mutate(data);
  };

  const handleSelectExistingCompany = (companyId: number) => {
    setSelectedCompanyId(companyId);
    leadForm.setValue("companyId", companyId);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCompanyId(null);
    setShowNewCompanyForm(false);
    companyForm.reset();
    leadForm.reset();
    onOpenChange(false);
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedCompanyId(null);
      leadForm.setValue("companyId", 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Create New Lead - Select Company" : "Create New Lead - Lead Details"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Select an existing company or create a new one"
              : "Enter lead details and requirements"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Company Selection/Creation */}
        {step === 1 && (
          <div className="space-y-6">
            {!showNewCompanyForm ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Select Existing Company</h3>
                </div>

                <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      data-testid="button-select-company"
                      variant="outline"
                      role="combobox"
                      aria-expanded={companySearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedCompanyId
                        ? companies?.find((c: any) => c.id === selectedCompanyId)?.companyName
                        : "Select company..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput data-testid="input-search-company" placeholder="Search company..." />
                      <CommandList>
                        <CommandEmpty>No company found.</CommandEmpty>
                        <CommandGroup>
                          {companies?.map((company: any) => (
                            <CommandItem
                              key={company.id}
                              value={company.companyName}
                              onSelect={() => {
                                handleSelectExistingCompany(company.id);
                                setCompanySearchOpen(false);
                              }}
                              data-testid={`option-company-${company.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCompanyId === company.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-medium">{company.companyName}</div>
                                <div className="text-xs text-gray-500">
                                  {company.addressCity && `${company.addressCity}, `}
                                  {company.addressCountry}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  data-testid="button-create-new-company"
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCompanyForm(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Company
                </Button>
              </div>
            ) : (
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <h3 className="font-semibold">New Company Information</h3>
                    </div>
                    <Button
                      data-testid="button-back-to-selection"
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewCompanyForm(false)}
                    >
                      Back to Selection
                    </Button>
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-company-name" placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input data-testid="input-gst-number" placeholder="GST number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
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
                              <SelectItem value="pharmaceutical">Pharmaceutical</SelectItem>
                              <SelectItem value="nutraceutical">Nutraceutical</SelectItem>
                              <SelectItem value="cosmetics">Cosmetics & Personal Care</SelectItem>
                              <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                              <SelectItem value="animal_feed">Animal Feed</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
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

                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input data-testid="input-website" placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="addressCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input data-testid="input-city" placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="addressState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input data-testid="input-state" placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="addressCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input data-testid="input-country" placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      data-testid="button-cancel-company"
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewCompanyForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      data-testid="button-create-company-submit"
                      type="submit"
                      disabled={createCompanyMutation.isPending}
                    >
                      {createCompanyMutation.isPending ? "Creating..." : "Create Company & Continue"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}

        {/* Step 2: Lead Details */}
        {step === 2 && (
          <Form {...leadForm}>
            <form onSubmit={leadForm.handleSubmit(handleLeadSubmit)} className="space-y-6">
              {/* Contact Person Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Contact Person</h3>
                </div>

                <FormField
                  control={leadForm.control}
                  name="contactPersonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Contact</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-person">
                            <SelectValue placeholder="Select contact person" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts?.map((contact: any) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.contactName} {contact.designation ? `- ${contact.designation}` : ""}
                            </SelectItem>
                          ))}
                          {(!contacts || contacts.length === 0) && (
                            <SelectItem value="none" disabled>
                              No contacts available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lead Source & Business Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Business Details</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={leadForm.control}
                    name="leadSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lead-source">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="trade_show">Trade Show</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="cold_call">Cold Call</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="email_campaign">Email Campaign</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={leadForm.control}
                    name="buyingTimeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buying Timeline</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-buying-timeline">
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="1_month">Within 1 Month</SelectItem>
                            <SelectItem value="3_months">Within 3 Months</SelectItem>
                            <SelectItem value="6_months_plus">6 Months or More</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={leadForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={leadForm.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-assign-to">
                              <SelectValue placeholder="Select sales rep" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesReps?.map((rep: any) => (
                              <SelectItem key={rep.id} value={rep.id}>
                                {rep.full_name || rep.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Financial Details</h3>
                </div>

                <FormField
                  control={leadForm.control}
                  name="expectedOrderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Order Value</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-expected-order-value"
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={leadForm.control}
                    name="currentSupplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Supplier</FormLabel>
                        <FormControl>
                          <Input data-testid="input-current-supplier" placeholder="Current supplier name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={leadForm.control}
                    name="reasonForChange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Change</FormLabel>
                        <FormControl>
                          <Input data-testid="input-reason-for-change" placeholder="Why looking for new supplier" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Special Requirements */}
              <FormField
                control={leadForm.control}
                name="specialRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        data-testid="textarea-special-requirements"
                        placeholder="Enter any special requirements, certifications needed, or additional notes..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button
                  data-testid="button-back-to-step-1"
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    data-testid="button-cancel-lead"
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="button-create-lead-submit"
                    type="submit"
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
