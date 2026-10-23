import PDFDocument from "pdfkit";
import converter from "number-to-words";
import type { ManualSalesOrder } from "@shared/salesOrderContract";

interface ContractPdfOrder {
  soNumber: string;
  contractDetails: ManualSalesOrder;
  items: Array<{ productName: string; quantity: string; unit: string | null; unitPrice: string; totalPrice: string }>;
  subtotal: string | null;
  discountAmount: string | null;
  taxAmount: string | null;
  totalAmount: string | null;
  paymentTermsNotes?: string | null;
  termsAndConditions?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  customerNotes?: string | null;
  expectedDeliveryDate?: Date | null;
  paymentTermsAdvancePercent?: string | null;
  paymentTermsCreditDays?: number | null;
}

export function generateSalesOrderContractPdf(order: ContractPdfOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 24, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      const c = order.contractDetails;
      const left = 28;
      const width = doc.page.width - left * 2;
      const half = width / 2;
      const bottom = doc.page.height - 48;
      const ink = "#172b23";
      const pale = "#edf3ef";
      let y = 28;
      let repeatHeader: (() => void) | undefined;
      doc.info.Title = `${order.soNumber} — Sales Contract / Proforma Invoice`;
      doc.info.Author = c.seller.name;

      const wrap = (value: string, w: number, size: number, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
        const lines: string[] = [];
        for (const paragraph of String(value || "").replace(/\r/g, "").split("\n")) {
          let line = "";
          for (const word of paragraph.split(/\s+/)) {
            if (!word) continue;
            if (doc.widthOfString(`${line}${line ? " " : ""}${word}`) <= w) {
              line += `${line ? " " : ""}${word}`;
            } else {
              if (line) lines.push(line);
              line = "";
              for (const char of word) {
                if (line && doc.widthOfString(line + char) > w) {
                  lines.push(line);
                  line = char;
                } else line += char;
              }
            }
          }
          lines.push(line);
        }
        return lines.length ? lines : [""];
      };
      const nextPage = () => {
        doc.addPage();
        y = 28;
        doc.font("Helvetica-Bold").fontSize(9).fillColor(ink)
          .text(`${c.seller.name}  |  ${order.soNumber}  |  Continued`, left, y, { width, lineBreak: false });
        y += 22;
        repeatHeader?.();
      };
      const row = (
        values: string[],
        widths: number[] = [width],
        options: { bold?: boolean; fill?: string; size?: number; minHeight?: number; center?: boolean } = {},
      ) => {
        const size = options.size || 8;
        const lineHeight = size * 1.28;
        const lines = values.map((value, i) => wrap(value, widths[i] - 10, size, options.bold));
        const count = Math.max(...lines.map(value => value.length));
        let offset = 0;
        while (offset < count) {
          const min = Math.max(options.minHeight || 0, lineHeight + 8);
          if (bottom - y < min) nextPage();
          const capacity = Math.max(1, Math.floor((bottom - y - 8) / lineHeight));
          const take = Math.min(count - offset, capacity);
          const height = Math.max(offset === 0 ? options.minHeight || 0 : 0, take * lineHeight + 8);
          let x = left;
          for (let i = 0; i < values.length; i++) {
            if (options.fill) doc.fillColor(options.fill).rect(x, y, widths[i], height).fill();
            doc.strokeColor("#53655c").lineWidth(0.55).rect(x, y, widths[i], height).stroke();
            doc.font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(ink);
            lines[i].slice(offset, offset + take).forEach((line, index) => {
              doc.text(line, x + 5, y + 4 + index * lineHeight, {
                width: widths[i] - 10, lineBreak: false, align: options.center ? "center" : "left",
              });
            });
            x += widths[i];
          }
          y += height;
          offset += take;
          if (offset < count) nextPage();
        }
      };
      const value = (text?: string | null) => text?.trim() || "—";
      const date = (text: string) => text ? text.split("-").reverse().join("-") : "—";
      const party = (p: ManualSalesOrder["buyer"], address?: string) =>
        [p.name, address || p.address, p.contactName && `Contact: ${p.contactName}`, p.phone && `Phone: ${p.phone}`, p.email].filter(Boolean).join("\n");
      const amount = (text?: string | null) => Number(text || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      row([c.seller.name.toUpperCase()], [width], { size: 18, bold: true, fill: pale });
      row([[
        c.seller.address,
        [c.seller.email, c.seller.phone, c.seller.website].filter(Boolean).join("  |  "),
        [c.seller.gstNumber && `GST: ${c.seller.gstNumber}`, c.seller.iecNumber && `IEC: ${c.seller.iecNumber}`].filter(Boolean).join("  |  "),
      ].filter(Boolean).join("\n")], [width], { size: 8.5 });
      row(["SALES CONTRACT / PROFORMA INVOICE"], [width], { bold: true, center: true, fill: pale, size: 11 });
      row([
        `Contract No.: ${c.contractNumber}\nContract Date: ${date(c.contractDate)}`,
        `Proforma Invoice No.: ${c.proformaNumber}\nProforma Invoice Date: ${date(c.proformaDate)}`,
      ], [half, half]);
      row([`Sales Order: ${order.soNumber}    |    Currency: ${c.currency}${order.expectedDeliveryDate ? `    |    Expected Delivery: ${date(order.expectedDeliveryDate.toISOString().slice(0, 10))}` : ""}`]);
      row(["CONSIGNEE DETAILS", "BUYER DETAILS"], [half, half], { bold: true, center: true, fill: pale });
      const consigneeAddress = [order.shippingAddress || c.consignee.address, order.shippingCity, order.shippingState, order.shippingPostalCode].filter(Boolean).join("\n");
      row([party(c.consignee, consigneeAddress), party(c.buyer)], [half, half], { minHeight: 82 });
      row(["NOTIFY PARTY DETAILS", "TERMS & CONDITIONS"], [half, half], { bold: true, center: true, fill: pale });
      row([party(c.notifyParty), [
        `PACKING: ${value(c.packingDetails)}`,
        `PAYMENT TERMS: ${value(order.paymentTermsNotes ?? c.paymentTerms)}`,
        c.lcType && `LC TYPE: ${c.lcType}`,
        `LEAD TIME: ${value(c.leadTime)}`,
        `PRICES: ${value(c.priceTerms)}`,
        `ADVANCE: ${order.paymentTermsAdvancePercent ?? c.advancePercent}% | CREDIT: ${order.paymentTermsCreditDays ?? c.creditDays} days`,
      ].filter(Boolean).join("\n")], [half, half], { minHeight: 100 });
      row([
        `PORT OF LOADING: ${value(c.portOfLoading)}`,
        `PORT OF DISCHARGE: ${value(c.portOfDischarge)}`,
      ], [half, half]);
      row([
        `FINAL DESTINATION: ${value(c.finalDestination)}`,
        `DESTINATION COUNTRY: ${value(order.shippingCountry || c.destinationCountry)}`,
      ], [half, half]);

      const widths = [35, 185, 45, 40, 65, 74, width - 444];
      const headers = ["TOTAL\nBAGS", "Description of goods / services", "HSN / HS\nCODE", "UNIT", "QUANTITY", `RATE\n(${c.currency})`, `VALUE\n(${c.currency})`];
      const itemHeader = () => row(headers, widths, { bold: true, fill: pale, center: true, size: 7.5 });
      itemHeader();
      repeatHeader = itemHeader;
      order.items.forEach((item, index) => {
        const metadata = c.items[index];
        row([
          metadata?.totalBags ? String(metadata.totalBags) : "",
          `${item.productName}${metadata?.batchNumber ? `\nBatch: ${metadata.batchNumber}` : ""}`,
          metadata?.hsnCode || "",
          item.unit || "",
          amount(item.quantity),
          amount(item.unitPrice),
          amount(item.totalPrice),
        ], widths, { size: 7.5, minHeight: 28 });
      });
      repeatHeader = undefined;
      if (Number(order.discountAmount || 0) || Number(order.taxAmount || 0)) {
        row([`SUBTOTAL: ${c.currency} ${amount(order.subtotal)}    |    DISCOUNT: ${amount(order.discountAmount)}    |    TAX: ${amount(order.taxAmount)}`], [width], { bold: true });
      }
      const quantities = new Map<string, number>();
      order.items.forEach(item => quantities.set(item.unit || "", (quantities.get(item.unit || "") || 0) + Number(item.quantity)));
      const quantityTotals = Array.from(quantities.entries()).map(([unit, quantity]) => `${amount(String(quantity))} ${unit}`).join("; ");
      row([`TOTAL BAGS: ${c.items.reduce((sum, item) => sum + item.totalBags, 0)}   |   QUANTITY: ${quantityTotals}   |   TOTAL: ${c.currency} ${amount(order.totalAmount)}`], [width], { bold: true, fill: pale, size: 9 });
      const totalCents = Math.round(Number(order.totalAmount || 0) * 100);
      const whole = Math.floor(totalCents / 100);
      const fraction = totalCents % 100;
      const words = `${c.currency} ${converter.toWords(whole)}${fraction ? ` and ${fraction}/100` : ""} only`;
      row([`Total invoice value in words: ${words.toUpperCase()}`]);
      if (order.termsAndConditions ?? c.additionalTerms) row([`ADDITIONAL TERMS\n${order.termsAndConditions ?? c.additionalTerms}`]);
      if (order.customerNotes) row([`CUSTOMER NOTES\n${order.customerNotes}`]);
      row(["BANK DETAILS", `FOR ${c.seller.name.toUpperCase()}`], [width * 0.64, width * 0.36], { bold: true, center: true, fill: pale });
      const bank = [
        c.bank.name && `Bank: ${c.bank.name}`,
        c.bank.branch && `Branch: ${c.bank.branch}`,
        c.bank.accountName && `Account name: ${c.bank.accountName}`,
        c.bank.accountNumber && `Account number: ${c.bank.accountNumber}`,
        c.bank.ifsc && `IFSC: ${c.bank.ifsc}`,
        c.bank.swift && `SWIFT: ${c.bank.swift}`,
        c.bank.address && `Bank address: ${c.bank.address}`,
      ].filter(Boolean).join("\n");
      row([
        bank || "Bank details not supplied",
        `\n\n____________________________\n${c.authorisedSignatory ? `${c.authorisedSignatory}\n` : ""}${c.signatoryDesignation ? `${c.signatoryDesignation}\n` : ""}AUTHORISED SIGNATORY`,
      ], [width * 0.64, width * 0.36], { minHeight: 94 });

      const pages = doc.bufferedPageRange();
      for (let index = pages.start; index < pages.start + pages.count; index++) {
        doc.switchToPage(index);
        doc.font("Helvetica").fontSize(7).fillColor("#53655c")
          .text(`${order.soNumber}  |  Page ${index + 1} of ${pages.count}`, left, doc.page.height - 34, {
            width, align: "right", lineBreak: false,
          });
      }
      doc.end();
    } catch (error) {
      doc.destroy();
      reject(error);
    }
  });
}
