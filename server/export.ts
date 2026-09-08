/**
 * Let's Estimate - Export Service
 * Generates formatted Excel (.xlsx) using `xlsx`
 * Generates formal Bill of Quantities PDF (.pdf) with Nigerian builder company header using `pdfkit`
 */

import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export interface ExportData {
  projectTitle: string;
  location?: string;
  clientName?: string;
  date?: string;
  poPercent?: number;
  vatPercent?: number;
  swampPremiumPercent?: number;
  items: Array<{
    item_number?: number;
    item: string;
    description: string;
    unit: string;
    qty: number;
    rate: number;
    amount?: number;
  }>;
}

/**
 * Format currency for Nigerian Naira
 */
function formatNaira(num: number): string {
  return 'NGN ' + Number(num || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generate Excel (.xlsx) buffer
 */
export function generateExcelBuffer(data: ExportData): Buffer {
  const wb = XLSX.utils.book_new();

  const title = data.projectTitle || "Let's Estimate - Project BOQ";
  const location = data.location || 'Nigeria';
  const client = data.clientName || 'Private Client';
  const dateStr = data.date || new Date().toLocaleDateString('en-GB');

  // Compute values
  const items = data.items.map((it, idx) => {
    const qty = Number(it.qty || 0);
    const rate = Number(it.rate || 0);
    const amount = qty * rate;
    return {
      'Item No.': it.item_number || idx + 1,
      'Bill Item': it.item,
      'Description': it.description,
      'Unit': it.unit,
      'Quantity': qty,
      'Rate (NGN)': rate,
      'Amount (NGN)': amount,
    };
  });

  const subtotal = items.reduce((acc, it) => acc + it['Amount (NGN)'], 0);
  const swampPercent = Number(data.swampPremiumPercent || 0);
  const swampAmount = subtotal * (swampPercent / 100);
  const adjustedSubtotal = subtotal + swampAmount;
  const poPercent = Number(data.poPercent ?? 15);
  const poAmount = adjustedSubtotal * (poPercent / 100);
  const vatPercent = Number(data.vatPercent ?? 7.5);
  const vatAmount = (adjustedSubtotal + poAmount) * (vatPercent / 100);
  const grandTotal = adjustedSubtotal + poAmount + vatAmount;

  // Build Sheet Rows
  const sheetRows: any[][] = [
    ["LET'S ESTIMATE - BILL OF QUANTITIES (BOQ)"],
    ['AI-Powered Construction Takeoff & Cost Estimation for Nigerian Builders'],
    [],
    ['Project Title:', title],
    ['Project Location:', location],
    ['Client / Employer:', client],
    ['Date of Estimate:', dateStr],
    ['Currency:', 'Nigerian Naira (NGN)'],
    [],
    ['Item No.', 'Bill Item', 'Description of Works', 'Unit', 'Quantity', 'Rate (NGN)', 'Amount (NGN)'],
  ];

  items.forEach((it) => {
    sheetRows.push([
      it['Item No.'],
      it['Bill Item'],
      it['Description'],
      it['Unit'],
      it['Quantity'],
      it['Rate (NGN)'],
      it['Amount (NGN)'],
    ]);
  });

  sheetRows.push([]);
  sheetRows.push(['', '', '', '', '', 'Sub-Total:', subtotal]);
  if (swampPercent > 0) {
    sheetRows.push(['', '', '', '', '', `Swamp / Terrain Premium (${swampPercent}%):`, swampAmount]);
    sheetRows.push(['', '', '', '', '', 'Adjusted Sub-Total:', adjustedSubtotal]);
  }
  sheetRows.push(['', '', '', '', '', `Profit & Overheads (${poPercent}%):`, poAmount]);
  sheetRows.push(['', '', '', '', '', `Value Added Tax (${vatPercent}% VAT):`, vatAmount]);
  sheetRows.push(['', '', '', '', '', 'GRAND TOTAL (NGN):', grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, // Item No
    { wch: 16 }, // Bill Item
    { wch: 55 }, // Description
    { wch: 8 },  // Unit
    { wch: 14 }, // Quantity
    { wch: 18 }, // Rate
    { wch: 22 }, // Amount
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bill of Quantities');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate PDF buffer using PDFKit with Nigerian construction firm branding
 */
export function generatePdfBuffer(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `BOQ - ${data.projectTitle}`,
          Author: "Let's Estimate Nigeria",
          Subject: 'Bill of Quantities',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = data.projectTitle || "Let's Estimate - Project BOQ";
      const location = data.location || 'Nigeria';
      const client = data.clientName || 'Private Client';
      const dateStr = data.date || new Date().toLocaleDateString('en-GB');

      // Top Decorative Header Banner
      doc.rect(36, 36, 523, 64).fill('#064e3b'); // Emerald-900 Nigerian Green

      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text("LET'S ESTIMATE", 50, 48, { characterSpacing: 1 });
      doc.fontSize(9).font('Helvetica')
        .text('AI-POWERED BILL OF QUANTITIES (BOQ) - NIGERIA', 50, 70, { characterSpacing: 0.5 });
      doc.fontSize(8).text('Standard Method of Measurement (BESMM4 / NIQS)', 50, 83);

      doc.fillColor('#a7f3d0').fontSize(8).text(`Date: ${dateStr}`, 440, 50, { align: 'right' });
      doc.text('Currency: NGN (Naira)', 440, 64, { align: 'right' });

      // Project Meta Box
      let y = 112;
      doc.rect(36, y, 523, 44).fill('#f0fdf4').stroke('#bbf7d0');

      doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('PROJECT:', 46, y + 8);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(title, 96, y + 8, { width: 450, ellipsis: true });

      doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('LOCATION:', 46, y + 24);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(location, 96, y + 24);

      doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('CLIENT:', 320, y + 24);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(client, 365, y + 24);

      // Table Header
      y = 168;
      const colNo = 40;
      const colItem = 70;
      const colDesc = 150;
      const colUnit = 360;
      const colQty = 395;
      const colRate = 450;
      const colAmt = 505;

      doc.rect(36, y, 523, 20).fill('#047857'); // Emerald-700
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('No', colNo, y + 5);
      doc.text('Bill Item', colItem, y + 5);
      doc.text('Description of Works', colDesc, y + 5);
      doc.text('Unit', colUnit, y + 5);
      doc.text('Qty', colQty, y + 5, { width: 45, align: 'right' });
      doc.text('Rate (NGN)', colRate, y + 5, { width: 50, align: 'right' });
      doc.text('Amount (NGN)', colAmt, y + 5, { width: 50, align: 'right' });

      y += 20;

      let subtotal = 0;
      data.items.forEach((it, idx) => {
        const qty = Number(it.qty || 0);
        const rate = Number(it.rate || 0);
        const amount = qty * rate;
        subtotal += amount;

        // Check page overflow
        if (y > 700) {
          doc.addPage();
          y = 40;
        }

        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, y, 523, 26).fill(bg);
        doc.rect(36, y, 523, 26).stroke('#e2e8f0');

        doc.fillColor('#334155').fontSize(8).font('Helvetica');
        doc.text(String(it.item_number || idx + 1), colNo, y + 8);
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(it.item, colItem, y + 8, { width: 75, ellipsis: true });
        doc.font('Helvetica').fillColor('#475569').text(it.description, colDesc, y + 4, { width: 205, height: 20, ellipsis: true });
        doc.fillColor('#0f172a').text(it.unit, colUnit, y + 8);
        doc.text(qty.toLocaleString('en-US', { maximumFractionDigits: 1 }), colQty, y + 8, { width: 45, align: 'right' });
        doc.text(rate.toLocaleString('en-US'), colRate, y + 8, { width: 50, align: 'right' });
        doc.font('Helvetica-Bold').fillColor('#047857').text(amount.toLocaleString('en-US'), colAmt, y + 8, { width: 50, align: 'right' });

        y += 26;
      });

      // Totals calculation
      const swampPercent = Number(data.swampPremiumPercent || 0);
      const swampAmount = subtotal * (swampPercent / 100);
      const adjustedSubtotal = subtotal + swampAmount;
      const poPercent = Number(data.poPercent ?? 15);
      const poAmount = adjustedSubtotal * (poPercent / 100);
      const vatPercent = Number(data.vatPercent ?? 7.5);
      const vatAmount = (adjustedSubtotal + poAmount) * (vatPercent / 100);
      const grandTotal = adjustedSubtotal + poAmount + vatAmount;

      y += 10;
      if (y > 670) {
        doc.addPage();
        y = 50;
      }

      // Summary Box
      const summaryBoxX = 280;
      const summaryBoxWidth = 279;
      doc.rect(summaryBoxX, y, summaryBoxWidth, swampPercent > 0 ? 110 : 90).fill('#f8fafc').stroke('#cbd5e1');

      let sy = y + 8;
      const renderTotalLine = (label: string, value: number, isBold: boolean = false, isGrand: boolean = false) => {
        doc.fontSize(8).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isGrand ? '#064e3b' : '#334155')
          .text(label, summaryBoxX + 12, sy);
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isGrand ? '#047857' : '#0f172a')
          .text('NGN ' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryBoxX + 140, sy, {
            width: 125,
            align: 'right',
          });
        sy += 16;
      };

      renderTotalLine('Sub-Total:', subtotal);
      if (swampPercent > 0) {
        renderTotalLine(`Swamp / Terrain Premium (${swampPercent}%):`, swampAmount);
      }
      renderTotalLine(`Profit & Overheads (${poPercent}%):`, poAmount);
      renderTotalLine(`Nigerian VAT (${vatPercent}%):`, vatAmount);

      doc.rect(summaryBoxX + 10, sy - 2, summaryBoxWidth - 20, 1).fill('#94a3b8');
      sy += 4;
      renderTotalLine('GRAND TOTAL:', grandTotal, true, true);

      // Sign-off section at bottom
      y = sy + 25;
      if (y > 750) {
        doc.addPage();
        y = 60;
      }
      doc.rect(36, y, 220, 45).stroke('#cbd5e1');
      doc.fillColor('#64748b').fontSize(7).text('PREPARED BY / QUANTITY SURVEYOR:', 42, y + 6);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text("Let's Estimate AI System (NIQS Format)", 42, y + 18);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('Signature: __________________________', 42, y + 30);

      doc.rect(339, y, 220, 45).stroke('#cbd5e1');
      doc.fillColor('#64748b').fontSize(7).text('VERIFIED & APPROVED BY CLIENT / BUILDER:', 345, y + 6);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(client, 345, y + 18);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('Signature: __________________________', 345, y + 30);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
