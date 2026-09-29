import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
function calculateMaterialRequirements(items) {
  let cementBags = 0;
  let sandTonnes = 0;
  let graniteTonnes = 0;
  let rebarTonnes = 0;
  let blocks225 = 0;
  let blocks150 = 0;
  let roofingSqm = 0;
  for (const it of items) {
    const name = ((it.item || "") + " " + (it.description || "")).toLowerCase();
    const qty = Number(it.qty || 0);
    if (name.includes("concrete") || name.includes("slab") || name.includes("beam") || name.includes("column") || it.unit === "m3") {
      cementBags += qty * 7.2;
      sandTonnes += qty * 0.72;
      graniteTonnes += qty * 1.35;
      rebarTonnes += qty * 0.12;
    } else if (name.includes("rebar") || name.includes("reinforcement") || name.includes("steel") || name.includes("iron rod")) {
      if (it.unit === "kg") {
        rebarTonnes += qty / 1e3;
      } else if (it.unit === "t" || it.unit === "tonne") {
        rebarTonnes += qty;
      }
    } else if (name.includes("block") || name.includes("brick")) {
      if (name.includes("150") || name.includes('6"')) {
        blocks150 += Math.round(qty * 10.5);
        cementBags += qty * 0.22;
        sandTonnes += qty * 0.04;
      } else {
        blocks225 += Math.round(qty * 10.5);
        cementBags += qty * 0.28;
        sandTonnes += qty * 0.05;
      }
    } else if (name.includes("plaster") || name.includes("render") || name.includes("screed")) {
      cementBags += qty * 0.15;
      sandTonnes += qty * 0.025;
    } else if (name.includes("roof") || name.includes("aluminium") || name.includes("step-tile")) {
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
  const REBAR_PRICE = 145e4;
  const BLOCK_225_PRICE = 550;
  const BLOCK_150_PRICE = 450;
  const ROOFING_PRICE = 7500;
  const totalCost = cementBags * CEMENT_PRICE + sandTonnes * SAND_PRICE + graniteTonnes * GRANITE_PRICE + rebarTonnes * REBAR_PRICE + blocks225 * BLOCK_225_PRICE + blocks150 * BLOCK_150_PRICE + roofingSqm * ROOFING_PRICE;
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
function generateExcelBuffer(data) {
  const wb = XLSX.utils.book_new();
  const title = data.projectTitle || "Let's Estimate - Project BOQ";
  const location = data.location || "Nigeria";
  const client = data.clientName || "Private Client";
  const dateStr = data.date || (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB");
  const safeDataItems = Array.isArray(data.items) ? data.items : [];
  const items = safeDataItems.map((it, idx) => {
    const qty = Number(it.qty || 0);
    const rate = Number(it.rate || 0);
    const amount = qty * rate;
    return {
      "Item No.": it.item_number || idx + 1,
      "Trade Section": it.section || "General Works",
      "Bill Item": it.item,
      "Description": it.description,
      "Unit": it.unit,
      "Quantity": qty,
      "Rate (NGN)": rate,
      "Amount (NGN)": amount
    };
  });
  const subtotal = items.reduce((acc, it) => acc + it["Amount (NGN)"], 0);
  const swampPercent = Number(data.swampPremiumPercent || 0);
  const swampAmount = subtotal * (swampPercent / 100);
  const adjustedSubtotal = subtotal + swampAmount;
  const poPercent = Number(data.poPercent ?? 15);
  const poAmount = adjustedSubtotal * (poPercent / 100);
  const vatPercent = Number(data.vatPercent ?? 7.5);
  const vatAmount = (adjustedSubtotal + poAmount) * (vatPercent / 100);
  const grandTotal = adjustedSubtotal + poAmount + vatAmount;
  const summaryRows = [
    ["LET'S ESTIMATE - FORMAL TENDER BILL OF QUANTITIES"],
    ["Standard Method of Measurement of Building Works (BESMM4 / NIQS)"],
    [],
    ["PROJECT SPECIFICATION & CONTRACT COLLECTION"],
    ["Project Title:", title],
    ["Site Location:", location],
    ["State / Region:", data.state || "Lagos, Nigeria"],
    ["Client / Employer:", client],
    ["Date of Tender:", dateStr],
    ["Estimate Version:", data.activeVersion || "V1"],
    ["Gross Floor Area (GFA):", data.gfa ? `${data.gfa} m\xB2` : "Not Specified"],
    ["Cost per m\xB2 GFA Benchmark:", data.gfa && data.gfa > 0 ? `NGN ${(grandTotal / data.gfa).toLocaleString("en-US", { maximumFractionDigits: 0 })} / m\xB2` : "N/A"],
    [],
    ["SUMMARY OF MEASURED BILLS", "AMOUNT (NGN)"],
    ["Measured Trade Works Subtotal", subtotal]
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
  wsSummary["!cols"] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Grand Summary");
  const boqRows = [
    ["BILL OF QUANTITIES (MEASURED TRADE WORKS)"],
    ["Project:", title],
    [],
    ["Item No.", "Trade Section", "Bill Item", "Description of Works", "Unit", "Quantity", "Rate (NGN)", "Amount (NGN)"]
  ];
  items.forEach((it) => {
    boqRows.push([
      it["Item No."],
      it["Trade Section"],
      it["Bill Item"],
      it["Description"],
      it["Unit"],
      it["Quantity"],
      it["Rate (NGN)"],
      it["Amount (NGN)"]
    ]);
  });
  boqRows.push([]);
  boqRows.push(["", "", "", "", "", "", "Subtotal (NGN):", subtotal]);
  boqRows.push(["", "", "", "", "", "", `P&O (${poPercent}%):`, poAmount]);
  boqRows.push(["", "", "", "", "", "", `VAT (${vatPercent}%):`, vatAmount]);
  boqRows.push(["", "", "", "", "", "", "GRAND TOTAL (NGN):", grandTotal]);
  const wsBoq = XLSX.utils.aoa_to_sheet(boqRows);
  wsBoq["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 20 },
    { wch: 50 },
    { wch: 8 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsBoq, "Bill of Quantities");
  const matCalc = calculateMaterialRequirements(data.items);
  const matRows = [
    ["MATERIAL PROCUREMENT SCHEDULE & SITE BUDGET"],
    ["Estimated quantities derived from measured bill dimensions"],
    [],
    ["Material Item", "Specification / Grade", "Estimated Qty", "Standard Unit", "Estimated Depot Rate (NGN)", "Procurement Budget (NGN)"],
    ["Cement (50kg bags)", "Portland Cement Grade 42.5N (Elephant/Dangote/BUA)", matCalc.cementBags, "Bags", matCalc.depotRates.cement, matCalc.cementBags * matCalc.depotRates.cement],
    ["Sharp Sand (Aggregate)", "Coarse clean river sharp sand for concrete & mortar", matCalc.sandTonnes, "Tonnes", matCalc.depotRates.sand, matCalc.sandTonnes * matCalc.depotRates.sand],
    ["Granite / Stone (20mm)", 'Crushed clean quarry granite aggregate (3/4")', matCalc.graniteTonnes, "Tonnes", matCalc.depotRates.granite, matCalc.graniteTonnes * matCalc.depotRates.granite],
    ["Reinforcement Rebar", "High-yield deformed steel rebars (Y10 - Y20 mix)", matCalc.rebarTonnes, "Tonnes", matCalc.depotRates.rebar, matCalc.rebarTonnes * matCalc.depotRates.rebar],
    ["225mm Hollow Blocks", '9" Vibrated hollow sandcrete blocks (4.5 N/mm\xB2)', matCalc.blocks225, "Blocks", matCalc.depotRates.block225, matCalc.blocks225 * matCalc.depotRates.block225],
    ["150mm Hollow Blocks", '6" Vibrated sandcrete blocks for internal partitions', matCalc.blocks150, "Blocks", matCalc.depotRates.block150, matCalc.blocks150 * matCalc.depotRates.block150],
    ["Aluminium Roofing Sheets", "0.55mm Step-tile longspan standing seam roofing", matCalc.roofingSqm, "m\xB2", matCalc.depotRates.roofing, matCalc.roofingSqm * matCalc.depotRates.roofing],
    [],
    ["", "", "", "", "TOTAL ESTIMATED DIRECT MATERIALS BUDGET:", matCalc.totalCost]
  ];
  const wsMat = XLSX.utils.aoa_to_sheet(matRows);
  wsMat["!cols"] = [
    { wch: 25 },
    { wch: 45 },
    { wch: 16 },
    { wch: 14 },
    { wch: 25 },
    { wch: 26 }
  ];
  XLSX.utils.book_append_sheet(wb, wsMat, "Material Procurement");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
function generatePdfBuffer(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        info: {
          Title: `BOQ - ${data.projectTitle}`,
          Author: "Let's Estimate Nigeria",
          Subject: "Tender Bill of Quantities"
        }
      });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
      const title = data.projectTitle || "Let's Estimate - Project BOQ";
      const location = data.location || "Nigeria";
      const client = data.clientName || "Private Client";
      const dateStr = data.date || (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB");
      doc.rect(36, 36, 523, 66).fill("#064e3b");
      doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold").text("LET'S ESTIMATE", 50, 48, { characterSpacing: 1 });
      doc.fontSize(8.5).font("Helvetica").text("TENDER BILL OF QUANTITIES (BOQ) - NIGERIA", 50, 70, { characterSpacing: 0.5 });
      doc.fontSize(7.5).text("Building & Engineering Standard Method of Measurement (BESMM4 / NIQS)", 50, 83);
      doc.fillColor("#a7f3d0").fontSize(8).text(`Date: ${dateStr}`, 440, 48, { align: "right" });
      doc.text(`Version: ${data.activeVersion || "V1"}`, 440, 62, { align: "right" });
      doc.text("Currency: NGN (\u20A6)", 440, 76, { align: "right" });
      let y = 114;
      doc.rect(36, y, 523, 50).fill("#f0fdf4").stroke("#bbf7d0");
      doc.fillColor("#166534").fontSize(8).font("Helvetica-Bold").text("PROJECT:", 46, y + 8);
      doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text(title, 96, y + 8, { width: 440, ellipsis: true });
      doc.fillColor("#166534").fontSize(8).font("Helvetica-Bold").text("LOCATION:", 46, y + 24);
      doc.fillColor("#334155").fontSize(8).font("Helvetica").text(location, 96, y + 24);
      doc.fillColor("#166534").fontSize(8).font("Helvetica-Bold").text("CLIENT:", 320, y + 24);
      doc.fillColor("#334155").fontSize(8).font("Helvetica").text(client, 365, y + 24);
      if (data.gfa && data.gfa > 0) {
        doc.fillColor("#166534").fontSize(8).font("Helvetica-Bold").text("GFA:", 46, y + 36);
        doc.fillColor("#334155").fontSize(8).font("Helvetica").text(`${data.gfa} m\xB2 (${data.projectType || "Building"})`, 96, y + 36);
      }
      y = 176;
      const colNo = 40;
      const colItem = 68;
      const colDesc = 145;
      const colUnit = 360;
      const colQty = 395;
      const colRate = 450;
      const colAmt = 505;
      doc.rect(36, y, 523, 20).fill("#047857");
      doc.fillColor("#ffffff").fontSize(7.5).font("Helvetica-Bold");
      doc.text("No", colNo, y + 6);
      doc.text("Bill Item", colItem, y + 6);
      doc.text("Description of Works", colDesc, y + 6);
      doc.text("Unit", colUnit, y + 6);
      doc.text("Qty", colQty, y + 6, { width: 45, align: "right" });
      doc.text("Rate \u20A6", colRate, y + 6, { width: 50, align: "right" });
      doc.text("Amount \u20A6", colAmt, y + 6, { width: 50, align: "right" });
      y += 20;
      let subtotal = 0;
      data.items.forEach((it, idx) => {
        const qty = Number(it.qty || 0);
        const rate = Number(it.rate || 0);
        const amount = qty * rate;
        subtotal += amount;
        if (y > 700) {
          doc.addPage();
          y = 40;
        }
        const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(36, y, 523, 26).fill(bg);
        doc.rect(36, y, 523, 26).stroke("#e2e8f0");
        doc.fillColor("#334155").fontSize(7.5).font("Helvetica");
        doc.text(String(it.item_number || idx + 1), colNo, y + 8);
        doc.font("Helvetica-Bold").fillColor("#0f172a").text(it.item, colItem, y + 8, { width: 72, ellipsis: true });
        doc.font("Helvetica").fillColor("#475569").text(it.description, colDesc, y + 4, { width: 210, height: 20, ellipsis: true });
        doc.fillColor("#0f172a").text(it.unit, colUnit, y + 8);
        doc.text(qty.toLocaleString("en-US", { maximumFractionDigits: 1 }), colQty, y + 8, { width: 45, align: "right" });
        doc.text(rate.toLocaleString("en-US"), colRate, y + 8, { width: 50, align: "right" });
        doc.font("Helvetica-Bold").fillColor("#047857").text(amount.toLocaleString("en-US"), colAmt, y + 8, { width: 50, align: "right" });
        y += 26;
      });
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
      const summaryBoxX = 270;
      const summaryBoxWidth = 289;
      doc.rect(summaryBoxX, y, summaryBoxWidth, swampPercent > 0 ? 115 : 95).fill("#f8fafc").stroke("#cbd5e1");
      let sy = y + 8;
      const renderTotalLine = (label, value, isBold = false, isGrand = false) => {
        doc.fontSize(7.5).font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(isGrand ? "#064e3b" : "#334155").text(label, summaryBoxX + 12, sy);
        doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(isGrand ? "#047857" : "#0f172a").text("NGN " + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryBoxX + 140, sy, {
          width: 135,
          align: "right"
        });
        sy += 16;
      };
      renderTotalLine("Measured Sub-Total:", subtotal);
      if (swampPercent > 0) {
        renderTotalLine(`Swamp / Terrain Premium (${swampPercent}%):`, swampAmount);
      }
      renderTotalLine(`Contractor's Profit & Overheads (${poPercent}%):`, poAmount);
      renderTotalLine(`Statutory Nigerian VAT (${vatPercent}%):`, vatAmount);
      doc.rect(summaryBoxX + 10, sy - 2, summaryBoxWidth - 20, 1).fill("#94a3b8");
      sy += 4;
      renderTotalLine("TOTAL TENDER CONTRACT SUM:", grandTotal, true, true);
      y = sy + 25;
      if (y > 740) {
        doc.addPage();
        y = 60;
      }
      doc.rect(36, y, 230, 52).stroke("#cbd5e1");
      doc.fillColor("#64748b").fontSize(6.5).text("PREPARED BY / QUANTITY SURVEYOR:", 42, y + 6);
      doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica-Bold").text("Registered Quantity Surveyor (NIQS / QSRBN Format)", 42, y + 17);
      doc.fillColor("#64748b").fontSize(6.5).font("Helvetica").text("Signature / Stamp: __________________________", 42, y + 32);
      doc.rect(329, y, 230, 52).stroke("#cbd5e1");
      doc.fillColor("#64748b").fontSize(6.5).text("VERIFIED & ACCEPTED BY CLIENT / EMPLOYER:", 335, y + 6);
      doc.fillColor("#0f172a").fontSize(7.5).font("Helvetica-Bold").text(client, 335, y + 17);
      doc.fillColor("#64748b").fontSize(6.5).font("Helvetica").text("Signature / Date: __________________________", 335, y + 32);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
function generateUserGuidePdfBuffer(options) {
  const contactEmail = options?.contactEmail || "estimatewithisaac@gmail.com";
  const whatsappPhone = options?.whatsappPhone || "";
  const brandName = options?.brandName || "Estimate with Isaac";
  const leadQsName = options?.leadQsName || "Emmanuel Isaac, MYQSF";
  const footerLabel = `Let's Estimate 2.0 User Manual - ${brandName} (${contactEmail})`;
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: "Let's Estimate 2.0 - Complete User Guide & Manual",
          Author: leadQsName,
          Subject: "Comprehensive User Guide for Nigerian Construction Professionals"
        }
      });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
      doc.rect(0, 0, 595, 842).fill("#064e3b");
      doc.rect(30, 30, 535, 782).fill("#ffffff");
      doc.rect(30, 30, 535, 110).fill("#047857");
      doc.fillColor("#ffffff").fontSize(24).font("Helvetica-Bold").text("LET'S ESTIMATE 2.0", 50, 55, { characterSpacing: 1.5 });
      doc.fontSize(11).font("Helvetica").text("AI-POWERED BILL OF QUANTITIES (BOQ) & QUANTITY SURVEYING PLATFORM", 50, 88);
      doc.fontSize(9).font("Helvetica-Oblique").fillColor("#a7f3d0").text("Official User Guide, BESMM4 Standards & Field Manual for Nigerian Construction", 50, 106);
      let y = 160;
      doc.fillColor("#064e3b").fontSize(14).font("Helvetica-Bold").text("1. Welcome to Let's Estimate 2.0", 50, y);
      y += 20;
      doc.fillColor("#334155").fontSize(9).font("Helvetica").lineGap(4).text(
        "Let's Estimate is an enterprise-grade Quantity Surveying and Cost Engineering platform engineered specifically for Nigerian construction professionals\u2014Architects, Builders, Registered Quantity Surveyors (NIQS), and General Contractors.\n\nPowered by Google Gemini 2.5 Flash Vision AI and aligned with the Building & Engineering Standard Method of Measurement (BESMM4), the system transforms complex architectural drawings into deterministic, audit-proof Bills of Quantities in seconds.",
        50,
        y,
        { width: 495, align: "justify" }
      );
      y += 75;
      doc.fillColor("#064e3b").fontSize(14).font("Helvetica-Bold").text("2. Core Platform Capabilities", 50, y);
      y += 20;
      const features = [
        {
          title: "AI Architectural Drawing Takeoff",
          desc: "Upload PDFs, CAD floor plans, or scanned blueprints. Gemini Vision extracts structural members, concrete volumes, blockwork m\xB2, and finishes."
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
        doc.rect(col, rowY, 240, 56).fill("#f8fafc").stroke("#e2e8f0");
        doc.fillColor("#047857").fontSize(9).font("Helvetica-Bold").text(feat.title, col + 10, rowY + 8, { width: 220 });
        doc.fillColor("#475569").fontSize(7.5).font("Helvetica").lineGap(2).text(feat.desc, col + 10, rowY + 22, { width: 220 });
      });
      y += 215;
      doc.rect(50, y, 495, 80).fill("#f0fdf4").stroke("#86efac");
      doc.fillColor("#166534").fontSize(10).font("Helvetica-Bold").text("Professional Accreditation Notice", 65, y + 10);
      doc.fillColor("#334155").fontSize(8).font("Helvetica").lineGap(3).text(
        "All calculations and schedules follow the standards codified by the Nigerian Institute of Quantity Surveyors (NIQS) and the Quantity Surveyors Registration Board of Nigeria (QSRBN). Rates reflect prevailing market surveys conducted across Lagos State, Rivers State, and the Federal Capital Territory (FCT).",
        65,
        y + 26,
        { width: 465 }
      );
      doc.fillColor("#94a3b8").fontSize(7).text(`Page 1 of 3 - ${footerLabel}`, 50, 790, { align: "center", width: 495 });
      doc.addPage();
      doc.rect(30, 30, 535, 782).stroke("#e2e8f0");
      doc.rect(30, 30, 535, 45).fill("#064e3b");
      doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold").text("Step-by-Step User Workflow", 50, 46);
      doc.fontSize(8.5).font("Helvetica").text("From Architectural Upload to Contract Award in 5 Simple Steps", 300, 49, { align: "right", width: 245 });
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
          detail: "The AI Takeoff drawer extracts concrete slabs (m\xB3), perimeter blockwork (m\xB2), plastering (m\xB2), roofing trusses, doors, and windows. Inspect detected quantities, adjust any dimensions if needed, and click 'Confirm & Insert into BOQ'."
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
        doc.rect(50, y, 495, 72).fill("#ffffff").stroke("#cbd5e1");
        doc.rect(50, y, 65, 72).fill("#047857");
        doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold").text(s.step, 50, y + 28, { width: 65, align: "center" });
        doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text(s.title, 125, y + 10);
        doc.fillColor("#475569").fontSize(8).font("Helvetica").lineGap(2).text(s.detail, 125, y + 26, { width: 405 });
        y += 82;
      });
      y += 10;
      doc.rect(50, y, 495, 125).fill("#fefce8").stroke("#fde047");
      doc.fillColor("#854d0e").fontSize(11).font("Helvetica-Bold").text("Contract Administration & Interim Valuations (IPC)", 65, y + 12);
      doc.fillColor("#713f12").fontSize(8).font("Helvetica").lineGap(3).text(
        "During construction, use the 'Project Controls' view to certify progress payments:\n\u2022 Interim Payment Certificate (IPC): Track cumulative work executed against contract milestones.\n\u2022 Retention Withholding: Automatically deduct 5% or 10% retention until the Defects Liability Period.\n\u2022 Variation Orders: Log approved additions and omissions with instant contract sum re-calculation.\n\u2022 Cash Flow Forecasts: Visual S-curve projections comparing planned vs. actual cash drawdowns.\n\u2022 Tender Bid Equalization: Compare sub-contractor bids against the engineering benchmark.",
        65,
        y + 30,
        { width: 465 }
      );
      doc.fillColor("#94a3b8").fontSize(7).text(`Page 2 of 3 - ${footerLabel}`, 50, 790, { align: "center", width: 495 });
      doc.addPage();
      doc.rect(30, 30, 535, 782).stroke("#e2e8f0");
      doc.rect(30, 30, 535, 45).fill("#064e3b");
      doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold").text("Best Practices & Expert Tips", 50, 46);
      doc.fontSize(8.5).font("Helvetica").text("Maximizing Accuracy with Gemini AI & BESMM4 Rules", 300, 49, { align: "right", width: 245 });
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
          a: "When you export to Excel, the platform automatically calculates physical material quantities based on Nigerian structural mix ratios: 7.2 bags of cement per m\xB3 of Grade 25 concrete, 0.45 tonnes of granite, 0.5 tonnes of sharp sand, and rebar tonnage."
        },
        {
          q: "Can I share a live read-only tender link with my Client or Subcontractors?",
          a: "Yes. In the project menu, select 'Share Project' to generate an encrypted public link. Clients can review the BOQ without requiring a login or modifying existing items."
        }
      ];
      tips.forEach((t) => {
        doc.fillColor("#064e3b").fontSize(9.5).font("Helvetica-Bold").text("Q: " + t.q, 50, y, { width: 495 });
        y += 14;
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").lineGap(2).text(t.a, 50, y, { width: 495, align: "justify" });
        y += 38;
      });
      y += 10;
      doc.rect(50, y, 495, 95).fill("#f1f5f9").stroke("#cbd5e1");
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("Essential Platform Navigation & Shortcuts", 65, y + 10);
      doc.fillColor("#334155").fontSize(8).font("Helvetica").lineGap(3).text(
        "\u2022 Universal '+ Create' Button: Located in the top header\u2014instantly spawn Projects, BOQs, Estimates, or Valuations.\n\u2022 Global Search Bar: Press or click search to jump instantly to any project, bill item, or engineering calculator.\n\u2022 Section Filters: In the BOQ Table, filter items by 'Substructure', 'Superstructure', 'Finishes', or 'MEP'.\n\u2022 Preset Items: Use the '+ Add Item' dropdown to insert pre-measured BESMM4 clauses with standardized descriptions.",
        65,
        y + 26,
        { width: 465 }
      );
      y += 115;
      doc.rect(50, y, 495, 65).fill("#ecfdf5").stroke("#6ee7b7");
      doc.fillColor("#065f46").fontSize(10).font("Helvetica-Bold").text("Need Help or Custom Enterprise Deployment?", 65, y + 10);
      const hotlineInfo = whatsappPhone ? `  |  WhatsApp Hotline: ${whatsappPhone}` : "";
      doc.fillColor("#047857").fontSize(8).font("Helvetica").text(
        `Official Support: ${contactEmail}${hotlineInfo}  |  Lead Consultant: ${leadQsName}
Built with pride for Quantity Surveyors, Civil Engineers, and Builders across Nigeria.`,
        65,
        y + 26,
        { width: 465 }
      );
      doc.fillColor("#94a3b8").fontSize(7).text(`Page 3 of 3 - ${footerLabel}`, 50, 790, { align: "center", width: 495 });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
export {
  calculateMaterialRequirements,
  generateExcelBuffer,
  generatePdfBuffer,
  generateUserGuidePdfBuffer
};
