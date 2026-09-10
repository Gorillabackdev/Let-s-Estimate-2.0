/**
 * Let's Estimate - Export Service
 * Generates formatted Multi-Tab Excel (.xlsx) using `xlsx`
 * Generates formal Bill of Quantities PDF (.pdf) with Nigerian builder company header using `pdfkit`
 */

import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export interface ExportData {
  projectTitle: string;
  location?: string;
  state?: string;
  clientName?: string;
  clientContact?: string;
  date?: string;
  gfa?: number;
  projectType?: string;
  poPercent?: number;
  vatPercent?: number;
  swampPremiumPercent?: number;
  activeVersion?: string;
  items: Array<{
    item_number?: number;
    section?: string;
    item: string;
    description: string;
    unit: string;
    qty: number;
    rate: number;
    amount?: number;
  }>;
  variations?: Array<{
    variation_number: string;
    description: string;
    amount: number;
    type?: string;
    status?: string;
  }>;
}

/**
 * Calculate material requirements based on Nigerian civil construction standards
 */
export function calculateMaterialRequirements(items: Array<{ item: string; description: string; unit: string; qty: number }>) {
  let cementBags = 0;
  let sandTonnes = 0;
  let graniteTonnes = 0;
  let rebarTonnes = 0;
  let blocks225 = 0;
  let blocks150 = 0;
  let roofingSqm = 0;

  for (const it of items) {
    const name = ((it.item || '') + ' ' + (it.description || '')).toLowerCase();
    const qty = Number(it.qty || 0);

    // Concrete items (RC Slab, Beams, Columns, Raft, Foundation Footing)
    if (name.includes('concrete') || name.includes('slab') || name.includes('beam') || name.includes('column') || it.unit === 'm3') {
      cementBags += qty * 7.2;
      sandTonnes += qty * 0.72;
      graniteTonnes += qty * 1.35;
      rebarTonnes += qty * 0.12;
    } 
    // Rebar items explicitly measured
    else if (name.includes('rebar') || name.includes('reinforcement') || name.includes('steel') || name.includes('iron rod')) {
      if (it.unit === 'kg') {
        rebarTonnes += qty / 1000;
      } else if (it.unit === 't' || it.unit === 'tonne') {
        rebarTonnes += qty;
      }
    }
    // Blockwork items
    else if (name.includes('block') || name.includes('brick')) {
      if (name.includes('150') || name.includes('6"')) {
        blocks150 += Math.round(qty * 10.5);
        cementBags += qty * 0.22;
        sandTonnes += qty * 0.04;
      } else {
        blocks225 += Math.round(qty * 10.5);
        cementBags += qty * 0.28;
        sandTonnes += qty * 0.05;
      }
    }
    // Plastering / Rendering / Screed
    else if (name.includes('plaster') || name.includes('render') || name.includes('screed')) {
      cementBags += qty * 0.15;
      sandTonnes += qty * 0.025;
    }
    // Roofing
    else if (name.includes('roof') || name.includes('aluminium') || name.includes('step-tile')) {
      roofingSqm += qty * 1.15;
    }
  }

  cementBags = Math.ceil(cementBags);
  sandTonnes = Math.round(sandTonnes * 10) / 10;
  graniteTonnes = Math.round(graniteTonnes * 10) / 10;
  rebarTonnes = Math.round(rebarTonnes * 100) / 100;

  const CEMENT_PRICE = 9500;
  const SAND_PRICE = 6500;
  const GRANITE_PRICE = 11500;
  const REBAR_PRICE = 1450000;
  const BLOCK_225_PRICE = 550;
  const BLOCK_150_PRICE = 450;
  const ROOFING_PRICE = 7500;

  const totalCost = 
    (cementBags * CEMENT_PRICE) +
    (sandTonnes * SAND_PRICE) +
    (graniteTonnes * GRANITE_PRICE) +
    (rebarTonnes * REBAR_PRICE) +
    (blocks225 * BLOCK_225_PRICE) +
    (blocks150 * BLOCK_150_PRICE) +
    (roofingSqm * ROOFING_PRICE);

  return {
    cementBags,
    sandTonnes,
    graniteTonnes,
    rebarTonnes,
    blocks225,
    blocks150,
    roofingSqm: Math.round(roofingSqm),
    totalCost: Math.round(totalCost),
    depotRates: {
      cement: CEMENT_PRICE,
      sand: SAND_PRICE,
      granite: GRANITE_PRICE,
      rebar: REBAR_PRICE,
      block225: BLOCK_225_PRICE,
      block150: BLOCK_150_PRICE,
      roofing: ROOFING_PRICE
    }
  };
}

/**
 * Generate Multi-Tab Excel (.xlsx) buffer
 */
export function generateExcelBuffer(data: ExportData): Buffer {
  const wb = XLSX.utils.book_new();

  const title = data.projectTitle || "Let's Estimate - Project BOQ";
  const location = data.location || 'Nigeria';
  const client = data.clientName || 'Private Client';
  const dateStr = data.date || new Date().toLocaleDateString('en-GB');

  // 1. Calculate Grand Financials
  const safeDataItems = Array.isArray(data.items) ? data.items : [];
  const items = safeDataItems.map((it, idx) => {
    const qty = Number(it.qty || 0);
    const rate = Number(it.rate || 0);
    const amount = qty * rate;
    return {
      'Item No.': it.item_number || idx + 1,
      'Trade Section': it.section || 'General Works',
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

  // TAB 1: GRAND SUMMARY / COLLECTION PAGE
  const summaryRows: any[][] = [
    ["LET'S ESTIMATE - FORMAL TENDER BILL OF QUANTITIES"],
    ["Standard Method of Measurement of Building Works (BESMM4 / NIQS)"],
    [],
    ["PROJECT SPECIFICATION & CONTRACT COLLECTION"],
    ["Project Title:", title],
    ["Site Location:", location],
    ["State / Region:", data.state || 'Lagos, Nigeria'],
    ["Client / Employer:", client],
    ["Date of Tender:", dateStr],
    ["Estimate Version:", data.activeVersion || 'V1'],
    ["Gross Floor Area (GFA):", data.gfa ? `${data.gfa} m²` : 'Not Specified'],
    ["Cost per m² GFA Benchmark:", data.gfa && data.gfa > 0 ? `NGN ${(grandTotal / data.gfa).toLocaleString('en-US', { maximumFractionDigits: 0 })} / m²` : 'N/A'],
    [],
    ["SUMMARY OF MEASURED BILLS", "AMOUNT (NGN)"],
    ["Measured Trade Works Subtotal", subtotal],
  ];

  if (swampPercent > 0) {
    summaryRows.push([`Swamp / High Water Table Terrain Premium (${swampPercent}%)`, swampAmount]);
    summaryRows.push(["Adjusted Subtotal", adjustedSubtotal]);
  }
  summaryRows.push([`Contractor's Profit & Overheads (${poPercent}%)`, poAmount]);
  summaryRows.push([`Statutory Nigerian Value Added Tax (${vatPercent}% VAT)`, vatAmount]);
  summaryRows.push([]);
  summaryRows.push(["TOTAL ESTIMATED CONTRACT TENDER SUM (NGN)", grandTotal]);
  summaryRows.push([]);
  summaryRows.push(["Prepared by: Registered Quantity Surveyor (NIQS Format)"]);
  summaryRows.push(["System: Let's Estimate - AI SaaS for Nigerian Construction Professionals"]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Grand Summary');

  // TAB 2: MEASURED BILL OF QUANTITIES
  const boqRows: any[][] = [
    ["BILL OF QUANTITIES (MEASURED TRADE WORKS)"],
    ["Project:", title],
    [],
    ['Item No.', 'Trade Section', 'Bill Item', 'Description of Works', 'Unit', 'Quantity', 'Rate (NGN)', 'Amount (NGN)'],
  ];

  items.forEach((it) => {
    boqRows.push([
      it['Item No.'],
      it['Trade Section'],
      it['Bill Item'],
      it['Description'],
      it['Unit'],
      it['Quantity'],
      it['Rate (NGN)'],
      it['Amount (NGN)'],
    ]);
  });

  boqRows.push([]);
  boqRows.push(['', '', '', '', '', '', 'Subtotal (NGN):', subtotal]);
  boqRows.push(['', '', '', '', '', '', `P&O (${poPercent}%):`, poAmount]);
  boqRows.push(['', '', '', '', '', '', `VAT (${vatPercent}%):`, vatAmount]);
  boqRows.push(['', '', '', '', '', '', 'GRAND TOTAL (NGN):', grandTotal]);

  const wsBoq = XLSX.utils.aoa_to_sheet(boqRows);
  wsBoq['!cols'] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 20 },
    { wch: 50 },
    { wch: 8 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBoq, 'Bill of Quantities');

  // TAB 3: MATERIAL PROCUREMENT SCHEDULE
  const matCalc = calculateMaterialRequirements(data.items);
  const matRows: any[][] = [
    ["MATERIAL PROCUREMENT SCHEDULE & SITE BUDGET"],
    ["Estimated quantities derived from measured bill dimensions"],
    [],
    ["Material Item", "Specification / Grade", "Estimated Qty", "Standard Unit", "Estimated Depot Rate (NGN)", "Procurement Budget (NGN)"],
    ["Cement (50kg bags)", "Portland Cement Grade 42.5N (Elephant/Dangote/BUA)", matCalc.cementBags, "Bags", matCalc.depotRates.cement, matCalc.cementBags * matCalc.depotRates.cement],
    ["Sharp Sand (Aggregate)", "Coarse clean river sharp sand for concrete & mortar", matCalc.sandTonnes, "Tonnes", matCalc.depotRates.sand, matCalc.sandTonnes * matCalc.depotRates.sand],
    ["Granite / Stone (20mm)", "Crushed clean quarry granite aggregate (3/4\")", matCalc.graniteTonnes, "Tonnes", matCalc.depotRates.granite, matCalc.graniteTonnes * matCalc.depotRates.granite],
    ["Reinforcement Rebar", "High-yield deformed steel rebars (Y10 - Y20 mix)", matCalc.rebarTonnes, "Tonnes", matCalc.depotRates.rebar, matCalc.rebarTonnes * matCalc.depotRates.rebar],
    ["225mm Hollow Blocks", "9\" Vibrated hollow sandcrete blocks (4.5 N/mm²)", matCalc.blocks225, "Blocks", matCalc.depotRates.block225, matCalc.blocks225 * matCalc.depotRates.block225],
    ["150mm Hollow Blocks", "6\" Vibrated sandcrete blocks for internal partitions", matCalc.blocks150, "Blocks", matCalc.depotRates.block150, matCalc.blocks150 * matCalc.depotRates.block150],
    ["Aluminium Roofing Sheets", "0.55mm Step-tile longspan standing seam roofing", matCalc.roofingSqm, "m²", matCalc.depotRates.roofing, matCalc.roofingSqm * matCalc.depotRates.roofing],
    [],
    ["", "", "", "", "TOTAL ESTIMATED DIRECT MATERIALS BUDGET:", matCalc.totalCost]
  ];

  const wsMat = XLSX.utils.aoa_to_sheet(matRows);
  wsMat['!cols'] = [
    { wch: 25 },
    { wch: 45 },
    { wch: 16 },
    { wch: 14 },
    { wch: 25 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMat, 'Material Procurement');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate PDF buffer using PDFKit with formal Nigerian QS & NIQS standard layout
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
          Subject: 'Tender Bill of Quantities',
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

      // Top Header Banner
      doc.rect(36, 36, 523, 66).fill('#064e3b'); // Emerald-900

      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text("LET'S ESTIMATE", 50, 48, { characterSpacing: 1 });
      doc.fontSize(8.5).font('Helvetica')
        .text('TENDER BILL OF QUANTITIES (BOQ) - NIGERIA', 50, 70, { characterSpacing: 0.5 });
      doc.fontSize(7.5).text('Building & Engineering Standard Method of Measurement (BESMM4 / NIQS)', 50, 83);

      doc.fillColor('#a7f3d0').fontSize(8).text(`Date: ${dateStr}`, 440, 48, { align: 'right' });
      doc.text(`Version: ${data.activeVersion || 'V1'}`, 440, 62, { align: 'right' });
      doc.text('Currency: NGN (₦)', 440, 76, { align: 'right' });

      // Project Meta Box
      let y = 114;
      doc.rect(36, y, 523, 50).fill('#f0fdf4').stroke('#bbf7d0');

      doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('PROJECT:', 46, y + 8);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(title, 96, y + 8, { width: 440, ellipsis: true });

      doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('LOCATION:', 46, y + 24);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(location, 96, y + 24);

      doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('CLIENT:', 320, y + 24);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(client, 365, y + 24);

      if (data.gfa && data.gfa > 0) {
        doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('GFA:', 46, y + 36);
        doc.fillColor('#334155').fontSize(8).font('Helvetica').text(`${data.gfa} m² (${data.projectType || 'Building'})`, 96, y + 36);
      }

      // Table Header
      y = 176;
      const colNo = 40;
      const colItem = 68;
      const colDesc = 145;
      const colUnit = 360;
      const colQty = 395;
      const colRate = 450;
      const colAmt = 505;

      doc.rect(36, y, 523, 20).fill('#047857');
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('No', colNo, y + 6);
      doc.text('Bill Item', colItem, y + 6);
      doc.text('Description of Works', colDesc, y + 6);
      doc.text('Unit', colUnit, y + 6);
      doc.text('Qty', colQty, y + 6, { width: 45, align: 'right' });
      doc.text('Rate ₦', colRate, y + 6, { width: 50, align: 'right' });
      doc.text('Amount ₦', colAmt, y + 6, { width: 50, align: 'right' });

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

        doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
        doc.text(String(it.item_number || idx + 1), colNo, y + 8);
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(it.item, colItem, y + 8, { width: 72, ellipsis: true });
        doc.font('Helvetica').fillColor('#475569').text(it.description, colDesc, y + 4, { width: 210, height: 20, ellipsis: true });
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
      if (y > 660) {
        doc.addPage();
        y = 50;
      }

      // Summary Box
      const summaryBoxX = 270;
      const summaryBoxWidth = 289;
      doc.rect(summaryBoxX, y, summaryBoxWidth, swampPercent > 0 ? 115 : 95).fill('#f8fafc').stroke('#cbd5e1');

      let sy = y + 8;
      const renderTotalLine = (label: string, value: number, isBold: boolean = false, isGrand: boolean = false) => {
        doc.fontSize(7.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isGrand ? '#064e3b' : '#334155')
          .text(label, summaryBoxX + 12, sy);
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isGrand ? '#047857' : '#0f172a')
          .text('NGN ' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryBoxX + 140, sy, {
            width: 135,
            align: 'right',
          });
        sy += 16;
      };

      renderTotalLine('Measured Sub-Total:', subtotal);
      if (swampPercent > 0) {
        renderTotalLine(`Swamp / Terrain Premium (${swampPercent}%):`, swampAmount);
      }
      renderTotalLine(`Contractor's Profit & Overheads (${poPercent}%):`, poAmount);
      renderTotalLine(`Statutory Nigerian VAT (${vatPercent}%):`, vatAmount);

      doc.rect(summaryBoxX + 10, sy - 2, summaryBoxWidth - 20, 1).fill('#94a3b8');
      sy += 4;
      renderTotalLine('TOTAL TENDER CONTRACT SUM:', grandTotal, true, true);

      // Sign-off section
      y = sy + 25;
      if (y > 740) {
        doc.addPage();
        y = 60;
      }

      doc.rect(36, y, 230, 52).stroke('#cbd5e1');
      doc.fillColor('#64748b').fontSize(6.5).text('PREPARED BY / QUANTITY SURVEYOR:', 42, y + 6);
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text("Registered Quantity Surveyor (NIQS / QSRBN Format)", 42, y + 17);
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('Signature / Stamp: __________________________', 42, y + 32);

      doc.rect(329, y, 230, 52).stroke('#cbd5e1');
      doc.fillColor('#64748b').fontSize(6.5).text('VERIFIED & ACCEPTED BY CLIENT / EMPLOYER:', 335, y + 6);
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(client, 335, y + 17);
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('Signature / Date: __________________________', 335, y + 32);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
