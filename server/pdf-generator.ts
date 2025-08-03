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
}

const companyDetails = {
  name: "Bright Fame Organic Pvt. Ltd.",
  address: "C/O Bright Fame International",
  address2: "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road",
  address3: "Kansarakui, Mehsana, Gujarat 384001",
  phone: "+91-7249847439",
  email: "admin@bfiorganic.com",
  website: "www.bfiorganic.com"
};

function createQuotationPDF(quotation: QuotationData, customer: CustomerData): PDFDocument {
  const doc = new PDFDocument({ margin: 40 });
  
  const subtotal = quotation.subtotal || quotation.totalAmount;
  const discountAmount = quotation.discountAmount || "0.00";
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
  
  // Header
  doc.fontSize(28).fillColor(orangeColor).text('QUOTATION', 40, 60, { align: 'center' });
  doc.moveTo(40, 100).lineTo(550, 100).strokeColor(orangeColor).lineWidth(3).stroke();
  
  // Quote Info
  let yPos = 120;
  doc.fontSize(10).fillColor('black')
     .text(`Quotation#: ${quotation.quotationId}`, 400, yPos)
     .text(`Quotation Date: ${new Date(quotation.quotationDate).toLocaleDateString('en-GB')}`, 400, yPos + 15);
  
  yPos += 50;
  
  // Company Info Box (Left)
  doc.fillColor('#f8f9fa').rect(40, yPos, 250, 140).fill()
     .strokeColor('#e9ecef').rect(40, yPos, 250, 140).stroke();
  
  doc.fontSize(12).fillColor(orangeColor).text('Quotation by', 50, yPos + 10);
  doc.moveTo(50, yPos + 25).lineTo(280, yPos + 25).strokeColor(orangeColor).stroke();
  
  doc.fontSize(10).fillColor('black')
     .text(companyDetails.name, 50, yPos + 35, { width: 230 })
     .text(companyDetails.address, 50, yPos + 50, { width: 230 })
     .text(companyDetails.address2, 50, yPos + 65, { width: 230 })
     .text(companyDetails.address3, 50, yPos + 80, { width: 230 });
  
  if (quotation.sellerGstin) {
    doc.text(`GSTIN: ${quotation.sellerGstin}`, 50, yPos + 100, { width: 230 });
  }
  if (quotation.sellerPan) {
    doc.text(`PAN: ${quotation.sellerPan}`, 50, yPos + 115, { width: 230 });
  }
  
  // Customer Info Box (Right)
  doc.fillColor('#f8f9fa').rect(300, yPos, 250, 140).fill()
     .strokeColor('#e9ecef').rect(300, yPos, 250, 140).stroke();
  
  doc.fontSize(12).fillColor(orangeColor).text('Quotation to', 310, yPos + 10);
  doc.moveTo(310, yPos + 25).lineTo(540, yPos + 25).strokeColor(orangeColor).stroke();
  
  doc.fontSize(10).fillColor('black')
     .text(customer.name, 310, yPos + 35, { width: 230 });
  
  if (quotation.customerCompanyName) {
    doc.text(quotation.customerCompanyName, 310, yPos + 50, { width: 230 });
  }
  if (quotation.customerAddress) {
    doc.text(quotation.customerAddress, 310, yPos + 65, { width: 230 });
  }
  if (quotation.customerCity && quotation.customerState) {
    doc.text(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPostalCode || ''}`, 310, yPos + 80, { width: 230 });
  }
  if (quotation.customerCountry) {
    doc.text(quotation.customerCountry, 310, yPos + 95, { width: 230 });
  }
  
  yPos += 160;
  
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
     .text('Authorized Signature', 400, yPos + 10)
     .text(companyDetails.name, 400, yPos + 25);
  
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