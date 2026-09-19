/**
 * Let's Estimate - BOQ Import & Data Parsing Engine
 * Supports Excel (.xlsx, .xls), CSV, TSV, and clipboard tabular data
 * Auto-detects columns, BESMM4 trade categories, and Nigerian currency values
 */

import * as XLSX from 'xlsx';
import { BoqItem, BESMM4_SECTIONS, QsVerificationStatus } from '../types';

export interface ColumnMapping {
  itemNumberCol: number; // Column index for item number or code
  sectionCol: number;    // Column index for trade / section / bill
  itemCol: number;       // Column index for short item name
  descriptionCol: number;// Column index for item description / spec
  unitCol: number;       // Column index for unit of measurement
  qtyCol: number;        // Column index for quantity
  rateCol: number;       // Column index for unit rate (₦)
  amountCol: number;     // Column index for total amount (₦)
}

export interface RawParsedSheet {
  sheetName: string;
  rows: any[][];
  suggestedHeaderRowIndex: number;
  columnMapping: ColumnMapping;
  headers: string[];
}

export interface ParsedBoqResult {
  fileName?: string;
  sheetNames: string[];
  activeSheet: string;
  allSheets: Record<string, any[][]>;
  headers: string[];
  headerRowIndex: number;
  mapping: ColumnMapping;
  items: BoqItem[];
  rawRowsCount: number;
  sheetItemCounts?: Record<string, number>;
  combinedAllSheetsItems?: BoqItem[];
}

/**
 * Clean numbers from string values (removes ₦, NGN, commas, spaces, currency symbols, and handles accounting brackets)
 */
export function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim();
  if (!str) return 0;

  // Unpriced indicators or empty placeholders
  if (/^[-–—\s.]+$/.test(str) || /^(nil|none|n\/a|incl|included|free|tbd|pending)$/i.test(str)) return 0;

  // Handle (123.45) as negative accounting format
  const isNegative = /^\(.*\)$/.test(str);

  // Normalize all unicode space characters and clean currency symbols
  str = str
    .replace(/[\u00A0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ')
    .replace(/[₦$£€#]/g, '')
    .replace(/\bNGN\b|\bngn\b/gi, '')
    // Strip leading N or N. or N: or N/ followed by digits or spaces (e.g. N125,000 or N. 125,000 or N: 125,000)
    .replace(/^[nN][\s.:/]*/, '')
    .replace(/[()]/g, '')
    .replace(/,/g, '') // strip thousand commas
    .replace(/\s+/g, '')
    .trim();

  // Match leading numeric sequence (handles trailing units like 15000/m2 or 25000pernr)
  const numMatch = str.match(/^-?\d+(\.\d+)?/);
  if (numMatch) {
    const parsed = parseFloat(numMatch[0]);
    if (!isNaN(parsed)) return isNegative ? -Math.abs(parsed) : parsed;
  }

  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  return isNegative ? -Math.abs(parsed) : parsed;
}

/**
 * Standardize measurement units to standard Nigerian QS units
 */
export function normalizeUnit(rawUnit: any): string {
  if (!rawUnit) return 'item';
  const u = String(rawUnit).trim().toLowerCase();

  if (/^(m2|sqm|sq\.m|m²|sq\.mtr|sq\s*m)$/.test(u)) return 'm2';
  if (/^(m3|cum|cu\.m|m³|cu\.mtr|cu\s*m)$/.test(u)) return 'm3';
  if (/^(m|lm|lin\.m|lin\s*m|linear\s*meter|metre|meter|mtr)$/.test(u)) return 'm';
  if (/^(nr|no|nos|nos\.|number|pcs|pieces|each|ea)$/.test(u)) return 'nr';
  if (/^(kg|kgs|kilogram|kilograms)$/.test(u)) return 'kg';
  if (/^(t|tonne|tonnes|ton|tons)$/.test(u)) return 't';
  if (/^(sum|lump\s*sum|ls|l\.s|prov\s*sum|item)$/.test(u)) return 'sum';
  if (/^(pair|prs|set|sets)$/.test(u)) return 'nr';
  if (/^(wk|week|weeks)$/.test(u)) return 'wk';
  if (/^(mth|month|months)$/.test(u)) return 'month';

  return String(rawUnit).trim() || 'item';
}

/**
 * Normalizes any trade, bill header, element title, or user section string to the canonical BESMM4 standard section.
 */
export function normalizeBesmm4Section(input: string): (typeof BESMM4_SECTIONS)[number] | '' {
  if (!input) return '';
  const text = String(input).trim().toLowerCase();

  // Exact match to existing BESMM4 section
  const directMatch = BESMM4_SECTIONS.find(s => s.toLowerCase() === text);
  if (directMatch) return directMatch;

  // 1. Substructure (Foundation, earthwork, underground structural elements)
  if (text.includes('substructure') || text.includes('sub-structure') || text.includes('foundation') ||
      text.includes('footing') || text.includes('excavat') || text.includes('trench') ||
      text.includes('earthwork') || text.includes('groundwork') || text.includes('site clearance') ||
      text.includes('topsoil') || text.includes('laterite') || text.includes('hardcore') ||
      text.includes('dpm') || text.includes('damp proof membrane') || text.includes('blinding') ||
      text.includes('termite') || text.includes('piling') || text.includes('raft') ||
      text.includes('oversite') || text.includes('below ground') || text.includes('underground')) {
    return 'Substructure';
  }

  // 2. Superstructure / Reinforced Concrete Frame (Upper frame, columns, beams, suspended slabs, stairs)
  if (text.includes('superstructure') || text.includes('super-structure') || text.includes('concrete frame') ||
      text.includes('rc frame') || text.includes('reinforced concrete') || text.includes('structural frame') ||
      text.includes('column') || text.includes('floor beam') || text.includes('suspended beam') ||
      text.includes('suspended slab') || text.includes('upper floor') || text.includes('first floor') ||
      text.includes('second floor') || text.includes('staircase') || text.includes('stairs') ||
      text.includes('landing') || text.includes('lintel') || text.includes('parapet') ||
      text.includes('lift shaft') || text.includes('formwork') || text.includes('shuttering') ||
      text.includes('rebar') || text.includes('reinforcement') || text.includes('brc mesh') ||
      text.includes('marine board') || text.includes('props') || text.includes('y12') ||
      text.includes('y16') || text.includes('y20') || text.includes('y25') || text.includes('y10') ||
      text.includes('concrete work') || text.includes('concrete works') || text.includes('in-situ concrete')) {
    return 'Reinforced Concrete Frame';
  }

  // 3. Blockwork & Partitioning (Walling, masonry, partitions, mortar, sandcrete)
  if (text.includes('blockwork') || text.includes('block work') || text.includes('sandcrete') ||
      text.includes('hollow block') || text.includes('solid block') || text.includes('brickwork') ||
      text.includes('brick work') || text.includes('masonry') || text.includes('walling') ||
      text.includes('225mm') || text.includes('150mm') || text.includes('100mm') ||
      text.includes('partition') || text.includes('drywall') || text.includes('mortar') ||
      text.includes('dpc') || text.includes('damp proof course')) {
    return 'Blockwork & Partitioning';
  }

  // 4. Roofing & Rainwater Goods (Trusses, purlins, coverings, gutters, downpipes)
  if (text.includes('roof') || text.includes('roofing') || text.includes('truss') ||
      text.includes('rafter') || text.includes('tie beam') || text.includes('purlin') ||
      text.includes('strut') || text.includes('king post') || text.includes('longspan') ||
      text.includes('step-tile') || text.includes('steptile') || text.includes('gerard') ||
      text.includes('stone-coated') || text.includes('metcopo') || text.includes('aluzinc') ||
      text.includes('corrugated') || text.includes('fascia') || text.includes('soffit') ||
      text.includes('eaves') || text.includes('gutter') || text.includes('downpipe') ||
      text.includes('rainwater') || text.includes('ridge cap') || text.includes('flashing') ||
      text.includes('roof tile') || text.includes('ceiling joist')) {
    return 'Roofing & Rainwater Goods';
  }

  // 5. Carpentry, Doors & Windows (Doors, windows, ironmongery, joinery, glazing)
  if (text.includes('door') || text.includes('doors') || text.includes('window') ||
      text.includes('windows') || text.includes('casement') || text.includes('sliding door') ||
      text.includes('sliding window') || text.includes('flush door') || text.includes('panel door') ||
      text.includes('security door') || text.includes('ironmongery') || text.includes('lockset') ||
      text.includes('hinge') || text.includes('glazing') || text.includes('glass') ||
      text.includes('burglar') || text.includes('wardrobe') || text.includes('cabinet') ||
      text.includes('carpentry') || text.includes('joinery') || text.includes('woodwork') ||
      text.includes('metalwork') || text.includes('ironmonger')) {
    return 'Carpentry, Doors & Windows';
  }

  // 6. Finishes (Plastering, Tiling & Screed) (Plaster, render, screed, tiles, paint, POP)
  if (text.includes('finish') || text.includes('finishes') || text.includes('finishing') ||
      text.includes('plaster') || text.includes('plastering') || text.includes('render') ||
      text.includes('rendering') || text.includes('screed') || text.includes('screeding') ||
      text.includes('tile') || text.includes('tiles') || text.includes('tiling') ||
      text.includes('ceramic') || text.includes('vitrified') || text.includes('porcelain') ||
      text.includes('granite') || text.includes('marble') || text.includes('terrazzo') ||
      text.includes('skirting') || text.includes('paint') || text.includes('painting') ||
      text.includes('emulsion') || text.includes('gloss') || text.includes('texcote') ||
      text.includes('pop') || text.includes('p.o.p') || text.includes('plaster of paris') ||
      text.includes('ceiling finish') || text.includes('wall finish') || text.includes('floor finish')) {
    return 'Finishes (Plastering, Tiling & Screed)';
  }

  // 7. External Works & Preliminaries (Site works, civil works, paving, fence, gate, prelims)
  // Evaluated before M&E to ensure perimeter drains/external works match External Works
  if (text.includes('external') || text.includes('site work') || text.includes('compound') ||
      text.includes('paving') || text.includes('interlock') || text.includes('kerb') ||
      text.includes('road') || text.includes('driveway') || text.includes('fence') ||
      text.includes('fencing') || text.includes('perimeter') || text.includes('gate') ||
      text.includes('culvert') || text.includes('landscaping') || text.includes('preliminar') ||
      text.includes('prelim') || text.includes('mobilization') || text.includes('supervision') ||
      text.includes('insurance') || text.includes('site office') || text.includes('hoarding') ||
      text.includes('setting out') || text.includes('contingenc') || text.includes('provisional sum') ||
      text.includes('prime cost') || text.includes('pc sum') || text.includes('daywork')) {
    return 'External Works & Preliminaries';
  }

  // 8. Mechanical & Electrical Services (Plumbing, drainage, electrical, wiring, AC, fixtures)
  if (text.includes('mechanical') || text.includes('electrical') || text.includes('m&e') ||
      text.includes('service') || text.includes('services') || text.includes('plumb') ||
      text.includes('plumbing') || text.includes('pipe') || text.includes('piping') ||
      text.includes('sanitary') || text.includes('drainage') || text.includes('septic') ||
      text.includes('soakaway') || text.includes('overhead tank') || text.includes('water tank') ||
      text.includes('booster pump') || text.includes('water closet') || text.includes('wc') ||
      text.includes('wash hand basin') || text.includes('whb') || text.includes('sink') ||
      text.includes('shower') || text.includes('tap') || text.includes('conduit') ||
      text.includes('cable') || text.includes('wiring') || text.includes('socket') ||
      text.includes('switch') || text.includes('distribution board') || text.includes('consumer unit') ||
      text.includes('lighting') || text.includes('light') || text.includes('lamp') ||
      text.includes('led') || text.includes('cctv') || text.includes('fire alarm') ||
      text.includes('inverter') || text.includes('generator') || text.includes('solar') ||
      text.includes('air condition') || text.includes('ac') || text.includes('hvac') ||
      text.includes('water supply')) {
    return 'Mechanical & Electrical Services';
  }

  return '';
}

/**
 * Returns a human-friendly, concise display label for BESMM4 section tabs
 */
export function getFriendlySectionName(sec: string): string {
  if (!sec) return 'General';
  if (/substructure|sub-structure|foundation|earthwork/i.test(sec)) return 'Substructure';
  if (/reinforced|superstructure|frame|concrete\s*work/i.test(sec)) return 'Superstructure';
  if (/blockwork|walling|masonry|partition/i.test(sec)) return 'Blockwork';
  if (/roof/i.test(sec)) return 'Roofing';
  if (/carpentry|door|window|joinery/i.test(sec)) return 'Doors & Windows';
  if (/finish|plaster|screed|tile|paint/i.test(sec)) return 'Finishes';
  if (/mechanical|electrical|service|plumb/i.test(sec)) return 'Services (M&E)';
  if (/external|prelim|site\s*work/i.test(sec)) return 'External Works';
  return sec;
}

/**
 * Detect trade section from description or item name using BESMM4 keywords
 */
export function categorizeBesmm4Section(description: string, itemTitle?: string): (typeof BESMM4_SECTIONS)[number] {
  const text = `${itemTitle || ''} ${description || ''}`.trim();
  const normalized = normalizeBesmm4Section(text);
  if (normalized) return normalized;

  // If general or ambiguous, default safely to Substructure
  return 'Substructure';
}

/**
 * Ensures a worksheet's !ref range encompasses all decoded cell keys in the worksheet.
 * Many spreadsheet exporters set !ref to only the first page (e.g. A1:F15), which truncates
 * SheetJS parsing to only 15 items even when hundreds of rows exist.
 */
export function ensureFullWorksheetRange(ws: XLSX.WorkSheet): void {
  if (!ws || typeof ws !== 'object') return;
  let maxR = 0;
  let maxC = 0;
  let foundCell = false;

  for (const key of Object.keys(ws)) {
    if (key.startsWith('!')) continue;
    try {
      const cell = XLSX.utils.decode_cell(key);
      if (cell.r > maxR) maxR = cell.r;
      if (cell.c > maxC) maxC = cell.c;
      foundCell = true;
    } catch {
      // Ignore non-cell property names
    }
  }

  if (!foundCell) return;

  if (!ws['!ref']) {
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
  } else {
    try {
      const currentRange = XLSX.utils.decode_range(ws['!ref']);
      if (maxR > currentRange.e.r || maxC > currentRange.e.c) {
        currentRange.e.r = Math.max(currentRange.e.r, maxR);
        currentRange.e.c = Math.max(currentRange.e.c, maxC);
        ws['!ref'] = XLSX.utils.encode_range(currentRange);
      }
    } catch {
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
    }
  }
}

/**
 * Detects whether an entire row represents a trade section heading
 * (e.g. "BILL NO. 2 - SUBSTRUCTURE", "SUPERSTRUCTURE", "ROOFING & RAINWATER GOODS", "ELEMENT 4: FINISHES")
 */
export function detectSectionHeader(row: any[]): (typeof BESMM4_SECTIONS)[number] | null {
  if (!Array.isArray(row) || row.length === 0) return null;

  let hasNumbers = false;
  const textCells: string[] = [];

  for (let c = 0; c < row.length; c++) {
    const val = row[c];
    if (val === null || val === undefined) continue;
    const str = String(val).trim();
    if (!str) continue;

    const num = cleanNumber(str);
    if (num > 0) {
      hasNumbers = true;
    }
    if (isNaN(Number(str.replace(/,/g, '')))) {
      textCells.push(str);
    }
  }

  // If row has quantities or rates, it is an item, not a section header
  if (hasNumbers) return null;

  const combined = textCells.join(' ').trim();
  if (!combined) return null;
  const lower = combined.toLowerCase();

  const hasHeaderKeyword = /^(bill\s*no\.?|element(\s*no\.?)?|section|part|trade|division|heading)\b/i.test(lower) ||
    /^(substructure|superstructure|reinforced concrete|concrete frame|blockwork|masonry|walling|roofing|roof work|roof construction|carpentry|joinery|doors\s*(&|and)\s*windows|finishes|finishing|services|plumbing|electrical|external\s*works|preliminaries|provisional\s*sums?)$/i.test(lower) ||
    (lower.length < 80 && (
      lower.includes('substructure') ||
      lower.includes('superstructure') ||
      lower.includes('concrete frame') ||
      lower.includes('blockwork') ||
      lower.includes('roofing') ||
      lower.includes('finishes') ||
      lower.includes('doors & windows') ||
      lower.includes('doors and windows') ||
      lower.includes('mechanical & electrical') ||
      lower.includes('external works') ||
      lower.includes('preliminaries')
    ));

  if (!hasHeaderKeyword) return null;

  const normalized = normalizeBesmm4Section(combined);
  return normalized || null;
}

/**
 * Check if a row is a non-measurement header or subtotal summary
 */
export function isNonMeasurementRow(
  desc: string, 
  itemTitle?: string, 
  unit?: string, 
  qty?: number, 
  rate?: number, 
  amount?: number
): boolean {
  const combined = `${itemTitle || ''} ${desc || ''}`.toLowerCase().trim();
  
  if (!combined && !qty) return true;

  // Subtotals, collections, and page balances
  if (/^(total|sub-?total|collection|summary|carried forward|brought forward|page\s*\d*\s*total|grand total|balance forward|carried to|brought from)/i.test(combined)) {
    return true;
  }
  if (combined.includes('carried to collection') || 
      combined.includes('carried to summary') || 
      combined.includes('brought from collection') ||
      combined.includes('brought from summary') ||
      combined.includes('to collection') ||
      combined.includes('to summary') ||
      combined.includes('page total')) {
    return true;
  }

  // Pure trade headers without qty, rate, amount, and unit
  if ((!qty || qty === 0) && (!rate || rate === 0) && (!amount || amount === 0) && (!unit || unit === 'item' || unit === '')) {
    const isSectionHeader = /^(bill no|element|section|part|trade|division)\s*[:\d]/i.test(combined) ||
      (combined.length < 60 && BESMM4_SECTIONS.some(s => combined === s.toLowerCase() || combined === `bill no: ${s.toLowerCase()}`));
    if (isSectionHeader) return true;
  }

  return false;
}

/**
 * Find header row index and column indices from a 2D array of rows
 */
export function detectHeaderAndColumns(rows: any[][]): { headerIndex: number; mapping: ColumnMapping; headers: string[] } {
  let bestHeaderIndex = -1;
  let maxScore = -1;
  const bestMapping: ColumnMapping = {
    itemNumberCol: -1,
    sectionCol: -1,
    itemCol: -1,
    descriptionCol: -1,
    unitCol: -1,
    qtyCol: -1,
    rateCol: -1,
    amountCol: -1,
  };

  // Inspect first 35 rows for header patterns
  const scanLimit = Math.min(rows.length, 35);
  for (let r = 0; r < scanLimit; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    let score = 0;
    const currentMapping: ColumnMapping = {
      itemNumberCol: -1,
      sectionCol: -1,
      itemCol: -1,
      descriptionCol: -1,
      unitCol: -1,
      qtyCol: -1,
      rateCol: -1,
      amountCol: -1,
    };

    // Sub-row lookahead: check if next row contains currency or unit indicators (e.g. Row 1: Rate, Row 2: N)
    const nextRow = r + 1 < rows.length && Array.isArray(rows[r + 1]) ? rows[r + 1] : [];
    const maxCols = Math.max(row.length, nextRow.length);

    // Pre-check if any cell in row explicitly matches description keywords
    const hasExplicitDescCell = row.some(cell => {
      const c = String(cell || '').trim().toLowerCase();
      return /^(description(\s*of\s*works?)?|item\s*description|particulars?|spec(ification)?s?|details)$/i.test(c) ||
        c.includes('description') || c.includes('particular');
    });

    for (let c = 0; c < maxCols; c++) {
      const cellText = String(row[c] || '').trim();
      const subCellText = String(nextRow[c] || '').trim();
      const combinedCell = `${cellText} ${subCellText}`.trim().toLowerCase().replace(/\s+/g, ' ');
      const cell = cellText.toLowerCase().replace(/\s+/g, ' ');
      if (!cell && !combinedCell) continue;

      // Item Number / Code / S/N
      if (/^(item\s*(no\.?|#|num|nr)?|s\/?n|sn|no\.?|code|ref\.?|reference|pos\.?|serial(\s*no)?)$/i.test(cell) ||
          /^(item\s*(no\.?|#|num|nr)?|s\/?n|sn|no\.?|code|ref\.?)$/i.test(combinedCell)) {
        if (cell === 'item' && !hasExplicitDescCell) {
          // Handled below as description
        } else if (currentMapping.itemNumberCol === -1) {
          currentMapping.itemNumberCol = c;
          score += 5;
        }
      }

      // Section / Trade / Bill
      if (/^(section|trade|bill(\s*no\.?)?|element|category|group|division|work\s*package)$/i.test(cell) ||
          cell === 'trade' || cell === 'bill') {
        if (currentMapping.sectionCol === -1) {
          currentMapping.sectionCol = c;
          score += 5;
        }
      }

      // Description / Specification / Work Item
      if (/^(description(\s*of\s*works?)?|item\s*description|particulars?|spec(ification)?s?|material(\s*description)?|work(\s*item|\s*description)?|scope(\s*of\s*work)?|activity|activities|trade\s*item|details|item\s*name|item\s*title|works?)$/i.test(cell) ||
          cell.includes('description') || cell.includes('particular') || cell.includes('specification') ||
          combinedCell.includes('description') || combinedCell.includes('particular')) {
        if (currentMapping.descriptionCol === -1) {
          currentMapping.descriptionCol = c;
          if (currentMapping.itemCol === -1) currentMapping.itemCol = c;
          score += 10;
        }
      }

      // If cell is literally "item" or "items" or "title" or "name", and no description column set yet
      if (/^(item|items|title|name)$/i.test(cell)) {
        if (currentMapping.descriptionCol === -1 && !hasExplicitDescCell) {
          currentMapping.descriptionCol = c;
          currentMapping.itemCol = c;
          score += 8;
        } else if (currentMapping.itemCol === -1) {
          currentMapping.itemCol = c;
          score += 4;
        }
      }

      // Unit of measurement
      if (/^(unit(\s*of\s*measure(ment)?)?|units?|uom|measure(ment)?)$/i.test(cell) || cell === 'unit' || cell === 'units' ||
          combinedCell.includes('unit of measure') || combinedCell.includes('uom')) {
        if (currentMapping.unitCol === -1) {
          currentMapping.unitCol = c;
          score += 7;
        }
      }

      // Quantity
      if (/^(qty|quantity|quantities|take-?off(\s*qty)?|measured(\s*qty)?|est(\.?|\s*)qty|volume|count)$/i.test(cell) ||
          cell.includes('qty') || cell.includes('quantity') ||
          combinedCell.includes('qty') || combinedCell.includes('quantity')) {
        if (currentMapping.qtyCol === -1) {
          currentMapping.qtyCol = c;
          score += 8;
        }
      }

      // Unit Rate (Supports all Nigerian QS formats: Rate (N), Rate (NGN), Rate ₦, Rate (N:K), Price, Unit Price, etc.)
      if (/^(rate(\s*\(?(₦|ngn|n|n:k|#|naira)\)?)?|unit\s*rate|price|unit\s*price|cost|unit\s*cost|tender\s*rate|priced\s*rate|billing\s*rate|rate\/unit|price\/unit|cost\/unit)$/i.test(cell) ||
          /^(rate(\s*\(?(₦|ngn|n|n:k|#|naira)\)?)?|unit\s*rate|price|unit\s*price|cost|unit\s*cost|tender\s*rate)$/i.test(combinedCell) ||
          cell.includes('rate') || cell.includes('unit price') || cell.includes('unit rate') ||
          combinedCell.includes('rate') || combinedCell.includes('unit price')) {
        if (currentMapping.rateCol === -1) {
          currentMapping.rateCol = c;
          score += 8;
        }
      }

      // Amount / Total (Supports Amount (N), Amount (NGN), Amount ₦, Amount (N:K), Total (N), Total, Subtotal, Line Total, etc.)
      if (/^(amount(\s*\(?(₦|ngn|n|n:k|#|naira)\)?)?|total(\s*cost|\s*price|\s*amount|\s*\(?(₦|ngn|n|n:k|#|naira)\)?)?|total|value|sub-?total|line\s*total|extended(\s*amount|\s*price)?|cost)$/i.test(cell) ||
          /^(amount(\s*\(?(₦|ngn|n|n:k|#|naira)\)?)?|total(\s*cost|\s*price|\s*amount)?|total|value|sub-?total)$/i.test(combinedCell) ||
          cell.includes('amount') || cell === 'total' || cell.includes('total price') || cell.includes('total cost') || cell.includes('total amount') ||
          combinedCell.includes('amount') || combinedCell.includes('total')) {
        if (currentMapping.amountCol === -1) {
          currentMapping.amountCol = c;
          score += 6;
        }
      }
    }

    // Cohesion bonus: standard BOQ rows contain at least description + (qty or rate or amount)
    if (currentMapping.descriptionCol !== -1 && (currentMapping.qtyCol !== -1 || currentMapping.rateCol !== -1 || currentMapping.amountCol !== -1)) {
      score += 15;
    }

    if (score > maxScore) {
      maxScore = score;
      bestHeaderIndex = r;
      Object.assign(bestMapping, currentMapping);
    }
  }

  // Fallback heuristic: if no strong header detected, analyze data distribution across rows 0 to 30
  if (bestHeaderIndex === -1 || maxScore < 8 || bestMapping.descriptionCol === -1) {
    const fallbackHeaderIdx = bestHeaderIndex >= 0 ? bestHeaderIndex : 0;
    const maxCols = Math.max(...rows.slice(0, 30).map(r => Array.isArray(r) ? r.length : 0), 1);
    
    // Column statistics
    const colStats: Array<{
      colIdx: number;
      textCount: number;
      avgTextLen: number;
      unitCount: number;
      numCount: number;
      avgVal: number;
    }> = [];

    const commonUnits = new Set(['m', 'm2', 'm3', 'nr', 'no', 'kg', 't', 'item', 'sum', 'ls', 'sqm', 'cum', 'pcs', 'bags', 'ea']);

    for (let c = 0; c < maxCols; c++) {
      let textCount = 0;
      let totalTextLen = 0;
      let unitCount = 0;
      let numCount = 0;
      let totalNum = 0;

      const checkRows = rows.slice(0, 30);
      for (const row of checkRows) {
        if (!Array.isArray(row) || row.length <= c) continue;
        const cell = String(row[c] || '').trim();
        if (!cell) continue;

        const num = cleanNumber(cell);
        const lower = cell.toLowerCase();
        if (commonUnits.has(lower)) {
          unitCount++;
        } else if (num !== 0 || cell === '0') {
          numCount++;
          totalNum += num;
        } else if (cell.length >= 2) {
          textCount++;
          totalTextLen += cell.length;
        }
      }

      colStats.push({
        colIdx: c,
        textCount,
        avgTextLen: textCount > 0 ? totalTextLen / textCount : 0,
        unitCount,
        numCount,
        avgVal: numCount > 0 ? totalNum / numCount : 0,
      });
    }

    // Heuristics:
    // 1. Description col is column with highest textCount and highest average length
    const candidateDescCols = [...colStats].sort((a, b) => (b.textCount * b.avgTextLen) - (a.textCount * a.avgTextLen));
    if (candidateDescCols.length > 0 && candidateDescCols[0].textCount > 0) {
      bestMapping.descriptionCol = candidateDescCols[0].colIdx;
      bestMapping.itemCol = candidateDescCols[0].colIdx;
    } else {
      bestMapping.descriptionCol = maxCols > 1 ? 1 : 0;
    }

    // 2. Unit col is column with highest unitCount
    const candidateUnitCols = [...colStats].filter(c => c.colIdx !== bestMapping.descriptionCol).sort((a, b) => b.unitCount - a.unitCount);
    if (candidateUnitCols.length > 0 && candidateUnitCols[0].unitCount > 0) {
      bestMapping.unitCol = candidateUnitCols[0].colIdx;
    }

    // 3. Numeric columns: sort remaining columns by numCount
    const candidateNumCols = [...colStats]
      .filter(c => c.colIdx !== bestMapping.descriptionCol && c.colIdx !== bestMapping.unitCol && c.numCount > 0)
      .sort((a, b) => a.colIdx - b.colIdx);

    if (candidateNumCols.length >= 1) {
      bestMapping.qtyCol = candidateNumCols[0].colIdx;
    }
    if (candidateNumCols.length >= 2) {
      bestMapping.rateCol = candidateNumCols[1].colIdx;
    }
    if (candidateNumCols.length >= 3) {
      bestMapping.amountCol = candidateNumCols[2].colIdx;
    }

    // 4. Item number col: column 0 if it's before description
    if (bestMapping.descriptionCol > 0) {
      bestMapping.itemNumberCol = 0;
    }

    bestHeaderIndex = fallbackHeaderIdx;
  }

  // Cross-validation: If rateCol or amountCol is missing, use mathematical cross-validation on data rows
  // In any valid BOQ: row[amountCol] ≈ row[qtyCol] * row[rateCol]
  if (bestHeaderIndex >= 0 && (bestMapping.rateCol === -1 || bestMapping.amountCol === -1)) {
    const dataSample = rows.slice(bestHeaderIndex + 1, Math.min(rows.length, bestHeaderIndex + 40));
    const maxCols = Math.max(...dataSample.map(r => Array.isArray(r) ? r.length : 0), 0);
    
    // Find candidate numeric columns
    const numericCols: number[] = [];
    for (let c = 0; c < maxCols; c++) {
      if (c === bestMapping.itemNumberCol || c === bestMapping.descriptionCol || c === bestMapping.itemCol || c === bestMapping.unitCol || c === bestMapping.sectionCol) {
        continue;
      }
      let numCount = 0;
      for (const r of dataSample) {
        if (!Array.isArray(r) || r.length <= c) continue;
        const v = cleanNumber(r[c]);
        if (v > 0) numCount++;
      }
      if (numCount >= 2) {
        numericCols.push(c);
      }
    }

    // Try to find (qtyCol, rateCol, amountCol) such that qty * rate ≈ amount
    const qtyColsToTest = bestMapping.qtyCol >= 0 ? [bestMapping.qtyCol] : numericCols;
    let foundMathMatch = false;

    for (const qCol of qtyColsToTest) {
      for (const rCol of numericCols) {
        if (rCol === qCol) continue;
        for (const aCol of numericCols) {
          if (aCol === qCol || aCol === rCol) continue;
          let matchCount = 0;
          for (const row of dataSample) {
            if (!Array.isArray(row)) continue;
            const q = cleanNumber(row[qCol]);
            const r = cleanNumber(row[rCol]);
            const a = cleanNumber(row[aCol]);
            if (q > 0 && r > 0 && a > 0) {
              const product = q * r;
              if (Math.abs(product - a) <= 2 || Math.abs(product - a) / a < 0.01) {
                matchCount++;
              }
            }
          }
          if (matchCount >= 2) {
            bestMapping.qtyCol = qCol;
            bestMapping.rateCol = rCol;
            bestMapping.amountCol = aCol;
            foundMathMatch = true;
            break;
          }
        }
        if (foundMathMatch) break;
      }
      if (foundMathMatch) break;
    }

    // If mathematical test did not find a triplet, assign remaining numeric columns in typical QS order
    if (!foundMathMatch) {
      const remainingNumCols = numericCols.filter(c => c !== bestMapping.qtyCol);
      if (bestMapping.rateCol === -1 && remainingNumCols.length >= 1) {
        bestMapping.rateCol = remainingNumCols[0];
      }
      if (bestMapping.amountCol === -1 && remainingNumCols.length >= 2) {
        bestMapping.amountCol = remainingNumCols[1];
      }
    }
  }

  const rawHeaders = (rows[bestHeaderIndex] || []).map((h, i) => String(h || `Column ${i + 1}`).trim());

  return {
    headerIndex: bestHeaderIndex,
    mapping: bestMapping,
    headers: rawHeaders,
  };
}

/**
 * Extract BoqItems from a 2D row array using given header index and column mapping
 */
export function extractBoqItemsFromRows(
  rows: any[][],
  headerIndex: number,
  mapping: ColumnMapping,
  defaultStatus: QsVerificationStatus = 'Imported',
  fallbackSection?: string
): BoqItem[] {
  const items: BoqItem[] = [];
  let currentSection = fallbackSection ? (normalizeBesmm4Section(fallbackSection) || 'Substructure') : '';
  let runningNumber = 1;

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Check if entire row is empty
    const hasAnyContent = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (!hasAnyContent) continue;

    // 1. Check if this entire row is a section heading (e.g. "BILL NO 2: SUBSTRUCTURE", "SUPERSTRUCTURE", "ROOFING")
    const detectedHeaderSection = detectSectionHeader(row);
    if (detectedHeaderSection) {
      currentSection = detectedHeaderSection;
      continue; // Skip section title row as a measurable line item
    }

    const rawItemNo = mapping.itemNumberCol >= 0 ? String(row[mapping.itemNumberCol] || '').trim() : '';
    const rawSection = mapping.sectionCol >= 0 ? String(row[mapping.sectionCol] || '').trim() : '';
    let rawDesc = mapping.descriptionCol >= 0 ? String(row[mapping.descriptionCol] || '').trim() : '';
    let rawItem = mapping.itemCol >= 0 ? String(row[mapping.itemCol] || '').trim() : '';
    const rawUnit = mapping.unitCol >= 0 ? String(row[mapping.unitCol] || '').trim() : '';
    let qty = mapping.qtyCol >= 0 ? cleanNumber(row[mapping.qtyCol]) : 0;
    const rawRate = mapping.rateCol >= 0 ? cleanNumber(row[mapping.rateCol]) : 0;
    const rawAmount = mapping.amountCol >= 0 ? cleanNumber(row[mapping.amountCol]) : 0;

    // Skip repeated column headers that appear on subsequent printed pages (e.g. at every 20-35 rows in a 500-item document)
    const isRepeatedHeader = (
      (/^(item(\s*(no\.?|#))?|s\/?n|no\.?|ref\.?)$/i.test(rawItemNo) ||
       /^(description(\s*of\s*works?)?|particulars?|spec(ification)?s?|details)$/i.test(rawDesc)) &&
      (/^(unit(\s*of\s*measure)?|uom|measure)$/i.test(rawUnit) ||
       /^(qty|quantity|quantities)$/i.test(String(row[mapping.qtyCol] || '').trim()) ||
       /^(rate|price|unit\s*rate)$/i.test(String(row[mapping.rateCol] || '').trim()))
    );
    if (isRepeatedHeader) continue;

    // Fallback: If description column was not mapped or is empty, inspect other columns for text
    if (!rawDesc && !rawItem) {
      for (let c = 0; c < row.length; c++) {
        if (c === mapping.itemNumberCol || c === mapping.unitCol || c === mapping.qtyCol || c === mapping.rateCol || c === mapping.amountCol) {
          continue;
        }
        const candidate = String(row[c] || '').trim();
        if (candidate.length >= 3 && isNaN(Number(candidate))) {
          rawDesc = candidate;
          break;
        }
      }
    }

    // Check if subtotal or collection row
    if (isNonMeasurementRow(rawDesc, rawItem, rawUnit, qty, rawRate, rawAmount)) {
      continue;
    }

    // If row has an explicit trade section column that has content, normalize and update currentSection
    if (rawSection) {
      const normalizedFromCol = normalizeBesmm4Section(rawSection);
      if (normalizedFromCol) {
        currentSection = normalizedFromCol;
      }
    }

    // Handle multiline specification continuation notes
    // If a row has text but no unit, qty, rate, or amount, append it to the preceding item's description
    if ((!qty || qty === 0) && (!rawRate || rawRate === 0) && (!rawAmount || rawAmount === 0) && (!rawUnit || rawUnit === '')) {
      if (items.length > 0 && rawDesc.length > 3) {
        items[items.length - 1].description += `\n${rawDesc}`;
        continue;
      }
    }

    // Require either a description or an item name
    if (!rawDesc && !rawItem) {
      continue;
    }

    // Normalize quantity: if 0 or missing, default to 1 (e.g. provisional sum or unpriced tender item)
    if (qty === 0) {
      qty = 1;
    }

    // Bidirectional Rate & Amount Calculation:
    // 1. If rate is provided, calculate or use explicit amount
    // 2. If amount is provided but rate is missing, derive unit rate = amount / qty
    let calculatedRate = rawRate;
    let calculatedAmount = rawAmount;

    if (calculatedRate > 0 && calculatedAmount === 0 && qty > 0) {
      calculatedAmount = Math.round(qty * calculatedRate);
    } else if (calculatedAmount > 0 && calculatedRate === 0 && qty > 0) {
      calculatedRate = Math.round((calculatedAmount / qty) * 100) / 100;
    } else if (calculatedAmount === 0 && calculatedRate === 0) {
      calculatedAmount = 0;
      calculatedRate = 0;
    }

    // Determine final section:
    // Priority:
    // 1. Explicit normalized section column on row
    // 2. Section header active from preceding rows (e.g. "BILL NO. 2 - SUPERSTRUCTURE")
    // 3. Keyword analysis on item description
    // 4. Default to 'Substructure'
    const descSection = categorizeBesmm4Section(rawDesc, rawItem);
    const finalSection = (rawSection ? normalizeBesmm4Section(rawSection) : '') ||
                         currentSection ||
                         descSection ||
                         'Substructure';

    const finalUnit = normalizeUnit(rawUnit || (calculatedAmount > 0 && calculatedRate === 0 ? 'sum' : 'item'));
    const finalItemTitle = rawItem || (rawDesc.length > 40 ? rawDesc.substring(0, 40).trim() + '...' : rawDesc);

    items.push({
      id: `imported-${Date.now()}-${runningNumber}-${Math.random().toString(36).substring(2, 6)}`,
      item_number: runningNumber,
      item_code: rawItemNo || `${runningNumber}`,
      section: finalSection,
      item: finalItemTitle,
      description: rawDesc || finalItemTitle,
      unit: finalUnit,
      qty: qty,
      rate: calculatedRate,
      amount: calculatedAmount,
      source: 'MANUAL_ENTRY',
      verification_status: defaultStatus,
      confidence: 1.0,
      notes: 'Imported from external Bill of Quantities',
    });

    runningNumber++;
  }

  return items;
}

/**
 * Extract and combine BOQ items across all eligible worksheets in a workbook
 */
export function extractAllSheetsItems(
  allSheets: Record<string, any[][]>,
  sheetNames: string[]
): {
  allItems: BoqItem[];
  sheetItemCounts: Record<string, number>;
} {
  const allItems: BoqItem[] = [];
  const sheetItemCounts: Record<string, number> = {};
  let globalRunningNumber = 1;

  for (const name of sheetNames) {
    const rows = allSheets[name] || [];
    if (rows.length === 0) {
      sheetItemCounts[name] = 0;
      continue;
    }

    const lowerName = name.toLowerCase();
    // Skip summary / cover / index sheets from measurement item pooling
    if (/^(cover(\s*page)?|index|contents|summary|instructions|general\s*notes|project\s*info|title|signatures?)$/i.test(lowerName)) {
      sheetItemCounts[name] = 0;
      continue;
    }

    const { headerIndex, mapping } = detectHeaderAndColumns(rows);
    const sheetItems = extractBoqItemsFromRows(rows, headerIndex, mapping, 'Imported', name);
    sheetItemCounts[name] = sheetItems.length;

    for (const it of sheetItems) {
      it.item_number = globalRunningNumber++;
      allItems.push(it);
    }
  }

  return { allItems, sheetItemCounts };
}

/**
 * Parse an uploaded file (Excel, CSV, TSV, or JSON) into raw sheets and extracted BOQ items
 */
export async function parseBoqFile(file: File): Promise<ParsedBoqResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'json') {
    const text = await file.text();
    const data = JSON.parse(text);
    const rawItems = Array.isArray(data) ? data : data.items || [];
    const items: BoqItem[] = rawItems.map((it: any, idx: number) => ({
      id: it.id || `imported-json-${Date.now()}-${idx + 1}`,
      item_number: it.item_number || idx + 1,
      item_code: it.item_code || `${idx + 1}`,
      section: it.section || categorizeBesmm4Section(it.description || '', it.item || ''),
      item: it.item || it.description?.substring(0, 30) || `Item ${idx + 1}`,
      description: it.description || it.item || '',
      unit: normalizeUnit(it.unit),
      qty: cleanNumber(it.qty) || 1,
      rate: cleanNumber(it.rate),
      amount: cleanNumber(it.amount) || cleanNumber(it.qty) * cleanNumber(it.rate),
      source: 'MANUAL_ENTRY',
      verification_status: 'Imported',
      confidence: 1.0,
    }));

    return {
      fileName: file.name,
      sheetNames: ['Main BOQ'],
      activeSheet: 'Main BOQ',
      allSheets: { 'Main BOQ': [] },
      headers: ['Item', 'Section', 'Description', 'Unit', 'Qty', 'Rate', 'Amount'],
      headerRowIndex: 0,
      mapping: {
        itemNumberCol: 0,
        sectionCol: 1,
        itemCol: 0,
        descriptionCol: 2,
        unitCol: 3,
        qtyCol: 4,
        rateCol: 5,
        amountCol: 6,
      },
      items,
      rawRowsCount: items.length,
      combinedAllSheetsItems: items,
      sheetItemCounts: { 'Main BOQ': items.length },
    };
  }

  // Excel or Delimited text file (.xlsx, .xls, .csv, .tsv)
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellFormula: true,
    cellNF: true,
    cellText: true,
  });

  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    throw new Error('No worksheets found in this spreadsheet.');
  }

  const allSheets: Record<string, any[][]> = {};
  for (const name of sheetNames) {
    const ws = workbook.Sheets[name];
    // Safeguard: Ensure worksheet !ref spans all cells so SheetJS does not truncate at row 15
    ensureFullWorksheetRange(ws);
    allSheets[name] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as any[][];
  }

  // Evaluate EVERY sheet to select the best worksheet containing measurement line items
  type SheetCandidate = {
    name: string;
    rows: any[][];
    headerIndex: number;
    mapping: ColumnMapping;
    headers: string[];
    items: BoqItem[];
    score: number;
  };

  const candidates: SheetCandidate[] = [];

  for (const name of sheetNames) {
    const rows = allSheets[name] || [];
    if (rows.length === 0) continue;

    const { headerIndex, mapping, headers } = detectHeaderAndColumns(rows);
    const items = extractBoqItemsFromRows(rows, headerIndex, mapping, 'Imported', name);

    // Calculate sheet relevance score
    let score = items.length * 10;
    const lowerName = name.toLowerCase();

    // Deprioritize cover sheets, indexes, notes, summaries
    if (/^(cover(\s*page)?|index|contents|summary|instructions|general\s*notes|project\s*info|title)$/i.test(lowerName)) {
      score -= 500;
    } else if (/cover|index|summary|instruction|notes|sign/i.test(lowerName)) {
      score -= 200;
    }

    // Prioritize sheets with BOQ keywords
    if (/^(boq|bill(\s*of\s*quantities)?|measured(\s*works)?|estimate|take-?off|schedule(\s*of\s*works)?)$/i.test(lowerName)) {
      score += 200;
    } else if (/boq|bill|measured|work|substructure|frame|finishes|external/i.test(lowerName)) {
      score += 100;
    }

    candidates.push({
      name,
      rows,
      headerIndex,
      mapping,
      headers,
      items,
      score,
    });
  }

  // Extract combined items across all non-summary worksheets in the workbook
  const { allItems: combinedItems, sheetItemCounts } = extractAllSheetsItems(allSheets, sheetNames);

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Pick top candidate
  const bestCandidate = candidates.length > 0 ? candidates[0] : null;

  // If multi-sheet workbook contains more total items across sheets than a single sheet,
  // default to '__ALL_SHEETS__' so the full 500-item BOQ is imported in one click!
  const hasMultipleProductiveSheets = sheetNames.length > 1 && combinedItems.length > (bestCandidate ? bestCandidate.items.length : 0);
  const activeSheet = hasMultipleProductiveSheets ? '__ALL_SHEETS__' : (bestCandidate ? bestCandidate.name : sheetNames[0]);
  const activeRows = allSheets[bestCandidate ? bestCandidate.name : sheetNames[0]] || [];
  const headerIndex = bestCandidate ? bestCandidate.headerIndex : 0;
  const mapping = bestCandidate ? bestCandidate.mapping : detectHeaderAndColumns(activeRows).mapping;
  const headers = bestCandidate ? bestCandidate.headers : (activeRows[0] || []).map((h, i) => String(h || `Column ${i + 1}`).trim());
  const items = hasMultipleProductiveSheets ? combinedItems : (bestCandidate ? bestCandidate.items : extractBoqItemsFromRows(activeRows, headerIndex, mapping));

  return {
    fileName: file.name,
    sheetNames,
    activeSheet,
    allSheets,
    headers,
    headerRowIndex: headerIndex,
    mapping,
    items,
    rawRowsCount: items.length,
    sheetItemCounts,
    combinedAllSheetsItems: combinedItems,
  };
}

/**
 * Parse raw pasted spreadsheet text (e.g. copied from Excel or Word table)
 */
export function parsePastedBoqText(text: string): ParsedBoqResult {
  const lines = text.trim().split(/\r?\n/);
  const rows: any[][] = lines.map(line => {
    // If line has tabs, split by tab; otherwise split by comma if valid CSV
    if (line.includes('\t')) {
      return line.split('\t').map(c => c.trim());
    }
    // Simple CSV parser supporting quotes
    return line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
  });

  const { headerIndex, mapping, headers } = detectHeaderAndColumns(rows);
  const items = extractBoqItemsFromRows(rows, headerIndex, mapping);

  return {
    fileName: 'Pasted_Spreadsheet_Data',
    sheetNames: ['Pasted Data'],
    activeSheet: 'Pasted Data',
    allSheets: { 'Pasted Data': rows },
    headers,
    headerRowIndex: headerIndex,
    mapping,
    items,
    rawRowsCount: rows.length,
  };
}

/**
 * Generates and downloads a sample Nigerian BOQ Excel template
 */
export function downloadBoqTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const templateHeaders = [
    'Item No',
    'Trade Section',
    'Item Title',
    'Description of Works & Specification',
    'Unit',
    'Quantity',
    'Unit Rate (NGN)',
    'Amount (NGN)'
  ];

  const sampleRows = [
    ['1.1', 'Substructure', 'Site Clearance', 'Clear site of shrubs, small bushes, roots and cart away rubbish 50m off site', 'm2', 250, 650, 162500],
    ['1.2', 'Substructure', 'Trench Excavation', 'Excavate foundation trenches not exceeding 1.50m depth starting from ground level', 'm3', 48, 3800, 182400],
    ['1.3', 'Substructure', 'Hardcore Bed', '300mm Thick consolidated granite/laterite hardcore filling under floor slab', 'm2', 140, 4500, 630000],
    ['1.4', 'Substructure', 'Damp Proof Membrane', '0.25mm Thick polythene damp-proof membrane (DPM) laid on sand blinding', 'm2', 140, 1800, 252000],
    ['2.1', 'Reinforced Concrete Frame', 'RC Ground Beams', 'Vibrated reinforced in-situ concrete Grade 25 in foundation ground beams', 'm3', 18, 115000, 2070000],
    ['2.2', 'Reinforced Concrete Frame', 'RC Columns', 'Vibrated reinforced concrete Grade 25 in isolated 225x225mm columns', 'm3', 8, 125000, 1000000],
    ['2.3', 'Reinforced Concrete Frame', 'High Yield Rebar', 'High yield deformed steel rebar (Y12 & Y16) cutting, bending & placing', 'kg', 2400, 1450, 3480000],
    ['3.1', 'Blockwork & Partitioning', '225mm External Walls', '225mm Vibrated hollow sandcrete blockwork bedded in cement mortar (1:4)', 'm2', 320, 13500, 4320000],
    ['3.2', 'Blockwork & Partitioning', '150mm Internal Walls', '150mm Sandcrete hollow blocks in non-loadbearing room partitions', 'm2', 180, 11500, 2070000],
    ['4.1', 'Roofing & Rainwater Goods', 'Timber Trusses', 'Treated sawn hardwood timber in roof framing, king post trusses and purlins', 'm', 350, 2800, 980000],
    ['4.2', 'Roofing & Rainwater Goods', 'Aluminium Longspan', '0.55mm Thickness step-tile aluminium longspan roofing sheets with ridge caps', 'm2', 210, 14800, 3108000],
    ['5.1', 'Carpentry, Doors & Windows', 'Panel Doors', 'Solid core hardwood flush panel doors (900x2100mm) including frames & mortice locks', 'nr', 8, 85000, 680000],
    ['5.2', 'Carpentry, Doors & Windows', 'Aluminium Windows', 'Powder-coated aluminium sliding glazed windows (1200x1200mm) with insect screens', 'nr', 12, 65000, 780000],
    ['6.1', 'Finishes (Plastering, Tiling & Screed)', 'Wall Plaster', '15mm Cement-sand (1:4) plaster to internal walls finished smooth', 'm2', 620, 3500, 2170000],
    ['6.2', 'Finishes (Plastering, Tiling & Screed)', 'Floor Tiling', '600x600mm Vitrified porcelain floor tiles bedded in cementitious adhesive', 'm2', 180, 18500, 3330000],
    ['7.1', 'Mechanical & Electrical Services', 'Sanitary Fittings', 'Vitreous china water closet suites, wash hand basins, and shower mixers', 'nr', 4, 185000, 740000],
    ['7.2', 'Mechanical & Electrical Services', 'Conduit & Wiring', 'Concealed PVC conduit, 2.5mm copper cable wiring and 13A double socket outlets', 'nr', 35, 12500, 437500],
    ['8.1', 'External Works & Preliminaries', 'Interlocking Paving', 'Interlocking concrete paving stones to driveway and vehicle parking area', 'm2', 120, 12500, 1500000],
  ];

  if (format === 'csv') {
    const csvContent = [
      templateHeaders.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Standard_Nigerian_BOQ_Template.csv';
    link.click();
    return;
  }

  // XLSX
  const ws = XLSX.utils.aoa_to_sheet([templateHeaders, ...sampleRows]);
  // Set column widths
  ws['!cols'] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 25 },
    { wch: 55 },
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Standard BOQ');
  XLSX.writeFile(wb, 'Standard_Nigerian_BOQ_Template.xlsx');
}

/**
 * Built-in sample Nigerian 2-Storey Residential Duplex BOQ ready to load in 1-click
 */
export function getSampleNigerianBoq(): BoqItem[] {
  const sampleItems: Array<{
    code: string;
    section: string;
    item: string;
    desc: string;
    unit: string;
    qty: number;
    rate: number;
  }> = [
    { code: '1.1', section: 'Substructure', item: 'Site Clearance', desc: 'Clear site of vegetation, shrubs and grub up roots; dispose debris off site', unit: 'm2', qty: 350, rate: 650 },
    { code: '1.2', section: 'Substructure', item: 'Trench Excavation', desc: 'Excavate foundation trenches not exceeding 1.50m deep starting from formation level', unit: 'm3', qty: 65, rate: 3800 },
    { code: '1.3', section: 'Substructure', item: 'Hardcore Filling', desc: '300mm Consolidated laterite/granite hardcore filling under ground floor slab', unit: 'm2', qty: 180, rate: 4500 },
    { code: '1.4', section: 'Substructure', item: 'Damp Proof Membrane', desc: '0.25mm Thick polythene damp-proof membrane (DPM) with 150mm laps', unit: 'm2', qty: 180, rate: 1800 },
    { code: '1.5', section: 'Substructure', item: 'Mass Concrete Blinding', desc: '50mm Mass concrete Grade 15 blinding under foundation trenches', unit: 'm3', qty: 9, rate: 85000 },
    { code: '1.6', section: 'Substructure', item: 'Foundation Footing Concrete', desc: 'Vibrated reinforced in-situ concrete Grade 25 in strip foundation footings', unit: 'm3', qty: 24, rate: 110000 },
    { code: '2.1', section: 'Reinforced Concrete Frame', item: 'RC Columns', desc: 'Vibrated reinforced concrete Grade 25 in 225x225mm ground to first floor columns', unit: 'm3', qty: 12, rate: 125000 },
    { code: '2.2', section: 'Reinforced Concrete Frame', item: 'First Floor Beams', desc: 'Vibrated reinforced concrete Grade 25 in 225x450mm floor beams', unit: 'm3', qty: 16, rate: 120000 },
    { code: '2.3', section: 'Reinforced Concrete Frame', item: '150mm Suspended Slab', desc: '150mm Thick suspended reinforced concrete Grade 25 floor slab', unit: 'm2', qty: 160, rate: 28500 },
    { code: '2.4', section: 'Reinforced Concrete Frame', item: 'High Yield Rebar Y12-Y20', desc: 'High yield deformed reinforcement bars (Y12, Y16, Y20) including bending & wire', unit: 'kg', qty: 3850, rate: 1450 },
    { code: '2.5', section: 'Reinforced Concrete Frame', item: 'Formwork to Beams & Columns', desc: 'Sawn timber formwork to sides of beams, columns and soffits', unit: 'm2', qty: 220, rate: 8500 },
    { code: '3.1', section: 'Blockwork & Partitioning', item: '225mm Sandcrete Walls', desc: '225mm Vibrated hollow sandcrete blockwork bedded in cement mortar (1:4)', unit: 'm2', qty: 420, rate: 13500 },
    { code: '3.2', section: 'Blockwork & Partitioning', item: '150mm Internal Partition', desc: '150mm Sandcrete hollow blockwork in non-loadbearing room partitions', unit: 'm2', qty: 240, rate: 11500 },
    { code: '4.1', section: 'Roofing & Rainwater Goods', item: 'Treated Hardwood Framing', desc: 'Treated sawn hardwood timber framing in king post roof trusses, ties and purlins', unit: 'm', qty: 480, rate: 2800 },
    { code: '4.2', section: 'Roofing & Rainwater Goods', item: 'Aluminium Longspan 0.55mm', desc: '0.55mm Steptile aluminium longspan roofing sheets with matching ridge caps', unit: 'm2', qty: 260, rate: 14800 },
    { code: '5.1', section: 'Carpentry, Doors & Windows', item: 'Security Steel Entry Doors', desc: 'High security steel entrance doors (1200x2100mm) with multi-point locking system', unit: 'nr', qty: 2, rate: 180000 },
    { code: '5.2', section: 'Carpentry, Doors & Windows', item: 'Solid Timber Room Doors', desc: 'Solid core timber flush doors (900x2100mm) including hardwood frame and mortice lock', unit: 'nr', qty: 10, rate: 85000 },
    { code: '5.3', section: 'Carpentry, Doors & Windows', item: 'Aluminium Sliding Windows', desc: 'Powder-coated aluminium sliding glazed windows (1200x1200mm) with burglar proof', unit: 'nr', qty: 16, rate: 65000 },
    { code: '6.1', section: 'Finishes (Plastering, Tiling & Screed)', item: 'Cement Sand Plaster', desc: '15mm Thick cement and sand (1:4) render to internal and external wall faces', unit: 'm2', qty: 980, rate: 3500 },
    { code: '6.2', section: 'Finishes (Plastering, Tiling & Screed)', item: 'Vitrified Floor Tiles', desc: '600x600mm Vitrified ceramic floor tiles laid on screeded bed with grouted joints', unit: 'm2', qty: 260, rate: 18500 },
    { code: '6.3', section: 'Finishes (Plastering, Tiling & Screed)', item: 'Emulsion Paint (3 Coats)', desc: 'Prepare and apply 3 coats of quality acrylic emulsion paint to plastered walls', unit: 'm2', qty: 980, rate: 2200 },
    { code: '7.1', section: 'Mechanical & Electrical Services', item: 'Sanitary Ware Package', desc: 'Complete dual flush WC suites, vanity basins with mixer taps and shower heads', unit: 'nr', qty: 5, rate: 195000 },
    { code: '7.2', section: 'Mechanical & Electrical Services', item: 'PPR & PVC Reticulation', desc: 'PPR hot/cold water supply pipework and PVC soil and waste drainage network', unit: 'sum', qty: 1, rate: 1450000 },
    { code: '7.3', section: 'Mechanical & Electrical Services', item: 'Conduit & Point Wiring', desc: 'Concealed PVC conduit point wiring for lighting, 13A socket outlets and AC points', unit: 'nr', qty: 65, rate: 14500 },
    { code: '8.1', section: 'External Works & Preliminaries', item: 'Interlocking Paving Driveway', desc: '60mm Heavy-duty interlocking paving stones to driveway and vehicle parking compound', unit: 'm2', qty: 180, rate: 12500 },
    { code: '8.2', section: 'External Works & Preliminaries', item: 'Perimeter Block Fence', desc: '225mm Hollow sandcrete block perimeter fence with capping and vehicle gate', unit: 'm', qty: 60, rate: 45000 },
  ];

  return sampleItems.map((it, idx) => ({
    id: `sample-duplex-${Date.now()}-${idx + 1}`,
    item_number: idx + 1,
    item_code: it.code,
    section: it.section,
    item: it.item,
    description: it.desc,
    unit: it.unit,
    qty: it.qty,
    rate: it.rate,
    amount: it.qty * it.rate,
    source: 'MANUAL_ENTRY',
    verification_status: 'QS Verified',
    confidence: 1.0,
    notes: 'Standard 4-Bedroom Nigerian Residential Duplex Specification',
  }));
}
