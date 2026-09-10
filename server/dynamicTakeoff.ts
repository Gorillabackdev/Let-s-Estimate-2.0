import { TakeoffItem } from './ai';

/**
 * Regional rate multipliers relative to Lagos benchmark (1.00)
 */
export const REGIONAL_RATE_MULTIPLIERS: Record<string, number> = {
  'lagos': 1.00,
  'abuja': 1.08,
  'fct': 1.08,
  'rivers': 1.06,
  'port harcourt': 1.06,
  'kano': 0.92,
  'kaduna': 0.93,
  'oyo': 0.94,
  'ibadan': 0.94,
  'enugu': 0.96,
  'delta': 1.04,
  'edo': 0.97,
  'ogun': 0.93,
  'anambra': 0.98,
  'akwa ibom': 1.03,
};

export function getRegionalMultiplier(location?: string): number {
  if (!location) return 1.00;
  const locLower = location.toLowerCase();
  for (const [k, mult] of Object.entries(REGIONAL_RATE_MULTIPLIERS)) {
    if (locLower.includes(k)) return mult;
  }
  return 1.00;
}

/**
 * Generates an authentic, dynamic BOQ adhering to BESMM4 Sections A to O,
 * derived directly from project parameters, dimensions, and building-type rules.
 */
export function generateDynamicTakeoffItems(questionnaire?: any, filename?: string): TakeoffItem[] {
  const qGeneral = questionnaire?.general || {};
  const qSub = questionnaire?.substructure || {};
  const qSuper = questionnaire?.superstructure || {};
  const qRoof = questionnaire?.roofing || {};
  const qFinishes = questionnaire?.finishes || {};
  const qServices = questionnaire?.services || {};

  const projectType = qGeneral.projectType || 'Residential';
  const buildingType = qGeneral.buildingType || 'Bungalow';
  const location = qGeneral.location || 'Lagos';
  const terrain = qGeneral.terrain || 'Normal';
  const rateMult = getRegionalMultiplier(location);
  const isSwamp = terrain === 'Swamp' || terrain === 'Waterlogged' || terrain === 'Coastal';

  // Sizing mathematics
  const gfa = Math.max(40, Number(qGeneral.approximateGFA) || 200);
  const floors = Math.max(1, Number(qGeneral.numberOfFloors) || 1);
  const rooms = Math.max(1, Number(qGeneral.numberOfRooms) || 4);
  const footprint = Math.round(gfa / floors);
  const perimeter = Math.round(4.2 * Math.sqrt(footprint));

  // Determine structural constraints
  const isBungalow = floors === 1 && (buildingType === 'Bungalow' || buildingType === 'Unknown');
  const hasRCColumns = qSuper.columns === 'Yes' || (!isBungalow && qSuper.columns !== 'No');
  const hasSuspendedSlab = floors > 1 || qSuper.suspendedSlabs === 'Yes';
  const foundationType = qSub.foundationType || (isSwamp ? 'Raft foundation' : 'Strip foundation');

  // Roofing constraints
  const roofType = qRoof.roofType || 'Hip/Gable combination';
  const isGable = roofType === 'Gable';
  const isFlat = roofType === 'Flat';
  const hasValleys = !isGable && !isFlat && (qRoof.features?.valleys !== false);
  const hasHips = !isGable && !isFlat && (qRoof.features?.hips !== false);
  const roofCovering = qRoof.roofCovering || 'Aluminium longspan';

  const items: TakeoffItem[] = [];

  // =========================================================================
  // SPECIALIZED WORKFLOW: ROAD / INFRASTRUCTURE
  // =========================================================================
  if (projectType === 'Road/Infrastructure') {
    const roadLengthM = Math.max(200, Math.round(gfa * 2.5));
    const roadWidthM = 7.3;
    const roadArea = roadLengthM * roadWidthM;

    items.push(
      {
        section: 'A. Preliminaries',
        item_code: '1.1',
        item: 'Road Construction Mobilisation & Surveying',
        description: 'Mobilisation of heavy earthmoving plant, total station surveying, center-line setting out and establishing benchmarks',
        unit: 'Item',
        qty: 1,
        rate: Math.round(3500000 * rateMult),
        source: 'USER PROVIDED',
      },
      {
        section: 'B. Earthworks & Subgrade',
        item_code: '2.1',
        item: 'Bush Clearing & Topsoil Stripping',
        description: 'Clearing and grubbing road corridor 12m wide, stripping average 150mm topsoil and carting to spoil heap',
        unit: 'm2',
        qty: Math.round(roadLengthM * 12),
        rate: Math.round(850 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Earthworks & Subgrade',
        item_code: '2.2',
        item: 'Road Cut and Fill Excavation',
        description: 'Excavate in all types of soil except rock, haul, grade, and compact to 95% AASHTO T180 density',
        unit: 'm3',
        qty: Math.round(roadArea * 0.45),
        rate: Math.round(3800 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Pavement Layers',
        item_code: '3.1',
        item: 'Laterite Sub-Base (150mm)',
        description: 'Supply, spread, water, and compact approved lateritic gravel material to 150mm finished thickness (minimum CBR 30%)',
        unit: 'm2',
        qty: Math.round(roadArea * 1.05),
        rate: Math.round(4800 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Pavement Layers',
        item_code: '3.2',
        item: 'Crushed Rock Stone Base (150mm)',
        description: '150mm compacted crushed rock stone aggregate base course bedded and rolled to required camber and crossfall',
        unit: 'm2',
        qty: roadArea,
        rate: Math.round(8900 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Pavement Layers',
        item_code: '3.3',
        item: 'Bituminous Prime Coat',
        description: 'Apply MC-30 cutback bitumen prime coat at rate of 1.2 litres per m² to crushed stone base course',
        unit: 'm2',
        qty: roadArea,
        rate: Math.round(1800 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Pavement Layers',
        item_code: '3.4',
        item: 'Asphaltic Concrete Wearing Course (50mm)',
        description: '50mm thick hot-rolled dense asphaltic concrete wearing course compacted with 10-12 ton steel tandem rollers',
        unit: 'm2',
        qty: roadArea,
        rate: Math.round(18500 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'D. Road Drainage & Culverts',
        item_code: '4.1',
        item: 'Reinforced Concrete Trapezoidal Side Drains',
        description: 'Excavate, formwork, and cast in-situ 600x600mm Grade 25 reinforced concrete trapezoidal side drainage gutters on both sides',
        unit: 'm',
        qty: Math.round(roadLengthM * 2),
        rate: Math.round(38000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'D. Road Drainage & Culverts',
        item_code: '4.2',
        item: 'Pipe Culverts & Headwalls (900mm dia)',
        description: '900mm diameter precast reinforced concrete pipe ring culverts across road alignment including wingwalls and aprons',
        unit: 'm',
        qty: Math.max(16, Math.round(roadLengthM * 0.04)),
        rate: Math.round(95000 * rateMult),
        source: 'ESTIMATED',
        requires_confirmation: true,
      },
      {
        section: 'E. Road Furniture & Markings',
        item_code: '5.1',
        item: 'Thermoplastic Road Line Markings',
        description: '100mm wide reflectorized thermoplastic road center-line and edge-line markings including ballotini glass beads',
        unit: 'm',
        qty: Math.round(roadLengthM * 3),
        rate: Math.round(1200 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'N. Provisional Sums',
        item_code: '6.1',
        item: 'Material Quality Testing & Core Drilling',
        description: 'Provisional sum for independent road material testing, asphalt core extraction, and compaction density tests',
        unit: 'Provisional Sum',
        qty: 1,
        rate: Math.round(1500000 * rateMult),
        source: 'ESTIMATED',
      }
    );

    return items.map(it => ({
      ...it,
      amount: Math.round((it.qty || 0) * (it.rate || 0)),
    }));
  }

  // =========================================================================
  // SPECIALIZED WORKFLOW: LANDSCAPING
  // =========================================================================
  if (projectType === 'Landscaping') {
    items.push(
      {
        section: 'A. Preliminaries',
        item_code: '1.1',
        item: 'Landscape Works Mobilisation',
        description: 'Mobilisation of horticultural tools, rotary tillers, temporary water connection, and landscape setting out',
        unit: 'Item',
        qty: 1,
        rate: Math.round(450000 * rateMult),
        source: 'USER PROVIDED',
      },
      {
        section: 'B. Ground Preparation',
        item_code: '2.1',
        item: 'Site Clearance & Weed Eradication',
        description: 'Clear site of debris, surface rocks, eradicate weeds with systemic herbicide, and cart away waste',
        unit: 'm2',
        qty: Math.round(gfa * 1.1),
        rate: Math.round(750 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Ground Preparation',
        item_code: '2.2',
        item: 'Agricultural Topsoil Spreading (150mm)',
        description: 'Supply and spread 150mm fertile black organic loam topsoil, rotovate, and grade to free-draining contours',
        unit: 'm2',
        qty: Math.round(gfa * 0.75),
        rate: Math.round(3200 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Soft Landscaping',
        item_code: '3.1',
        item: 'Carpet Grass Turfing',
        description: 'Supply and lay healthy Bermuda / Zoysia carpet grass sods tightly jointed, tamped, and nurtured with initial watering',
        unit: 'm2',
        qty: Math.round(gfa * 0.55),
        rate: Math.round(2800 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Soft Landscaping',
        item_code: '3.2',
        item: 'Ornamental Shrubs & Hedge Plants',
        description: 'Planting Ficus, Ixora, Bougainvillea and Golden Mound border shrubs in prepared compost pits with organic fertilizer',
        unit: 'No',
        qty: Math.max(30, Math.round(gfa * 0.15)),
        rate: Math.round(4500 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Soft Landscaping',
        item_code: '3.3',
        item: 'Specimen Royal Palm Trees',
        description: 'Supply and plant 2.5m tall Royal Palms (Roystonea regia) including root-ball stabilization and tree stakes',
        unit: 'No',
        qty: Math.max(4, Math.round(gfa * 0.02)),
        rate: Math.round(45000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'D. Hard Landscaping',
        item_code: '4.1',
        item: 'Interlocking Concrete Paver Walkways (60mm)',
        description: '60mm heavy-duty colored paving stones on 50mm sharp sand bed including 100x200mm precast concrete edge kerbs',
        unit: 'm2',
        qty: Math.round(gfa * 0.25),
        rate: Math.round(12500 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'E. Garden Services',
        item_code: '5.1',
        item: 'Automatic Garden Pop-Up Irrigation Network',
        description: 'Underground 25mm HDPE lateral piping, solenoid valves, pop-up spray nozzles, and timer control kit',
        unit: 'Item',
        qty: 1,
        rate: Math.round(850000 * rateMult),
        source: 'ESTIMATED',
      },
      {
        section: 'E. Garden Services',
        item_code: '5.2',
        item: 'Solar Garden Landscape Spike Lights',
        description: 'IP65 stainless steel weatherproof low-voltage LED spike lights along walkways and uplighting to palm trees',
        unit: 'No',
        qty: Math.max(8, Math.round(gfa * 0.04)),
        rate: Math.round(18500 * rateMult),
        source: 'CALCULATED',
      }
    );

    return items.map(it => ({
      ...it,
      amount: Math.round((it.qty || 0) * (it.rate || 0)),
    }));
  }

  // =========================================================================
  // STANDARD BUILDING BOQ (SECTIONS A TO O)
  // Covers Bungalows, Duplexes, Multi-Storey, Hostels, Schools, Hospitals
  // =========================================================================

  // --- SECTION A: PRELIMINARIES ---
  items.push(
    {
      section: 'A. Preliminaries',
      item_code: '1.1',
      item: 'Site Mobilisation & Setup',
      description: 'Mobilisation of tools, equipment, temporary lock-up storage sheds, site water storage tanks, and project signboards',
      unit: 'Item',
      qty: 1,
      rate: Math.round((isBungalow ? 650000 : 1850000) * rateMult),
      source: 'USER PROVIDED',
      source_note: 'Standard Nigerian contractor site mobilisation allowance',
    },
    {
      section: 'A. Preliminaries',
      item_code: '1.2',
      item: 'Setting Out & Site Datum',
      description: 'Setting out the building lines, angles, wall centerlines, and establishing permanent benchmark datum levels',
      unit: 'Item',
      qty: 1,
      rate: Math.round((isBungalow ? 180000 : 420000) * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'A. Preliminaries',
      item_code: '1.3',
      item: 'Temporary Power & Water Services',
      description: 'Provide temporary site water supply, hosepipes, and generator power throughout the construction period',
      unit: 'Item',
      qty: 1,
      rate: Math.round((isBungalow ? 250000 : 650000) * rateMult),
      source: 'ESTIMATED',
    }
  );

  // --- SECTION B: SUBSTRUCTURE ---
  const trenchDepth = qSub.foundationDepth === 'From structural drawing' ? 1.2 : 1.1;
  const siteClearanceArea = Math.round(footprint * 1.35);

  items.push(
    {
      section: 'B. Substructure',
      item_code: '2.1',
      item: 'Site Clearance',
      description: 'Clear site of shrubs, grass, bushes, grub up roots, and cart away organic surface debris',
      unit: 'm2',
      qty: siteClearanceArea,
      rate: Math.round(850 * rateMult),
      source: 'CALCULATED',
      source_note: 'Ground footprint area + 1.8m perimeter working clearance',
    }
  );

  if (isSwamp) {
    items.push({
      section: 'B. Substructure',
      item_code: '2.2',
      item: 'Swamp Dewatering & Pumping',
      description: 'Continuous pumping and bailing of groundwater to keep foundation trenches dry during excavation and concreting',
      unit: 'Item',
      qty: 1,
      rate: Math.round(950000 * rateMult),
      source: 'ASSUMED',
      source_note: 'Required for coastal/swamp terrain conditions',
    });
  }

  if (foundationType.includes('Raft')) {
    items.push(
      {
        section: 'B. Substructure',
        item_code: '2.3',
        item: 'Raft Foundation Oversite Excavation',
        description: 'Excavate oversite for raft foundation slab and edge downstand beams not exceeding 1.5m deep, part return and cart away',
        unit: 'm3',
        qty: Math.round(footprint * 1.1 * 1.2),
        rate: Math.round(6800 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Substructure',
        item_code: '2.4',
        item: 'Plain Concrete Blinding (1:3:6)',
        description: '50mm thick plain concrete (1:3:6) blinding under raft foundation and beam bottoms',
        unit: 'm3',
        qty: Math.round(footprint * 0.05),
        rate: Math.round(98000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Substructure',
        item_code: '2.5',
        item: 'Reinforced Concrete Grade 25 in Raft Slab',
        description: 'Reinforced concrete Grade 25 in 250mm thick raft slab and integrated edge stiffening beams',
        unit: 'm3',
        qty: Math.round(footprint * 0.28),
        rate: Math.round(195000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Substructure',
        item_code: '2.6',
        item: 'High Tensile Reinforcement in Raft',
        description: 'High tensile ribbed steel rebar (12mm, 16mm, 20mm) cut, bent, and fixed in top and bottom raft mats',
        unit: 'tonnes',
        qty: Math.round(footprint * 0.035 * 10) / 10,
        rate: Math.round(1450000 * rateMult),
        source: 'REQUIRES CONFIRMATION',
        requires_confirmation: true,
        source_note: 'Structural bar bending schedule required for final certified tonnage',
      }
    );
  } else {
    const trenchVol = Math.round(perimeter * 0.675 * trenchDepth);
    const concreteFootingVol = Math.round(perimeter * 0.675 * 0.225);
    const foundationBlockworkArea = Math.round(perimeter * (trenchDepth - 0.225 + 0.3));

    items.push(
      {
        section: 'B. Substructure',
        item_code: '2.3',
        item: 'Foundation Trench Excavation',
        description: `Excavate trenches for foundation strip footings not exceeding ${trenchDepth}m deep, trim sides and level bottom`,
        unit: 'm3',
        qty: trenchVol,
        rate: Math.round(6200 * rateMult),
        source: 'CALCULATED',
        source_note: 'Calculated from perimeter × 675mm standard width × trench depth',
      },
      {
        section: 'B. Substructure',
        item_code: '2.4',
        item: 'Anti-Termite Soil Treatment',
        description: 'Approved chemical anti-termite emulsion applied to trench bottoms, sides, and beneath oversite slab',
        unit: 'm2',
        qty: Math.round(footprint + perimeter * 1.5),
        rate: Math.round(1200 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Substructure',
        item_code: '2.5',
        item: 'Concrete Blinding (1:3:6)',
        description: '50mm thick plain concrete (1:3:6) blinding in bottom of foundation trenches',
        unit: 'm3',
        qty: Math.round(perimeter * 0.675 * 0.05),
        rate: Math.round(98000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Substructure',
        item_code: '2.6',
        item: 'Concrete Grade 25 in Strip Footings',
        description: 'Reinforced concrete Grade 25 in 225mm thick strip foundation footings laid and compacted',
        unit: 'm3',
        qty: concreteFootingVol,
        rate: Math.round(185000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'B. Substructure',
        item_code: '2.7',
        item: 'Foundation Blockwork (225mm)',
        description: '225mm solid sandcrete blockwork in cement mortar (1:3) up to DPC level, well bedded and grouted',
        unit: 'm2',
        qty: foundationBlockworkArea,
        rate: Math.round(15500 * rateMult),
        source: 'CALCULATED',
      }
    );

    if (hasRCColumns) {
      items.push({
        section: 'B. Substructure',
        item_code: '2.8',
        item: 'Reinforced Concrete in Column Starters',
        description: 'Reinforced concrete Grade 25 in column bases and starter stubs up to ground floor slab level',
        unit: 'm3',
        qty: Math.max(2, Math.round(perimeter * 0.04)),
        rate: Math.round(210000 * rateMult),
        source: 'CALCULATED',
      });
    }
  }

  // Oversite bed components
  items.push(
    {
      section: 'B. Substructure',
      item_code: '2.9',
      item: 'Hardcore Bed (150mm)',
      description: '150mm thick clean crushed granite rock hardcore bed spread, rolled, and consolidated',
      unit: 'm2',
      qty: footprint,
      rate: Math.round(4800 * rateMult),
      source: 'CALCULATED',
      source_note: 'Equal to ground floor footprint area',
    },
    {
      section: 'B. Substructure',
      item_code: '2.10',
      item: 'Damp Proof Membrane (DPM)',
      description: '1000-gauge heavy-duty polythene damp proof membrane with 150mm sealed overlap taped at joints',
      unit: 'm2',
      qty: Math.round(footprint * 1.15),
      rate: Math.round(1400 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'B. Substructure',
      item_code: '2.11',
      item: 'Ground Floor Slab (150mm)',
      description: '150mm reinforced concrete Grade 20 ground floor oversite slab reinforced with BRC wire mesh fabric A142',
      unit: 'm3',
      qty: Math.round(footprint * 0.15),
      rate: Math.round(180000 * rateMult),
      source: 'CALCULATED',
    }
  );

  // --- SECTION C: SUPERSTRUCTURE ---
  if (hasRCColumns) {
    const colCount = Math.max(12, Math.round(rooms * 3.2));
    const colVol = Math.round(colCount * 0.225 * 0.225 * 3.0 * floors);
    items.push({
      section: 'C. Superstructure',
      item_code: '3.1',
      item: 'Reinforced Concrete Columns',
      description: '225x225mm reinforced concrete Grade 25 in columns including marine board formwork and 16mm rebar',
      unit: 'm3',
      qty: colVol,
      rate: Math.round(215000 * rateMult),
      source: 'CALCULATED',
    });
  }

  if (hasSuspendedSlab) {
    const suspendedSlabVol = Math.round(footprint * 0.15 * (floors - 1));
    const suspendedBeamsVol = Math.round(perimeter * 0.225 * 0.35 * (floors - 1));

    items.push(
      {
        section: 'C. Superstructure',
        item_code: '3.2',
        item: 'Reinforced Concrete Suspended Beams',
        description: '225x450mm reinforced concrete Grade 25 in floor beams including timber prop staging and formwork',
        unit: 'm3',
        qty: suspendedBeamsVol,
        rate: Math.round(225000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Superstructure',
        item_code: '3.3',
        item: 'Suspended Floor Slab (150mm)',
        description: '150mm thick reinforced concrete Grade 25 in suspended floor slab including marine plywood soffit formwork',
        unit: 'm3',
        qty: suspendedSlabVol,
        rate: Math.round(220000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'C. Superstructure',
        item_code: '3.4',
        item: 'Reinforced Concrete Staircase',
        description: 'Reinforced concrete Grade 25 in waist, treads, risers, and intermediate landings of staircase',
        unit: 'm3',
        qty: Math.round((floors - 1) * 3.8),
        rate: Math.round(240000 * rateMult),
        source: 'CALCULATED',
      }
    );
  }

  const externalWallArea = Math.round(perimeter * 3.0 * floors * 0.82);
  const internalWallArea = Math.round(perimeter * 0.72 * 3.0 * floors * 0.85);

  items.push(
    {
      section: 'C. Superstructure',
      item_code: '3.5',
      item: 'External Blockwork (225mm)',
      description: '225mm thick vibrated hollow sandcrete blocks bedded and jointed in cement mortar (1:4) for external walls',
      unit: 'm2',
      qty: externalWallArea,
      rate: Math.round(14500 * rateMult),
      source: 'CALCULATED',
      source_note: 'Derived from perimeter × 3.0m storey height × net opening factor',
    },
    {
      section: 'C. Superstructure',
      item_code: '3.6',
      item: 'Internal Partition Blockwork (150mm)',
      description: '150mm thick vibrated hollow sandcrete blocks in cement mortar (1:4) for room partitions',
      unit: 'm2',
      qty: internalWallArea,
      rate: Math.round(12500 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'C. Superstructure',
      item_code: '3.7',
      item: 'Reinforced Concrete Lintels',
      description: '225x225mm reinforced concrete Grade 25 in lintels over door and window openings with 12mm rebar',
      unit: 'm3',
      qty: Math.round(perimeter * 0.18 * floors),
      rate: Math.round(195000 * rateMult),
      source: 'CALCULATED',
    }
  );

  // --- SECTION D: ROOFING ---
  const roofSlopeFactor = isFlat ? 1.05 : 1.35;
  const roofArea = Math.round(footprint * roofSlopeFactor);

  items.push(
    {
      section: 'D. Roofing',
      item_code: '4.1',
      item: 'Timber Roof Trusses & Carcassing',
      description: 'Treated structural hardwood timber rafters, kingposts, struts, purlins, and wall plates securely strapped to lintels',
      unit: 'm2',
      qty: roofArea,
      rate: Math.round(16500 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'D. Roofing',
      item_code: '4.2',
      item: `Roof Covering (${roofCovering})`,
      description: `${roofCovering} gauge roofing sheets/tiles fixed to timber purlins with sealing washer drive screws`,
      unit: 'm2',
      qty: Math.round(roofArea * 1.08),
      rate: Math.round((roofCovering.includes('Stone') ? 34000 : 28500) * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'D. Roofing',
      item_code: '4.3',
      item: 'Ridge Capping',
      description: 'Matching fabricated ridge capping pieces fixed along the roof apex ridge lines',
      unit: 'm',
      qty: Math.round(perimeter * 0.45),
      rate: Math.round(6500 * rateMult),
      source: 'CALCULATED',
    }
  );

  if (hasHips) {
    items.push({
      section: 'D. Roofing',
      item_code: '4.4',
      item: 'Hip Capping Pieces',
      description: 'Matching hip capping pieces secured along the diagonal roof hip junctions',
      unit: 'm',
      qty: Math.round(perimeter * 0.35),
      rate: Math.round(6500 * rateMult),
      source: 'CALCULATED',
      source_note: 'Included based on hip roof geometry',
    });
  }

  if (hasValleys) {
    items.push({
      section: 'D. Roofing',
      item_code: '4.5',
      item: 'Internal Valley Gutters (0.60mm Aluminium)',
      description: '0.60mm aluminium valley gutters lined with timber boards at intersecting roof slope valleys',
      unit: 'm',
      qty: Math.round(perimeter * 0.25),
      rate: Math.round(8500 * rateMult),
      source: 'CALCULATED',
      source_note: 'Included based on valley roof geometry',
    });
  }

  items.push(
    {
      section: 'D. Roofing',
      item_code: '4.6',
      item: 'Fascia & Soffit Linings (300mm)',
      description: '20x300mm seasoned timber / UPVC fascia boards and vented soffit linings',
      unit: 'm',
      qty: Math.round(perimeter * 1.1),
      rate: Math.round(7500 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'D. Roofing',
      item_code: '4.7',
      item: 'Rainwater Downpipes (100mm PVC)',
      description: '100mm heavy duty PVC rainwater downpipes fixed to external walls with holderbats and shoe outlets',
      unit: 'm',
      qty: Math.round(floors * 4 * 3.5),
      rate: Math.round(4800 * rateMult),
      source: 'CALCULATED',
    }
  );

  // --- SECTION E: WINDOWS ---
  const windowCount = Math.max(6, Math.round(rooms * 2.2));
  items.push(
    {
      section: 'E. Windows',
      item_code: '5.1',
      item: 'Aluminium Glazed Windows (1200x1200mm)',
      description: `${qFinishes.windows || 'Aluminium sliding'} windows with 5mm tinted glass, insect screens, and sub-frames`,
      unit: 'No',
      qty: windowCount,
      rate: Math.round(72000 * rateMult),
      source: 'CALCULATED',
      source_note: 'Estimated based on room count and cross-ventilation norms',
    },
    {
      section: 'E. Windows',
      item_code: '5.2',
      item: 'Wrought Iron Security Burglar Grilles',
      description: 'Heavy duty wrought iron burglar-proof security grilles embedded into window reveals',
      unit: 'No',
      qty: windowCount,
      rate: Math.round(24000 * rateMult),
      source: 'CALCULATED',
    }
  );

  // --- SECTION F: DOORS ---
  const doorCount = Math.max(4, Math.round(rooms * 1.8));
  items.push(
    {
      section: 'F. Doors',
      item_code: '6.1',
      item: 'Armored Security Steel Entrance Doors',
      description: 'Heavy duty armored security steel entrance doors (900x2100mm) with multi-point master locking systems',
      unit: 'No',
      qty: Math.max(2, floors * 2),
      rate: Math.round(145000 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'F. Doors',
      item_code: '6.2',
      item: 'Internal Flush Timber Panel Doors',
      description: 'Solid core hardwood flush panel doors (800x2100mm) with hardwood timber frames, architraves, and 3-lever mortice locks',
      unit: 'No',
      qty: doorCount,
      rate: Math.round(68000 * rateMult),
      source: 'CALCULATED',
    }
  );

  // --- SECTION G: FINISHINGS ---
  const plasterArea = Math.round((externalWallArea + internalWallArea * 2) * 0.95);
  const floorTilingArea = Math.round(gfa * 0.88);
  const wetAreaWallTiling = Math.round(rooms * 18);
  const ceilingArea = Math.round(gfa * 0.96);

  items.push(
    {
      section: 'G. Finishings',
      item_code: '7.1',
      item: 'Internal Cement-Sand Plastering (15mm)',
      description: '15mm thick cement and sharp sand plaster (1:4) wood floated smooth to internal wall surfaces',
      unit: 'm2',
      qty: Math.round(internalWallArea * 1.9),
      rate: Math.round(4200 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'G. Finishings',
      item_code: '7.2',
      item: 'External Cement Rendering (20mm)',
      description: '20mm thick plain cement and sand rendering (1:3) with water-repellent additive to external wall surfaces',
      unit: 'm2',
      qty: externalWallArea,
      rate: Math.round(4600 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'G. Finishings',
      item_code: '7.3',
      item: `Floor Tiling (${qFinishes.floors || 'Porcelain'})`,
      description: `600x600mm vitrified ${qFinishes.floors || 'Porcelain'} floor tiles bedded on 25mm cement screed bed and grouted`,
      unit: 'm2',
      qty: floorTilingArea,
      rate: Math.round(15500 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'G. Finishings',
      item_code: '7.4',
      item: 'Bathroom & Kitchen Wet Area Wall Tiles',
      description: '300x600mm glazed ceramic wall tiles fixed with tile adhesive up to 2.1m height in wet areas',
      unit: 'm2',
      qty: wetAreaWallTiling,
      rate: Math.round(13500 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'G. Finishings',
      item_code: '7.5',
      item: `Ceiling Finish (${qFinishes.ceilings || 'POP'})`,
      description: `Suspended ${qFinishes.ceilings || 'POP'} decorative ceiling with galvanized framing and perimeter shadow cornices`,
      unit: 'm2',
      qty: ceilingArea,
      rate: Math.round(9500 * rateMult),
      source: 'CALCULATED',
    },
    {
      section: 'G. Finishings',
      item_code: '7.6',
      item: 'Painting & Decorating (Internal & External)',
      description: 'Three coats of premium acrylic emulsion paint to internal walls and weather-shield Texcote paint externally',
      unit: 'm2',
      qty: Math.round(plasterArea * 1.05),
      rate: Math.round(2400 * rateMult),
      source: 'CALCULATED',
    }
  );

  // --- SECTION H: PLUMBING / SANITARY ---
  if (qServices.plumbing !== 'Excluded' && qServices.plumbing !== 'Separate contract') {
    items.push(
      {
        section: 'H. Plumbing/Sanitary',
        item_code: '8.1',
        item: 'Water Supply Pipework & Fittings (PPR)',
        description: 'Complete cold and hot water reticulation using PPR pipes and valves concealed in screed and walls',
        unit: 'Item',
        qty: 1,
        rate: Math.round((isBungalow ? 950000 : 2400000) * rateMult),
        source: 'ESTIMATED',
      },
      {
        section: 'H. Plumbing/Sanitary',
        item_code: '8.2',
        item: 'Soil, Waste & Vent Drainage Piping',
        description: 'Heavy-duty PVC soil and waste discharge pipework, inspection gullies, and vent stacks connected to manholes',
        unit: 'Item',
        qty: 1,
        rate: Math.round((isBungalow ? 850000 : 2100000) * rateMult),
        source: 'ESTIMATED',
      },
      {
        section: 'H. Plumbing/Sanitary',
        item_code: '8.3',
        item: 'Sanitary Appliances Installation',
        description: 'Dual flush vitreous china water closets, wash hand basins, shower mixer sets, and kitchen double bowl sink',
        unit: 'No',
        qty: Math.max(3, Math.round(rooms * 1.2)),
        rate: Math.round(185000 * rateMult),
        source: 'CALCULATED',
      },
      {
        section: 'H. Plumbing/Sanitary',
        item_code: '8.4',
        item: 'Overhead Water Storage Tank (2,000L) & Stand',
        description: '2,000 litre cylindrical PVC water storage tank installed on fabricated structural steel elevated tank stand',
        unit: 'Item',
        qty: 1,
        rate: Math.round(480000 * rateMult),
        source: 'ESTIMATED',
      }
    );
  }

  // --- SECTION I: ELECTRICAL ---
  if (qServices.electrical !== 'Excluded' && qServices.electrical !== 'Separate contract') {
    items.push(
      {
        section: 'I. Electrical',
        item_code: '9.1',
        item: 'Electrical Conduiting & First Fix Boxes',
        description: '20mm PVC conduit piping concealed in blockwork, junction boxes, and galvanised steel back boxes',
        unit: 'Item',
        qty: 1,
        rate: Math.round((isBungalow ? 750000 : 1850000) * rateMult),
        source: 'ESTIMATED',
      },
      {
        section: 'I. Electrical',
        item_code: '9.2',
        item: 'Electrical Wiring Cables (1.5mm², 2.5mm², 4mm²)',
        description: 'Certified single-core copper PVC insulated cables pulled into conduits for lighting and power sockets',
        unit: 'Item',
        qty: 1,
        rate: Math.round((isBungalow ? 1100000 : 2800000) * rateMult),
        source: 'ESTIMATED',
      },
      {
        section: 'I. Electrical',
        item_code: '9.3',
        item: 'Switches, Sockets & Consumer Distribution Board',
        description: '13A switched double socket outlets, light switches, cooker control units, and 12-way consumer distribution board with MCBs',
        unit: 'Item',
        qty: 1,
        rate: Math.round((isBungalow ? 850000 : 1950000) * rateMult),
        source: 'ESTIMATED',
      },
      {
        section: 'I. Electrical',
        item_code: '9.4',
        item: 'LED Lighting Fittings & Earthing Protection',
        description: 'Energy-saving LED panel downlights, external security floodlights, copper earth rod, and lightning arrestor',
        unit: 'Item',
        qty: 1,
        rate: Math.round((isBungalow ? 650000 : 1550000) * rateMult),
        source: 'ESTIMATED',
      }
    );
  }

  // --- SECTION K: EXTERNAL WORKS & DRAINAGE ---
  if (qServices.externalWorks !== 'Excluded') {
    items.push(
      {
        section: 'K. External Works',
        item_code: '10.1',
        item: 'Septic Tank & Soakaway Absorption Pit',
        description: 'Reinforced concrete septic tank (3.0x1.8x2.4m) and honeycombed sandcrete soakaway absorption pit with concrete cover slab',
        unit: 'Item',
        qty: 1,
        rate: Math.round(1850000 * rateMult),
        source: 'ESTIMATED',
      },
      {
        section: 'K. External Works',
        item_code: '10.2',
        item: 'Interlocking Concrete Paving Stones (60mm)',
        description: '60mm heavy duty interlocking concrete paving stones on 50mm sharp sand bed including precast kerbs to driveway and compound',
        unit: 'm2',
        qty: Math.round(footprint * 0.85),
        rate: Math.round(12500 * rateMult),
        source: 'CALCULATED',
      }
    );
  }

  if (qServices.drainage !== 'Excluded') {
    items.push({
      section: 'L. Drainage',
      item_code: '11.1',
      item: 'Perimeter Stormwater Concrete Drainage',
      description: '450x450mm reinforced concrete stormwater drainage channel with precast concrete slotted covers',
      unit: 'm',
      qty: Math.round(perimeter * 0.8),
      rate: Math.round(28000 * rateMult),
      source: 'CALCULATED',
    });
  }

  if (qServices.fenceWall !== 'Excluded') {
    items.push({
      section: 'K. External Works',
      item_code: '10.3',
      item: 'Perimeter Fence Wall (2.4m high)',
      description: '225mm hollow sandcrete block perimeter fence wall 2.4m high including strip foundation and reinforced concrete piers',
      unit: 'm',
      qty: Math.round(perimeter * 0.9),
      rate: Math.round(4800 * rateMult),
      source: 'CALCULATED',
    });
  }

  if (qServices.gate !== 'Excluded') {
    items.push({
      section: 'K. External Works',
      item_code: '10.4',
      item: 'Vehicular & Pedestrian Security Gate',
      description: 'Fabricated mild steel security entrance vehicular swing gate (4.0x2.4m) and pedestrian gate primed and painted',
      unit: 'Item',
      qty: 1,
      rate: Math.round(850000 * rateMult),
      source: 'ESTIMATED',
    });
  }

  // --- SECTION N: PROVISIONAL SUMS ---
  items.push(
    {
      section: 'N. Provisional Sums',
      item_code: '12.1',
      item: 'Testing of Construction Materials',
      description: 'Provisional sum for independent concrete cube crushing tests, water absorption block tests, and soil compaction verification',
      unit: 'Provisional Sum',
      qty: 1,
      rate: Math.round(450000 * rateMult),
      source: 'ESTIMATED',
    },
    {
      section: 'N. Provisional Sums',
      item_code: '12.2',
      item: 'General Project Contingency Sum',
      description: 'Provisional sum to cover unforeseen site conditions and client variations',
      unit: 'Provisional Sum',
      qty: 1,
      rate: Math.round((isBungalow ? 1200000 : 3500000) * rateMult),
      source: 'ESTIMATED',
    }
  );

  return items.map(it => ({
    ...it,
    amount: Math.round((it.qty || 0) * (it.rate || 0)),
  }));
}
