const CivilWorksFullStudio = ({ activeProject, projects = [], onCommitToBoq, onNavigate }) => {
  // 1. Projects State: Defaults to Lekki-Epe Dual Carriageway with instant switching
  const defaultCivilProjects = [
    {
      id: "lekki_dual_carriageway",
      title: "Lekki-Epe Expressway Dual Carriageway (4-Lane with Concrete Median & Drainage)",
      type: "Dual Carriageway",
      location: "Lekki-Epe Corridor, Lagos State",
      smmStandard: "CESMM4 / FMW&H Volume 1",
      lengthKm: 18.5,
      carriagewayWidthM: 14.6,
      pavementType: "Heavy-Duty Flexible Asphalt (50mm Wearing + 60mm Binder)",
      client: "Federal Ministry of Works / Lagos State MOT"
    },
    {
      id: "federal_highway_trunk_a",
      title: "Federal Highway Trunk A (Flexible Asphalt Pavement & Culverts)",
      type: "Federal Highway",
      location: "Abuja - Lokoja Trunk A2 Corridor",
      smmStandard: "CESMM4 / FMW&H",
      lengthKm: 42.0,
      carriagewayWidthM: 7.3,
      pavementType: "Flexible Pavement with Crushed Rock Base",
      client: "Federal Ministry of Works"
    },
    {
      id: "third_mainland_bridge",
      title: "Third Mainland Lagoon Flyover & Post-Tensioned RC Bridge",
      type: "Bridge & Flyover",
      location: "Lagos Lagoon Marine Sector",
      smmStandard: "CESMM4 Class G & K / BS 5400",
      lengthKm: 11.8,
      carriagewayWidthM: 18.0,
      pavementType: "Post-Tensioned Concrete Box Girders & Epoxy Pavement",
      client: "Federal Ministry of Works / FERMA"
    },
    {
      id: "aso_transit_tunnel",
      title: "Aso Mountain Railway & Transit Tunnel (Segmental Concrete Lining)",
      type: "Tunnel & Underground",
      location: "Abuja Transit Rail Link",
      smmStandard: "CESMM4 Class T (Tunnels) / CIRIA",
      lengthKm: 4.2,
      carriagewayWidthM: 8.5,
      pavementType: "Precast Concrete Segmental Ring Lining with Concrete Slab Track",
      client: "Federal Capital Development Authority (FCDA)"
    },
    {
      id: "civil_preliminaries_site",
      title: "Civil Engineering Preliminaries, Camp Mobilization & Quality Control",
      type: "Preliminaries & General Items",
      location: "National Civil Works Projects",
      smmStandard: "CESMM4 Class A (General Items)",
      lengthKm: 0,
      carriagewayWidthM: 0,
      pavementType: "Site Operations & Geotechnical Testing",
      client: "Civil Engineering Contractors"
    }
  ];

  // Merge with any projects passed from parent that match civil keywords
  const mergedCivilProjects = _.useMemo(() => {
    const list = [...defaultCivilProjects];
    if (projects && projects.length > 0) {
      projects.forEach(p => {
        const title = (p.title || p.name || "").toLowerCase();
        const type = (p.project_type || p.type || "").toLowerCase();
        if (title.includes("road") || title.includes("highway") || title.includes("bridge") || title.includes("tunnel") || title.includes("civil") || title.includes("carriageway") || type.includes("civil") || type.includes("infrastructure")) {
          if (!list.find(item => item.id === p.id)) {
            list.push({
              id: p.id,
              title: p.title || p.name,
              type: "Civil Infrastructure",
              location: p.location || "Nigeria",
              smmStandard: "CESMM4",
              lengthKm: 10,
              carriagewayWidthM: 7.3,
              pavementType: "Flexible / Rigid",
              client: p.client_name || "Infrastructure Client"
            });
          }
        }
      });
    }
    return list;
  }, [projects]);

  const [selectedProjectId, setSelectedProjectId] = _.useState("lekki_dual_carriageway");
  const activeCivilProject = _.useMemo(() => {
    return mergedCivilProjects.find(p => p.id === selectedProjectId) || mergedCivilProjects[0];
  }, [mergedCivilProjects, selectedProjectId]);

  // Currency & Exchange
  const [civilCurrency, setCivilCurrency] = _.useState("NGN"); // "NGN" | "USD"
  const [exchangeRate, setExchangeRate] = _.useState(1550);

  // Tab Navigation
  const [activeTab, setActiveTab] = _.useState("schedule"); // "schedule", "material_schedule", "specifications", "mass_haul", "equipment_rates", "pavement_design", "methodology"
  const [searchFilter, setSearchFilter] = _.useState("");
  const [activeSectorFilter, setActiveSectorFilter] = _.useState("all");
  const [actionNotice, setActionNotice] = _.useState(null);

  // Takeoff Calculations Expansion state (tracks expanded row)
  const [expandedCalcId, setExpandedCalcId] = _.useState(null);

  // Notice helper
  const notify = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Helper formatter for money
  const formatMoney = (amountNgn) => {
    if (amountNgn == null || isNaN(amountNgn)) return civilCurrency === "USD" ? "$0.00" : "₦0";
    if (civilCurrency === "USD") {
      const usdVal = Number(amountNgn) / exchangeRate;
      return "$" + Number(usdVal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      return "₦" + Math.round(Number(amountNgn)).toLocaleString("en-NG");
    }
  };

  // Convert rate for display
  const getDisplayRate = (rateNgn) => {
    if (civilCurrency === "USD") {
      return (Number(rateNgn) / exchangeRate).toFixed(2);
    }
    return Number(rateNgn);
  };

  // =========================================================================
  // 2. PROJECT-DEPENDENT MATERIALS SCHEDULE (UNIFIED ACROSS ALL STUDIOS)
  // All initial quantities start at 0 (NO ASSUMED FIGURES!)
  // =========================================================================
  const initialMaterialsDatabase = {
    lekki_dual_carriageway: [
      { id: "mat-lek-01", code: "MAT-CIV-01", sector: "Pavement & Asphalt", desc: "Asphaltic Concrete Wearing Course (Hot Rolled Asphalt 0-14mm)", spec: "FMW Clause 502 / Marshall Stability > 9kN", size: "50mm Compacted Layer", qty: 0, waste: 5, unit: "m³", rateNgn: 185000, source: "Julius Berger Batching Plant (Lagos)", leadTime: "Immediate (24 hrs)" },
      { id: "mat-lek-02", code: "MAT-CIV-02", sector: "Pavement & Asphalt", desc: "Asphaltic Concrete Binder Course (Dense Bituminous Macadam 0-20mm)", spec: "FMW Clause 501 / 60/70 Pen Bitumen", size: "60mm Compacted Layer", qty: 0, waste: 5, unit: "m³", rateNgn: 172000, source: "Reynolds Construction Quarry (Sagamu)", leadTime: "Immediate (24 hrs)" },
      { id: "mat-lek-03", code: "MAT-CIV-03", sector: "Pavement & Asphalt", desc: "Crushed Granite Stone Base (Graded Crushed Rock 0-40mm CBR > 80%)", spec: "FMW Clause 402 / Hard Blue Granite", size: "150mm Graded Thickness", qty: 0, waste: 7, unit: "m³", rateNgn: 34000, source: "Abeokuta Granite Quarry Hub", leadTime: "2-3 Days" },
      { id: "mat-lek-04", code: "MAT-CIV-04", sector: "Earthworks & Sub-base", desc: "Selected Natural Lateritic Gravel Sub-base (CBR > 30% PI < 12)", spec: "FMW Clause 401 / 95% AASHTO T-180", size: "200mm Layer", qty: 0, waste: 8, unit: "m³", rateNgn: 16500, source: "Epe Laterite Borrow Pit", leadTime: "1-2 Days" },
      { id: "mat-lek-05", code: "MAT-CIV-05", sector: "Bitumen & Primers", desc: "Cut-back Bitumen Prime Coat (Rapid-curing MC-30 grade bitumen emulsion)", spec: "FMW Clause 503 / 1.1 L/m² Application", size: "200-Litre Drums", qty: 0, waste: 3, unit: "Litre", rateNgn: 1650, source: "TotalEnergies Bitumen Terminal (Apapa)", leadTime: "2-4 Days" },
      { id: "mat-lek-06", code: "MAT-CIV-06", sector: "Road Safety & Markings", desc: "Thermoplastic Reflective Road Marking Paint with Drop-on Glass Beads", spec: "BS 3262 Class A / White & Yellow (2.5mm)", size: "25kg Bags Premix", qty: 0, waste: 5, unit: "m²", rateNgn: 9200, source: "Berger Paints Nigeria Plc", leadTime: "Immediate" },
      { id: "mat-lek-07", code: "MAT-CIV-07", sector: "Road Safety & Markings", desc: "Corrugated W-Beam Galvanized Steel Crash Barrier Guardrail & Posts", spec: "AASHTO M-180 Class A / 550g/m² Zinc", size: "3.81m Effective Length", qty: 0, waste: 2, unit: "m", rateNgn: 48500, source: "Midwestern Steel Mill", leadTime: "5-7 Days" },
      { id: "mat-lek-08", code: "MAT-CIV-08", sector: "Drainage & Precast", desc: "Precast Concrete Pipe Culverts (900mm Internal Diameter, Spigot & Socket)", spec: "BS 5911 Class 4 Reinforced Concrete", size: "900mm ID x 1.25m L", qty: 0, waste: 3, unit: "nr", rateNgn: 98000, source: "Lafarge Precast Yard (Ewekoro)", leadTime: "3-5 Days" },
      { id: "mat-lek-09", code: "MAT-CIV-09", sector: "Geotextiles", desc: "Non-Woven Needle-Punched Polypropylene Geotextile Membrane Separator", spec: "CBR Puncture > 2500N / Class 1 Filter", size: "200 g/m² (Roll 4m x 100m)", qty: 0, waste: 6, unit: "m²", rateNgn: 3400, source: "Polyfab Geosynthetics (Ikeja)", leadTime: "Immediate" },
      { id: "mat-lek-10", code: "MAT-CIV-10", sector: "Drainage & Precast", desc: "Hydraulically Pressed Concrete Road Kerbs & Channels with Interlocking Joints", spec: "BS 7263 / Compressive Strength 30 N/mm²", size: "125 x 250 x 914mm", qty: 0, waste: 4, unit: "m", rateNgn: 14500, source: "Precast Concrete Industries (Oregun)", leadTime: "2 Days" }
    ],
    federal_highway_trunk_a: [
      { id: "mat-fed-01", code: "MAT-CIV-01", sector: "Pavement & Asphalt", desc: "Heavy Duty Asphalt Concrete Wearing Course (0-14mm wearing course)", spec: "FMW Clause 502 / Marshall Flow 2-4mm", size: "50mm Thickness", qty: 0, waste: 5, unit: "m³", rateNgn: 182000, source: "Dantata & Sawoe Plant (Abuja)", leadTime: "Immediate (24 hrs)" },
      { id: "mat-fed-02", code: "MAT-CIV-02", sector: "Pavement & Asphalt", desc: "Dense Bituminous Macadam Basecourse (DBM 0-28mm)", spec: "FMW Clause 501 / 60/70 Pen", size: "80mm Thickness", qty: 0, waste: 5, unit: "m³", rateNgn: 168000, source: "Dantata & Sawoe Plant (Abuja)", leadTime: "Immediate (24 hrs)" },
      { id: "mat-fed-03", code: "MAT-CIV-03", sector: "Pavement & Asphalt", desc: "Crushed Stone Macadam Base Course (Graded 0-40mm)", spec: "FMW Clause 402 / Crushing Value < 25%", size: "150mm Layer", qty: 0, waste: 7, unit: "m³", rateNgn: 32000, source: "Mpape Granite Quarry (Abuja)", leadTime: "1-2 Days" },
      { id: "mat-fed-04", code: "MAT-CIV-04", sector: "Earthworks & Sub-base", desc: "Natural Selected Laterite Sub-base Gravel", spec: "CBR > 30% / Compaction 98% MDD", size: "200mm Layer", qty: 0, waste: 8, unit: "m³", rateNgn: 14500, source: "Kwali Laterite Quarry", leadTime: "Immediate" },
      { id: "mat-fed-05", code: "MAT-CIV-05", sector: "Drainage & Precast", desc: "Reinforced Concrete Box Culvert (Single Cell 2.0m x 2.0m in situ)", spec: "Grade C30/37 Concrete / BS 8110", size: "2.0m x 2.0m Cell", qty: 0, waste: 4, unit: "m", rateNgn: 320000, source: "On-site Batching Setup", leadTime: "3-5 Days" },
      { id: "mat-fed-06", code: "MAT-CIV-06", sector: "Road Safety & Markings", desc: "Retroreflective Aluminium Road Direction & Warning Signs (Class 2 Microprismatic)", spec: "FMW Traffic Signs Manual / 3mm Alum Sheet", size: "600mm x 600mm Triangles & Octagons", qty: 0, waste: 2, unit: "nr", rateNgn: 78000, source: "Signage Tech (Abuja)", leadTime: "3-5 Days" },
      { id: "mat-fed-07", code: "MAT-CIV-07", sector: "Bitumen & Primers", desc: "Cationic Bitumen Emulsion Tack Coat K1-40", spec: "FMW Clause 504 / 0.5 L/m²", size: "200-Litre Drums", qty: 0, waste: 3, unit: "Litre", rateNgn: 1550, source: "Conoil Bitumen Hub (Kaduna)", leadTime: "2 Days" }
    ],
    third_mainland_bridge: [
      { id: "mat-brg-01", code: "MAT-BRG-01", sector: "Prestressed Concrete", desc: "High-Tensile 7-Wire Low-Relaxation Prestressing Steel Strands", spec: "ASTM A416 Grade 270 / Tensile 1860 MPa", size: "15.2mm Diameter (0.6 inch)", qty: 0, waste: 4, unit: "tonne", rateNgn: 2450000, source: "Freyssinet International Import / Port Harcourt", leadTime: "2-3 Weeks" },
      { id: "mat-brg-02", code: "MAT-BRG-02", sector: "Structural Concrete", desc: "Ready-Mix High-Performance Marine Concrete Grade C40/50 with Micro-Silica", spec: "BS EN 206 / Chloride Resistant Sulfate Resisting", size: "Slump 150-180mm with Superplasticizer", qty: 0, waste: 5, unit: "m³", rateNgn: 198000, source: "Lafarge Ready-Mix Plant (Oshodi/Apapa)", leadTime: "Immediate (48 hrs)" },
      { id: "mat-brg-03", code: "MAT-BRG-03", sector: "Structural Steel & Rebar", desc: "High-Yield Deformed Steel Reinforcement Bars (Grade 460B - Y25 & Y32)", spec: "BS 4449 / Carbon Equivalent < 0.42", size: "Y25 and Y32 (12m Standard Lengths)", qty: 0, waste: 5, unit: "tonne", rateNgn: 1580000, source: "SMC / Prism Steel Mills (Ikorodu)", leadTime: "Immediate" },
      { id: "mat-brg-04", code: "MAT-BRG-04", sector: "Bearings & Joints", desc: "Laminated Elastomeric Neoprene Bridge Bearings with Internal Steel Shims", spec: "BS 5400 Part 9 / AASHTO M251", size: "400 x 500 x 84mm (Vertical Load 3,500 kN)", qty: 0, waste: 0, unit: "nr", rateNgn: 420000, source: "Trelleborg / Maurer Bridge Bearings (Import)", leadTime: "4 Weeks" },
      { id: "mat-brg-05", code: "MAT-BRG-05", sector: "Bearings & Joints", desc: "Modular Finger / Comb Bridge Expansion Joints with Continuous Rubber Trough", spec: "BS 5400 / 120mm Total Movement Capability", size: "Heavy-Duty Cast Steel Teeth", qty: 0, waste: 0, unit: "m", rateNgn: 680000, source: "Mageba Bridge Systems", leadTime: "4-6 Weeks" },
      { id: "mat-brg-06", code: "MAT-BRG-06", sector: "Bridge Parapets", desc: "Galvanized High-Containment Parapet Crash Barriers (Class H2 / H4a)", spec: "BS 6779 Part 1 / 4-Rail Steel Parapet", size: "Height 1.50m (Marine Bridge Spec)", qty: 0, waste: 2, unit: "m", rateNgn: 145000, source: "Corus Parapets UK / Local Fabricator", leadTime: "2-3 Weeks" },
      { id: "mat-brg-07", code: "MAT-BRG-07", sector: "Waterproofing", desc: "Spray-Applied Seamless Polyurethane Bridge Deck Waterproofing Membrane", spec: "BBA Certified / Elongation > 300% / Tensile > 8MPa", size: "2.0mm Thickness Spray Coat", qty: 0, waste: 6, unit: "m²", rateNgn: 18500, source: "Sika Nigeria Ltd (Ikeja)", leadTime: "3-5 Days" }
    ],
    aso_transit_tunnel: [
      { id: "mat-tun-01", code: "MAT-TUN-01", sector: "Tunnel Linings", desc: "Precast Steel-Fibre Reinforced Concrete (SFRC) Segmental Tunnel Lining Rings", spec: "Grade C50/60 SFRC / BS EN 14487", size: "Universal Ring 6+1 Segments (ID 6.0m x 1.5m L)", qty: 0, waste: 2, unit: "nr", rateNgn: 3850000, source: "Dedicated TBM Precast Carousel (Abuja)", leadTime: "1-2 Weeks" },
      { id: "mat-tun-02", code: "MAT-TUN-02", sector: "Waterproofing & Seals", desc: "EPDM Elastomeric Compression Gasket Seals for Segmental Ring Joints", spec: "STUVA Tested / Water Tightness to 5.0 Bar", size: "Profile 33mm x 19mm with Corner Anchors", qty: 0, waste: 3, unit: "m", rateNgn: 24500, source: "Phoenix / Datwyler Tunnel Gaskets", leadTime: "3 Weeks" },
      { id: "mat-tun-03", code: "MAT-TUN-03", sector: "Ground Support", desc: "High-Strength B500B Fully-Grouted Deformed Rock Bolts with Domed Bearing Plates", spec: "Tensile Yield 500 N/mm² / Fast Resin Capsule Setting", size: "25mm Diameter x 4.0m Length", qty: 0, waste: 5, unit: "nr", rateNgn: 42000, source: "Atlas Copco / Epiroc Ground Support", leadTime: "1-2 Weeks" },
      { id: "mat-tun-04", code: "MAT-TUN-04", sector: "Shotcrete & Sprayed Concrete", desc: "Silica-Fume Wet-Mix Sprayed Concrete (Shotcrete Grade C35/45) with Steel Fibres", spec: "EFNARC Guidelines / Energy Absorption Class c", size: "150mm Primary Support Shell", qty: 0, waste: 12, unit: "m³", rateNgn: 165000, source: "Master Builders Solutions Nigeria", leadTime: "Immediate" },
      { id: "mat-tun-05", code: "MAT-TUN-05", sector: "Waterproofing & Seals", desc: "Expandable Hydrophilic Sodium Bentonite / Polymer Waterstop Sealing Strip", spec: "Volumetric Expansion > 300% under Head of Water", size: "20mm x 25mm Continuous Coils", qty: 0, waste: 4, unit: "m", rateNgn: 9800, source: "Grace Construction Chemicals", leadTime: "Immediate" },
      { id: "mat-tun-06", code: "MAT-TUN-06", sector: "Tunnel Invert Drainage", desc: "Perforated Heavy-Duty Corrugated HDPE Invert Drainage Pipes (SN8 Ring Stiffness)", spec: "DIN 4262-1 / Hydrocarbon & Acid Resistant", size: "300mm Diameter with Geotextile Sock", qty: 0, waste: 4, unit: "m", rateNgn: 38000, source: "Pecan Plastics (Kano/Lagos)", leadTime: "3-5 Days" }
    ],
    civil_preliminaries_site: [
      { id: "mat-pre-01", code: "MAT-PRE-01", sector: "Site Accommodations", desc: "Pre-fabricated High-Spec Modular Site Accommodation & Resident Engineer Office Units", spec: "CESMM4 A.110 / Fully Insulated, AC & Sanitary Installed", size: "12m x 3m (40ft Containerized Module)", qty: 0, waste: 0, unit: "nr", rateNgn: 8500000, source: "Container Hub Nigeria (Apapa)", leadTime: "1 Week" },
      { id: "mat-pre-02", code: "MAT-PRE-02", sector: "Laboratory & Testing", desc: "On-site Soils, Asphalt & Concrete Compressive Test Cube Crushing Machine & Curing Tanks", spec: "BS 1881 / 2000 kN Digital Automatic Compression Rig", size: "Calibrated Field Testing Suite", qty: 0, waste: 0, unit: "item", rateNgn: 14500000, source: "Ele International Geotechnical Suppliers", leadTime: "2 Weeks" },
      { id: "mat-pre-03", code: "MAT-PRE-03", sector: "Traffic Diversion", desc: "High-Visibility Heavy-Duty Water-Filled Polyethylene Traffic Bypass Barriers", spec: "CESMM4 A.220 / Interlocking UV Stabilized Red/White", size: "1.0m H x 1.5m L", qty: 0, waste: 2, unit: "nr", rateNgn: 45000, source: "Apex Safety Equipment (Ikeja)", leadTime: "Immediate" },
      { id: "mat-pre-04", code: "MAT-PRE-04", sector: "Security & Hoarding", desc: "Galvanized Corrugated Steel Profile Security Perimeter Hoarding Fencing", spec: "CESMM4 A.310 / Timber Post & Rail Support", size: "2.40m High Continuous Fencing", qty: 0, waste: 4, unit: "m", rateNgn: 22000, source: "Local Steel & Timber Depot", leadTime: "Immediate" },
      { id: "mat-pre-05", code: "MAT-PRE-05", sector: "Haul Roads", desc: "Coarse Crushed Rock Aggregate for Heavy Construction Plant Temporary Haulage Roads", spec: "CESMM4 A.410 / 75mm Crusher-run Granite", size: "200mm Layer", qty: 0, waste: 8, unit: "m³", rateNgn: 28000, source: "Abeokuta Granite Quarry", leadTime: "Immediate" }
    ]
  };

  const [projectMaterials, setProjectMaterials] = _.useState(initialMaterialsDatabase);

  // Active materials derived from current selected project
  const currentMaterialsList = _.useMemo(() => {
    return projectMaterials[activeCivilProject.id] || projectMaterials.lekki_dual_carriageway;
  }, [projectMaterials, activeCivilProject.id]);

  // Update material field cleanly without cursor trap
  const handleUpdateMaterial = (matId, field, rawValue) => {
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue) || 0;
    setProjectMaterials(prev => {
      const projList = prev[activeCivilProject.id] || prev.lekki_dual_carriageway;
      const updated = projList.map(item => {
        if (item.id === matId) {
          return { ...item, [field]: numValue };
        }
        return item;
      });
      return { ...prev, [activeCivilProject.id]: updated };
    });
  };

  // Add Custom Material Modal
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = _.useState(!1);
  const [newMaterialForm, setNewMaterialForm] = _.useState({
    code: "MAT-CIV-CUSTOM",
    sector: "Pavement & Asphalt",
    desc: "",
    spec: "CESMM4 / FMW Specification",
    size: "Standard Site Specification",
    qty: 0,
    waste: 5,
    unit: "m³",
    rateNgn: 0,
    source: "Local Registered Nigerian Supplier",
    leadTime: "2-3 Days"
  });

  const handleSaveCustomMaterial = () => {
    if (!newMaterialForm.desc.trim()) {
      notify("Please provide a material description.");
      return;
    }
    const newEntry = {
      id: "mat-custom-" + Date.now(),
      ...newMaterialForm
    };
    setProjectMaterials(prev => {
      const curr = prev[activeCivilProject.id] || prev.lekki_dual_carriageway;
      return { ...prev, [activeCivilProject.id]: [newEntry, ...curr] };
    });
    setIsAddMaterialModalOpen(!1);
    setNewMaterialForm({
      code: "MAT-CIV-CUSTOM",
      sector: "Pavement & Asphalt",
      desc: "",
      spec: "CESMM4 / FMW Specification",
      size: "Standard Site Specification",
      qty: 0,
      waste: 5,
      unit: "m³",
      rateNgn: 0,
      source: "Local Registered Nigerian Supplier",
      leadTime: "2-3 Days"
    });
    notify("Custom Material added to " + activeCivilProject.title);
  };

  // Filtered Materials
  const filteredMaterials = _.useMemo(() => {
    return currentMaterialsList.filter(item => {
      const matchesSearch = !searchFilter || 
        item.desc.toLowerCase().includes(searchFilter.toLowerCase()) || 
        item.code.toLowerCase().includes(searchFilter.toLowerCase()) || 
        item.sector.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesSector = activeSectorFilter === "all" || item.sector.toLowerCase().includes(activeSectorFilter.toLowerCase());
      return matchesSearch && matchesSector;
    });
  }, [currentMaterialsList, searchFilter, activeSectorFilter]);

  // Material Schedule Total KPI calculations
  const materialTotals = _.useMemo(() => {
    let totalCostNgn = 0;
    let totalWasteCostNgn = 0;
    let totalItems = currentMaterialsList.length;
    let criticalLeadTimeCount = 0;

    currentMaterialsList.forEach(m => {
      const reqQty = Number(m.qty || 0) * (1 + (Number(m.waste || 0) / 100));
      const cost = reqQty * Number(m.rateNgn || 0);
      const wasteOnlyCost = (reqQty - Number(m.qty || 0)) * Number(m.rateNgn || 0);
      totalCostNgn += cost;
      totalWasteCostNgn += wasteOnlyCost;
      if ((m.leadTime && m.leadTime.toLowerCase().includes("week")) || (m.source && m.source.toLowerCase().includes("import"))) {
        criticalLeadTimeCount++;
      }
    });

    return { totalCostNgn, totalWasteCostNgn, totalItems, criticalLeadTimeCount };
  }, [currentMaterialsList]);

  // 1. Export Material Schedule PDF (Landscape with NIQS / CESMM4 formatting)
  const exportMaterialSchedulePdf = async () => {
    try {
      notify("Generating professional landscape PDF for " + activeCivilProject.title + "...");
      const res = await fetch("/api/export/material-schedule-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: activeCivilProject.title,
          constructionDomain: "civil",
          specStandard: activeCivilProject.specStandard || "CESMM4 / FMW&H Volume 1",
          currency: civilCurrency,
          exchangeRate: exchangeRate,
          materials: currentMaterialsList
        })
      });
      if (!res.ok) throw new Error("Server responded with HTTP " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = activeCivilProject.title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Material_Schedule_" + civilCurrency + ".pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify("Successfully exported " + activeCivilProject.title + " Material Schedule PDF!");
    } catch (err) {
      console.error("PDF export error:", err);
      notify("Opening print view for PDF save...");
      window.print();
    }
  };

  // 2. Export Material Schedule Excel (.xlsx)
  const exportMaterialScheduleExcel = async () => {
    try {
      notify("Generating formatted Excel workbook (.xlsx)...");
      const res = await fetch("/api/export/material-schedule-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: activeCivilProject.title,
          constructionDomain: "civil",
          specStandard: activeCivilProject.specStandard || "CESMM4 / FMW&H Volume 1",
          currency: civilCurrency,
          exchangeRate: exchangeRate,
          materials: currentMaterialsList
        })
      });
      if (!res.ok) throw new Error("Server responded with HTTP " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = activeCivilProject.title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Material_Schedule_" + civilCurrency + ".xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify("Successfully exported " + activeCivilProject.title + " Material Schedule Excel!");
    } catch (err) {
      console.error("Excel export error:", err);
      notify("Failed to export Excel. Please try CSV export.");
    }
  };

  // 3. Export Clean, Arranged RFC-4180 CSV with UTF-8 BOM
  const exportMaterialScheduleCsv = () => {
    const sanitize = (val) => {
      if (val == null) return '""';
      const s = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ').replace(/"/g, '""');
      return '"' + s.trim() + '"';
    };
    const lines = [];
    lines.push([sanitize("LET'S ESTIMATE - CIVIL INFRASTRUCTURE & ROADS (CESMM4 / FMW&H)")].join(","));
    lines.push([sanitize("PROJECT MATERIAL SCHEDULE & PROCUREMENT BILL"), sanitize(new Date().toLocaleDateString("en-GB"))].join(","));
    lines.push([sanitize("Project:"), sanitize(activeCivilProject.title)].join(","));
    lines.push([sanitize("Construction Domain:"), sanitize("CIVIL INFRASTRUCTURE & HIGHWAY WORKS"), sanitize("Standard:"), sanitize(activeCivilProject.specStandard || "CESMM4")].join(","));
    lines.push([sanitize("Currency:"), sanitize(civilCurrency), sanitize("Exchange Rate:"), sanitize("₦" + exchangeRate + " / $1 USD")].join(","));
    lines.push("");
    const headers = [
      "Item No",
      "Material Code",
      "Trade Sector / Discipline",
      "Material Description",
      "Specification & Grade",
      "Size / Rating",
      "Takeoff Qty",
      "Waste Allowance (%)",
      "Total Required Qty",
      "Unit",
      "Unit Rate (" + civilCurrency + ")",
      "Total Amount (" + civilCurrency + ")",
      "Supply Source & Origin",
      "Lead Time"
    ];
    lines.push(headers.map(sanitize).join(","));
    let totalAmountSum = 0;
    currentMaterialsList.forEach((m, idx) => {
      const rawQty = Number(m.qty || 0);
      const wastePct = Number(m.waste || 0);
      const reqQty = Number((rawQty * (1 + wastePct / 100)).toFixed(2));
      const rateVal = civilCurrency === "USD" ? Number((m.rateNgn / exchangeRate).toFixed(2)) : Number(m.rateNgn || 0);
      const costVal = civilCurrency === "USD" ? Number((reqQty * m.rateNgn / exchangeRate).toFixed(2)) : Math.round(reqQty * m.rateNgn);
      totalAmountSum += costVal;
      lines.push([
        idx + 1,
        sanitize(m.code),
        sanitize(m.sector),
        sanitize(m.desc),
        sanitize(m.spec || "CESMM4 Spec"),
        sanitize(m.size || "Standard"),
        rawQty,
        wastePct,
        reqQty,
        sanitize(m.unit),
        rateVal,
        costVal,
        sanitize(m.source || "Approved Quarry/Depot"),
        sanitize(m.leadTime || "Immediate")
      ].join(","));
    });
    lines.push("");
    lines.push([
      sanitize("SUMMARY TOTAL"),
      '""', '""', '""', '""', '""', '""', '""', '""', '""',
      sanitize("GRAND TOTAL:"),
      civilCurrency === "USD" ? totalAmountSum.toFixed(2) : Math.round(totalAmountSum),
      '""', '""'
    ].join(","));
    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeCivilProject.title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Civil_Material_Schedule_" + civilCurrency + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify("Exported Arranged Material Schedule CSV!");
  };

  // =========================================================================
  // 3. CIVIL WORKS TAKEOFF SCHEDULE (CESMM4 / FMW)
  // ALL initial quantities and calculations start at 0 (NO ASSUMPTIONS)
  // Each item features a collapsible calculation trace showing formulas and dimensions!
  // =========================================================================
  const [civilScheduleItems, setCivilScheduleItems] = _.useState([
    // 1. PRELIMINARIES & GENERAL ITEMS (CESMM4 Class A)
    {
      id: "cw-prelim-1",
      sector: "preliminaries",
      billNo: 1,
      code: "CESMM4 A.110",
      classTitle: "Class A: General Items",
      itemDesc: "Contractor temporary site accommodation, supervisory offices, soils/materials laboratory, and testing apparatus per CESMM4 A1",
      unit: "item",
      qty: 0,
      rateNgn: 18500000,
      specStandard: "CESMM4 Class A / FMW Clause 101",
      notes: "Full air-conditioned resident engineer offices, materials test bench, curing tanks & vehicles.",
      calc: {
        formula: "Lump Sum Specified Contract Requirements (Office + Lab + Utilities)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 0,
        smmRule: "CESMM4 Class A.110: General items measured as lump sum with laboratory testing obligations."
      }
    },
    {
      id: "cw-prelim-2",
      sector: "preliminaries",
      billNo: 1,
      code: "CESMM4 A.220",
      classTitle: "Class A: General Items",
      itemDesc: "Traffic safety and management during highway works: temporary bypass diversions, reflective warning signs, barriers, solar flashers & trained flagmen",
      unit: "item",
      qty: 0,
      rateNgn: 9200000,
      specStandard: "CESMM4 Class A / Traffic Safety Code",
      notes: "Maintains live highway traffic on adjacent carriageway throughout construction duration.",
      calc: {
        formula: "Lump Sum Diversion Corridor Management (Signage + Solar Flashers + Gangs)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 0,
        smmRule: "CESMM4 Class A.220: Traffic diversion and pedestrian protection priced as preliminary lump sum."
      }
    },
    // 2. SITE CLEARANCE & EARTHWORKS (CESMM4 Class D & E)
    {
      id: "cw-clear-1",
      sector: "earthworks",
      billNo: 2,
      code: "CESMM4 D.110",
      classTitle: "Class D: Demolition & Site Clearance",
      itemDesc: "General site clearance: bush clearing, tree felling (girth <= 500mm), grubbing out stumps, roots and disposal outside right-of-way",
      unit: "ha",
      qty: 0,
      rateNgn: 4500000,
      specStandard: "CESMM4 Class D / FMW Clause 201",
      notes: "Formation corridor width 30m over project road alignment.",
      calc: {
        formula: "(Corridor Length (m) × Right-of-Way Width (m)) / 10,000 m²/ha",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 0,
        smmRule: "CESMM4 Class D.110: General clearance measured in hectares of plan area."
      }
    },
    {
      id: "cw-strip-1",
      sector: "earthworks",
      billNo: 2,
      code: "CESMM4 E.110",
      classTitle: "Class E: Earthworks (Excavation)",
      itemDesc: "Topsoil stripping to an average depth of 150mm below original ground level and stockpiling for landscaping reinstatement",
      unit: "m³",
      qty: 0,
      rateNgn: 2400,
      specStandard: "CESMM4 Class E / FMW Clause 202",
      notes: "Stripped organic topsoil stockpiled along verge for embankment slope grassing.",
      calc: {
        formula: "Alignment Length (m) × Roadbed Width (m) × Stripping Depth (0.15m)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 0,
        smmRule: "CESMM4 Class E.110: Excavation of topsoil measured in cubic metres; stripping depth stated."
      }
    },
    {
      id: "cw-cut-1",
      sector: "earthworks",
      billNo: 2,
      code: "CESMM4 E.220",
      classTitle: "Class E: Earthworks (Bulk Excavation)",
      itemDesc: "Bulk road cutting excavation in common material (lateritic sandy clay), carting to haul and dumping in formation embankments",
      unit: "m³",
      qty: 0,
      rateNgn: 3600,
      specStandard: "CESMM4 Class E / FMW Clause 204",
      notes: "Freehaul distance up to 500m; includes shaping and trim of cut batters.",
      calc: {
        formula: "Average Cut Cross-Section Area (m²) × Section Length (m) × Compaction Bulking Factor",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "CESMM4 Class E.220: Cutting measured net in situ; haul up to 500m deemed included."
      }
    },
    // 3. SUB-BASE & ROADBASE (CESMM4 Class R)
    {
      id: "cw-subbase-1",
      sector: "pavement",
      billNo: 3,
      code: "CESMM4 R.110",
      classTitle: "Class R: Roads & Pavings (Sub-base)",
      itemDesc: "Natural selected lateritic gravel sub-base laid, spread, watered and compacted in 150mm layers to 98% AASHTO T-180 MDD (CBR >= 30%)",
      unit: "m³",
      qty: 0,
      rateNgn: 18500,
      specStandard: "FMW Clause 401 / CESMM4 Class R",
      notes: "Imported from approved borrow pit; includes rolling with 15-tonne vibratory roller.",
      calc: {
        formula: "Carriageway Length (m) × Sub-base Width (m) × Compacted Thickness (m)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 7,
        smmRule: "CESMM4 Class R.110: Sub-base measured in cubic metres of compacted finished work."
      }
    },
    {
      id: "cw-base-1",
      sector: "pavement",
      billNo: 3,
      code: "CESMM4 R.220",
      classTitle: "Class R: Roads & Pavings (Roadbase)",
      itemDesc: "Crushed stone roadbase (graded crushed rock aggregate 0-40mm) laid and compacted to 100% AASHTO T-180 density",
      unit: "m³",
      qty: 0,
      rateNgn: 38500,
      specStandard: "FMW Clause 402 / CESMM4 Class R",
      notes: "Dense mechanical interlock; crushing value < 25%; flakiness index < 30%.",
      calc: {
        formula: "Pavement Length (m) × Formation Base Width (m) × Compacted Base Thickness (0.15m)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "CESMM4 Class R.220: Graded crushed rock base measured net in cubic metres."
      }
    },
    // 4. ASPHALT SURFACING & BITUMEN (CESMM4 Class R)
    {
      id: "cw-prime-1",
      sector: "pavement",
      billNo: 4,
      code: "CESMM4 R.310",
      classTitle: "Class R: Roads & Pavings (Prime Coat)",
      itemDesc: "Bituminous cut-back prime coat (MC-30 grade) sprayed mechanically at nominal rate of 1.10 litres/m² over finished crushed stone base",
      unit: "m²",
      qty: 0,
      rateNgn: 2200,
      specStandard: "FMW Clause 503 / CESMM4 Class R",
      notes: "Allowed 24 hours cure before binder course placement.",
      calc: {
        formula: "Pavement Surface Length (m) × Surface Width (m) [Nominal Spray 1.1 L/m²]",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 3,
        smmRule: "CESMM4 Class R.310: Prime coat application measured in square metres."
      }
    },
    {
      id: "cw-binder-1",
      sector: "pavement",
      billNo: 4,
      code: "CESMM4 R.420",
      classTitle: "Class R: Roads & Pavings (Binder Course)",
      itemDesc: "Asphaltic concrete binder course (Dense Bituminous Macadam 0-20mm) 60mm compacted thickness, laid by pneumatic asphalt paver",
      unit: "m²",
      qty: 0,
      rateNgn: 13500,
      specStandard: "FMW Clause 501 / CESMM4 Class R",
      notes: "Bitumen penetration grade 60/70; Marshall Stability > 7.5 kN; void ratio 4-7%.",
      calc: {
        formula: "Carriageway Length (m) × Asphalt Width (m) [Thickness 60mm]",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "CESMM4 Class R.420: Asphalt courses measured in square metres with thickness stated."
      }
    },
    {
      id: "cw-wearing-1",
      sector: "pavement",
      billNo: 4,
      code: "CESMM4 R.510",
      classTitle: "Class R: Roads & Pavings (Wearing Course)",
      itemDesc: "Asphaltic concrete wearing course (0-14mm graded aggregate with polymer-modified bitumen) 50mm compacted thickness",
      unit: "m²",
      qty: 0,
      rateNgn: 14800,
      specStandard: "FMW Clause 502 / CESMM4 Class R",
      notes: "High skid resistance surface; Marshall Stability > 9.0 kN.",
      calc: {
        formula: "Carriageway Length (m) × Wearing Course Width (m) [Thickness 50mm]",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "CESMM4 Class R.510: Wearing course measured in square metres; thickness stated."
      }
    },
    // 5. BRIDGES, CULVERTS & DRAINAGE (CESMM4 Class H, G & F)
    {
      id: "cw-culvert-1",
      sector: "drainage",
      billNo: 5,
      code: "CESMM4 H.120",
      classTitle: "Class H: Pipe Culverts",
      itemDesc: "Precast reinforced concrete pipe culvert (900mm internal diameter Class 4), on 150mm concrete cradle bed and surround",
      unit: "m",
      qty: 0,
      rateNgn: 125000,
      specStandard: "BS 5911 Class 4 / FMW Clause 301",
      notes: "Includes excavation in trench, granular jointing and testing.",
      calc: {
        formula: "Number of Culvert Crossings (nr) × Culvert Barrel Length (m)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 2,
        smmRule: "CESMM4 Class H.120: Pipe culverts measured linearly along center line."
      }
    },
    {
      id: "cw-box-1",
      sector: "bridges",
      billNo: 5,
      code: "CESMM4 F.110",
      classTitle: "Class F: In situ Concrete (Bridges & Box Culverts)",
      itemDesc: "Reinforced in situ structural concrete Grade C30/37 (20mm aggregate) in bridge abutments, piers, headwalls & wingwalls",
      unit: "m³",
      qty: 0,
      rateNgn: 165000,
      specStandard: "BS 8110 / BS 5400 Bridge Design",
      notes: "Sulfate-resistant cement; water-cement ratio <= 0.45; formwork and rebar measured separately.",
      calc: {
        formula: "Wall Length (m) × Wall Thickness (m) × Wall Height (m) × Timesing",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "CESMM4 Class F.110: Concrete measured net in cubic metres without deduction of rebar."
      }
    },
    {
      id: "cw-rebar-1",
      sector: "bridges",
      billNo: 5,
      code: "CESMM4 G.510",
      classTitle: "Class G: Concrete Ancillaries (Bridge Reinforcement)",
      itemDesc: "High yield deformed steel reinforcement bars (Grade 460 - Y16, Y20, Y25) cut, bent and tied in bridge decks and piers",
      unit: "tonne",
      qty: 0,
      rateNgn: 1650000,
      specStandard: "BS 4449 / BS 5400",
      notes: "Includes bar chairs, spacers and annealed tying wire.",
      calc: {
        formula: "Volume of Structural Concrete (m³) × Steel Density Ratio (110 kg/m³) / 1,000",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "CESMM4 Class G.510: Reinforcement bars measured by calculated weight in tonnes."
      }
    },
    {
      id: "cw-bridge-girder-1",
      sector: "bridges",
      billNo: 5,
      code: "CESMM4 G.810",
      classTitle: "Class G: Precast Concrete Bridge Beams",
      itemDesc: "Precast prestressed concrete bridge girders (I-beam or M-beam profile, 24m span), transported and erected on elastomeric bearings",
      unit: "nr",
      qty: 0,
      rateNgn: 8500000,
      specStandard: "BS 5400 Bridge Standards / Prestressed Class 1",
      notes: "Manufactured in accredited precast yard with 1860 MPa prestressing tendons.",
      calc: {
        formula: "Number of Bridge Spans (nr) × Girders Per Cross-Section (nr)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 0,
        smmRule: "CESMM4 Class G.810: Precast bridge beams measured by number with length and mass stated."
      }
    },
    // 6. TUNNEL & UNDERGROUND WORKS (CESMM4 Class T)
    {
      id: "cw-tunnel-excav-1",
      sector: "tunnels",
      billNo: 6,
      code: "CESMM4 T.110",
      classTitle: "Class T: Tunnels (Drive Excavation)",
      itemDesc: "Tunnel drive excavation by mechanized Tunnel Boring Machine (TBM) or NATM roadheader in weak to medium strong rock",
      unit: "m³",
      qty: 0,
      rateNgn: 95000,
      specStandard: "CESMM4 Class T / CIRIA Tunnel Guidelines",
      notes: "Bore diameter 6.8m; includes mucking out and spoil conveying to portal spoil area.",
      calc: {
        formula: "(π × (Bore Diameter / 2)²) × Drive Length (m)",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 10,
        smmRule: "CESMM4 Class T.110: Tunnel excavation measured net in cubic metres within the specified profile."
      }
    },
    {
      id: "cw-tunnel-lining-1",
      sector: "tunnels",
      billNo: 6,
      code: "CESMM4 T.310",
      classTitle: "Class T: Tunnels (Segmental Lining)",
      itemDesc: "Precast steel-fibre reinforced concrete (SFRC) segmental tunnel lining rings (Grade C50/60) with EPDM compression gaskets",
      unit: "m",
      qty: 0,
      rateNgn: 1250000,
      specStandard: "BS EN 14487 / STUVA Watertightness",
      notes: "Universal taper rings, bolted and pressure grouted behind tail skin.",
      calc: {
        formula: "Tunnel Bore Length (m) [Ring Length 1.50m]",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 2,
        smmRule: "CESMM4 Class T.310: Segmental linings measured linearly along center line."
      }
    }
  ]);

  // Update item dimension or quantity cleanly without cursor trap
  const handleUpdateItemCalc = (itemId, dimField, rawValue) => {
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue) || 0;
    setCivilScheduleItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newCalc = { ...item.calc, [dimField]: numValue };
          let newQty = item.qty;
          // Calculate automatically based on dimensions if user enters L, W, D
          if (dimField === "length" || dimField === "width" || dimField === "depth" || dimField === "timesing" || dimField === "deductions") {
            const l = dimField === "length" ? numValue : (newCalc.length || 0);
            const w = dimField === "width" ? numValue : (newCalc.width || 0);
            const d = dimField === "depth" ? numValue : (newCalc.depth || 0);
            const t = dimField === "timesing" ? numValue : (newCalc.timesing || 1);
            const ded = dimField === "deductions" ? numValue : (newCalc.deductions || 0);
            
            if (l > 0 && w > 0 && d > 0) {
              newQty = Math.max(0, ((l * w * d * (t || 1)) - ded));
            } else if (l > 0 && w > 0 && d === 0) {
              newQty = Math.max(0, ((l * w * (t || 1)) - ded));
            } else if (l > 0 && w === 0 && d === 0) {
              newQty = Math.max(0, ((l * (t || 1)) - ded));
            }
            newQty = Math.round(newQty * 100) / 100;
          }
          return { ...item, calc: newCalc, qty: newQty };
        }
        return item;
      });
    });
  };

  const handleUpdateItemDirect = (itemId, field, rawValue) => {
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue) || 0;
    setCivilScheduleItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: numValue };
        }
        return item;
      });
    });
  };

  // Add Custom Civil Work Item Modal
  const [isAddCivilItemModalOpen, setIsAddCivilItemModalOpen] = _.useState(!1);
  const [newCivilItemForm, setNewCivilItemForm] = _.useState({
    code: "CESMM4 R.990",
    sector: "pavement",
    billNo: 3,
    classTitle: "Class R: Roads & Pavings",
    itemDesc: "",
    unit: "m³",
    qty: 0,
    rateNgn: 0,
    specStandard: "CESMM4 / FMW Specification",
    notes: "",
    calcFormula: "Length (m) × Width (m) × Depth (m)"
  });

  const handleSaveCustomCivilItem = () => {
    if (!newCivilItemForm.itemDesc.trim()) {
      notify("Please enter an item description.");
      return;
    }
    const newEntry = {
      id: "cw-custom-" + Date.now(),
      code: newCivilItemForm.code,
      sector: newCivilItemForm.sector,
      billNo: newCivilItemForm.billNo,
      classTitle: newCivilItemForm.classTitle,
      itemDesc: newCivilItemForm.itemDesc,
      unit: newCivilItemForm.unit,
      qty: Number(newCivilItemForm.qty || 0),
      rateNgn: Number(newCivilItemForm.rateNgn || 0),
      specStandard: newCivilItemForm.specStandard,
      notes: newCivilItemForm.notes || "Added custom engineering work item.",
      calc: {
        formula: newCivilItemForm.calcFormula || "Dimension formula",
        length: 0,
        width: 0,
        depth: 0,
        timesing: 1,
        deductions: 0,
        wasteFactor: 5,
        smmRule: "CESMM4: Custom civil measurement item."
      }
    };
    setCivilScheduleItems(prev => [newEntry, ...prev]);
    setIsAddCivilItemModalOpen(!1);
    setNewCivilItemForm({
      code: "CESMM4 R.990",
      sector: "pavement",
      billNo: 3,
      classTitle: "Class R: Roads & Pavings",
      itemDesc: "",
      unit: "m³",
      qty: 0,
      rateNgn: 0,
      specStandard: "CESMM4 / FMW Specification",
      notes: "",
      calcFormula: "Length (m) × Width (m) × Depth (m)"
    });
    notify("Custom Civil Work Item added to schedule!");
  };

  // Filtered Civil Takeoff Items
  const filteredCivilItems = _.useMemo(() => {
    return civilScheduleItems.filter(item => {
      const matchesSearch = !searchFilter ||
        item.itemDesc.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.classTitle.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesSector = activeSectorFilter === "all" || item.sector === activeSectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [civilScheduleItems, searchFilter, activeSectorFilter]);

  // Takeoff Cost Totals
  const takeoffTotals = _.useMemo(() => {
    let totalNgn = 0;
    let measuredItemsCount = 0;
    civilScheduleItems.forEach(i => {
      const itemCost = Number(i.qty || 0) * Number(i.rateNgn || 0);
      totalNgn += itemCost;
      if (Number(i.qty || 0) > 0) measuredItemsCount++;
    });
    return { totalNgn, measuredItemsCount, totalItems: civilScheduleItems.length };
  }, [civilScheduleItems]);

  // Export BOQ CSV
  const exportCivilBoqCsv = () => {
    const headers = ["Bill No", "Item Code", "Work Class", "Item Description", "Specification", "Takeoff Qty", "Unit", "Unit Rate (" + civilCurrency + ")", "Total Amount (" + civilCurrency + ")"];
    const rows = civilScheduleItems.map(i => {
      const rateDisp = getDisplayRate(i.rateNgn);
      const costDisp = civilCurrency === "USD" ? (Number(i.qty || 0) * i.rateNgn / exchangeRate).toFixed(2) : Math.round(Number(i.qty || 0) * i.rateNgn);
      return [
        i.billNo,
        '"' + i.code + '"',
        '"' + i.classTitle + '"',
        '"' + i.itemDesc.replace(/"/g, '""') + '"',
        '"' + (i.specStandard || "").replace(/"/g, '""') + '"',
        i.qty,
        '"' + i.unit + '"',
        rateDisp,
        costDisp
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeCivilProject.title.replace(/[^a-zA-Z0-9]/g, "_") + "_Civil_BOQ.csv";
    link.click();
    notify("Exported Civil BOQ CSV!");
  };

  // Commit to App BOQ
  const handleCommitScheduleToAppBoq = () => {
    if (onCommitToBoq) {
      const itemsToExport = civilScheduleItems.map(item => ({
        item: item.itemDesc,
        unit: item.unit,
        quantity: item.qty,
        rate: getDisplayRate(item.rateNgn),
        amount: Math.round(Number(item.qty || 0) * getDisplayRate(item.rateNgn)),
        section: item.classTitle,
        standard: "CESMM4"
      }));
      onCommitToBoq(itemsToExport, activeCivilProject.title);
      notify("Committed " + itemsToExport.length + " Civil Items directly into Active BOQ Worksheet!");
    } else {
      notify("Schedule committed to BOQ successfully!");
    }
  };

  // =========================================================================
  // 4. DRAWINGS & SPECIFICATIONS HUB STATE
  // =========================================================================
  const [specDocuments, setSpecDocuments] = _.useState([
    {
      id: "spec-doc-1",
      name: "Federal Highway Standard Specifications (FMW&H Vol 1 - Roads & Bridges)",
      category: "Highway Standard Specification",
      size: "24.8 MB",
      pages: 420,
      status: "Active Reference",
      smmCode: "CESMM4 / FMW",
      clauses: [
        "Clause 101: Engineer Accommodation, Site Laboratories & Testing Apparatus Obligations",
        "Clause 204: Bulk Earthworks Excavation, Rock Ripping & Compaction Requirements (95% AASHTO T-180)",
        "Clause 401: Natural Lateritic Gravel Sub-base (Minimum Soaked CBR > 30%, Plasticity Index < 12)",
        "Clause 402: Graded Crushed Granite Stone Base 0-40mm (CBR > 80%, Flakiness Index < 30%)",
        "Clause 501: Dense Bituminous Macadam (DBM) Binder Course (60/70 Pen Bitumen, Marshall Stability > 7.5 kN)",
        "Clause 502: Asphaltic Concrete Wearing Course (0-14mm Aggregates, 50mm Compacted Layer, Marshall Flow 2-4mm)",
        "Clause 601: Structural Concrete Mix Classes C20/25, C25/30, C35/45 and Sulfate Resisting Cements"
      ]
    },
    {
      id: "spec-doc-2",
      name: "CESMM4 Civil Engineering Standard Method of Measurement (ICE Rules)",
      category: "Measurement Standard",
      size: "18.5 MB",
      pages: 148,
      status: "Governing Measurement Code",
      smmCode: "CESMM4 4th Edition",
      clauses: [
        "Section 1: Definitions and Work Classification Principles",
        "Section 2: Coding and Numbering of Bill of Quantities Items (Class A through Z)",
        "Class E: Earthworks Measurement Rules (Net in-situ volumes, disposal classifications, rock classification)",
        "Class F & G: Concrete & Reinforcement Measurement Rules (Formwork contact area, bar schedule tonnage)",
        "Class I & J: Pipework & Chambers Measurement (Linear metres including trenching, jointing & testing)",
        "Class R: Roads & Pavings (Separate measurement of sub-base, base course, tack coat and surfacing courses)"
      ]
    },
    {
      id: "spec-doc-3",
      name: "AASHTO Highway & Pavement Materials Specification Guidelines",
      category: "International Standard",
      size: "32.1 MB",
      pages: 280,
      status: "Technical Standard",
      smmCode: "AASHTO / ASTM",
      clauses: [
        "AASHTO T-180: Standard Method of Test for Moisture-Density Relations of Soils (Modified Proctor)",
        "AASHTO T-193: Standard Method of Test for The California Bearing Ratio (CBR) of Soils",
        "AASHTO M-180: Corrugated Sheet Steel Beams for Highway Guardrail (Class A, 550g/m² Galvanizing)",
        "ASTM D6927: Marshall Stability and Flow of Asphalt Mixtures Using Marshall Apparatus"
      ]
    },
    {
      id: "spec-doc-4",
      name: "BS EN 1317 Road Restraint Systems & Bridge Parapet Standards",
      category: "Safety & Structures Standard",
      size: "15.4 MB",
      pages: 112,
      status: "Technical Standard",
      smmCode: "EN 1317 / BS 5400",
      clauses: [
        "Part 1: Terminology and General Criteria for Test Methods for Safety Barriers",
        "Part 2: Performance Classes, Impact Test Acceptance Criteria for Vehicle Restraint Systems (H1, H2, H4a)",
        "Part 4: Pedestrian Parapets, Bridge Parapet Anchoring & Expansion Gap Movements"
      ]
    }
  ]);

  const [activeSpecDocId, setActiveSpecDocId] = _.useState("spec-doc-1");
  // Upload handler for Specifications & Drawings
  const handleUploadSpecFile = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const newDoc = {
      id: "spec-upload-" + Date.now(),
      name: file.name,
      category: file.name.toLowerCase().includes("dwg") || file.name.toLowerCase().includes("plan") ? "Uploaded Drawing" : "Uploaded Specification",
      size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      pages: Math.max(1, Math.round(file.size / 250000)),
      status: "Ready for Technical Takeoff",
      smmCode: "CESMM4 Verified",
      clauses: ["Uploaded engineering document for live takeoff cross-referencing."]
    };
    setSpecDocuments(prev => [newDoc, ...prev]);
    setActiveSpecDocId(newDoc.id);
    notify("Uploaded Specification / Drawing: " + file.name);
  };

  // Render Component UI

  // =========================================================================
  // REUSABLE CONSTRUCTION TEMPLATE LIBRARY STATE & LOGIC
  // =========================================================================
  const countriesConfig = {"UK":{"code":"UK","name":"United Kingdom","currency":"GBP","symbol":"£","rateMultiplierUsd":0.78,"defaultStandard":"NRM2","civilStandard":"CESMM4","vatRate":20,"flag":"🇬🇧"},"US":{"code":"US","name":"United States","currency":"USD","symbol":"$","rateMultiplierUsd":1,"defaultStandard":"MasterFormat (CSI)","civilStandard":"AASHTO / ASTM","vatRate":8.5,"flag":"🇺🇸"},"NG":{"code":"NG","name":"Nigeria","currency":"NGN","symbol":"₦","rateMultiplierUsd":1550,"defaultStandard":"BESMM4 / NIQS","civilStandard":"CESMM4 / FMW&H Vol 1","vatRate":7.5,"flag":"🇳🇬"},"AU":{"code":"AU","name":"Australia","currency":"AUD","symbol":"A$","rateMultiplierUsd":1.52,"defaultStandard":"ASMM","civilStandard":"Austroads / ASMM","vatRate":10,"flag":"🇦🇺"},"CA":{"code":"CA","name":"Canada","currency":"CAD","symbol":"C$","rateMultiplierUsd":1.36,"defaultStandard":"MasterFormat Canada","civilStandard":"TAC / CCDC","vatRate":13,"flag":"🇨🇦"},"AE":{"code":"AE","name":"United Arab Emirates","currency":"AED","symbol":"AED","rateMultiplierUsd":3.67,"defaultStandard":"POMI (Principles of Measurement Intl)","civilStandard":"CESMM4 Gulf / FIDIC","vatRate":5,"flag":"🇦🇪"},"KE":{"code":"KE","name":"Kenya & East Africa","currency":"KES","symbol":"KSh","rateMultiplierUsd":130,"defaultStandard":"SMM Kenya (BORAQS)","civilStandard":"CESMM4 East Africa","vatRate":16,"flag":"🇰🇪"},"ZA":{"code":"ZA","name":"South Africa","currency":"ZAR","symbol":"R","rateMultiplierUsd":18.2,"defaultStandard":"SANS 10403","civilStandard":"COLTO / SANS 1200","vatRate":15,"flag":"🇿🇦"}};
  const measurementStandardsList = [{"id":"CESMM4","name":"CESMM4 (Civil Engineering Standard Method of Measurement 4th Ed.)","scope":"Civil & Infrastructure","defaultOrg":"ICE / RICS"},{"id":"NRM1","name":"NRM1 (Order of Cost Estimating and Elemental Cost Planning)","scope":"Building Works","defaultOrg":"RICS UK"},{"id":"NRM2","name":"NRM2 (Detailed Measurement for Building Works)","scope":"Building Works","defaultOrg":"RICS UK"},{"id":"FMW_BESMM4","name":"FMW&H Vol 1 / BESMM4 (Highway Specifications & Nigerian Standards)","scope":"Civil & Building Nigeria","defaultOrg":"FMW / NIQS"},{"id":"AASHTO_CSI","name":"AASHTO Highway Guide / MasterFormat CSI","scope":"Transportation USA","defaultOrg":"AASHTO / CSI"},{"id":"POMI","name":"POMI (Principles of Measurement International)","scope":"Middle East & Global","defaultOrg":"RICS Global"},{"id":"ASMM_AUSTROADS","name":"Austroads Civil Guide / ASMM","scope":"Civil Australia/NZ","defaultOrg":"Austroads"},{"id":"ICMS","name":"ICMS (International Cost Management Standard 3rd Ed.)","scope":"High-Level Reporting","defaultOrg":"ICMS Coalition"},{"id":"ASME_B31","name":"ASME B31.3 / API 650 Process Measurement","scope":"Refinery & Industrial","defaultOrg":"ASME / API"}];
  const systemTemplatesDatabase = [{"id":"tmpl-civil-highway","title":"Dual Carriageway Expressway & Highway (4-Lane)","category":"civil","icon":"🛣️","description":"Complete civil works template for urban expressways, multi-lane highways, and arterial roads under CESMM4 / AASHTO.","defaultStandard":"CESMM4","defaultCountry":"UK","costRangeBenchmark":"$1.8M - $3.4M / km","sections":[{"id":"sec-prelim","title":"Preliminaries, Site Establishment & Traffic Management","classCode":"CESMM4 Class A","isCore":true,"items":[{"code":"HW-A100","desc":"Contractor site compound, engineer offices, laboratory testing facilities and welfare accommodation","unit":"sum","defaultQty":0,"baseRateUsd":125000,"spec":"CESMM4 A.110","formulaDesc":"Fixed lump sum based on contract duration"},{"code":"HW-A200","desc":"Temporary traffic management, contraflow diversions, barrier delineators, VMS signs and night lighting","unit":"sum","defaultQty":0,"baseRateUsd":85000,"spec":"CESMM4 A.240","formulaDesc":"Phased traffic control scheme"},{"code":"HW-A300","desc":"Continuous environmental monitoring, dust suppression water bowsers and sediment runoff traps","unit":"month","defaultQty":0,"baseRateUsd":6500,"spec":"CESMM4 A.310","formulaDesc":"Contract duration in months"}]},{"id":"sec-clearance","title":"Site Clearance, Topsoil Stripping & Tree Felling","classCode":"CESMM4 Class D","isCore":true,"items":[{"code":"HW-D100","desc":"General site clearance of brush, scrub, bushes and small vegetation within road reserve","unit":"ha","defaultQty":0,"baseRateUsd":3800,"spec":"CESMM4 D.110","formulaDesc":"Width of right-of-way × Chainage length"},{"code":"HW-D200","desc":"Stripping topsoil average 200mm depth and preserving in designated temporary stockpiles","unit":"m³","defaultQty":0,"baseRateUsd":4.8,"spec":"CESMM4 D.210","formulaDesc":"Carriageway footprint area × 0.20m strip"},{"code":"HW-D300","desc":"Demolition of existing redundant concrete kerbs, drains and pavement structures and carting away","unit":"m³","defaultQty":0,"baseRateUsd":28,"spec":"CESMM4 D.320","formulaDesc":"Measured volume of demolished structures"}]},{"id":"sec-earthworks","title":"Bulk Earthworks, Cuttings & Embankment Fill","classCode":"CESMM4 Class E","isCore":true,"items":[{"code":"HW-E100","desc":"Bulk excavation in acceptable cutting materials, loading, hauling up to 2km and placement in fills","unit":"m³","defaultQty":0,"baseRateUsd":7.2,"spec":"CESMM4 E.110","formulaDesc":"Cut volume from cross-section end-areas"},{"code":"HW-E200","desc":"Excavation in hard rock requiring pneumatic breakers or controlled ripping","unit":"m³","defaultQty":0,"baseRateUsd":32,"spec":"CESMM4 E.220","formulaDesc":"Geotechnical borehole rock profiles"},{"code":"HW-E300","desc":"Imported selected borrow pit gravel fill compacted in 150mm layers to 98% MDD (AASHTO T-180)","unit":"m³","defaultQty":0,"baseRateUsd":14.5,"spec":"CESMM4 E.330","formulaDesc":"Embankment net fill volume × 1.15 bulking"},{"code":"HW-E400","desc":"Proof rolling and subgrade preparation CBR > 15% with heavy vibratory compactors","unit":"m²","defaultQty":0,"baseRateUsd":2.1,"spec":"CESMM4 E.510","formulaDesc":"Total formation footprint area"}]},{"id":"sec-pavement","title":"Sub-base, Base Course & Bituminous Surfacing","classCode":"CESMM4 Class R","isCore":true,"items":[{"code":"HW-R100","desc":"Crushed rock stone base / sub-base (CBR > 80%) 150mm compacted thickness","unit":"m³","defaultQty":0,"baseRateUsd":36,"spec":"CESMM4 R.120","formulaDesc":"Carriageway width × Length × 0.15m thickness"},{"code":"HW-R200","desc":"Cut-back bitumen prime coat MC-30 applied at nominal rate of 1.1 litres/m²","unit":"m²","defaultQty":0,"baseRateUsd":1.85,"spec":"CESMM4 R.210","formulaDesc":"Total stone base surface area"},{"code":"HW-R300","desc":"Dense Bituminous Macadam (DBM) binder course 60mm compacted thickness (60/70 pen)","unit":"m²","defaultQty":0,"baseRateUsd":18.5,"spec":"CESMM4 R.310","formulaDesc":"Carriageway net surface area"},{"code":"HW-R400","desc":"Hot-Rolled Asphalt Concrete wearing course 40mm thick with pre-coated high-friction chippings","unit":"m²","defaultQty":0,"baseRateUsd":22,"spec":"CESMM4 R.410","formulaDesc":"Total paved carriageway + shoulders"}]},{"id":"sec-drainage","title":"Highway Drainage, Culverts & Chutes","classCode":"CESMM4 Class I/K","isCore":false,"items":[{"code":"HW-I100","desc":"Precast reinforced concrete trapezoidal line drains 600mm × 600mm on 100mm concrete bed","unit":"m","defaultQty":0,"baseRateUsd":78,"spec":"CESMM4 I.130","formulaDesc":"Both sides of road corridor length"},{"code":"HW-I200","desc":"Twin precast RC box culverts 2.4m × 2.4m including reinforced wingwalls and headwalls","unit":"m","defaultQty":0,"baseRateUsd":1450,"spec":"CESMM4 I.310","formulaDesc":"Stream crossing barrel length"},{"code":"HW-I300","desc":"Perforated subsoil corrugated plastic drain pipe 150mm dia wrapped in geotextile filter fabric","unit":"m","defaultQty":0,"baseRateUsd":34,"spec":"CESMM4 I.520","formulaDesc":"Toe-of-cutting groundwater drain run"}]},{"id":"sec-furniture","title":"Road Furniture, Markings, Signs & Safety Barriers","classCode":"CESMM4 Class K","isCore":false,"items":[{"code":"HW-K100","desc":"Corrugated steel W-beam crash barrier guardrail galvanized to BS EN ISO 1461 with driven posts","unit":"m","defaultQty":0,"baseRateUsd":62,"spec":"CESMM4 K.110","formulaDesc":"Median barrier + high embankment edges"},{"code":"HW-K200","desc":"Hot applied thermoplastic road marking paint 2.5mm thick with retroreflective glass beads","unit":"m²","defaultQty":0,"baseRateUsd":9.5,"spec":"CESMM4 K.220","formulaDesc":"Centre lines, lane dividers & edge lines"},{"code":"HW-K300","desc":"Standard directional gantry signboards and reflective retro-directive road studs (cat-eyes)","unit":"nr","defaultQty":0,"baseRateUsd":450,"spec":"CESMM4 K.410","formulaDesc":"Spacing every 12m on tangents, 6m curves"}]}]},{"id":"tmpl-civil-bridge","title":"Multi-Span Highway Bridge & Flyover Interchange","category":"civil","icon":"🌉","description":"Structural civil engineering bridge template covering bored piling, pier bents, prestressed beams, composite deck and bearings.","defaultStandard":"CESMM4","defaultCountry":"UK","costRangeBenchmark":"$4.5M - $12M / structure","sections":[{"id":"sec-bridge-sub","title":"Bored Piling & Deep Foundations","classCode":"CESMM4 Class F/O","isCore":true,"items":[{"code":"BR-O100","desc":"Rotary bored cast-in-place concrete piles 1200mm dia through overburden into bedrock up to 28m depth","unit":"m","defaultQty":0,"baseRateUsd":480,"spec":"CESMM4 O.120","formulaDesc":"Number of piles × design penetration depth"},{"code":"BR-O200","desc":"Non-destructive sonic logging pile integrity testing and cross-hole ultrasonic testing","unit":"nr","defaultQty":0,"baseRateUsd":1200,"spec":"CESMM4 O.310","formulaDesc":"100% of working bridge foundation piles"},{"code":"BR-F100","desc":"Reinforced concrete pile caps C35/45 mix with sulfate-resisting cement for marine/groundwater exposure","unit":"m³","defaultQty":0,"baseRateUsd":240,"spec":"CESMM4 F.110","formulaDesc":"Length × Width × Depth of pile cap blocks"}]},{"id":"sec-bridge-piers","title":"Reinforced Concrete Abutments, Piers & Cross-Heads","classCode":"CESMM4 Class F/G","isCore":true,"items":[{"code":"BR-F200","desc":"Reinforced concrete pier columns C40/50 circular or fluted architectural cross-section","unit":"m³","defaultQty":0,"baseRateUsd":290,"spec":"CESMM4 F.220","formulaDesc":"Pier cross-sectional area × Clear height"},{"code":"BR-F300","desc":"Post-tensioned reinforced concrete pier cross-head portal beams supporting precast deck girders","unit":"m³","defaultQty":0,"baseRateUsd":340,"spec":"CESMM4 F.240","formulaDesc":"Cantilever beam dimensions"},{"code":"BR-G100","desc":"High-tensile deformed carbon steel reinforcing bar BS 4449 Grade 500B (T16 - T32)","unit":"tonne","defaultQty":0,"baseRateUsd":1450,"spec":"CESMM4 G.110","formulaDesc":"Rebar BBS tonnage (approx 140kg/m³ concrete)"}]},{"id":"sec-bridge-super","title":"Precast Girders, Composite Deck Slab & Bearings","classCode":"CESMM4 Class M/F","isCore":true,"items":[{"code":"BR-M100","desc":"Precast prestressed concrete Super-T / I-girders 32m span length transported and lifted into position","unit":"nr","defaultQty":0,"baseRateUsd":28500,"spec":"CESMM4 M.110","formulaDesc":"Number of girders per span × Spans"},{"code":"BR-M200","desc":"Laminated elastomeric neoprene bridge bearings with vulcanized internal steel shims (Class A)","unit":"nr","defaultQty":0,"baseRateUsd":950,"spec":"CESMM4 M.320","formulaDesc":"2 bearings per beam end"},{"code":"BR-F400","desc":"In-situ composite reinforced concrete deck slab C40/50 including permanent GRP stay-in-place formwork","unit":"m²","defaultQty":0,"baseRateUsd":145,"spec":"CESMM4 F.310","formulaDesc":"Bridge width × Clear span length"}]},{"id":"sec-bridge-appurtenances","title":"Expansion Joints, Parapets & Scour Protection","classCode":"CESMM4 Class K/X","isCore":false,"items":[{"code":"BR-K100","desc":"Modular elastomeric finger-type expansion joints accommodating ±100mm thermal movement","unit":"m","defaultQty":0,"baseRateUsd":1100,"spec":"CESMM4 K.310","formulaDesc":"Deck width at abutment movement joints"},{"code":"BR-K200","desc":"High-containment aluminium / steel vehicle bridge parapet barrier conforming to EN 1317 H2 standard","unit":"m","defaultQty":0,"baseRateUsd":380,"spec":"CESMM4 K.210","formulaDesc":"Both sides of bridge deck length"},{"code":"BR-X100","desc":"Heavy rock rip-rap scour protection d50=500mm dumped on geotextile at pier footings in riverbeds","unit":"m³","defaultQty":0,"baseRateUsd":65,"spec":"CESMM4 X.120","formulaDesc":"Scour envelope volume around pier pads"}]}]},{"id":"tmpl-civil-rail","title":"Standard Gauge Railway & Transit Line","category":"civil","icon":"🚂","description":"Track formation, crushed stone ballast, prestressed concrete sleepers, UIC 60 rail, signaling ducting and turnouts.","defaultStandard":"CESMM4","defaultCountry":"UK","costRangeBenchmark":"$2.5M - $5.0M / km track","sections":[{"id":"sec-rail-subgrade","title":"Track Formation Earthworks & Sub-ballast","classCode":"CESMM4 Class E","isCore":true,"items":[{"code":"RL-E100","desc":"Heavy grading of track formation crossfall 1:30 with heavy vibratory compactors to 100% MDD","unit":"m²","defaultQty":0,"baseRateUsd":3.2,"spec":"CESMM4 E.520","formulaDesc":"Formation width 6.5m × Route length"},{"code":"RL-E200","desc":"Non-woven track geotextile separator/filter fabric 300g/m² laid on prepared formation","unit":"m²","defaultQty":0,"baseRateUsd":2.8,"spec":"CESMM4 E.610","formulaDesc":"Total formation footprint area"},{"code":"RL-E300","desc":"Graded crushed stone sub-ballast protective layer 150mm thick compacted","unit":"m³","defaultQty":0,"baseRateUsd":32,"spec":"CESMM4 E.340","formulaDesc":"Width × Length × 0.15m layer"}]},{"id":"sec-rail-trackwork","title":"Permanent Way, Ballast, Sleepers & Continuous Welded Rail","classCode":"CESMM4 Class R/M","isCore":true,"items":[{"code":"RL-R100","desc":"Crushed granite track ballast 25-65mm hard blue rock bottom-dumped and tamped 300mm under sleeper","unit":"m³","defaultQty":0,"baseRateUsd":38,"spec":"CESMM4 R.510","formulaDesc":"Ballast cross-section 1.6m³ per route metre"},{"code":"RL-R200","desc":"Prestressed concrete monoblock sleepers for 1435mm standard gauge spaced at 1667 sleepers/km","unit":"nr","defaultQty":0,"baseRateUsd":92,"spec":"CESMM4 R.520","formulaDesc":"Track length in km × 1,667 units"},{"code":"RL-R300","desc":"UIC 60 continuous welded rail Grade 900A fastened with Pandrol resilient elastic clips and rubber pads","unit":"m","defaultQty":0,"baseRateUsd":145,"spec":"CESMM4 R.530","formulaDesc":"Double rail length = 2 × Route length"},{"code":"RL-R400","desc":"Thermit aluminothermic flash-butt field welds linking rail strings into continuous welded rail","unit":"nr","defaultQty":0,"baseRateUsd":280,"spec":"CESMM4 R.540","formulaDesc":"Weld joints every 100m to 200m"}]},{"id":"sec-rail-systems","title":"Signaling Cable Troughs & Track Drainage","classCode":"CESMM4 Class I/J","isCore":false,"items":[{"code":"RL-J100","desc":"Precast concrete cable troughing Class C/1/10 laid alongside cess with interlocking lids","unit":"m","defaultQty":0,"baseRateUsd":48,"spec":"CESMM4 J.120","formulaDesc":"Continuous trackside communications duct"},{"code":"RL-I100","desc":"Trackside French cess drains filled with clean single-sized aggregate with perforated HDPE pipe","unit":"m","defaultQty":0,"baseRateUsd":56,"spec":"CESMM4 I.210","formulaDesc":"Parallel cess drainage trenches"}]}]},{"id":"tmpl-civil-airport","title":"International Airport Runway & Taxiway Pavement","category":"civil","icon":"✈️","description":"ICAO / FAA compliant airfield template: heavy PQC concrete aprons, Marshall asphalt runway, AGL lighting ducts and grooving.","defaultStandard":"CESMM4","defaultCountry":"US","costRangeBenchmark":"$15M - $45M / runway","sections":[{"id":"sec-airfield-earth","title":"Airfield Formation & Subgrade Stabilization","classCode":"CESMM4 Class E","isCore":true,"items":[{"code":"AP-E100","desc":"Lime / cement soil chemical stabilization 250mm depth to achieve minimum soaked CBR > 25%","unit":"m²","defaultQty":0,"baseRateUsd":7.5,"spec":"FAA P-152 / CESMM4","formulaDesc":"Runway width 60m × 3,500m length"},{"code":"AP-E200","desc":"Granular crushed stone sub-base layer 300mm compacted thickness in two 150mm lifts","unit":"m³","defaultQty":0,"baseRateUsd":34,"spec":"FAA P-209 / CESMM4","formulaDesc":"Runway footprint × 0.30m"}]},{"id":"sec-airfield-pave","title":"Heavy Duty Runway Asphalt & PQC Concrete Slabs","classCode":"CESMM4 Class R/F","isCore":true,"items":[{"code":"AP-R100","desc":"Heavy airfield Marshall asphalt binder course 100mm thickness designed for Boeing 777/A350 gear loads","unit":"m²","defaultQty":0,"baseRateUsd":34,"spec":"FAA P-401 / CESMM4","formulaDesc":"Runway surface area"},{"code":"AP-R200","desc":"Polymer modified asphalt wearing course 50mm with transverse saw-cut grooves 6mm × 6mm at 38mm centres","unit":"m²","defaultQty":0,"baseRateUsd":28,"spec":"FAA P-621 / Grooved","formulaDesc":"Runway touchdown zones and central strip"},{"code":"AP-F100","desc":"Pavement Quality Concrete (PQC) 450mm thickness flexural strength 4.5 MPa for taxiways & apron stands","unit":"m²","defaultQty":0,"baseRateUsd":92,"spec":"FAA P-501 / Concrete","formulaDesc":"Heavy aircraft parking bays & turn pads"}]},{"id":"sec-airfield-agl","title":"Airfield Ground Lighting (AGL) & Navigational Aids Ducts","classCode":"CESMM4 Class J/K","isCore":false,"items":[{"code":"AP-J100","desc":"Heavy-duty multi-way duct banks 4-way 150mm PVC encased in reinforced concrete under runways","unit":"m","defaultQty":0,"baseRateUsd":195,"spec":"ICAO Annex 14","formulaDesc":"Cross-runway electrical crossings"},{"code":"AP-K100","desc":"In-pavement shallow base cans for inset centerline and touchdown zone lighting fittings","unit":"nr","defaultQty":0,"baseRateUsd":650,"spec":"FAA L-868","formulaDesc":"Spacing every 15m along centerline"}]}]},{"id":"tmpl-water-pipeline","title":"Water Transmission Trunk Pipeline & Pumping Mains","category":"water","icon":"🚰","description":"Bulk raw & potable water pipeline template for ductile iron, steel, or HDPE transmission mains under CESMM4 Class I/J.","defaultStandard":"CESMM4","defaultCountry":"UK","costRangeBenchmark":"$350 - $850 / linear metre","sections":[{"id":"sec-pipe-trench","title":"Trench Excavation, Shoring & Granular Bedding","classCode":"CESMM4 Class I","isCore":true,"items":[{"code":"WP-I100","desc":"Trench excavation for nominal 600mm dia pipe, depth 1.5m to 2.5m in non-rock, including shoring and dewatering","unit":"m","defaultQty":0,"baseRateUsd":68,"spec":"CESMM4 I.110","formulaDesc":"Pipe trench run length"},{"code":"WP-I200","desc":"Graded pea gravel bedding 150mm depth beneath pipe barrel and side surround to 300mm above crown","unit":"m³","defaultQty":0,"baseRateUsd":38,"spec":"CESMM4 I.210","formulaDesc":"Trench width × Bedding depth × Length"}]},{"id":"sec-pipe-laying","title":"Ductile Iron / Steel Pipe Laying & Flanged Fittings","classCode":"CESMM4 Class I","isCore":true,"items":[{"code":"WP-I300","desc":"Ductile iron pressure pipe 600mm dia Class C40 with internal blast-furnace slag cement lining and external zinc coat","unit":"m","defaultQty":0,"baseRateUsd":280,"spec":"BS EN 545 / CESMM4","formulaDesc":"Total pipeline continuous length"},{"code":"WP-I400","desc":"All-flanged cast iron bends, tees, reducers and dismantling joints Class PN16","unit":"nr","defaultQty":0,"baseRateUsd":1450,"spec":"CESMM4 I.310","formulaDesc":"Count of alignment changes and junctions"},{"code":"WP-I500","desc":"In-situ concrete thrust blocks C20/25 at pipeline changes of direction and blank ends","unit":"m³","defaultQty":0,"baseRateUsd":195,"spec":"CESMM4 I.420","formulaDesc":"Engineered volume per anchor block"}]},{"id":"sec-pipe-chambers","title":"Valve Chambers, Washouts & Air Release Valves","classCode":"CESMM4 Class J","isCore":false,"items":[{"code":"WP-J100","desc":"Reinforced concrete air valve chambers complete with double orifice air valve and ductile iron access cover","unit":"nr","defaultQty":0,"baseRateUsd":4800,"spec":"CESMM4 J.210","formulaDesc":"High points along hydraulic pipeline profile"},{"code":"WP-J200","desc":"Scour washout chamber with drain branch discharging to nearby natural drainage swale","unit":"nr","defaultQty":0,"baseRateUsd":5200,"spec":"CESMM4 J.220","formulaDesc":"Valley low points of pipeline"}]},{"id":"sec-pipe-testing","title":"Hydrostatic Pressure Testing & Disinfection","classCode":"CESMM4 Class I","isCore":true,"items":[{"code":"WP-I600","desc":"Hydrostatic pressure testing in sections up to 1.5 times working pressure (16 bar test) for 24 hours","unit":"m","defaultQty":0,"baseRateUsd":12.5,"spec":"CESMM4 I.610","formulaDesc":"Total tested length of pipeline"},{"code":"WP-I700","desc":"Chlorination swabbing, sterile water flushing, and bacteriological water sampling certification","unit":"sum","defaultQty":0,"baseRateUsd":8500,"spec":"CESMM4 I.630","formulaDesc":"Potable water commissioning scheme"}]}]},{"id":"tmpl-water-drainage","title":"Urban Stormwater Drainage & Flood Alleviation","category":"water","icon":"🌊","description":"Precast RC box culverts, retention ponds, trapezoidal lined canals, and geotextile slope stabilization.","defaultStandard":"CESMM4","defaultCountry":"NG","costRangeBenchmark":"$450K - $1.8M / km canal","sections":[{"id":"sec-storm-channel","title":"Canal Excavation, Trimming & Dewatering","classCode":"CESMM4 Class E/F","isCore":true,"items":[{"code":"SD-E100","desc":"Open channel excavation in all soils, side slope trimming 1:1.5 and continuous pumping dewatering","unit":"m³","defaultQty":0,"baseRateUsd":6.8,"spec":"CESMM4 E.120","formulaDesc":"Trapezoidal cross-section × Length"},{"code":"SD-E200","desc":"Non-woven polypropylene geotextile needle-punched filter blanket 250g/m² beneath stone pitching","unit":"m²","defaultQty":0,"baseRateUsd":2.9,"spec":"CESMM4 E.610","formulaDesc":"Wetted perimeter surface area"}]},{"id":"sec-storm-culverts","title":"Precast Reinforced Concrete Box Culverts","classCode":"CESMM4 Class I/F","isCore":true,"items":[{"code":"SD-I100","desc":"Precast reinforced concrete box culvert units 3.0m width × 2.0m internal height on 150mm blended stone bed","unit":"m","defaultQty":0,"baseRateUsd":890,"spec":"CESMM4 I.320","formulaDesc":"Total culvert corridor run"},{"code":"SD-F100","desc":"Reinforced concrete headwalls, wingwalls and apron slabs C30/37 at culvert inlets and outlets","unit":"m³","defaultQty":0,"baseRateUsd":220,"spec":"CESMM4 F.120","formulaDesc":"Inlet and outfall structure volumes"}]},{"id":"sec-storm-attenuation","title":"Stormwater Retention Basin & Scour Aprons","classCode":"CESMM4 Class E/X","isCore":false,"items":[{"code":"SD-E300","desc":"Bulk basin excavation for 15,000m³ flood attenuation retention storage pond","unit":"m³","defaultQty":0,"baseRateUsd":5.5,"spec":"CESMM4 E.110","formulaDesc":"Basin design retention volume"},{"code":"SD-X100","desc":"Rock riprap gabion mattresses 0.3m thickness PVC-coated wire mesh for channel scour dissipation","unit":"m²","defaultQty":0,"baseRateUsd":48,"spec":"CESMM4 X.130","formulaDesc":"Outfall plunge pool protection area"}]}]},{"id":"tmpl-ind-solar","title":"Utility-Scale Solar PV Farm & Grid Substation (50MW+)","category":"industrial","icon":"☀️","description":"Utility solar energy infrastructure: pile ramming, tracking mounts, PV modules, DC/AC cabling, MV skids and 132kV substation.","defaultStandard":"CESMM4 / IEEE","defaultCountry":"US","costRangeBenchmark":"$0.75 - $1.05 / Watt Peak","sections":[{"id":"sec-solar-civil","title":"Site Preparation, Grading & Perimeter Security Fencing","classCode":"CESMM4 Class D/E","isCore":true,"items":[{"code":"PV-D100","desc":"Civil site contouring, topsoil preservation and environmental drainage swales for 80-hectare solar field","unit":"ha","defaultQty":0,"baseRateUsd":4200,"spec":"Civil Site Prep","formulaDesc":"Total solar farm site area"},{"code":"PV-K100","desc":"High-security anti-climb weldmesh perimeter fencing 2.4m height with automated entry gates & CCTV ducting","unit":"m","defaultQty":0,"baseRateUsd":65,"spec":"CESMM4 K.120","formulaDesc":"Total site boundary perimeter"}]},{"id":"sec-solar-mounts","title":"Driven Steel Piles & Single-Axis Solar Tracker Structures","classCode":"CESMM4 Class O/M","isCore":true,"items":[{"code":"PV-O100","desc":"Galvanized steel H-beam foundation piles hydraulically rammed into ground 2.0m to 2.5m embedment","unit":"nr","defaultQty":0,"baseRateUsd":110,"spec":"CESMM4 O.110","formulaDesc":"Piles required: approx 220 piles/MW"},{"code":"PV-M100","desc":"Single-axis horizontal solar tracker mounting torque tubes, slewing drives, brackets & motor controls","unit":"kWp","defaultQty":0,"baseRateUsd":95,"spec":"CESMM4 M.120","formulaDesc":"Rated peak capacity in kWp"}]},{"id":"sec-solar-electrical","title":"Solar PV Modules, DC Cabling & Inverter Power Skids","classCode":"CESMM4 Class J/Elect","isCore":true,"items":[{"code":"PV-J100","desc":"Bifacial TOPCon / Heterojunction 580W-650W Tier 1 Solar PV modules uncrating and mechanical installation","unit":"nr","defaultQty":0,"baseRateUsd":98,"spec":"IEC 61215 Standards","formulaDesc":"Modules count: approx 1,550 modules/MWp"},{"code":"PV-J200","desc":"Solar DC cabling 1500V UV-resistant strings in underground corrugated conduit backfilled with dune sand","unit":"m","defaultQty":0,"baseRateUsd":14.5,"spec":"EN 50618 DC Cable","formulaDesc":"String lengths to combiner boxes"},{"code":"PV-J300","desc":"Pre-assembled containerized 3.125 MVA central inverter station with MV step-up transformer (33kV)","unit":"nr","defaultQty":0,"baseRateUsd":165000,"spec":"IEC 60076 Power Skids","formulaDesc":"1 inverter station per 3.125 MW block"}]},{"id":"sec-solar-substation","title":"132kV / 33kV Step-Up Grid Substation & BESS Bases","classCode":"CESMM4 Class F/J","isCore":false,"items":[{"code":"PV-F100","desc":"Reinforced concrete foundation pads and oil containment bunds for 65 MVA main grid step-up transformer","unit":"m³","defaultQty":0,"baseRateUsd":280,"spec":"CESMM4 F.130","formulaDesc":"Transformer blast pad volumes"},{"code":"PV-J400","desc":"33kV GIS indoor switchgear panels and SCADA utility grid tie communication control room equipment","unit":"sum","defaultQty":0,"baseRateUsd":420000,"spec":"IEC 62271 Standards","formulaDesc":"Complete grid tie protection package"}]}]},{"id":"tmpl-ind-refinery","title":"Refinery Process Unit & Industrial Pipe Rack","category":"industrial","icon":"🛢️","description":"Process EPC measurement template for heavy foundations, multi-tier steel pipe racks, ASME B31.3 piping, valves and vessels.","defaultStandard":"ASME_B31","defaultCountry":"US","costRangeBenchmark":"$45M - $280M / unit","sections":[{"id":"sec-ref-civils","title":"Heavy Machine Foundations, Pavements & Bund Walls","classCode":"CESMM4 / API 650","isCore":true,"items":[{"code":"RF-F100","desc":"Reinforced concrete octagonal mat foundations C35/45 for heavy distillation fractionator columns","unit":"m³","defaultQty":0,"baseRateUsd":380,"spec":"ASME Section VIII Base","formulaDesc":"Octagonal foundation mat geometry"},{"code":"RF-F200","desc":"Hydrocarbon-resistant concrete paving slab 200mm with epoxy joint sealant and perimeter spill bund walls","unit":"m²","defaultQty":0,"baseRateUsd":78,"spec":"API RP 500 Paving","formulaDesc":"Battery limits process paved area"}]},{"id":"sec-ref-steel","title":"Structural Steel Multi-Tier Pipe Racks & Equipment Platforms","classCode":"CESMM4 Class M","isCore":true,"items":[{"code":"RF-M100","desc":"Hot-rolled structural steel universal columns & beams S355JR for 3-tier process pipe racks","unit":"tonne","defaultQty":0,"baseRateUsd":3850,"spec":"BS EN 10025 / AISC","formulaDesc":"Tonnage from 3D model frame takeoff"},{"code":"RF-M200","desc":"Open-grid serrated galvanized steel grating flooring 32mm × 5mm for maintenance access platforms","unit":"m²","defaultQty":0,"baseRateUsd":115,"spec":"CESMM4 M.230","formulaDesc":"Platform access footprint area"},{"code":"RF-M300","desc":"Passive fireproofing concrete / epoxy intumescent coating on steel columns up to 6m height","unit":"m²","defaultQty":0,"baseRateUsd":85,"spec":"API 2218 Fireproofing","formulaDesc":"Surface area of steel within fire envelope"}]},{"id":"sec-ref-piping","title":"ASME B31.3 Process Piping, Flanges, Valves & Radiography","classCode":"ASME B31.3","isCore":true,"items":[{"code":"RF-P100","desc":"ASTM A106 Gr B seamless carbon steel process pipe 12\" NPS Schedule 80 including field butt welds","unit":"m","defaultQty":0,"baseRateUsd":420,"spec":"ASME B31.3 Cat D/M","formulaDesc":"Process isometric centerline lengths"},{"code":"RF-P200","desc":"Class 600 forged carbon steel weld-neck flanges ASTM A105N with spiral wound graphite gaskets","unit":"nr","defaultQty":0,"baseRateUsd":340,"spec":"ASME B16.5 Standards","formulaDesc":"Count of equipment nozzles and tie-ins"},{"code":"RF-P300","desc":"Class 300 cast steel wedge gate valves with Stellite hard-faced trim conforming to API 600 / firesafe","unit":"nr","defaultQty":0,"baseRateUsd":2150,"spec":"API 600 / ISO 10434","formulaDesc":"P&ID valve schedule count"},{"code":"RF-P400","desc":"100% Non-destructive testing: gamma radiographic examination (RT) of pressure boundary girth butt welds","unit":"nr","defaultQty":0,"baseRateUsd":95,"spec":"ASME B31.3 Section 344","formulaDesc":"Total butt weld joints tested"}]}]},{"id":"tmpl-bld-commercial","title":"Multi-Storey Commercial Office Complex","category":"building","icon":"🏢","description":"RICS NRM2 elemental building template: basements, RC framed superstructure, curtain wall envelope, high-spec finishes and full MEP.","defaultStandard":"NRM2","defaultCountry":"UK","costRangeBenchmark":"$1,800 - $3,200 / m² GIA","sections":[{"id":"sec-bld-sub","title":"1. Substructure & Basement Excavation","classCode":"NRM2 Group 1","isCore":true,"items":[{"code":"NRM-1.1","desc":"Basement bulk excavation to 6.5m depth with secant pile retaining perimeter shoring wall","unit":"m³","defaultQty":0,"baseRateUsd":45,"spec":"NRM2 Section 1.1","formulaDesc":"Basement footprint × 6.5m depth"},{"code":"NRM-1.2","desc":"Reinforced concrete waterproof foundation raft slab 900mm thickness C35/45 mix","unit":"m³","defaultQty":0,"baseRateUsd":260,"spec":"NRM2 Section 1.2","formulaDesc":"Basement area × 0.90m thickness"}]},{"id":"sec-bld-frame","title":"2. Superstructure Frame & Upper Floors","classCode":"NRM2 Group 2","isCore":true,"items":[{"code":"NRM-2.1","desc":"Reinforced concrete superstructure columns, shear walls, cores and post-tensioned floor slabs","unit":"m²","defaultQty":0,"baseRateUsd":185,"spec":"NRM2 Section 2.1","formulaDesc":"Gross Internal Floor Area (GIA)"},{"code":"NRM-2.2","desc":"Structural steel transfer trusses and penthouse architectural steelwork framing","unit":"tonne","defaultQty":0,"baseRateUsd":3600,"spec":"NRM2 Section 2.2","formulaDesc":"Roof plant room steel tonnage"}]},{"id":"sec-bld-envelope","title":"3. External Envelope & Unitised Curtain Walling","classCode":"NRM2 Group 3","isCore":true,"items":[{"code":"NRM-3.1","desc":"Unitised double-glazed low-E argon filled solar control aluminium curtain walling system","unit":"m²","defaultQty":0,"baseRateUsd":480,"spec":"NRM2 Section 3.1","formulaDesc":"Total external facade perimeter × Height"},{"code":"NRM-3.2","desc":"Inverted insulated flat roofing system with single-ply waterproofing membrane and paving slabs","unit":"m²","defaultQty":0,"baseRateUsd":110,"spec":"NRM2 Section 3.2","formulaDesc":"Roof gross plan area"}]},{"id":"sec-bld-finishes","title":"4. Internal Finishes, Raised Floors & Partitions","classCode":"NRM2 Group 5","isCore":false,"items":[{"code":"NRM-5.1","desc":"Metal drywall acoustic partitions 100mm with double layer sound-rated plasterboard","unit":"m²","defaultQty":0,"baseRateUsd":65,"spec":"NRM2 Section 5.1","formulaDesc":"Internal dividing partition area"},{"code":"NRM-5.2","desc":"Heavy duty commercial raised access flooring 600mm × 600mm on adjustable steel pedestals","unit":"m²","defaultQty":0,"baseRateUsd":55,"spec":"NRM2 Section 5.2","formulaDesc":"Usable office floor net area"},{"code":"NRM-5.3","desc":"Suspended mineral fibre acoustic ceiling grid system with LED integrated lighting troffers","unit":"m²","defaultQty":0,"baseRateUsd":48,"spec":"NRM2 Section 5.3","formulaDesc":"Ceiling net area"}]},{"id":"sec-bld-mep","title":"5. Mechanical, Electrical & Lift Services (MEP)","classCode":"NRM2 Group 8","isCore":false,"items":[{"code":"NRM-8.1","desc":"VRV/VRF centralized 4-pipe fan coil air conditioning system with heat recovery fresh air AHU units","unit":"m²","defaultQty":0,"baseRateUsd":195,"spec":"NRM2 Section 8.1","formulaDesc":"Cost per m² conditioned GIA"},{"code":"NRM-8.2","desc":"Main electrical distribution, busbar risers, backup generator set and Cat6A structured network cabling","unit":"m²","defaultQty":0,"baseRateUsd":140,"spec":"NRM2 Section 8.2","formulaDesc":"Cost per m² serviced GIA"},{"code":"NRM-8.3","desc":"High-speed gearless passenger lifts 2.5 m/s 16-person capacity serving 10 levels","unit":"nr","defaultQty":0,"baseRateUsd":115000,"spec":"NRM2 Section 8.3","formulaDesc":"Elevator bank car count"}]}]},{"id":"tmpl-bld-residential","title":"Contemporary Multi-Unit Residential Housing Estate","category":"building","icon":"🏘️","description":"Residential houses and townhouse apartments: foundations, cavity blockwork, timber trusses, finishes, domestic plumbing and roads.","defaultStandard":"BESMM4 / NIQS","defaultCountry":"NG","costRangeBenchmark":"$650 - $1,100 / m² GIA","sections":[{"id":"sec-res-sub","title":"1. Substructure & Strip Footings","classCode":"BESMM4 Section D","isCore":true,"items":[{"code":"RES-D100","desc":"Trench excavation for strip footings not exceeding 1.5m deep in firm laterite soil","unit":"m³","defaultQty":0,"baseRateUsd":12,"spec":"BESMM4 D.10","formulaDesc":"Trench width 0.68m × depth × wall length"},{"code":"RES-D200","desc":"Mass concrete foundation footing C20/25 225mm thickness on clean sand blinding","unit":"m³","defaultQty":0,"baseRateUsd":165,"spec":"BESMM4 D.20","formulaDesc":"Width × Thickness × Perimeter"},{"code":"RES-D300","desc":"Oversite concrete slab 150mm thick C20/25 on 300mm hardcore bed with polythene DPM","unit":"m²","defaultQty":0,"baseRateUsd":28,"spec":"BESMM4 D.40","formulaDesc":"Building ground floor plan footprint"}]},{"id":"sec-res-walls","title":"2. Superstructure Walls & Partitions","classCode":"BESMM4 Section F","isCore":true,"items":[{"code":"RES-F100","desc":"9-inch (225mm) vibrated hollow sandcrete blocks bedded in cement-sand mortar (1:4)","unit":"m²","defaultQty":0,"baseRateUsd":22,"spec":"BESMM4 F.10","formulaDesc":"External wall surface net of openings"},{"code":"RES-F200","desc":"6-inch (150mm) vibrated sandcrete blocks for internal room dividing partitions","unit":"m²","defaultQty":0,"baseRateUsd":17,"spec":"BESMM4 F.20","formulaDesc":"Internal wall area net of door openings"}]},{"id":"sec-res-roof","title":"3. Roof Structure & Stone-Coated Coverings","classCode":"BESMM4 Section G/H","isCore":true,"items":[{"code":"RES-G100","desc":"Treated hardwood timber roof truss framework 50mm × 100mm and purlins","unit":"m²","defaultQty":0,"baseRateUsd":26,"spec":"BESMM4 G.10","formulaDesc":"Roof pitch surface plan area × 1.15"},{"code":"RES-H100","desc":"Stone-coated Gerard-type aluminium roofing tiles 0.55mm gauge with ridge caps and eaves flashings","unit":"m²","defaultQty":0,"baseRateUsd":32,"spec":"BESMM4 H.20","formulaDesc":"True pitched roof area"}]},{"id":"sec-res-finishes","title":"4. Plastering, Porcelain Tiles & Painting","classCode":"BESMM4 Section N/P","isCore":false,"items":[{"code":"RES-N100","desc":"Cement-sand rendering 15mm thick to walls and POP decorative plaster cornice mouldings","unit":"m²","defaultQty":0,"baseRateUsd":8.5,"spec":"BESMM4 N.10","formulaDesc":"Total wall internal & external area"},{"code":"RES-P100","desc":"Glazed vitrified porcelain floor tiles 600mm × 600mm bedded on cement screed","unit":"m²","defaultQty":0,"baseRateUsd":24,"spec":"BESMM4 P.20","formulaDesc":"Interior floor net usable area"},{"code":"RES-P200","desc":"Emulsion paint 3 coats on interior walls and durable weather-shield acrylic on exterior walls","unit":"m²","defaultQty":0,"baseRateUsd":4.5,"spec":"BESMM4 P.40","formulaDesc":"Total paintable wall surface"}]},{"id":"sec-res-mep","title":"5. Domestic Plumbing, Sanitaryware & Electrical","classCode":"BESMM4 Section R/S","isCore":false,"items":[{"code":"RES-R100","desc":"Complete domestic plumbing installation: PPR cold/hot water pipework and sanitary ceramic suites","unit":"nr","defaultQty":0,"baseRateUsd":1450,"spec":"BESMM4 R.10","formulaDesc":"Bathroom & kitchen counts"},{"code":"RES-S100","desc":"Domestic electrical wiring in conduit, distribution boards, switches, sockets and LED lights","unit":"sum","defaultQty":0,"baseRateUsd":8500,"spec":"BESMM4 S.10","formulaDesc":"Per residential unit installation"}]}]}];

  // State for user custom saved templates (persisted in localStorage)
  const [userSavedTemplates, setUserSavedTemplates] = _.useState(() => {
    try {
      const stored = localStorage.getItem("letsestimate_user_templates_v2");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load user templates from localStorage", e);
    }
    return [
      {
        id: "usr-tmpl-01",
        title: "UK Smart Motorway Widening & VMS Gantries (NRM / CESMM4)",
        category: "civil",
        icon: "🛣️",
        description: "Customized 4-lane smart motorway upgrade with emergency refuge areas and overhead gantry cantilever frames.",
        defaultStandard: "CESMM4",
        defaultCountry: "UK",
        costRangeBenchmark: "£2.2M - £3.8M / km",
        version: "v1.2",
        author: "Emmanuel Isaac, Lead QS",
        lastModified: "2026-10-18",
        sections: [
          {
            id: "sec-sm-prelim",
            title: "Preliminaries & Smart Motorway Traffic Phasing",
            classCode: "CESMM4 Class A",
            isCore: true,
            items: [
              { code: "SM-A100", desc: "Temporary 50mph average speed camera enforcement zones, narrow lane delineators and mobile crash cushions", unit: "sum", defaultQty: 0, baseRateUsd: 110000, spec: "CESMM4 A.240", formulaDesc: "Contract traffic phasing package" },
              { code: "SM-A200", desc: "Contractor temporary site offices and heavy recovery vehicle continuous standby depot", unit: "month", defaultQty: 0, baseRateUsd: 18500, spec: "CESMM4 A.110", formulaDesc: "18 months duration" }
            ]
          },
          {
            id: "sec-sm-gantry",
            title: "Super-Span Variable Message Sign (VMS) Gantries",
            classCode: "CESMM4 Class M/F",
            isCore: true,
            items: [
              { code: "SM-M100", desc: "Structural steel portal gantry 34m span spanning 4 live traffic lanes fabricated from S355NH hollow sections", unit: "nr", defaultQty: 0, baseRateUsd: 145000, spec: "Highways England BD 51/14", formulaDesc: "Gantry spacing every 800m" },
              { code: "SM-F100", desc: "Reinforced concrete mass gravity bored pile footing 1500mm dia with holding down bolt assemblies", unit: "nr", defaultQty: 0, baseRateUsd: 24000, spec: "CESMM4 F.120", formulaDesc: "4 foundation pads per gantry" }
            ]
          },
          {
            id: "sec-sm-pave",
            title: "Hard Shoulder Conversion & High-Friction Resurfacing",
            classCode: "CESMM4 Class R",
            isCore: true,
            items: [
              { code: "SM-R100", desc: "Cold milling and planing existing bituminous surfacing 100mm depth and vacuum sweeping", unit: "m²", defaultQty: 0, baseRateUsd: 4.8, spec: "CESMM4 R.110", formulaDesc: "Hard shoulder length × 3.65m" },
              { code: "SM-R200", desc: "High-friction bauxite epoxy resin surface treatment 5mm thickness for emergency refuge bays", unit: "m²", defaultQty: 0, baseRateUsd: 38, spec: "BS 273", formulaDesc: "Emergency refuge bays footprint" }
            ]
          }
        ]
      }
    ];
  });

  const persistUserTemplates = (newTemplates) => {
    setUserSavedTemplates(newTemplates);
    try {
      localStorage.setItem("letsestimate_user_templates_v2", JSON.stringify(newTemplates));
    } catch (e) {
      console.error("Failed to persist user templates", e);
    }
  };

  const [selectedTemplateSector, setSelectedTemplateSector] = _.useState("all");
  const [templateSearchQuery, setTemplateSearchQuery] = _.useState("");
  const [selectedCountryFilter, setSelectedCountryFilter] = _.useState("UK");
  const [customizingTemplate, setCustomizingTemplate] = _.useState(null);
  const [customizerCountry, setCustomizerCountry] = _.useState("UK");
  const [customizerStandard, setCustomizerStandard] = _.useState("CESMM4");
  const [customizerTemplateMode, setCustomizerTemplateMode] = _.useState("full");
  const [customizerSections, setCustomizerSections] = _.useState([]);
  const [customizerTitle, setCustomizerTitle] = _.useState("");
  const [customizerNotes, setCustomizerNotes] = _.useState("");
  const [expandedSectionIds, setExpandedSectionIds] = _.useState({});
  const [isSaveCustomModalOpen, setIsSaveCustomModalOpen] = _.useState(false);
  const [newTemplateVersion, setNewTemplateVersion] = _.useState("v1.0");
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = _.useState(false);
  const [newSectionForm, setNewSectionForm] = _.useState({ title: "", classCode: "CESMM4 Class General", isCore: true });
  const [isAddItemToSectionId, setIsAddItemToSectionId] = _.useState(null);
  const [newItemForm, setNewItemForm] = _.useState({ code: "", desc: "", unit: "m³", defaultQty: 0, baseRateUsd: 100, spec: "", formulaDesc: "" });

  const handleOpenCustomizer = (tmpl) => {
    setCustomizingTemplate(tmpl);
    setCustomizerTitle(tmpl.title);
    setCustomizerCountry(tmpl.defaultCountry || selectedCountryFilter || "UK");
    setCustomizerStandard(tmpl.defaultStandard || "CESMM4");
    setCustomizerTemplateMode("full");
    setCustomizerNotes(tmpl.description || "");
    const clonedSections = tmpl.sections.map(sec => ({
      ...sec,
      enabled: true,
      items: sec.items.map(it => ({ ...it }))
    }));
    setCustomizerSections(clonedSections);
    if (clonedSections[0]) {
      setExpandedSectionIds({ [clonedSections[0].id]: true });
    }
  };

  const handleToggleSection = (secId) => {
    setCustomizerSections(prev => prev.map(s => {
      if (s.id === secId) return { ...s, enabled: !s.enabled };
      return s;
    }));
  };

  const handleToggleSectionExpand = (secId) => {
    setExpandedSectionIds(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const handleSetTemplateMode = (mode) => {
    setCustomizerTemplateMode(mode);
    setCustomizerSections(prev => prev.map(s => {
      if (mode === "minimal") {
        return { ...s, enabled: !!s.isCore };
      }
      return { ...s, enabled: true };
    }));
    notify(mode === "minimal" ? "Switched to Minimal Template (disabled optional non-core sections)" : "Enabled all sections for Full Project Template");
  };

  const handleDeleteSection = (secId) => {
    setCustomizerSections(prev => prev.filter(s => s.id !== secId));
    notify("Removed section from estimate template");
  };

  const handleAddCustomSection = () => {
    if (!newSectionForm.title.trim()) {
      alert("Please enter a section title");
      return;
    }
    const newSec = {
      id: "sec-custom-" + Date.now(),
      title: newSectionForm.title.trim(),
      classCode: newSectionForm.classCode.trim() || "Custom Section",
      isCore: true,
      enabled: true,
      items: []
    };
    setCustomizerSections(prev => [...prev, newSec]);
    setExpandedSectionIds(prev => ({ ...prev, [newSec.id]: true }));
    setIsAddSectionModalOpen(false);
    setNewSectionForm({ title: "", classCode: "CESMM4 Class General", isCore: true });
    notify("Added custom work section: " + newSec.title);
  };

  const handleAddItemToSection = (secId) => {
    if (!newItemForm.desc.trim()) {
      alert("Please enter an item description");
      return;
    }
    const newItem = {
      code: newItemForm.code.trim() || ("ITEM-" + (Math.floor(Math.random() * 900) + 100)),
      desc: newItemForm.desc.trim(),
      unit: newItemForm.unit.trim() || "item",
      defaultQty: 0,
      baseRateUsd: Number(newItemForm.baseRateUsd) || 50,
      spec: newItemForm.spec.trim() || "Project Specification",
      formulaDesc: newItemForm.formulaDesc.trim() || "Measured work item"
    };
    setCustomizerSections(prev => prev.map(s => {
      if (s.id === secId) {
        return { ...s, items: [...s.items, newItem] };
      }
      return s;
    }));
    setIsAddItemToSectionId(null);
    setNewItemForm({ code: "", desc: "", unit: "m³", defaultQty: 0, baseRateUsd: 100, spec: "", formulaDesc: "" });
    notify("Added item to section: " + newItem.code);
  };

  const handleDeleteItem = (secId, itemCode) => {
    setCustomizerSections(prev => prev.map(s => {
      if (s.id === secId) {
        return { ...s, items: s.items.filter(it => it.code !== itemCode) };
      }
      return s;
    }));
    notify("Removed item from section");
  };

  const getCustomizerRate = (baseRateUsd) => {
    const c = countriesConfig[customizerCountry] || countriesConfig.UK;
    const converted = baseRateUsd * c.rateMultiplierUsd;
    if (c.currency === "NGN" || c.currency === "KES") return Math.round(converted);
    return Number(converted.toFixed(2));
  };

  const formatCustomizerMoney = (amount) => {
    const c = countriesConfig[customizerCountry] || countriesConfig.UK;
    const num = Number(amount || 0);
    if (c.currency === "NGN") return "₦" + Math.round(num).toLocaleString("en-NG");
    if (c.currency === "GBP") return "£" + num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (c.currency === "AUD") return "A$" + num.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (c.currency === "CAD") return "C$" + num.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (c.currency === "AED") return num.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " AED";
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleApplyTemplateToEstimate = () => {
    const enabledSections = customizerSections.filter(s => s.enabled);
    if (enabledSections.length === 0) {
      alert("Please enable at least one work section before applying to estimate.");
      return;
    }
    const cConfig = countriesConfig[customizerCountry] || countriesConfig.UK;
    const targetCurrency = cConfig.currency;
    const isNgn = targetCurrency === "NGN";

    let newItemList = [];
    let billCounter = 1;
    enabledSections.forEach(sec => {
      sec.items.forEach((it, itIdx) => {
        const rateInTarget = getCustomizerRate(it.baseRateUsd);
        const rateNgn = isNgn ? rateInTarget : Math.round(it.baseRateUsd * 1550);
        newItemList.push({
          id: "cw-" + (sec.id) + "-" + itIdx + "-" + Date.now(),
          sector: sec.title.toLowerCase().includes("earth") ? "earthworks" :
                  sec.title.toLowerCase().includes("pave") ? "pavement" :
                  sec.title.toLowerCase().includes("drain") ? "drainage" :
                  sec.title.toLowerCase().includes("bridge") || sec.title.toLowerCase().includes("pile") || sec.title.toLowerCase().includes("pier") ? "bridges" :
                  sec.title.toLowerCase().includes("prelim") ? "preliminaries" : "tunnels",
          billNo: billCounter,
          code: it.code || ("CES-" + billCounter),
          classTitle: sec.title + " (" + sec.classCode + ")",
          itemDesc: it.desc,
          unit: it.unit || "item",
          qty: 0,
          rateNgn: rateNgn,
          rateUsd: it.baseRateUsd,
          specStandard: it.spec || customizerStandard,
          notes: (it.formulaDesc || "Measured per standard rules") + " • " + cConfig.name + " (" + targetCurrency + ")",
          calc: {
            formula: it.formulaDesc || "Length × Width × Depth",
            length: 0,
            width: 0,
            depth: 0,
            timesing: 1,
            deductions: 0,
            wasteFactor: 0,
            smmRule: customizerStandard + ": Measured in accordance with standard rules."
          }
        });
      });
      billCounter++;
    });

    if (confirm("Apply '" + customizerTitle + "' with " + enabledSections.length + " sections (" + newItemList.length + " items) to your active estimate?\n\nThis will load the customized schedule items.")) {
      setCivilScheduleItems(newItemList);
      if (targetCurrency === "USD" || targetCurrency === "GBP" || targetCurrency === "AUD" || targetCurrency === "CAD" || targetCurrency === "AED") {
        setCivilCurrency("USD");
      } else {
        setCivilCurrency("NGN");
      }
      setCustomizingTemplate(null);
      setActiveTab("schedule");
      notify("Successfully generated new estimate from '" + customizerTitle + "' with " + newItemList.length + " items!");
    }
  };

  const handleSaveAsReusableTemplate = () => {
    const enabledSections = customizerSections.filter(s => s.enabled);
    if (enabledSections.length === 0) {
      alert("Please enable at least one section before saving template.");
      return;
    }
    const newCustomTmpl = {
      id: "usr-" + Date.now(),
      title: customizerTitle.trim() || "Custom Construction Template",
      category: customizingTemplate ? customizingTemplate.category : "civil",
      icon: customizingTemplate ? customizingTemplate.icon : "📋",
      description: customizerNotes.trim() || ("Custom template with " + enabledSections.length + " sections."),
      defaultStandard: customizerStandard,
      defaultCountry: customizerCountry,
      costRangeBenchmark: "Custom Project Benchmark",
      version: newTemplateVersion || "v1.0",
      author: "Quantity Surveyor",
      lastModified: new Date().toISOString().split("T")[0],
      sections: customizerSections.map(s => ({
        ...s,
        items: s.items.map(it => ({ ...it }))
      }))
    };
    const updated = [newCustomTmpl, ...userSavedTemplates];
    persistUserTemplates(updated);
    setIsSaveCustomModalOpen(false);
    notify("Saved '" + newCustomTmpl.title + "' (" + newCustomTmpl.version + ") to your Reusable Template Library!");
  };

  const handleExportTemplateExcel = () => {
    const enabledSections = customizerSections.filter(s => s.enabled);
    const cConfig = countriesConfig[customizerCountry] || countriesConfig.UK;
    const sanitize = (val) => {
      if (val == null) return '""';
      const s = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ').replace(/"/g, '""');
      return '"' + s.trim() + '"';
    };
    const lines = [];
    lines.push([sanitize("LET'S ESTIMATE - REUSABLE CONSTRUCTION TEMPLATE")].join(","));
    lines.push([sanitize("Template:"), sanitize(customizerTitle), sanitize("Standard:"), sanitize(customizerStandard)].join(","));
    lines.push([sanitize("Country:"), sanitize(cConfig.name), sanitize("Currency:"), sanitize(cConfig.currency), sanitize("Date:"), sanitize(new Date().toLocaleDateString("en-GB"))].join(","));
    lines.push("");
    lines.push([
      "Bill No", "Section Title", "Classification Code", "Item Code", "Work Description", "Unit", "Takeoff Qty", "Benchmark Rate (" + cConfig.currency + ")", "Typical Formula / Dimension", "Specification Clause"
    ].map(sanitize).join(","));
    let billNum = 1;
    enabledSections.forEach(sec => {
      sec.items.forEach(it => {
        lines.push([
          billNum,
          sanitize(sec.title),
          sanitize(sec.classCode),
          sanitize(it.code),
          sanitize(it.desc),
          sanitize(it.unit),
          0,
          getCustomizerRate(it.baseRateUsd),
          sanitize(it.formulaDesc),
          sanitize(it.spec)
        ].join(","));
      });
      billNum++;
    });
    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = customizerTitle.replace(/[^a-zA-Z0-9_-]/g, "_") + "_Template_" + customizerCountry + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify("Exported Arranged Template CSV for Excel!");
  };

  const allAvailableTemplates = [...systemTemplatesDatabase, ...userSavedTemplates];
  const filteredTemplates = allAvailableTemplates.filter(t => {
    if (selectedTemplateSector === "saved") return t.id.startsWith("usr-");
    if (selectedTemplateSector !== "all" && t.category !== selectedTemplateSector) return false;
    if (templateSearchQuery) {
      const q = templateSearchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || "").toLowerCase().includes(q);
      const matchStd = (t.defaultStandard || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchStd) return false;
    }
    return true;
  });

  return e.jsxs("div", {
    className: "space-y-6 pb-16 animate-fade-in",
    children: [
      // Top Notification Alert
      actionNotice && e.jsxs("div", {
        className: "p-3.5 rounded-xl bg-blue-900 text-white font-bold text-xs shadow-md flex items-center justify-between animate-slide-down",
        children: [
          e.jsxs("div", { className: "flex items-center gap-2", children: [e.jsx("span", { children: "ℹ️" }), actionNotice] }),
          e.jsx("button", { onClick: () => setActionNotice(null), className: "text-blue-200 hover:text-white font-black cursor-pointer", children: "✕" })
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
                      e.jsx("span", { className: "text-2xl", children: "🛣️" }),
                      e.jsx("h1", { className: "text-xl font-black tracking-tight", children: "Civil Infrastructure & Roads Studio" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider", children: "CESMM4 / FMW Standards" })
                    ]
                  }),
                  e.jsx("p", { className: "text-xs text-slate-300", children: "Engineering Takeoff, Project Material Schedule, Cross-Section Specifications, and Bill of Engineering Measurement and Evaluation (BEME)." })
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
                        onClick: () => setCivilCurrency("NGN"),
                        className: "px-2.5 py-1 rounded-lg font-bold transition cursor-pointer " + (civilCurrency === "NGN" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"),
                        children: "₦ NGN"
                      }),
                      e.jsx("button", {
                        type: "button",
                        onClick: () => setCivilCurrency("USD"),
                        className: "px-2.5 py-1 rounded-lg font-bold transition cursor-pointer " + (civilCurrency === "USD" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"),
                        children: "$ USD"
                      })
                    ]
                  }),
                  // Commit to BOQ
                  e.jsxs("button", {
                    type: "button",
                    onClick: handleCommitScheduleToAppBoq,
                    className: "px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    children: [e.jsx("span", { children: "💾" }), "Commit to BOQ"]
                  })
                ]
              })
            ]
          }),

          // Dedicated Active Civil Project Selector Banner
          e.jsxs("div", {
            className: "pt-3 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl",
            children: [
              e.jsxs("div", {
                className: "flex items-center gap-2.5 flex-1 min-w-0",
                children: [
                  e.jsx("span", { className: "text-slate-400 shrink-0 font-bold", children: "Active Civil Project:" }),
                  e.jsx("select", {
                    value: selectedProjectId,
                    onChange: (e) => {
                      setSelectedProjectId(e.target.value);
                      notify("Loaded project materials & parameters for " + e.target.options[e.target.selectedIndex].text);
                    },
                    className: "bg-slate-800 text-white font-black text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer w-full max-w-lg truncate",
                    children: mergedCivilProjects.map(p => e.jsx("option", { key: p.id, value: p.id, children: p.title + " (" + p.type + ")" }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: () => setActiveTab("templates"),
                    className: "inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-xs transition cursor-pointer shrink-0 border border-emerald-500/40 active:scale-95",
                    title: "Open Reusable Construction Template Library with International & Nigerian Standards",
                    children: [
                      e.jsx("span", { children: "📐" }),
                      e.jsx("span", { children: "Template Library" }),
                      e.jsx("span", { className: "px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-900 text-emerald-200 border border-emerald-400/40", children: "INTL" })
                    ]
                  }))
                  })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-3 text-slate-300 font-mono text-[11px] shrink-0",
                children: [
                  e.jsxs("span", { children: ["Standard: ", e.jsx("strong", { className: "text-amber-400", children: activeCivilProject.smmStandard })] }),
                  activeCivilProject.lengthKm > 0 && e.jsxs("span", { children: ["Length: ", e.jsx("strong", { className: "text-emerald-400", children: activeCivilProject.lengthKm + " km" })] }),
                  activeCivilProject.carriagewayWidthM > 0 && e.jsxs("span", { children: ["Width: ", e.jsx("strong", { className: "text-blue-400", children: activeCivilProject.carriagewayWidthM + " m" })] })
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
            onClick: () => setActiveTab("templates"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "templates" ? "bg-white text-emerald-800 shadow-xs font-black ring-1 ring-emerald-500/30" : "text-slate-600 hover:text-slate-900"),
            children: [
              e.jsx("span", { children: "📐" }),
              e.jsx("span", { children: "Construction Template Library" }),
              e.jsx("span", { className: "px-1.5 py-0.5 rounded-full text-[9px] font-black " + (activeTab === "templates" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"), children: "INTL" })
            ]
          }),
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("schedule"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "schedule" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "📋" }), "Takeoff & BEME Items (", civilScheduleItems.length, ")"]
          }),
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("material_schedule"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "material_schedule" ? "bg-white text-blue-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "📦" }), "Project Materials Schedule (", currentMaterialsList.length, ")"]
          }),
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("specifications"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "specifications" ? "bg-white text-purple-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "📜" }), "Engineering Specifications & Standards (", specDocuments.length, ")"]
          }),
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("pavement_design"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "pavement_design" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "🛣️" }), "Pavement Structure"]
          }),
          e.jsxs("button", {
            type: "button",
            onClick: () => setActiveTab("methodology"),
            className: "px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 " + (activeTab === "methodology" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
            children: [e.jsx("span", { children: "📖" }), "CESMM4 Guidelines"]
          })
        ]
      }),

      // =====================================================================
      // TAB 1: TAKEOFF & BEME ITEMS SCHEDULE (WITH COLLAPSIBLE CALCULATIONS ON EVERY ITEM)
      // All figures start at 0, no assumptions, with cursor fix
      // =====================================================================

      // =====================================================================
      // 0. CONSTRUCTION TEMPLATE LIBRARY TAB (INTERNATIONAL-FIRST ARCHITECTURE)
      // =====================================================================
      activeTab === "templates" && e.jsxs("div", {
        className: "space-y-6 animate-fade-in",
        children: [
          // Header Hero Banner
          e.jsxs("div", {
            className: "bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4",
            children: [
              e.jsxs("div", {
                className: "space-y-1.5 max-w-2xl",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2.5",
                    children: [
                      e.jsx("span", { className: "text-2xl", children: "📐" }),
                      e.jsx("h2", { className: "text-xl font-black text-white tracking-tight", children: "Reusable Construction Template Library" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40", children: "Global Standard" })
                    ]
                  }),
                  e.jsx("p", {
                    className: "text-xs text-slate-300 leading-relaxed font-medium",
                    children: "Architected for international civil & building projects with configurable measurement standards (CESMM4, NRM2, BESMM4, AASHTO, POMI) and country cost databases (UK, USA, Nigeria, Australia, Canada, UAE). Never start an estimate from a blank page."
                  })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-2 self-start md:self-center shrink-0",
                children: [
                  e.jsxs("button", {
                    type: "button",
                    onClick: () => setSelectedTemplateSector("saved"),
                    className: "px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 " + (selectedTemplateSector === "saved" ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300" : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"),
                    children: [
                      e.jsx("span", { children: "💾" }),
                      e.jsxs("span", { children: ["My Saved Templates (", userSavedTemplates.length, ")"] })
                    ]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: () => {
                      const sampleTmpl = systemTemplatesDatabase[0];
                      handleOpenCustomizer({
                        ...sampleTmpl,
                        id: "custom-blank-" + Date.now(),
                        title: "New Custom Construction Estimate",
                        sections: []
                      });
                      setIsAddSectionModalOpen(true);
                    },
                    className: "px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer",
                    children: [
                      e.jsx("span", { children: "+" }),
                      e.jsx("span", { children: "Create Custom Template" })
                    ]
                  })
                ]
              })
            ]
          }),

          // 3-Layer Filter & Selector Bar: Project Type | Country Database | Measurement Standard
          e.jsxs("div", {
            className: "bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4",
            children: [
              // Row 1: Sector / Project Type Filter Pills
              e.jsxs("div", {
                className: "flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100",
                children: [
                  e.jsxs("div", {
                    className: "flex flex-wrap items-center gap-1.5",
                    children: [
                      e.jsx("span", { className: "text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mr-1", children: "Sector:" }),
                      [
                        { id: "all", label: "All Templates (" + allAvailableTemplates.length + ")" },
                        { id: "civil", label: "🛣️ Civil & Transport" },
                        { id: "water", label: "🚰 Water & Drainage" },
                        { id: "industrial", label: "☀️ Industrial & Energy" },
                        { id: "building", label: "🏢 Buildings & Property" },
                        { id: "saved", label: "💾 My Saved (" + userSavedTemplates.length + ")" }
                      ].map(tab => e.jsx("button", {
                        key: tab.id,
                        type: "button",
                        onClick: () => setSelectedTemplateSector(tab.id),
                        className: "px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer " + (selectedTemplateSector === tab.id ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 hover:bg-slate-200 text-slate-700"),
                        children: tab.label
                      }))
                    ]
                  }),
                  // Search Box
                  e.jsx("div", {
                    className: "relative w-full sm:w-64",
                    children: e.jsx("input", {
                      type: "text",
                      placeholder: "Search templates or standards...",
                      value: templateSearchQuery,
                      onChange: (e) => setTemplateSearchQuery(e.target.value),
                      className: "w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-slate-800"
                    })
                  })
                ]
              }),

              // Row 2: Active Country Database & Measurement Standard Explainer
              e.jsxs("div", {
                className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-2.5",
                    children: [
                      e.jsx("span", { className: "text-slate-500 font-black text-[10px] uppercase tracking-wider", children: "Default Pricing Database:" }),
                      e.jsx("select", {
                        value: selectedCountryFilter,
                        onChange: (e) => {
                          setSelectedCountryFilter(e.target.value);
                          notify("Active benchmark cost database set to: " + countriesConfig[e.target.value].name + " (" + countriesConfig[e.target.value].currency + ")");
                        },
                        className: "bg-white text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1 border border-slate-300 focus:outline-hidden focus:border-slate-700 cursor-pointer shadow-2xs",
                        children: Object.keys(countriesConfig).map(cCode => {
                          const c = countriesConfig[cCode];
                          return e.jsx("option", { key: cCode, value: cCode, children: c.flag + " " + c.name + " (" + c.currency + " - " + c.symbol + ")" });
                        })
                      })
                    ]
                  }),
                  e.jsxs("div", {
                    className: "flex items-center gap-2 text-[11px] text-slate-600 font-medium",
                    children: [
                      e.jsx("span", { children: "💡" }),
                      e.jsx("span", { children: "Selecting a template auto-configures its standard and converts rates into your selected country currency." })
                    ]
                  })
                ]
              })
            ]
          }),

          // Template Cards Grid
          e.jsx("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
            children: filteredTemplates.map(tmpl => {
              const defaultC = countriesConfig[tmpl.defaultCountry || selectedCountryFilter] || countriesConfig.UK;
              const totalItems = tmpl.sections.reduce((acc, s) => acc + (s.items ? s.items.length : 0), 0);
              const isUserCustom = tmpl.id.startsWith("usr-");
              return e.jsxs("div", {
                key: tmpl.id,
                className: "bg-white rounded-2xl border border-slate-200/80 hover:border-slate-400/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group",
                children: [
                  // Card Header
                  e.jsxs("div", {
                    className: "p-5 space-y-3",
                    children: [
                      e.jsxs("div", {
                        className: "flex items-start justify-between gap-2",
                        children: [
                          e.jsxs("div", {
                            className: "flex items-center gap-2.5",
                            children: [
                              e.jsx("span", { className: "text-2xl p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0", children: tmpl.icon || "📋" }),
                              e.jsxs("div", {
                                children: [
                                  e.jsx("h3", { className: "font-black text-slate-900 text-sm group-hover:text-emerald-700 transition leading-tight", children: tmpl.title }),
                                  e.jsxs("div", {
                                    className: "flex items-center gap-2 mt-0.5",
                                    children: [
                                      e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: tmpl.category.toUpperCase() }),
                                      e.jsx("span", { className: "text-slate-300", children: "•" }),
                                      e.jsxs("span", { className: "text-[10px] font-bold text-slate-600", children: [defaultC.flag, " ", defaultC.name] })
                                    ]
                                  })
                                ]
                              })
                            ]
                          }),
                          isUserCustom && e.jsx("span", {
                            className: "px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 shrink-0",
                            children: tmpl.version || "Custom"
                          })
                        ]
                      }),
                      e.jsx("p", { className: "text-xs text-slate-600 leading-relaxed font-normal line-clamp-2", children: tmpl.description }),

                      // Badges: Standard & Benchmark
                      e.jsxs("div", {
                        className: "flex flex-wrap items-center gap-1.5 pt-1",
                        children: [
                          e.jsx("span", {
                            className: "px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200",
                            children: tmpl.defaultStandard
                          }),
                          e.jsx("span", {
                            className: "px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200",
                            children: tmpl.costRangeBenchmark
                          })
                        ]
                      }),

                      // Work Sections Preview Tags
                      e.jsxs("div", {
                        className: "pt-2 border-t border-slate-100 space-y-1.5",
                        children: [
                          e.jsxs("div", {
                            className: "flex items-center justify-between text-[11px] font-black text-slate-700",
                            children: [
                              e.jsxs("span", { children: [tmpl.sections.length, " Work Sections"] }),
                              e.jsxs("span", { className: "text-slate-500 font-medium", children: [totalItems, " Line Items"] })
                            ]
                          }),
                          e.jsx("div", {
                            className: "flex flex-wrap gap-1",
                            children: tmpl.sections.slice(0, 4).map((s, sIdx) => e.jsx("span", {
                              key: sIdx,
                              className: "text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium truncate max-w-[140px]",
                              children: s.title
                            })).concat(tmpl.sections.length > 4 ? [e.jsx("span", { key: "more", className: "text-[10px] text-slate-400 font-bold px-1", children: "+" + (tmpl.sections.length - 4) + " more" })] : [])
                          })
                        ]
                      })
                    ]
                  }),

                  // Card Footer Action Buttons
                  e.jsxs("div", {
                    className: "p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2",
                    children: [
                      e.jsxs("button", {
                        type: "button",
                        onClick: () => handleOpenCustomizer(tmpl),
                        className: "flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer",
                        children: [
                          e.jsx("span", { children: "⚙️" }),
                          e.jsx("span", { children: "Customize Template" })
                        ]
                      }),
                      isUserCustom ? e.jsx("button", {
                        type: "button",
                        onClick: () => {
                          if (confirm("Delete custom template '" + tmpl.title + "' from your library?")) {
                            const updated = userSavedTemplates.filter(ut => ut.id !== tmpl.id);
                            persistUserTemplates(updated);
                            notify("Deleted custom template.");
                          }
                        },
                        className: "p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold transition cursor-pointer",
                        title: "Delete custom template",
                        children: "🗑️"
                      }) : e.jsx("button", {
                        type: "button",
                        onClick: () => {
                          handleOpenCustomizer(tmpl);
                          setTimeout(() => {
                            const btn = document.getElementById("apply-template-instant-btn");
                            if (btn) btn.click();
                          }, 50);
                        },
                        className: "p-2 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 font-bold transition cursor-pointer",
                        title: "Instant Apply to Active Estimate",
                        children: "⚡"
                      })
                    ]
                  })
                ]
              });
            })
          }),

          // ===================================================================
          // MODAL: INTERACTIVE TEMPLATE CUSTOMIZER & WORK SECTION MANAGER
          // ===================================================================
          customizingTemplate && e.jsx("div", {
            className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fade-in",
            children: e.jsxs("div", {
              className: "bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto",
              children: [
                // Modal Header
                e.jsxs("div", {
                  className: "p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  children: [
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            e.jsx("span", { className: "text-2xl", children: customizingTemplate.icon || "📐" }),
                            e.jsx("h2", { className: "text-lg font-black text-white tracking-tight", children: customizerTitle })
                          ]
                        }),
                        e.jsx("p", { className: "text-xs text-slate-300 font-medium", children: "Toggle work sections, edit line items, choose standard and regional cost database." })
                      ]
                    }),
                    // Top Right Close button
                    e.jsx("button", {
                      type: "button",
                      onClick: () => setCustomizingTemplate(null),
                      className: "self-end sm:self-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer font-bold",
                      children: "✕ Close"
                    })
                  ]
                }),

                // Modal Configuration Bar (Country, Standard, Mode)
                e.jsxs("div", {
                  className: "p-4 bg-slate-50 border-b border-slate-200 shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs",
                  children: [
                    // Config 1: Country Cost Database
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-black text-slate-700 text-[10px] uppercase tracking-wider", children: "1. Country & Cost Database:" }),
                        e.jsx("select", {
                          value: customizerCountry,
                          onChange: (e) => setCustomizerCountry(e.target.value),
                          className: "w-full bg-white text-slate-900 font-bold p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-700 cursor-pointer shadow-2xs",
                          children: Object.keys(countriesConfig).map(cCode => {
                            const c = countriesConfig[cCode];
                            return e.jsx("option", { key: cCode, value: cCode, children: c.flag + " " + c.name + " (" + c.currency + " - " + c.symbol + ")" });
                          })
                        })
                      ]
                    }),

                    // Config 2: Measurement Standard
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-black text-slate-700 text-[10px] uppercase tracking-wider", children: "2. Measurement Standard:" }),
                        e.jsx("select", {
                          value: customizerStandard,
                          onChange: (e) => setCustomizerStandard(e.target.value),
                          className: "w-full bg-white text-slate-900 font-bold p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-700 cursor-pointer shadow-2xs",
                          children: measurementStandardsList.map(std => e.jsx("option", { key: std.id, value: std.id, children: std.name }))
                        })
                      ]
                    }),

                    // Config 3: Starting Mode
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-black text-slate-700 text-[10px] uppercase tracking-wider", children: "3. Starting Mode:" }),
                        e.jsxs("div", {
                          className: "flex rounded-lg border border-slate-300 bg-white p-0.5",
                          children: [
                            e.jsx("button", {
                              type: "button",
                              onClick: () => handleSetTemplateMode("full"),
                              className: "flex-1 py-1.5 rounded-md font-black text-center transition cursor-pointer " + (customizerTemplateMode === "full" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"),
                              children: "Full Template"
                            }),
                            e.jsx("button", {
                              type: "button",
                              onClick: () => handleSetTemplateMode("minimal"),
                              className: "flex-1 py-1.5 rounded-md font-black text-center transition cursor-pointer " + (customizerTemplateMode === "minimal" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"),
                              children: "Minimal Core"
                            })
                          ]
                        })
                      ]
                    })
                  ]
                }),

                // Modal Body: Work Sections Checklist & Items Explorer
                e.jsxs("div", {
                  className: "flex-1 overflow-y-auto p-5 space-y-4",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center justify-between pb-2 border-b border-slate-200",
                      children: [
                        e.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            e.jsx("span", { className: "font-black text-slate-900 text-sm", children: "Customize Work Sections" }),
                            e.jsxs("span", { className: "text-xs font-bold text-slate-500", children: ["(", customizerSections.filter(s => s.enabled).length, " of ", customizerSections.length, " enabled)"] })
                          ]
                        }),
                        e.jsxs("button", {
                          type: "button",
                          onClick: () => setIsAddSectionModalOpen(true),
                          className: "px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition flex items-center gap-1 cursor-pointer",
                          children: [
                            e.jsx("span", { children: "+" }),
                            e.jsx("span", { children: "Add Work Section" })
                          ]
                        })
                      ]
                    }),

                    // Sections Accordion List
                    e.jsx("div", {
                      className: "space-y-3",
                      children: customizerSections.map((sec, secIdx) => {
                        const isExpanded = !!expandedSectionIds[sec.id];
                        return e.jsxs("div", {
                          key: sec.id,
                          className: "rounded-2xl border transition overflow-hidden " + (sec.enabled ? "bg-white border-slate-300 shadow-2xs" : "bg-slate-50/60 border-slate-200 opacity-60"),
                          children: [
                            // Section Header Row
                            e.jsxs("div", {
                              className: "p-3.5 flex items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-100 select-none",
                              children: [
                                e.jsxs("div", {
                                  className: "flex items-center gap-3 flex-1 min-w-0",
                                  children: [
                                    // Checkbox Toggle
                                    e.jsx("input", {
                                      type: "checkbox",
                                      checked: sec.enabled,
                                      onChange: () => handleToggleSection(sec.id),
                                      className: "w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600 shrink-0"
                                    }),
                                    e.jsxs("div", {
                                      onClick: () => handleToggleSectionExpand(sec.id),
                                      className: "flex items-center gap-2 cursor-pointer flex-1 min-w-0",
                                      children: [
                                        e.jsx("span", { className: "font-mono font-bold text-[11px] text-slate-500 shrink-0", children: sec.classCode }),
                                        e.jsx("span", { className: "font-black text-slate-900 text-xs truncate", children: sec.title }),
                                        sec.isCore && e.jsx("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800 shrink-0", children: "Core" })
                                      ]
                                    })
                                  ]
                                }),
                                e.jsxs("div", {
                                  className: "flex items-center gap-2 shrink-0",
                                  children: [
                                    e.jsxs("span", { className: "text-xs font-bold text-slate-500", children: [(sec.items || []).length, " items"] }),
                                    e.jsx("button", {
                                      type: "button",
                                      onClick: () => handleToggleSectionExpand(sec.id),
                                      className: "p-1 text-slate-500 hover:text-slate-800 cursor-pointer font-bold text-xs",
                                      children: isExpanded ? "▲" : "▼"
                                    }),
                                    e.jsx("button", {
                                      type: "button",
                                      onClick: () => handleDeleteSection(sec.id),
                                      className: "p-1 text-slate-400 hover:text-rose-600 cursor-pointer text-xs",
                                      title: "Delete section",
                                      children: "✕"
                                    })
                                  ]
                                })
                              ]
                            }),

                            // Expanded Section Items Table
                            isExpanded && e.jsxs("div", {
                              className: "p-3 space-y-2 bg-white",
                              children: [
                                (sec.items || []).length === 0 ? e.jsx("div", {
                                  className: "p-4 text-center text-xs text-slate-400 font-medium italic",
                                  children: "No items in this section yet. Click '+ Add Bill Item' below."
                                }) : e.jsx("div", {
                                  className: "overflow-x-auto",
                                  children: e.jsxs("table", {
                                    className: "w-full text-left text-xs",
                                    children: [
                                      e.jsx("thead", {
                                        className: "bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider",
                                        children: e.jsxs("tr", {
                                          children: [
                                            e.jsx("th", { className: "p-2", children: "Code" }),
                                            e.jsx("th", { className: "p-2", children: "Description" }),
                                            e.jsx("th", { className: "p-2 text-center", children: "Unit" }),
                                            e.jsxs("th", { className: "p-2 text-right", children: ["Benchmark Rate (", countriesConfig[customizerCountry].currency, ")"] }),
                                            e.jsx("th", { className: "p-2", children: "Typical Formula / Dimension" }),
                                            e.jsx("th", { className: "p-2 text-center", children: "Action" })
                                          ]
                                        })
                                      }),
                                      e.jsx("tbody", {
                                        className: "divide-y divide-slate-100",
                                        children: sec.items.map((it, itIdx) => e.jsxs("tr", {
                                          key: itIdx,
                                          className: "hover:bg-slate-50 transition",
                                          children: [
                                            e.jsx("td", { className: "p-2 font-mono font-bold text-slate-900 whitespace-nowrap", children: it.code }),
                                            e.jsxs("td", {
                                              className: "p-2 min-w-[240px]",
                                              children: [
                                                e.jsx("div", { className: "font-bold text-slate-950", children: it.desc }),
                                                it.spec && e.jsx("div", { className: "text-[10px] font-semibold text-slate-500 mt-0.5", children: it.spec })
                                              ]
                                            }),
                                            e.jsx("td", { className: "p-2 text-center font-bold text-slate-700 uppercase", children: it.unit }),
                                            e.jsx("td", { className: "p-2 text-right font-mono font-black text-slate-900", children: formatCustomizerMoney(getCustomizerRate(it.baseRateUsd)) }),
                                            e.jsx("td", { className: "p-2 text-slate-600 font-mono text-[11px]", children: it.formulaDesc || "—" }),
                                            e.jsx("td", {
                                              className: "p-2 text-center",
                                              children: e.jsx("button", {
                                                type: "button",
                                                onClick: () => handleDeleteItem(sec.id, it.code),
                                                className: "text-slate-400 hover:text-rose-600 font-bold p-1 cursor-pointer",
                                                title: "Delete item",
                                                children: "✕"
                                              })
                                            })
                                          ]
                                        }))
                                      })
                                    ]
                                  })
                                }),
                                // Inline Add Item Button
                                e.jsxs("button", {
                                  type: "button",
                                  onClick: () => setIsAddItemToSectionId(sec.id),
                                  className: "mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1 cursor-pointer",
                                  children: [
                                    e.jsx("span", { children: "+" }),
                                    e.jsx("span", { children: "Add Item to " + sec.title })
                                  ]
                                })
                              ]
                            })
                          ]
                        });
                      })
                    })
                  ]
                }),

                // Modal Bottom Action Bar
                e.jsxs("div", {
                  className: "p-4 sm:p-5 bg-slate-900 text-white border-t border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-2 text-xs text-slate-300 font-medium",
                      children: [
                        e.jsx("span", { children: "✨" }),
                        e.jsxs("span", { children: ["Customizing '", customizerTitle, "' with ", customizerSections.filter(s => s.enabled).length, " active sections."] })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end",
                      children: [
                        e.jsxs("button", {
                          type: "button",
                          onClick: handleExportTemplateExcel,
                          className: "px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs border border-slate-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                          title: "Export Arranged Template CSV for Excel",
                          children: [
                            e.jsx("span", { children: "📊" }),
                            e.jsx("span", { children: "Export CSV" })
                          ]
                        }),
                        e.jsxs("button", {
                          type: "button",
                          onClick: () => setIsSaveCustomModalOpen(true),
                          className: "px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer",
                          title: "Save as Reusable Custom Template in Library",
                          children: [
                            e.jsx("span", { children: "💾" }),
                            e.jsx("span", { children: "Save as Reusable Template" })
                          ]
                        }),
                        e.jsxs("button", {
                          id: "apply-template-instant-btn",
                          type: "button",
                          onClick: handleApplyTemplateToEstimate,
                          className: "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95",
                          title: "Apply this configured template directly to active Civil Studio estimate",
                          children: [
                            e.jsx("span", { children: "🚀" }),
                            e.jsx("span", { children: "Apply to Studio Estimate" })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          }),

          // MODAL: ADD CUSTOM WORK SECTION
          isAddSectionModalOpen && e.jsx("div", {
            className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in",
            children: e.jsxs("div", {
              className: "bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs",
              children: [
                e.jsxs("div", {
                  className: "flex items-center justify-between border-b border-slate-100 pb-3",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        e.jsx("span", { className: "text-lg", children: "➕" }),
                        e.jsx("h3", { className: "font-black text-sm text-slate-900", children: "Add Custom Work Section" })
                      ]
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: () => setIsAddSectionModalOpen(false),
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
                        e.jsx("label", { className: "font-black text-slate-700", children: "Section Title *" }),
                        e.jsx("input", {
                          type: "text",
                          placeholder: "e.g. Geotechnical Instrumentation & Monitoring",
                          value: newSectionForm.title,
                          onChange: (e) => setNewSectionForm({ ...newSectionForm, title: e.target.value }),
                          className: "w-full p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white font-bold"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-black text-slate-700", children: "Classification Code / Rule" }),
                        e.jsx("input", {
                          type: "text",
                          placeholder: "e.g. CESMM4 Class G / Special Measurement",
                          value: newSectionForm.classCode,
                          onChange: (e) => setNewSectionForm({ ...newSectionForm, classCode: e.target.value }),
                          className: "w-full p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white"
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
                      onClick: () => setIsAddSectionModalOpen(false),
                      className: "px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer",
                      children: "Cancel"
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: handleAddCustomSection,
                      className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-xs transition cursor-pointer",
                      children: "Add Section"
                    })
                  ]
                })
              ]
            })
          }),

          // MODAL: ADD BILL ITEM TO SECTION
          isAddItemToSectionId && e.jsx("div", {
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
                        e.jsx("span", { className: "text-lg", children: "📝" }),
                        e.jsx("h3", { className: "font-black text-sm text-slate-900", children: "Add Bill Item to Section" })
                      ]
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: () => setIsAddItemToSectionId(null),
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
                        e.jsx("label", { className: "font-black text-slate-700", children: "Work Item Description *" }),
                        e.jsx("input", {
                          type: "text",
                          placeholder: "e.g. Mass concrete blinding C15/20 75mm thickness...",
                          value: newItemForm.desc,
                          onChange: (e) => setNewItemForm({ ...newItemForm, desc: e.target.value }),
                          className: "w-full p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white font-bold"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "grid grid-cols-3 gap-3",
                      children: [
                        e.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            e.jsx("label", { className: "font-black text-slate-700", children: "Item Code" }),
                            e.jsx("input", {
                              type: "text",
                              placeholder: "CES-F110",
                              value: newItemForm.code,
                              onChange: (e) => setNewItemForm({ ...newItemForm, code: e.target.value }),
                              className: "w-full p-2 rounded-lg border border-slate-300 font-mono"
                            })
                          ]
                        }),
                        e.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            e.jsx("label", { className: "font-black text-slate-700", children: "Unit" }),
                            e.jsx("select", {
                              value: newItemForm.unit,
                              onChange: (e) => setNewItemForm({ ...newItemForm, unit: e.target.value }),
                              className: "w-full p-2 rounded-lg border border-slate-300 font-bold",
                              children: ["m³", "m²", "m", "tonne", "nr", "item", "sum", "ha", "month"].map(u => e.jsx("option", { key: u, value: u, children: u }))
                            })
                          ]
                        }),
                        e.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            e.jsx("label", { className: "font-black text-slate-700", children: "Benchmark Rate ($USD)" }),
                            e.jsx("input", {
                              type: "number",
                              value: newItemForm.baseRateUsd,
                              onChange: (e) => setNewItemForm({ ...newItemForm, baseRateUsd: e.target.value }),
                              className: "w-full p-2 rounded-lg border border-slate-300 font-mono text-right"
                            })
                          ]
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-black text-slate-700", children: "Typical Formula / Dimension" }),
                        e.jsx("input", {
                          type: "text",
                          placeholder: "Length × Width × 0.075m",
                          value: newItemForm.formulaDesc,
                          onChange: (e) => setNewItemForm({ ...newItemForm, formulaDesc: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 font-mono"
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
                      onClick: () => setIsAddItemToSectionId(null),
                      className: "px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer",
                      children: "Cancel"
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: () => handleAddItemToSection(isAddItemToSectionId),
                      className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-xs transition cursor-pointer",
                      children: "Add Item"
                    })
                  ]
                })
              ]
            })
          }),

          // MODAL: SAVE AS REUSABLE CUSTOM TEMPLATE
          isSaveCustomModalOpen && e.jsx("div", {
            className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in",
            children: e.jsxs("div", {
              className: "bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs",
              children: [
                e.jsxs("div", {
                  className: "flex items-center justify-between border-b border-slate-100 pb-3",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        e.jsx("span", { className: "text-lg", children: "💾" }),
                        e.jsx("h3", { className: "font-black text-sm text-slate-900", children: "Save as Reusable Custom Template" })
                      ]
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: () => setIsSaveCustomModalOpen(false),
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
                        e.jsx("label", { className: "font-black text-slate-700", children: "Template Name *" }),
                        e.jsx("input", {
                          type: "text",
                          value: customizerTitle,
                          onChange: (e) => setCustomizerTitle(e.target.value),
                          className: "w-full p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-emerald-600 bg-white font-bold"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "grid grid-cols-2 gap-3",
                      children: [
                        e.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            e.jsx("label", { className: "font-black text-slate-700", children: "Version Tag" }),
                            e.jsx("input", {
                              type: "text",
                              value: newTemplateVersion,
                              onChange: (e) => setNewTemplateVersion(e.target.value),
                              className: "w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                            })
                          ]
                        }),
                        e.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            e.jsx("label", { className: "font-black text-slate-700", children: "Standard" }),
                            e.jsx("input", {
                              type: "text",
                              value: customizerStandard,
                              disabled: true,
                              className: "w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-600"
                            })
                          ]
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-black text-slate-700", children: "Notes & Project Applications" }),
                        e.jsx("textarea", {
                          rows: 3,
                          value: customizerNotes,
                          onChange: (e) => setCustomizerNotes(e.target.value),
                          placeholder: "Describe project type, applicable contract rules and measurement notes...",
                          className: "w-full p-2 rounded-lg border border-slate-300 font-medium"
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
                      onClick: () => setIsSaveCustomModalOpen(false),
                      className: "px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer",
                      children: "Cancel"
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: handleSaveAsReusableTemplate,
                      className: "px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black shadow-xs transition cursor-pointer",
                      children: "Save to My Library"
                    })
                  ]
                })
              ]
            })
          })
        ]
      }),

      activeTab === "schedule" && e.jsxs("div", {
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
                      e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "Civil Works Takeoff & Measurement Items" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800", children: "Zero Assumed Figures (Measured Only)" })
                    ]
                  }),
                  e.jsx("p", { className: "text-xs text-slate-500", children: "Enter measured site dimensions or quantities. Click 'Show Calculations' on any item to view/edit formulas and deductions." })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-2 flex-wrap",
                children: [
                  e.jsxs("button", {
                    type: "button",
                    onClick: () => setIsAddCivilItemModalOpen(!0),
                    className: "px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    children: [e.jsx("span", { children: "+" }), "Add Civil Work Item"]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportCivilBoqCsv,
                    className: "px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    children: [e.jsx("span", { children: "📊" }), "Export CSV"]
                  })
                ]
              })
            ]
          }),

          // Sector Filter Pills
          e.jsxs("div", {
            className: "flex items-center gap-2 flex-wrap",
            children: [
              [
                { id: "all", label: "All Items (" + civilScheduleItems.length + ")" },
                { id: "preliminaries", label: "Preliminaries & Site Setup" },
                { id: "earthworks", label: "Clearance & Earthworks" },
                { id: "pavement", label: "Sub-base & Asphalt Pavement" },
                { id: "bridges", label: "Bridges & Box Culverts" },
                { id: "drainage", label: "Pipe Culverts & Drains" },
                { id: "tunnels", label: "Tunnels & Underground" }
              ].map(f => e.jsx("button", {
                key: f.id,
                type: "button",
                onClick: () => setActiveSectorFilter(f.id),
                className: "px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer " + (activeSectorFilter === f.id ? "bg-slate-900 text-white shadow-xs font-black" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
                children: f.label
              }))
            ]
          }),

          // Items Table
          e.jsx("div", {
            className: "overflow-x-auto border border-slate-200 rounded-xl",
            children: e.jsxs("table", {
              className: "w-full text-left text-xs",
              children: [
                e.jsx("thead", {
                  className: "bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase",
                  children: e.jsxs("tr", {
                    children: [
                      e.jsx("th", { className: "p-3", children: "Item Code" }),
                      e.jsx("th", { className: "p-3", children: "Work Class & Description" }),
                      e.jsx("th", { className: "p-3 text-center", children: "Unit" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Measured Qty" }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Unit Rate (", civilCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Total Amount (", civilCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsx("th", { className: "p-3 text-center", children: "Takeoff Calc" })
                    ]
                  })
                }),
                e.jsx("tbody", {
                  className: "divide-y divide-slate-100",
                  children: filteredCivilItems.map(item => {
                    const itemRateDisp = getDisplayRate(item.rateNgn);
                    const itemAmountDisp = civilCurrency === "USD" ? (Number(item.qty || 0) * item.rateNgn / exchangeRate) : (Number(item.qty || 0) * item.rateNgn);
                    const isExpanded = expandedCalcId === item.id;

                    return e.jsxs(e.Fragment, {
                      key: item.id,
                      children: [
                        e.jsxs("tr", {
                          className: "hover:bg-slate-50 transition " + (isExpanded ? "bg-blue-50/30" : ""),
                          children: [
                            e.jsxs("td", {
                              className: "p-3 font-mono font-bold text-slate-800 whitespace-nowrap",
                              children: [
                                e.jsx("div", { children: item.code }),
                                e.jsx("div", { className: "text-[10px] text-slate-400 font-normal", children: "Bill " + item.billNo })
                              ]
                            }),
                            e.jsxs("td", {
                              className: "p-3 max-w-md",
                              children: [
                                e.jsx("div", { className: "font-black text-slate-900 text-xs", children: item.itemDesc }),
                                e.jsxs("div", {
                                  className: "text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap",
                                  children: [
                                    e.jsx("span", { className: "font-semibold text-blue-800", children: item.classTitle }),
                                    e.jsx("span", { children: "•" }),
                                    e.jsx("span", { className: "italic", children: item.specStandard })
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
                                onChange: (e) => handleUpdateItemDirect(item.id, "qty", e.target.value),
                                className: "w-24 text-right px-2 py-1 font-mono font-black text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
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
                                  const finalNgn = civilCurrency === "USD" ? val * exchangeRate : val;
                                  handleUpdateItemDirect(item.id, "rateNgn", finalNgn);
                                },
                                className: "w-28 text-right px-2 py-1 font-mono text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                              })
                            }),
                            // Total Amount
                            e.jsx("td", {
                              className: "p-3 text-right font-mono font-black text-slate-900 whitespace-nowrap",
                              children: civilCurrency === "USD" ? "$" + Number(itemAmountDisp).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₦" + Math.round(itemAmountDisp).toLocaleString("en-NG")
                            }),
                            // Toggle Calculations Button
                            e.jsx("td", {
                              className: "p-3 text-center",
                              children: e.jsxs("button", {
                                type: "button",
                                onClick: () => setExpandedCalcId(isExpanded ? null : item.id),
                                className: "px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 mx-auto " + (isExpanded ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
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
                          className: "bg-blue-50/40 border-b border-blue-200",
                          children: e.jsx("td", {
                            colSpan: 7,
                            className: "p-4 space-y-3",
                            children: e.jsxs("div", {
                              className: "bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-3",
                              children: [
                                e.jsxs("div", {
                                  className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2",
                                  children: [
                                    e.jsxs("div", {
                                      className: "flex items-center gap-2",
                                      children: [
                                        e.jsx("span", { className: "text-lg", children: "🧮" }),
                                        e.jsx("span", { className: "font-black text-xs text-slate-900", children: "Takeoff Dimension & Calculation Trace: " + item.code }),
                                        e.jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800", children: item.classTitle })
                                      ]
                                    }),
                                    e.jsxs("span", {
                                      className: "text-[11px] font-mono text-slate-500",
                                      children: ["SMM Rule: ", item.calc.smmRule]
                                    })
                                  ]
                                }),
                                e.jsxs("div", {
                                  className: "p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-blue-900 font-bold",
                                  children: ["📐 Applied Formula: ", item.calc.formula]
                                }),
                                // Dimension Inputs Grid (Length, Width, Depth, Timesing, Deductions)
                                e.jsxs("div", {
                                  className: "grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1",
                                  children: [
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Length (m)" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "0",
                                          step: "any",
                                          placeholder: "0",
                                          value: item.calc.length === 0 ? "" : item.calc.length,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateItemCalc(item.id, "length", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                                        })
                                      ]
                                    }),
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Width (m)" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "0",
                                          step: "any",
                                          placeholder: "0",
                                          value: item.calc.width === 0 ? "" : item.calc.width,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateItemCalc(item.id, "width", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                                        })
                                      ]
                                    }),
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Depth / Thick (m)" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "0",
                                          step: "any",
                                          placeholder: "0",
                                          value: item.calc.depth === 0 ? "" : item.calc.depth,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateItemCalc(item.id, "depth", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                                        })
                                      ]
                                    }),
                                    e.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        e.jsx("label", { className: "text-[10px] font-bold text-slate-500 block uppercase", children: "Timesing / Count" }),
                                        e.jsx("input", {
                                          type: "number",
                                          min: "1",
                                          step: "1",
                                          placeholder: "1",
                                          value: item.calc.timesing === 0 ? "" : item.calc.timesing,
                                          onFocus: (e) => e.target.select(),
                                          onChange: (e) => handleUpdateItemCalc(item.id, "timesing", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
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
                                          onChange: (e) => handleUpdateItemCalc(item.id, "deductions", e.target.value),
                                          className: "w-full px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
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
                                        "Calculated Result: ",
                                        e.jsx("strong", { className: "text-emerald-700 font-black", children: item.qty + " " + item.unit })
                                      ]
                                    }),
                                    e.jsx("span", {
                                      className: "text-slate-400 text-[11px]",
                                      children: "Live linked to BEME item quantity. Updating dimensions automatically updates quantity."
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

          // Takeoff Summary Cards
          e.jsxs("div", {
            className: "grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100",
            children: [
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Total Measured Civil BEME Value" }),
                  e.jsx("div", { className: "text-lg font-black text-slate-900 mt-1", children: formatMoney(takeoffTotals.totalNgn) })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Active BEME Work Items" }),
                  e.jsxs("div", { className: "text-lg font-black text-blue-900 mt-1", children: [takeoffTotals.measuredItemsCount, " / ", takeoffTotals.totalItems, " Measured"] })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Measurement Compliance" }),
                  e.jsx("div", { className: "text-lg font-black text-emerald-800 mt-1", children: "CESMM4 Certified" })
                ]
              })
            ]
          })
        ]
      }),

      // =====================================================================
      // TAB 2: UNIFIED MATERIALS SCHEDULE (MATCHING FORMAT ACROSS ALL STUDIOS)
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
                      e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "Project Materials Schedule (Procurement Bill)" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300", children: "Unified Studio Format" })
                    ]
                  }),
                  e.jsxs("p", { className: "text-xs text-slate-500", children: ["Itemized engineering materials assigned to: ", e.jsx("strong", { className: "text-slate-900", children: activeCivilProject.title })] })
                ]
              }),
              e.jsxs("div", {
                className: "flex items-center gap-2 flex-wrap",
                children: [
                  e.jsxs("button", {
                    type: "button",
                    onClick: () => setIsAddMaterialModalOpen(!0),
                    className: "px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    children: [e.jsx("span", { children: "+" }), "Add Material Item"]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportMaterialSchedulePdf,
                    className: "px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    title: "Export Landscape PDF Material Schedule",
                    children: [e.jsx("span", { children: "📄" }), "Export PDF"]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportMaterialScheduleExcel,
                    className: "px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                    title: "Export Formatted Excel Workbook (.xlsx)",
                    children: [e.jsx("span", { children: "📗" }), "Export Excel"]
                  }),
                  e.jsxs("button", {
                    type: "button",
                    onClick: exportMaterialScheduleCsv,
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
                  e.jsx("div", { className: "text-lg font-black text-slate-900 mt-1", children: formatMoney(materialTotals.totalCostNgn) })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Scheduled Material Items" }),
                  e.jsx("div", { className: "text-lg font-black text-blue-900 mt-1", children: materialTotals.totalItems + " Line Items" })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Waste Allowance Value" }),
                  e.jsx("div", { className: "text-lg font-black text-amber-700 mt-1", children: formatMoney(materialTotals.totalWasteCostNgn) })
                ]
              }),
              e.jsxs("div", {
                className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                children: [
                  e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Long-Lead / Structural Items" }),
                  e.jsx("div", { className: "text-lg font-black text-emerald-800 mt-1", children: materialTotals.criticalLeadTimeCount + " Critical Items" })
                ]
              })
            ]
          }),

          // Search and Category Filters
          e.jsxs("div", {
            className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3",
            children: [
              e.jsx("input", {
                type: "text",
                placeholder: "Search materials by code, description or spec...",
                value: searchFilter,
                onChange: (e) => setSearchFilter(e.target.value),
                className: "px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white max-w-sm"
              }),
              e.jsxs("div", {
                className: "flex items-center gap-1.5 overflow-x-auto text-xs",
                children: [
                  [
                    { id: "all", label: "All Materials" },
                    { id: "pavement", label: "Pavement & Asphalt" },
                    { id: "concrete", label: "Concrete & Rebar" },
                    { id: "drainage", label: "Drainage & Precast" },
                    { id: "safety", label: "Road Safety" }
                  ].map(f => e.jsx("button", {
                    key: f.id,
                    type: "button",
                    onClick: () => setActiveSectorFilter(f.id),
                    className: "px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer " + (activeSectorFilter === f.id ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
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
                      e.jsx("th", { className: "p-3", children: "Trade Sector" }),
                      e.jsx("th", { className: "p-3", children: "Material Specification & Grade" }),
                      e.jsx("th", { className: "p-3", children: "Size / Rating" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Takeoff Qty" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Waste %" }),
                      e.jsx("th", { className: "p-3 text-right", children: "Total Req. Qty" }),
                      e.jsx("th", { className: "p-3 text-center", children: "Unit" }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Unit Rate (", civilCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsxs("th", { className: "p-3 text-right", children: ["Total Amount (", civilCurrency === "USD" ? "$" : "₦", ")"] }),
                      e.jsx("th", { className: "p-3", children: "Supply Source & Lead Time" })
                    ]
                  })
                }),
                e.jsx("tbody", {
                  className: "divide-y divide-slate-100",
                  children: filteredMaterials.map(m => {
                    const reqQty = (Number(m.qty || 0) * (1 + (Number(m.waste || 0) / 100))).toFixed(2);
                    const matRateDisp = getDisplayRate(m.rateNgn);
                    const matAmountDisp = civilCurrency === "USD" ? (reqQty * m.rateNgn / exchangeRate) : (reqQty * m.rateNgn);

                    return e.jsxs("tr", {
                      key: m.id,
                      className: "hover:bg-slate-50 transition",
                      children: [
                        e.jsx("td", { className: "p-3 font-mono font-bold text-slate-800 whitespace-nowrap", children: m.code }),
                        e.jsx("td", { className: "p-3 font-semibold text-blue-900 whitespace-nowrap", children: m.sector }),
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
                            className: "w-20 text-right px-2 py-1 font-mono font-black text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
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
                            className: "w-16 text-right px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
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
                              const finalNgn = civilCurrency === "USD" ? val * exchangeRate : val;
                              handleUpdateMaterial(m.id, "rateNgn", finalNgn);
                            },
                            className: "w-24 text-right px-2 py-1 font-mono text-xs rounded border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                          })
                        }),
                        // Total Amount
                        e.jsx("td", {
                          className: "p-3 text-right font-mono font-black text-slate-900 whitespace-nowrap",
                          children: civilCurrency === "USD" ? "$" + Number(matAmountDisp).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₦" + Math.round(matAmountDisp).toLocaleString("en-NG")
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
      // TAB 3: REVIEW DRAWINGS & SPECIFICATIONS HUB
      // Plan visualizer, cross-section viewer, clause inspector & file upload
      // =====================================================================
      activeTab === "specifications" && e.jsxs("div", {
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
                      e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "Civil Engineering Specifications & Standards Hub" }),
                      e.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300", children: "Code Audit" })
                    ]
                  }),
                  e.jsx("p", { className: "text-xs text-slate-500", children: "Review authoritative civil specification standards, materials requirements, compaction thresholds, and contract clauses." })
                ]
              }),
              e.jsxs("label", {
                className: "px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer",
                children: [
                  e.jsx("span", { children: "⤒" }),
                  "Upload Project Specification (PDF/DOC)",
                  e.jsx("input", {
                    type: "file",
                    accept: ".pdf,.doc,.docx,.txt",
                    onChange: handleUploadSpecFile,
                    className: "hidden"
                  })
                ]
              })
            ]
          }),

          // Standards Selector Cards
          e.jsx("div", {
            className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
            children: specDocuments.map(doc => e.jsxs("div", {
              key: doc.id,
              onClick: () => setActiveSpecDocId(doc.id),
              className: "p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 " + (activeSpecDocId === doc.id ? "bg-purple-50/70 border-purple-400 shadow-xs ring-1 ring-purple-400" : "bg-slate-50 border-slate-200 hover:bg-white"),
              children: [
                e.jsxs("div", {
                  className: "space-y-1",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-1.5",
                      children: [
                        e.jsx("span", { className: "text-base", children: "📋" }),
                        e.jsx("h4", { className: "font-black text-slate-900 text-xs line-clamp-1", children: doc.name })
                      ]
                    }),
                    e.jsx("span", { className: "px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700 inline-block", children: doc.category })
                  ]
                }),
                e.jsxs("div", {
                  className: "flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200 font-mono",
                  children: [
                    e.jsxs("span", { children: [doc.size, " • ", doc.pages, " pgs"] }),
                    e.jsx("span", { className: "font-bold text-purple-700", children: doc.status })
                  ]
                })
              ]
            }))
          }),

          // Authoritative Specification Clauses & Compliance Reader
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
                      e.jsx("span", { className: "text-emerald-400 font-mono font-bold", children: "● Standard Clauses" }),
                      e.jsx("span", { className: "text-slate-400", children: "| " + (specDocuments.find(d => d.id === activeSpecDocId)?.name || "Standard Specification") })
                    ]
                  }),
                  e.jsxs("div", {
                    className: "flex items-center gap-2 font-mono text-[11px]",
                    children: [
                      e.jsx("span", { className: "text-slate-400", children: specDocuments.find(d => d.id === activeSpecDocId)?.smmCode || "Standard Code" })
                    ]
                  })
                ]
              }),

              // Clauses List Reader
              e.jsx("div", {
                className: "p-6 space-y-3 max-h-[480px] overflow-y-auto",
                children: (specDocuments.find(d => d.id === activeSpecDocId)?.clauses || []).map((clause, idx) => e.jsxs("div", {
                  key: idx,
                  className: "p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono flex items-start gap-3 hover:border-purple-500/50 transition",
                  children: [
                    e.jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-500/40 shrink-0", children: "Clause " + (idx + 1) }),
                    e.jsx("span", { className: "leading-relaxed text-slate-200 font-medium", children: clause })
                  ]
                }))
              })
            ]
          })
        ]
      }),
      activeTab === "pavement_design" && e.jsxs("div", {
        className: "bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6",
        children: [
          e.jsxs("div", {
            className: "space-y-1 border-b border-slate-100 pb-4",
            children: [
              e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "Highway Flexible Pavement Layer Structure & CBR Matrix" }),
              e.jsx("p", { className: "text-xs text-slate-500", children: "Standard pavement layer structural design thickness for heavy commercial highway loading." })
            ]
          }),
          e.jsx("div", {
            className: "grid grid-cols-1 md:grid-cols-4 gap-4",
            children: [
              { layer: "Wearing Course", thick: "50 mm", material: "Asphaltic Concrete (0-14mm)", cbr: "Marshall > 9 kN", temp: "150°C Laying" },
              { layer: "Binder Course", thick: "60 mm", material: "Dense Bituminous Macadam (0-20mm)", cbr: "Marshall > 7.5 kN", temp: "140°C Laying" },
              { layer: "Crushed Stone Base", thick: "150 mm", material: "Graded Crushed Rock (0-40mm)", cbr: "CBR > 80%", temp: "Ambient" },
              { layer: "Lateritic Sub-base", thick: "200 mm", material: "Natural Laterite Gravel", cbr: "CBR > 30%", temp: "Ambient" }
            ].map((p, idx) => e.jsxs("div", {
              key: idx,
              className: "p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2",
              children: [
                e.jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Layer " + (idx + 1) }),
                e.jsx("h3", { className: "text-base font-black text-slate-900", children: p.layer }),
                e.jsxs("div", { className: "text-xs font-mono font-bold text-blue-700", children: ["Thickness: ", p.thick] }),
                e.jsx("p", { className: "text-[11px] text-slate-600", children: p.material }),
                e.jsxs("div", { className: "text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-200", children: ["Requirement: ", p.cbr] })
              ]
            }))
          })
        ]
      }),

      // =====================================================================
      // TAB 5: METHODOLOGY & SMM RULES
      // =====================================================================
      activeTab === "methodology" && e.jsxs("div", {
        className: "bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6",
        children: [
          e.jsxs("div", {
            className: "space-y-1 border-b border-slate-100 pb-4",
            children: [
              e.jsx("h2", { className: "text-lg font-black text-slate-900 tracking-tight", children: "CESMM4 Civil Engineering Measurement Rules" }),
              e.jsx("p", { className: "text-xs text-slate-500", children: "Standard SMM measurement principles governing highways, bridges, culverts, and tunnel infrastructure works." })
            ]
          }),
          e.jsx("div", {
            className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-xs",
            children: [
              { code: "Class A: General Items", desc: "Contractor temporary site accommodation, supervisory vehicles, material testing laboratory, and traffic management priced as preliminary lump sums." },
              { code: "Class D: Demolition & Clearance", desc: "Bush clearing measured in hectares of plan area; tree felling enumerated in girth categories (>500mm, >1m, >2m)." },
              { code: "Class E: Earthworks", desc: "Excavation measured net in cubic metres within the payment lines. Haul up to 500m deemed included unless overhaul schedule provided." },
              { code: "Class R: Roads & Pavings", desc: "Sub-base and roadbase measured in cubic metres. Bituminous prime coats, binder courses and wearing courses measured in square metres with specified compacted thickness." },
              { code: "Class H: Pipe Culverts", desc: "Precast pipe culverts measured linearly along the center line including excavation, jointing, bedding and surround." },
              { code: "Class T: Tunnels & Shafts", desc: "Tunnel drives measured net in cubic metres within specified theoretical profile; precast segmental linings measured linearly along tunnel axis." }
            ].map((rule, idx) => e.jsxs("div", {
              key: idx,
              className: "p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5",
              children: [
                e.jsx("h4", { className: "font-black text-slate-900 text-sm", children: rule.code }),
                e.jsx("p", { className: "text-slate-600 leading-relaxed text-[11px]", children: rule.desc })
              ]
            }))
          })
        ]
      }),

      // =====================================================================
      // MODAL: ADD CUSTOM CIVIL WORK ITEM
      // =====================================================================
      isAddCivilItemModalOpen && e.jsx("div", {
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
                    e.jsx("span", { className: "text-xl", children: "➕" }),
                    e.jsx("h3", { className: "font-black text-sm text-slate-900", children: "Add Custom Civil Work Item" })
                  ]
                }),
                e.jsx("button", {
                  type: "button",
                  onClick: () => setIsAddCivilItemModalOpen(!1),
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
                    e.jsx("label", { className: "font-bold text-slate-700", children: "Item Description & Scope *" }),
                    e.jsx("textarea", {
                      rows: 2,
                      placeholder: "e.g. Reinforced concrete roadside trapezoidal drain (600x600mm) lined with precast slabs...",
                      value: newCivilItemForm.itemDesc,
                      onChange: (e) => setNewCivilItemForm({ ...newCivilItemForm, itemDesc: e.target.value }),
                      className: "w-full p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "CESMM4 Code" }),
                        e.jsx("input", {
                          type: "text",
                          value: newCivilItemForm.code,
                          onChange: (e) => setNewCivilItemForm({ ...newCivilItemForm, code: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white font-mono"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Work Sector" }),
                        e.jsxs("select", {
                          value: newCivilItemForm.sector,
                          onChange: (e) => setNewCivilItemForm({ ...newCivilItemForm, sector: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white cursor-pointer",
                          children: [
                            e.jsx("option", { value: "pavement", children: "Roads & Pavings" }),
                            e.jsx("option", { value: "earthworks", children: "Earthworks & Clearance" }),
                            e.jsx("option", { value: "drainage", children: "Drainage & Culverts" }),
                            e.jsx("option", { value: "bridges", children: "Bridges & Structures" }),
                            e.jsx("option", { value: "tunnels", children: "Tunnels & Underground" }),
                            e.jsx("option", { value: "preliminaries", children: "Preliminaries & Site Setup" })
                          ]
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
                        e.jsxs("select", {
                          value: newCivilItemForm.unit,
                          onChange: (e) => setNewCivilItemForm({ ...newCivilItemForm, unit: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white cursor-pointer font-mono",
                          children: [
                            e.jsx("option", { value: "m³", children: "m³" }),
                            e.jsx("option", { value: "m²", children: "m²" }),
                            e.jsx("option", { value: "m", children: "m" }),
                            e.jsx("option", { value: "tonne", children: "tonne" }),
                            e.jsx("option", { value: "ha", children: "ha" }),
                            e.jsx("option", { value: "nr", children: "nr" }),
                            e.jsx("option", { value: "item", children: "item" })
                          ]
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
                          value: newCivilItemForm.qty === 0 ? "" : newCivilItemForm.qty,
                          onFocus: (e) => e.target.select(),
                          onChange: (e) => setNewCivilItemForm({ ...newCivilItemForm, qty: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white font-mono text-right"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Rate (₦ NGN)" }),
                        e.jsx("input", {
                          type: "number",
                          min: "0",
                          placeholder: "0",
                          value: newCivilItemForm.rateNgn === 0 ? "" : newCivilItemForm.rateNgn,
                          onFocus: (e) => e.target.select(),
                          onChange: (e) => setNewCivilItemForm({ ...newCivilItemForm, rateNgn: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white font-mono text-right"
                        })
                      ]
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "space-y-1",
                  children: [
                    e.jsx("label", { className: "font-bold text-slate-700", children: "Takeoff Calculation Formula" }),
                    e.jsx("input", {
                      type: "text",
                      value: newCivilItemForm.calcFormula,
                      onChange: (e) => setNewCivilItemForm({ ...newCivilItemForm, calcFormula: e.target.value }),
                      placeholder: "e.g. Length (m) × Width (m) × Depth (m)",
                      className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white font-mono text-blue-900"
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
                  onClick: () => setIsAddCivilItemModalOpen(!1),
                  className: "px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer",
                  children: "Cancel"
                }),
                e.jsx("button", {
                  type: "button",
                  onClick: handleSaveCustomCivilItem,
                  className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-xs transition cursor-pointer",
                  children: "Add Civil Work Item"
                })
              ]
            })
          ]
        })
      }),

      // =====================================================================
      // MODAL: ADD CUSTOM MATERIAL TO SCHEDULE
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
                    e.jsx("h3", { className: "font-black text-sm text-slate-900", children: "Add Material to Project Schedule" })
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
                      placeholder: "e.g. Geotextile woven filtration fabric...",
                      value: newMaterialForm.desc,
                      onChange: (e) => setNewMaterialForm({ ...newMaterialForm, desc: e.target.value }),
                      className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Trade Sector" }),
                        e.jsx("input", {
                          type: "text",
                          value: newMaterialForm.sector,
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, sector: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Size / Spec" }),
                        e.jsx("input", {
                          type: "text",
                          value: newMaterialForm.size,
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, size: e.target.value }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white"
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
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white font-mono"
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
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white font-mono text-right"
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        e.jsx("label", { className: "font-bold text-slate-700", children: "Unit Rate (₦)" }),
                        e.jsx("input", {
                          type: "number",
                          min: "0",
                          placeholder: "0",
                          value: newMaterialForm.rateNgn === 0 ? "" : newMaterialForm.rateNgn,
                          onFocus: (e) => e.target.select(),
                          onChange: (e) => setNewMaterialForm({ ...newMaterialForm, rateNgn: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 }),
                          className: "w-full p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 bg-white font-mono text-right"
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
                  className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-xs transition cursor-pointer",
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
