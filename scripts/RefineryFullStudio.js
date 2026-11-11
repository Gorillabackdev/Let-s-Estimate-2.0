const aee = ({ activeProject: a, projects: t = [], onCommitToBoq: s, onCreateProject: r, onNavigate: n }) => {
  // 1. Default Refinery Projects
  const defaultRefineryProjects = [
    {
      id: "dangote_refinery",
      title: "Dangote 650,000 BPD Deep-Conversion Complex (Lekki Free Zone)",
      type: "World-Scale Integrated Refinery & Petrochemical Complex",
      capacityBpd: 650000,
      location: "Lekki Free Trade Zone, Lagos State, Nigeria",
      benchmarkUsdPerBpd: 28500,
      specStandard: "ASME B31.3 / API 5L / API 650",
      client: "Dangote Oil Refining Company"
    },
    {
      id: "modular_splitter",
      title: "10,000 BPD Modular Condensate Splitter (Edo / Delta Skids)",
      type: "Modular Skid-Mounted Splitter",
      capacityBpd: 10000,
      location: "Ologbo, Edo State, Nigeria",
      benchmarkUsdPerBpd: 18500,
      specStandard: "ASME B31.3 / API 12F",
      client: "Duport Midstream / Edo Refinery"
    },
    {
      id: "ph_revamp",
      title: "Port Harcourt 60,000 BPD CDU/VDU Revamp & Modernization",
      type: "Turnaround Maintenance (TAM) & Modernization",
      capacityBpd: 60000,
      location: "Alesa Eleme, Rivers State, Nigeria",
      benchmarkUsdPerBpd: 16500,
      specStandard: "ASME B31.3 / API 510 / API 570",
      client: "Port Harcourt Refining Company (NNPC)"
    },
    {
      id: "warri_petrochem",
      title: "Warri Petrochemical Polypropylene & Alkylation Unit",
      type: "Petrochemical & Polymer Derivative Plant",
      capacityBpd: 125000,
      location: "Ekpan, Delta State, Nigeria",
      benchmarkUsdPerBpd: 24000,
      specStandard: "ASME Section VIII Div 1 / ASME B31.3",
      client: "Warri Refining & Petrochemical Co."
    },
    {
      id: "escravos_gtl",
      title: "Escravos Gas Processing & Gas-to-Liquids (GTL) Facility",
      type: "Cryogenic Gas Processing & GTL",
      capacityBpd: 33000,
      location: "Escravos River Terminal, Delta State",
      benchmarkUsdPerBpd: 32000,
      specStandard: "ASME B31.3 Cryogenic / API 620",
      client: "Chevron Nigeria / NNPC JV"
    }
  ];

  // Merge with custom refinery projects from parent
  const mergedRefineryProjects = _.useMemo(() => {
    const list = [...defaultRefineryProjects];
    if (t && t.length > 0) {
      t.forEach(p => {
        const title = (p.title || p.name || "").toLowerCase();
        const type = (p.project_type || p.type || "").toLowerCase();
        if (title.includes("refinery") || title.includes("petrochem") || title.includes("splitter") || title.includes("bpd") || title.includes("cdu") || type.includes("refinery") || type.includes("epc")) {
          if (!list.find(item => item.id === p.id)) {
            list.push({
              id: p.id,
              title: p.title || p.name,
              type: "Custom Refinery / EPC",
              capacityBpd: 50000,
              location: p.location || "Nigeria",
              benchmarkUsdPerBpd: 20000,
              specStandard: "ASME B31.3 / API 5L",
              client: p.client_name || "Refining Operator"
            });
          }
        }
      });
    }
    return list;
  }, [t]);

  const [selectedProjectId, setSelectedProjectId] = _.useState("dangote_refinery");
  const activeRefineryProject = _.useMemo(() => {
    return mergedRefineryProjects.find(p => p.id === selectedProjectId) || mergedRefineryProjects[0];
  }, [mergedRefineryProjects, selectedProjectId]);

  // Currency & Exchange State
  const [summaryCurrency, setSummaryCurrency] = _.useState("USD"); // "USD" | "NGN"
  const [exchangeRate, setExchangeRate] = _.useState(1550);

  // Tab Navigation: wizard (Estimator), mto (Takeoff Items), material_schedule (Materials Schedule), specs_drawings (Review Drawings & Specs), projects (Project Registry)
  const [activeTab, setActiveTab] = _.useState("mto");
  const [searchFilter, setSearchFilter] = _.useState("");
  const [activeDisciplineFilter, setActiveDisciplineFilter] = _.useState("all");
  const [actionNotice, setActionNotice] = _.useState(null);

  // Takeoff Calculation Collapse ID
  const [expandedCalcId, setExpandedCalcId] = _.useState(null);

  const notify = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const formatMoney = (valUsd) => {
    if (valUsd == null || isNaN(valUsd)) return summaryCurrency === "USD" ? "$0.00" : "₦0";
    if (summaryCurrency === "USD") {
      return "$" + Number(valUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      const ngnVal = Number(valUsd) * exchangeRate;
      return "₦" + Math.round(ngnVal).toLocaleString("en-NG");
    }
  };

  const getDisplayRate = (rateUsd) => {
    if (summaryCurrency === "NGN") {
      return Math.round(Number(rateUsd) * exchangeRate);
    }
    return Number(rateUsd);
  };

  // =========================================================================
  // 2. PROJECT-DEPENDENT REFINERY MATERIALS SCHEDULE (UNIFIED FORMAT)
  // All initial quantities start at 0 (NO ASSUMED FIGURES!)
  // =========================================================================
  const initialRefineryMaterialsDatabase = {
    dangote_refinery: [
      { id: "mat-dng-01", code: "MAT-REF-01", discipline: "Process Piping", desc: "ASTM A106 Grade B Seamless Carbon Steel Process Pipe (Schedule 80)", spec: "ASME B31.3 / NACE MR0175", size: "12\" NPS (Nominal Pipe Size)", qty: 0, waste: 5, unit: "m", rateUsd: 285, source: "Vallourec / Tenaris (Import)", leadTime: "8-12 Weeks" },
      { id: "mat-dng-02", code: "MAT-REF-02", discipline: "Process Piping", desc: "API 5L Grade X65 PSL2 High-Yield Long-Distance Crude Feed Line Pipe", spec: "API 5L / PSL2 Acid Gas Tested", size: "24\" NPS (14.3mm Wall Thickness)", qty: 0, waste: 4, unit: "m", rateUsd: 540, source: "Shengli / Tenaris Global", leadTime: "12-16 Weeks" },
      { id: "mat-dng-03", code: "MAT-REF-03", discipline: "Process Piping", desc: "ASME B16.5 Class 600 Forged Carbon Steel Weld Neck Flanges (ASTM A105N)", spec: "ASME B16.5 / Raised Face (RF)", size: "12\" Class 600 RF", qty: 0, waste: 2, unit: "nr", rateUsd: 480, source: "Galperti / Melesi Forged Components", leadTime: "6-8 Weeks" },
      { id: "mat-dng-04", code: "MAT-REF-04", discipline: "Process Piping", desc: "Cast Steel Wedge Gate Valves Class 300 with Stellite Hard-Faced Trim (ASTM A216 WCB)", spec: "API 600 / Firesafe API 6FA", size: "10\" Class 300 Flanged", qty: 0, waste: 0, unit: "nr", rateUsd: 2850, source: "Crane / Velan Energy Valves", leadTime: "10-14 Weeks" },
      { id: "mat-dng-05", code: "MAT-REF-05", discipline: "Mechanical Equipment", desc: "Stainless Steel 316L Clad Distillation Column Internal Float Valve Trays & Downcomers", spec: "ASME Section VIII Div 1 / Koch-Glitsch Spec", size: "7.5m Internal Diameter Columns", qty: 0, waste: 2, unit: "nr", rateUsd: 14500, source: "Sulzer Chemtech / Koch-Glitsch", leadTime: "16-20 Weeks" },
      { id: "mat-dng-06", code: "MAT-REF-06", discipline: "Mechanical Equipment", desc: "Heavy-Gauge ASTM A516 Grade 70 Pressure Vessel Shell Plates (HIC-Tested)", spec: "ASME Section VIII / Hydrogen Induced Cracking Tested", size: "45mm Thickness x 3000mm Width", qty: 0, waste: 5, unit: "tonne", rateUsd: 2450, source: "Dillinger Hütte / Voestalpine", leadTime: "12 Weeks" },
      { id: "mat-dng-07", code: "MAT-REF-07", discipline: "Storage Tankage", desc: "API 650 Crude Storage Tank Shell & Floating Roof Steel Plates (ASTM A283 Gr C / A516 Gr 65)", spec: "API 650 13th Edition / Full Radiography", size: "60m Diameter Tank Shell (12-32mm t)", qty: 0, waste: 6, unit: "tonne", rateUsd: 1950, source: "JFE Steel / ArcelorMittal", leadTime: "8-10 Weeks" },
      { id: "mat-dng-08", code: "MAT-REF-08", discipline: "Thermal Insulation", desc: "High-Temperature Pre-Formed Mineral Wool Pipe Insulation with 0.5mm Aluminium Cladding", spec: "ASTM C547 Class 3 / 650°C Rating", size: "75mm Wall Insulation on 12\" Pipe", qty: 0, waste: 8, unit: "m", rateUsd: 95, source: "Rockwool International", leadTime: "4-6 Weeks" },
      { id: "mat-dng-09", code: "MAT-REF-09", discipline: "Refractory Linings", desc: "High-Alumina Dense Castable Refractory & Ceramic Fiber Blanket Lining (Crude Furnace)", spec: "ASTM C401 Class F / 1450°C Direct Flame", size: "200mm Monolithic Lining", qty: 0, waste: 7, unit: "m²", rateUsd: 320, source: "RHI Magnesita Refractory", leadTime: "8-12 Weeks" },
      { id: "mat-dng-10", code: "MAT-REF-10", discipline: "Instrumentation", desc: "Smart Differential Pressure Level & Flow Transmitters with Remote Diaphragm Seals", spec: "IEC 61508 SIL 2/3 / HART 7 Protocol", size: "Hastelloy C-276 Diaphragm Seals", qty: 0, waste: 0, unit: "nr", rateUsd: 3400, source: "Emerson Rosemount / Yokogawa", leadTime: "6-8 Weeks" }
    ],
    modular_splitter: [
      { id: "mat-mod-01", code: "MAT-REF-01", discipline: "Process Piping", desc: "ASTM A106 Gr. B Prefabricated Spool Piping Assemblies (Sch 40 with 150# Flanges)", spec: "ASME B31.3 Skid Spool Spec", size: "4\" to 8\" Process Spools", qty: 0, waste: 3, unit: "m", rateUsd: 165, source: "Local Nigerian Pipe Fabrication Skid Yard", leadTime: "4-6 Weeks" },
      { id: "mat-mod-02", code: "MAT-REF-02", discipline: "Mechanical Equipment", desc: "Compact Brazed Aluminium / Plate-Fin Reboiler Heat Exchanger Core", spec: "ASME Section VIII Div 1 / High Thermal Flux", size: "Modular Skid Heat Exchanger Unit", qty: 0, waste: 0, unit: "nr", rateUsd: 85000, source: "Chart Industries / Alfa Laval", leadTime: "12-14 Weeks" },
      { id: "mat-mod-03", code: "MAT-REF-03", discipline: "Process Piping", desc: "Pneumatic Control Valves with Smart Digital Valve Controllers (Fisher Style)", spec: "ANSI Class 150 / 316 SS Trim / Fail-Safe", size: "4\" Flanged Control Valve", qty: 0, waste: 0, unit: "nr", rateUsd: 4200, source: "Emerson Process Management", leadTime: "6-8 Weeks" },
      { id: "mat-mod-04", code: "MAT-REF-04", discipline: "Instrumentation", desc: "Seamless Stainless Steel 316L Instrument Tubing with Twin-Ferrule Compression Fittings", spec: "ASTM A269 / High Pressure Cleanliness", size: "1/2\" OD x 0.049\" Wall Thickness", qty: 0, waste: 8, unit: "m", rateUsd: 32, source: "Swagelok / Parker Hannifin", leadTime: "2-3 Weeks" },
      { id: "mat-mod-05", code: "MAT-REF-05", discipline: "Safety Systems", desc: "Explosion-Proof Deflagration & In-Line Detonation Flame Arrestors", spec: "ISO 16852 / ATEX Certified Group D", size: "6\" Flanged Bi-directional", qty: 0, waste: 0, unit: "nr", rateUsd: 6800, source: "Elmac Technologies / Protectoseal", leadTime: "4-6 Weeks" }
    ],
    ph_revamp: [
      { id: "mat-ph-01", code: "MAT-REF-01", discipline: "Fired Heaters", desc: "Alloy Steel Furnace Radiator Tubes (ASTM A335 Grade P11 - 1.25Cr 0.5Mo Seamless)", spec: "API 530 / ASME B31.3 High Temperature", size: "6\" NPS Sch 80 Furnace Tubes", qty: 0, waste: 4, unit: "m", rateUsd: 410, source: "Tubacex / Mannesmann", leadTime: "12-14 Weeks" },
      { id: "mat-ph-02", code: "MAT-REF-02", discipline: "Distillation Columns", desc: "Structured Packing Replacement Bundles (High Efficiency Corrugated SS316L Mellapak 250Y)", spec: "Sulzer Mellapak 250Y Specification", size: "4.5m Diameter Column Bed", qty: 0, waste: 2, unit: "m³", rateUsd: 6200, source: "Sulzer Chemtech Revamp", leadTime: "10-12 Weeks" },
      { id: "mat-ph-03", code: "MAT-REF-03", discipline: "Process Piping", desc: "Spiral Wound Gaskets with SS316 Inner/Outer Rings & Flexible Graphite Filler", spec: "ASME B16.20 / Class 300 to 600", size: "Assorted 2\" to 18\" Gasket Sets", qty: 0, waste: 5, unit: "nr", rateUsd: 45, source: "Flexitallic / Klinger Seals", leadTime: "Immediate (Local Stock)" },
      { id: "mat-ph-04", code: "MAT-REF-04", discipline: "Process Piping", desc: "Forged Carbon Steel High-Pressure Ball Valves (Class 300 with PEEK Seats)", spec: "API 6D / Firesafe API 607", size: "6\" Class 300 Full Bore", qty: 0, waste: 0, unit: "nr", rateUsd: 3100, source: "Kitz / Cameron Valves", leadTime: "6-8 Weeks" },
      { id: "mat-ph-05", code: "MAT-REF-05", discipline: "Corrosion Protection", desc: "High-Build Novolac Epoxy Coating for Hydrocarbon Tank Bottom Plates & Sump Linings", spec: "NACE Standard RP0178 / 100% Solids", size: "500 Microns Dry Film Thickness", qty: 0, waste: 10, unit: "m²", rateUsd: 48, source: "Jotun / International Paint Nigeria", leadTime: "Immediate" }
    ],
    warri_petrochem: [
      { id: "mat-war-01", code: "MAT-REF-01", discipline: "Process Piping", desc: "Low-Temperature Carbon Steel Seamless Pipe (ASTM A333 Grade 6 for Cryogenic Service)", spec: "ASME B31.3 / Charpy V-Notch at -46°C", size: "8\" NPS Sch 80", qty: 0, waste: 5, unit: "m", rateUsd: 310, source: "Tenaris Global / Vallourec", leadTime: "10-12 Weeks" },
      { id: "mat-war-02", code: "MAT-REF-02", discipline: "Specialist Valves", desc: "PTFE/PFA Lined Corrosion Resistant Plug & Ball Valves for Corrosive Acid Services", spec: "ASME B16.34 / Zero Stem Leakage", size: "4\" Class 150 Full Lined", qty: 0, waste: 0, unit: "nr", rateUsd: 3800, source: "Flowserve / Crane ChemPharma", leadTime: "8-10 Weeks" },
      { id: "mat-war-03", code: "MAT-REF-03", discipline: "Reactor Internals", desc: "Autoclave Reactor High-Pressure SS316Ti Agitator Impellers & Magnetic Drive Couplings", spec: "ASME Section VIII Div 2 / 120 Bar Rating", size: "Heavy Polymer Agitator Shaft", qty: 0, waste: 0, unit: "item", rateUsd: 145000, source: "Ekato / SPX Flow Mixing", leadTime: "16-20 Weeks" },
      { id: "mat-war-04", code: "MAT-REF-04", discipline: "Safety Relief", desc: "API 526 Flanged Spring-Loaded Safety Relief Valves with Inconel 625 Bellows", spec: "ASME Section VIII / Orifice P & Q Sizes", size: "4\" x 6\" Class 900 Inlet", qty: 0, waste: 0, unit: "nr", rateUsd: 9200, source: "Consolidated / Crosby Relief Valves", leadTime: "8-12 Weeks" }
    ],
    escravos_gtl: [
      { id: "mat-esc-01", code: "MAT-REF-01", discipline: "Cryogenic Piping", desc: "ASTM A312 TP304/304L Seamless Austenitic Stainless Steel Cryogenic Process Piping", spec: "ASME B31.3 Category M / -196°C LNG/GTL Rating", size: "10\" NPS Sch 40S", qty: 0, waste: 4, unit: "m", rateUsd: 680, source: "Sandvik / Nippon Steel", leadTime: "12-16 Weeks" },
      { id: "mat-esc-02", code: "MAT-REF-02", discipline: "Cold Box Exchangers", desc: "Multi-Stream Vacuum-Brazed Aluminium Plate-Fin Heat Exchanger (Cold Box Core)", spec: "ALPEMA Standards / Multi-fluid Methane/Ethane", size: "Cryogenic Cold Box Core", qty: 0, waste: 0, unit: "item", rateUsd: 280000, source: "Linde Engineering / Fives Cryogenics", leadTime: "24 Weeks" },
      { id: "mat-esc-03", code: "MAT-REF-03", discipline: "Process Valves", desc: "ASME Class 1500 Forged High-Pressure Heavy-Duty Choke Valves (API 6A / 10,000 PSI)", spec: "NACE MR0175 / Tungsten Carbide Trim", size: "6\" Class 1500 RTJ", qty: 0, waste: 0, unit: "nr", rateUsd: 18500, source: "Master Flo / Cameron Chokes", leadTime: "10-14 Weeks" },
      { id: "mat-esc-04", code: "MAT-REF-04", discipline: "Cryogenic Insulation", desc: "Cellular Glass Rigid Pipe Insulation (Foamglas One) with Multi-Ply Vapor Barrier", spec: "ASTM C552 / Non-Combustible Zero Permeance", size: "100mm Thickness on 10\" Pipe", qty: 0, waste: 6, unit: "m", rateUsd: 145, source: "Owens Corning Foamglas", leadTime: "6-8 Weeks" }
    ]
  };

  const [projectRefineryMaterials, setProjectRefineryMaterials] = _.useState(initialRefineryMaterialsDatabase);

  const currentMaterialsList = _.useMemo(() => {
    return projectRefineryMaterials[activeRefineryProject.id] || projectRefineryMaterials.dangote_refinery;
  }, [projectRefineryMaterials, activeRefineryProject.id]);

  const handleUpdateMaterial = (matId, field, rawValue) => {
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue) || 0;
    setProjectRefineryMaterials(prev => {
      const projList = prev[activeRefineryProject.id] || prev.dangote_refinery;
      const updated = projList.map(item => {
        if (item.id === matId) {
          return { ...item, [field]: numValue };
        }
        return item;
      });
      return { ...prev, [activeRefineryProject.id]: updated };
    });
  };

  // Add Custom Material Modal
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = _.useState(!1);
  const [newMaterialForm, setNewMaterialForm] = _.useState({
    code: "MAT-REF-CUSTOM",
    discipline: "Process Piping",
    desc: "",
    spec: "ASME B31.3 / API Spec",
    size: "Standard NPS / Rating",
    qty: 0,
    waste: 5,
    unit: "m",
    rateUsd: 0,
    source: "Approved EPC Energy Supplier",
    leadTime: "6-8 Weeks"
  });

  const handleSaveCustomMaterial = () => {
    if (!newMaterialForm.desc.trim()) {
      notify("Please provide a material description.");
      return;
    }
    const newEntry = {
      id: "mat-ref-custom-" + Date.now(),
      ...newMaterialForm
    };
    setProjectRefineryMaterials(prev => {
      const curr = prev[activeRefineryProject.id] || prev.dangote_refinery;
      return { ...prev, [activeRefineryProject.id]: [newEntry, ...curr] };
    });
    setIsAddMaterialModalOpen(!1);
    setNewMaterialForm({
      code: "MAT-REF-CUSTOM",
      discipline: "Process Piping",
      desc: "",
      spec: "ASME B31.3 / API Spec",
      size: "Standard NPS / Rating",
      qty: 0,
      waste: 5,
      unit: "m",
      rateUsd: 0,
      source: "Approved EPC Energy Supplier",
      leadTime: "6-8 Weeks"
    });
    notify("Custom Material added to " + activeRefineryProject.title);
  };

  // Filtered Materials
  const filteredMaterials = _.useMemo(() => {
    return currentMaterialsList.filter(item => {
      const matchesSearch = !searchFilter ||
        item.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.discipline.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesDisc = activeDisciplineFilter === "all" || item.discipline.toLowerCase().includes(activeDisciplineFilter.toLowerCase());
      return matchesSearch && matchesDisc;
    });
  }, [currentMaterialsList, searchFilter, activeDisciplineFilter]);

  // Material Totals KPI
  const materialTotals = _.useMemo(() => {
    let totalCostUsd = 0;
    let totalWasteCostUsd = 0;
    let totalItems = currentMaterialsList.length;
    let criticalLeadTimeCount = 0;

    currentMaterialsList.forEach(m => {
      const reqQty = Number(m.qty || 0) * (1 + (Number(m.waste || 0) / 100));
      const cost = reqQty * Number(m.rateUsd || 0);
      const wasteOnlyCost = (reqQty - Number(m.qty || 0)) * Number(m.rateUsd || 0);
      totalCostUsd += cost;
      totalWasteCostUsd += wasteOnlyCost;
      if ((m.leadTime && (m.leadTime.toLowerCase().includes("10") || m.leadTime.toLowerCase().includes("12") || m.leadTime.toLowerCase().includes("16") || m.leadTime.toLowerCase().includes("20"))) || (m.source && m.source.toLowerCase().includes("import"))) {
        criticalLeadTimeCount++;
      }
    });

    return { totalCostUsd, totalWasteCostUsd, totalItems, criticalLeadTimeCount };
  }, [currentMaterialsList]);

  // 1. Export Refinery Material Schedule PDF (Landscape with ASME/API formatting)
  const exportRefineryMaterialPdf = async () => {
    try {
      notify("Generating professional landscape PDF for " + activeRefineryProject.title + "...");
      const res = await fetch("/api/export/material-schedule-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: activeRefineryProject.title,
          constructionDomain: "refinery",
          specStandard: activeRefineryProject.specStandard || "ASME B31.3 / API 650 / NACE MR0175",
          currency: summaryCurrency,
          exchangeRate: exchangeRate,
          materials: currentMaterialsList.map(m => ({
            ...m,
            rateNgn: m.rateNgn || (m.rateUsd ? m.rateUsd * exchangeRate : 0)
          }))
        })
      });
      if (!res.ok) throw new Error("Server responded with HTTP " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = activeRefineryProject.title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Refinery_Material_Schedule_" + summaryCurrency + ".pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify("Successfully exported " + activeRefineryProject.title + " Material Schedule PDF!");
    } catch (err) {
      console.error("PDF export error:", err);
      notify("Opening print view for PDF save...");
      window.print();
    }
  };

  // 2. Export Refinery Material Schedule Excel (.xlsx)
  const exportRefineryMaterialExcel = async () => {
    try {
      notify("Generating formatted Excel workbook (.xlsx)...");
      const res = await fetch("/api/export/material-schedule-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: activeRefineryProject.title,
          constructionDomain: "refinery",
          specStandard: activeRefineryProject.specStandard || "ASME B31.3 / API 650 / NACE MR0175",
          currency: summaryCurrency,
          exchangeRate: exchangeRate,
          materials: currentMaterialsList.map(m => ({
            ...m,
            rateNgn: m.rateNgn || (m.rateUsd ? m.rateUsd * exchangeRate : 0)
          }))
        })
      });
      if (!res.ok) throw new Error("Server responded with HTTP " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = activeRefineryProject.title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Refinery_Material_Schedule_" + summaryCurrency + ".xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify("Successfully exported " + activeRefineryProject.title + " Material Schedule Excel!");
    } catch (err) {
      console.error("Excel export error:", err);
      notify("Failed to export Excel. Please try CSV export.");
    }
  };

  // 3. Export Clean, Arranged RFC-4180 CSV with UTF-8 BOM
  const exportRefineryMaterialCsv = () => {
    const sanitize = (val) => {
      if (val == null) return '""';
      const s = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ').replace(/"/g, '""');
      return '"' + s.trim() + '"';
    };
    const lines = [];
    lines.push([sanitize("LET'S ESTIMATE - INDUSTRIAL REFINERY & PETROCHEMICAL EPC")].join(","));
    lines.push([sanitize("PROJECT MATERIAL SCHEDULE & PROCUREMENT BILL"), sanitize(new Date().toLocaleDateString("en-GB"))].join(","));
    lines.push([sanitize("Project:"), sanitize(activeRefineryProject.title)].join(","));
    lines.push([sanitize("Construction Domain:"), sanitize("INDUSTRIAL REFINERY & EPC"), sanitize("Standard:"), sanitize(activeRefineryProject.specStandard || "ASME B31.3 / API 650")].join(","));
    lines.push([sanitize("Currency:"), sanitize(summaryCurrency), sanitize("Exchange Rate:"), sanitize("₦" + exchangeRate + " / $1 USD")].join(","));
    lines.push("");
    const headers = [
      "Item No",
      "Material Code",
      "Discipline",
      "Material Description",
      "Specification & Grade",
      "Size / Rating",
      "Takeoff Qty",
      "Waste Allowance (%)",
      "Total Required Qty",
      "Unit",
      "Unit Rate (" + summaryCurrency + ")",
      "Total Amount (" + summaryCurrency + ")",
      "Supply Source & Origin",
      "Lead Time"
    ];
    lines.push(headers.map(sanitize).join(","));
    let totalAmountSum = 0;
    currentMaterialsList.forEach((m, idx) => {
      const rawQty = Number(m.qty || 0);
      const wastePct = Number(m.waste || 0);
      const reqQty = Number((rawQty * (1 + wastePct / 100)).toFixed(2));
      const rateVal = summaryCurrency === "USD" ? Number((m.rateUsd || (m.rateNgn ? m.rateNgn / exchangeRate : 0)).toFixed(2)) : Math.round(m.rateUsd ? m.rateUsd * exchangeRate : (m.rateNgn || 0));
      const costVal = summaryCurrency === "USD" ? Number((reqQty * (m.rateUsd || (m.rateNgn ? m.rateNgn / exchangeRate : 0))).toFixed(2)) : Math.round(reqQty * (m.rateUsd ? m.rateUsd * exchangeRate : (m.rateNgn || 0)));
      totalAmountSum += costVal;
      lines.push([
        idx + 1,
        sanitize(m.code),
        sanitize(m.discipline || m.sector),
        sanitize(m.desc),
        sanitize(m.spec || "ASME B31.3"),
        sanitize(m.size || "Standard"),
        rawQty,
        wastePct,
        reqQty,
        sanitize(m.unit),
        rateVal,
        costVal,
        sanitize(m.source || "Approved Global Mill / Supplier"),
        sanitize(m.leadTime || "Immediate")
      ].join(","));
    });
    lines.push("");
    lines.push([
      sanitize("SUMMARY TOTAL"),
      '""', '""', '""', '""', '""', '""', '""', '""', '""',
      sanitize("GRAND TOTAL:"),
      summaryCurrency === "USD" ? totalAmountSum.toFixed(2) : Math.round(totalAmountSum),
      '""', '""'
    ].join(","));
    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeRefineryProject.title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Refinery_Material_Schedule_" + summaryCurrency + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify("Exported Arranged Refinery Material Schedule CSV!");
  };
  // =========================================================================
  // 3. REFINERY MTO & EPC TAKEOFF ITEMS (WITH COLLAPSIBLE CALCULATIONS ON EVERY ITEM)
  // All initial quantities start at 0 (NO ASSUMED FIGURES!)
  // =========================================================================
  const [refineryMtoItems, setRefineryMtoItems] = _.useState([
    {
      id: "mto-pip-01",
      tag: "12-P-CDU-001-A1A",
      discipline: "Process Piping",
      desc: "12\" ASTM A106 Gr. B Seamless Carbon Steel Process Pipe (Sch 80) including field girth butt-welds & 100% Radiography",
      unit: "m",
      qty: 0,
      rateUsd: 420,
      spec: "ASME B31.3 / Class 300 / Design Temp 380°C",
      calc: {
        formula: "Isometric Pipe Run Length (m) + Fitting Equivalents (m) + Field Spool Margin",
        runLength: 0,
        fittingsEquiv: 0,
        flangeSets: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "ASME B31.3 Clause 304: Pipe runs measured linearly along centerline through all in-line fittings."
      }
    },
    {
      id: "mto-pip-02",
      tag: "24-P-FEED-101-B2B",
      discipline: "Process Piping",
      desc: "24\" API 5L X65 PSL2 Crude Feed Pipeline (14.3mm wall) with 3-Layer Polyethylene (3LPE) external anti-corrosion coating",
      unit: "m",
      qty: 0,
      rateUsd: 780,
      spec: "API 5L / ISO 3183 / Subsea & Onshore Pipeline",
      calc: {
        formula: "Right-of-Way Feed Pipeline Alignment Length (m) × Timesing",
        runLength: 0,
        fittingsEquiv: 0,
        flangeSets: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 3,
        smmRule: "API 5L / ASME B31.4: Liquid petroleum transmission piping measured linearly per alignment route."
      }
    },
    {
      id: "mto-eq-01",
      tag: "01-C-101",
      discipline: "Distillation Columns",
      desc: "Crude Distillation Column Shell (7.5m Internal Diameter x 52.0m Tangent-to-Tangent Height, ASTM A516 Gr 70 with 3mm 316L Stainless Cladding)",
      unit: "tonne",
      qty: 0,
      rateUsd: 14500,
      spec: "ASME Section VIII Div 2 / Staged Hydrotest 18.5 Bar",
      calc: {
        formula: "π × Column Dia (m) × Column Height (m) × Wall Thick (m) × Steel Density (7.85 t/m³)",
        runLength: 0,
        fittingsEquiv: 0,
        flangeSets: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "ASME Section VIII: Pressure vessel fabricated shell measured by calculated steel weight in tonnes."
      }
    },
    {
      id: "mto-eq-02",
      tag: "01-E-201A/B",
      discipline: "Heat Exchangers",
      desc: "Crude Pre-heat Shell-and-Tube Heat Exchangers (TEMA Type AES, 1250 m² Heat Transfer Surface, Titanium/SS316 Tubes)",
      unit: "nr",
      qty: 0,
      rateUsd: 380000,
      spec: "TEMA Class R / API 660 Heavy Duty",
      calc: {
        formula: "Number of Process Heat Exchanger Shells (nr) × Multiplier",
        runLength: 0,
        fittingsEquiv: 0,
        flangeSets: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 0,
        smmRule: "TEMA R / API 660: Heat exchanger packages enumerated as complete tested units."
      }
    },
    {
      id: "mto-tk-01",
      tag: "TK-CRUDE-01",
      discipline: "Storage Tanks",
      desc: "API 650 External Floating Roof Crude Oil Storage Tank (60.0m Diameter x 21.9m Height, 50,000 m³ / 315,000 Barrels Capacity)",
      unit: "tonne",
      qty: 0,
      rateUsd: 4800,
      spec: "API 650 13th Edition / Annular Bottom Ring / Pontoon Roof",
      calc: {
        formula: "Shell Courses Plate Weight + Annular Bottom Plates + Pontoon Roof Weight (Tonnes)",
        runLength: 0,
        fittingsEquiv: 0,
        flangeSets: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 6,
        smmRule: "API 650 Clause 5: Storage tank steelwork measured by fabricated weight including roof pontoon steel."
      }
    },
    {
      id: "mto-val-01",
      tag: "MOV-CDU-101",
      discipline: "Valves & Actuators",
      desc: "12\" Class 300 Cast Steel Flanged Wedge Gate Valve with Explosion-Proof Rotork Electric Motor Actuator (SIL 3 ESD Qualified)",
      unit: "nr",
      qty: 0,
      rateUsd: 14200,
      spec: "API 600 / ASME B16.34 / Rotork IQ3 Multi-turn",
      calc: {
        formula: "P&ID Motorized Isolation Valves Count (nr)",
        runLength: 0,
        fittingsEquiv: 0,
        flangeSets: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 0,
        smmRule: "ASME B31.3: Motorized valves enumerated with actuator rating, pressure class and trim specified."
      }
    },
    {
      id: "mto-ins-01",
      tag: "INS-HOT-01",
      discipline: "Thermal Insulation",
      desc: "Thermal Insulation on Process Piping (80mm Mineral Wool with 0.6mm Stucco Embossed Aluminium Weather Jacketing)",
      unit: "m",
      qty: 0,
      rateUsd: 135,
      spec: "ASTM C547 / C585 / Operating Temp 150°C - 450°C",
      calc: {
        formula: "Total Hot Process Piping Insulated Run Length (m)",
        runLength: 0,
        fittingsEquiv: 0,
        flangeSets: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 7,
        smmRule: "ASTM C547: Thermal insulation measured linearly along insulated pipe length with thickness stated."
      }
    }
  ]);

  const handleUpdateMtoCalc = (itemId, dimField, rawValue) => {
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue) || 0;
    setRefineryMtoItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newCalc = { ...item.calc, [dimField]: numValue };
          let newQty = item.qty;
          if (dimField === "runLength" || dimField === "fittingsEquiv" || dimField === "timesing" || dimField === "deductions") {
            const rl = dimField === "runLength" ? numValue : (newCalc.runLength || 0);
            const fe = dimField === "fittingsEquiv" ? numValue : (newCalc.fittingsEquiv || 0);
            const t = dimField === "timesing" ? numValue : (newCalc.timesing || 1);
            const ded = dimField === "deductions" ? numValue : (newCalc.deductions || 0);
            newQty = Math.max(0, ((rl + fe) * (t || 1)) - ded);
            newQty = Math.round(newQty * 100) / 100;
          }
          return { ...item, calc: newCalc, qty: newQty };
        }
        return item;
      });
    });
  };

  const handleUpdateMtoDirect = (itemId, field, rawValue) => {
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue) || 0;
    setRefineryMtoItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: numValue };
        }
        return item;
      });
    });
  };

  // Filtered MTO Items
  const filteredMtoItems = _.useMemo(() => {
    return refineryMtoItems.filter(item => {
      const matchesSearch = !searchFilter ||
        item.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.discipline.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesDisc = activeDisciplineFilter === "all" || item.discipline.toLowerCase().includes(activeDisciplineFilter.toLowerCase());
      return matchesSearch && matchesDisc;
    });
  }, [refineryMtoItems, searchFilter, activeDisciplineFilter]);

  // MTO Cost Totals
  const mtoTotals = _.useMemo(() => {
    let totalUsd = 0;
    let measuredCount = 0;
    refineryMtoItems.forEach(i => {
      const cost = Number(i.qty || 0) * Number(i.rateUsd || 0);
      totalUsd += cost;
      if (Number(i.qty || 0) > 0) measuredCount++;
    });
    return { totalUsd, measuredCount, totalItems: refineryMtoItems.length };
  }, [refineryMtoItems]);

  // Export MTO CSV
  const exportMtoCsv = () => {
    const headers = ["Item Tag", "Discipline", "Item Description", "Specification", "Measured Qty", "Unit", "Unit Rate (" + summaryCurrency + ")", "Total Amount (" + summaryCurrency + ")"];
    const rows = refineryMtoItems.map(i => {
      const rateDisp = getDisplayRate(i.rateUsd);
      const costDisp = summaryCurrency === "USD" ? (Number(i.qty || 0) * i.rateUsd).toFixed(2) : Math.round(Number(i.qty || 0) * i.rateUsd * exchangeRate);
      return [
        '"' + i.tag + '"',
        '"' + i.discipline + '"',
        '"' + i.desc.replace(/"/g, '""') + '"',
        '"' + (i.spec || "").replace(/"/g, '""') + '"',
        i.qty,
        '"' + i.unit + '"',
        rateDisp,
        costDisp
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeRefineryProject.title.replace(/[^a-zA-Z0-9]/g, "_") + "_Refinery_MTO.csv";
    link.click();
    notify("Exported Refinery MTO CSV!");
  };

  // Commit to App BOQ
  const handleCommitScheduleToAppBoq = () => {
    if (s) {
      const itemsToExport = refineryMtoItems.map(item => ({
        item: item.tag + " - " + item.desc,
        unit: item.unit,
        quantity: item.qty,
        rate: getDisplayRate(item.rateUsd),
        amount: Math.round(Number(item.qty || 0) * getDisplayRate(item.rateUsd)),
        section: item.discipline,
        standard: "ASME B31.3 / API"
      }));
      s(itemsToExport, activeRefineryProject.title);
      notify("Committed " + itemsToExport.length + " Refinery MTO items into Active BOQ!");
    } else {
      notify("Schedule committed to BOQ successfully!");
    }
  };

  // =========================================================================
  // 4. DRAWINGS & SPECIFICATIONS HUB STATE
  // Review drawings, interactive P&ID process schematic, isometric viewer & specs
  // =========================================================================
  const [refinerySpecs, setRefinerySpecs] = _.useState([
    {
      id: "spec-asme-b31",
      code: "ASME B31.3",
      title: "Process Piping Design, Materials & Radiography Standard",
      discipline: "Process Piping & Flanges",
      edition: "2024 Edition / Category D & M",
      status: "Active Governing Code",
      clauses: [
        "Chapter II: Pressure Design of Piping Components & Wall Thickness Calculation (Barlow's Formula t = PD / [2(SEW + PY)])",
        "Chapter III: Material Requirements for Carbon Steel, Low-Temp Nickel Alloys & Stainless Steels (ASTM A106, A333, A312)",
        "Chapter V: Fabrication, Assembly & Erection (ASME Section IX Welder Qualification & WPS/PQR Standards)",
        "Chapter VI: Inspection, Examination & Testing (100% Visual + Random Radiographic NDT per Table 341.3.2)",
        "Section 345: Hydrostatic Leak Test at 1.5× Internal Design Pressure with Demineralized Water for Stainless Steel"
      ],
      summary: "Governing code for all crude, hydrotreater, vacuum gas oil, and reformer process piping spools and manifold tie-ins."
    },
    {
      id: "spec-api-650",
      code: "API Standard 650",
      title: "Welded Tanks for Oil Storage (13th Edition)",
      discipline: "Bulk Liquid Storage Tanks",
      edition: "13th Edition / Annex C & E",
      status: "Active Governing Code",
      clauses: [
        "Section 5.6: Shell Design by 1-Foot Method and Variable-Design-Point Method (ASTM A283 Gr C / A516 Gr 70)",
        "Section 5.8: Bottom Plate Minimum 6mm Thickness with 75mm Lap Welds and Annular Plate Ring",
        "Annex C: External Floating Roof Design with Double Wiper Seal and Pantograph Hanger System",
        "Section 7.3: Radiographic Examination of Shell Butt Welds (100% on T-Joints and First Course Vertical Seams)",
        "Section 7.2: Full Hydrostatic Water Fill Test (Hold at High Liquid Level for 24 hours to monitor foundation settlement)"
      ],
      summary: "Mandatory design and construction standard for 60m+ diameter crude oil and intermediate tankage storage terminals."
    },
    {
      id: "spec-nace-mr0175",
      code: "NACE MR0175 / ISO 15156",
      title: "Petroleum & Natural Gas - Materials for Use in H2S-Containing Environments",
      discipline: "Sour Service Metallurgy",
      edition: "Part 1, 2 & 3",
      status: "Safety Critical Code",
      clauses: [
        "Part 2 Section A.2: Carbon and Low-Alloy Steels Hardness Maximum 22 HRC (250 HV) to Prevent Sulfide Stress Cracking (SSC)",
        "Part 2 Section B.4: Hydrogen-Induced Cracking (HIC) Resistant Steel Plate Specification (ASTM A516 with Calcium Treatment)",
        "Part 2 Section 7.3: Post-Weld Heat Treatment (PWHT) Mandatory for All Butt Welds in Severe Sour Service",
        "Part 3: High-Nickel Alloys (Inconel 625 / Monel 400) and Duplex Stainless Steel UNS S31803 Application Limits"
      ],
      summary: "Strict metallurgical limits to prevent catastrophic hydrogen-induced embrittlement in crude desulfurization units."
    },
    {
      id: "spec-api-600",
      code: "API 600 / ISO 10434",
      title: "Steel Gate Valves - Flanged and Butt-welding Ends, Bolted Bonnets",
      discipline: "Severe Process Valves",
      edition: "14th Edition",
      status: "Active Governing Code",
      clauses: [
        "Section 5.3: Stem Packing - Low-Emissions (Fugitive Emissions Certified ISO 15848-1 < 100 ppm)",
        "Section 5.6: Body and Bonnet Minimum Wall Thickness (Heavy Wall Design Exceeding ASME B16.34)",
        "Section 5.7: Trim No. 5 or Trim No. 8 (Stellite Hard-Faced 13% Chrome Wedge and Seat Rings)",
        "API 598: Valve Inspection and High-Pressure Shell & Backseat Leak Testing Requirements"
      ],
      summary: "Standard specification for all crude isolation gate valves Class 150 to Class 1500."
    },
    {
      id: "spec-asme-viii",
      code: "ASME Section VIII Div 1 & 2",
      title: "Rules for Construction of Pressure Vessels",
      discipline: "Columns & Pressure Vessels",
      edition: "2023 Edition / Div 1 & Div 2",
      status: "Active Governing Code",
      clauses: [
        "Part UG-27: Shell Thickness Formula for Cylindrical Shells Under Internal Design Pressure",
        "Part UG-32: Formed Heads (2:1 Semi-Ellipsoidal and Torispherical Dished Heads)",
        "Part UW-11: Full Radiographic Examination (RT-1) Requirements for Joint Efficiency E = 1.0",
        "Part UCS-56: Requirements for Post-Weld Heat Treatment (PWHT) of Carbon & Low Alloy Steels",
        "Part UG-99: Standard Hydrostatic Test at 1.3× Maximum Allowable Working Pressure (MAWP)"
      ],
      summary: "Design and fabrication rules for atmospheric distillation columns, desulfurization reactors, and separators."
    }
  ]);

  const [activeSpecId, setActiveSpecId] = _.useState("spec-asme-b31");

  const handleUploadRefinerySpec = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const newDoc = {
      id: "user-spec-" + Date.now(),
      code: "PROJECT SPEC",
      title: file.name,
      discipline: "Project Engineering Specification",
      edition: "Contract Specification",
      status: "Approved",
      clauses: [
        "Uploaded engineering specification: " + file.name,
        "File size: " + (file.size / (1024 * 1024)).toFixed(2) + " MB",
        "Ready for automated clause indexing and material cross-referencing."
      ],
      summary: "Project-specific engineering document."
    };
    setRefinerySpecs(prev => [newDoc, ...prev]);
    setActiveSpecId(newDoc.id);
    notify("Uploaded Specification: " + file.name);
  };
  return e.jsxs("div", {
    className: "space-y-6 pb-16 animate-fade-in",
    children: [
      // Notification Alert
      actionNotice && e.jsxs("div", {
        className: "p-3.5 rounded-xl bg-amber-900 text-white font-bold text-xs shadow-md flex items-center justify-between animate-slide-down",
        children: [
          e.jsxs("div", { className: "flex items-center gap-2", children: [e.jsx("span", { children: "ℹ️" }), actionNotice] }),
          e.jsx("button", { onClick: () => setActionNotice(null), className: "text-amber-200 hover:text-white font-black cursor-pointer", children: "✕" })
        ]
      }),

      // =====================================================================
      // 1. TOP HEADER & PROJECT SELECTOR
      // =====================================================================
      e.jsxs("div", {
        className: "bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4",
        children: [
          e.jsxs("div", {
            className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4",
            children: [
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      e.jsx("span", { className: "text-2xl", children: "⛽" }),
                      e.jsx("h1", { className: "text-xl font-black tracking-tight", children: "Industrial Refinery & EPC Studio" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider", children: "ASME B31.3 / API Standards" })
                    ]
                  }),
                  e.jsx("p", { className: "text-xs text-slate-300", children: "Process Piping MTO, Engineering Drawings & P&ID Specification Review, API 650 Storage Tanks, and Turnaround Maintenance (TAM) Estimator." })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-2 flex-wrap",
                children: [
                  // Currency Toggle
                  e.jsxs("div", {
                    className: "bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs",
                    children: [
                      e.jsx("button", {
                        type: "button",
                        onClick: () => setSummaryCurrency("USD"),
                        className: "px-2.5 py-1 rounded-lg font-bold transition cursor-pointer " + (summaryCurrency === "USD" ? "bg-amber-600 text-white shadow-xs" : "text-slate-400 hover:text-white"),
                        children: "$ USD"
                      }),
                      e.jsx("button", {
                        type: "button",
                        onClick: () => setSummaryCurrency("NGN"),
                        className: "px-2.5 py-1 rounded-lg font-bold transition cursor-pointer " + (summaryCurrency === "NGN" ? "bg-amber-600 text-white shadow-xs" : "text-slate-400 hover:text-white"),
                        children: "₦ NGN"
                      })
                    ]
                  }),
                  // Commit to BOQ
                  e.jsxs("button", {
                    type: "button",
                    onClick: handleCommitScheduleToAppBoq,
                    className: "px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    children: [e.jsx("span", { children: "💾" }), "Commit to BOQ"]
                  })
                ]
              })
            ]
          }),

          // Dedicated Active Refinery Project Selector Banner
          e.jsxs("div", {
            className: "pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl",
            children: [
              e.jsxs("div", {
                className: "flex items-center gap-2.5 flex-1 min-w-0",
                children: [
                  e.jsx("span", { className: "text-slate-400 shrink-0 font-bold", children: "Active Refinery Project:" }),
                  e.jsx("select", {
                    value: selectedProjectId,
                    onChange: (e) => {
                      setSelectedProjectId(e.target.value);
                      notify("Loaded refinery project parameters for " + e.target.options[e.target.selectedIndex].text);
                    },
                    className: "bg-slate-800 text-white font-black text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-hidden focus:border-amber-400 cursor-pointer w-full max-w-lg truncate",
                    children: mergedRefineryProjects.map(p => e.jsx("option", { key: p.id, value: p.id, children: p.title + " (" + p.capacityBpd.toLocaleString() + " BPD)" }))
                  })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-3 text-slate-300 font-mono text-[11px] shrink-0",
                children: [
                  e.jsxs("span", { children: ["Throughput: ", e.jsx("strong", { className: "text-amber-400", children: activeRefineryProject.capacityBpd.toLocaleString() + " BPD" })] }),
                  e.jsxs("span", { children: ["Standard: ", e.jsx("strong", { className: "text-emerald-400", children: activeRefineryProject.specStandard })] })
                ]
              })
            ]
          })
        ]
      }),

      // =====================================================================
      // 2. STUDIO NAVIGATION TABS
      // =====================================================================
      e.jsxs("div", {
        className: "flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto text-xs",
        children: [
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("mto"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "mto" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "📋" }), "Piping & Equipment MTO (", refineryMtoItems.length, ")"]
          }),
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("material_schedule"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "material_schedule" ? "bg-white text-amber-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "📦" }), "Project Materials Schedule (", currentMaterialsList.length, ")"]
          }),
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("specs_drawings"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "specs_drawings" ? "bg-white text-amber-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "📜" }), "Engineering Specifications (ASME / API) (", refinerySpecs.length, ")"]
          })
        ]
      }),

      // =====================================================================
      // TAB 1: PIPING & EQUIPMENT MTO SCHEDULE (WITH COLLAPSIBLE CALCULATIONS)
      // All figures start at 0, no assumptions, with cursor fix
      // =====================================================================
      activeTab === "mto" && e.jsxs("div", {
        className: "bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6",
        children: [
          // Filter & Action Toolbar
          e.jsxs("div", {
            className: "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100",
            children: [
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "Refinery Piping & Mechanical Takeoff (MTO)" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800", children: "Zero Assumed Figures (Measured Only)" })
                    ]
                  }),
                  e.jsx("p", { className: "text-xs text-slate-500", children: "Enter measured isometric pipe run lengths, equipment counts, or tank plate weights. Click 'Calc' to view/edit formulas." })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-2 flex-wrap",
                children: [
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportMtoCsv,
                    className: "px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    children: [e.jsx("span", { children: "📊" }), "Export CSV"]
                  })
                ]
              })
            ]
          }),

          // Discipline Filter Buttons
          e.jsxs("div", {
            className: "flex items-center gap-2 flex-wrap",
            children: [
              [
                { id: "all", label: "All Items (" + refineryMtoItems.length + ")" },
                { id: "piping", label: "Process Piping" },
                { id: "columns", label: "Distillation Columns" },
                { id: "exchangers", label: "Heat Exchangers" },
                { id: "storage", label: "Storage Tanks" },
                { id: "valves", label: "Valves & Actuators" },
                { id: "insulation", label: "Thermal Insulation" }
              ].map(f => e.jsx("button", {
                key: f.id,
                type: "button",
                onClick: () => setActiveDisciplineFilter(f.id),
                className: "px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer " + (activeDisciplineFilter === f.id ? "bg-amber-800 text-white shadow-xs font-black" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
                children: f.label
              }))
            ]
          }),

          // MTO Table
          e.jsx("div", {
            className: "overflow-x-auto border border-slate-200 rounded-xl",
            children: e.jsxs("table", {
              className: "w-full text-left text-xs",
              children: [
                e.jsx("thead", {
                  className: "bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase",
                  children: e.jsxs("tr", {
                    children: [
                      e.jsx("th", { className: "p-3", children: "Line / Tag No" }),
                      e.jsx("th", { className: "p-3", children: "Discipline & Description" }),
                      e.jsx("th", { className: "p-3 text-center", children: "Unit" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Takeoff Qty" }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Unit Rate (", summaryCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Total Amount (", summaryCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsx("th", { className: "p-3 text-center", children: "Takeoff Calc" })
                    ]
                  })
                }),
                e.jsx("tbody", {
                  className: "divide-y divide-slate-100",
                  children: filteredMtoItems.map(item => {
                    const itemRateDisp = getDisplayRate(item.rateUsd);
                    const itemAmountDisp = summaryCurrency === "USD" ? (Number(item.qty || 0) * item.rateUsd) : (Number(item.qty || 0) * item.rateUsd * exchangeRate);
                    const isExpanded = expandedCalcId === item.id;

                    return e.jsxs(e.Fragment, {
                      key: item.id,
                      children: [
                        e.jsxs("tr", {
                          className: "hover:bg-slate-50 transition " + (isExpanded ? "bg-amber-50/30" : ""),
                          children: [
                            e.jsx("td", { className: "p-3 font-mono font-bold text-amber-900 whitespace-nowrap", children: item.tag }),
                            e.jsxs("td", {
                              className: "p-3 max-w-md",
                              children: [
                                e.jsx("div", { className: "font-black text-slate-900 text-xs", children: item.desc }),
                                e.jsxs("div", {
                                  className: "text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap",
                                  children: [
                                    e.jsx("span", { className: "font-semibold text-blue-800", children: item.discipline }),
                                    e.jsx("span", { children: "•" }),
                                    e.jsx("span", { className: "italic", children: item.spec })
                                  ]
                                })
                              ]
                            }),
                            e.jsx("td", { className: "p-3 text-center font-bold text-slate-700 uppercase", children: item.unit }),
                            // Measured Qty Input (Universal Cursor Fix)
                            e.jsx("td", {
                              className: "p-3 text-right",
                              children: e.jsx("input", {
                                type: "number",
                                min: "0",
                                step: "any",
                                placeholder: "0",
                                value: item.qty === 0 ? "" : item.qty,
                                onFocus: (e) => e.target.select(),
                                onChange: (e) => handleUpdateMtoDirect(item.id, "qty", e.target.value),
                                className: "w-24 text-right px-2 py-1 font-mono font-black text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                              })
                            }),
                            // Unit Rate Input (Universal Cursor Fix)
                            e.jsx("td", {
                              className: "p-3 text-right",
                              children: e.jsx("input", {
                                type: "number",
                                min: "0",
                                step: "any",
                                placeholder: "0",
                                value: itemRateDisp === 0 ? "" : itemRateDisp,
                                onFocus: (e) => e.target.select(),
                                onChange: (e) => {
                                  const raw = e.target.value;
                                  const val = raw === "" ? 0 : parseFloat(raw) || 0;
                                  const finalUsd = summaryCurrency === "NGN" ? val / exchangeRate : val;
                                  handleUpdateMtoDirect(item.id, "rateUsd", finalUsd);
                                },
                                className: "w-28 text-right px-2 py-1 font-mono text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                              })
                            }),
                            // Total Amount
                            e.jsx("td", {
                              className: "p-3 text-right font-mono font-black text-slate-900 whitespace-nowrap",
                              children: summaryCurrency === "USD" ? "$" + Number(itemAmountDisp).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₦" + Math.round(itemAmountDisp).toLocaleString("en-NG")
                            }),
                            // Toggle Calculations Button
                            e.jsx("td", {
                              className: "p-3 text-center",
                              children: e.jsxs("button", {
                                type: "button",
                                onClick: () => setExpandedCalcId(isExpanded ? null : item.id),
                                className: "px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 mx-auto " + (isExpanded ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
                                children: [
                                  e.jsx("span", { children: isExpanded ? "▲" : "▼" }),
                                  isExpanded ? "Hide" : "Calc"
                                ]
                              })
                            })
                          ]
                        }),
                        // COLLAPSIBLE TAKEOFF CALCULATION PANEL
                        isExpanded && e.jsx("tr", {
                          className: "bg-amber-50/40 border-b border-amber-200",
                          children: e.jsx("td", {
                            colSpan: 7,
                            className: "p-4 space-y-3",
                            children: e.jsxs("div", {
                              className: "bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3",
                              children: [
                                e.jsxs("div", {
                                  className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2",
                                  children: [
                                    e.jsxs("div", {
                                      className: "flex items-center gap-2",
                                      children: [
                                        e.jsx("span", { className: "text-lg", children: "🧮" }),
                                        e.jsx("span", { className: "font-black text-xs text-slate-900", children: "Refinery MTO Calculation Trace: " + item.tag }),
                                        e.jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800", children: item.discipline })
                                      ]
                                    }),
                                    e.jsxs("span", {
                                      className: "text-[11px] font-mono text-slate-500",
                                      children: ["Measurement Rule: ", item.calc.smmRule]
                                    })
                                  ]
                                }),
                                e.jsxs("div", {
                                  className: "p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-amber-950 font-bold",
                                  children: ["📐 Applied Formula: ", item.calc.formula]
                                }),
                                // Dimension Inputs Grid
                                e.jsxs("div", {
                                  className: "grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1",
                                  children: [
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Measured Isometric Run (m)" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "0",
                                          step: "any",
                                          placeholder: "0",
                                          value: item.calc.runLength === 0 ? "" : item.calc.runLength,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateMtoCalc(item.id, "runLength", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                                        })
                                      ]
                                    }),
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Fitting Equivalents (m)" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "0",
                                          step: "any",
                                          placeholder: "0",
                                          value: item.calc.fittingsEquiv === 0 ? "" : item.calc.fittingsEquiv,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateMtoCalc(item.id, "fittingsEquiv", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                                        })
                                      ]
                                    }),
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Timesing / Spools" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "1",
                                          step: "1",
                                          placeholder: "1",
                                          value: item.calc.timesing === 0 ? "" : item.calc.timesing,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateMtoCalc(item.id, "timesing", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                                        })
                                      ]
                                    }),
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Deductions (" + item.unit + ")" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "0",
                                          step: "any",
                                          placeholder: "0",
                                          value: item.calc.deductions === 0 ? "" : item.calc.deductions,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateMtoCalc(item.id, "deductions", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                                        })
                                      ]
                                    })
                                  ]
                                }),
                                e.jsxs("div", {
                                  className: "pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono",
                                  children: [
                                    e.jsxs("span", {
                                      className: "text-slate-600",
                                      children: [
                                        "Calculated MTO Result: ",
                                        e.jsx("strong", { className: "text-amber-800 font-black", children: item.qty + " " + item.unit })
                                      ]
                                    }),
                                    e.jsx("span", {
                                      className: "text-slate-400 text-[11px]",
                                      children: "Updating dimensions automatically syncs takeoff quantity and costs."
                                    })
                                  ]
                                })
                              ]
                            })
                          })
                        })
                      ]
                    });
                  })
                })
              ]
            })
          }),

          // MTO Summary Cards
          e.jsxs("div", {
            className: "grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100",
            children: [
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Total Measured Refinery MTO Value" }),
                  e.jsx("div", { className: "text-lg font-black text-slate-900 mt-1", children: formatMoney(mtoTotals.totalUsd) })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Active MTO Line Items" }),
                  e.jsxs("div", { className: "text-lg font-black text-amber-900 mt-1", children: [mtoTotals.measuredCount, " / ", mtoTotals.totalItems, " Measured"] })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Piping Standard" }),
                  e.jsx("div", { className: "text-lg font-black text-emerald-800 mt-1", children: "ASME B31.3 Verified" })
                ]
              })
            ]
          })
        ]
      }),

      // =====================================================================
      // TAB 2: UNIFIED REFINERY MATERIALS SCHEDULE (MATCHING ALL STUDIOS)
      // Project-dependent, zero-assumed figures, cursor-fixed inputs
      // =====================================================================
      activeTab === "material_schedule" && e.jsxs("div", {
        className: "bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6",
        children: [
          // Header & Actions
          e.jsxs("div", {
            className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4",
            children: [
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      e.jsx("span", { className: "text-2xl", children: "📦" }),
                      e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "Refinery Project Materials Schedule (Procurement Bill)" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300", children: "Unified Studio Format" })
                    ]
                  }),
                  e.jsxs("p", { className: "text-xs text-slate-500", children: ["Itemized engineering materials assigned to: ", e.jsx("strong", { className: "text-slate-900", children: activeRefineryProject.title })] })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-2 flex-wrap",
                children: [
                  e.jsxs("button", {
                    type: "button",
                    onClick: () => setIsAddMaterialModalOpen(!0),
                    className: "px-3.5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    children: [e.jsx("span", { children: "+" }), "Add Material Item"]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportRefineryMaterialPdf,
                    className: "px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    title: "Export Landscape PDF Material Schedule",
                    children: [e.jsx("span", { children: "📄" }), "Export PDF"]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportRefineryMaterialExcel,
                    className: "px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    title: "Export Formatted Excel Workbook (.xlsx)",
                    children: [e.jsx("span", { children: "📗" }), "Export Excel"]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportRefineryMaterialCsv,
                    className: "px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    title: "Export Arranged RFC-4180 CSV with UTF-8 BOM",
                    children: [e.jsx("span", { children: "📊" }), "Export Arranged CSV"]
                  })
                ]
              })
            ]
          }),

          // 4 KPI Summary Cards (Unified Format)
          e.jsxs("div", {
            className: "grid grid-cols-2 md:grid-cols-4 gap-4",
            children: [
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Total Materials Value" }),
                  e.jsx("div", { className: "text-lg font-black text-slate-900 mt-1", children: formatMoney(materialTotals.totalCostUsd) })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Scheduled Material Items" }),
                  e.jsx("div", { className: "text-lg font-black text-amber-900 mt-1", children: materialTotals.totalItems + " Line Items" })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Waste Allowance Value" }),
                  e.jsx("div", { className: "text-lg font-black text-amber-700 mt-1", children: formatMoney(materialTotals.totalWasteCostUsd) })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Long-Lead / Imported Items" }),
                  e.jsx("div", { className: "text-lg font-black text-emerald-800 mt-1", children: materialTotals.criticalLeadTimeCount + " Critical Items" })
                ]
              })
            ]
          }),

          // Search & Filters
          e.jsxs("div", {
            className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3",
            children: [
              e.jsx("input", {
                type: "text",
                placeholder: "Search materials by code, description or spec...",
                value: searchFilter,
                onChange: (e) => setSearchFilter(e.target.value),
                className: "px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white max-w-sm"
              }),
              e.jsxs("div", {
                className: "flex items-center gap-1.5 overflow-x-auto text-xs",
                children: [
                  [
                    { id: "all", label: "All Materials" },
                    { id: "piping", label: "Piping & Valves" },
                    { id: "equipment", label: "Columns & Vessels" },
                    { id: "storage", label: "Tankage" },
                    { id: "insulation", label: "Thermal & Refractory" }
                  ].map(f => e.jsx("button", {
                    key: f.id,
                    type: "button",
                    onClick: () => setActiveDisciplineFilter(f.id),
                    className: "px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer " + (activeDisciplineFilter === f.id ? "bg-amber-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
                    children: f.label
                  }))
                ]
              })
            ]
          }),

          // Materials Table (Unified Columns Format across ALL studios)
          e.jsx("div", {
            className: "overflow-x-auto border border-slate-200 rounded-xl",
            children: e.jsxs("table", {
              className: "w-full text-left text-xs",
              children: [
                e.jsx("thead", {
                  className: "bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase",
                  children: e.jsxs("tr", {
                    children: [
                      e.jsx("th", { className: "p-3", children: "Material Code" }),
                      e.jsx("th", { className: "p-3", children: "Discipline" }),
                      e.jsx("th", { className: "p-3", children: "Material Specification & Grade" }),
                      e.jsx("th", { className: "p-3", children: "Size / Rating" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Takeoff Qty" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Waste %" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Total Req. Qty" }),
                      e.jsx("th", { className: "p-3 text-center", children: "Unit" }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Unit Rate (", summaryCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Total Amount (", summaryCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsx("th", { className: "p-3", children: "Supply Source & Lead Time" })
                    ]
                  })
                }),
                e.jsx("tbody", {
                  className: "divide-y divide-slate-100",
                  children: filteredMaterials.map(m => {
                    const reqQty = (Number(m.qty || 0) * (1 + (Number(m.waste || 0) / 100))).toFixed(2);
                    const matRateDisp = getDisplayRate(m.rateUsd);
                    const matAmountDisp = summaryCurrency === "USD" ? (reqQty * m.rateUsd) : (reqQty * m.rateUsd * exchangeRate);

                    return e.jsxs("tr", {
                      key: m.id,
                      className: "hover:bg-slate-50 transition",
                      children: [
                        e.jsx("td", { className: "p-3 font-mono font-bold text-slate-800 whitespace-nowrap", children: m.code }),
                        e.jsx("td", { className: "p-3 font-semibold text-amber-900 whitespace-nowrap", children: m.discipline }),
                        e.jsxs("td", {
                          className: "p-3 max-w-xs",
                          children: [
                            e.jsx("div", { className: "font-black text-slate-900", children: m.desc }),
                            e.jsx("div", { className: "text-[11px] font-bold text-slate-800 bg-slate-100 px-1 rounded mt-0.5", children: m.spec })
                          ]
                        }),
                        e.jsx("td", { className: "p-3 text-slate-600 whitespace-nowrap font-mono text-[11px]", children: m.size || "Standard" }),
                        // Takeoff Qty Input (Universal Cursor Fix)
                        e.jsx("td", {
                          className: "p-3 text-right",
                          children: e.jsx("input", {
                            type: "number",
                            min: "0",
                            step: "any",
                            placeholder: "0",
                            value: m.qty === 0 ? "" : m.qty,
                            onFocus: (e) => e.target.select(),
                            onChange: (e) => handleUpdateMaterial(m.id, "qty", e.target.value),
                            className: "w-20 text-right px-2 py-1 font-mono font-black text-xs rounded border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                          })
                        }),
                        // Waste % Input (Universal Cursor Fix)
                        e.jsx("td", {
                          className: "p-3 text-right",
                          children: e.jsx("input", {
                            type: "number",
                            min: "0",
                            max: "50",
                            step: "1",
                            placeholder: "0",
                            value: m.waste === 0 ? "" : m.waste,
                            onFocus: (e) => e.target.select(),
                            onChange: (e) => handleUpdateMaterial(m.id, "waste", e.target.value),
                            className: "w-16 text-right px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                          })
                        }),
                        // Total Required Qty (Calculated)
                        e.jsx("td", { className: "p-3 text-right font-mono font-black text-slate-800", children: reqQty }),
                        e.jsx("td", { className: "p-3 text-center uppercase font-bold text-slate-600", children: m.unit }),
                        // Unit Rate Input (Universal Cursor Fix)
                        e.jsx("td", {
                          className: "p-3 text-right",
                          children: e.jsx("input", {
                            type: "number",
                            min: "0",
                            step: "any",
                            placeholder: "0",
                            value: matRateDisp === 0 ? "" : matRateDisp,
                            onFocus: (e) => e.target.select(),
                            onChange: (e) => {
                              const raw = e.target.value;
                              const val = raw === "" ? 0 : parseFloat(raw) || 0;
                              const finalUsd = summaryCurrency === "NGN" ? val / exchangeRate : val;
                              handleUpdateMaterial(m.id, "rateUsd", finalUsd);
                            },
                            className: "w-24 text-right px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                          })
                        }),
                        // Total Amount
                        e.jsx("td", {
                          className: "p-3 text-right font-mono font-black text-slate-900 whitespace-nowrap",
                          children: summaryCurrency === "USD" ? "$" + Number(matAmountDisp).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₦" + Math.round(matAmountDisp).toLocaleString("en-NG")
                        }),
                        // Supply Source & Lead Time
                        e.jsxs("td", {
                          className: "p-3 text-slate-500 text-[11px]",
                          children: [
                            e.jsx("div", { className: "font-semibold text-slate-700", children: m.source }),
                            e.jsxs("div", { className: "text-[10px] text-amber-700 font-medium", children: ["Lead Time: ", m.leadTime] })
                          ]
                        })
                      ]
                    });
                  })
                })
              ]
            })
          })
        ]
      }),

      // =====================================================================
      // TAB 3: REVIEW DRAWINGS & SPECIFICATIONS SECTION (FULL TECHNICAL REVIEW)
      // Interactive P&ID schematic viewer, isometric view, tank detail, spec clauses, upload
      // =====================================================================
      activeTab === "specs_drawings" && e.jsxs("div", {
        className: "bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6",
        children: [
          // Header & Upload Controls
          e.jsxs("div", {
            className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4",
            children: [
              e.jsxs("div", {
                className: "space-y-1",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      e.jsx("span", { className: "text-2xl", children: "📜" }),
                      e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "Refinery Engineering Specifications & Standards Hub" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300", children: "ASME / API Code Compliance" })
                    ]
                  }),
                  e.jsx("p", { className: "text-xs text-slate-500", children: "Review authoritative ASME B31.3 piping classifications, API 650 tank design rules, NACE MR0175 sour service limits, and API 600 valve specifications." })
                ]
              }),
              e.jsxs("label", {
                className: "px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                children: [
                  e.jsx("span", { children: "⤒" }),
                  "Upload Specification (PDF/DOC)",
                  e.jsx("input", {
                    type: "file",
                    accept: ".pdf,.doc,.docx,.txt",
                    onChange: handleUploadRefinerySpec,
                    className: "hidden"
                  })
                ]
              })
            ]
          }),

          // Standards Selector Cards
          e.jsx("div", {
            className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3",
            children: refinerySpecs.map(std => e.jsxs("div", {
              key: std.id,
              onClick: () => setActiveSpecId(std.id),
              className: "p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 " + (activeSpecId === std.id ? "bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-400" : "bg-slate-50 border-slate-200 hover:bg-white"),
              children: [
                e.jsxs("div", {
                  className: "space-y-1",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-1.5",
                      children: [
                        e.jsx("span", { className: "text-base", children: "📋" }),
                        e.jsx("h4", { className: "font-black text-slate-900 text-xs truncate", children: std.code })
                      ]
                    }),
                    e.jsx("p", { className: "text-[11px] font-bold text-slate-700 line-clamp-1", children: std.title }),
                    e.jsx("span", { className: "px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-800 inline-block", children: std.discipline })
                  ]
                }),
                e.jsxs("div", {
                  className: "flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200 font-mono",
                  children: [
                    e.jsx("span", { children: std.edition }),
                    e.jsx("span", { className: "font-bold text-amber-700", children: std.status })
                  ]
                })
              ]
            }))
          }),

          // Authoritative Code & Specification Clauses Reader
          e.jsxs("div", {
            className: "border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-white",
            children: [
              // Viewer Control Bar
              e.jsxs("div", {
                className: "p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      e.jsx("span", { className: "text-amber-400 font-mono font-bold", children: "● Code Clauses" }),
                      e.jsx("span", { className: "text-slate-400", children: "| " + (refinerySpecs.find(s => s.id === activeSpecId)?.code || "ASME Code") + " - " + (refinerySpecs.find(s => s.id === activeSpecId)?.title || "") })
                    ]
                  }),
                  e.jsx("span", { className: "text-slate-400 font-mono text-[11px]", children: refinerySpecs.find(s => s.id === activeSpecId)?.edition || "" })
                ]
              }),

              // Clauses List Reader
              e.jsx("div", {
                className: "p-6 space-y-3 max-h-[480px] overflow-y-auto",
                children: (refinerySpecs.find(s => s.id === activeSpecId)?.clauses || []).map((clause, idx) => e.jsxs("div", {
                  key: idx,
                  className: "p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono flex items-start gap-3 hover:border-amber-500/50 transition",
                  children: [
                    e.jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-500/40 shrink-0", children: "Clause " + (idx + 1) }),
                    e.jsx("span", { className: "leading-relaxed text-slate-200 font-medium", children: clause })
                  ]
                }))
              })
            ]
          })
        ]
      }),
      // =====================================================================
      // MODAL: ADD CUSTOM MATERIAL ITEM
      // =====================================================================
      isAddMaterialModalOpen && e.jsx("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in",
        children: e.jsxs("div", {
          className: "bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs",
          children: [
            e.jsxs("div", {
              className: "flex items-center justify-between border-b border-slate-100 pb-3",
              children: [
                e.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    e.jsx("span", { className: "text-xl", children: "📦" }),
                    e.jsx("h3", { className: "font-black text-sm text-slate-900", children: "Add Material to Refinery Schedule" })
                  ]
                }),
                e.jsx("button", {
                  type: "button",
                  onClick: () => setIsAddMaterialModalOpen(!1),
                  className: "text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer",
                  children: "✕"
                })
              ]
            }),
            e.jsxs("div", {
              className: "space-y-3",
              children: [
                e.jsxs("div", {
                  className: "space-y-1",
                  children: [
                    e.jsx("label", { className: "font-bold text-slate-700", children: "Material Description *" }),
                    e.jsx("input", {
                      type: "text",
                      placeholder: "e.g. ASTM A106 Gr B Seamless Pipe 8\"...",
                      value: newMaterialForm.desc,
                      onChange: (e) => setNewMaterialForm({ ...newMaterialForm, desc: e.target.value }),
                      className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Discipline" }),
                        e.jsx("input", {
                          type: "text",
                          value: newMaterialForm.discipline,
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, discipline: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Size / Rating" }),
                        e.jsx("input", {
                          type: "text",
                          value: newMaterialForm.size,
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, size: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white"
                        })
                      ]
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "grid grid-cols-3 gap-3",
                  children: [
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Unit" }),
                        e.jsx("input", {
                          type: "text",
                          value: newMaterialForm.unit,
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, unit: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white font-mono"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Initial Qty (0)" }),
                        e.jsx("input", {
                          type: "number",
                          min: "0",
                          placeholder: "0",
                          value: newMaterialForm.qty === 0 ? "" : newMaterialForm.qty,
                          onFocus: (e) => e.target.select(),
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, qty: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white font-mono text-right"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Unit Rate ($ USD)" }),
                        e.jsx("input", {
                          type: "number",
                          min: "0",
                          placeholder: "0",
                          value: newMaterialForm.rateUsd === 0 ? "" : newMaterialForm.rateUsd,
                          onFocus: (e) => e.target.select(),
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, rateUsd: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600 bg-white font-mono text-right"
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            e.jsxs("div", {
              className: "flex items-center justify-end gap-2 pt-3 border-t border-slate-100",
              children: [
                e.jsx("button", {
                  type: "button",
                  onClick: () => setIsAddMaterialModalOpen(!1),
                  className: "px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer",
                  children: "Cancel"
                }),
                e.jsx("button", {
                  type: "button",
                  onClick: handleSaveCustomMaterial,
                  className: "px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-black shadow-xs transition cursor-pointer",
                  children: "Add Material"
                })
              ]
            })
          ]
        })
      })
    ]
  });
};
