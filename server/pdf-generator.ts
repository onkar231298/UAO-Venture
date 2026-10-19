import PDFDocument from 'pdfkit';
import converter from 'number-to-words';
import type { QuotationPdfTemplateSettings } from "@shared/schema";
import { DEFAULT_QUOTATION_PDF_TEMPLATE_SETTINGS } from "./quotationPdfTemplate";

interface QuotationData {
  id: number;
  quotationId: string;
  quotationDate: string;
  validUntil: string;
  productName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalAmount: string;
  currency: string;
  terms: string;
  notes?: string;
  paymentTerms: string;
  deliveryTerms: string;
  leadTime?: string;
  generalTermsText?: string | null;
  generalTermsVersion?: string | null;
  
  // Optional fields
  subtotal?: string;
  discountPercent?: string;
  discountAmount?: string;
  includeGst?: boolean;
  gstNumber?: string;
  gstPercentage?: string;
  gstAmount?: string;
  sellerGstin?: string;
  sellerPan?: string;
  buyerGstin?: string;
  buyerPan?: string;
  customerCompanyName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerCountry?: string;
  customerPostalCode?: string;
  placeOfSupply?: string;
  countryOfSupply?: string;
  items?: Array<{
    productName: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    totalPrice: string;
    specifications?: string | null;
  }>;
}

interface CustomerData {
  name: string;
  contactPerson?: string;
  email: string;
  companyName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  salesPersonName?: string;
}

const companyDetails = {
  name: "Atlas Ingredients",
  address2: "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road",
  address3: "Kansarakui, Mehsana, Gujarat 384001",
  phone: "+91-7249847439",
  email: "admin@bright-organic.com",
  website: "www.bright-organic.com"
};

const quotationCompanyName = "Atlas Ingredients Private Limited";
type QuotationPalette = {
  forest: string;
  green: string;
  sage: string;
  pale: string;
  gold: string;
  ink: string;
  muted: string;
  line: string;
};

const defaultQuotationPalette: QuotationPalette = {
  forest: "#173f32",
  green: "#2f6b50",
  sage: "#eaf1eb",
  pale: "#f6f8f5",
  gold: "#c49a55",
  ink: "#23332b",
  muted: "#627269",
  line: "#d7e0d9",
};

function addGeneralTermsPages(
  doc: PDFDocument,
  quotation: QuotationData,
  termsText: string,
  palette: QuotationPalette,
): void {
  const quotationPalette = palette;
  const columnWidth = 245;
  const columnX = [40, 310];
  const contentTop = 92;
  const contentBottom = 780;
  const lineGap = 0.35;
  const blocks = termsText
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const isClauseHeading = (block: string) =>
    /^\d{1,2}\.\s+[A-Z0-9][A-Z0-9 ,&'’()/-]+$/.test(block);

  // Keep each heading with its clause while placing the unchanged template
  // across four columns: two columns on each of the two terms pages.
  const groups: string[][] = [];
  blocks.forEach((block) => {
    if (isClauseHeading(block) || groups.length === 0) {
      groups.push([block]);
    } else {
      groups[groups.length - 1].push(block);
    }
  });

  type PlacedBlock = {
    text: string;
    heading: boolean;
    page: number;
    x: number;
    y: number;
    fontSize: number;
    height: number;
    gapBefore: number;
    gapAfter: number;
  };

  const layoutAtSize = (bodyFontSize: number): PlacedBlock[] | null => {
    const placements: PlacedBlock[] = [];
    let column = 0;
    let y = contentTop;

    for (const group of groups) {
      const measured = group.map((text) => {
        const heading = isClauseHeading(text);
        const fontSize = heading ? bodyFontSize + 0.8 : bodyFontSize;
        const fontName = heading ? "Helvetica-Bold" : "Helvetica";
        const gapBefore = heading ? 3 : 0;
        const gapAfter = heading ? 1.5 : 3;
        const height = doc.font(fontName).fontSize(fontSize)
          .heightOfString(text, { width: columnWidth, lineGap });
        return { text, heading, fontSize, height, gapBefore, gapAfter };
      });
      const groupHeight = measured.reduce(
        (total, block) => total + block.gapBefore + block.height + block.gapAfter,
        0,
      );
      if (groupHeight > contentBottom - contentTop) return null;

      if (y + groupHeight > contentBottom) {
        column += 1;
        y = contentTop;
      }
      if (column >= 4) return null;

      for (const block of measured) {
        y += block.gapBefore;
        placements.push({
          ...block,
          page: Math.floor(column / 2),
          x: columnX[column % 2],
          y,
        });
        y += block.height + block.gapAfter;
      }
    }

    return placements;
  };

  let layout: PlacedBlock[] | null = null;
  for (let fontSize = 7; fontSize >= 5.5; fontSize -= 0.25) {
    layout = layoutAtSize(fontSize);
    if (layout) break;
  }
  if (!layout) {
    throw new Error(
      `General Terms & Conditions version ${quotation.generalTermsVersion || "—"} cannot fit across two readable pages without truncation.`,
    );
  }

  const priorPages = doc.bufferedPageRange();
  const firstTermsPage = priorPages.start + priorPages.count;
  for (let page = 0; page < 2; page += 1) {
    doc.addPage({ size: "A4", margin: { top: 40, bottom: 20, left: 40, right: 40 } });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(quotationPalette.forest)
      .text(`GENERAL TERMS & CONDITIONS OF SALE · ${page + 1}/2`, 40, 34, { width: 375 });
    doc.font("Helvetica").fontSize(7.5).fillColor("#333")
      .text(quotationCompanyName, 40, 56, { width: 280 });
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#333")
      .text(`Quotation: ${quotation.quotationId}`, 390, 38, { width: 160, align: "right" })
      .text(`Version: ${quotation.generalTermsVersion || "—"}  ·  Date: ${new Date(quotation.quotationDate).toLocaleDateString("en-GB")}`, 340, 53, { width: 210, align: "right" });
    doc.moveTo(40, 78).lineTo(555, 78)
      .strokeColor(quotationPalette.gold).lineWidth(1).stroke();
  }

  layout.forEach((block) => {
    doc.switchToPage(firstTermsPage + block.page);
    doc.font(block.heading ? "Helvetica-Bold" : "Helvetica")
      .fontSize(block.fontSize)
      .fillColor(block.heading ? quotationPalette.forest : "#222")
      .text(block.text, block.x, block.y, { width: columnWidth, lineGap });
  });
  doc.switchToPage(firstTermsPage + 1);
}

function addQuotationAcceptancePage(
  doc: PDFDocument,
  quotation: QuotationData,
  customer: CustomerData,
  palette: QuotationPalette,
): void {
  const quotationPalette = palette;
  doc.addPage({ size: "A4", margin: { top: 40, bottom: 20, left: 40, right: 40 } });
  doc.rect(0, 0, 595.28, 118).fill(quotationPalette.forest);
  doc.rect(0, 0, 595.28, 5).fill(quotationPalette.gold);
  doc.font("Helvetica-Bold").fontSize(17).fillColor("#fff")
    .text("ATLAS INGREDIENTS", 40, 35, { width: 280 });
  doc.font("Helvetica").fontSize(8).fillColor("#dce8df")
    .text("PRIVATE LIMITED", 41, 57);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#fff")
    .text("QUOTATION ACCEPTANCE", 360, 37, { width: 195, align: "right" })
    .text(quotation.quotationId, 360, 53, { width: 195, align: "right" });

  doc.font("Times-Bold").fontSize(24).fillColor(quotationPalette.forest)
    .text("Acceptance & Authorised Signatories", 40, 145, { width: 515 });
  doc.font("Helvetica").fontSize(9).fillColor(quotationPalette.muted)
    .text("Complete the relevant signature fields to record acceptance of this quotation.", 40, 181, { width: 515 });

  const customerName = customer.companyName || quotation.customerCompanyName || customer.name || "Customer";
  doc.roundedRect(40, 220, 515, 82, 8).fill(quotationPalette.pale);
  doc.roundedRect(40, 220, 515, 82, 8).strokeColor(quotationPalette.line).lineWidth(1).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(quotationPalette.muted)
    .text("QUOTATION", 56, 237)
    .text("CUSTOMER", 232, 237)
    .text("TOTAL", 430, 237);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(quotationPalette.ink)
    .text(quotation.quotationId, 56, 253, { width: 150 })
    .text(customerName, 232, 253, { width: 180 })
    .text(`${quotation.currency} ${Number(quotation.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 430, 253, { width: 110 });
  doc.font("Helvetica").fontSize(8).fillColor(quotationPalette.muted)
    .text(`Issued ${new Date(quotation.quotationDate).toLocaleDateString("en-GB")}  ·  Valid until ${new Date(quotation.validUntil).toLocaleDateString("en-GB")}`, 56, 277, { width: 490 });

  const termsAcknowledgement = quotation.generalTermsText?.trim()
    ? `I/We also acknowledge the accompanying General Terms & Conditions of Sale, version ${quotation.generalTermsVersion || "—"}.`
    : "I/We accept the commercial terms stated in this quotation.";
  doc.font("Helvetica-Bold").fontSize(10).fillColor(quotationPalette.ink)
    .text("Acceptance", 40, 330);
  doc.font("Helvetica").fontSize(9).fillColor(quotationPalette.ink)
    .text(
      `I/We, the authorised representatives of ${customerName}, confirm acceptance of quotation ${quotation.quotationId} for the products, quantities, prices and commercial terms shown in this document. ${termsAcknowledgement}`,
      40,
      350,
      { width: 515, lineGap: 3 },
    );

  const signatureTop = 430;
  const signatureHeight = 250;
  const signatureWidth = 247;
  const drawSignatureCard = (x: number, title: string, company: string) => {
    doc.roundedRect(x, signatureTop, signatureWidth, signatureHeight, 8).fill("#fff");
    doc.roundedRect(x, signatureTop, signatureWidth, signatureHeight, 8)
      .strokeColor(quotationPalette.line).lineWidth(1).stroke();
    doc.roundedRect(x, signatureTop, signatureWidth, 38, 8).fill(quotationPalette.sage);
    doc.rect(x, signatureTop + 30, signatureWidth, 8).fill(quotationPalette.sage);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(quotationPalette.forest)
      .text(title.toUpperCase(), x + 14, signatureTop + 14, { width: signatureWidth - 28 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(quotationPalette.ink)
      .text(company, x + 14, signatureTop + 53, { width: signatureWidth - 28 });

    doc.moveTo(x + 14, signatureTop + 130).lineTo(x + signatureWidth - 14, signatureTop + 130)
      .strokeColor(quotationPalette.ink).lineWidth(0.8).stroke();
    doc.font("Helvetica").fontSize(7).fillColor(quotationPalette.muted)
      .text("Authorised signature", x + 14, signatureTop + 135);

    doc.moveTo(x + 14, signatureTop + 174).lineTo(x + signatureWidth - 14, signatureTop + 174)
      .strokeColor(quotationPalette.line).lineWidth(0.8).stroke();
    doc.text("Printed name & designation", x + 14, signatureTop + 179);

    doc.moveTo(x + 14, signatureTop + 218).lineTo(x + 115, signatureTop + 218)
      .strokeColor(quotationPalette.line).lineWidth(0.8).stroke();
    doc.text("Date", x + 14, signatureTop + 223);
    doc.moveTo(x + 132, signatureTop + 218).lineTo(x + signatureWidth - 14, signatureTop + 218)
      .strokeColor(quotationPalette.line).lineWidth(0.8).stroke();
    doc.text("Company stamp", x + 132, signatureTop + 223);
  };

  drawSignatureCard(40, "For the Customer · Acceptance", customerName);
  drawSignatureCard(308, "For Atlas Ingredients · Authorised", quotationCompanyName);
}

function createQuotationPDF(
  quotation: QuotationData,
  customer: CustomerData,
  templateSettings: QuotationPdfTemplateSettings,
): PDFDocument {
  const quotationPalette = {
    ...defaultQuotationPalette,
    forest: templateSettings.forestColor,
    green: templateSettings.greenColor,
    gold: templateSettings.goldColor,
  };
  const doc = new PDFDocument({ 
    margin: { top: 40, bottom: 20, left: 40, right: 40 },
    size: 'A4',
    bufferPages: true
  });
  
  const subtotal = quotation.subtotal || quotation.totalAmount;
  const discountAmount = quotation.discountAmount || "0.00";
  const gstAmount = quotation.gstAmount || "0.00";
  const finalAmount = quotation.totalAmount;
  
  // Convert amount to words with safety checks
  let amountInWords = '';
  try {
    const amount = parseFloat(finalAmount);
    console.log(`[PDF] Converting amount to words: ${amount} ${quotation.currency}`);
    
    if (isNaN(amount) || amount < 0) {
      amountInWords = `${quotation.currency} Zero Only`;
    } else {
      const integerPart = Math.floor(amount);
      const decimalPart = Math.round((amount - integerPart) * 100);
      console.log(`[PDF] Integer: ${integerPart}, Decimal: ${decimalPart}`);
      
      // Determine fractional currency unit based on currency code
      const fractionalUnits: Record<string, string> = {
        'INR': 'paise',
        'USD': 'cents',
        'EUR': 'cents',
        'GBP': 'pence',
        'AUD': 'cents',
        'CAD': 'cents',
        'SGD': 'cents',
        'AED': 'fils',
        'SAR': 'halalas',
      };
      const fractionalUnit = fractionalUnits[quotation.currency] || 'cents';
      
      const integerWords = converter.toWords(integerPart);
      console.log(`[PDF] Integer words: ${integerWords}`);
      amountInWords = `${quotation.currency} ${integerWords}`;
      if (decimalPart > 0) {
        const decimalWords = converter.toWords(decimalPart);
        console.log(`[PDF] Decimal words: ${decimalWords}`);
        amountInWords += ` and ${decimalWords} ${fractionalUnit}`;
      }
      amountInWords += ' Only';
      // Capitalize first letter
      amountInWords = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
      console.log(`[PDF] Final amount in words: ${amountInWords}`);
    }
  } catch (error) {
    console.error('Error converting amount to words:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    amountInWords = `${quotation.currency} ${parseFloat(finalAmount || '0').toFixed(2)} Only`;
  }
  
  // Atlas forest green, sage and warm-gold quotation styling.
  const greenColor = quotationPalette.green;

  doc.rect(0, 0, 595.28, 82).fill(quotationPalette.forest);
  doc.rect(0, 0, 595.28, 5).fill(quotationPalette.gold);
  doc.font("Helvetica-Bold").fontSize(17).fillColor("#fff")
    .text("ATLAS INGREDIENTS", 40, 24, { width: 280 });
  doc.font("Helvetica").fontSize(8).fillColor("#dce8df")
    .text("PRIVATE LIMITED", 41, 46);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#fff")
    .text(templateSettings.documentTitle, 372, 19, { width: 178, align: "right" });
  doc.font("Helvetica").fontSize(8).fillColor("#e5eee8")
    .text(`No. ${quotation.quotationId}`, 372, 35, { width: 178, align: "right" })
    .text(`Issued ${new Date(quotation.quotationDate).toLocaleDateString("en-GB")}  ·  Valid until ${new Date(quotation.validUntil).toLocaleDateString("en-GB")}`, 290, 51, { width: 260, align: "right" });

  let yPos = 100;
  doc.font("Times-Bold").fontSize(25).fillColor(quotationPalette.forest)
    .text(templateSettings.sectionHeading, 40, yPos);
  doc.font("Helvetica").fontSize(8).fillColor(quotationPalette.muted)
    .text(customer.salesPersonName ? `Prepared by ${customer.salesPersonName}` : "Prepared for your review", 40, yPos + 31);
  doc.moveTo(40, yPos + 48).lineTo(555, yPos + 48)
    .strokeColor(quotationPalette.gold).lineWidth(1.2).stroke();
  yPos += 63;
  
  // Company Info Box (Left) - compact
  const infoBoxHeight = 120;
   doc.fillColor(quotationPalette.pale).rect(40, yPos, 250, infoBoxHeight).fill();
   doc.strokeColor(quotationPalette.line).lineWidth(0.8).rect(40, yPos, 250, infoBoxHeight).stroke();
  
   doc.fontSize(8).font('Helvetica-Bold').fillColor(greenColor).text('PREPARED BY', 50, yPos + 8);
   doc.moveTo(50, yPos + 23).lineTo(280, yPos + 23).strokeColor(quotationPalette.line).stroke();
  
  doc.fontSize(8).fillColor('black')
      .text(quotationCompanyName, 50, yPos + 32, { width: 230 });
  
  if (quotation.sellerGstin) {
     doc.fontSize(8).fillColor(quotationPalette.muted).text(`GSTIN: ${quotation.sellerGstin}`, 50, yPos + 51, { width: 230 });
   }
   if (quotation.sellerPan) {
     doc.fontSize(8).fillColor(quotationPalette.muted).text(`PAN: ${quotation.sellerPan}`, 50, yPos + 66, { width: 230 });
  }
  
  // Customer Info Box (Right) - compact
   doc.fillColor(quotationPalette.pale).rect(300, yPos, 250, infoBoxHeight).fill();
   doc.strokeColor(quotationPalette.line).lineWidth(0.8).rect(300, yPos, 250, infoBoxHeight).stroke();
  
   doc.fontSize(8).font('Helvetica-Bold').fillColor(greenColor).text('PREPARED FOR', 310, yPos + 8);
   doc.moveTo(310, yPos + 23).lineTo(540, yPos + 23).strokeColor(quotationPalette.line).stroke();
  
   let customerYPos = yPos + 32;
  
  const contactPersonName = customer.contactPerson || customer.name;
  const companyName = customer.companyName || quotation.customerCompanyName || '';
  
  if (contactPersonName && contactPersonName !== companyName) {
    doc.fontSize(8).fillColor('black')
       .text(`Contact: ${contactPersonName}`, 310, customerYPos, { width: 230 });
    customerYPos += 11;
  }
  
  if (companyName) {
    doc.fontSize(8).fillColor('black')
       .text(`Company: ${companyName}`, 310, customerYPos, { width: 230 });
    customerYPos += 11;
  }
  
  if (customer.email) {
    doc.text(`Email: ${customer.email}`, 310, customerYPos, { width: 230 });
    customerYPos += 11;
  }
  
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, 310, customerYPos, { width: 230 });
    customerYPos += 11;
  }
  
  const streetAddress = customer.streetAddress || customer.address || quotation.customerAddress;
  if (streetAddress) {
    doc.text(streetAddress, 310, customerYPos, { width: 230 });
    customerYPos += 11;
  }
  
  const locationParts = [];
  if (customer.city || quotation.customerCity) locationParts.push(customer.city || quotation.customerCity);
  if (customer.state || quotation.customerState) locationParts.push(customer.state || quotation.customerState);
  if (customer.postalCode || quotation.customerPostalCode) locationParts.push(customer.postalCode || quotation.customerPostalCode);
  if (customer.country || quotation.customerCountry) locationParts.push(customer.country || quotation.customerCountry);
  
  if (locationParts.length > 0) {
    doc.text(locationParts.join(', '), 310, customerYPos, { width: 230 });
     customerYPos += 11;
   }

   const buyerTaxDetails = [
     quotation.buyerGstin ? `GSTIN: ${quotation.buyerGstin}` : "",
     quotation.buyerPan ? `PAN: ${quotation.buyerPan}` : "",
     quotation.placeOfSupply ? `Place of supply: ${quotation.placeOfSupply}` : "",
     quotation.countryOfSupply ? `Country of supply: ${quotation.countryOfSupply}` : "",
   ].filter(Boolean);
   if (buyerTaxDetails.length && customerYPos < yPos + infoBoxHeight - 12) {
     doc.fontSize(7).fillColor(quotationPalette.muted)
       .text(buyerTaxDetails.join("  ·  "), 310, customerYPos, { width: 230 });
  }
  
  yPos += infoBoxHeight + 10;

   const commercialHighlights = [
     ["PAYMENT", quotation.paymentTerms || "As agreed"],
     ["DELIVERY", quotation.deliveryTerms || "Ex-Works"],
     ["LEAD TIME", quotation.leadTime || "As available"],
     ["VALID UNTIL", new Date(quotation.validUntil).toLocaleDateString("en-GB")],
   ];
   const highlightGap = 6;
   const highlightWidth = (510 - highlightGap * 3) / 4;
    const highlightTextWidth = highlightWidth - 16;
    doc.font("Helvetica").fontSize(8);
    const highlightValueHeight = commercialHighlights.reduce((maxHeight, [, value]) => (
      Math.max(maxHeight, doc.heightOfString(value, { width: highlightTextWidth }))
    ), 0);
    const highlightHeight = Math.max(46, 22 + highlightValueHeight + 8);
   commercialHighlights.forEach(([label, value], index) => {
     const x = 40 + index * (highlightWidth + highlightGap);
      doc.roundedRect(x, yPos, highlightWidth, highlightHeight, 5).fill(quotationPalette.pale);
      doc.roundedRect(x, yPos, highlightWidth, highlightHeight, 5)
       .strokeColor(quotationPalette.line).lineWidth(0.7).stroke();
     doc.font("Helvetica-Bold").fontSize(7).fillColor(greenColor)
       .text(label, x + 8, yPos + 8, { width: highlightWidth - 16 });
     doc.font("Helvetica").fontSize(8).fillColor(quotationPalette.ink)
        .text(value, x + 8, yPos + 22, { width: highlightTextWidth });
   });
    yPos += highlightHeight + 10;

  // Keep the commercial page readable, and continue item tables onto their
  // own pages when a quotation contains more lines than will comfortably fit.
  const itemsList = quotation.items && quotation.items.length > 0
    ? quotation.items
    : [{
        productName: quotation.productName,
        quantity: quotation.quantity,
        unit: quotation.unit,
        unitPrice: quotation.unitPrice,
        totalPrice: quotation.totalAmount,
      }];

  const termsLines = quotation.terms?.trim()
    ? quotation.terms
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean)
    : [
        `Payment Terms: ${quotation.paymentTerms || 'As per agreement'}`,
        `Delivery Terms: ${quotation.deliveryTerms || 'Ex-Works'}`,
        `Lead Time: ${quotation.leadTime || 'As per availability'}`,
        `Valid until: ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}`,
        'Quality as per specifications',
        'Standard export packaging',
      ];
  const termsRowHeights = termsLines.map((line, index) => {
    const renderedLine = `${index + 1}. ${line}`;
    return Math.max(11, doc.heightOfString(renderedLine, { width: 280, fontSize: 7 }) + 1);
  });
  const termsReferenceHeight = quotation.generalTermsText?.trim() ? 12 : 0;
  const termsBoxHeight = Math.max(90, 22 + termsRowHeights.reduce((total, height) => total + height, 0) + termsReferenceHeight + 6);
  
  // Reserve the dynamic terms height so the full saved text fits above the footer.
  const hasDiscount = parseFloat(discountAmount) > 0;
  const hasGst = quotation.includeGst === true || parseFloat(gstAmount) > 0;
  const totalsBlockH = 22 + (hasDiscount ? 20 : 0) + (hasGst ? 20 : 0) + 24 + 10;
  const termsBlockH = termsBoxHeight + 12;
  const contactBlockH = 25;
  const footerHeight = totalsBlockH + termsBlockH + contactBlockH + 8;
  const tableHeaderH = 24;
  const pageBottom = 790;
  const availableForRows = pageBottom - yPos - tableHeaderH - footerHeight;
  const maxRowHeight = 42;
  const minRowHeight = itemsList.some((item) => Boolean(item.specifications)) ? 30 : 24;

  const drawTableHeader = (top: number) => {
    doc.fillColor(quotationPalette.forest).rect(40, top, 510, tableHeaderH).fill();
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#fff")
      .text("#", 50, top + 7, { width: 20 })
      .text("Item / Description", 75, top + 7, { width: 190 })
      .text("Qty.", 280, top + 7, { width: 70 })
      .text("Rate", 355, top + 7, { width: 80 })
      .text("Amount", 440, top + 7, { width: 100, align: "right" });
  };

  const drawItemRow = (item: typeof itemsList[number], index: number, top: number, rowHeight: number) => {
    doc.fillColor(index % 2 === 0 ? "#fff" : quotationPalette.pale).rect(40, top, 510, rowHeight).fill();
    doc.strokeColor(quotationPalette.line).lineWidth(0.6).rect(40, top, 510, rowHeight).stroke();

    const itemQty = parseFloat(item.quantity || "0") || 0;
    const itemPrice = parseFloat(item.unitPrice || "0") || 0;
    const rawTotal = parseFloat(item.totalPrice || "0");
    const itemTotal = !isNaN(rawTotal) && rawTotal > 0 ? rawTotal : itemQty * itemPrice;
    const fontSize = rowHeight >= 36 ? 9 : rowHeight >= 28 ? 8 : 7;
    const textY = top + (rowHeight >= 32 ? 7 : 5);

    doc.font("Helvetica").fontSize(fontSize).fillColor(quotationPalette.ink)
      .text(`${index + 1}`, 50, textY, { width: 20 })
      .text(item.productName || "Product", 75, textY, { width: 190, height: 12 })
      .text(`${itemQty.toLocaleString()} ${item.unit || "kg"}`, 280, textY, { width: 70 })
      .text(`${quotation.currency} ${itemPrice.toFixed(2)}/${item.unit || "kg"}`, 355, textY, { width: 80 })
      .text(`${quotation.currency} ${itemTotal.toLocaleString()}`, 440, textY, { width: 100, align: "right" });

    if (item.specifications) {
      doc.font("Helvetica").fontSize(6.5).fillColor(quotationPalette.muted)
        .text(item.specifications, 75, top + rowHeight - 10, { width: 190, height: 8 });
    }
    [70, 270, 345, 430].forEach((columnX) => {
      doc.moveTo(columnX, top).lineTo(columnX, top + rowHeight)
        .strokeColor(quotationPalette.line).lineWidth(0.5).stroke();
    });
  };

  const firstPageCapacity = Math.max(1, Math.floor(availableForRows / minRowHeight));
  const hasContinuationItems = itemsList.length > firstPageCapacity;
  const firstPageItems = hasContinuationItems ? itemsList.slice(0, firstPageCapacity) : itemsList;
  const firstPageRowHeight = hasContinuationItems
    ? minRowHeight
    : Math.max(minRowHeight, Math.min(maxRowHeight, Math.floor(availableForRows / itemsList.length)));

  drawTableHeader(yPos);
  yPos += tableHeaderH;
  firstPageItems.forEach((item, index) => {
    drawItemRow(item, index, yPos, firstPageRowHeight);
    yPos += firstPageRowHeight;
  });

  if (hasContinuationItems) {
    let remaining = itemsList.slice(firstPageItems.length);
    const continuationTop = 122;
    const continuationCapacity = Math.max(1, Math.floor((pageBottom - continuationTop - tableHeaderH) / minRowHeight));

    while (remaining.length > 0) {
      doc.addPage({ size: "A4", margin: { top: 40, bottom: 20, left: 40, right: 40 } });
      doc.rect(0, 0, 595.28, 86).fill(quotationPalette.forest);
      doc.rect(0, 0, 595.28, 5).fill(quotationPalette.gold);
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#fff")
        .text("QUOTATION ITEMS · CONTINUED", 40, 31, { width: 340 });
      doc.font("Helvetica").fontSize(8).fillColor("#e5eee8")
        .text(`Quotation ${quotation.quotationId}`, 390, 36, { width: 160, align: "right" });

      const pageItems = remaining.slice(0, continuationCapacity);
      drawTableHeader(continuationTop);
      let continuationY = continuationTop + tableHeaderH;
      pageItems.forEach((item, pageItemIndex) => {
        const itemIndex = itemsList.length - remaining.length + pageItemIndex;
        drawItemRow(item, itemIndex, continuationY, minRowHeight);
        continuationY += minRowHeight;
      });
      remaining = remaining.slice(pageItems.length);
    }

    doc.addPage({ size: "A4", margin: { top: 40, bottom: 20, left: 40, right: 40 } });
    doc.rect(0, 0, 595.28, 86).fill(quotationPalette.forest);
    doc.rect(0, 0, 595.28, 5).fill(quotationPalette.gold);
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#fff")
      .text("QUOTATION SUMMARY", 40, 31, { width: 340 });
    doc.font("Helvetica").fontSize(8).fillColor("#e5eee8")
      .text(`Quotation ${quotation.quotationId}`, 390, 36, { width: 160, align: "right" });
    const summaryCustomer = customer.companyName || quotation.customerCompanyName || customer.name || "Customer";
    doc.roundedRect(40, 108, 515, 62, 8).fill(quotationPalette.pale);
    doc.roundedRect(40, 108, 515, 62, 8)
      .strokeColor(quotationPalette.line).lineWidth(0.8).stroke();
    doc.font("Helvetica-Bold").fontSize(7).fillColor(quotationPalette.muted)
      .text("CUSTOMER", 56, 120)
      .text("LINE ITEMS", 260, 120)
      .text("VALID UNTIL", 400, 120);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(quotationPalette.ink)
      .text(summaryCustomer, 56, 137, { width: 185 })
      .text(String(itemsList.length), 260, 137, { width: 110 })
      .text(new Date(quotation.validUntil).toLocaleDateString("en-GB"), 400, 137, { width: 135 });
    yPos = 190;
  }

  yPos += 8;
  
  // Totals Box (Right side) - proper width
  const totalsX = 350;
  const totalsW = 200;
  doc.fillColor('white').rect(totalsX, yPos, totalsW, 22).fill()
     .strokeColor('#ddd').rect(totalsX, yPos, totalsW, 22).stroke();
  
  doc.fontSize(9).fillColor('black')
     .text('Sub Total', totalsX + 10, yPos + 6)
     .text(`${quotation.currency} ${parseFloat(subtotal).toLocaleString()}`, totalsX + 10, yPos + 6, { width: totalsW - 20, align: 'right' });
  
  let totalsYOffset = 22;
  
  if (parseFloat(discountAmount) > 0) {
    doc.fillColor(greenColor).rect(totalsX, yPos + totalsYOffset, totalsW, 20).fill();
    doc.fontSize(9).fillColor('white')
       .text(`Discount(${quotation.discountPercent}%)`, totalsX + 10, yPos + totalsYOffset + 5)
       .text(`- ${quotation.currency} ${parseFloat(discountAmount).toLocaleString()}`, totalsX + 10, yPos + totalsYOffset + 5, { width: totalsW - 20, align: 'right' });
    totalsYOffset += 20;
  }

  if (hasGst) {
    doc.fillColor(quotationPalette.pale).rect(totalsX, yPos + totalsYOffset, totalsW, 20).fill();
    doc.strokeColor(quotationPalette.line).lineWidth(0.5).rect(totalsX, yPos + totalsYOffset, totalsW, 20).stroke();
    doc.fontSize(8).fillColor(quotationPalette.ink)
       .text(`GST${quotation.gstPercentage ? ` (${quotation.gstPercentage}%)` : ""}`, totalsX + 10, yPos + totalsYOffset + 5)
       .text(`${quotation.currency} ${parseFloat(gstAmount).toLocaleString()}`, totalsX + 10, yPos + totalsYOffset + 5, { width: totalsW - 20, align: 'right' });
    totalsYOffset += 20;
  }
  
  doc.fillColor(greenColor).rect(totalsX, yPos + totalsYOffset, totalsW, 24).fill()
     .strokeColor(greenColor).rect(totalsX, yPos + totalsYOffset, totalsW, 24).stroke();
  doc.fontSize(10).fillColor('white')
     .text('Total', totalsX + 10, yPos + totalsYOffset + 6)
     .text(`${quotation.currency} ${parseFloat(finalAmount).toLocaleString()}`, totalsX + 10, yPos + totalsYOffset + 6, { width: totalsW - 20, align: 'right' });
  
  yPos += totalsYOffset + 34;
  
  // Terms and Conditions - side by side with amount in words
  doc.fillColor(quotationPalette.sage).rect(40, yPos, 300, termsBoxHeight).fill();
  doc.strokeColor(quotationPalette.gold).lineWidth(0.8).rect(40, yPos, 300, termsBoxHeight).stroke();
  
  doc.font('Helvetica-Bold').fontSize(9).fillColor(greenColor)
     .text(quotation.generalTermsText?.trim() ? 'COMMERCIAL TERMS' : 'TERMS & CONDITIONS', 50, yPos + 5);
  doc.moveTo(50, yPos + 17).lineTo(330, yPos + 17).strokeColor(quotationPalette.gold).stroke();
  
  doc.fontSize(7).fillColor('black');
  let termsY = yPos + 22;
  termsLines.forEach((line, index) => {
    const renderedLine = `${index + 1}. ${line}`;
    doc.text(renderedLine, 50, termsY, { width: 280 });
    termsY += termsRowHeights[index];
  });
  if (termsReferenceHeight) {
    doc.fontSize(6.5).fillColor("#54635b")
      .text(`General Terms & Conditions continue on the following pages (Version ${quotation.generalTermsVersion || "—"}).`, 50, termsY + 1, { width: 280 });
  }
  
  // Amount in Words (right side, next to terms)
  doc.fillColor(quotationPalette.pale).rect(350, yPos, 200, termsBoxHeight).fill();
  doc.strokeColor(quotationPalette.line).lineWidth(0.8).rect(350, yPos, 200, termsBoxHeight).stroke();
  doc.moveTo(350, yPos).lineTo(350, yPos + termsBoxHeight)
     .strokeColor(quotationPalette.gold).lineWidth(2).stroke();
  
  doc.font('Helvetica-Bold').fontSize(8).fillColor(greenColor).text('TOTAL AMOUNT IN WORDS', 360, yPos + 5);
  doc.fontSize(7).fillColor('black')
     .text(amountInWords, 360, yPos + 18, { width: 180 });
  
  yPos += termsBoxHeight + 12;

  if (quotation.generalTermsText?.trim()) {
    addGeneralTermsPages(
      doc,
      quotation,
      quotation.generalTermsText,
      quotationPalette,
    );
  }

  addQuotationAcceptancePage(doc, quotation, customer, quotationPalette);

  const pageRange = doc.bufferedPageRange();
  for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex++) {
    doc.switchToPage(pageIndex);
    doc.moveTo(40, 799).lineTo(555, 799)
      .strokeColor(quotationPalette.line).lineWidth(0.7).stroke();
    doc.font("Helvetica").fontSize(7).fillColor(quotationPalette.muted)
      .text(`${quotationCompanyName}  ·  ${quotation.quotationId}`, 40, 807, { width: 380 });
    doc.font("Helvetica").fontSize(7).fillColor(quotationPalette.muted)
      .text(`Page ${pageIndex + 1} of ${pageRange.count}`, 430, 807, { width: 125, align: "right" });
  }
  doc.switchToPage(pageRange.start + pageRange.count - 1);

  return doc;
}

export async function generateQuotationPDF(
  quotation: QuotationData,
  customer: CustomerData,
  templateSettings: QuotationPdfTemplateSettings = DEFAULT_QUOTATION_PDF_TEMPLATE_SETTINGS,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createQuotationPDF(quotation, customer, templateSettings);
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      doc.on('error', (error: Error) => {
        reject(error);
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Sales Order interfaces
interface SalesOrderData {
  id: number;
  soNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: Array<{
    productName: string;
    productSku?: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    totalPrice: string;
    batchNumber?: string;
  }>;
  subtotal: string;
  discountPercent?: string;
  discountAmount?: string;
  taxPercent?: string;
  taxAmount?: string;
  totalAmount: string;
  currency: string;
  priceType?: string;
  paymentTermsAdvancePercent?: string;
  paymentTermsCreditDays?: number;
  advanceAmountDue?: string;
  balanceAmountDue?: string;
  creditPeriod?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  shippingMethod?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  customerCompanyName?: string;
  customerContactName?: string;
  customerEmail?: string;
  customerPhone?: string;
  includeGst?: boolean;
  gstNumber?: string;
  gstPercentage?: string;
  termsAndConditions?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
}

interface SalesOrderCustomerData {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

function createSalesOrderPDF(order: SalesOrderData, customer: SalesOrderCustomerData): PDFDocument {
  const doc = new PDFDocument({ 
    margin: 40,
    size: 'A4',
    bufferPages: true
  });
  
  // Convert amount to words
  let amountInWords = '';
  try {
    const amount = parseFloat(order.totalAmount);
    if (isNaN(amount) || amount < 0) {
      amountInWords = `${order.currency} Zero Only`;
    } else {
      const integerPart = Math.floor(amount);
      const decimalPart = Math.round((amount - integerPart) * 100);
      
      const fractionalUnits: Record<string, string> = {
        'INR': 'paise', 'USD': 'cents', 'EUR': 'cents', 'GBP': 'pence',
        'AUD': 'cents', 'CAD': 'cents', 'SGD': 'cents', 'AED': 'fils', 'SAR': 'halalas',
      };
      const fractionalUnit = fractionalUnits[order.currency] || 'cents';
      
      amountInWords = `${order.currency} ${converter.toWords(integerPart)}`;
      if (decimalPart > 0) {
        amountInWords += ` and ${converter.toWords(decimalPart)} ${fractionalUnit}`;
      }
      amountInWords += ' Only';
      amountInWords = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
    }
  } catch (error) {
    amountInWords = `${order.currency} ${parseFloat(order.totalAmount || '0').toFixed(2)} Only`;
  }
  
  const orangeColor = '#ff8c00';
  const darkGray = '#333';
  let yPos = 40;
  
  // Text wordmark header
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#174b37')
    .text('ATLAS INGREDIENTS', 0, yPos + 18, { align: 'center' });
  
  // Header bar with title - positioned after logo with proper spacing like quotation
  yPos += 100;
  doc.fillColor(orangeColor).rect(40, yPos, 510, 40).fill();
  doc.fontSize(20).fillColor('white').text('SALES ORDER', 50, yPos + 10, { align: 'left' });
  doc.fontSize(9).fillColor('white').text(companyDetails.name, 50, yPos + 28);
  doc.fontSize(13).fillColor('white').text(order.soNumber, 400, yPos + 12, { align: 'right', width: 140 });
  
  yPos += 50;
  
  // Order Info Row
  doc.fontSize(9).fillColor(darkGray);
  doc.text('Order Date:', 50, yPos).text(new Date(order.orderDate).toLocaleDateString('en-GB'), 120, yPos);
  if (order.expectedDeliveryDate) {
    doc.text('Expected Delivery:', 300, yPos).text(new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB'), 410, yPos);
  }
  
  yPos += 20;
  
  // Customer and Shipping Details - increased height for better spacing
  const boxHeight = 130;
  doc.fillColor('#f8f9fa').rect(40, yPos, 250, boxHeight).fill();
  doc.fillColor('#f8f9fa').rect(300, yPos, 250, boxHeight).fill();
  
  doc.strokeColor(orangeColor).lineWidth(3);
  doc.moveTo(40, yPos).lineTo(40, yPos + boxHeight).stroke();
  doc.moveTo(300, yPos).lineTo(300, yPos + boxHeight).stroke();
  
  // BILL TO section with proper customer info
  doc.fontSize(10).fillColor(orangeColor).text('BILL TO', 50, yPos + 8);
  doc.fontSize(8).fillColor(darkGray);
  
  let billYPos = yPos + 24;
  const companyName = order.customerCompanyName || customer.companyName;
  const contactName = order.customerContactName || customer.name;
  
  // Show company name if available
  if (companyName && companyName !== 'Customer') {
    doc.text(companyName.slice(0, 30), 50, billYPos, { width: 230 });
    billYPos += 12;
  }
  // Show email if available
  if (order.customerEmail || customer.email) {
    doc.text((order.customerEmail || customer.email || '').slice(0, 35), 50, billYPos, { width: 230 });
    billYPos += 12;
  }
  // Show billing address - truncate to prevent overflow
  if (order.billingAddress || customer.address) {
    doc.text((order.billingAddress || customer.address)?.slice(0, 35) || '', 50, billYPos, { width: 230 });
    billYPos += 12;
  }
  // City and state combined
  const billCity = order.billingCity || customer.city;
  const billState = order.billingState || customer.state;
  if (billCity || billState) {
    doc.text([billCity, billState].filter(Boolean).join(', ').slice(0, 35), 50, billYPos, { width: 230 });
    billYPos += 12;
  }
  const billPostal = order.billingPostalCode || customer.postalCode;
  const billCountry = order.billingCountry || customer.country;
  if (billPostal || billCountry) {
    doc.text([billPostal, billCountry].filter(Boolean).join(', ').slice(0, 30), 50, billYPos, { width: 230 });
  }
  
  // SHIP TO section - with proper text wrapping to prevent overlap
  doc.fontSize(10).fillColor(orangeColor).text('SHIP TO', 310, yPos + 8);
  doc.fontSize(8).fillColor(darkGray);
  
  let shipYPos = yPos + 24;
  // Show company name
  if (companyName && companyName !== 'Customer') {
    doc.text(companyName.slice(0, 30), 310, shipYPos, { width: 220 });
    shipYPos += 12;
  }
  // Shipping address - truncate to prevent overflow
  if (order.shippingAddress) {
    doc.text(order.shippingAddress.slice(0, 35), 310, shipYPos, { width: 220 });
    shipYPos += 12;
  }
  // City and state combined
  const shipCityState = [order.shippingCity, order.shippingState].filter(Boolean).join(', ');
  if (shipCityState) {
    doc.text(shipCityState.slice(0, 35), 310, shipYPos, { width: 220 });
    shipYPos += 12;
  }
  // Postal and country
  if (order.shippingPostalCode || order.shippingCountry) {
    doc.text([order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(', ').slice(0, 30), 310, shipYPos, { width: 220 });
    shipYPos += 12;
  }
  // Shipping method
  if (order.shippingMethod) {
    doc.text(`Shipping: ${order.shippingMethod.replace(/_/g, ' ').toUpperCase()}`, 310, shipYPos, { width: 220 });
  }
  
  yPos += boxHeight + 10;
  
  // Items Table Header with Batch Number column
  doc.fillColor(orangeColor).rect(40, yPos, 510, 22).fill();
  doc.fontSize(8).fillColor('white');
  doc.text('#', 45, yPos + 6);
  doc.text('Product', 60, yPos + 6);
  doc.text('SKU', 175, yPos + 6);
  doc.text('Batch', 235, yPos + 6);
  doc.text('Qty', 295, yPos + 6);
  doc.text('Unit Price', 350, yPos + 6);
  doc.text('Total', 470, yPos + 6, { align: 'right', width: 70 });
  
  yPos += 22;
  
  // Items
  doc.fillColor(darkGray);
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
      doc.fillColor(bgColor).rect(40, yPos, 510, 20).fill();
      doc.fillColor(darkGray).fontSize(8);
      doc.text((index + 1).toString(), 45, yPos + 5);
      doc.text((item.productName || 'Product').slice(0, 22), 60, yPos + 5);
      doc.text(item.productSku || '-', 175, yPos + 5);
      doc.text(item.batchNumber || '-', 235, yPos + 5);
      doc.text(`${item.quantity || '0'} ${item.unit || 'units'}`, 295, yPos + 5);
      doc.text(`${order.currency} ${parseFloat(item.unitPrice || '0').toLocaleString()}`, 350, yPos + 5);
      doc.text(`${order.currency} ${parseFloat(item.totalPrice || '0').toLocaleString()}`, 470, yPos + 5, { align: 'right', width: 70 });
      yPos += 20;
    });
  } else {
    // No items - show placeholder
    doc.fillColor('#f9f9f9').rect(40, yPos, 510, 25).fill();
    doc.fillColor(darkGray).fontSize(9).text('No items in this order', 50, yPos + 8, { align: 'center', width: 500 });
    yPos += 25;
  }
  
  // Totals Section
  yPos += 10;
  doc.moveTo(350, yPos).lineTo(550, yPos).strokeColor('#ddd').stroke();
  yPos += 5;
  
  doc.fontSize(9).fillColor(darkGray);
  doc.text('Subtotal:', 370, yPos).text(`${order.currency} ${parseFloat(order.subtotal).toLocaleString()}`, 470, yPos, { align: 'right', width: 70 });
  yPos += 15;
  
  if (order.discountAmount && parseFloat(order.discountAmount) > 0) {
    doc.text(`Discount (${order.discountPercent || 0}%):`, 370, yPos).text(`- ${order.currency} ${parseFloat(order.discountAmount).toLocaleString()}`, 470, yPos, { align: 'right', width: 70 });
    yPos += 15;
  }
  
  if (order.taxAmount && parseFloat(order.taxAmount) > 0) {
    doc.text(`Tax (${order.taxPercent || 0}%):`, 370, yPos).text(`${order.currency} ${parseFloat(order.taxAmount).toLocaleString()}`, 470, yPos, { align: 'right', width: 70 });
    yPos += 15;
  }
  
  doc.moveTo(350, yPos).lineTo(550, yPos).strokeColor('#ddd').stroke();
  yPos += 5;
  doc.fontSize(11).fillColor(orangeColor);
  doc.text('TOTAL:', 370, yPos).text(`${order.currency} ${parseFloat(order.totalAmount).toLocaleString()}`, 440, yPos, { align: 'right', width: 100 });
  
  yPos += 30;
  
  // Payment Terms
  doc.fontSize(10).fillColor(orangeColor).text('PAYMENT TERMS', 50, yPos);
  yPos += 15;
  doc.fontSize(9).fillColor(darkGray);
  doc.text(`Advance Payment: ${order.paymentTermsAdvancePercent || 0}%`, 50, yPos);
  if (order.advanceAmountDue) {
    doc.text(`(${order.currency} ${parseFloat(order.advanceAmountDue).toLocaleString()})`, 200, yPos);
  }
  yPos += 12;
  doc.text(`Credit Days: ${order.paymentTermsCreditDays ?? 0} days`, 50, yPos);
  yPos += 12;
  // Credit Period / Payment Terms Detail
  if (order.creditPeriod) {
    doc.text(`Credit Period: ${order.creditPeriod}`, 50, yPos);
    yPos += 12;
  }
  if (order.balanceAmountDue) {
    doc.text(`Balance Due: ${order.currency} ${parseFloat(order.balanceAmountDue).toLocaleString()}`, 50, yPos);
  }
  
  yPos += 25;
  
  // Amount in Words
  doc.fillColor('#f8f9fa').rect(40, yPos, 510, 25).fill();
  doc.strokeColor(orangeColor).lineWidth(3).moveTo(40, yPos).lineTo(40, yPos + 25).stroke();
  doc.fontSize(9).fillColor('black');
  doc.text('Total (in words):', 50, yPos + 4);
  doc.text(amountInWords, 50, yPos + 15, { width: 450 });
  
  yPos += 40;
  
  // Contact & Signature
  doc.moveTo(40, yPos).lineTo(550, yPos).strokeColor('#ddd').stroke();
  doc.fontSize(8).fillColor('#666');
  doc.text(`For enquiries: ${companyDetails.email} | ${companyDetails.phone}`, 40, yPos + 8, { align: 'center', width: 510 });
  
  yPos += 30;
  doc.moveTo(400, yPos).lineTo(540, yPos).strokeColor('black').stroke();
  doc.fontSize(9).fillColor('black');
  doc.text('Computer generated sales order', 400, yPos + 8);
  doc.text('No signature required', 400, yPos + 20);
  
  return doc;
}

export async function generateSalesOrderPDF(order: SalesOrderData, customer: SalesOrderCustomerData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createSalesOrderPDF(order, customer);
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      doc.on('error', (error: Error) => {
        reject(error);
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}