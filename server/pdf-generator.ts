import puppeteer from 'puppeteer';
const numberToWords = require('number-to-words');

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

function generateQuotationHTML(quotation: QuotationData, customer: CustomerData): string {
  const isInternational = !quotation.includeGst && !quotation.sellerGstin;
  const subtotal = quotation.subtotal || quotation.totalAmount;
  const discountAmount = quotation.discountAmount || "0.00";
  const finalAmount = quotation.totalAmount;
  
  // Convert amount to words
  const amountInWords = numberToWords.toWords(parseFloat(finalAmount))
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation - ${quotation.quotationId}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: #fff;
            }
            
            .quotation-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #ff8c00;
                padding-bottom: 15px;
            }
            
            .header h1 {
                color: #ff8c00;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .quote-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            
            .quote-info div {
                text-align: right;
            }
            
            .parties {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                gap: 20px;
            }
            
            .party-box {
                flex: 1;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            
            .party-box h3 {
                color: #ff8c00;
                font-size: 14px;
                margin-bottom: 8px;
                border-bottom: 1px solid #ff8c00;
                padding-bottom: 5px;
            }
            
            .party-box p {
                margin: 3px 0;
                font-size: 11px;
            }
            
            .supply-info {
                display: flex;
                justify-content: space-between;
                margin: 15px 0;
                padding: 10px;
                background: #f1f8ff;
                border-radius: 5px;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                border: 1px solid #ddd;
            }
            
            .items-table th {
                background: #ff8c00;
                color: white;
                padding: 12px 8px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #ff8c00;
            }
            
            .items-table td {
                padding: 10px 8px;
                text-align: center;
                border: 1px solid #ddd;
                vertical-align: middle;
            }
            
            .items-table .item-desc {
                text-align: left;
                font-weight: 500;
            }
            
            .items-table .amount {
                text-align: right;
                font-weight: bold;
            }
            
            .totals-section {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
            }
            
            .terms-section {
                flex: 1;
                margin-right: 20px;
            }
            
            .totals-box {
                width: 250px;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 15px;
                border-bottom: 1px solid #eee;
            }
            
            .total-row.final {
                background: #28a745;
                color: white;
                font-weight: bold;
                font-size: 14px;
            }
            
            .total-row.discount {
                background: #28a745;
                color: white;
            }
            
            .amount-words {
                margin: 15px 0;
                padding: 10px;
                background: #f8f9fa;
                border-left: 4px solid #ff8c00;
                font-weight: bold;
            }
            
            .terms-box {
                background: #fff7e6;
                border: 1px solid #ffa500;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
            }
            
            .terms-box h3 {
                color: #ff8c00;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .terms-box ol {
                margin-left: 20px;
            }
            
            .terms-box li {
                margin: 5px 0;
                font-size: 11px;
            }
            
            .notes-section {
                background: #f1f8ff;
                border: 1px solid #007bff;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
            }
            
            .notes-section h3 {
                color: #007bff;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .signature-section {
                text-align: right;
                margin-top: 40px;
                padding: 20px 0;
                border-top: 1px solid #ddd;
            }
            
            .signature-line {
                border-bottom: 1px solid #333;
                width: 200px;
                height: 50px;
                margin: 0 0 10px auto;
            }
            
            .contact-info {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 15px;
            }
            
            @media print {
                .quotation-container {
                    box-shadow: none;
                    margin: 0;
                    padding: 15px;
                }
                
                body {
                    background: white;
                }
            }
        </style>
    </head>
    <body>
        <div class="quotation-container">
            <!-- Header -->
            <div class="header">
                <h1>QUOTATION</h1>
            </div>
            
            <!-- Quote Info -->
            <div class="quote-info">
                <div>
                    <strong>Quotation#:</strong> ${quotation.quotationId}<br>
                    <strong>Quotation Date:</strong> ${new Date(quotation.quotationDate).toLocaleDateString('en-GB')}
                </div>
            </div>
            
            <!-- Parties Information -->
            <div class="parties">
                <div class="party-box">
                    <h3>Quotation by</h3>
                    <p><strong>${companyDetails.name}</strong></p>
                    <p>${companyDetails.address}</p>
                    <p>${companyDetails.address2}</p>
                    <p>${companyDetails.address3}</p>
                    ${quotation.sellerGstin ? `<p><strong>GSTIN:</strong> ${quotation.sellerGstin}</p>` : ''}
                    ${quotation.sellerPan ? `<p><strong>PAN:</strong> ${quotation.sellerPan}</p>` : ''}
                </div>
                
                <div class="party-box">
                    <h3>Quotation to</h3>
                    <p><strong>${customer.name}</strong></p>
                    ${quotation.customerCompanyName ? `<p>${quotation.customerCompanyName}</p>` : ''}
                    ${quotation.customerAddress ? `<p>${quotation.customerAddress}</p>` : ''}
                    ${quotation.customerCity && quotation.customerState ? 
                      `<p>${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPostalCode || ''}</p>` : ''}
                    ${quotation.customerCountry ? `<p>${quotation.customerCountry}</p>` : ''}
                    ${quotation.buyerGstin ? `<p><strong>GSTIN:</strong> ${quotation.buyerGstin}</p>` : ''}
                    ${quotation.buyerPan ? `<p><strong>PAN:</strong> ${quotation.buyerPan}</p>` : ''}
                </div>
            </div>
            
            <!-- Supply Information -->
            ${quotation.placeOfSupply || quotation.countryOfSupply ? `
            <div class="supply-info">
                ${quotation.placeOfSupply ? `<div><strong>Place of Supply:</strong> ${quotation.placeOfSupply}</div>` : ''}
                ${quotation.countryOfSupply ? `<div><strong>Country of Supply:</strong> ${quotation.countryOfSupply}</div>` : ''}
            </div>
            ` : ''}
            
            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th style="width: 300px;">Item/Item Description</th>
                        <th style="width: 80px;">Qty.</th>
                        <th style="width: 100px;">Rate</th>
                        <th style="width: 120px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td class="item-desc">${quotation.productName}</td>
                        <td>${parseFloat(quotation.quantity).toLocaleString()} ${quotation.unit}</td>
                        <td>${quotation.currency} ${parseFloat(quotation.unitPrice).toFixed(2)}</td>
                        <td class="amount">${quotation.currency} ${parseFloat(quotation.totalAmount).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Totals and Terms Section -->
            <div class="totals-section">
                <div class="terms-section">
                    <div class="terms-box">
                        <h3>Terms and Conditions</h3>
                        <ol>
                            <li><strong>Payment Terms:</strong> ${quotation.paymentTerms}</li>
                            <li><strong>Delivery Terms:</strong> ${quotation.deliveryTerms}</li>
                            <li><strong>Validity:</strong> Valid until ${new Date(quotation.validUntil).toLocaleDateString('en-GB')}</li>
                            <li>Quality: As per specifications provided</li>
                            <li>Packaging: Standard export packaging</li>
                        </ol>
                    </div>
                    
                    ${quotation.notes ? `
                    <div class="notes-section">
                        <h3>Additional Notes</h3>
                        <p>${quotation.notes}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="totals-box">
                    <div class="total-row">
                        <span>Sub Total</span>
                        <span>${quotation.currency} ${parseFloat(subtotal).toLocaleString()}</span>
                    </div>
                    ${parseFloat(discountAmount) > 0 ? `
                    <div class="total-row discount">
                        <span>Discount(${quotation.discountPercent}%)</span>
                        <span>- ${quotation.currency} ${parseFloat(discountAmount).toLocaleString()}</span>
                    </div>
                    ` : ''}
                    <div class="total-row final">
                        <span>Total</span>
                        <span>${quotation.currency} ${parseFloat(finalAmount).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <!-- Amount in Words -->
            <div class="amount-words">
                <strong>Invoice Total (in words):</strong><br>
                ${amountInWords} ${quotation.currency === 'USD' ? 'Dollars' : quotation.currency === 'INR' ? 'Rupees' : quotation.currency} Only
            </div>
            
            <!-- Contact Information -->
            <div class="contact-info">
                For any enquiries, email us on <strong>${companyDetails.email}</strong> or call us on <strong>${companyDetails.phone}</strong>
            </div>
            
            <!-- Signature Section -->
            <div class="signature-section">
                <div class="signature-line"></div>
                <strong>Authorized Signature</strong><br>
                <small>${companyDetails.name}</small>
            </div>
        </div>
    </body>
    </html>
  `;
}

export async function generateQuotationPDF(quotation: QuotationData, customer: CustomerData): Promise<Buffer> {
  const html = generateQuotationHTML(quotation, customer);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}