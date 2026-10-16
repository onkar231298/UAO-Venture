import { useQuery } from "@tanstack/react-query";
import { Building2, Mail, MapPin, Phone, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import "./CompanyContextDesk.css";

interface CompanyContextRecord {
  id: number;
  companyName: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  industryType?: string | null;
  companyStage?: string | null;
  priority?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  createdAt?: string | null;
  origin?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressCountry?: string | null;
  addressZip?: string | null;
  website?: string | null;
}

interface CompanyContextContact {
  id: number;
  companyId: number;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  designation?: string | null;
  role?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

interface CompanyContextDeskProps {
  company: CompanyContextRecord | null;
  onView?: () => void;
  ownerName?: string | null;
}

const displayValue = (value?: string | null) => value?.trim() || "Not provided";

export function CompanyContextDesk({ company, onView, ownerName }: CompanyContextDeskProps) {
  const companyId = company?.id;

  const contactsQuery = useQuery<CompanyContextContact[]>({
    queryKey: ["/api/crm/companies", companyId, "contacts"],
    enabled: !!companyId,
    queryFn: async () => {
      const response = await fetch(`/api/crm/companies/${companyId}/contacts`, { credentials: "include" });
      if (!response.ok) throw new Error("Could not load people for this company.");
      const contacts = await response.json() as CompanyContextContact[];
      if (!Array.isArray(contacts) || contacts.some((contact) => contact.companyId !== companyId)) {
        throw new Error("The returned contacts did not match this company. Please retry.");
      }
      return contacts;
    },
  });

  // The page already owns the authenticated company record. A second company GET
  // would log another security access event merely for rendering this side panel.
  const record = company;
  const contacts = contactsQuery.data?.filter((contact) => contact.companyId === companyId) || [];
  const location = [record?.addressCity, record?.addressState, record?.addressCountry]
    .filter((part) => part?.trim())
    .join(", ");

  return (
    <aside className="crm-company-desk" aria-label="Selected company and people" data-testid="company-context-desk" data-company-id={companyId}>
      <div className="crm-company-desk__header">
        <span>Company &amp; people desk</span>
        <h2>{company?.companyName || "Choose a company"}</h2>
        <p>{[company?.industryType, location || company?.addressCity || company?.addressCountry].filter(Boolean).join(" · ") || "Company context"}</p>
      </div>
      {!company ? (
        <div className="crm-company-desk__empty">
          <Building2 aria-hidden="true" />
          <p>Select a company to see its record and people.</p>
        </div>
      ) : (
        <div className="crm-company-desk__body">
          <div className="crm-company-desk__actions">
            {onView && <Button size="sm" variant="outline" onClick={onView} data-testid="button-context-view-company">View details</Button>}
            {record?.primaryEmail && <Button size="sm" variant="outline" asChild><a href={`mailto:${record.primaryEmail}`}><Mail aria-hidden="true" /> Email</a></Button>}
          </div>

          <section className="crm-company-desk__section">
            <h3><Building2 aria-hidden="true" /> Company record</h3>
              <dl className="crm-company-desk__details">
                <div><dt>Primary inbox</dt><dd>{displayValue(record?.primaryEmail)}</dd></div>
                <div><dt>Primary phone</dt><dd>{displayValue(record?.primaryPhone)}</dd></div>
                <div><dt>Lifecycle</dt><dd>{displayValue(record?.companyStage)}</dd></div>
                <div><dt>Priority</dt><dd>{displayValue(record?.priority)}</dd></div>
                <div><dt>Record status</dt><dd>{displayValue(record?.status)}</dd></div>
                <div><dt>Assigned owner</dt><dd>{displayValue(ownerName || record?.assignedTo)}</dd></div>
                <div><dt>Origin</dt><dd>{displayValue(record?.origin)}</dd></div>
                <div><dt>Location</dt><dd>{location || displayValue(record?.addressStreet || record?.addressCity || record?.addressCountry)}</dd></div>
                <div><dt>Website</dt><dd>{displayValue(record?.website)}</dd></div>
                <div><dt>Added</dt><dd>{record?.createdAt ? new Date(record.createdAt).toLocaleDateString() : "Not provided"}</dd></div>
              </dl>
          </section>

          <section className="crm-company-desk__section">
            <h3><Users aria-hidden="true" /> People <span>{contactsQuery.isLoading ? "…" : contacts.length}</span></h3>
            {contactsQuery.isLoading ? (
              <p className="crm-company-desk__state"><RefreshCw className="animate-spin" aria-hidden="true" /> Loading people…</p>
            ) : contactsQuery.isError ? (
              <div className="crm-company-desk__notice" role="alert">
                <p>{contactsQuery.error instanceof Error ? contactsQuery.error.message : "Could not load people for this company."}</p>
                <Button size="sm" variant="outline" onClick={() => contactsQuery.refetch()} data-testid="button-context-contacts-retry">Retry contacts</Button>
              </div>
            ) : contacts.length ? (
              contacts.map((contact) => (
                <article className="crm-company-desk__contact" key={contact.id} data-testid={`context-contact-${contact.id}`}>
                  <div className="crm-company-desk__person">
                    <span className="crm-company-desk__avatar" aria-hidden="true">
                      {(contact.contactName || "?").split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="crm-company-desk__person-name">
                      <strong>{contact.contactName || "Unnamed contact"}</strong>
                      {contact.isPrimary && <Badge variant="secondary">Primary</Badge>}
                    </div>
                  </div>
                  <p className="crm-company-desk__designation">{displayValue(contact.designation || contact.role)}</p>
                  <p className="crm-company-desk__contact-field"><Mail aria-hidden="true" />{contact.email?.trim() ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <span>No email on file</span>}</p>
                  <p className="crm-company-desk__contact-field"><Phone aria-hidden="true" />{contact.phone?.trim() ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : <span>No phone on file</span>}</p>
                  <p className="crm-company-desk__contact-field"><Phone aria-hidden="true" /><span>WhatsApp: {displayValue(contact.whatsapp)}</span></p>
                  {contact.isActive === false && <Badge variant="outline">Inactive</Badge>}
                </article>
              ))
            ) : (
              <div className="crm-company-desk__empty crm-company-desk__empty--compact">No people linked to this company.</div>
            )}
          </section>

          {location && <p className="crm-company-desk__location"><MapPin aria-hidden="true" />{location}</p>}
        </div>
      )}
    </aside>
  );
}
