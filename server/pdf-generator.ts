import PDFDocument from 'pdfkit';
import converter from 'number-to-words';

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
}

interface CustomerData {
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

const companyDetails = {
  name: "Bright Fame Organic Pvt. Ltd.",
  address: "C/O Bright Fame International",
  address2: "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road",
  address3: "Kansarakui, Mehsana, Gujarat 384001",
  phone: "+91-7249847439",
  email: "admin@bright-organic.com",
  website: "www.bfiorganic.com"
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
  
  // Header with centered logo (smaller and more compact)
  let yPos = 15;
  
  try {
    // Add company logo (centered at top, proper aspect ratio)
    const logoWidth = 140;
    const pageWidth = 595; // A4 page width in points
    const logoX = (pageWidth - logoWidth) / 2;
    doc.image('server/bfi-logo.png', logoX, yPos, { width: logoWidth, fit: [logoWidth, 70] });
  } catch (error) {
    console.log('Logo not found, skipping logo insertion');
  }
  
  yPos += 105; // Increased spacing to ensure no overlap with logo
  
  // Quotation Title
  doc.fontSize(28).fillColor(orangeColor).text('QUOTATION', 40, yPos, { align: 'center' });
  doc.moveTo(40, yPos + 40).lineTo(550, yPos + 40).strokeColor(orangeColor).lineWidth(3).stroke();
  
  yPos += 60;
  
  // Quote Info
  doc.fontSize(10).fillColor('black')
     .text(`Quotation#: ${quotation.quotationId}`, 400, yPos)
     .text(`Quotation Date: ${new Date(quotation.quotationDate).toLocaleDateString('en-GB')}`, 400, yPos + 15)
     .text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}`, 400, yPos + 30);
  
  yPos += 65;
  
  // Company Info Box (Left) - compact with proper spacing
  doc.fillColor('#f8f9fa').rect(40, yPos, 250, 145).fill()
     .strokeColor('#e9ecef').rect(40, yPos, 250, 145).stroke();
  
  doc.fontSize(12).fillColor(orangeColor).text('Quotation by', 50, yPos + 10);
  doc.moveTo(50, yPos + 25).lineTo(280, yPos + 25).strokeColor(orangeColor).stroke();
  
  doc.fontSize(9).fillColor('black')
     .text(companyDetails.name, 50, yPos + 32, { width: 230 })
     .text(companyDetails.address, 50, yPos + 45, { width: 230 })
     .text(companyDetails.address2, 50, yPos + 57, { width: 230, lineGap: 2 })
     .text(companyDetails.address3, 50, yPos + 69, { width: 230, lineGap: 2 })
     .text(`Phone: ${companyDetails.phone}`, 50, yPos + 85, { width: 230 })
     .text(`Email: ${companyDetails.email}`, 50, yPos + 98, { width: 230 })
     .text(`Website: ${companyDetails.website}`, 50, yPos + 111, { width: 230 });
  
  if (quotation.sellerGstin) {
    doc.fontSize(8).text(`GSTIN: ${quotation.sellerGstin}`, 50, yPos + 127, { width: 230 });
  }
  
  // Customer Info Box (Right) - compact to match left box
  doc.fillColor('#f8f9fa').rect(300, yPos, 250, 145).fill()
     .strokeColor('#e9ecef').rect(300, yPos, 250, 145).stroke();
  
  doc.fontSize(12).fillColor(orangeColor).text('Quotation to', 310, yPos + 10);
  doc.moveTo(310, yPos + 25).lineTo(540, yPos + 25).strokeColor(orangeColor).stroke();
  
  let customerYPos = yPos + 32;
  doc.fontSize(9).fillColor('black')
     .text(`Contact Person: ${customer.name}`, 310, customerYPos, { width: 230 });
  
  customerYPos += 13;
  if (customer.companyName || quotation.customerCompanyName) {
    const companyName = customer.companyName || quotation.customerCompanyName;
    doc.text(`Company: ${companyName}`, 310, customerYPos, { width: 230 });
    customerYPos += 13;
  }
  
  if (customer.email) {
    doc.text(`Email: ${customer.email}`, 310, customerYPos, { width: 230 });
    customerYPos += 13;
  }
  
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, 310, customerYPos, { width: 230 });
    customerYPos += 13;
  }
  
  // Customer address (condensed) - prioritize new streetAddress field
  const streetAddress = customer.streetAddress || customer.address || quotation.customerAddress;
  if (streetAddress) {
    doc.text(streetAddress, 310, customerYPos, { width: 230, lineGap: 1 });
    customerYPos += 13;
  }
  
  // City, State, Postal Code, Country (condensed on one line)
  const locationParts = [];
  if (customer.city || quotation.customerCity) locationParts.push(customer.city || quotation.customerCity);
  if (customer.state || quotation.customerState) locationParts.push(customer.state || quotation.customerState);
  if (customer.postalCode || quotation.customerPostalCode) locationParts.push(customer.postalCode || quotation.customerPostalCode);
  if (customer.country || quotation.customerCountry) locationParts.push(customer.country || quotation.customerCountry);
  
  if (locationParts.length > 0) {
    doc.text(locationParts.join(', '), 310, customerYPos, { width: 230 });
  }
  
  yPos += 160; // Compact spacing
  
  // Items Table Header (wider Amount column)
  doc.fillColor(orangeColor).rect(40, yPos, 510, 25).fill();
  doc.fontSize(10).fillColor('white')
     .text('#', 50, yPos + 8, { width: 20 })
     .text('Item/Item Description', 75, yPos + 8, { width: 220 })
     .text('Qty.', 300, yPos + 8, { width: 70 })
     .text('Rate', 375, yPos + 8, { width: 70 })
     .text('Amount', 450, yPos + 8, { width: 90 });
  
  yPos += 25;
  
  // Items Table Row (wider Amount column)
  doc.fillColor('white').rect(40, yPos, 510, 30).fill()
     .strokeColor('#ddd').rect(40, yPos, 510, 30).stroke();
  
  doc.fontSize(9).fillColor('black')
     .text('1', 50, yPos + 10, { width: 20 })
     .text(quotation.productName, 75, yPos + 10, { width: 220 })
     .text(`${parseFloat(quotation.quantity).toLocaleString()} ${quotation.unit}`, 300, yPos + 10, { width: 70 })
     .text(`${quotation.currency} ${parseFloat(quotation.unitPrice).toFixed(2)}`, 375, yPos + 10, { width: 70 })
     .text(`${quotation.currency}\n${parseFloat(quotation.totalAmount).toLocaleString()}`, 450, yPos + 10, { width: 90 });
  
  yPos += 45;
  
  // Totals Box (Right side)
  const totalsX = 350;
  doc.fillColor('white').rect(totalsX, yPos, 200, 80).fill()
     .strokeColor('#ddd').rect(totalsX, yPos, 200, 80).stroke();
  
  doc.fontSize(10).fillColor('black')
     .text('Sub Total', totalsX + 10, yPos + 10)
     .text(`${quotation.currency} ${parseFloat(subtotal).toLocaleString()}`, totalsX + 120, yPos + 10);
  
  if (parseFloat(discountAmount) > 0) {
    doc.fillColor(greenColor).rect(totalsX, yPos + 25, 200, 20).fill();
    doc.fillColor('white')
       .text(`Discount(${quotation.discountPercent}%)`, totalsX + 10, yPos + 30)
       .text(`- ${quotation.currency} ${parseFloat(discountAmount).toLocaleString()}`, totalsX + 120, yPos + 30);
    yPos += 20;
  }
  
  doc.fillColor(greenColor).rect(totalsX, yPos + 45, 200, 25).fill();
  doc.fontSize(12).fillColor('white')
     .text('Total', totalsX + 10, yPos + 52)
     .text(`${quotation.currency} ${parseFloat(finalAmount).toLocaleString()}`, totalsX + 120, yPos + 52);
  
  yPos += 80;
  
  // Terms and Conditions (compact)
  doc.fillColor('#fff7e6').rect(40, yPos, 280, 95).fill()
     .strokeColor('#ffa500').rect(40, yPos, 280, 95).stroke();
  
  doc.fontSize(11).fillColor(orangeColor).text('Terms and Conditions', 50, yPos + 8);
  doc.moveTo(50, yPos + 22).lineTo(310, yPos + 22).strokeColor(orangeColor).stroke();
  
  doc.fontSize(8).fillColor('black')
     .text(`1. Payment: ${quotation.paymentTerms}`, 50, yPos + 28, { width: 260, lineGap: 1 })
     .text(`2. Delivery: ${quotation.deliveryTerms}`, 50, yPos + 40, { width: 260, lineGap: 1 })
     .text(`3. Valid until: ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}`, 50, yPos + 52, { width: 260, lineGap: 1 })
     .text('4. Quality as per specifications', 50, yPos + 64, { width: 260, lineGap: 1 })
     .text('5. Standard export packaging', 50, yPos + 76, { width: 260, lineGap: 1 });
  
  yPos += 110;
  
  // Amount in Words (compact)
  doc.fillColor('#f8f9fa').rect(40, yPos, 510, 25).fill()
     .strokeColor(orangeColor).lineWidth(3).moveTo(40, yPos).lineTo(40, yPos + 25).stroke();
  
  doc.fontSize(9).fillColor('black')
     .text('Total (in words):', 50, yPos + 4)
     .text(amountInWords, 50, yPos + 15, { width: 450 });
  
  yPos += 40;
  
  // Contact Information (compact)
  doc.moveTo(40, yPos).lineTo(550, yPos).strokeColor('#ddd').stroke();
  doc.fontSize(8).fillColor('#666')
     .text(`For enquiries: ${companyDetails.email} | ${companyDetails.phone}`, 40, yPos + 8, { align: 'center', width: 510 });
  
  yPos += 30;
  
  // Signature Section (compact)
  doc.moveTo(400, yPos).lineTo(540, yPos).strokeColor('black').stroke();
  doc.fontSize(9).fillColor('black')
     .text('Computer generated quotation', 400, yPos + 8)
     .text('No signature required', 400, yPos + 20);
  
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