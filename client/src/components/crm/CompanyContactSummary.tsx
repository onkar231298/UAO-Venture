import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Users } from "lucide-react";

export interface ContactSummaryRow {
  id: number;
  contactName: string;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

export function isCompanyPrimaryContact(
  contact: ContactSummaryRow,
  primaryEmail?: string | null,
): boolean {
  const email = contact.email?.trim().toLowerCase();
  const companyEmail = primaryEmail?.trim().toLowerCase();
  return contact.isPrimary || Boolean(email && companyEmail && email === companyEmail);
}

export function CompanyContactSummary({
  contacts,
  primaryEmail,
  isLoading,
  isError,
}: {
  contacts?: ContactSummaryRow[];
  primaryEmail?: string | null;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="mt-4 border-t pt-4" data-testid="company-contact-summary">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4" />
        Saved contacts {contacts ? `(${contacts.length})` : ""}
      </h4>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading saved contacts...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Saved contacts could not be loaded. Open the Contacts tab to retry.</p>
      ) : !contacts?.length ? (
        <p className="text-sm text-muted-foreground">No separate contact records for this company.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-md border p-3" data-testid={`contact-summary-${contact.id}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{contact.contactName}</span>
                <Badge variant="outline">
                  {isCompanyPrimaryContact(contact, primaryEmail) ? "Primary" : "Additional"}
                </Badge>
                {!contact.isActive && <Badge variant="outline">Inactive</Badge>}
                {contact.designation && <span className="text-sm text-muted-foreground">{contact.designation}</span>}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>}
                {contact.whatsapp && <span>WhatsApp: {contact.whatsapp}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}