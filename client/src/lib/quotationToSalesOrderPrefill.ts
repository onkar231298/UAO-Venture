export type SalesOrderDraftParty = { name: string; address: string; contactName: string; email: string; phone: string };
export type SalesOrderDraftItem = {
  productName: string;
  hsnCode: string;
  totalBags: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  batchNumber: string;
};

export type ManualSalesOrderDraft = {
  contractNumber: string;
  contractDate: string;
  proformaNumber: string;
  proformaDate: string;
  seller: { name: string; address: string; phone: string; email: string; website: string; gstNumber: string; iecNumber: string };
  buyer: SalesOrderDraftParty;
  consignee: SalesOrderDraftParty;
  notifyParty: SalesOrderDraftParty;
  currency: string;
  items: SalesOrderDraftItem[];
  packingDetails: string;
  paymentTerms: string;
  lcType: string;
  leadTime: string;
  priceTerms: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  destinationCountry: string;
  bank: { name: string; branch: string; accountName: string; accountNumber: string; ifsc: string; swift: string; address: string };
  authorisedSignatory: string;
  signatoryDesignation: string;
  additionalTerms: string;
  internalNotes: string;
  expectedDeliveryDate: string;
  advancePercent: string;
  creditDays: string;
  discountPercent: string;
  taxPercent: string;
};

export interface SalesOrderQuotationSource {
  quotationId?: string | null;
  currency?: string | null;
  priceType?: string | null;
  createdAt?: string | Date | null;
  customerCompanyName?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerCountry?: string | null;
  customerPostalCode?: string | null;
  sellerGstin?: string | null;
  paymentTerms?: string | null;
  leadTime?: string | null;
  terms?: string | null;
  notes?: string | null;
  discountPercent?: string | number | null;
  includeGst?: boolean | null;
  gstPercentage?: string | number | null;
  placeOfSupply?: string | null;
  countryOfSupply?: string | null;
  items?: Array<{
    productName?: string | null;
    productHsCode?: string | null;
    quantity?: string | number | null;
    unit?: string | null;
    unitPrice?: string | number | null;
    totalPrice?: string | number | null;
    specifications?: string | null;
  }>;
  inquiry?: {
    contactName?: string | null;
    companyName?: string | null;
    phoneNumber?: string | null;
    emailAddress?: string | null;
    productName?: string | null;
    productDescription?: string | null;
    quantity?: string | number | null;
    unit?: string | null;
    expectedDelivery?: string | Date | null;
    packagingPreference?: string | null;
    notes?: string | null;
  } | null;
  lead?: {
    productName?: string | null;
    productDescription?: string | null;
    requiredQuantity?: string | number | null;
    unit?: string | null;
  } | null;
  companyProfile?: {
    companyName?: string | null;
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
  } | null;
  primaryContact?: { contactName?: string | null; email?: string | null; phone?: string | null } | null;
  customerProfile?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    companyName?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
}

const text = (value: unknown) => value == null ? "" : String(value).trim();
const email = (value: unknown) => {
  const candidate = text(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : "";
};
const address = (...parts: unknown[]) => parts.map(text).filter(Boolean).join(", ");
const date = (value: string | Date | null | undefined) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

export function createEmptySalesOrderDraft(): ManualSalesOrderDraft {
  const blankParty = (): SalesOrderDraftParty => ({ name: "", address: "", contactName: "", email: "", phone: "" });
  return {
    contractNumber: "",
    contractDate: "",
    proformaNumber: "",
    proformaDate: "",
    seller: { name: "Atlas Ingredients", address: "", phone: "", email: "", website: "", gstNumber: "", iecNumber: "" },
    buyer: blankParty(),
    consignee: blankParty(),
    notifyParty: blankParty(),
    currency: "USD",
    items: [{ productName: "", hsnCode: "", totalBags: "", quantity: "", unit: "", unitPrice: "", batchNumber: "" }],
    packingDetails: "",
    paymentTerms: "",
    lcType: "",
    leadTime: "",
    priceTerms: "",
    portOfLoading: "",
    portOfDischarge: "",
    finalDestination: "",
    destinationCountry: "",
    bank: { name: "", branch: "", accountName: "", accountNumber: "", ifsc: "", swift: "", address: "" },
    authorisedSignatory: "",
    signatoryDesignation: "",
    additionalTerms: "",
    internalNotes: "",
    expectedDeliveryDate: "",
    advancePercent: "",
    creditDays: "",
    discountPercent: "",
    taxPercent: "",
  };
}

export function prefillManualSalesOrder(
  quotation: SalesOrderQuotationSource,
  blank: ManualSalesOrderDraft,
): ManualSalesOrderDraft {
  const company = quotation.companyProfile;
  const contact = quotation.primaryContact;
  const customer = quotation.customerProfile;
  const inquiry = quotation.inquiry;
  const lead = quotation.lead;

  const buyerAddress = address(
    quotation.customerAddress,
    quotation.customerCity,
    quotation.customerState,
    quotation.customerPostalCode,
    quotation.customerCountry,
  ) || address(customer?.streetAddress || customer?.address, customer?.city, customer?.state, customer?.postalCode, customer?.country)
    || address(company?.addressStreet, company?.addressCity, company?.addressState, company?.addressZip, company?.addressCountry);
  const consigneeAddress = address(
    company?.factoryAddressStreet,
    company?.factoryAddressCity,
    company?.factoryAddressState,
    company?.factoryAddressZip,
    company?.factoryAddressCountry,
  ) || buyerAddress;
  const contactName = inquiry?.contactName || contact?.contactName || [customer?.firstName, customer?.lastName].map(text).filter(Boolean).join(" ");
  const buyer: SalesOrderDraftParty = {
    name: quotation.customerCompanyName || inquiry?.companyName || company?.companyName || customer?.companyName || contactName,
    address: buyerAddress,
    contactName,
    email: email(inquiry?.emailAddress) || email(contact?.email) || email(customer?.email) || email(company?.primaryEmail),
    phone: text(inquiry?.phoneNumber || contact?.phone || customer?.phoneNumber || company?.primaryPhone),
  };
  const consignee: SalesOrderDraftParty = {
    ...buyer,
    address: consigneeAddress,
  };
  const sourceItems = quotation.items || [];
  const items: SalesOrderDraftItem[] = sourceItems.length
    ? sourceItems.map(item => {
        const quantity = text(item.quantity);
        const enteredUnitPrice = text(item.unitPrice);
        const derivedUnitPrice = !enteredUnitPrice && Number(quantity) > 0 && item.totalPrice != null
          ? (Number(item.totalPrice) / Number(quantity)).toFixed(2)
          : "";
        return {
          productName: [text(item.productName), text(item.specifications)].filter(Boolean).join(" — "),
          hsnCode: text(item.productHsCode),
          totalBags: "",
          quantity,
          unit: text(item.unit),
          unitPrice: enteredUnitPrice || derivedUnitPrice,
          batchNumber: "",
        };
      })
    : [{
        ...blank.items[0],
        productName: [text(inquiry?.productName || lead?.productName), text(inquiry?.productDescription || lead?.productDescription)]
          .filter(Boolean).join(" — "),
        quantity: text(inquiry?.quantity ?? lead?.requiredQuantity),
        unit: text(inquiry?.unit || lead?.unit),
      }];

  return {
    ...blank,
    contractNumber: text(quotation.quotationId),
    contractDate: date(quotation.createdAt),
    proformaNumber: text(quotation.quotationId),
    proformaDate: date(quotation.createdAt),
    seller: { ...blank.seller, gstNumber: text(quotation.sellerGstin) || blank.seller.gstNumber },
    buyer,
    consignee,
    notifyParty: { ...buyer },
    currency: text(quotation.currency) || blank.currency,
    items: items.length ? items : blank.items,
    packingDetails: text(inquiry?.packagingPreference),
    paymentTerms: text(quotation.paymentTerms),
    leadTime: text(quotation.leadTime),
    priceTerms: text(quotation.priceType),
    finalDestination: text(quotation.placeOfSupply || quotation.customerCity || customer?.city || company?.addressCity),
    destinationCountry: text(quotation.countryOfSupply || quotation.customerCountry || customer?.country || company?.addressCountry),
    additionalTerms: text(quotation.terms),
    internalNotes: [text(quotation.notes), text(inquiry?.notes)].filter(Boolean).join("\n"),
    expectedDeliveryDate: date(inquiry?.expectedDelivery),
    discountPercent: text(quotation.discountPercent) || blank.discountPercent,
    taxPercent: quotation.includeGst ? text(quotation.gstPercentage) || "0" : "0",
  };
}
