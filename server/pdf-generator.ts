import PDFDocument from 'pdfkit';

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
  const doc = new PDFDocument({ margin: 40 });
  
  const subtotal = quotation.subtotal || quotation.totalAmount;
  const discountAmount = quotation.discountAmount || "0.00";
  const gstAmount = quotation.gstAmount || "0.00";
  const finalAmount = quotation.totalAmount;
  const amount = parseFloat(finalAmount);
  const amountInWords = `${quotation.currency} ${amount.toLocaleString()} Only`;
  
  // Colors
  const orangeColor = '#ff8c00';
  const greenColor = '#28a745';
  
  // Helper function for drawing boxes
  const drawBox = (x: number, y: number, width: number, height: number, fillColor?: string) => {
    if (fillColor) {
      doc.rect(x, y, width, height).fillColor(fillColor).fill();
    } else {
      doc.rect(x, y, width, height).stroke();
    }
  };
  
  // Header with centered logo
  let yPos = 20;
  
  try {
    // Add company logo (centered at top)
    const logoWidth = 150;
    const logoHeight = 75;
    const pageWidth = 595; // A4 page width in points
    const logoX = (pageWidth - logoWidth) / 2;
    doc.image('server/bfi-logo.png', logoX, yPos, { width: logoWidth, height: logoHeight });
  } catch (error) {
    console.log('Logo not found, skipping logo insertion');
  }
  
  yPos += 90;
  
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
  
  // Company Info Box (Left) - increased height for complete address
  doc.fillColor('#f8f9fa').rect(40, yPos, 250, 170).fill()
     .strokeColor('#e9ecef').rect(40, yPos, 250, 170).stroke();
  
  doc.fontSize(12).fillColor(orangeColor).text('Quotation by', 50, yPos + 10);
  doc.moveTo(50, yPos + 25).lineTo(280, yPos + 25).strokeColor(orangeColor).stroke();
  
  doc.fontSize(10).fillColor('black')
     .text(companyDetails.name, 50, yPos + 35, { width: 230 })
     .text(companyDetails.address, 50, yPos + 50, { width: 230 })
     .text(companyDetails.address2, 50, yPos + 65, { width: 230 })
     .text(companyDetails.address3, 50, yPos + 80, { width: 230 })
     .text(`Phone: ${companyDetails.phone}`, 50, yPos + 95, { width: 230 })
     .text(`Email: ${companyDetails.email}`, 50, yPos + 110, { width: 230 })
     .text(`Website: ${companyDetails.website}`, 50, yPos + 125, { width: 230 });
  
  if (quotation.sellerGstin) {
    doc.text(`GSTIN: ${quotation.sellerGstin}`, 50, yPos + 140, { width: 230 });
  }
  if (quotation.sellerPan) {
    doc.text(`PAN: ${quotation.sellerPan}`, 50, yPos + 155, { width: 230 });
  }
  
  // Customer Info Box (Right) - increased height to match left box
  doc.fillColor('#f8f9fa').rect(300, yPos, 250, 170).fill()
     .strokeColor('#e9ecef').rect(300, yPos, 250, 170).stroke();
  
  doc.fontSize(12).fillColor(orangeColor).text('Quotation to', 310, yPos + 10);
  doc.moveTo(310, yPos + 25).lineTo(540, yPos + 25).strokeColor(orangeColor).stroke();
  
  let customerYPos = yPos + 35;
  doc.fontSize(10).fillColor('black')
     .text(`Contact Person: ${customer.name}`, 310, customerYPos, { width: 230 });
  
  customerYPos += 15;
  if (customer.companyName || quotation.customerCompanyName) {
    const companyName = customer.companyName || quotation.customerCompanyName;
    doc.text(`Company: ${companyName}`, 310, customerYPos, { width: 230 });
    customerYPos += 15;
  }
  
  if (customer.email) {
    doc.text(`Email: ${customer.email}`, 310, customerYPos, { width: 230 });
    customerYPos += 15;
  }
  
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, 310, customerYPos, { width: 230 });
    customerYPos += 15;
  }
  
  // Customer address
  if (customer.address || quotation.customerAddress) {
    const address = customer.address || quotation.customerAddress;
    doc.text(`Address: ${address}`, 310, customerYPos, { width: 230 });
    customerYPos += 15;
  }
  
  // City, State, Country, Postal Code
  const locationParts = [];
  if (customer.city || quotation.customerCity) locationParts.push(customer.city || quotation.customerCity);
  if (customer.state || quotation.customerState) locationParts.push(customer.state || quotation.customerState);
  if (customer.country || quotation.customerCountry) locationParts.push(customer.country || quotation.customerCountry);
  if (customer.postalCode || quotation.customerPostalCode) locationParts.push(customer.postalCode || quotation.customerPostalCode);
  
  if (locationParts.length > 0) {
    doc.text(locationParts.join(', '), 310, customerYPos, { width: 230 });
  }
  
  yPos += 190; // Increased from 160 to accommodate taller boxes
  
  // Items Table Header
  doc.fillColor(orangeColor).rect(40, yPos, 510, 25).fill();
  doc.fontSize(10).fillColor('white')
     .text('#', 50, yPos + 8, { width: 30 })
     .text('Item/Item Description', 90, yPos + 8, { width: 250 })
     .text('Qty.', 350, yPos + 8, { width: 60 })
     .text('Rate', 420, yPos + 8, { width: 60 })
     .text('Amount', 490, yPos + 8, { width: 60 });
  
  yPos += 25;
  
  // Items Table Row
  doc.fillColor('white').rect(40, yPos, 510, 30).fill()
     .strokeColor('#ddd').rect(40, yPos, 510, 30).stroke();
  
  doc.fontSize(10).fillColor('black')
     .text('1', 50, yPos + 10, { width: 30 })
     .text(quotation.productName, 90, yPos + 10, { width: 250 })
     .text(`${parseFloat(quotation.quantity).toLocaleString()} ${quotation.unit}`, 350, yPos + 10, { width: 60 })
     .text(`${quotation.currency} ${parseFloat(quotation.unitPrice).toFixed(2)}`, 420, yPos + 10, { width: 60 })
     .text(`${quotation.currency} ${parseFloat(quotation.totalAmount).toLocaleString()}`, 490, yPos + 10, { width: 60 });
  
  yPos += 50;
  
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
  
  yPos += 100;
  
  // Terms and Conditions (Left side)
  doc.fillColor('#fff7e6').rect(40, yPos - 50, 280, 120).fill()
     .strokeColor('#ffa500').rect(40, yPos - 50, 280, 120).stroke();
  
  doc.fontSize(12).fillColor(orangeColor).text('Terms and Conditions', 50, yPos - 40);
  doc.moveTo(50, yPos - 25).lineTo(310, yPos - 25).strokeColor(orangeColor).stroke();
  
  doc.fontSize(9).fillColor('black')
     .text(`1. Payment Terms: ${quotation.paymentTerms}`, 50, yPos - 15, { width: 260 })
     .text(`2. Delivery Terms: ${quotation.deliveryTerms}`, 50, yPos, { width: 260 })
     .text(`3. Validity: Valid until ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}`, 50, yPos + 15, { width: 260 })
     .text('4. Quality: As per specifications provided', 50, yPos + 30, { width: 260 })
     .text('5. Packaging: Standard export packaging', 50, yPos + 45, { width: 260 });
  
  yPos += 90;
  
  // Amount in Words
  doc.fillColor('#f8f9fa').rect(40, yPos, 510, 30).fill()
     .strokeColor(orangeColor).lineWidth(4).moveTo(40, yPos).lineTo(40, yPos + 30).stroke();
  
  doc.fontSize(10).fillColor('black')
     .text('Invoice Total (in words):', 50, yPos + 5)
     .text(amountInWords, 50, yPos + 18, { width: 450 });
  
  yPos += 50;
  
  // Contact Information
  doc.moveTo(40, yPos).lineTo(550, yPos).strokeColor('#eee').stroke();
  doc.fontSize(9).fillColor('#666')
     .text(`For any enquiries, email us on ${companyDetails.email} or call us on ${companyDetails.phone}`, 40, yPos + 10, { align: 'center', width: 510 });
  
  yPos += 40;
  
  // Signature Section
  doc.moveTo(400, yPos).lineTo(540, yPos).strokeColor('black').stroke();
  doc.fontSize(10).fillColor('black')
     .text('This is computer generated quotation,', 400, yPos + 10)
     .text('no need of signature', 400, yPos + 25);
  
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