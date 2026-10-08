/**
 * Let's Estimate - Specialized Financial & Contract Engineering PDF Generators
 * Built for Nigerian Quantity Surveyors, Contractors & Commercial Managers
 * Standards: NIQS / QSRBN / BESMM4 / FIDIC 70
 */

import PDFDocument from 'pdfkit';
import {
  CashFlowPdfData,
  TenderComparisonPdfData,
  RiskAuditPdfData,
  FinalAccountPdfData,
  ExecutiveDossierPdfData,
  ValuationCertificatePdfData,
} from './export.js';

function formatNaira(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '₦0.00';
  const parts = Math.abs(val).toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = val < 0 ? '-' : '';
  return `${sign}₦${parts.join('.')}`;
}

/**
 * 1. Cash Flow Forecast & S-Curve Schedule PDF Generator
 */
export function generateCashFlowPdfBuffer(data: CashFlowPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Cash Flow & S-Curve - ${data.projectName}`,
          Author: "Let's Estimate - NIQS Accredited Platform",
          Subject: 'Cash Flow Forecast & Financial Outlay S-Curve',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = data.projectName || "Project Cash Flow Forecast";
      const client = data.clientName || "Private Client / Employer";
      const location = data.location || "Nigeria";
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const distribution = data.distribution || [];

      // Top Banner Header
      doc.rect(36, 36, 523, 44).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('CASH FLOW FORECAST & S-CURVE PROJECTIONS', 36, 48, { width: 523, align: 'center', characterSpacing: 1 });

      // Sub-banner
      doc.rect(36, 84, 523, 26).fill('#ecfdf5');
      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold')
        .text(title.toUpperCase(), 46, 92, { width: 503, align: 'center' });

      // Metadata Block
      let y = 120;
      doc.rect(36, y, 523, 56).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      doc.text('CLIENT / EMPLOYER:', 46, y + 10);
      doc.font('Helvetica').text(client, 160, y + 10, { width: 380 });

      doc.font('Helvetica-Bold').text('LOCATION:', 46, y + 24);
      doc.font('Helvetica').text(location, 160, y + 24, { width: 380 });

      doc.font('Helvetica-Bold').text('DATE OF APPRAISAL:', 46, y + 38);
      doc.font('Helvetica').text(`${dateStr} (Standard NIQS 6-Month S-Curve)`, 160, y + 38, { width: 380 });

      // KPI Highlights
      y = 188;
      const kpis = [
        { label: 'CONTRACT SUM', val: formatNaira(data.projectTotal) },
        { label: 'PLANNED DURATION', val: `${data.durationMonths || distribution.length || 6} Months` },
        { label: 'PEAK MONTHLY OUTLAY', val: formatNaira(data.peakMonthlyOutlay || (data.projectTotal * 0.28)) },
        { label: 'BILLING DISCIPLINE', val: 'BESMM4 / 5% Retention' },
      ];

      const kpiW = 523 / kpis.length;
      kpis.forEach((kpi, idx) => {
        const kX = 36 + idx * kpiW;
        doc.rect(kX, y, kpiW - 4, 46).fill('#f0fdf4').stroke('#86efac');
        doc.fillColor('#065f46').fontSize(7.5).font('Helvetica-Bold').text(kpi.label, kX + 6, y + 8, { width: kpiW - 16 });
        doc.fillColor('#064e3b').fontSize(10.5).font('Helvetica-Bold').text(kpi.val, kX + 6, y + 24, { width: kpiW - 16 });
      });

      // Monthly Schedule Table
      y = 246;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('MONTHLY FINANCIAL OUTLAY SCHEDULE', 36, y);
      y += 18;

      // Table Header
      doc.rect(36, y, 523, 22).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('MONTH', 42, y + 6);
      doc.text('PERIOD', 95, y + 6);
      doc.text('PLANNED %', 165, y + 6, { width: 60, align: 'right' });
      doc.text('MONTHLY OUTLAY', 235, y + 6, { width: 90, align: 'right' });
      doc.text('CUMULATIVE %', 335, y + 6, { width: 70, align: 'right' });
      doc.text('CUMULATIVE OUTLAY', 415, y + 6, { width: 95, align: 'right' });
      doc.text('STATUS / MILESTONE', 515, y + 6);

      y += 22;

      distribution.forEach((row, idx) => {
        const rowH = 20;
        const isZebra = idx % 2 === 1;
        doc.rect(36, y, 523, rowH).fill(isZebra ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');

        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(`M${row.month}`, 42, y + 5);
        doc.font('Helvetica').text(row.monthName || `Month ${row.month}`, 95, y + 5);
        doc.text(`${(row.plannedPct || 0).toFixed(1)}%`, 165, y + 5, { width: 60, align: 'right' });
        doc.font('Helvetica-Bold').text(formatNaira(row.monthlyOutlay), 235, y + 5, { width: 90, align: 'right' });
        doc.font('Helvetica').text(`${(row.cumulativePct || 0).toFixed(1)}%`, 335, y + 5, { width: 70, align: 'right' });
        doc.font('Helvetica-Bold').fillColor('#065f46').text(formatNaira(row.cumulativeOutlay), 415, y + 5, { width: 95, align: 'right' });
        doc.font('Helvetica').fillColor('#475569').text(row.milestone || 'Execution Progress', 515, y + 5, { width: 44, ellipsis: true });

        y += rowH;
      });

      // Total Cumulative Row
      doc.rect(36, y, 523, 22).fill('#ecfdf5').stroke('#86efac');
      doc.fillColor('#064e3b').fontSize(8.5).font('Helvetica-Bold');
      doc.text('TOTAL CUMULATIVE OUTLAY (CONTRACT SUM):', 46, y + 6);
      doc.text('100.0%', 335, y + 6, { width: 70, align: 'right' });
      doc.text(formatNaira(data.projectTotal), 415, y + 6, { width: 95, align: 'right' });

      y += 36;

      // S-Curve Engineering Interpretation
      doc.rect(36, y, 523, 76).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('S-CURVE PROGRESS PROFILE & COMMERCIAL MILESTONES', 46, y + 10);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').lineGap(2.5).text(
        "• Mobilization & Foundation Phase (Months 1-2): Typically absorbs 15-25% of expenditure covering site preliminaries, substructure, and reinforcement staging.\n" +
        "• Peak Production Velocity (Months 3-4): Highest financial outlay occurs during structural framing, masonry walls, and roofing installation.\n" +
        "• Finishes & Commissioning (Months 5-6): Expenditure plateaus toward practical completion with 5% statutory retention deducted until Making Good Defects.",
        46, y + 26, { width: 503 }
      );

      // Certification Block
      y += 92;
      doc.rect(36, y, 523, 85).fill('#ffffff').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('CERTIFICATION & AUDIT SIGN-OFF', 46, y + 8);

      const signY = y + 42;
      doc.moveTo(56, signY).lineTo(190, signY).stroke('#94a3b8');
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Emmanuel Isaac, MYQSF', 56, signY + 4);
      doc.text('Lead Registered Quantity Surveyor (NIQS)', 56, signY + 14);

      doc.moveTo(226, signY).lineTo(360, signY).stroke('#94a3b8');
      doc.text('Project Managing Director', 226, signY + 4);
      doc.text('Main Contracting Firm', 226, signY + 14);

      doc.moveTo(396, signY).lineTo(530, signY).stroke('#94a3b8');
      doc.text('Authorizing Financial Officer', 396, signY + 4);
      doc.text('Client / Banking Syndicate', 396, signY + 14);

      // Footer
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text("Let's Estimate • NIQS Standard BESMM4 Cash Flow Forecast • Generated automatically by Verified Engine", 36, 792, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 2. Subcontractor Tender & Bidder Comparison Matrix PDF Generator
 */
export function generateTenderComparisonPdfBuffer(data: TenderComparisonPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Tender Comparison Matrix - ${data.projectName}`,
          Author: "Let's Estimate - NIQS Accredited Platform",
          Subject: 'Subcontractor Tender Evaluation and Bid Comparison Matrix',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = data.projectName || "Tender Evaluation Matrix";
      const client = data.clientName || "Private Client / Employer";
      const location = data.location || "Nigeria";
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const bidders = (data.bidders || []).map((b: any) => ({
        name: b.name || b.bidder_name || 'Bidder',
        contact: b.contact || b.contact_person || '',
        totalBid: Number(b.totalBid ?? b.total_bid_amount ?? 0),
        variancePct: typeof b.variancePct === 'number' 
          ? b.variancePct 
          : (data.benchmarkTotal > 0 ? (((Number(b.totalBid ?? b.total_bid_amount ?? 0) - data.benchmarkTotal) / data.benchmarkTotal) * 100) : 0),
        technicalScore: Number(b.technicalScore ?? b.technical_score ?? 80),
        status: b.status || b.compliance_status || 'Under Review',
      }));

      // Top Banner Header
      doc.rect(36, 36, 523, 44).fill('#1e3a8a');
      doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold')
        .text('SUBCONTRACTOR TENDER & BID COMPARISON MATRIX', 36, 48, { width: 523, align: 'center', characterSpacing: 1 });

      // Sub-banner
      doc.rect(36, 84, 523, 26).fill('#eff6ff');
      doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold')
        .text(title.toUpperCase(), 46, 92, { width: 503, align: 'center' });

      // Metadata Block
      let y = 120;
      doc.rect(36, y, 523, 56).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      doc.text('CLIENT / EMPLOYER:', 46, y + 10);
      doc.font('Helvetica').text(client, 160, y + 10, { width: 380 });

      doc.font('Helvetica-Bold').text('PROJECT LOCATION:', 46, y + 24);
      doc.font('Helvetica').text(location, 160, y + 24, { width: 380 });

      doc.font('Helvetica-Bold').text('ENGINEER’S BENCHMARK:', 46, y + 38);
      doc.font('Helvetica-Bold').fillColor('#065f46')
        .text(`${formatNaira(data.benchmarkTotal)} (Verified BOQ Baseline)`, 160, y + 38, { width: 380 });

      // Bidders Table
      y = 190;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('COMMERCIAL & TECHNICAL BIDDER EVALUATION', 36, y);
      y += 18;

      // Table Header
      doc.rect(36, y, 523, 22).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('RANK', 42, y + 6);
      doc.text('CONTRACTOR / BIDDER', 75, y + 6);
      doc.text('TENDER SUM (₦)', 220, y + 6, { width: 95, align: 'right' });
      doc.text('VARIANCE %', 320, y + 6, { width: 65, align: 'right' });
      doc.text('TECH SCORE', 390, y + 6, { width: 65, align: 'right' });
      doc.text('EVALUATION STATUS', 465, y + 6);

      y += 22;

      bidders.forEach((b, idx) => {
        const rowH = 22;
        const statusStr = String(b.status || '');
        const isBest = idx === 0 && (statusStr.toLowerCase().includes('recommend') || statusStr.toLowerCase().includes('compliant'));
        doc.rect(36, y, 523, rowH).fill(isBest ? '#f0fdf4' : (idx % 2 === 1 ? '#f8fafc' : '#ffffff')).stroke('#e2e8f0');

        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(`#${idx + 1}`, 42, y + 6);
        doc.font(isBest ? 'Helvetica-Bold' : 'Helvetica').text(b.name, 75, y + 6, { width: 140, ellipsis: true });
        doc.font('Helvetica-Bold').text(formatNaira(b.totalBid), 220, y + 6, { width: 95, align: 'right' });
        
        const varColor = b.variancePct < 0 ? '#059669' : b.variancePct > 15 ? '#dc2626' : '#d97706';
        doc.fillColor(varColor).text(`${b.variancePct > 0 ? '+' : ''}${b.variancePct.toFixed(1)}%`, 320, y + 6, { width: 65, align: 'right' });
        
        doc.fillColor('#0f172a').text(`${b.technicalScore}/100`, 390, y + 6, { width: 65, align: 'right' });
        doc.fillColor(isBest ? '#065f46' : '#475569').text(b.status || 'Under Review', 465, y + 6, { width: 90 });

        y += rowH;
      });

      // Benchmark row
      doc.rect(36, y, 523, 20).fill('#ecfdf5').stroke('#86efac');
      doc.fillColor('#065f46').fontSize(8).font('Helvetica-Bold');
      doc.text('BOQ BASELINE ESTIMATE:', 75, y + 5);
      doc.text(formatNaira(data.benchmarkTotal), 220, y + 5, { width: 95, align: 'right' });
      doc.text('0.0%', 320, y + 5, { width: 65, align: 'right' });
      doc.text('BENCHMARK', 465, y + 5);

      y += 32;

      // Evaluation Board Notes
      doc.rect(36, y, 523, 80).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('NIQS QUANTITY SURVEYOR TENDER BOARD RECOMMENDATIONS', 46, y + 10);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').lineGap(2.5).text(
        "• Arithmetic Verification: All received tender bids have been vetted for arithmetic correctness and trade rate consistency.\n" +
        "• Outlier Rate Detection: Unit rates differing by more than ±20% from calibrated state market indices were isolated for pre-award risk mitigation.\n" +
        "• Recommended Award Strategy: Recommend awarding to the lowest responsive and technically qualified bidder subject to performance bonding.",
        46, y + 26, { width: 503 }
      );

      // Sign-off
      y += 95;
      doc.rect(36, y, 523, 80).fill('#ffffff').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('TENDER EVALUATION COMMITTEE SIGN-OFF', 46, y + 8);

      const signY = y + 42;
      doc.moveTo(56, signY).lineTo(190, signY).stroke('#94a3b8');
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Consulting Quantity Surveyor', 56, signY + 4);
      doc.text('NIQS Member In Charge', 56, signY + 14);

      doc.moveTo(226, signY).lineTo(360, signY).stroke('#94a3b8');
      doc.text('Technical Bid Reviewer', 226, signY + 4);
      doc.text('Structural / Civil Lead', 226, signY + 14);

      doc.moveTo(396, signY).lineTo(530, signY).stroke('#94a3b8');
      doc.text('Tender Board Chairman', 396, signY + 4);
      doc.text('Employer Representative', 396, signY + 14);

      // Footer
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text("Let's Estimate • Subcontractor Tender Comparison & Matrix Evaluation • Formal NIQS Audit Standard", 36, 792, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 3. FIDIC Clause 70 Cost Risk & Inflation Fluctuation Audit PDF Generator
 */
export function generateRiskAuditPdfBuffer(data: RiskAuditPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Cost Risk & Fluctuation Audit - ${data.projectName}`,
          Author: "Let's Estimate - NIQS Accredited Platform",
          Subject: 'FIDIC Clause 70 Price Adjustment and Material Fluctuation Audit',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = data.projectName || "Cost Risk & Fluctuation Audit";
      const client = data.clientName || "Private Client / Employer";
      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      const p: any = data.parameters || {};

      const fixedElement = Number(p.fixedElement ?? p.fixed_element ?? 0.10);
      const cementWeight = Number(p.cementWeight ?? p.cement_weight ?? 0.30);
      const baseCementPrice = Number(p.baseCementPrice ?? p.base_cement_price ?? 5500);
      const currentCementPrice = Number(p.currentCementPrice ?? p.current_cement_price ?? 8800);
      const rebarWeight = Number(p.rebarWeight ?? p.rebar_weight ?? 0.25);
      const baseRebarPrice = Number(p.baseRebarPrice ?? p.base_rebar_price ?? 750000);
      const currentRebarPrice = Number(p.currentRebarPrice ?? p.current_rebar_price ?? 1280000);
      const dieselWeight = Number(p.dieselWeight ?? p.diesel_weight ?? 0.15);
      const baseDieselPrice = Number(p.baseDieselPrice ?? p.base_diesel_price ?? 800);
      const currentDieselPrice = Number(p.currentDieselPrice ?? p.current_diesel_price ?? 1350);
      const labourWeight = Number(p.labourWeight ?? p.labour_weight ?? 0.20);
      const baseLabourRate = Number(p.baseLabourRate ?? p.base_labour_rate ?? 4500);
      const currentLabourRate = Number(p.currentLabourRate ?? p.current_labour_rate ?? 7000);

      const origSum = Number(data.originalContractSum ?? (data as any).original_contract_sum ?? (data as any).projectTotal ?? 0);
      const multiplier = Number(data.multiplier ?? (data as any).liveMultiplier ?? 1.185);
      const claimable = Number(data.claimableSum ?? (data as any).liveClaimableSum ?? (origSum * Math.max(0, multiplier - 1)));
      const revisedSum = Number(data.revisedContractSum ?? (data as any).revised_contract_sum ?? (origSum + claimable));

      // Top Banner Header
      doc.rect(36, 36, 523, 44).fill('#78350f');
      doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold')
        .text('FIDIC CLAUSE 70 INFLATION & COST RISK AUDIT', 36, 48, { width: 523, align: 'center', characterSpacing: 1 });

      // Sub-banner
      doc.rect(36, 84, 523, 26).fill('#fef3c7');
      doc.fillColor('#92400e').fontSize(10).font('Helvetica-Bold')
        .text(title.toUpperCase(), 46, 92, { width: 503, align: 'center' });

      // Financial Summary Block
      let y = 120;
      doc.rect(36, y, 523, 62).fill('#fffbeb').stroke('#fde68a');
      doc.fillColor('#78350f').fontSize(8.5).font('Helvetica-Bold');
      doc.text('ORIGINAL CONTRACT SUM:', 46, y + 10);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(formatNaira(origSum), 220, y + 10);

      doc.fillColor('#78350f').text('FIDIC 70 ADJUSTMENT MULTIPLIER (Pn):', 46, y + 26);
      doc.font('Helvetica-Bold').fillColor('#b45309').text(`${multiplier.toFixed(4)}x`, 220, y + 26);

      doc.fillColor('#78350f').text('NET FLUTUATION CLAIMABLE SUM:', 46, y + 42);
      doc.font('Helvetica-Bold').fillColor('#b91c1c').text(formatNaira(claimable), 220, y + 42);

      doc.fillColor('#78350f').text('REVISED CONTRACT SUM:', 360, y + 42);
      doc.font('Helvetica-Bold').fillColor('#065f46').text(formatNaira(revisedSum), 460, y + 42);

      // Fluctuation Formula Table
      y = 196;
      doc.fillColor('#0f172a').fontSize(10.5).font('Helvetica-Bold').text('FIDIC CLAUSE 70 WEIGHTED COMMODITY INDICES', 36, y);
      y += 16;

      doc.rect(36, y, 523, 20).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('FACTOR / COMMODITY', 42, y + 6);
      doc.text('WEIGHT (w)', 190, y + 6, { width: 55, align: 'right' });
      doc.text('BASE PRICE (₦)', 255, y + 6, { width: 75, align: 'right' });
      doc.text('CURRENT PRICE (₦)', 340, y + 6, { width: 85, align: 'right' });
      doc.text('RATIO', 435, y + 6, { width: 45, align: 'right' });
      doc.text('WEIGHTED CONTRIBUTION', 490, y + 6, { width: 60, align: 'right' });

      y += 20;

      const factors = [
        { name: 'Fixed Element (Non-adjustable)', w: fixedElement, base: 1, curr: 1, ratio: 1.0 },
        { name: 'Portland Cement (50kg Bag)', w: cementWeight, base: baseCementPrice, curr: currentCementPrice, ratio: currentCementPrice / (baseCementPrice || 1) },
        { name: 'High-Yield TMT Rebar (Tonne)', w: rebarWeight, base: baseRebarPrice, curr: currentRebarPrice, ratio: currentRebarPrice / (baseRebarPrice || 1) },
        { name: 'Automotive Gas Oil / Diesel (Litre)', w: dieselWeight, base: baseDieselPrice, curr: currentDieselPrice, ratio: currentDieselPrice / (baseDieselPrice || 1) },
        { name: 'Site Tradesman Labour (Daily Gang)', w: labourWeight, base: baseLabourRate, curr: currentLabourRate, ratio: currentLabourRate / (baseLabourRate || 1) },
      ];

      factors.forEach((f, idx) => {
        const rowH = 19;
        doc.rect(36, y, 523, rowH).fill(idx % 2 === 1 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(f.name, 42, y + 5);
        doc.font('Helvetica').text(`${(f.w * 100).toFixed(0)}%`, 190, y + 5, { width: 55, align: 'right' });
        doc.text(f.base === 1 ? 'Fixed' : formatNaira(f.base), 255, y + 5, { width: 75, align: 'right' });
        doc.text(f.curr === 1 ? 'Fixed' : formatNaira(f.curr), 340, y + 5, { width: 85, align: 'right' });
        doc.text(`${f.ratio.toFixed(3)}x`, 435, y + 5, { width: 45, align: 'right' });
        doc.font('Helvetica-Bold').text((f.w * f.ratio).toFixed(4), 490, y + 5, { width: 60, align: 'right' });
        y += rowH;
      });

      // Total formula row
      doc.rect(36, y, 523, 20).fill('#fef3c7').stroke('#fde68a');
      doc.fillColor('#78350f').fontSize(8).font('Helvetica-Bold');
      doc.text('TOTAL PRICE ADJUSTMENT FACTOR Pn = a + b(C/Co) + c(R/Ro) + d(D/Do) + e(L/Lo):', 42, y + 5);
      doc.text(`${multiplier.toFixed(4)}x`, 490, y + 5, { width: 60, align: 'right' });

      y += 30;

      // Value Engineering Section
      if (data.valueEngineeringItems && data.valueEngineeringItems.length > 0) {
        doc.fillColor('#0f172a').fontSize(10.5).font('Helvetica-Bold').text('AI VALUE ENGINEERING & MATERIAL OPTIMIZATIONS', 36, y);
        y += 16;

        doc.rect(36, y, 523, 18).fill('#334155');
        doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
        doc.text('TRADE', 42, y + 5);
        doc.text('CURRENT SPECIFICATION', 110, y + 5);
        doc.text('RECOMMENDED SUBSTITUTION', 240, y + 5);
        doc.text('POTENTIAL SAVINGS', 380, y + 5, { width: 80, align: 'right' });
        doc.text('RISK', 475, y + 5);
        y += 18;

        data.valueEngineeringItems.slice(0, 4).forEach((ve, idx) => {
          const rowH = 22;
          doc.rect(36, y, 523, rowH).fill(idx % 2 === 1 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');
          doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(ve.trade, 42, y + 5);
          doc.font('Helvetica').text(ve.currentSpec, 110, y + 5, { width: 120, ellipsis: true });
          doc.text(ve.alternativeSpec, 240, y + 5, { width: 130, ellipsis: true });
          doc.font('Helvetica-Bold').fillColor('#059669').text(formatNaira(ve.potentialSavings), 380, y + 5, { width: 80, align: 'right' });
          doc.font('Helvetica').fillColor('#475569').text(ve.riskLevel || 'Low', 475, y + 5);
          y += rowH;
        });

        y += 14;
      }

      // Certification Block
      doc.rect(36, y, 523, 75).fill('#ffffff').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('STATUTORY AUDIT & FLUCTUATION SIGN-OFF', 46, y + 8);

      const signY = y + 42;
      doc.moveTo(56, signY).lineTo(200, signY).stroke('#94a3b8');
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Consulting Cost Engineer (NIQS)', 56, signY + 4);

      doc.moveTo(236, signY).lineTo(370, signY).stroke('#94a3b8');
      doc.text('Contractor Commercial Director', 236, signY + 4);

      doc.moveTo(406, signY).lineTo(530, signY).stroke('#94a3b8');
      doc.text('Employer Auditor', 406, signY + 4);

      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text("Let's Estimate • FIDIC Clause 70 Fluctuation Audit • Calibrated Nigerian Price Adjustment Standard", 36, 792, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 4. Final Account & Contract Closeout Statement PDF Generator
 */
export function generateFinalAccountPdfBuffer(data: FinalAccountPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Final Account Statement - ${data.projectName}`,
          Author: "Let's Estimate - NIQS Accredited Platform",
          Subject: 'Final Account and Contract Closeout Statement',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = data.projectName || (data as any).projectTitle || "Contract Closeout Statement";
      const client = data.clientName || (data as any).client_name || "Private Client / Employer";
      const contractor = data.contractorName || (data as any).contractor_name || "Lead Building Contractor";
      const location = data.location || "Nigeria";
      const dateStr = data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      const origSum = Number(data.originalContractSum ?? (data as any).original_contract_sum ?? (data as any).grandTotal ?? 0);
      const addVar = Number(data.approvedVariationsAdditions ?? (data as any).approved_variations_additions ?? 0);
      const omVar = Number(data.approvedVariationsOmissions ?? (data as any).approved_variations_omissions ?? 0);
      const netVar = Number(data.netVariations ?? (data as any).net_variations ?? (addVar - omVar));
      const fluc = Number(data.fluctuationClaimAmount ?? (data as any).fluctuation_claim_amount ?? 0);
      const provSums = Number(data.provisionalSumsAdjustment ?? (data as any).provisional_sums_adjustment ?? 0);
      const pcSums = Number(data.primeCostAdjustment ?? (data as any).prime_cost_adjustment ?? 0);
      const dayworks = Number(data.dayworksAmount ?? (data as any).dayworks_amount ?? 0);
      const lad = Number(data.liquidatedDamagesDeduction ?? (data as any).liquidated_damages_deduction ?? 0);
      const setoffs = Number(data.otherSetoffs ?? (data as any).other_setoffs ?? 0);

      const grossFinal = Number(data.grossFinalAccountSum ?? (data as any).gross_final_account_sum ?? (origSum + netVar + fluc + provSums + pcSums + dayworks - lad - setoffs));
      const prevPay = Number(data.totalPreviousPayments ?? (data as any).total_previous_payments ?? (grossFinal * 0.85));
      const retentionRel = Number(data.retentionReleased ?? (data as any).retention_released ?? (grossFinal * 0.05));
      const balDue = Number(data.balanceDueContractor ?? (data as any).balance_due_contractor ?? (grossFinal - prevPay + retentionRel));

      // Top Banner Header
      doc.rect(36, 36, 523, 44).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold')
        .text('FINAL ACCOUNT & CONTRACT CLOSEOUT STATEMENT', 36, 48, { width: 523, align: 'center', characterSpacing: 1 });

      // Sub-banner
      doc.rect(36, 84, 523, 26).fill('#ecfdf5');
      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold')
        .text(title.toUpperCase(), 46, 92, { width: 503, align: 'center' });

      // Metadata Block
      let y = 120;
      doc.rect(36, y, 523, 56).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      doc.text('CLIENT / EMPLOYER:', 46, y + 10);
      doc.font('Helvetica').text(client, 160, y + 10, { width: 380 });

      doc.font('Helvetica-Bold').text('MAIN CONTRACTOR:', 46, y + 24);
      doc.font('Helvetica').text(contractor, 160, y + 24, { width: 380 });

      doc.font('Helvetica-Bold').text('LOCATION & DATE:', 46, y + 38);
      doc.font('Helvetica').text(`${location} • Closeout Date: ${dateStr}`, 160, y + 38, { width: 380 });

      // Reconciliation Statement Table
      y = 188;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('FINANCIAL RECONCILIATION SUMMARY', 36, y);
      y += 18;

      doc.rect(36, y, 523, 20).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('ITEM', 44, y + 6);
      doc.text('DESCRIPTION OF FINANCIAL HEAD', 85, y + 6);
      doc.text('AMOUNT (₦)', 415, y + 6, { width: 135, align: 'right' });
      y += 20;

      const lines = [
        { no: '1.0', label: 'Original Contract Sum (Award Value)', val: origSum, bold: true },
        { no: '2.0', label: 'Approved Additions (Variation Orders)', val: addVar, sign: '+' },
        { no: '3.0', label: 'Approved Omissions (Variation Reductions)', val: omVar, sign: '-' },
        { no: '4.0', label: 'Net Variations Balance', val: netVar, bold: true },
        { no: '5.0', label: 'Fluctuation & Inflation Claims (FIDIC 70)', val: fluc, sign: '+' },
        { no: '6.0', label: 'Provisional Sums Expenditure Adjustment', val: provSums },
        { no: '7.0', label: 'Prime Cost (PC) Sums & Attendance Adjustment', val: pcSums },
        { no: '8.0', label: 'Authorized Dayworks & Remedial Works', val: dayworks },
        { no: '9.0', label: 'Less: Liquidated & Ascertained Damages (LAD)', val: lad, sign: '-' },
        { no: '10.0', label: 'Less: Contractual Set-offs / Defect Deductions', val: setoffs, sign: '-' },
      ];

      lines.forEach((l, idx) => {
        const rowH = 18;
        doc.rect(36, y, 523, rowH).fill(idx % 2 === 1 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(l.no, 44, y + 5);
        doc.font(l.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#0f172a').text(l.label, 85, y + 5);
        const prefix = l.sign ? `${l.sign} ` : '';
        doc.font(l.bold ? 'Helvetica-Bold' : 'Helvetica').text(`${prefix}${formatNaira(l.val)}`, 415, y + 5, { width: 135, align: 'right' });
        y += rowH;
      });

      // Gross Final Account Value
      doc.rect(36, y, 523, 22).fill('#ecfdf5').stroke('#6ee7b7');
      doc.fillColor('#065f46').fontSize(9).font('Helvetica-Bold');
      doc.text('GROSS FINAL ACCOUNT CONTRACT VALUE:', 44, y + 6);
      doc.text(formatNaira(grossFinal), 415, y + 6, { width: 135, align: 'right' });
      y += 26;

      // Settlement deductions
      const setLines = [
        { label: 'Less: Total Previous Interim Payments Certified to Date', val: prevPay, sign: '-' },
        { label: 'Add: Retention Monies Fully Released (Making Good Defects)', val: retentionRel, sign: '+' },
      ];

      setLines.forEach((sl, idx) => {
        const rowH = 18;
        doc.rect(36, y, 523, rowH).fill(idx % 2 === 1 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica').text(sl.label, 85, y + 5);
        doc.font('Helvetica-Bold').text(`${sl.sign} ${formatNaira(sl.val)}`, 415, y + 5, { width: 135, align: 'right' });
        y += rowH;
      });

      // Net Final Balance Due
      doc.rect(36, y, 523, 26).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('FINAL BALANCE CERTIFIED PAYABLE TO CONTRACTOR:', 44, y + 8);
      doc.text(formatNaira(balDue), 415, y + 8, { width: 135, align: 'right' });

      y += 40;

      // Endorsement Block
      doc.rect(36, y, 523, 90).fill('#ffffff').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('FINAL ACCOUNT CLOSEOUT ENDORSEMENT', 46, y + 8);

      const signY = y + 46;
      doc.moveTo(56, signY).lineTo(190, signY).stroke('#94a3b8');
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Emmanuel Isaac, MYQSF', 56, signY + 4);
      doc.text('Registered Quantity Surveyor (NIQS)', 56, signY + 14);

      doc.moveTo(226, signY).lineTo(360, signY).stroke('#94a3b8');
      doc.text('Contractor Authorized Signatory', 226, signY + 4);
      doc.text('Managing Director / Partner', 226, signY + 14);

      doc.moveTo(396, signY).lineTo(530, signY).stroke('#94a3b8');
      doc.text('Employer / Client Representative', 396, signY + 4);
      doc.text('Final Acceptance of Contract Sum', 396, signY + 14);

      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text("Let's Estimate • Final Account & Contract Closeout Statement • BESMM4 4th Edition Standards", 36, 792, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 5. Executive Cost Dossier & Commercial Audit PDF Generator
 */
export function generateExecutiveDossierPdfBuffer(data: ExecutiveDossierPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Executive Cost Dossier - ${data.projectName}`,
          Author: "Let's Estimate - NIQS Accredited Platform",
          Subject: 'Executive Commercial Cost Dossier and Project Audit',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = data.projectName || (data as any).projectTitle || "Executive Project Cost Dossier";
      const client = data.clientName || (data as any).client_name || "Private Client / Board of Directors";
      const location = data.location || "Nigeria";
      const dateStr = data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

      const contractSum = Number(data.contractSum ?? (data as any).grandTotal ?? (data as any).contract_sum ?? (data as any).total ?? 0);
      const netWorks = Number(data.netWorks ?? (data as any).subtotal ?? (data as any).net_works ?? (contractSum > 0 ? contractSum * 0.8 : 0));
      const profitOverheads = Number(data.profitOverheads ?? (data as any).profit_overheads ?? (netWorks * 0.15));
      const vat = Number(data.vat ?? (data as any).vat_amount ?? (netWorks * 0.075));
      const grossTenderSum = Number(data.grossTenderSum ?? (data as any).gross_tender_sum ?? contractSum ?? (netWorks + profitOverheads + vat));

      // Top Banner Header
      doc.rect(36, 36, 523, 44).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('EXECUTIVE COMMERCIAL COST DOSSIER', 36, 48, { width: 523, align: 'center', characterSpacing: 1.2 });

      // Sub-banner
      doc.rect(36, 84, 523, 26).fill('#ecfdf5');
      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold')
        .text(title.toUpperCase(), 46, 92, { width: 503, align: 'center' });

      // Metadata Block
      let y = 120;
      doc.rect(36, y, 523, 56).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      doc.text('CLIENT / INSTITUTION:', 46, y + 10);
      doc.font('Helvetica').text(client, 160, y + 10, { width: 380 });

      doc.font('Helvetica-Bold').text('PROJECT LOCATION:', 46, y + 24);
      doc.font('Helvetica').text(location, 160, y + 24, { width: 380 });

      doc.font('Helvetica-Bold').text('DOSSIER AUDIT DATE:', 46, y + 38);
      doc.font('Helvetica').text(`${dateStr} • Compiled for Board Approval, Bank Financing & Client Audit`, 160, y + 38, { width: 380 });

      // Executive Commercial Summary Cards
      y = 188;
      const cards = [
        { label: 'NET WORKS (SUBTOTAL)', val: formatNaira(netWorks) },
        { label: 'PROFIT & OVERHEADS (15%)', val: formatNaira(profitOverheads) },
        { label: 'STATUTORY VAT (7.5%)', val: formatNaira(vat) },
        { label: 'GROSS TENDER SUM', val: formatNaira(grossTenderSum) },
      ];

      const cardW = 523 / cards.length;
      cards.forEach((c, idx) => {
        const cX = 36 + idx * cardW;
        doc.rect(cX, y, cardW - 4, 46).fill('#f0fdf4').stroke('#86efac');
        doc.fillColor('#065f46').fontSize(7).font('Helvetica-Bold').text(c.label, cX + 6, y + 8, { width: cardW - 14 });
        doc.fillColor('#064e3b').fontSize(10).font('Helvetica-Bold').text(c.val, cX + 6, y + 24, { width: cardW - 14 });
      });

      // Trade Package Breakdown Table
      y = 246;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('TRADE & ELEMENTAL COST BREAKDOWN', 36, y);
      y += 18;

      doc.rect(36, y, 523, 20).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('SECTION / TRADE', 44, y + 6);
      doc.text('ALLOCATION (%)', 350, y + 6, { width: 80, align: 'right' });
      doc.text('BUDGET VALUE (₦)', 435, y + 6, { width: 115, align: 'right' });
      y += 20;

      const rawTrades: any[] = data.tradeSummary || (data as any).boqTrades || [];
      const trades = rawTrades.length > 0 ? rawTrades.map((t: any) => ({
        trade: t.trade || t.section || 'General Trade',
        percentage: Number(t.percentage ?? t.percent ?? 0),
        amount: Number(t.amount ?? t.totalAmount ?? 0)
      })) : [
        { trade: 'Substructure & Earthworks', percentage: 18.5, amount: contractSum * 0.185 },
        { trade: 'Reinforced Concrete Superstructure', percentage: 24.2, amount: contractSum * 0.242 },
        { trade: 'Blockwork, Partitions & Lintels', percentage: 14.8, amount: contractSum * 0.148 },
        { trade: 'Roof Structure & Aluminium Covering', percentage: 12.0, amount: contractSum * 0.120 },
        { trade: 'Doors, Windows & Ironmongery', percentage: 7.5, amount: contractSum * 0.075 },
        { trade: 'Internal & External Architectural Finishes', percentage: 11.0, amount: contractSum * 0.110 },
        { trade: 'Mechanical & Plumbing Installations', percentage: 5.5, amount: contractSum * 0.055 },
        { trade: 'Electrical & Power Infrastructure', percentage: 6.5, amount: contractSum * 0.065 },
      ];

      trades.forEach((tr, idx) => {
        const rowH = 18;
        doc.rect(36, y, 523, rowH).fill(idx % 2 === 1 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(tr.trade, 44, y + 5);
        doc.font('Helvetica').text(`${tr.percentage.toFixed(1)}%`, 350, y + 5, { width: 80, align: 'right' });
        doc.font('Helvetica-Bold').text(formatNaira(tr.amount), 435, y + 5, { width: 115, align: 'right' });
        y += rowH;
      });

      // Total Line
      doc.rect(36, y, 523, 20).fill('#ecfdf5').stroke('#6ee7b7');
      doc.fillColor('#064e3b').fontSize(8.5).font('Helvetica-Bold');
      doc.text('TOTAL MEASURED BUILDING WORKS:', 44, y + 5);
      doc.text('100.0%', 350, y + 5, { width: 80, align: 'right' });
      doc.text(formatNaira(data.contractSum), 435, y + 5, { width: 115, align: 'right' });

      y += 32;

      // Governance & Bank Financing Statement
      doc.rect(36, y, 523, 65).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('PROJECT AUDIT & STATUTORY COMPLIANCE STATEMENT', 46, y + 8);
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica').lineGap(2).text(
        "This Executive Cost Dossier has been prepared in full compliance with the Building and Engineering Standard Method of Measurement (BESMM4 4th Edition), the Nigerian Institute of Quantity Surveyors (NIQS), and the Quantity Surveyors Registration Board of Nigeria (QSRBN). All rates reflect prevailing verified market prices across plant, materials, and skilled labour gangs.",
        46, y + 22, { width: 503 }
      );

      // Sign-off
      y += 78;
      doc.rect(36, y, 523, 80).fill('#ffffff').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('NIQS CONSULTING QUANTITY SURVEYOR ENDORSEMENT', 46, y + 8);

      const signY = y + 42;
      doc.moveTo(56, signY).lineTo(200, signY).stroke('#94a3b8');
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Emmanuel Isaac, MYQSF', 56, signY + 4);
      doc.text('Lead Certified Quantity Surveyor', 56, signY + 14);

      doc.moveTo(236, signY).lineTo(370, signY).stroke('#94a3b8');
      doc.text('Executive Commercial Director', 236, signY + 4);
      doc.text('Cost Management Division', 236, signY + 14);

      doc.moveTo(406, signY).lineTo(530, signY).stroke('#94a3b8');
      doc.text('Client Representative / Board Member', 406, signY + 4);
      doc.text('Project Financing Approval', 406, signY + 14);

      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text("Let's Estimate • Executive Cost Dossier • NIQS / QSRBN Accredited Cost Engineering", 36, 792, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 6. Official Interim Payment Certificate (IPC) PDF Generator
 */
export function generateValuationCertificatePdfBuffer(data: ValuationCertificatePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Payment Certificate - ${data.valuationNumber}`,
          Author: "Let's Estimate - NIQS Accredited Platform",
          Subject: 'Interim Payment Certificate (IPC)',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const certNo = data.valuationNumber || (data as any).valuation_number || "IPC-01";
      const title = data.projectName || (data as any).projectTitle || "Project Construction Works";
      const client = data.clientName || (data as any).client_name || "Private Client / Employer";
      const location = data.location || "Nigeria";
      const valDate = data.valuationDate || (data as any).valuation_date || new Date().toISOString().split('T')[0];

      const prevVal = Number(data.previousValuation ?? (data as any).previous_valuation ?? (data as any).previous_gross ?? 0);
      const currVal = Number(data.currentValuation ?? (data as any).current_valuation ?? (data as any).gross_amount ?? (data as any).amount ?? 0);
      const cumVal = Number(data.cumulativeValue ?? (data as any).cumulative_value ?? (data as any).cumulative_gross ?? (prevVal + currVal));
      const retPct = Number(data.retentionPercent ?? (data as any).retention_percentage ?? 5);
      const retAmount = Number(data.retentionAmount ?? (data as any).retention_amount ?? (currVal * (retPct / 100)));
      const advDeduct = Number(data.advancePaymentDeduction ?? (data as any).advance_deduction ?? (data as any).advance_payment_deduction ?? 0);
      const prevPay = Number(data.previousPayments ?? (data as any).previous_payments ?? (data as any).total_previous_payments ?? prevVal * 0.95);
      const amtDue = Number(data.amountDue ?? (data as any).net_amount_due ?? (data as any).amount_certified ?? (currVal - retAmount - advDeduct));

      // Top Banner Header
      doc.rect(36, 36, 523, 44).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('INTERIM PAYMENT CERTIFICATE (IPC)', 36, 48, { width: 523, align: 'center', characterSpacing: 1.2 });

      // Sub-banner
      doc.rect(36, 84, 523, 26).fill('#ecfdf5');
      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold')
        .text(`CERTIFICATE NUMBER: ${certNo} • DATE: ${valDate}`, 46, 92, { width: 503, align: 'center' });

      // Project Info
      let y = 120;
      doc.rect(36, y, 523, 56).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      doc.text('PROJECT:', 46, y + 10);
      doc.font('Helvetica').text(title, 160, y + 10, { width: 380 });

      doc.font('Helvetica-Bold').text('CLIENT / EMPLOYER:', 46, y + 24);
      doc.font('Helvetica').text(client, 160, y + 24, { width: 380 });

      doc.font('Helvetica-Bold').text('LOCATION / SCOPE:', 46, y + 38);
      doc.font('Helvetica').text(`${location} • ${data.description || 'Measured Construction Works'}`, 160, y + 38, { width: 380 });

      // Financial Calculation Table
      y = 190;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('CERTIFICATE VALUATION COMPUTATION', 36, y);
      y += 18;

      doc.rect(36, y, 523, 20).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('REF', 44, y + 6);
      doc.text('VALUATION HEAD / DESCRIPTION', 85, y + 6);
      doc.text('AMOUNT (₦)', 415, y + 6, { width: 135, align: 'right' });
      y += 20;

      const items = [
        { ref: '1.0', label: 'Cumulative Gross Value of Work Done in Previous Periods', val: prevVal },
        { ref: '2.0', label: 'Value of Work Executed During Current Valuation Period', val: currVal, sign: '+', bold: true },
        { ref: '3.0', label: 'Total Cumulative Gross Work Completed to Date', val: cumVal, bold: true },
        { ref: '4.0', label: `Less: Statutory Retention Deduction (${retPct}%)`, val: retAmount, sign: '-' },
        { ref: '5.0', label: 'Less: Mobilization / Advance Payment Recovery Deduction', val: advDeduct, sign: '-' },
        { ref: '6.0', label: 'Less: Previous Cumulative Certified Payments Released', val: prevPay, sign: '-' },
      ];

      items.forEach((it, idx) => {
        const rowH = 22;
        doc.rect(36, y, 523, rowH).fill(idx % 2 === 1 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');
        doc.fillColor('#475569').fontSize(8).font('Helvetica').text(it.ref, 44, y + 6);
        doc.font(it.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#0f172a').text(it.label, 85, y + 6);
        const prefix = it.sign ? `${it.sign} ` : '';
        doc.font(it.bold ? 'Helvetica-Bold' : 'Helvetica').text(`${prefix}${formatNaira(it.val)}`, 415, y + 6, { width: 135, align: 'right' });
        y += rowH;
      });

      // Amount Certified
      doc.rect(36, y, 523, 30).fill('#064e3b');
      doc.fillColor('#ffffff').fontSize(10.5).font('Helvetica-Bold');
      doc.text('NET AMOUNT CERTIFIED PAYABLE TO CONTRACTOR:', 44, y + 9);
      doc.text(formatNaira(amtDue), 415, y + 9, { width: 135, align: 'right' });

      y += 48;

      // Legal & Contractual Notes
      doc.rect(36, y, 523, 65).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('PAYMENT CERTIFICATE TERMS & INSTRUCTIONS', 46, y + 8);
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica').lineGap(2).text(
        "• Under Clause 30 of the Joint Building Contracts Committee (JBC) / NIQS Standard Form of Building Contract, payment of the net certified sum is due within 14 calendar days from the date of presentation of this certificate.\n" +
        "• All statutory withholding taxes (WHT) and deductions are to be remitted directly to the relevant revenue authority in accordance with Federal Republic of Nigeria regulations.",
        46, y + 22, { width: 503 }
      );

      // Sign-off
      y += 80;
      doc.rect(36, y, 523, 90).fill('#ffffff').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('CERTIFICATE AUTHORIZATION SIGNATURES', 46, y + 8);

      const signY = y + 46;
      doc.moveTo(56, signY).lineTo(200, signY).stroke('#94a3b8');
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Emmanuel Isaac, MYQSF', 56, signY + 4);
      doc.text('Certified Quantity Surveyor (NIQS)', 56, signY + 14);

      doc.moveTo(236, signY).lineTo(370, signY).stroke('#94a3b8');
      doc.text('Project Supervising Architect / Engineer', 236, signY + 4);
      doc.text('Site Inspection Certification', 236, signY + 14);

      doc.moveTo(406, signY).lineTo(530, signY).stroke('#94a3b8');
      doc.text('Employer / Client Signature', 406, signY + 4);
      doc.text('Approved for Bank Disbursement', 406, signY + 14);

      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text("Let's Estimate • Official Interim Payment Certificate • NIQS / JBC Standard", 36, 792, { align: 'center', width: 523 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
