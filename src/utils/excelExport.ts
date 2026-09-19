import * as XLSX from 'xlsx';
import { Project, BoqItem } from '../types';
import { calculateBoqTotals } from './format';

export interface ExportBoqOptions {
  projectTitle?: string;
  location?: string;
  state?: string;
  clientName?: string;
  poPercent?: number;
  vatPercent?: number;
  swampPremiumPercent?: number;
  activeVersion?: string;
  items: BoqItem[];
}

/**
 * Calculate standard Nigerian civil construction material benchmarks
 */
export function calculateMaterialBreakdown(items: BoqItem[]) {
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

    if (name.includes('concrete') || name.includes('slab') || name.includes('beam') || name.includes('column') || it.unit === 'm3') {
      cementBags += qty * 7.2;
      sandTonnes += qty * 0.72;
      graniteTonnes += qty * 1.35;
      rebarTonnes += qty * 0.12;
    } else if (name.includes('rebar') || name.includes('reinforcement') || name.includes('steel') || name.includes('iron rod')) {
      if (it.unit === 'kg') {
        rebarTonnes += qty / 1000;
      } else if (it.unit === 't' || it.unit === 'tonne') {
        rebarTonnes += qty;
      }
    } else if (name.includes('block') || name.includes('brick')) {
      if (name.includes('150') || name.includes('6"')) {
        blocks150 += Math.round(qty * 10.5);
        cementBags += qty * 0.22;
        sandTonnes += qty * 0.04;
      } else {
        blocks225 += Math.round(qty * 10.5);
        cementBags += qty * 0.28;
        sandTonnes += qty * 0.05;
      }
    } else if (name.includes('plaster') || name.includes('render') || name.includes('screed')) {
      cementBags += qty * 0.15;
      sandTonnes += qty * 0.025;
    } else if (name.includes('roof') || name.includes('aluminium') || name.includes('step-tile')) {
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
    cementBags * CEMENT_PRICE +
    sandTonnes * SAND_PRICE +
    graniteTonnes * GRANITE_PRICE +
    rebarTonnes * REBAR_PRICE +
    blocks225 * BLOCK_225_PRICE +
    blocks150 * BLOCK_150_PRICE +
    roofingSqm * ROOFING_PRICE;

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
 * Generate genuine 3-tab XLSX workbook in browser memory
 */
export function generateClientXlsxBlob(options: ExportBoqOptions): Blob {
  const wb = XLSX.utils.book_new();

  const title = options.projectTitle || "Let's Estimate - Project BOQ";
  const location = options.location || 'Nigeria';
  const client = options.clientName || 'Private Client';
  const dateStr = new Date().toLocaleDateString('en-GB');

  const safeItems = Array.isArray(options.items) ? options.items : [];
  const poPercent = Number(options.poPercent ?? 15);
  const vatPercent = Number(options.vatPercent ?? 7.5);
  const swampPercent = Number(options.swampPremiumPercent ?? 0);

  const totals = calculateBoqTotals(safeItems, poPercent, vatPercent, swampPercent);

  // Tab 1: Grand Summary
  const summaryRows: any[][] = [
    ["LET'S ESTIMATE - OFFICIAL TENDER BILL OF QUANTITIES"],
    ["Standard Method of Measurement of Building Works (BESMM4 / NIQS Standard)"],
    [],
    ["PROJECT SPECIFICATION & CONTRACT RECAPITULATION"],
    ["Project Title:", title],
    ["Site Location:", location],
    ["Client / Employer:", client],
    ["Date of Schedule:", dateStr],
    ["Estimate Version:", options.activeVersion || 'V1'],
    [],
    ["SUMMARY OF MEASURED BILLS", "AMOUNT (NGN)"],
    ["Measured Trade Works Subtotal", totals.subtotal],
  ];

  if (swampPercent > 0) {
    summaryRows.push([`Swamp / Coastal Terrain Premium (${swampPercent}%)`, totals.swampAmount]);
    summaryRows.push(["Adjusted Measured Works Subtotal", totals.adjustedSubtotal]);
  }

  summaryRows.push([`Contractor's Profit & Overheads (${poPercent}%)`, totals.poAmount]);
  summaryRows.push([`Statutory Value Added Tax (${vatPercent}% VAT)`, totals.vatAmount]);
  summaryRows.push([]);
  summaryRows.push(["TOTAL ESTIMATED CONTRACT TENDER SUM (NGN)", totals.grandTotal]);
  summaryRows.push([]);
  summaryRows.push(["Prepared with: Let's Estimate - AI BOQ Tool for Nigerian Construction"]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Grand Summary');

  // Tab 2: Measured Bill of Quantities
  const boqRows: any[][] = [
    ["BILL OF QUANTITIES (MEASURED TRADE WORKS)"],
    ["Project:", title],
    [],
    ['Item No.', 'Trade Section', 'Bill Item', 'Description of Works', 'Unit', 'Quantity', 'Rate (NGN)', 'Amount (NGN)'],
  ];

  safeItems.forEach((it, idx) => {
    const qty = Number(it.qty || 0);
    const rate = Number(it.rate || 0);
    const amount = Number(it.amount ?? (qty * rate));
    boqRows.push([
      it.item_number || idx + 1,
      it.section || 'General Works',
      it.item,
      it.description,
      it.unit,
      qty,
      rate,
      amount
    ]);
  });

  boqRows.push([]);
  boqRows.push(['', '', '', '', '', '', 'Subtotal (NGN):', totals.subtotal]);
  if (swampPercent > 0) {
    boqRows.push(['', '', '', '', '', '', `Swamp Premium (${swampPercent}%):`, totals.swampAmount]);
  }
  boqRows.push(['', '', '', '', '', '', `P&O (${poPercent}%):`, totals.poAmount]);
  boqRows.push(['', '', '', '', '', '', `VAT (${vatPercent}%):`, totals.vatAmount]);
  boqRows.push(['', '', '', '', '', '', 'GRAND TOTAL (NGN):', totals.grandTotal]);

  const wsBoq = XLSX.utils.aoa_to_sheet(boqRows);
  wsBoq['!cols'] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 22 },
    { wch: 50 },
    { wch: 8 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBoq, 'Bill of Quantities');

  // Tab 3: Material Procurement
  const matCalc = calculateMaterialBreakdown(safeItems);
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

  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Trigger file download in browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

/**
 * Main export function: tries server endpoint first, gracefully falls back to client-side XLSX
 */
export async function exportProjectToExcel(project: Project): Promise<void> {
  const items = project.items || [];
  if (items.length === 0) {
    throw new Error('Please add or detect at least one BOQ item before exporting.');
  }

  const safeTitle = (project.title || 'Project_BOQ').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeTitle}.xlsx`;

  const payload: ExportBoqOptions = {
    projectTitle: project.title || 'Let\'s Estimate BOQ',
    location: project.location || 'Nigeria',
    state: project.location || 'Nigeria',
    clientName: project.client_name || 'Private Client',
    poPercent: project.po_percent ?? 15,
    vatPercent: project.vat_percent ?? 7.5,
    swampPremiumPercent: project.swamp_premium_percent ?? 0,
    activeVersion: project.active_version || 'V1',
    items: items,
  };

  try {
    const response = await fetch('/api/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const blob = await response.blob();
      // Ensure binary excel content type
      const excelBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(excelBlob, filename);
      return;
    }
  } catch (err) {
    console.warn('Server Excel export failed, falling back to client-side XLSX generator:', err);
  }

  // Graceful fallback to client-side generation
  const clientBlob = generateClientXlsxBlob(payload);
  downloadBlob(clientBlob, filename);
}

/**
 * Export project to formal PDF
 */
export async function exportProjectToPdf(project: Project): Promise<void> {
  const items = project.items || [];
  if (items.length === 0) {
    throw new Error('Please add or detect at least one BOQ item before exporting.');
  }

  const safeTitle = (project.title || 'Project_BOQ').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeTitle}.pdf`;

  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectTitle: project.title,
      location: project.location,
      clientName: project.client_name,
      poPercent: project.po_percent,
      vatPercent: project.vat_percent,
      swampPremiumPercent: project.swamp_premium_percent,
      items: items,
    }),
  });

  if (!response.ok) {
    throw new Error('PDF export failed on server.');
  }

  const blob = await response.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  downloadBlob(pdfBlob, filename);
}
