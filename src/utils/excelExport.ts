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

export function calculateMaterialBreakdown(items: BoqItem[]) {
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
      depotRates: {
        cement: 9800,
        sand: 4250,
        granite: 10500,
        rebar: 1350000,
        block225: 650,
        block150: 550,
        roofing: 7000
      }
    };
  }

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
        cementBags += qty * 4.4;
        sandTonnes += qty * 0.52;
        graniteTonnes += qty * 1.05;
      } else {
        cementBags += qty * 6.6;
        sandTonnes += qty * 0.68;
        graniteTonnes += qty * 1.25;

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

    const isRoofing = 
      name.includes('roof') && 
      (name.includes('sheet') || name.includes('aluminium') || name.includes('step-tile') || name.includes('longspan') || name.includes('stone coated') || name.includes('corrugated') || name.includes('covering'));

    if (isRoofing) {
      roofingSqm += qty * 1.10;
      continue;
    }
  }

  cementBags = Math.ceil(cementBags);
  sandTonnes = Math.round(sandTonnes * 100) / 100;
  graniteTonnes = Math.round(graniteTonnes * 10) / 10;
  rebarTonnes = Math.round(rebarTonnes * 100) / 100;

  const CEMENT_PRICE = 9800;
  const SAND_PRICE = 4250;
  const GRANITE_PRICE = 10500;
  const REBAR_PRICE = 1350000;
  const BLOCK_225_PRICE = 650;
  const BLOCK_150_PRICE = 550;
  const ROOFING_PRICE = 7000;

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
 * Format worksheet cells with clean Nigerian currency and number masks, row heights, and gridlines
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
 * Generate genuine 4-tab XLSX workbook in browser memory matching BESMM4 standard
 */
export function generateClientXlsxBlob(options: ExportBoqOptions): Blob {
  const wb = XLSX.utils.book_new();

  const title = (options.projectTitle || "Let's Estimate - Project BOQ").trim();
  const location = options.location || 'Nigeria';
  const client = options.clientName || 'Private Client';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const safeItems = Array.isArray(options.items) ? options.items : [];
  const poPercent = Number(options.poPercent ?? 15);
  const vatPercent = Number(options.vatPercent ?? 7.5);
  const swampPercent = Number(options.swampPremiumPercent ?? 0);

  const totals = calculateBoqTotals(safeItems, poPercent, vatPercent, swampPercent);
  const prelimPercent = 5.0;
  const prelimAmount = totals.adjustedSubtotal * (prelimPercent / 100);
  const buildingWorksTotal = totals.adjustedSubtotal + prelimAmount;

  // Group items by trade section for standard BESMM4 / NIQS presentation
  const sectionsMap = new Map<string, typeof safeItems>();
  safeItems.forEach((it) => {
    const sec = (it.section || 'General Works').trim();
    if (!sectionsMap.has(sec)) {
      sectionsMap.set(sec, []);
    }
    sectionsMap.get(sec)!.push(it);
  });

  // Calculate Section Subtotals for Collection Page
  const sectionSummaries: Array<{ section: string; subtotal: number; count: number }> = [];
  sectionsMap.forEach((secItems, secName) => {
    const secSub = secItems.reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.rate || 0)), 0);
    sectionSummaries.push({ section: secName, subtotal: secSub, count: secItems.length });
  });

  // =========================================================================
  // TAB 1: MEASURED BILL OF QUANTITIES
  // =========================================================================
  const boqRows: any[][] = [];
  boqRows.push([]); // Top spacing

  const headerBannerTitle = title.toUpperCase().includes('BILL OF QUANTITIES')
    ? title.toUpperCase()
    : `${title.toUpperCase()} - BILL OF QUANTITIES`;
  boqRows.push([headerBannerTitle, '', '', '', '', '']);
  boqRows.push(["STANDARD METHOD OF MEASUREMENT OF BUILDING WORKS (BESMM4 / NIQS STANDARD)", '', '', '', '', '']);
  boqRows.push([`Client / Employer: ${client}   |   Site Location: ${location}   |   Date: ${dateStr}`, '', '', '', '', '']);
  boqRows.push([]);
  boqRows.push(['S/No.', 'D E S C R I P T I O N', 'QTY', 'UNIT', 'RATES (NGN)', 'AMOUNT (NGN)']);

  let elementIndex = 1;
  sectionsMap.forEach((secItems, secName) => {
    boqRows.push([]);
    const elementTitle = secName.toUpperCase().includes('ELEMENT') || secName.toUpperCase().includes('BILL')
      ? secName.toUpperCase()
      : `ELEMENT NR. ${elementIndex} – ${secName.toUpperCase()}`;
    boqRows.push(['', elementTitle, '', '', '', '']);
    boqRows.push(['', 'Priced in accordance with Nigerian BESMM4 standard method of measurement. All rates include supply of materials, labour, equipment, handling, transport and waste.', '', '', '', '']);

    let sectionTotal = 0;
    secItems.forEach((it, idx) => {
      const qty = Number(it.qty || 0);
      const rate = Number(it.rate || 0);
      const amount = Number(it.amount ?? (qty * rate));
      sectionTotal += amount;

      const letterCode = String.fromCharCode(65 + (Math.floor(idx / 26) % 26));
      const sNo = `${elementIndex}.${letterCode}.${idx + 1}`;

      const rawDesc = String(it.description || '').trim();
      const rawItem = String(it.item || '').trim();
      const cleanDesc = rawDesc.replace(/\s*\[Verified via Smart Takeoff Studio:[^\]]*\]/gi, '').trim();
      let fullDesc = cleanDesc;
      if (!fullDesc) {
        fullDesc = rawItem || 'General construction works';
      } else if (rawItem && !cleanDesc.toLowerCase().includes(rawItem.toLowerCase())) {
        fullDesc = `${rawItem} - ${cleanDesc}`;
      }

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
        qty,
        unitDisplay,
        rate,
        amount
      ]);
    });

    boqRows.push(['', 'TO SUMMARY', '', '', '', sectionTotal]);
    elementIndex++;
  });

  boqRows.push([]);
  boqRows.push(['', 'SUBTOTAL OF MEASURED WORKS (NGN):', '', '', '', totals.subtotal]);
  if (swampPercent > 0) {
    boqRows.push(['', `Swamp / Coastal Terrain Allowance (${swampPercent}%):`, '', '', '', totals.swampAmount]);
    boqRows.push(['', 'ADJUSTED MEASURED WORKS SUBTOTAL (NGN):', '', '', '', totals.adjustedSubtotal]);
  }
  boqRows.push(['', `Preliminaries and General Attendance (${prelimPercent}%):`, '', '', '', prelimAmount]);
  boqRows.push(['', 'BUILDING WORKS TOTAL (NGN):', '', '', '', buildingWorksTotal]);
  boqRows.push(['', `Contractor's Profit & Overheads (${poPercent}%):`, '', '', '', totals.poAmount]);
  boqRows.push(['', `Statutory Nigerian Value Added Tax (${vatPercent}% VAT):`, '', '', '', totals.vatAmount]);
  boqRows.push(['', 'TOTAL ESTIMATED CONTRACT TENDER SUM (NGN):', '', '', '', totals.grandTotal]);

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
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
  ];
  styleAndFormatWorksheet(wsBoq, true);
  XLSX.utils.book_append_sheet(wb, wsBoq, 'Bill of Quantities');

  // =========================================================================
  // TAB 2: SUMMARY OF ELEMENTS (Collection Page)
  // =========================================================================
  const summaryRows: any[][] = [
    ['BILL OF QUANTITIES - SUMMARY & COLLECTION'],
    [title.toUpperCase()],
    [`Client: ${client} | Location: ${location} | Pricing Date: ${dateStr} | Standard: BESMM4 / NIQS Standard`],
    [],
    ['Ref', 'Element / Trade Section', 'Measurement Basis', 'Amount (NGN)', 'Package', 'Remarks'],
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
  summaryRows.push(['', 'MAIN BUILDING WORKS TOTAL', '', totals.subtotal, '', '']);
  if (swampPercent > 0) {
    summaryRows.push(['', `Swamp / Coastal Terrain Premium (${swampPercent}%)`, '', totals.swampAmount, '', '']);
    summaryRows.push(['', 'ADJUSTED BUILDING WORKS SUBTOTAL', '', totals.adjustedSubtotal, '', '']);
  }
  summaryRows.push(['', `Preliminaries and General Attendance (${prelimPercent}%)`, '', prelimAmount, '', 'Contractor site mobilization & compliance']);
  summaryRows.push(['', 'BUILDING WORKS TOTAL', '', buildingWorksTotal, '', '']);
  summaryRows.push(['', `Contractor's Profit & Overheads (${poPercent}%)`, '', totals.poAmount, '', 'Head office overhead & operational margin']);
  summaryRows.push(['', `Statutory Nigerian Value Added Tax (${vatPercent}% VAT)`, '', totals.vatAmount, '', 'Federal Inland Revenue Service (FIRS) statutory tax']);
  summaryRows.push([]);
  summaryRows.push(['', 'TOTAL ESTIMATED CONTRACT TENDER SUM (NGN)', '', totals.grandTotal, '', 'Certified Grand Total']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 10 },
    { wch: 48 },
    { wch: 26 },
    { wch: 26 },
    { wch: 20 },
    { wch: 48 },
  ];
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ];
  styleAndFormatWorksheet(wsSummary, false);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary of Elements');

  // =========================================================================
  // TAB 3: ADOPTED PRICING BASIS
  // =========================================================================
  const pricingBasisRows: any[][] = [
    ['ADOPTED PRICING BASIS & REGIONAL BENCHMARKS'],
    ['Cost Engineering Analysis based on current Nigerian construction input indices (NIQS / QSRBN Standard)'],
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
    { wch: 14 },
    { wch: 54 },
    { wch: 12 },
    { wch: 24 },
    { wch: 48 },
    { wch: 18 },
    { wch: 16 },
  ];
  styleAndFormatWorksheet(wsPricing, false);
  XLSX.utils.book_append_sheet(wb, wsPricing, 'Adopted Pricing Basis');

  // =========================================================================
  // TAB 4: MATERIAL PROCUREMENT SCHEDULE
  // =========================================================================
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
    { wch: 28 },
    { wch: 52 },
    { wch: 18 },
    { wch: 16 },
    { wch: 26 },
    { wch: 28 },
  ];
  styleAndFormatWorksheet(wsMat, false);
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
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'PDF export failed on server.');
  }

  const blob = await response.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  downloadBlob(pdfBlob, filename);
}
