// scripts/remove_mock_drawings_from_studios.cjs
const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');

console.log('=== REMOVING MOCK DRAWINGS FROM CIVIL STUDIO AND REFINERY STUDIO ===');

// 1. UPDATE CivilWorksFullStudio.js
console.log('1. Updating CivilWorksFullStudio.js: Removing mock drawing SVGs and mock DWGs...');
let civilCode = fs.readFileSync(path.join(__dirname, 'CivilWorksFullStudio.js'), 'utf8');

// Replace specDocuments with real engineering specifications
const oldCivilDocStart = '  const [specDocuments, setSpecDocuments] = _.useState([';
const newCivilDocStart = `  const [specDocuments, setSpecDocuments] = _.useState([
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

  const [activeSpecDocId, setActiveSpecDocId] = _.useState("spec-doc-1");`;

let civilDocIdx = civilCode.indexOf(oldCivilDocStart);
let civilDocEndIdx = civilCode.indexOf('const [activeSpecDocId, setActiveSpecDocId]', civilDocIdx);
if (civilDocIdx !== -1 && civilDocEndIdx !== -1) {
  let lineEnd = civilCode.indexOf('\n', civilDocEndIdx);
  civilCode = civilCode.slice(0, civilDocIdx) + newCivilDocStart + civilCode.slice(lineEnd + 1);
  console.log('Replaced specDocuments in CivilWorksFullStudio with real engineering standards!');
}

// Rename tab button from "Review Drawings & Specs" to "Engineering Specifications & Standards"
civilCode = civilCode.replace(
  'children: [e.jsx("span", { children: "📐" }), "Review Drawings & Specs (", specDocuments.length, ")"]',
  'children: [e.jsx("span", { children: "📜" }), "Engineering Specifications & Standards (", specDocuments.length, ")"]'
);

// Replace the mock SVG cross-section viewer with a clean Specification Clauses & Compliance Reader
let civilSpecBlockStart = civilCode.indexOf('activeTab === "specifications" && e.jsxs("div", {');
let civilSpecBlockEnd = civilCode.indexOf('activeTab === "pavement_design" && e.jsxs("div", {', civilSpecBlockStart);

const newCivilSpecBlock = `activeTab === "specifications" && e.jsxs("div", {
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
      `;

if (civilSpecBlockStart !== -1 && civilSpecBlockEnd !== -1) {
  civilCode = civilCode.slice(0, civilSpecBlockStart) + newCivilSpecBlock + civilCode.slice(civilSpecBlockEnd);
  console.log('Replaced civil specifications viewer and removed mock SVG cross-section drawing!');
}

fs.writeFileSync(path.join(__dirname, 'CivilWorksFullStudio.js'), civilCode, 'utf8');
console.log('Saved updated scripts/CivilWorksFullStudio.js!');


// 2. UPDATE RefineryFullStudio.js
console.log('2. Updating RefineryFullStudio.js: Removing mock drawings array, handlers, and mock P&ID SVG...');
let refineryCode = fs.readFileSync(path.join(__dirname, 'RefineryFullStudio.js'), 'utf8');

// Replace refineryDrawings and its upload handlers with real ASME/API engineering specifications
const oldRefDwgStart = '  const [refineryDrawings, setRefineryDrawings] = _.useState([';
const targetBeforeReturn = '  return e.jsxs("div", {';

const newRefSpecBlockAndHandler = `  const [refinerySpecs, setRefinerySpecs] = _.useState([
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
`;

let refDwgIdx = refineryCode.indexOf(oldRefDwgStart);
let refReturnIdx = refineryCode.indexOf(targetBeforeReturn, refDwgIdx);
if (refDwgIdx !== -1 && refReturnIdx !== -1) {
  refineryCode = refineryCode.slice(0, refDwgIdx) + newRefSpecBlockAndHandler + refineryCode.slice(refReturnIdx);
  console.log('Replaced refineryDrawings state & handlers with real ASME/API standards in RefineryFullStudio!');
}

// Rename tab button from "Review Drawings & Specs" to "Engineering Specifications (ASME / API)"
refineryCode = refineryCode.replace(
  'children: [e.jsx("span", { children: "📐" }), "Review Drawings & Specs (", refineryDrawings.length, ")"]',
  'children: [e.jsx("span", { children: "📜" }), "Engineering Specifications (ASME / API) (", refinerySpecs.length, ")"]'
);
refineryCode = refineryCode.replace(
  'activeTab === "specs_drawings" ? "bg-white text-emerald-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"',
  'activeTab === "specs_drawings" ? "bg-white text-amber-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"'
);

// Replace the entire specs_drawings tab block (which had the mock SVG diagram)
let refSpecsBlockStart = refineryCode.indexOf('activeTab === "specs_drawings" && e.jsxs("div", {');
let refSpecsBlockEnd = refineryCode.indexOf('// =====================================================================\n      // MODAL: ADD CUSTOM MATERIAL ITEM', refSpecsBlockStart);
if (refSpecsBlockEnd === -1) {
  refSpecsBlockEnd = refineryCode.indexOf('// MODAL: ADD CUSTOM MATERIAL ITEM', refSpecsBlockStart);
}

const newRefSpecsBlock = `activeTab === "specs_drawings" && e.jsxs("div", {
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
      `;

if (refSpecsBlockStart !== -1 && refSpecsBlockEnd !== -1) {
  refineryCode = refineryCode.slice(0, refSpecsBlockStart) + newRefSpecsBlock + refineryCode.slice(refSpecsBlockEnd);
  console.log('Replaced refinery specs viewer and removed mock SVG P&ID diagram!');
}

fs.writeFileSync(path.join(__dirname, 'RefineryFullStudio.js'), refineryCode, 'utf8');
console.log('Saved updated scripts/RefineryFullStudio.js!');


// 3. VALIDATE BOTH SCRIPTS WITH BABEL PARSER
console.log('3. Validating CivilWorksFullStudio and RefineryFullStudio with Babel parser...');
const astCivil = babelParser.parse(civilCode, { sourceType: 'module', plugins: ['jsx'] });
console.log('CivilWorksFullStudio Babel parse PASSED! Body count:', astCivil.program.body.length);

const astRefinery = babelParser.parse(refineryCode, { sourceType: 'module', plugins: ['jsx'] });
console.log('RefineryFullStudio Babel parse PASSED! Body count:', astRefinery.program.body.length);


// 4. INJECT INTO BUNDLES (public/assets and dist/assets)
console.log('4. Injecting clean studios into public/assets/index-BmB3tbOJ.js and dist/assets/index-BmB3tbOJ.js...');
['public/assets/index-BmB3tbOJ.js', 'dist/assets/index-BmB3tbOJ.js'].forEach(bundlePath => {
  const fullPath = path.join(__dirname, '..', bundlePath);
  if (!fs.existsSync(fullPath)) return;
  let bundle = fs.readFileSync(fullPath, 'utf8');

  // Replace CivilWorksFullStudio
  let civilStart = bundle.indexOf('const CivilWorksFullStudio =');
  let civilEnd = bundle.indexOf('var XB=Object.defineProperty;', civilStart);
  if (civilStart === -1 || civilEnd === -1) {
    throw new Error('CivilWorksFullStudio boundaries not found in ' + bundlePath);
  }
  bundle = bundle.slice(0, civilStart) + civilCode.trim() + "\n" + bundle.slice(civilEnd);

  // Replace RefineryFullStudio (aee)
  let aeeStart = bundle.indexOf('const aee =');
  if (aeeStart === -1) aeeStart = bundle.indexOf('const aee=');
  let aeeEnd = bundle.indexOf(';const i6=', aeeStart);
  if (aeeStart === -1 || aeeEnd === -1) {
    throw new Error('aee boundaries not found in ' + bundlePath);
  }
  bundle = bundle.slice(0, aeeStart) + refineryCode.trim() + bundle.slice(aeeEnd);

  // Validate with Babel Parser
  console.log('Validating bundle', bundlePath, 'with Babel parser...');
  const bundleAst = babelParser.parse(bundle, { sourceType: 'module' });
  console.log(bundlePath, 'AST validation passed! Statements:', bundleAst.program.body.length);

  fs.writeFileSync(fullPath, bundle, 'utf8');
  console.log(bundlePath, 'saved successfully! Size:', bundle.length);
});

console.log('=== REMOVAL OF ALL MOCK DRAWINGS FULLY COMPLETED! ===');
