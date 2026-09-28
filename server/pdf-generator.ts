import PDFDocument from 'pdfkit';
import converter from 'number-to-words';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved logo path for reliable loading in all environments
const logoPath = path.resolve(__dirname, 'bfi-logo.png');

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
  name: "Cape NatureX Organic Pvt. Ltd.",
  address2: "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road",
  address3: "Kansarakui, Mehsana, Gujarat 384001",
  phone: "+91-7249847439",
  email: "admin@bright-organic.com",
  website: "www.bright-organic.com"
};

function createQuotationPDF(quotation: QuotationData, customer: CustomerData): PDFDocument {
  const doc = new PDFDocument({ 
    margin: 40,
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
  
  // Colors
  const orangeColor = '#ff8c00';
  const greenColor = '#28a745';
  
  // Header with centered logo (compact)
  let yPos = 10;
  
  try {
    const logoWidth = 120;
    const pageWidth = 595;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.image(logoPath, logoX, yPos, { width: logoWidth, fit: [logoWidth, 55] });
  } catch (error) {
    console.log('Logo not found at', logoPath, ', skipping logo insertion');
  }
  
  yPos += 65;
  
  // Quotation Title
  doc.fontSize(22).fillColor(orangeColor).text('QUOTATION', 40, yPos, { align: 'center' });
  doc.moveTo(40, yPos + 28).lineTo(550, yPos + 28).strokeColor(orangeColor).lineWidth(2).stroke();
  
  yPos += 38;
  
  // Quote Info
  doc.fontSize(8).fillColor('black')
     .text(`Quotation#: ${quotation.quotationId}`, 400, yPos)
     .text(`Date: ${new Date(quotation.quotationDate).toLocaleDateString('en-GB')}`, 400, yPos + 12)
     .text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}`, 400, yPos + 24);
  
  if (customer.salesPersonName) {
    doc.text(`Sales Executive: ${customer.salesPersonName}`, 400, yPos + 36);
    yPos += 52;
  } else {
    yPos += 42;
  }
  
  // Company Info Box (Left) - compact
  const infoBoxHeight = 120;
  doc.fillColor('#f8f9fa').rect(40, yPos, 250, infoBoxHeight).fill()
     .strokeColor('#e9ecef').rect(40, yPos, 250, infoBoxHeight).stroke();
  
  doc.fontSize(10).fillColor(orangeColor).text('Quotation by', 50, yPos + 6);
  doc.moveTo(50, yPos + 19).lineTo(280, yPos + 19).strokeColor(orangeColor).stroke();
  
  doc.fontSize(8).fillColor('black')
     .text(companyDetails.address, 50, yPos + 24, { width: 230 })
     .text(companyDetails.address2, 50, yPos + 35, { width: 230 })
     .text(companyDetails.address3, 50, yPos + 46, { width: 230 })
     .text(`Phone: ${companyDetails.phone}`, 50, yPos + 62, { width: 230 })
     .text(`Email: ${companyDetails.email}`, 50, yPos + 73, { width: 230 })
     .text(`Website: ${companyDetails.website}`, 50, yPos + 84, { width: 230 });
  
  if (quotation.sellerGstin) {
    doc.fontSize(7).text(`GSTIN: ${quotation.sellerGstin}`, 50, yPos + 98, { width: 230 });
  }
  
  // Customer Info Box (Right) - compact
  doc.fillColor('#f8f9fa').rect(300, yPos, 250, infoBoxHeight).fill()
     .strokeColor('#e9ecef').rect(300, yPos, 250, infoBoxHeight).stroke();
  
  doc.fontSize(10).fillColor(orangeColor).text('Quotation to', 310, yPos + 6);
  doc.moveTo(310, yPos + 19).lineTo(540, yPos + 19).strokeColor(orangeColor).stroke();
  
  let customerYPos = yPos + 24;
  
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
  }
  
  yPos += infoBoxHeight + 10;
  
  // Items Table - dynamically size rows to fit single page
  const itemsList = quotation.items && quotation.items.length > 0
    ? quotation.items
    : [{
        productName: quotation.productName,
        quantity: quotation.quantity,
        unit: quotation.unit,
        unitPrice: quotation.unitPrice,
        totalPrice: quotation.totalAmount,
      }];
  
  // Precise footer height: totals(54) + spacing(8) + terms/words box(90) + spacing(12) + contact/sig(25) + bottom margin(10)
  const hasDiscount = parseFloat(discountAmount) > 0;
  const totalsBlockH = 22 + (hasDiscount ? 20 : 0) + 24 + 10;
  const termsBlockH = 90 + 12;
  const contactBlockH = 25;
  const footerHeight = totalsBlockH + termsBlockH + contactBlockH + 8;
  const tableHeaderH = 18;
  const pageBottom = 790;
  const availableForRows = pageBottom - yPos - tableHeaderH - footerHeight;
  const maxRowHeight = 22;
  const minRowHeight = 12;
  const rowHeight = Math.max(minRowHeight, Math.min(maxRowHeight, Math.floor(availableForRows / itemsList.length)));
  const itemFontSize = rowHeight >= 18 ? 8 : rowHeight >= 14 ? 7 : 6;
  const rowTextY = rowHeight >= 18 ? 6 : rowHeight >= 14 ? 4 : 3;

  doc.fillColor(orangeColor).rect(40, yPos, 510, tableHeaderH).fill();
  doc.fontSize(itemFontSize).fillColor('white')
     .text('#', 50, yPos + rowTextY, { width: 20 })
     .text('Item / Description', 75, yPos + rowTextY, { width: 200 })
     .text('Qty.', 280, yPos + rowTextY, { width: 70 })
     .text('Rate', 355, yPos + rowTextY, { width: 80 })
     .text('Amount', 440, yPos + rowTextY, { width: 100, align: 'right' });
  
  yPos += tableHeaderH;
  
  itemsList.forEach((item, index) => {
    doc.fillColor('white').rect(40, yPos, 510, rowHeight).fill()
       .strokeColor('#ddd').rect(40, yPos, 510, rowHeight).stroke();
    
    const itemQty = parseFloat(item.quantity || '0') || 0;
    const itemPrice = parseFloat(item.unitPrice || '0') || 0;
    const rawTotal = parseFloat(item.totalPrice || '0');
    const itemTotal = (!isNaN(rawTotal) && rawTotal > 0) ? rawTotal : (itemQty * itemPrice);
    
    doc.fontSize(itemFontSize).fillColor('black')
       .text(`${index + 1}`, 50, yPos + rowTextY, { width: 20 })
       .text(item.productName || 'Product', 75, yPos + rowTextY, { width: 200 })
       .text(`${itemQty.toLocaleString()} ${item.unit || 'kg'}`, 280, yPos + rowTextY, { width: 70 })
       .text(`${quotation.currency} ${itemPrice.toFixed(2)}/${item.unit || 'kg'}`, 355, yPos + rowTextY, { width: 80 })
       .text(`${quotation.currency} ${itemTotal.toLocaleString()}`, 440, yPos + rowTextY, { width: 100, align: 'right' });
    
    yPos += rowHeight;
  });
  
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
  
  doc.fillColor(greenColor).rect(totalsX, yPos + totalsYOffset, totalsW, 24).fill()
     .strokeColor(greenColor).rect(totalsX, yPos + totalsYOffset, totalsW, 24).stroke();
  doc.fontSize(10).fillColor('white')
     .text('Total', totalsX + 10, yPos + totalsYOffset + 6)
     .text(`${quotation.currency} ${parseFloat(finalAmount).toLocaleString()}`, totalsX + 10, yPos + totalsYOffset + 6, { width: totalsW - 20, align: 'right' });
  
  yPos += totalsYOffset + 34;
  
  // Terms and Conditions - side by side with amount in words
  const termsBoxHeight = 90;
  doc.fillColor('#fff7e6').rect(40, yPos, 300, termsBoxHeight).fill()
     .strokeColor('#ffa500').rect(40, yPos, 300, termsBoxHeight).stroke();
  
  doc.fontSize(9).fillColor(orangeColor).text('Terms and Conditions', 50, yPos + 5);
  doc.moveTo(50, yPos + 16).lineTo(330, yPos + 16).strokeColor(orangeColor).stroke();
  
  doc.fontSize(7).fillColor('black')
     .text(`1. Payment Terms: ${quotation.paymentTerms}`, 50, yPos + 22, { width: 280 })
     .text(`2. Delivery Terms: ${quotation.deliveryTerms}`, 50, yPos + 33, { width: 280 })
     .text(`3. Lead Time: ${quotation.leadTime || 'As per availability'}`, 50, yPos + 44, { width: 280 })
     .text(`4. Valid until: ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}`, 50, yPos + 55, { width: 280 })
     .text('5. Quality as per specifications', 50, yPos + 66, { width: 280 })
     .text('6. Standard export packaging', 50, yPos + 77, { width: 280 });
  
  // Amount in Words (right side, next to terms)
  doc.fillColor('#f8f9fa').rect(350, yPos, 200, termsBoxHeight).fill()
     .strokeColor(orangeColor).lineWidth(2).moveTo(350, yPos).lineTo(350, yPos + termsBoxHeight).stroke()
     .strokeColor('#e9ecef').lineWidth(1).rect(350, yPos, 200, termsBoxHeight).stroke();
  
  doc.fontSize(8).fillColor(orangeColor).text('Total (in words):', 360, yPos + 5);
  doc.fontSize(7).fillColor('black')
     .text(amountInWords, 360, yPos + 18, { width: 180 });
  
  yPos += termsBoxHeight + 12;
  
  // Contact + Signature (compact single row)
  doc.moveTo(40, yPos).lineTo(550, yPos).strokeColor('#ddd').lineWidth(1).stroke();
  doc.fontSize(7).fillColor('#666')
     .text(`For enquiries: ${companyDetails.email} | ${companyDetails.phone}`, 40, yPos + 5, { width: 300 });
  
  doc.moveTo(420, yPos).lineTo(540, yPos).strokeColor('black').stroke();
  doc.fontSize(7).fillColor('black')
     .text('Computer generated quotation', 420, yPos + 5)
     .text('No signature required', 420, yPos + 14);
  
  return doc;
}

export async function generateQuotationPDF(quotation: QuotationData, customer: CustomerData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createQuotationPDF(quotation, customer);
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
  
  // Header with company logo - matching quotation PDF size and style
  try {
    if (fs.existsSync(logoPath)) {
      const logoWidth = 140;
      const pageWidth = 595; // A4 page width in points
      const logoX = (pageWidth - logoWidth) / 2;
      console.log('[SO PDF] Adding logo from:', logoPath);
      doc.image(logoPath, logoX, yPos, { width: logoWidth, fit: [logoWidth, 70] });
    } else {
      console.log('[SO PDF] Logo file not found at:', logoPath);
    }
  } catch (error) {
    console.error('[SO PDF] Error loading logo:', error);
  }
  
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