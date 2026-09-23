/**
 * Let's Estimate - TypeScript Interfaces
 */

/**
 * Let's Estimate - TypeScript Interfaces
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  profession?: string;
  company?: string;
  job_title?: string;
  country?: string;
  state?: string;
  currency?: string;
  measurement_system?: string;
  avatar_url?: string;
  email_verified?: number | boolean;
  role?: string;
  company_type?: string;
  created_at?: string;
  updated_at?: string;
  // Phase 10 Subscription, Licensing & Trial properties
  subscription_tier?: 'free_trial' | 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license';
  subscription_status?: 'active' | 'expired' | 'pending_verification';
  subscription_expires_at?: string;
  boq_credits?: number;
  license_key?: string;
}

export interface UserStats {
  projectCount: number;
  totalPortfolioValue: number;
  currency: string;
}

export type QuantitySource = 
  | 'CONFIRMED FROM DRAWING'
  | 'USER PROVIDED'
  | 'CALCULATED'
  | 'ESTIMATED'
  | 'ASSUMED'
  | 'NOT DETERMINABLE'
  | 'REQUIRES CONFIRMATION'
  | 'AI_TAKEOFF'
  | 'MANUAL_TAKEOFF'
  | 'QUESTIONNAIRE'
  | 'PARAMETRIC'
  | 'MANUAL_ENTRY';

export type QsVerificationStatus =
  | 'AI Suggested'
  | 'Requires Verification'
  | 'QS Verified'
  | 'User Adjusted'
  | 'Imported'
  | 'Historical'
  | 'Preliminary Parametric Estimate';

export interface BoqItem {
  id: string;
  project_id?: string;
  version_id?: string;
  section?: string;
  subsection?: string;
  item_number: number;
  item_code?: string;    // e.g., "1.1", "2.1", "3.4"
  item: string;          // Walls, RC Slab, Blockwork, Doors, Windows, Roofing, etc.
  description: string;   // Technical specification
  unit: string;          // m2, m3, No, m, kg
  qty: number;           // Quantity
  rate: number;          // Unit rate in Nigerian Naira (₦)
  amount: number;        // Calculated: qty * rate
  source?: QuantitySource | string;
  source_note?: string;
  evidence?: string;
  source_drawing?: string;       // Original drawing filename e.g. "Ground_Floor_Plan.pdf"
  page_or_sheet?: string;        // Sheet or page e.g. "Sheet A-101" or "Page 1"
  measurement_method?: string;   // e.g. "Calibrated Manual Takeoff", "Direct Perimeter Takeoff", "Schedule Count"
  calculation_formula?: string;  // Explicit formula showing how the quantity was derived
  drawing_evidence_id?: string;  // Link to measurement ID or drawing element
  confidence?: number;
  verification_status?: QsVerificationStatus;
  requires_confirmation?: boolean;
  notes?: string;
  is_ai_generated?: number | boolean;
  is_confirmed?: number | boolean;
}

export interface ProjectQuestionnaire {
  general: {
    projectType: 'Residential' | 'Commercial' | 'Hostel' | 'School' | 'Hospital' | 'Office' | 'Industrial' | 'Renovation' | 'Landscaping' | 'Road/Infrastructure' | 'Other';
    buildingType: 'Bungalow' | 'Duplex' | '2-storey building' | '3-storey building' | 'Multi-storey' | 'Renovation' | 'Other' | 'Unknown';
    numberOfBuildings: number;
    numberOfFloors: number;
    numberOfRooms: number;
    approximateGFA: number;
    numberOfUnits: number;
    location: string;
    terrain: 'Normal' | 'Swamp' | 'Waterlogged' | 'Coastal' | 'Hilly' | 'Other' | 'Unknown';
  };
  substructure: {
    foundationType: 'Strip foundation' | 'Pad foundation' | 'Raft foundation' | 'Pile foundation' | 'Combined footing' | 'Ground beam foundation' | 'Other' | 'Unknown';
    rcColumnsPresent: 'Yes' | 'No' | 'Unknown';
    rcBeamsPresent: 'Yes' | 'No' | 'Unknown';
    groundBeamsPresent: 'Yes' | 'No' | 'Unknown';
    suspendedFloor: 'Yes' | 'No' | 'Unknown';
    groundFloorConstruction: 'Ground-bearing slab' | 'Suspended slab' | 'Other' | 'Unknown';
    foundationDepth: string; // User specified, "From structural drawing", or "Unknown"
    basement: 'Yes' | 'No';
  };
  superstructure: {
    structuralSystem: 'Load-bearing masonry' | 'Reinforced concrete frame' | 'Steel frame' | 'Timber' | 'Mixed' | 'Unknown';
    columns: 'Yes' | 'No' | 'Unknown';
    beams: 'Yes' | 'No' | 'Unknown';
    suspendedSlabs: 'Yes' | 'No' | 'Unknown';
    staircase: 'None' | 'Reinforced concrete' | 'Steel' | 'Timber' | 'Other' | 'Unknown';
    numberOfStaircases: number;
  };
  roofing: {
    roofType: 'Gable' | 'Hip' | 'Hip/Gable combination' | 'Flat' | 'Mansard' | 'Mono-pitch' | 'Other' | 'Unknown';
    roofStructure: 'Timber' | 'Steel' | 'Reinforced concrete' | 'Other' | 'Unknown';
    roofCovering: 'Aluminium longspan' | 'Stone-coated' | 'Fibre cement' | 'Concrete tiles' | 'Clay tiles' | 'Other' | 'Unknown';
    features: {
      ridge: boolean;
      hips: boolean;
      valleys: boolean;
      fascia: boolean;
      soffit: boolean;
      gutters: boolean;
      downpipes: boolean;
      flashings: boolean;
      insulation: boolean;
    };
  };
  finishes: {
    walls: 'Plaster/render' | 'Paint' | 'Tiles' | 'Cladding' | 'Combination' | 'Other';
    floors: 'Ceramic' | 'Porcelain' | 'Terrazzo' | 'Vinyl' | 'Concrete' | 'Other';
    ceilings: 'POP' | 'PVC' | 'Plasterboard' | 'Suspended' | 'Fibre cement' | 'No ceiling' | 'Other';
    doors: 'Timber' | 'Aluminium' | 'Steel' | 'Glass' | 'Fire-rated' | 'Other';
    windows: 'Aluminium sliding' | 'Aluminium casement' | 'UPVC' | 'Steel' | 'Louvre' | 'Curtain wall' | 'Other';
  };
  services: {
    electrical: 'Included' | 'Excluded' | 'Separate contract' | 'Unknown';
    plumbing: 'Included' | 'Excluded' | 'Separate contract' | 'Unknown';
    mechanical: 'Included' | 'Excluded' | 'Separate contract' | 'Unknown';
    externalWorks: 'Included' | 'Excluded' | 'Unknown';
    landscaping: 'Included' | 'Excluded' | 'Unknown';
    drainage: 'Included' | 'Excluded' | 'Unknown';
    fenceWall: 'Included' | 'Excluded' | 'Unknown';
    gate: 'Included' | 'Excluded' | 'Unknown';
  };
}

export type ProjectLibraryCategory = 
  | 'Architectural Drawings'
  | 'Structural Drawings'
  | 'Electrical'
  | 'Plumbing'
  | 'BOQ'
  | 'Estimates'
  | 'Valuations'
  | 'Certificates'
  | 'Variations'
  | 'Contracts'
  | 'Reports';

export interface ProjectLibraryItem {
  id: string;
  project_id: string;
  category: ProjectLibraryCategory;
  name: string;
  file_type: string;
  file_size?: string;
  uploaded_at: string;
  url?: string;
  notes?: string;
}

export interface ManualRateBuildUp {
  id?: string;
  description: string;
  category: string;
  subcategory: string;
  unit: string;
  materialCost: number;
  labourCost: number;
  plantCost: number;
  transportCost: number;
  wastePercent: number;
  directCost: number;
  overheadsPercent: number;
  profitPercent: number;
  otherCost: number;
  finalRate: number;
  location: string;
  supplier?: string;
  source: 'My Rates' | 'Company Rates' | "Let's Estimate Rates" | 'Project Rates';
  effectiveDate: string;
  expiryDate?: string;
  notes?: string;
}

export interface DrawingConflict {
  id: string;
  field: string;
  userValue: string;
  detectedValue: string;
  message: string;
  status: 'pending' | 'resolved';
  chosenAction?: 'use_drawing' | 'keep_input' | 'reviewed';
}

export interface DrawingSheet {
  id: string;
  project_id: string;
  sheetNumber?: string;
  title: string;
  discipline: 'Architectural' | 'Structural' | 'Mechanical' | 'Electrical' | 'Civil' | 'Other';
  drawingType?: 'Floor Plan' | 'Elevation' | 'Section' | 'Foundation Plan' | 'Roof Plan' | 'Site Plan' | 'Detail' | 'Other';
  floor?: string;
  scale?: string;
  revision?: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface ManualMeasurement {
  id: string;
  sheetId?: string;
  sheetName?: string;
  pageNumber?: number;
  toolType: 'linear' | 'polyline' | 'area' | 'count' | 'volume' | 'wall' | 'annotation';
  label: string;
  tradeSection: string;
  measuredQuantity: number;
  unit: string;
  scaleRatio: number; // e.g. 100 for 1:100
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    depth?: number;
    area?: number;
    count?: number;
    deductions?: number; // e.g. openings in wall
  };
  points?: Array<{ x: number; y: number }>;
  notes?: string;
  createdAt: string;
  addedToBoq?: boolean;
  boqItemId?: string;
}

export interface TakeoffSession {
  analysisId?: string;
  timestamp?: string;
  engineUsed?: string;
  confidenceScore?: number;
  sheetsAnalyzed?: string[];
  measurements?: ManualMeasurement[];
  missingInformation?: Array<{
    field: string;
    description: string;
    recommendedAction: string;
  }>;
}

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  reference?: string;
  contractor?: string;
  consultant?: string;
  contract_number?: string;
  project_type?: string;
  location: string;
  state?: string;
  country?: string;
  location_details?: {
    state: string;
    city: string;
    siteAddress: string;
    terrain?: string;
  };
  client_name: string;
  client_contact?: string;
  description?: string;
  gfa?: number;
  number_of_floors?: number;
  status?: 'Draft' | 'In Progress' | 'Submitted' | 'Approved' | 'Archived';
  currency?: string;
  start_date?: string;
  target_completion_date?: string;
  drawing_filename: string;
  drawing_url?: string;
  created_at?: string;
  updated_at?: string;
  po_percent: number;             // Default 15% Profit & Overheads
  vat_percent: number;            // Default 7.5% Nigerian VAT
  swamp_premium_percent: number;  // Terrain multiplier e.g. Niger Delta swamp premium %
  waste_percent?: number;         // Default 5%
  contingency_percent?: number;   // Default 5%
  inflation_percent?: number;     // 0%
  retention_percent?: number;     // e.g. 5%
  advance_payment_percent?: number; // e.g. 15%
  target_budget?: number;         // Target overall construction budget
  trade_budgets?: Array<{ id: string; name: string; budget: number; actual_spend?: number; notes?: string }>;
  payment_terms?: string;
  subtotal: number;
  po_amount: number;
  vat_amount: number;
  grand_total: number;
  active_version?: string;
  notes?: string;
  items: BoqItem[];
  questionnaire?: ProjectQuestionnaire;
  conflicts?: DrawingConflict[];
  library?: ProjectLibraryItem[];
  drawings?: DrawingSheet[];
  takeoff?: TakeoffSession;
  manual_measurements?: ManualMeasurement[];
}

export interface RateItem {
  id: string;
  category: string;
  item: string;
  description: string;
  unit: string;
  lagosRate: number;
  portHarcourtRate: number;
  abujaRate: number;
  regionalRate: number;
  breakdown?: {
    materials: number;
    labor: number;
    plant: number;
    wastePercent: number;
    overheadProfitPercent: number;
  };
}

export interface StandardRate {
  id?: string;
  category: string;
  item: string;
  unit: string;
  lagos: number;
  abuja: number;
  ph: number;
  spec: string;
  description?: string;
  lagosRate?: number;
  abujaRate?: number;
  portHarcourtRate?: number;
  regionalRate?: number;
  rate?: number;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface SessionItem {
  token: string;
  created_at: string;
  expires_at: string;
  user_agent: string;
  ip_address: string;
  last_active: string;
  isCurrent?: boolean;
}

export interface EstimateVersion {
  id: string;
  project_id: string;
  version_name: string;
  description?: string;
  subtotal: number;
  grand_total: number;
  items_count?: number;
  snapshot_json?: string;
  created_at: string;
}

export interface ProjectVariation {
  id: string;
  project_id: string;
  variation_number: string;
  description: string;
  section?: string;
  reason?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  type?: 'addition' | 'omission';
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface ProjectValuation {
  id: string;
  project_id: string;
  valuation_number: string;
  valuation_date: string;
  description?: string;
  previous_valuation: number;
  current_valuation: number;
  cumulative_value: number;
  retention_percent: number;
  retention_amount: number;
  advance_payment_deduction: number;
  previous_payments: number;
  amount_due: number;
  status: 'Draft' | 'Certified' | 'Paid';
  created_at: string;
}

export const BESMM4_SECTIONS = [
  'Substructure',
  'Reinforced Concrete Frame',
  'Blockwork & Partitioning',
  'Roofing & Rainwater Goods',
  'Carpentry, Doors & Windows',
  'Finishes (Plastering, Tiling & Screed)',
  'Mechanical & Electrical Services',
  'External Works & Preliminaries',
] as const;

export type Besmm4Section = typeof BESMM4_SECTIONS[number];

export interface TakeoffResponse {
  success: boolean;
  filename: string;
  engineUsed: 'gemini-2.5-flash' | 'intelligent-nigerian-benchmark';
  provider: string;
  drawingSummary?: string;
  items: Array<{
    item: string;
    description: string;
    unit: string;
    qty: number;
    rate?: number;
    section?: string;
  }>;
  error?: string;
}

// --- PHASE 4: RATE ANALYSIS & MY RATES TYPES ---
export interface UserCustomRate {
  id: string;
  user_id: string;
  category: string;
  item: string;
  description: string;
  unit: string;
  rate: number;
  lagosRate?: number;
  abujaRate?: number;
  portHarcourtRate?: number;
  northernRate?: number;
  location?: string;
  source?: string;
  material_cost?: number;
  labour_cost?: number;
  plant_cost?: number;
  created_at?: string;
}

export interface RateBuildUpInput {
  itemTitle: string;
  trade: string;
  unit: string;
  materialCost: number;
  materialWastePercent: number;
  labourDailyGangWage: number;
  dailyGangOutput: number;
  plantCostPerUnit: number;
  overheadProfitPercent: number;
}

export interface RateBuildUpResult {
  netMaterialCost: number;
  labourUnitCost: number;
  plantUnitCost: number;
  primeCost: number;
  overheadProfitAmount: number;
  compositeUnitRate: number;
}

// --- PHASE 5: MATERIAL PROCUREMENT SCHEDULE TYPES ---
export interface MaterialRequirement {
  id: string;
  material: string;
  category: 'Cement' | 'Aggregates' | 'Steel & Rebar' | 'Blocks & Bricks' | 'Timber & Roofing' | 'Finishes';
  formulaBasis: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface MaterialScheduleSummary {
  cementBags50kg: number;
  sandTonnes: number;
  graniteTonnes: number;
  rebarTonnes: number;
  hollowBlocks225mm: number;
  hollowBlocks150mm: number;
  totalDirectMaterialBudget: number;
  items: MaterialRequirement[];
}

// --- PHASE 6: PROJECT DOCUMENTS & COLLABORATION TYPES ---
export interface ProjectDocument {
  id: string;
  project_id: string;
  user_id?: string;
  title: string;
  category: 'Architectural' | 'Structural' | 'Mechanical & Electrical' | 'Geotechnical' | 'Tender & Contract' | 'Site Photo';
  file_name: string;
  file_size: number;
  file_type: string;
  file_path?: string;
  created_at: string;
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_email: string;
  role: 'Lead QS' | 'Estimator' | 'Reviewer' | 'Client';
  created_at: string;
}

export interface ProjectShareLink {
  shareToken: string;
  shareUrl: string;
  accessLevel: 'viewer' | 'reviewer' | 'editor';
  passcode?: string;
  isActive: boolean;
}

// --- PHASE 7: CASH FLOW FORECAST & S-CURVE TYPES ---
export interface CashFlowMilestone {
  id: string;
  project_id: string;
  milestone_name: string;
  stage_order: number;
  percentage: number;
  planned_amount: number;
  month_number: number;
  estimated_completion_date: string;
  status: 'Scheduled' | 'In Progress' | 'Billed' | 'Certified';
  actual_certified_amount: number;
  notes: string;
  created_at?: string;
}

export interface MonthlyCashPoint {
  month: number;
  monthLabel: string;
  plannedMonthly: number;
  plannedCumulative: number;
  actualMonthly: number;
  actualCumulative: number;
  percentageComplete: number;
}

export interface CashFlowForecast {
  projectId: string;
  projectTotal: number;
  durationMonths: number;
  mobilizationAdvancePercent: number;
  mobilizationAdvanceAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  peakMonthlyOutlay: number;
  totalCertifiedToDate: number;
  milestones: CashFlowMilestone[];
  monthlyDistribution: MonthlyCashPoint[];
}

// --- PHASE 8: SUBCONTRACTOR TENDER COMPARISON & BID MATRIX TYPES ---
export interface TenderBidItem {
  id: string;
  bidder_id: string;
  boq_item_id?: string;
  trade_section: string;
  item_name: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
  notes?: string;
}

export interface TenderBidder {
  id: string;
  project_id: string;
  bidder_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  total_bid_amount: number;
  technical_score: number; // 0 - 100
  duration_weeks: number;
  compliance_status: 'Compliant' | 'Non-Responsive' | 'Qualified';
  recommendation_rank: number;
  notes: string;
  created_at?: string;
  items?: TenderBidItem[];
}

export interface TenderAnalysisSummary {
  projectId: string;
  benchmarkTotal: number;
  bidders: TenderBidder[];
  lowestResponsiveBidderId?: string;
  averageBidSum: number;
  highestBidSum: number;
  lowestBidSum: number;
  outlierCount: number;
}

// --- PHASE 9: AI COST RISK & INFLATION FLUCTUATION SIMULATOR TYPES ---
export interface ProjectFluctuation {
  id: string;
  project_id: string;
  clause_type: 'FIDIC_70' | 'NIQS_Fluctuation' | 'Custom';
  base_date: string;
  valuation_date: string;
  base_cement_price: number;
  current_cement_price: number;
  cement_weight: number;
  base_rebar_price: number;
  current_rebar_price: number;
  rebar_weight: number;
  base_diesel_price: number;
  current_diesel_price: number;
  diesel_weight: number;
  base_labour_rate: number;
  current_labour_rate: number;
  labour_weight: number;
  fixed_element: number;
  calculated_multiplier: number;
  original_contract_sum: number;
  claimable_fluctuation_sum: number;
  created_at?: string;
}

export interface ValueEngineeringProposal {
  id: string;
  trade: string;
  originalSpecification: string;
  proposedAlternative: string;
  potentialSavingsNaira: number;
  savingsPercentage: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  structuralFeasibility: string;
  nigerianSupplyChainNotes: string;
}

export interface CostRiskAuditResult {
  overallRiskScore: number; // 0 - 100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  macroeconomicExposure: {
    cementSensitivity: string;
    rebarSensitivity: string;
    fxImportRisk: string;
    fuelHaulageRisk: string;
  };
  valueEngineeringProposals: ValueEngineeringProposal[];
  topCostDrivers: Array<{
    item: string;
    amount: number;
    shareOfTotal: number;
  }>;
  aiExecutiveSummary: string;
}

// --- PHASE 10: BANK TRANSFER BILLING, SUBSCRIPTION & LICENSE TYPES ---
export interface BankPaymentDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const ISAAC_BANK_DETAILS: BankPaymentDetails = {
  bankName: 'Access Bank',
  accountNumber: '081515121',
  accountName: 'Isaac Emmanuel'
};

export interface SubscriptionPlan {
  id: 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license';
  name: string;
  priceNaira: number;
  billingInterval: 'single' | 'month' | 'year' | 'lifetime';
  description: string;
  features: string[];
  popular?: boolean;
}

export interface PaymentTransfer {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license';
  plan_name: string;
  amount_naira: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  transfer_reference: string;
  sender_name: string;
  sender_bank: string;
  transfer_date: string;
  receipt_url?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface UserSubscriptionInfo {
  tier: 'free_trial' | 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license';
  status: 'active' | 'expired' | 'pending_verification';
  isTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  boqCredits: number;
  expiresAt?: string;
  licenseKey?: string;
  canGenerateBoq: boolean;
}

// --- PHASE 11: FINAL ACCOUNT & CONTRACT CLOSEOUT STATEMENT TYPES ---
export interface ProjectFinalAccount {
  id: string;
  project_id: string;
  original_contract_sum: number;
  approved_variations_additions: number;
  approved_variations_omissions: number;
  net_variations: number;
  provisional_sums_adjustment: number;
  prime_cost_adjustment: number;
  fluctuation_claim_amount: number;
  dayworks_amount: number;
  liquidated_damages_deduction: number;
  other_setoffs: number;
  gross_final_account_sum: number;
  total_previous_payments: number;
  total_retention_held: number;
  retention_released: number;
  balance_due_contractor: number;
  practical_completion_date: string;
  defects_liability_end_date: string;
  defects_certificate_issued: boolean | number;
  status: 'Draft' | 'Agreed by QS & Contractor' | 'Certified Final';
  qs_signoff_name: string;
  qs_registration_number: string;
  signoff_date: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

// --- PHASE 12: EXECUTIVE QS PROJECT DOSSIER & AUDIT PACK TYPES ---
export interface ExecutiveDossier {
  project: Project;
  compiledAt: string;
  compiledBy: string;
  summary: {
    subtotal: number;
    vat: number;
    profitOverheads: number;
    contingency: number;
    grandTotal: number;
    gfa: number;
    costPerSqm: number;
  };
  boqTrades: Array<{
    section: string;
    itemCount: number;
    totalAmount: number;
    percentage: number;
  }>;
  materialSummary: Array<{
    category: string;
    item: string;
    totalQty: number;
    unit: string;
    totalCost: number;
  }>;
  cashFlowSummary?: {
    totalMilestones: number;
    contractSum: number;
    peakMonth: number;
    scheduledMonths: number;
  } | null;
  tenderSummary?: TenderAnalysisSummary | null;
  fluctuationSummary?: ProjectFluctuation | null;
  finalAccountSummary?: ProjectFinalAccount | null;
  licenseVerification: {
    leadQs: string;
    registrationNumber: string;
    bankAccount: string;
    accountName: string;
    licenseStatus: string;
    licenseKey: string;
    certifiedAt: string;
  };
}

export type AppGlobalView = 
  | 'dashboard'
  | 'projects'
  | 'project-workspace'
  | 'estimating'
  | 'controls'
  | 'calculators'
  | 'documents'
  | 'team'
  | 'settings'
  | 'help'
  | 'editor'
  | 'landing'
  | 'suppliers'
  | 'materials';

export type EstimatingSubView = 
  | 'boq' 
  | 'takeoff' 
  | 'manual-takeoff'
  | 'rates' 
  | 'analysis' 
  | 'qs-assistant'
  | 'estimate';

export type ProjectControlsSubView = 
  | 'budget' 
  | 'valuations' 
  | 'certificates' 
  | 'variations' 
  | 'payments' 
  | 'final-account';

export type ProjectWorkspaceTab = 
  | 'overview' 
  | 'questionnaire'
  | 'drawings'
  | 'takeoff'
  | 'boq'
  | 'rates'
  | 'summary'
  | 'estimate' 
  | 'cost-control' 
  | 'calculations' 
  | 'documents' 
  | 'activity'
  | 'versions';

export type CertificateType = 
  | 'interim_payment_certificate'
  | 'practical_completion'
  | 'making_good_defects'
  | 'final_payment_certificate';

export interface ProjectCertificate {
  id: string;
  project_id: string;
  certificate_type: CertificateType;
  certificate_number: string;
  issue_date: string;
  contractor_name: string;
  client_name: string;
  project_title: string;
  contract_sum: number;
  gross_valuation: number;
  retention_deduction: number;
  advance_deduction: number;
  previous_payments: number;
  net_amount_certified: number;
  signoff_qs: string;
  signoff_reg_no: string;
  status: 'Draft' | 'Issued' | 'Honoured' | 'Pending';
  notes?: string;
  defects_period_months?: number;
  completion_date?: string;
}

export type CalculatorCategory = 
  | 'construction'
  | 'civil'
  | 'structural'
  | 'qs'
  | 'budgeting';

export interface SavedProjectCalculation {
  id: string;
  project_id: string;
  category: CalculatorCategory;
  title: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  formula_notes: string;
  created_at: string;
  applied_to_boq?: boolean;
}

export interface BoqReviewMetrics {
  totalItems: number;
  confirmedItems: number;
  requiresReviewItems: number;
  missingInformationCount: number;
  assumptionsCount: number;
  conflictsCount: number;
}

export interface SupplierItemPrice {
  name: string;
  unit: string;
  rate: number;
  currency?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: 
    | 'Cement & Aggregates' 
    | 'Steel & Rebar' 
    | 'Blocks & Masonry' 
    | 'Roofing & Cladding' 
    | 'MEP & Electrical' 
    | 'Timber & Formwork' 
    | 'Finishing & Tiles' 
    | 'Plant & Equipment Hire'
    | 'Labour & Subcontractors'
    | 'Preliminaries & Site Services'
    | 'General Materials'
    | string;
  resourceType?: 'material' | 'plant' | 'labour' | 'preliminaries';
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  state: string;
  coverageAreas: string;
  leadTime: string;
  minOrder: string;
  paymentTerms: string;
  verificationStatus: 'Verified' | 'Pending' | 'Preferred Partner';
  rating: number;
  notes?: string;
  materials: SupplierItemPrice[];
  createdAt?: string;
}

export interface LibraryRateItem {
  id: string;
  type: 'Material' | 'Plant' | 'Labour' | 'Preliminaries';
  category: string;
  item: string;
  specification: string;
  unit: string;
  lagosRate: number;
  abujaRate: number;
  portHarcourtRate: number;
  northernRate: number;
  materialComponent?: number;
  labourComponent?: number;
  plantComponent?: number;
  overheadProfitPercent?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
  lastUpdated?: string;
  keySuppliers?: string[];
  isCustom?: boolean;
}

export interface MaterialMarketItem {
  id: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  lagosRate: number;
  abujaRate: number;
  portHarcourtRate: number;
  northernRate: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  lastUpdated: string;
  keySuppliers: string[];
}



