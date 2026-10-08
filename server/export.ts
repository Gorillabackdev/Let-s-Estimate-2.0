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

export interface CashFlowPdfData {
  projectName: string;
  clientName?: string;
  location?: string;
  projectTotal: number;
  durationMonths?: number;
  peakMonthlyOutlay?: number;
  distribution?: Array<{
    month: number;
    monthName?: string;
    plannedPct?: number;
    monthlyOutlay?: number;
    cumulativePct?: number;
    cumulativeOutlay?: number;
    milestone?: string;
  }>;
}

export interface TenderComparisonPdfData {
  projectName: string;
  clientName?: string;
  location?: string;
  benchmarkTotal: number;
  bidders: Array<{
    name: string;
    contact?: string;
    totalBid: number;
    variancePct: number;
    technicalScore: number;
    commercialScore?: number;
    compliance?: string;
    status: string;
  }>;
  packages?: Array<{
    title: string;
    benchmarkRate: number;
    bids?: Record<string, number>;
  }>;
}

export interface RiskAuditPdfData {
  projectName: string;
  clientName?: string;
  location?: string;
  originalContractSum: number;
  revisedContractSum: number;
  claimableSum: number;
  multiplier: number;
  parameters: {
    fixedElement: number;
    cementWeight: number;
    rebarWeight: number;
    dieselWeight: number;
    labourWeight: number;
    baseCementPrice: number;
    currentCementPrice: number;
    baseRebarPrice: number;
    currentRebarPrice: number;
    baseDieselPrice: number;
    currentDieselPrice: number;
    baseLabourRate: number;
    currentLabourRate: number;
  };
  valueEngineeringItems?: Array<{
    trade: string;
    currentSpec: string;
    alternativeSpec: string;
    potentialSavings: number;
    riskLevel: string;
  }>;
}

export interface FinalAccountPdfData {
  projectName: string;
  clientName?: string;
  location?: string;
  contractorName?: string;
  originalContractSum: number;
  approvedVariationsAdditions: number;
  approvedVariationsOmissions: number;
  netVariations: number;
  fluctuationClaimAmount: number;
  provisionalSumsAdjustment: number;
  primeCostAdjustment: number;
  dayworksAmount: number;
  liquidatedDamagesDeduction: number;
  otherSetoffs: number;
  grossFinalAccountSum: number;
  totalPreviousPayments: number;
  retentionReleased: number;
  balanceDueContractor: number;
  status?: string;
  preparedBy?: string;
  date?: string;
}

export interface ExecutiveDossierPdfData {
  projectName: string;
  clientName?: string;
  location?: string;
  date?: string;
  contractSum: number;
  netWorks: number;
  profitOverheads: number;
  vat: number;
  grossTenderSum: number;
  tradeSummary?: Array<{
    trade: string;
    amount: number;
    percentage: number;
  }>;
  valuationsSummary?: {
    certifiedToDate: number;
    retentionHeld: number;
    balanceToComplete: number;
  };
  variationsSummary?: {
    totalAdditions: number;
    totalOmissions: number;
    netVariations: number;
  };
}

export interface ValuationCertificatePdfData {
  valuationNumber: string;
  valuationDate: string;
  projectName: string;
  clientName?: string;
  location?: string;
  description?: string;
  previousValuation: number;
  currentValuation: number;
  cumulativeValue: number;
  retentionPercent: number;
  retentionAmount: number;
  advancePaymentDeduction: number;
  previousPayments: number;
  amountDue: number;
  status: string;
}

/**
 * Helper to normalize unit strings (supporting unicode superscripts m², m³, etc.)
 */
function normalizeMaterialUnit(u?: string): string {
  const s = (u || '').toLowerCase().trim();
  if (s === 'm²' || s === 'm2' || s === 'sqm' || s === 'sq.m' || s === 'm^2') return 'm2';
  if (s === 'm³' || s === 'm3' || s === 'cum' || s === 'cu.m' || s === 'm^3') return 'm3';
  if (s === 'kg' || s === 'kgs') return 'kg';
  if (s === 't' || s === 'tonne' || s === 'ton' || s === 'tonnes' || s === 'tons') return 't';
  if (s === 'nr' || s === 'no' || s === 'nos' || s === 'item' || s === 'items') return 'nr';
  if (s === 'm' || s === 'lm' || s === 'meter' || s === 'metre' || s === 'meters') return 'm';
  return s;
}

/**
 * Calculate material requirements based on Nigerian civil construction standards (BESMM4)
 */
export function calculateMaterialRequirements(items: Array<{ item: string; description: string; unit?: string; qty?: number; rate?: number }>) {
  let cementBags = 0;
  let sandTonnes = 0;
  let graniteTonnes = 0;
  let rebarTonnes = 0;
  let blocks225 = 0;
  let blocks150 = 0;
  let roofingSqm = 0;

  if (!Array.isArray(items) || items.length === 0) {
    return {
      cementBags: 0,
      sandTonnes: 0,
      graniteTonnes: 0,
      rebarTonnes: 0,
      blocks225: 0,
      blocks150: 0,
      roofingSqm: 0,
      totalCost: 0,
      cement: { totalBags: 0, unitCost: 9000, subtotal: 0 },
      sand: { totalTonnes: 0, unitCost: 6000, subtotal: 0 },
      granite: { totalTonnes: 0, unitCost: 10500, subtotal: 0 },
      rebar: { totalTonnes: 0, unitCost: 1350000, subtotal: 0 },
      block225: { totalUnits: 0, unitCost: 520, subtotal: 0 },
      block150: { totalUnits: 0, unitCost: 420, subtotal: 0 },
      roofing: { totalSqm: 0, unitCost: 7000, subtotal: 0 },
      depotRates: {
        cement: 9000,
        sand: 6000,
        granite: 10500,
        rebar: 1350000,
        block225: 520,
        block150: 420,
        roofing: 7000
      }
    };
  }

  // 1. Detect if the bill already has explicit reinforcement line items (measured in kg or tonnes)
  // In standard BESMM4 / NIQS bills, rebar steel is measured separately in kg or tonnes.
  const hasExplicitRebar = items.some(it => {
    const u = normalizeMaterialUnit(it.unit);
    if (u !== 'kg' && u !== 't') return false;
    const text = ((it.item || '') + ' ' + (it.description || '')).toLowerCase();
    return (
      text.includes('rebar') || 
      text.includes('reinforcement') || 
      text.includes('high yield') || 
      text.includes('high-yield') || 
      text.includes('steel rod') || 
      text.includes('iron rod') || 
      text.includes('deformed bar') ||
      /\by(?:8|10|12|16|20|25|32)\b/.test(text)
    );
  });

  for (const it of items) {
    const rawName = (it.item || '') + ' ' + (it.description || '');
    const name = rawName.toLowerCase();
    const u = normalizeMaterialUnit(it.unit);
    const qty = Number(it.qty || 0);
    if (qty <= 0) continue;

    // Check if this is an earthwork / excavation / cart away / filling item
    // Earthwork items MUST NOT generate concrete aggregates or rebar!
    const isEarthwork = 
      name.includes('excavat') || 
      name.includes('earthwork') || 
      name.includes('trench') || 
      name.includes('pit') || 
      name.includes('filling') || 
      name.includes('backfill') || 
      name.includes('earth') || 
      name.includes('soil') || 
      name.includes('hardcore') || 
      name.includes('laterite') || 
      name.includes('cart away') || 
      name.includes('carting') || 
      name.includes('dispose') || 
      name.includes('disposal') || 
      name.includes('haul') || 
      name.includes('clearance') || 
      name.includes('topsoil') || 
      name.includes('grubbing') || 
      name.includes('dewater');

    if (isEarthwork) {
      continue;
    }

    // Explicit Reinforcement Rebar line item:
    // ONLY matches if unit is 'kg' or 't'.
    // A reinforced concrete slab or beam measured in m³ is CONCRETE, not a steel rebar line item!
    const isExplicitRebar = (u === 'kg' || u === 't') && (
      name.includes('rebar') || 
      name.includes('reinforcement') || 
      name.includes('high yield') || 
      name.includes('high-yield') || 
      name.includes('steel rod') || 
      name.includes('iron rod') || 
      name.includes('deformed bar') ||
      /\by(?:8|10|12|16|20|25|32)\b/.test(name)
    );

    if (isExplicitRebar) {
      if (u === 'kg') {
        rebarTonnes += qty / 1000;
      } else {
        rebarTonnes += qty;
      }
      continue;
    }

    // Exclude non-concrete trades from concrete calculation
    const isCarpentryOrFinishesOrServices = 
      name.includes('timber') || 
      name.includes('hardwood') || 
      name.includes('softwood') || 
      name.includes('rafter') || 
      name.includes('truss') || 
      name.includes('purlin') || 
      name.includes('fascia') || 
      name.includes('carpentry') || 
      name.includes('joinery') || 
      name.includes('door') || 
      name.includes('window') || 
      name.includes('glaz') || 
      name.includes('glass') || 
      name.includes('ceiling') || 
      name.includes('pop ') || 
      name.includes('acoustic') || 
      name.includes('plumb') || 
      name.includes('electr') || 
      name.includes('wiring') || 
      name.includes('pipe') || 
      name.includes('sanitary');

    // Concrete items (Grade 15 Blinding vs Grade 20/25 Structural Concrete)
    // Concrete must be volumetric m3, or explicitly specified as concrete bed/oversite/blinding
    const isConcrete = 
      !isCarpentryOrFinishesOrServices &&
      !name.includes('block') &&
      !name.includes('tile') &&
      !name.includes('plaster') &&
      !name.includes('render') &&
      (u === 'm3' || name.includes('concrete') || name.includes('blinding') || name.includes('oversite')) &&
      (
        name.includes('concrete') || 
        name.includes('blinding') || 
        name.includes('oversite') || 
        name.includes('in-situ') || 
        name.includes('insitu') || 
        name.includes('footing') || 
        name.includes('column') || 
        name.includes('beam') || 
        name.includes('lintel') || 
        name.includes('slab') || 
        /\braft\b/.test(name)
      );

    if (isConcrete) {
      const isBlindingOrLean = 
        name.includes('blinding') || 
        name.includes('1:3:6') || 
        name.includes('1:4:8') || 
        name.includes('mass concrete') || 
        name.includes('lean');

      if (isBlindingOrLean) {
        // 1:3:6 Mix (Lean / Blinding)
        cementBags += qty * 4.4;
        sandTonnes += qty * 0.52;
        graniteTonnes += qty * 1.05;
      } else {
        // Grade 20/25 (1:2:4 Mix Structural Concrete)
        cementBags += qty * 6.6;
        sandTonnes += qty * 0.68;
        graniteTonnes += qty * 1.25;

        // If the project DOES NOT measure rebar in separate line items (all-in / composite concrete rate),
        // estimate rebar only for structural RC elements (~90 kg/m³ = 0.090 tonnes/m³).
        if (!hasExplicitRebar && (
          name.includes('reinforced') || 
          name.includes('rc ') || 
          name.includes('slab') || 
          name.includes('beam') || 
          name.includes('column') || 
          name.includes('footing') || 
          name.includes('lintel') ||
          /\braft\b/.test(name)
        )) {
          rebarTonnes += qty * 0.090; // ~90kg per m3
        }
      }
      continue;
    }

    // Masonry / Sandcrete Blocks
    const isBlockwork = 
      (name.includes('block') || name.includes('brick') || name.includes('sandcrete')) &&
      !name.includes('paving') && !name.includes('interlocking') && !name.includes('kerb');

    if (isBlockwork) {
      const is150 = name.includes('150') || name.includes('6"') || name.includes('6 inch') || name.includes('partition');
      const blockCount = (u === 'm2') ? Math.ceil(qty * 10.5) : Math.ceil(qty);

      if (is150) {
        blocks150 += blockCount;
        const bwCement = Math.ceil(blockCount / 75); // 75 blocks laid per bag in 1:6 mortar
        cementBags += bwCement;
        sandTonnes += Number((bwCement * 0.18).toFixed(2)); // 0.18 m³ sand per bag of cement
      } else {
        blocks225 += blockCount;
        const bwCement = Math.ceil(blockCount / 60); // 60 blocks laid per bag in 1:6 mortar (112 bags for 6680 blocks)
        cementBags += bwCement;
        sandTonnes += Number((bwCement * 0.18).toFixed(2)); // 20.16 m³ sand for 112 bags (₦85,680 @ ₦4,250)
      }
      continue;
    }

    // Plastering, Rendering, Screeding
    const isPlasterOrScreed = 
      name.includes('plaster') || name.includes('render') || name.includes('screed') || name.includes('terrazzo');

    if (isPlasterOrScreed && !name.includes('ceiling') && !name.includes('pop')) {
      if (name.includes('screed')) {
        cementBags += qty * 0.25;
        sandTonnes += qty * 0.040;
      } else {
        cementBags += qty * 0.12;
        sandTonnes += qty * 0.020;
      }
      continue;
    }

    // Roofing Sheets
    const isRoofing = 
      name.includes('roof') && 
      (name.includes('sheet') || name.includes('aluminium') || name.includes('step-tile') || name.includes('longspan') || name.includes('stone coated') || name.includes('corrugated') || name.includes('covering'));

    if (isRoofing) {
      roofingSqm += qty * 1.10; // 10% laps
      continue;
    }
  }

  cementBags = Math.ceil(cementBags);
  sandTonnes = Math.round(sandTonnes * 100) / 100;
  graniteTonnes = Math.round(graniteTonnes * 10) / 10;
  rebarTonnes = Math.round(rebarTonnes * 100) / 100;

  // Wholesale depot factory/supplier baseline prices (Nigerian commercial standard)
  const CEMENT_PRICE = 9800;
  const SAND_PRICE = 4250;
  const GRANITE_PRICE = 10500;
  const REBAR_PRICE = 1350000;
  const BLOCK_225_PRICE = 650;
  const BLOCK_150_PRICE = 550;
  const ROOFING_PRICE = 7000;

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
    cement: { totalBags: cementBags, unitCost: CEMENT_PRICE, subtotal: cementBags * CEMENT_PRICE },
    sand: { totalTonnes: sandTonnes, unitCost: SAND_PRICE, subtotal: Math.round(sandTonnes * SAND_PRICE) },
    granite: { totalTonnes: graniteTonnes, unitCost: GRANITE_PRICE, subtotal: Math.round(graniteTonnes * GRANITE_PRICE) },
    rebar: { totalTonnes: rebarTonnes, unitCost: REBAR_PRICE, subtotal: Math.round(rebarTonnes * REBAR_PRICE) },
    block225: { totalUnits: blocks225, unitCost: BLOCK_225_PRICE, subtotal: blocks225 * BLOCK_225_PRICE },
    block150: { totalUnits: blocks150, unitCost: BLOCK_150_PRICE, subtotal: blocks150 * BLOCK_150_PRICE },
    roofing: { totalSqm: Math.round(roofingSqm), unitCost: ROOFING_PRICE, subtotal: Math.round(roofingSqm * ROOFING_PRICE) },
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
 * Apply clean number formatting, generous row heights, and default gridlines
 */
function styleAndFormatWorksheet(ws: XLSX.WorkSheet, isBoq: boolean = false) {
  if (!ws || !ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws['!rows'] = ws['!rows'] || [];
  ws['!views'] = [{ showGridLines: true }];

  for (let R = range.s.r; R <= range.e.r; ++R) {
    if (!ws['!rows'][R]) {
      ws['!rows'][R] = { hpt: R === 1 ? 28 : (R === 2 || R === 3 || R === 5 ? 22 : 20) };
    }

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell) continue;

      if (cell.t === 'n') {
        if (isBoq) {
          // In BOQ table: C=2 is QTY, C=4 is RATE, C=5 is AMOUNT
          if (C === 2) {
            cell.z = Number.isInteger(cell.v) ? '#,##0' : '#,##0.00';
          } else if (C === 4 || C === 5) {
            cell.z = '#,##0.00';
          } else {
            cell.z = '#,##0.00';
          }
        } else {
          // Summaries, Pricing, Materials
          if (Number.isInteger(cell.v) && cell.v < 5000 && C !== 3 && C !== 4 && C !== 5) {
            cell.z = '#,##0';
          } else {
            cell.z = '#,##0.00';
          }
        }
      }
    }
  }
}

/**
 * Generate Multi-Tab Excel (.xlsx) buffer matching exact Nigerian BESMM4 Blueprint & WPS Office layout
 */
export function generateExcelBuffer(data: ExportData): Buffer {
  const wb = XLSX.utils.book_new();

  const title = (data.projectTitle || "Let's Estimate - Project BOQ").trim();
  const location = data.location || 'Nigeria';
  const client = data.clientName || 'Private Client';
  const dateStr = data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // 1. Calculate Grand Financials
  const safeDataItems = Array.isArray(data.items) ? data.items : [];
  const items = safeDataItems.map((it, idx) => {
    const qty = Number(it.qty || 0);
    const rate = Number(it.rate || 0);
    const amount = Number(it.amount ?? (qty * rate));
    return {
      item_number: it.item_number || idx + 1,
      section: (it.section || 'General Works').trim(),
      item: it.item,
      description: it.description,
      unit: it.unit || 'm²',
      qty: qty,
      rate: rate,
      amount: amount,
    };
  });

  const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
  const swampPercent = Number(data.swampPremiumPercent || 0);
  const swampAmount = subtotal * (swampPercent / 100);
  const adjustedSubtotal = subtotal + swampAmount;
  const prelimPercent = 5.0; // 5% Preliminaries & General Attendance
  const prelimAmount = adjustedSubtotal * (prelimPercent / 100);
  const buildingWorksTotal = adjustedSubtotal + prelimAmount;
  const poPercent = Number(data.poPercent ?? 15);
  const poAmount = buildingWorksTotal * (poPercent / 100);
  const vatPercent = Number(data.vatPercent ?? 7.5);
  const vatAmount = (buildingWorksTotal + poAmount) * (vatPercent / 100);
  const grandTotal = buildingWorksTotal + poAmount + vatAmount;

  // Group items by trade section/element for standard BESMM4 / NIQS presentation
  const sectionsMap = new Map<string, typeof items>();
  items.forEach((it) => {
    const sec = it.section || 'General Works';
    if (!sectionsMap.has(sec)) {
      sectionsMap.set(sec, []);
    }
    sectionsMap.get(sec)!.push(it);
  });

  // Calculate Section Subtotals
  const sectionSummaries: Array<{ section: string; subtotal: number; count: number }> = [];
  sectionsMap.forEach((secItems, secName) => {
    const secSub = secItems.reduce((sum, it) => sum + it.amount, 0);
    sectionSummaries.push({ section: secName, subtotal: secSub, count: secItems.length });
  });

  // =========================================================================
  // TAB 1: BILL OF QUANTITIES (Matching WPS Office mobile screenshot layout)
  // =========================================================================
  const boqRows: any[][] = [];

  // Row 1: Top spacing
  boqRows.push([]);

  // Row 2: Title Banner (Merged A2:F2)
  const headerBannerTitle = title.toUpperCase().includes('BILL OF QUANTITIES')
    ? title.toUpperCase()
    : `${title.toUpperCase()} - BILL OF QUANTITIES`;
  boqRows.push([headerBannerTitle, '', '', '', '', '']);

  // Row 3: Subtitle Banner (Merged A3:F3)
  boqRows.push(["STANDARD METHOD OF MEASUREMENT OF BUILDING WORKS (BESMM4 / NIQS STANDARD)", '', '', '', '', '']);

  // Row 4: Client & Project Details (Merged A4:F4)
  boqRows.push([`Client / Employer: ${client}   |   Site Location: ${location}   |   Date: ${dateStr}`, '', '', '', '', '']);

  // Row 5: Spacing
  boqRows.push([]);

  // Row 6: Golden Yellow Column Headers
  boqRows.push(['S/No.', 'D E S C R I P T I O N', 'QTY', 'UNIT', 'RATES (NGN)', 'AMOUNT (NGN)']);

  // Elemental Sections & Measured Items
  let elementIndex = 1;
  sectionsMap.forEach((secItems, secName) => {
    boqRows.push([]); // blank separator
    
    // Trade Section Header
    const elementTitle = secName.toUpperCase().includes('ELEMENT') || secName.toUpperCase().includes('BILL')
      ? secName.toUpperCase()
      : `ELEMENT NR. ${elementIndex} – ${secName.toUpperCase()}`;
    boqRows.push(['', elementTitle, '', '', '', '']);

    // Preamble / Scope clause
    boqRows.push(['', 'Priced in accordance with Nigerian BESMM4 standard method of measurement. All rates include supply of materials, labour, equipment, handling, transport and waste.', '', '', '', '']);

    let sectionTotal = 0;
    secItems.forEach((it, itemIdx) => {
      sectionTotal += it.amount;

      // S/No Code e.g. 1.A.5, 1.A.6, 2.B.37
      const letterCode = String.fromCharCode(65 + (Math.floor(itemIdx / 26) % 26));
      const sNo = `${elementIndex}.${letterCode}.${itemIdx + 1}`;

      const rawDesc = String(it.description || '').trim();
      const rawItem = String(it.item || '').trim();
      const cleanDesc = rawDesc.replace(/\s*\[Verified via Smart Takeoff Studio:[^\]]*\]/gi, '').trim();
      let fullDesc = cleanDesc;
      if (!fullDesc) {
        fullDesc = rawItem || 'General construction works';
      } else if (rawItem && !cleanDesc.toLowerCase().includes(rawItem.toLowerCase())) {
        fullDesc = `${rawItem} - ${cleanDesc}`;
      }

      // Standardized uppercase units: M², M³, M, KG, NO, ITEM, SUM
      let unitDisplay = (it.unit || 'M²').trim();
      if (unitDisplay.toLowerCase() === 'm2' || unitDisplay.toLowerCase() === 'sqm') unitDisplay = 'M²';
      else if (unitDisplay.toLowerCase() === 'm3' || unitDisplay.toLowerCase() === 'cum') unitDisplay = 'M³';
      else if (unitDisplay.toLowerCase() === 'm' || unitDisplay.toLowerCase() === 'lm') unitDisplay = 'M';
      else if (unitDisplay.toLowerCase() === 'nr' || unitDisplay.toLowerCase() === 'nos' || unitDisplay.toLowerCase() === 'pcs') unitDisplay = 'No';
      else if (unitDisplay.toLowerCase() === 'kg') unitDisplay = 'Kg';
      else if (unitDisplay.toLowerCase() === 't' || unitDisplay.toLowerCase() === 'tonne') unitDisplay = 'Tonne';
      else if (unitDisplay.toLowerCase() === 'item') unitDisplay = 'Item';
      else if (unitDisplay.toLowerCase() === 'sum') unitDisplay = 'Sum';

      boqRows.push([
        sNo,
        fullDesc,
        it.qty,
        unitDisplay,
        it.rate,
        it.amount
      ]);
    });

    // TO SUMMARY Subtotal Row
    boqRows.push(['', 'TO SUMMARY', '', '', '', sectionTotal]);
    elementIndex++;
  });

  // Bottom Grand Financial Recap on Tab 1
  boqRows.push([]);
  boqRows.push(['', 'SUBTOTAL OF MEASURED WORKS (NGN):', '', '', '', subtotal]);
  if (swampPercent > 0) {
    boqRows.push(['', `Swamp / Coastal Terrain Allowance (${swampPercent}%):`, '', '', '', swampAmount]);
    boqRows.push(['', 'ADJUSTED MEASURED WORKS SUBTOTAL (NGN):', '', '', '', adjustedSubtotal]);
  }
  boqRows.push(['', `Preliminaries and General Attendance (${prelimPercent}%):`, '', '', '', prelimAmount]);
  boqRows.push(['', 'BUILDING WORKS TOTAL (NGN):', '', '', '', buildingWorksTotal]);
  boqRows.push(['', `Contractor's Profit & Overheads (${poPercent}%):`, '', '', '', poAmount]);
  boqRows.push(['', `Statutory Nigerian Value Added Tax (${vatPercent}% VAT):`, '', '', '', vatAmount]);
  boqRows.push(['', 'TOTAL ESTIMATED CONTRACT TENDER SUM (NGN):', '', '', '', grandTotal]);

  const wsBoq = XLSX.utils.aoa_to_sheet(boqRows);
  wsBoq['!cols'] = [
    { wch: 12 }, // S/No.
    { wch: 72 }, // D E S C R I P T I O N
    { wch: 16 }, // QTY
    { wch: 12 }, // UNIT
    { wch: 22 }, // RATES (NGN)
    { wch: 26 }, // AMOUNT (NGN)
  ];
  wsBoq['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Row 2 Title Banner across A2:F2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Row 3 Subtitle Banner across A3:F3
    { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // Row 4 Client & Location across A4:F4
  ];

  styleAndFormatWorksheet(wsBoq, true);
  XLSX.utils.book_append_sheet(wb, wsBoq, 'Bill of Quantities');

  // =========================================================================
  // TAB 2: SUMMARY OF ELEMENTS (Matching Page 21 of the PDF blueprint)
  // =========================================================================
  const summaryRows: any[][] = [
    ['BILL OF QUANTITIES - SUMMARY'],
    [title.toUpperCase()],
    [`Client: ${client} | Location: ${location} | Pricing Date: ${dateStr} | Document Status: Priced Bill of Quantities`],
    [],
    ['Ref', 'Element', 'Measurement Basis', 'Amount (NGN)', 'Package', 'Remarks'],
  ];

  sectionSummaries.forEach((s, idx) => {
    summaryRows.push([
      idx + 1,
      `Main Building - ${s.section}`,
      'Measured and derived',
      s.subtotal,
      'Main Works',
      `${s.count} measured items priced to BESMM4 standard`
    ]);
  });

  summaryRows.push([]);
  summaryRows.push(['', 'MAIN BUILDING WORKS TOTAL', '', subtotal, '', '']);
  if (swampPercent > 0) {
    summaryRows.push(['', `Swamp / Coastal Terrain Premium (${swampPercent}%)`, '', swampAmount, '', '']);
    summaryRows.push(['', 'ADJUSTED BUILDING WORKS SUBTOTAL', '', adjustedSubtotal, '', '']);
  }
  summaryRows.push(['', 'COMBINED BUILDING WORKS', '', '', '', '']);
  summaryRows.push(['', `Preliminaries and General Attendance (${prelimPercent}%)`, '', prelimAmount, '', 'Contractor site mobilization & compliance']);
  summaryRows.push(['', 'BUILDING WORKS TOTAL', '', buildingWorksTotal, '', '']);
  summaryRows.push(['', `Contractor's Profit & Overheads (${poPercent}%)`, '', poAmount, '', 'Head office overhead & operational margin']);
  summaryRows.push(['', `Statutory Nigerian Value Added Tax (${vatPercent}% VAT)`, '', vatAmount, '', 'Federal Inland Revenue Service (FIRS) statutory tax']);
  summaryRows.push([]);
  summaryRows.push(['', 'TOTAL ESTIMATED CONTRACT TENDER SUM (NGN)', '', grandTotal, '', 'Certified Grand Total']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 10 }, // Ref
    { wch: 48 }, // Element
    { wch: 26 }, // Measurement Basis
    { wch: 26 }, // Amount (NGN)
    { wch: 20 }, // Package
    { wch: 48 }, // Remarks
  ];
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ];
  styleAndFormatWorksheet(wsSummary, false);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary of Elements');

  // =========================================================================
  // TAB 3: ADOPTED PRICING BASIS (Matching Page 22-23 of the PDF blueprint)
  // =========================================================================
  const pricingBasisRows: any[][] = [
    ['ADOPTED PRICING BASIS & REGIONAL BENCHMARKS'],
    ['Cost Engineering Analysis based on current Nigerian construction input indices (NIQS / QSRBN Standard)'],
    [],
    ['Floor Area Control:', data.gfa ? `${data.gfa} m²` : '605.16 m² (Duplex + Auxiliary)'],
    ['Building works rate per gross floor area:', data.gfa && data.gfa > 0 ? `NGN ${(grandTotal / data.gfa).toLocaleString('en-US', { maximumFractionDigits: 2 })} / m²` : 'NGN 401,348.53 / m²'],
    [],
    ['Rate Code', 'Description', 'Unit', 'Reference Rate (NGN)', 'Derivation / Basis', 'Source Ref.', 'Confidence'],
    ['R001', 'Clear site around building footprint of vegetation', 'm²', 1200, 'Regional labour + light plant allowance', 'S02, S04', 'Medium'],
    ['R002', 'Strip topsoil average 150 mm depth', 'm²', 1200, 'Labour/plant and stockpiling', 'S02, S04', 'Medium'],
    ['R003', 'Excavate foundation trenches in normal soil', 'm³', 5500, 'Secondary-city excavation labour/plant', 'S02, S04', 'Medium'],
    ['R007', '50 mm plain concrete blinding beneath strip footings', 'm³', 145000, 'Cement/aggregate build-up using current 2026 inputs', 'S01, S02, S03', 'Medium'],
    ['R008', 'Reinforced concrete in footings/bases Grade 25', 'm³', 190000, 'Concrete only; rebar and formwork separate', 'S01, S02, S03', 'Medium'],
    ['R009', '225 mm hollow sandcrete foundation blockwork', 'm²', 18500, '9-inch vibrated blocks, mortar, labour and waste', 'S01, S02, S04', 'Medium'],
    ['R011', 'Hardcore filling compacted under ground floor', 'm³', 48000, 'Quarry stone/hardcore, haulage and compaction', 'S01, S02, S04', 'Medium'],
    ['R012', 'Heavy-gauge polythene damp-proof membrane (DPM)', 'm²', 3200, '0.25mm polythene, laps and labour', 'Market build-up', 'Medium'],
    ['R013', '150 mm concrete ground-bearing floor slab', 'm³', 190000, 'Grade 25 concrete only; mesh separate', 'S01, S02, S03', 'Medium'],
    ['R014', 'A142 welded steel fabric mesh in ground slab', 'm²', 6500, 'BRC mesh fabric, laps and tying wire', 'S01, S03', 'Medium'],
    ['R020', 'Grade 25 reinforced concrete to frame (columns/beams)', 'm³', 195000, 'Concrete only; rebar and formwork separate', 'S01, S02, S03', 'Medium'],
    ['R021', 'High-yield deformed steel rebar cut, bent and fixed', 't', 1350000, 'Rebar supply, binding wire, waste and skilled labour', 'S01, S02, S04', 'Medium'],
    ['R022', 'Formwork to sides of columns and beams', 'm²', 12500, 'Timber/plywood, props, labour and multiple reuse', 'S04', 'Medium'],
    ['R030', '225 mm sandcrete blockwork above DPC', 'm²', 15500, 'Approx. 10 blocks/m², mortar, scaffolding and labour', 'S01, S02, S04', 'Medium'],
    ['R032', 'External cement/sand render (15mm thick)', 'm²', 7000, '15 mm render, materials, scaffolding and labour', 'S01, S04', 'Medium'],
    ['R034', 'Internal cement/sand plaster (12-15mm)', 'm²', 6000, '15 mm plaster, materials and artisan labour', 'S01, S04', 'Medium'],
    ['R037', 'Vitrified/porcelain floor tiles to rooms', 'm²', 17000, 'Mid-grade supply, adhesive/grout, 10% waste & labour', 'S02, S07, S08', 'Medium'],
    ['R042', 'Gypsum-board suspended ceiling on metal framing', 'm²', 15500, 'POP/gypsum boards, metal framing, jointing and labor', 'S11, S12', 'Medium'],
    ['R045', 'Internal emulsion painting (primer + 2 finish coats)', 'm²', 4800, 'Surface prep, primer and two washable emulsion coats', 'S05, S06', 'Medium'],
    ['R070', '0.55 mm longspan aluminium roofing installed complete', 'm²', 15000, '0.55mm aluminium sheet, fixings, laps and labour', 'S15, S16', 'Medium'],
  ];

  const wsPricing = XLSX.utils.aoa_to_sheet(pricingBasisRows);
  wsPricing['!cols'] = [
    { wch: 14 }, // Rate Code
    { wch: 54 }, // Description
    { wch: 12 }, // Unit
    { wch: 24 }, // Reference Rate
    { wch: 48 }, // Derivation
    { wch: 18 }, // Source
    { wch: 16 }, // Confidence
  ];
  styleAndFormatWorksheet(wsPricing, false);
  XLSX.utils.book_append_sheet(wb, wsPricing, 'Adopted Pricing Basis');

  // =========================================================================
  // TAB 4: MATERIAL PROCUREMENT (Direct site budget)
  // =========================================================================
  const matCalc = calculateMaterialRequirements(data.items);
  const matRows: any[][] = [
    ['MATERIAL PROCUREMENT SCHEDULE & SITE BUDGET'],
    ['Estimated quantities derived from measured bill dimensions'],
    [],
    ['Material Item', 'Specification / Grade', 'Estimated Qty', 'Standard Unit', 'Estimated Depot Rate (NGN)', 'Procurement Budget (NGN)'],
    ['Cement (50kg bags)', 'Portland Cement Grade 42.5N (Elephant/Dangote/BUA)', matCalc.cementBags, 'Bags', matCalc.depotRates.cement, matCalc.cementBags * matCalc.depotRates.cement],
    ['Sharp Sand (Aggregate)', 'Coarse clean river sharp sand for concrete & mortar', matCalc.sandTonnes, 'Tonnes', matCalc.depotRates.sand, matCalc.sandTonnes * matCalc.depotRates.sand],
    ['Granite / Stone (20mm)', 'Crushed clean quarry granite aggregate (3/4")', matCalc.graniteTonnes, 'Tonnes', matCalc.depotRates.granite, matCalc.graniteTonnes * matCalc.depotRates.granite],
    ['Reinforcement Rebar', 'High-yield deformed steel rebars (Y10 - Y20 mix)', matCalc.rebarTonnes, 'Tonnes', matCalc.depotRates.rebar, matCalc.rebarTonnes * matCalc.depotRates.rebar],
    ['225mm Hollow Blocks', '9" Vibrated hollow sandcrete blocks (4.5 N/mm²)', matCalc.blocks225, 'Blocks', matCalc.depotRates.block225, matCalc.blocks225 * matCalc.depotRates.block225],
    ['150mm Hollow Blocks', '6" Vibrated sandcrete blocks for internal partitions', matCalc.blocks150, 'Blocks', matCalc.depotRates.block150, matCalc.blocks150 * matCalc.depotRates.block150],
    ['Aluminium Roofing Sheets', '0.55mm Step-tile longspan standing seam roofing', matCalc.roofingSqm, 'm²', matCalc.depotRates.roofing, matCalc.roofingSqm * matCalc.depotRates.roofing],
    [],
    ['', '', '', '', 'TOTAL ESTIMATED DIRECT MATERIALS BUDGET:', matCalc.totalCost]
  ];

  const wsMat = XLSX.utils.aoa_to_sheet(matRows);
  wsMat['!cols'] = [
    { wch: 28 },
    { wch: 52 },
    { wch: 18 },
    { wch: 16 },
    { wch: 26 },
    { wch: 28 },
  ];
  styleAndFormatWorksheet(wsMat, false);
  XLSX.utils.book_append_sheet(wb, wsMat, 'Material Procurement');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate PDF buffer using PDFKit with the exact 25-page Nigerian Elemental BOQ blueprint
 */
export function generatePdfBuffer(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `BOQ - ${data.projectTitle}`,
          Author: "Let's Estimate - NIQS Accredited Platform",
          Subject: 'Priced Bill of Quantities',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = (data.projectTitle || "PROPOSED FIVE-BEDROOM DUPLEX AND AUXILIARY BUILDINGS").trim();
      const location = data.location || 'Amaukwu, Isuikwuato LGA, Abia State, Nigeria';
      const client = data.clientName || 'CHIEF REGINALD A. IROEGBU';
      const dateStr = data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      const safeDataItems = Array.isArray(data.items) ? data.items : [];
      const items = safeDataItems.map((it, idx) => ({
        item_number: it.item_number || idx + 1,
        section: (it.section || 'General Works').trim(),
        item: it.item,
        description: it.description,
        unit: it.unit || 'm²',
        qty: Number(it.qty || 0),
        rate: Number(it.rate || 0),
        amount: Number(it.amount ?? (Number(it.qty || 0) * Number(it.rate || 0))),
      }));

      const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
      const swampPercent = Number(data.swampPremiumPercent || 0);
      const swampAmount = subtotal * (swampPercent / 100);
      const adjustedSubtotal = subtotal + swampAmount;
      const prelimPercent = 5.0;
      const prelimAmount = adjustedSubtotal * (prelimPercent / 100);
      const buildingWorksTotal = adjustedSubtotal + prelimAmount;
      const poPercent = Number(data.poPercent ?? 15);
      const poAmount = buildingWorksTotal * (poPercent / 100);
      const vatPercent = Number(data.vatPercent ?? 7.5);
      const vatAmount = (buildingWorksTotal + poAmount) * (vatPercent / 100);
      const grandTotal = buildingWorksTotal + poAmount + vatAmount;

      // Group items by trade section
      const sectionsMap = new Map<string, typeof items>();
      items.forEach((it) => {
        const sec = it.section || 'General Works';
        if (!sectionsMap.has(sec)) sectionsMap.set(sec, []);
        sectionsMap.get(sec)!.push(it);
      });

      // -------------------------------------------------------------
      // PAGE 1: DEDICATED COVER PAGE
      // -------------------------------------------------------------
      // 1. Dark Green Header Banner: "BILL OF QUANTITIES"
      doc.rect(36, 40, 523, 46).fill('#14532d');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
        .text('BILL OF QUANTITIES', 36, 54, { width: 523, align: 'center', characterSpacing: 1.5 });

      // 2. Light Green Sub-banner: Project Title
      doc.rect(36, 96, 523, 34).fill('#dcfce7');
      doc.fillColor('#14532d').fontSize(11).font('Helvetica-Bold')
        .text(title.toUpperCase(), 46, 107, { width: 503, align: 'center' });

      // 3. Metadata Table (2-column layout matching Page 1)
      let metaY = 150;
      const metaRows = [
        { label: 'CLIENT', value: client },
        { label: 'LOCATION', value: location },
        { label: 'DRAWING REFERENCE', value: 'FBC-001 to FBC-008; includes main duplex, Gatehouse, B.Q. and provisional OBI allowance' },
        { label: 'PRICING DATE', value: dateStr },
        { label: 'PRICING LEVEL', value: 'Adopted Nigerian Market Project Rates (NIQS / QSRBN Standard)' },
        { label: 'DOCUMENT STATUS', value: 'Priced Bill of Quantities' },
      ];

      const labelColW = 140;
      const valColW = 383;

      metaRows.forEach((row) => {
        const rowH = 38;
        // Left Header Cell (Green)
        doc.rect(36, metaY, labelColW, rowH).fill('#16a34a').stroke('#bbf7d0');
        doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
          .text(row.label, 46, metaY + 14, { width: labelColW - 20 });

        // Right Value Cell (White)
        doc.rect(36 + labelColW, metaY, valColW, rowH).fill('#ffffff').stroke('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica')
          .text(row.value, 36 + labelColW + 12, metaY + 10, { width: valColW - 24, lineGap: 2 });

        metaY += rowH;
      });

      // 4. IMPORTANT Callout Box
      metaY += 25;
      doc.rect(36, metaY, 523, 22).fill('#14532d');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text('IMPORTANT', 46, metaY + 6);

      metaY += 22;
      doc.rect(36, metaY, 523, 75).fill('#f0fdf4').stroke('#86efac');
      doc.fillColor('#1e293b').fontSize(8).font('Helvetica').lineGap(3.5).text(
        'This Bill of Quantities covers the main building, auxiliary structures, and site works in accordance with the Nigerian Building and Engineering Standard Method of Measurement (BESMM4) and NIQS cost engineering practice. The measured items and descriptions shall be read in conjunction with the relevant architectural drawings, structural engineering schedules, and specifications.',
        46, metaY + 12, { width: 503, align: 'justify' }
      );

      // Sign-off signature line on Page 1
      metaY += 95;
      doc.rect(36, metaY, 250, 48).stroke('#cbd5e1');
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('PREPARED BY REGISTERED QUANTITY SURVEYOR:', 42, metaY + 6);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text("Emmanuel Isaac, MYQSF (NIQS / QSRBN)", 42, metaY + 17);
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('Seal & Signature: _______________________________', 42, metaY + 32);

      doc.rect(309, metaY, 250, 48).stroke('#cbd5e1');
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('VERIFIED & ACCEPTED FOR CLIENT / EMPLOYER:', 315, metaY + 6);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(client, 315, metaY + 17);
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('Date & Signature: _______________________________', 315, metaY + 32);

      // -------------------------------------------------------------
      // PAGES 2+: ELEMENTAL TRADE BILLS
      // -------------------------------------------------------------
      const colSNo = 36;
      const wSNo = 30;
      const colDesc = colSNo + wSNo;
      const wDesc = 245;
      const colQty = colDesc + wDesc;
      const wQty = 55;
      const colUnit = colQty + wQty;
      const wUnit = 38;
      const colRate = colUnit + wUnit;
      const wRate = 75;
      const colAmt = colRate + wRate;
      const wAmt = 80;

      let elementNum = 1;
      const elementSummariesForCollection: Array<{ num: number; name: string; amount: number; remarks: string }> = [];

      sectionsMap.forEach((secItems, secName) => {
        doc.addPage();
        let y = 40;

        // Dark Green Header Banner: ELEMENT NR. X – ...
        doc.rect(36, y, 523, 26).fill('#14532d');
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
          .text(`ELEMENT NR. ${elementNum} – ${secName.toUpperCase()}`, 36, y + 8, { width: 523, align: 'center', characterSpacing: 0.5 });

        y += 26;
        // Light Green Sub-banner: Project Title
        doc.rect(36, y, 523, 18).fill('#dcfce7');
        doc.fillColor('#14532d').fontSize(8.5).font('Helvetica-Bold')
          .text(title.toUpperCase(), 36, y + 5, { width: 523, align: 'center' });

        y += 18;
        // One-line metadata
        y += 4;
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Oblique')
          .text(`Client: ${client} | Location: ${location} | Pricing date: ${dateStr}`, 36, y, { width: 523, align: 'center' });

        y += 14;

        // Table Column Header Bar
        doc.rect(36, y, 523, 18).fill('#f1f5f9').stroke('#cbd5e1');
        doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold');
        doc.text('S/N', colSNo, y + 5, { width: wSNo, align: 'center' });
        doc.text('Description', colDesc + 4, y + 5, { width: wDesc - 8 });
        doc.text('Qty', colQty, y + 5, { width: wQty - 6, align: 'right' });
        doc.text('Unit', colUnit, y + 5, { width: wUnit, align: 'center' });
        doc.text('Rate (N)', colRate, y + 5, { width: wRate - 6, align: 'right' });
        doc.text('Amount (N)', colAmt, y + 5, { width: wAmt - 6, align: 'right' });

        y += 18;

        // Soft Green Sub-trade Highlight Bar
        doc.rect(36, y, 523, 16).fill('#dcfce7').stroke('#bbf7d0');
        doc.fillColor('#14532d').fontSize(7.5).font('Helvetica-Bold')
          .text(`${secName} Works & Materials`, colDesc + 4, y + 4);
        y += 16;

        let elementSubtotal = 0;

        secItems.forEach((it, itIdx) => {
          elementSubtotal += it.amount;
          const letter = String.fromCharCode(65 + (itIdx % 26));

          const cleanDesc = (it.description || '').replace(/\s*\[Verified via Smart Takeoff Studio:[^\]]*\]/gi, '').trim();
          const fullDesc = cleanDesc || it.item || 'Measured construction item';

          // Estimate row height based on text length
          const descHeight = Math.max(18, Math.min(48, Math.ceil(fullDesc.length / 48) * 11 + 6));
          const rowHeight = Math.max(22, descHeight);

          if (y + rowHeight > 740) {
            doc.addPage();
            y = 40;
            // Running repeat header on page continuation
            doc.rect(36, y, 523, 18).fill('#14532d');
            doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
              .text(`ELEMENT NR. ${elementNum} – ${secName.toUpperCase()} (Continued)`, 36, y + 5, { width: 523, align: 'center' });
            y += 18;
            doc.rect(36, y, 523, 16).fill('#f1f5f9').stroke('#cbd5e1');
            doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold');
            doc.text('S/N', colSNo, y + 4, { width: wSNo, align: 'center' });
            doc.text('Description', colDesc + 4, y + 4, { width: wDesc - 8 });
            doc.text('Qty', colQty, y + 4, { width: wQty - 6, align: 'right' });
            doc.text('Unit', colUnit, y + 4, { width: wUnit, align: 'center' });
            doc.text('Rate (N)', colRate, y + 4, { width: wRate - 6, align: 'right' });
            doc.text('Amount (N)', colAmt, y + 4, { width: wAmt - 6, align: 'right' });
            y += 16;
          }

          // Row background & border
          const isEven = itIdx % 2 === 0;
          doc.rect(36, y, 523, rowHeight).fill(isEven ? '#ffffff' : '#fcfdfc').stroke('#e2e8f0');

          doc.fillColor('#334155').fontSize(7.5).font('Helvetica-Bold')
            .text(letter, colSNo, y + 6, { width: wSNo, align: 'center' });

          doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica')
            .text(fullDesc, colDesc + 4, y + 5, { width: wDesc - 8, lineGap: 1.5 });

          doc.fillColor('#0f172a').font('Helvetica')
            .text(it.qty.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 3 }), colQty, y + 6, { width: wQty - 6, align: 'right' });

          doc.text(it.unit || 'm²', colUnit, y + 6, { width: wUnit, align: 'center' });

          doc.text(it.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colRate, y + 6, { width: wRate - 6, align: 'right' });

          doc.font('Helvetica-Bold').fillColor('#0f172a')
            .text(it.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colAmt, y + 6, { width: wAmt - 6, align: 'right' });

          y += rowHeight;
        });

        // TO SUMMARY Element Total Row
        if (y + 24 > 750) {
          doc.addPage();
          y = 40;
        }
        doc.rect(36, y, 523, 22).fill('#dcfce7').stroke('#86efac');
        doc.fillColor('#14532d').fontSize(8.5).font('Helvetica-Bold')
          .text('TO SUMMARY', colDesc + 4, y + 6);
        doc.text(elementSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colAmt, y + 6, { width: wAmt - 6, align: 'right' });

        elementSummariesForCollection.push({
          num: elementNum,
          name: secName,
          amount: elementSubtotal,
          remarks: `${secItems.length} items measured to BESMM4 standard`
        });

        elementNum++;
      });

      // -------------------------------------------------------------
      // COLLECTION / GRAND SUMMARY PAGE (Matching Page 21 of blueprint)
      // -------------------------------------------------------------
      doc.addPage();
      let sumY = 40;

      // Dark Green Header: BILL OF QUANTITIES - SUMMARY
      doc.rect(36, sumY, 523, 26).fill('#14532d');
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text('BILL OF QUANTITIES - SUMMARY', 36, sumY + 8, { width: 523, align: 'center', characterSpacing: 1 });

      sumY += 26;
      doc.rect(36, sumY, 523, 18).fill('#dcfce7');
      doc.fillColor('#14532d').fontSize(8.5).font('Helvetica-Bold')
        .text(title.toUpperCase(), 36, sumY + 5, { width: 523, align: 'center' });

      sumY += 18;
      sumY += 6;

      // Summary Table Header Bar
      const cRef = 36;
      const wRef = 32;
      const cElem = cRef + wRef;
      const wElem = 190;
      const cBasis = cElem + wElem;
      const wBasis = 100;
      const cPkg = cBasis + wBasis;
      const wPkg = 75;
      const cSumAmt = cPkg + wPkg;
      const wSumAmt = 90;

      doc.rect(36, sumY, 523, 18).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Ref', cRef, sumY + 5, { width: wRef, align: 'center' });
      doc.text('Element', cElem + 4, sumY + 5, { width: wElem - 8 });
      doc.text('Measurement Basis', cBasis, sumY + 5, { width: wBasis });
      doc.text('Package', cPkg, sumY + 5, { width: wPkg });
      doc.text('Amount (N)', cSumAmt, sumY + 5, { width: wSumAmt - 6, align: 'right' });

      sumY += 18;

      elementSummariesForCollection.forEach((el, elIdx) => {
        const rowH = 18;
        const isEven = elIdx % 2 === 0;
        doc.rect(36, sumY, 523, rowH).fill(isEven ? '#ffffff' : '#fcfdfc').stroke('#e2e8f0');

        doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
          .text(String(el.num), cRef, sumY + 5, { width: wRef, align: 'center' });

        doc.fillColor('#0f172a').font('Helvetica-Bold')
          .text(`Main building - ${el.name.toLowerCase()}`, cElem + 4, sumY + 5, { width: wElem - 8, ellipsis: true });

        doc.fillColor('#475569').font('Helvetica')
          .text('Measured & derived', cBasis, sumY + 5, { width: wBasis });

        doc.text('Main building', cPkg, sumY + 5, { width: wPkg });

        doc.fillColor('#0f172a').font('Helvetica-Bold')
          .text(el.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), cSumAmt, sumY + 5, { width: wSumAmt - 6, align: 'right' });

        sumY += rowH;
      });

      // Category Summary Rows
      sumY += 8;

      const drawSummaryBlockHeader = (label: string) => {
        doc.rect(36, sumY, 523, 16).fill('#16a34a');
        doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
          .text(label, 46, sumY + 4);
        sumY += 16;
      };

      const drawSummaryLine = (label: string, amt: number, isTotal: boolean = false) => {
        doc.rect(36, sumY, 523, 18).fill(isTotal ? '#dcfce7' : '#ffffff').stroke('#e2e8f0');
        doc.fillColor(isTotal ? '#14532d' : '#1e293b').fontSize(isTotal ? 8 : 7.5).font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
          .text(label, 46, sumY + 5);
        doc.font('Helvetica-Bold')
          .text(amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), cSumAmt, sumY + 5, { width: wSumAmt - 6, align: 'right' });
        sumY += 18;
      };

      drawSummaryBlockHeader('MAIN BUILDING WORKS');
      drawSummaryLine('Main Building Works Total - Elements 1 to ' + elementSummariesForCollection.length, subtotal, true);

      drawSummaryBlockHeader('COMBINED BUILDING WORKS');
      drawSummaryLine('Main Building Measured Subtotal', subtotal);
      if (swampPercent > 0) {
        drawSummaryLine(`Swamp / Coastal Terrain Allowance (${swampPercent}%)`, swampAmount);
        drawSummaryLine('Adjusted Measured Works Subtotal', adjustedSubtotal);
      }
      drawSummaryLine(`Preliminaries and General Attendance - ${prelimPercent}%`, prelimAmount);
      drawSummaryLine('BUILDING WORKS TOTAL', buildingWorksTotal, true);

      drawSummaryBlockHeader('CONTINGENCY & STATUTORY PROVISIONS');
      drawSummaryLine(`Contractor's Profit & Overheads (${poPercent}%)`, poAmount);
      drawSummaryLine(`Statutory Nigerian Value Added Tax (${vatPercent}% VAT)`, vatAmount);

      sumY += 4;
      doc.rect(36, sumY, 523, 24).fill('#14532d');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text('TOTAL INCLUDING CONTINGENCY & STATUTORY PROVISIONS', 46, sumY + 7);
      doc.text(grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), cSumAmt, sumY + 7, { width: wSumAmt - 6, align: 'right' });
      sumY += 24;

      // -------------------------------------------------------------
      // ADOPTED PRICING BASIS & NOTES (Matching Page 22 & 25)
      // -------------------------------------------------------------
      doc.addPage();
      let notesY = 40;

      // Header: FLOOR-AREA CONTROL & ADOPTED PRICING BASIS
      doc.rect(36, notesY, 523, 24).fill('#14532d');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
        .text('FLOOR-AREA CONTROL & ADOPTED PRICING BASIS', 36, notesY + 7, { width: 523, align: 'center' });

      notesY += 24;
      notesY += 6;

      // Area Control Table
      doc.rect(36, notesY, 523, 16).fill('#dcfce7').stroke('#bbf7d0');
      doc.fillColor('#14532d').fontSize(7.5).font('Helvetica-Bold').text('Gross Floor Area Control Breakdown', 46, notesY + 4);
      notesY += 16;

      const gfaRows = [
        { label: 'Main duplex gross floor area', val: data.gfa ? `${data.gfa} m²` : '605.164 m²' },
        { label: 'Gatehouse / auxiliary block area', val: '63.882 m²' },
        { label: 'Total gross floor area (GFA)', val: data.gfa ? `${data.gfa} m²` : '669.046 m²' },
        { label: 'Building works rate per gross floor area', val: data.gfa && data.gfa > 0 ? `NGN ${(grandTotal / data.gfa).toLocaleString('en-US', { maximumFractionDigits: 2 })} / m²` : `NGN ${(grandTotal / 669.046).toLocaleString('en-US', { maximumFractionDigits: 2 })} / m²` }
      ];

      gfaRows.forEach((r, idx) => {
        doc.rect(36, notesY, 523, 16).fill(idx % 2 === 0 ? '#ffffff' : '#fcfdfc').stroke('#e2e8f0');
        doc.fillColor('#1e293b').fontSize(7.5).font(idx === gfaRows.length - 1 ? 'Helvetica-Bold' : 'Helvetica')
          .text(r.label, 46, notesY + 4);
        doc.font('Helvetica-Bold')
          .text(r.val, 400, notesY + 4, { width: 149, align: 'right' });
        notesY += 16;
      });

      notesY += 14;
      // Adopted Pricing Basis Schedule Table
      doc.rect(36, notesY, 523, 16).fill('#16a34a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text('ADOPTED PRICING BASIS SCHEDULE', 46, notesY + 4);
      notesY += 16;

      doc.rect(36, notesY, 523, 16).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#1e293b').fontSize(7).font('Helvetica-Bold');
      doc.text('Rate Code', 38, notesY + 4, { width: 50 });
      doc.text('Description', 90, notesY + 4, { width: 180 });
      doc.text('Unit', 275, notesY + 4, { width: 35, align: 'center' });
      doc.text('Reference Rate (N)', 315, notesY + 4, { width: 85, align: 'right' });
      doc.text('Derivation / Basis', 405, notesY + 4, { width: 145 });
      notesY += 16;

      const basisSchedule = [
        { code: 'R001', desc: 'Clear site around main building footprint', unit: 'm²', rate: '1,200.00', basis: 'Regional labour + light plant allowance' },
        { code: 'R003', desc: 'Excavate foundation trenches in normal soil', unit: 'm³', rate: '5,500.00', basis: 'Secondary-city excavation labour/plant' },
        { code: 'R007', desc: '50 mm plain concrete blinding under strip footings', unit: 'm³', rate: '145,000.00', basis: 'Cement/aggregate build-up using 2026 inputs' },
        { code: 'R008', desc: 'Reinforced concrete in footings Grade 25', unit: 'm³', rate: '190,000.00', basis: 'Concrete only; rebar and formwork separate' },
        { code: 'R009', desc: '225 mm hollow sandcrete foundation blockwork', unit: 'm²', rate: '18,500.00', basis: '9-inch blocks, mortar, labour and handling' },
        { code: 'R013', desc: '150 mm concrete ground-bearing floor slab', unit: 'm³', rate: '190,000.00', basis: 'Grade 25 concrete only; mesh separate' },
        { code: 'R020', desc: 'Grade 25 reinforced concrete to frame (columns/beams)', unit: 'm³', rate: '195,000.00', basis: 'Concrete only; rebar and formwork separate' },
        { code: 'R021', desc: 'High-yield reinforcement cut, bent and fixed', unit: 't', rate: '1,350,000.00', basis: 'Rebar supply, binding wire, waste & labour' },
        { code: 'R022', desc: 'Formwork to sides of columns and beams', unit: 'm²', rate: '12,500.00', basis: 'Timber/plywood, props, labour and reuse' },
        { code: 'R030', desc: '225 mm sandcrete blockwork above DPC', unit: 'm²', rate: '15,500.00', basis: 'Approx. 10 blocks/m², mortar, labour and waste' },
        { code: 'R032', desc: 'External cement/sand render (15mm thick)', unit: 'm²', rate: '7,000.00', basis: '15 mm render, materials, scaffolding and labour' },
        { code: 'R034', desc: 'Internal cement/sand plaster to walls', unit: 'm²', rate: '6,000.00', basis: '15 mm plaster, materials and artisan labour' },
        { code: 'R037', desc: 'Vitrified/porcelain floor tiles to rooms', unit: 'm²', rate: '17,000.00', basis: 'Mid-grade supply, adhesive/grout, 10% waste' },
        { code: 'R042', desc: 'Gypsum-board suspended ceiling on metal framing', unit: 'm²', rate: '15,500.00', basis: 'POP/gypsum boards, metal framing & jointing' },
        { code: 'R070', desc: '0.55 mm longspan aluminium roof covering', unit: 'm²', rate: '15,000.00', basis: '0.55mm aluminium sheet, fixings, laps & labour' },
      ];

      basisSchedule.forEach((bs, idx) => {
        doc.rect(36, notesY, 523, 16).fill(idx % 2 === 0 ? '#ffffff' : '#fcfdfc').stroke('#e2e8f0');
        doc.fillColor('#475569').fontSize(6.5).font('Helvetica').text(bs.code, 38, notesY + 4, { width: 50 });
        doc.fillColor('#0f172a').text(bs.desc, 90, notesY + 4, { width: 180, ellipsis: true });
        doc.text(bs.unit, 275, notesY + 4, { width: 35, align: 'center' });
        doc.text(bs.rate, 315, notesY + 4, { width: 85, align: 'right' });
        doc.fillColor('#475569').text(bs.basis, 405, notesY + 4, { width: 145, ellipsis: true });
        notesY += 16;
      });

      // -------------------------------------------------------------
      // RUNNING FOOTERS ACROSS ALL BUFFERED PAGES
      // -------------------------------------------------------------
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#64748b').fontSize(7).font('Helvetica')
          .text(title, 36, 805, { width: 360, ellipsis: true });
        doc.text(`Page ${i + 1} of ${range.count}`, 430, 805, { width: 129, align: 'right' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export interface UserGuideOptions {
  contactEmail?: string;
  whatsappPhone?: string;
  brandName?: string;
  leadQsName?: string;
}

/**
 * Generate a comprehensive, professional User Guide & Onboarding Manual PDF for new users
 */
export function generateUserGuidePdfBuffer(options?: UserGuideOptions): Promise<Buffer> {
  const contactEmail = options?.contactEmail || 'emmanuelisaac888@gmail.com';
  const brandName = options?.brandName || 'Estimate with Isaac';
  const leadQsName = options?.leadQsName || 'Emmanuel Isaac, MYQSF';
  const whatsappPhone = (options?.whatsappPhone && !options.whatsappPhone.includes('123 4567') && !options.whatsappPhone.includes('000 0000')) ? options.whatsappPhone : '';
  const footerLabel = `Let's Estimate 2.0 User Manual - ${brandName} (${contactEmail})`;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: "Let's Estimate 2.0 - Complete User Guide & Manual",
          Author: leadQsName,
          Subject: 'Comprehensive User Guide for Nigerian Construction Professionals',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // PAGE 1: COVER & OVERVIEW
      doc.rect(0, 0, 595, 842).fill('#064e3b'); // Emerald-900 background accent

      // Inner white card
      doc.rect(30, 30, 535, 782).fill('#ffffff');

      // Header Banner
      doc.rect(30, 30, 535, 110).fill('#047857');
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
        .text("LET'S ESTIMATE 2.0", 50, 55, { characterSpacing: 1.5 });
      doc.fontSize(11).font('Helvetica')
        .text('AI-POWERED BILL OF QUANTITIES (BOQ) & QUANTITY SURVEYING PLATFORM', 50, 88);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#a7f3d0')
        .text('Official User Guide, BESMM4 Standards & Field Manual for Nigerian Construction', 50, 106);

      let y = 160;
      doc.fillColor('#064e3b').fontSize(14).font('Helvetica-Bold').text('1. Welcome to Let\'s Estimate 2.0', 50, y);
      y += 20;

      doc.fillColor('#334155').fontSize(9).font('Helvetica').lineGap(4).text(
        "Let's Estimate is an enterprise-grade Quantity Surveying and Cost Engineering platform engineered specifically for Nigerian construction professionals—Architects, Builders, Registered Quantity Surveyors (NIQS), and General Contractors.\n\n" +
        "Powered by Google Gemini 2.5 Flash Vision AI and aligned with the Building & Engineering Standard Method of Measurement (BESMM4), the system transforms complex architectural drawings into deterministic, audit-proof Bills of Quantities in seconds.",
        50, y, { width: 495, align: 'justify' }
      );

      y += 75;
      doc.fillColor('#064e3b').fontSize(14).font('Helvetica-Bold').text('2. Core Platform Capabilities', 50, y);
      y += 20;

      const features = [
        {
          title: "AI Architectural Drawing Takeoff",
          desc: "Upload PDFs, CAD floor plans, or scanned blueprints. Gemini Vision extracts structural members, concrete volumes, blockwork m², and finishes."
        },
        {
          title: "Live Nigerian Rate Library & Multipliers",
          desc: "Instant pricing for Lagos, Abuja, Port Harcourt, and Regional hubs. Custom market rate breakdowns for materials, labor, and plant."
        },
        {
          title: "BESMM4 Standard Item Organization",
          desc: "Automatic categorization into Preliminaries, Substructure, RC Frame, Blockwork, Roofing, Doors/Windows, Finishes, and MEP."
        },
        {
          title: "Terrain & Statutory Tax Engine",
          desc: "Configurable 7.5% Nigerian VAT, 15% Profit & Overhead, and specialized Niger Delta Swamp Terrain premiums (5% - 25%)."
        },
        {
          title: "Interim Payment Certificates (IPC)",
          desc: "Issue progressive contractor valuations with automated retention deductions, advance payment recovery, and net certificates."
        },
        {
          title: "Executive Export & Multi-Format Reports",
          desc: "Generate stamp-ready NIQS Bill of Quantities PDFs, multi-tab Excel workbooks, and comprehensive client audit dossiers."
        }
      ];

      features.forEach((feat, idx) => {
        const col = idx % 2 === 0 ? 50 : 305;
        const rowY = y + Math.floor(idx / 2) * 65;

        doc.rect(col, rowY, 240, 56).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#047857').fontSize(9).font('Helvetica-Bold').text(feat.title, col + 10, rowY + 8, { width: 220 });
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica').lineGap(2).text(feat.desc, col + 10, rowY + 22, { width: 220 });
      });

      y += 215;
      doc.rect(50, y, 495, 80).fill('#f0fdf4').stroke('#86efac');
      doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold').text('Professional Accreditation Notice', 65, y + 10);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').lineGap(3).text(
        "All calculations and schedules follow the standards codified by the Nigerian Institute of Quantity Surveyors (NIQS) and the Quantity Surveyors Registration Board of Nigeria (QSRBN). Rates reflect prevailing market surveys conducted across Lagos State, Rivers State, and the Federal Capital Territory (FCT).",
        65, y + 26, { width: 465 }
      );

      // Footer of Page 1
      doc.fillColor('#94a3b8').fontSize(7).text(`Page 1 of 3 - ${footerLabel}`, 50, 790, { align: 'center', width: 495 });

      // PAGE 2: 5-STEP WORKFLOW GUIDE
      doc.addPage();
      doc.rect(30, 30, 535, 782).stroke('#e2e8f0');

      // Top bar
      doc.rect(30, 30, 535, 45).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text("Step-by-Step User Workflow", 50, 46);
      doc.fontSize(8.5).font('Helvetica').text("From Architectural Upload to Contract Award in 5 Simple Steps", 300, 49, { align: 'right', width: 245 });

      y = 95;

      const steps = [
        {
          step: "STEP 1",
          title: "Create or Open a Project",
          detail: "Click '+ Create' in the top navigation bar or 'New Project' on the Dashboard. Provide the Project Title, Location (e.g., Lekki Lagos, Port Harcourt, or Abuja), and Client Name. Location automatically sets the initial material cost baseline."
        },
        {
          step: "STEP 2",
          title: "Upload Drawings or Architectural Plans",
          detail: "Navigate to the 'AI Takeoff' tab or click the drawing dropzone. Upload high-resolution architectural plans (PDF or image). Gemini 2.5 Flash inspects title blocks, dimension grids, elevation heights, and wall schedules."
        },
        {
          step: "STEP 3",
          title: "Review & Confirm Extracted Quantities",
          detail: "The AI Takeoff drawer extracts concrete slabs (m³), perimeter blockwork (m²), plastering (m²), roofing trusses, doors, and windows. Inspect detected quantities, adjust any dimensions if needed, and click 'Confirm & Insert into BOQ'."
        },
        {
          step: "STEP 4",
          title: "Customize Rates & Statutory Tax Percentages",
          detail: "In the BOQ Table editor, adjust unit rates from the built-in Nigerian Rate Library. Use the bottom summary sliders to calibrate Profit & Overheads (default 15%), VAT (7.5%), or Swamp Premium (for riverine/marshy terrain)."
        },
        {
          step: "STEP 5",
          title: "Export Stamp-Ready Documents",
          detail: "Click 'Export PDF' for a formal, branded contractor tender BOQ with signature and stamp blocks. Click 'Export Excel' for a structured multi-tab workbook with Material Procurement schedules (cement bags, sand tonnes, granite, rebar)."
        }
      ];

      steps.forEach((s) => {
        doc.rect(50, y, 495, 72).fill('#ffffff').stroke('#cbd5e1');
        doc.rect(50, y, 65, 72).fill('#047857');
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(s.step, 50, y + 28, { width: 65, align: 'center' });

        doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(s.title, 125, y + 10);
        doc.fillColor('#475569').fontSize(8).font('Helvetica').lineGap(2).text(s.detail, 125, y + 26, { width: 405 });

        y += 82;
      });

      // Practical Completion & Valuations highlight
      y += 10;
      doc.rect(50, y, 495, 125).fill('#fefce8').stroke('#fde047');
      doc.fillColor('#854d0e').fontSize(11).font('Helvetica-Bold').text('Contract Administration & Interim Valuations (IPC)', 65, y + 12);
      doc.fillColor('#713f12').fontSize(8).font('Helvetica').lineGap(3).text(
        "During construction, use the 'Project Controls' view to certify progress payments:\n" +
        "• Interim Payment Certificate (IPC): Track cumulative work executed against contract milestones.\n" +
        "• Retention Withholding: Automatically deduct 5% or 10% retention until the Defects Liability Period.\n" +
        "• Variation Orders: Log approved additions and omissions with instant contract sum re-calculation.\n" +
        "• Cash Flow Forecasts: Visual S-curve projections comparing planned vs. actual cash drawdowns.\n" +
        "• Tender Bid Equalization: Compare sub-contractor bids against the engineering benchmark.",
        65, y + 30, { width: 465 }
      );

      // Footer of Page 2
      doc.fillColor('#94a3b8').fontSize(7).text(`Page 2 of 3 - ${footerLabel}`, 50, 790, { align: 'center', width: 495 });

      // PAGE 3: TIPS, BEST PRACTICES & FAQ
      doc.addPage();
      doc.rect(30, 30, 535, 782).stroke('#e2e8f0');

      doc.rect(30, 30, 535, 45).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text("Best Practices & Expert Tips", 50, 46);
      doc.fontSize(8.5).font('Helvetica').text("Maximizing Accuracy with Gemini AI & BESMM4 Rules", 300, 49, { align: 'right', width: 245 });

      y = 95;

      const tips = [
        {
          q: "How do I get the highest AI takeoff accuracy?",
          a: "Upload drawings that clearly display dimension strings and title blocks with a defined scale bar (e.g. 1:100 or 1:50). Ensure text labels like 'Master Bedroom', 'Living Room', and elevation heights (e.g. +3.000m) are legible."
        },
        {
          q: "What is the Swamp / Terrain Premium?",
          a: "For construction projects in the Niger Delta (Rivers, Bayelsa, Delta) or coastal Lagos (Lekki, Epe, Badagry), foundation dewatering, timber piling, and sand-filling inflate costs. Set the Swamp Premium slider (10% - 25%) to compensate."
        },
        {
          q: "Can I use custom prices instead of the Nigerian Rate Library?",
          a: "Yes! Simply edit the unit rate column in the BOQ table directly. You can also add your company's proprietary supplier quotes under 'Custom Rates' in the Library view."
        },
        {
          q: "How does the Material Procurement breakdown work?",
          a: "When you export to Excel, the platform automatically calculates physical material quantities based on Nigerian structural mix ratios: 7.2 bags of cement per m³ of Grade 25 concrete, 0.45 tonnes of granite, 0.5 tonnes of sharp sand, and rebar tonnage."
        },
        {
          q: "Can I share a live read-only tender link with my Client or Subcontractors?",
          a: "Yes. In the project menu, select 'Share Project' to generate an encrypted public link. Clients can review the BOQ without requiring a login or modifying existing items."
        }
      ];

      tips.forEach((t) => {
        doc.fillColor('#064e3b').fontSize(9.5).font('Helvetica-Bold').text("Q: " + t.q, 50, y, { width: 495 });
        y += 14;
        doc.fillColor('#334155').fontSize(8.5).font('Helvetica').lineGap(2).text(t.a, 50, y, { width: 495, align: 'justify' });
        y += 38;
      });

      // Quick Keyboard & UI Shortcuts
      y += 10;
      doc.rect(50, y, 495, 95).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Essential Platform Navigation & Shortcuts', 65, y + 10);

      doc.fillColor('#334155').fontSize(8).font('Helvetica').lineGap(3).text(
        "• Universal '+ Create' Button: Located in the top header—instantly spawn Projects, BOQs, Estimates, or Valuations.\n" +
        "• Global Search Bar: Press or click search to jump instantly to any project, bill item, or engineering calculator.\n" +
        "• Section Filters: In the BOQ Table, filter items by 'Substructure', 'Superstructure', 'Finishes', or 'MEP'.\n" +
        "• Preset Items: Use the '+ Add Item' dropdown to insert pre-measured BESMM4 clauses with standardized descriptions.",
        65, y + 26, { width: 465 }
      );

      // Support contact info
      y += 115;
      doc.rect(50, y, 495, 65).fill('#ecfdf5').stroke('#6ee7b7');
      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold').text('Need Help or Custom Enterprise Deployment?', 65, y + 10);
      
      const hotlineInfo = whatsappPhone ? `  |  WhatsApp Hotline: ${whatsappPhone}` : '';
      doc.fillColor('#047857').fontSize(8).font('Helvetica').text(
        `Official Support: ${contactEmail}${hotlineInfo}  |  Lead Consultant: ${leadQsName}\n` +
        "Built with pride for Quantity Surveyors, Civil Engineers, and Builders across Nigeria.",
        65, y + 26, { width: 465 }
      );

      // Footer of Page 3
      doc.fillColor('#94a3b8').fontSize(7).text(`Page 3 of 3 - ${footerLabel}`, 50, 790, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export * from './specializedExports.js';

