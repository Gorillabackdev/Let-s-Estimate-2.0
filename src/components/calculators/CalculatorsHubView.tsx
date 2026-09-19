import React, { useState } from 'react';
import { 
  Calculator, 
  Layers, 
  Building2, 
  TrendingUp, 
  HeartHandshake, 
  AlertTriangle, 
  Check, 
  Copy, 
  Save, 
  RefreshCw,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { CalculatorCategory, Project } from '../../types';
import { formatNaira, formatNumber } from '../../utils/format';
import { FormattedNumberInput } from '../common/FormattedNumberInput';

export interface TemplateBoqItem {
  item: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  section: string;
}

interface CalculatorsHubViewProps {
  onApplyToBoq?: (item: { item: string; description: string; qty: number; unit: string; rate?: number; amount?: number; section?: string }) => void;
  onApplyBulkToBoq?: (
    items: TemplateBoqItem[],
    options?: {
      targetProjectId?: string;
      createAsNewProject?: boolean;
      newProjectTitle?: string;
      newProjectLocation?: string;
      newProjectType?: string;
    }
  ) => Promise<void> | void;
  activeProject?: Project;
  projects?: Project[];
}

export const CalculatorsHubView: React.FC<CalculatorsHubViewProps> = ({ 
  onApplyToBoq, 
  onApplyBulkToBoq,
  activeProject,
  projects = []
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CalculatorCategory>('construction');
  const [activeCalcId, setActiveCalcId] = useState<string>('concrete_volume');
  const [copied, setCopied] = useState(false);

  // Transfer to BOQ Modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<'active' | 'new'>('active');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || '');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('Lagos, Nigeria');
  const [newProjectType, setNewProjectType] = useState('NGO / Healthcare Outreach');
  const [transferDetailLevel, setTransferDetailLevel] = useState<'detailed' | 'consolidated'>('detailed');
  const [isTransferring, setIsTransferring] = useState(false);

  // Construction calculator state
  const [length, setLength] = useState<number>(10);
  const [width, setWidth] = useState<number>(5);
  const [thickness, setThickness] = useState<number>(0.15); // 150mm slab or depth
  const [mixRatio, setMixRatio] = useState<string>('1:2:4'); // Grade 20/25

  // Blockwork state
  const [wallLength, setWallLength] = useState<number>(20);
  const [wallHeight, setWallHeight] = useState<number>(3.0);
  const [blockThickness, setBlockThickness] = useState<'225mm' | '150mm'>('225mm');
  const [deductionOpenings, setDeductionOpenings] = useState<number>(4.2); // Doors & windows area m2

  // Civil Earthworks state
  const [trenchLength, setTrenchLength] = useState<number>(50);
  const [trenchWidth, setTrenchWidth] = useState<number>(0.675); // 675mm standard foundation trench
  const [trenchDepth, setTrenchDepth] = useState<number>(1.2); // 1.2m deep
  const [soilSwellPercent, setSoilSwellPercent] = useState<number>(25);

  // Structural Rebar state
  const [barDiameter, setBarDiameter] = useState<number>(16); // Y16
  const [totalBarLength, setTotalBarLength] = useState<number>(120); // 120 metres total
  const [steelPricePerTonne, setSteelPricePerTonne] = useState<number>(1350000);

  // QS Markup state
  const [primeCost, setPrimeCost] = useState<number>(5000000);
  const [wastePercent, setWastePercent] = useState<number>(5);
  const [overheadsPercent, setOverheadsPercent] = useState<number>(10);
  const [profitPercent, setProfitPercent] = useState<number>(10);
  const [vatPercent, setVatPercent] = useState<number>(7.5);

  // NGO / Community / Healthcare Outreach Budget state (Item 30)
  const [beneficiaries, setBeneficiaries] = useState<number>(750);
  const [outreachDays, setOutreachDays] = useState<number>(3);
  const [outreachLocation, setOutreachLocation] = useState<string>('Ikorodu Community Health Centre, Lagos');
  
  // Personnel
  const [medicalPersonnelCount, setMedicalPersonnelCount] = useState<number>(6);
  const [medicalPersonnelDailyRate, setMedicalPersonnelDailyRate] = useState<number>(35000);
  const [volunteersCount, setVolunteersCount] = useState<number>(10);
  const [volunteersDailyStipend, setVolunteersDailyStipend] = useState<number>(8000);

  // Materials & Consumables
  const [medicalConsumablesCost, setMedicalConsumablesCost] = useState<number>(1250000); // Drugs, test kits, swabs
  const [ppeCost, setPpeCost] = useState<number>(180000); // Gloves, masks, sanitizers

  // Logistics & Venue
  const [venueHireCost, setVenueHireCost] = useState<number>(150000); // Hall/canopy/chairs
  const [powerCost, setPowerCost] = useState<number>(95000); // Generator rental & fuel
  const [securityCost, setSecurityCost] = useState<number>(60000); // Local security/policing
  const [wasteDisposalCost, setWasteDisposalCost] = useState<number>(45000); // Medical waste collection
  const [communicationCost, setCommunicationCost] = useState<number>(80000); // PA system, banners, town crier

  // Transportation & Accommodation
  const [transportationCost, setTransportationCost] = useState<number>(350000); // Vehicle hire, ambulance standby, logistics
  const [accommodationCost, setAccommodationCost] = useState<number>(240000); // Lodging for non-local team
  const [feedingCost, setFeedingCost] = useState<number>(288000); // Meals, water & refreshments

  // Administration & Contingency
  const [administrationCost, setAdministrationCost] = useState<number>(120000); // Badges, documentation, permits
  const [contingencyPercent, setContingencyPercent] = useState<number>(7.5); // 7.5% unforeseen

  // Computed Community Outreach Calculations
  const personnelCost = (medicalPersonnelCount * medicalPersonnelDailyRate * outreachDays) + 
                        (volunteersCount * volunteersDailyStipend * outreachDays);
  const materialsConsumablesCost = medicalConsumablesCost + ppeCost;
  const venueLogisticsCost = venueHireCost + powerCost + securityCost + wasteDisposalCost + communicationCost;
  const travelLodgingCost = transportationCost + accommodationCost + feedingCost;
  const administrationSubtotal = administrationCost;
  
  const outreachSubtotal = personnelCost + materialsConsumablesCost + venueLogisticsCost + travelLodgingCost + administrationSubtotal;
  const contingencyAmount = Math.round(outreachSubtotal * (contingencyPercent / 100));
  const totalOutreachBudget = outreachSubtotal + contingencyAmount;
  const costPerBeneficiary = beneficiaries > 0 ? Math.round(totalOutreachBudget / beneficiaries) : 0;

  // Computed results
  // 1. Concrete
  const concreteVolumeM3 = Number((length * width * thickness).toFixed(3));
  // Standard 1:2:4 mix per m3: ~6.4 bags cement, ~0.44 m3 sand, ~0.88 m3 granite
  const cementBags = Math.ceil(concreteVolumeM3 * 6.4);
  const sandTonnes = Number((concreteVolumeM3 * 0.44 * 1.5).toFixed(2));
  const graniteTonnes = Number((concreteVolumeM3 * 0.88 * 1.6).toFixed(2));

  // 2. Blockwork
  const grossWallArea = wallLength * wallHeight;
  const netWallArea = Math.max(0, grossWallArea - deductionOpenings);
  // 10 blocks per m2 (allowing standard mortar joints) + 5% waste
  const blocksCount = Math.ceil(netWallArea * 10 * 1.05);
  const mortarCementBags = Math.ceil(blocksCount / (blockThickness === '225mm' ? 40 : 55));

  // 3. Earthwork Excavation
  const excavatedVolume = Number((trenchLength * trenchWidth * trenchDepth).toFixed(2));
  const looseSoilVolume = Number((excavatedVolume * (1 + soilSwellPercent / 100)).toFixed(2));
  const tipperLoads = Math.ceil(looseSoilVolume / 5); // 5m3 tipper truck

  // 4. Structural Rebar
  // Weight (kg/m) = D^2 / 162
  const unitWeightKgPerM = (barDiameter * barDiameter) / 162;
  const totalRebarWeightKg = Number((totalBarLength * unitWeightKgPerM).toFixed(2));
  const totalRebarTonnes = Number((totalRebarWeightKg / 1000).toFixed(3));
  const standardLengths12m = Math.ceil(totalBarLength / 12);
  const steelEstimatedCost = Math.round(totalRebarTonnes * steelPricePerTonne);

  // 5. QS Markup
  const costWithWaste = primeCost * (1 + wastePercent / 100);
  const overheadAmount = costWithWaste * (overheadsPercent / 100);
  const profitAmount = (costWithWaste + overheadAmount) * (profitPercent / 100);
  const subtotalCost = costWithWaste + overheadAmount + profitAmount;
  const vatAmount = subtotalCost * (vatPercent / 100);
  const grossTenderSum = subtotalCost + vatAmount;

  const categories: Array<{ id: CalculatorCategory; label: string; count: number; icon: any }> = [
    { id: 'construction', label: 'Construction', count: 12, icon: Building2 },
    { id: 'civil', label: 'Civil Engineering', count: 11, icon: Layers },
    { id: 'structural', label: 'Structural (Estimating)', count: 10, icon: AlertTriangle },
    { id: 'qs', label: 'Quantity Surveying', count: 10, icon: Calculator },
    { id: 'budgeting', label: 'Project Budgeting / NGO', count: 9, icon: HeartHandshake },
  ];

  // Helper to compile items for transfer to BOQ
  const getCalculatedItems = (): TemplateBoqItem[] => {
    if (selectedCategory === 'budgeting') {
      if (transferDetailLevel === 'detailed') {
        const items: TemplateBoqItem[] = [];
        if (medicalPersonnelCount > 0) {
          items.push({
            item: `Medical Doctors & Nurses (${medicalPersonnelCount} Staff)`,
            description: `Provision of professional medical staff for ${outreachDays} days outreach at ${outreachLocation}`,
            qty: medicalPersonnelCount * outreachDays,
            unit: 'man-day',
            rate: medicalPersonnelDailyRate,
            amount: medicalPersonnelCount * medicalPersonnelDailyRate * outreachDays,
            section: 'Personnel & Medical Staff'
          });
        }
        if (volunteersCount > 0) {
          items.push({
            item: `Community Field Volunteers (${volunteersCount} Volunteers)`,
            description: `Field coordination, crowd orientation and patient ushering for ${outreachDays} days`,
            qty: volunteersCount * outreachDays,
            unit: 'volunteer-day',
            rate: volunteersDailyStipend,
            amount: volunteersCount * volunteersDailyStipend * outreachDays,
            section: 'Personnel & Medical Staff'
          });
        }
        if (medicalConsumablesCost > 0) {
          items.push({
            item: 'Essential Drugs & Diagnostic Test Kits',
            description: 'Procurement of antimalarials, antibiotics, rapid malaria test kits, glucometers, and diagnostic consumables',
            qty: 1,
            unit: 'sum',
            rate: medicalConsumablesCost,
            amount: medicalConsumablesCost,
            section: 'Medical Supplies & Consumables'
          });
        }
        if (ppeCost > 0) {
          items.push({
            item: 'PPE & Infection Control Consumables',
            description: 'Latex gloves, surgical face masks, alcohol hand sanitizers, and antiseptic dressings',
            qty: 1,
            unit: 'sum',
            rate: ppeCost,
            amount: ppeCost,
            section: 'Medical Supplies & Consumables'
          });
        }
        if (venueHireCost > 0) {
          items.push({
            item: 'Venue Canopy, Seating & Registration Desk Hire',
            description: 'Erection of canopies, seating chairs, tables and consultation partitions',
            qty: 1,
            unit: 'sum',
            rate: venueHireCost,
            amount: venueHireCost,
            section: 'Venue, Logistics & Power'
          });
        }
        if (powerCost > 0) {
          items.push({
            item: 'Primary & Standby Generator Power Supply',
            description: 'Generator plant hire and diesel/petrol fueling for cold chain vaccine/drug refrigeration and lighting',
            qty: 1,
            unit: 'sum',
            rate: powerCost,
            amount: powerCost,
            section: 'Venue, Logistics & Power'
          });
        }
        if (securityCost > 0) {
          items.push({
            item: 'Site Security & Crowd Marshalling',
            description: 'Local policing and community security detail for crowd safety and queue management',
            qty: 1,
            unit: 'sum',
            rate: securityCost,
            amount: securityCost,
            section: 'Venue, Logistics & Power'
          });
        }
        if (wasteDisposalCost > 0) {
          items.push({
            item: 'Biohazard Medical Waste Collection & Incineration',
            description: 'Sharps boxes, biohazard containment bags and certified medical incinerator disposal service',
            qty: 1,
            unit: 'sum',
            rate: wasteDisposalCost,
            amount: wasteDisposalCost,
            section: 'Venue, Logistics & Power'
          });
        }
        if (communicationCost > 0) {
          items.push({
            item: 'Community Sensitization & Public Address (PA)',
            description: 'Pre-outreach town crier, publicity banners, flyers and site public address sound system',
            qty: 1,
            unit: 'sum',
            rate: communicationCost,
            amount: communicationCost,
            section: 'Venue, Logistics & Power'
          });
        }
        if (transportationCost > 0) {
          items.push({
            item: 'Logistics, Ambulance Standby & Field Transportation',
            description: 'Personnel commuting bus hire, logistics vehicles and standby emergency evacuation vehicle',
            qty: 1,
            unit: 'sum',
            rate: transportationCost,
            amount: transportationCost,
            section: 'Travel, Lodging & Catering'
          });
        }
        if (accommodationCost > 0) {
          items.push({
            item: 'Non-Local Medical Team Field Lodging',
            description: 'Hotel accommodation and field lodging for non-resident medical personnel',
            qty: 1,
            unit: 'sum',
            rate: accommodationCost,
            amount: accommodationCost,
            section: 'Travel, Lodging & Catering'
          });
        }
        if (feedingCost > 0) {
          items.push({
            item: 'Team Catering, Potable Bottled Water & Refreshments',
            description: 'Breakfast, lunch, safe drinking water and hydration for medical personnel and volunteers',
            qty: 1,
            unit: 'sum',
            rate: feedingCost,
            amount: feedingCost,
            section: 'Travel, Lodging & Catering'
          });
        }
        if (administrationCost > 0) {
          items.push({
            item: 'Administrative Oversight, Local Permits & Reporting',
            description: 'Stakeholder clearance permits, ID badges, printing patient cards and post-intervention report',
            qty: 1,
            unit: 'sum',
            rate: administrationCost,
            amount: administrationCost,
            section: 'Administration & Contingency'
          });
        }
        if (contingencyAmount > 0) {
          items.push({
            item: `Unforeseen Contingency Provision (${contingencyPercent}%)`,
            description: 'Emergency contingency allowance for unpredictable site requirements',
            qty: 1,
            unit: 'sum',
            rate: contingencyAmount,
            amount: contingencyAmount,
            section: 'Administration & Contingency'
          });
        }
        return items;
      } else {
        return [{
          item: `Community Healthcare Outreach (${outreachDays} Days)`,
          description: `Complete healthcare intervention at ${outreachLocation} serving ${beneficiaries} beneficiaries. Full personnel, drug consumables, venue, logistics and ${contingencyPercent}% contingency.`,
          qty: beneficiaries,
          unit: 'beneficiary',
          rate: costPerBeneficiary,
          amount: totalOutreachBudget,
          section: 'Healthcare Outreach Budget'
        }];
      }
    }

    if (selectedCategory === 'construction') {
      if (transferDetailLevel === 'detailed') {
        return [
          {
            item: 'Grade 42.5R Ordinary Portland Cement (1:2:4 Concrete)',
            description: `CEM I 42.5R Portland cement for ${concreteVolumeM3} m³ concrete slab/beams`,
            qty: cementBags,
            unit: 'bag',
            rate: 9500,
            amount: cementBags * 9500,
            section: 'Reinforced Concrete Superstructure'
          },
          {
            item: 'Clean Sharp Concrete River Sand',
            description: 'Clean sharp washed concrete aggregate sand free from clay silt',
            qty: sandTonnes,
            unit: 'tonne',
            rate: 6500,
            amount: Math.round(sandTonnes * 6500),
            section: 'Reinforced Concrete Superstructure'
          },
          {
            item: 'Crushed Blue Granite Aggregate 20mm (3/4")',
            description: 'Machine-crushed angular igneous granite aggregate for structural concrete',
            qty: graniteTonnes,
            unit: 'tonne',
            rate: 11500,
            amount: Math.round(graniteTonnes * 11500),
            section: 'Reinforced Concrete Superstructure'
          },
          {
            item: 'Concrete Batching, Placing & Curing Labor',
            description: 'Mechanical mixing, pouring, poker vibrator compaction and water curing',
            qty: concreteVolumeM3,
            unit: 'm3',
            rate: 18500,
            amount: Math.round(concreteVolumeM3 * 18500),
            section: 'Labor & Plant'
          }
        ];
      } else {
        const totalCost = (cementBags * 9500) + (sandTonnes * 6500) + (graniteTonnes * 11500) + (concreteVolumeM3 * 18500);
        const unitRate = Math.round(totalCost / (concreteVolumeM3 || 1));
        return [{
          item: 'Reinforced Concrete Grade 20/25 (1:2:4)',
          description: `Vibrated reinforced concrete Grade 20/25 in beams and suspended slabs including cement, aggregates, and batching labor. Total volume: ${concreteVolumeM3} m³ (${mixRatio} mix).`,
          qty: concreteVolumeM3,
          unit: 'm3',
          rate: unitRate,
          amount: totalCost,
          section: 'Reinforced Concrete Superstructure'
        }];
      }
    }

    if (selectedCategory === 'civil') {
      const excavationCost = Math.round(excavatedVolume * 4200);
      return [{
        item: 'Excavation of Foundation Trenches',
        description: `Excavate trench not exceeding 1.5m deep in normal soil, width ${trenchWidth}m, length ${trenchLength}m; including levelling, ramming bottom, and carting away surplus soil (${looseSoilVolume}m³ loose, ~${tipperLoads} tipper trips).`,
        qty: excavatedVolume,
        unit: 'm3',
        rate: 4200,
        amount: excavationCost,
        section: 'Substructure Earthworks'
      }];
    }

    if (selectedCategory === 'structural') {
      return [{
        item: `High-Yield Deformed Steel Rebar Y${barDiameter}`,
        description: `High-yield deformed rebar Y${barDiameter} (fy >= 460 N/mm²) including cutting, bending, lifting and fixing in place with binding wire. Total length ${totalBarLength}m (${standardLengths12m} standard 12m lengths).`,
        qty: totalRebarTonnes,
        unit: 'tonne',
        rate: steelPricePerTonne,
        amount: steelEstimatedCost,
        section: 'Reinforced Concrete Frame'
      }];
    }

    if (selectedCategory === 'qs') {
      return [{
        item: 'Prime Cost & Preliminaries with QS Markups',
        description: `Comprehensive project tender pricing including ${wastePercent}% waste, ${overheadsPercent}% overheads, ${profitPercent}% profit, and ${vatPercent}% VAT.`,
        qty: 1,
        unit: 'sum',
        rate: Math.round(grossTenderSum),
        amount: Math.round(grossTenderSum),
        section: 'Preliminaries & General Summary'
      }];
    }

    return [];
  };

  const handleOpenTransferModal = () => {
    if (selectedCategory === 'budgeting') {
      setNewProjectTitle(`Community Health Outreach - ${outreachLocation.split(',')[0]}`);
      setNewProjectLocation(outreachLocation);
      setNewProjectType('Community');
    } else if (selectedCategory === 'construction') {
      setNewProjectTitle(`Concrete Superstructure (${concreteVolumeM3} m³) Takeoff Project`);
      setNewProjectLocation('Lagos, Nigeria');
      setNewProjectType('Residential');
    } else if (selectedCategory === 'civil') {
      setNewProjectTitle(`Civil Earthworks & Foundation Trenches Project`);
      setNewProjectLocation('Lagos, Nigeria');
      setNewProjectType('Infrastructure');
    } else {
      setNewProjectTitle(`${selectedCategory.toUpperCase()} Estimation Project`);
      setNewProjectLocation('Lagos, Nigeria');
      setNewProjectType('Commercial');
    }
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async () => {
    const items = getCalculatedItems();
    if (items.length === 0) {
      alert('No line items to transfer.');
      return;
    }

    setIsTransferring(true);
    try {
      if (onApplyBulkToBoq) {
        await onApplyBulkToBoq(items, {
          targetProjectId: transferTarget === 'active' ? (selectedProjectId || activeProject?.id) : undefined,
          createAsNewProject: transferTarget === 'new',
          newProjectTitle: newProjectTitle.trim(),
          newProjectLocation: newProjectLocation.trim(),
          newProjectType: newProjectType
        });
      } else if (onApplyToBoq) {
        items.forEach(it => onApplyToBoq(it));
      }
      setIsTransferModalOpen(false);
    } catch (err: any) {
      alert('Transfer failed: ' + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const transferPreviewItems = getCalculatedItems();
  const transferTotalSum = transferPreviewItems.reduce((acc, it) => acc + it.amount, 0);

  return (
    <div id="calculators-tools-hub" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Calculators &amp; Engineering Aids
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Verified construction material schedules, civil earthworks volumetrics, reinforcement bar weights, and community outreach budget calculators.
        </p>
      </div>

      {/* Structural Disclaimer Notice */}
      {selectedCategory === 'structural' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5">Engineering Notice &amp; Disclaimer</span>
            <span>Preliminary calculation and quantity takeoff estimating aid only. Does not replace a qualified civil/structural engineer licensed under COREN/IStructE.</span>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                isActive ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Calculator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Inputs and Interactive Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          
          {selectedCategory === 'construction' && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>Concrete Volume &amp; Mix Constituents (BESMM4)</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  IS / BS 8110 Standard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Length (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={length === 0 ? '' : length}
                    placeholder="0"
                    onChange={(e) => setLength(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={width === 0 ? '' : width}
                    placeholder="0"
                    onChange={(e) => setWidth(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thickness / Depth (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={thickness === 0 ? '' : thickness}
                    placeholder="0"
                    onChange={(e) => setThickness(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 0.15 for 150mm slab</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Or Estimate Sandcrete Blockwork:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total Wall Length (m)</label>
                    <input
                      type="number"
                      value={wallLength === 0 ? '' : wallLength}
                      placeholder="0"
                      onChange={(e) => setWallLength(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Wall Height (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={wallHeight === 0 ? '' : wallHeight}
                      placeholder="0"
                      onChange={(e) => setWallHeight(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Block Type</label>
                    <select
                      value={blockThickness}
                      onChange={(e: any) => setBlockThickness(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                    >
                      <option value="225mm">225mm (9-inch) Hollow</option>
                      <option value="150mm">150mm (6-inch) Hollow</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedCategory === 'civil' && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span>Earthworks Excavation, Bulking &amp; Haulage</span>
                </h3>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Civil Engineering Aid
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trench Length (m)</label>
                  <input
                    type="number"
                    value={trenchLength === 0 ? '' : trenchLength}
                    placeholder="0"
                    onChange={(e) => setTrenchLength(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trench Width (m)</label>
                  <input
                    type="number"
                    step="0.025"
                    value={trenchWidth === 0 ? '' : trenchWidth}
                    placeholder="0"
                    onChange={(e) => setTrenchWidth(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Excavation Depth (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={trenchDepth === 0 ? '' : trenchDepth}
                    placeholder="0"
                    onChange={(e) => setTrenchDepth(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>
            </>
          )}

          {selectedCategory === 'structural' && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>High-Yield Steel Rebar Weight &amp; Procurement Tonnage</span>
                </h3>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  D^2 / 162 Formula
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bar Diameter</label>
                  <select
                    value={barDiameter}
                    onChange={(e) => setBarDiameter(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  >
                    <option value={8}>Y8 (0.395 kg/m)</option>
                    <option value={10}>Y10 (0.617 kg/m)</option>
                    <option value={12}>Y12 (0.888 kg/m)</option>
                    <option value={16}>Y16 (1.580 kg/m)</option>
                    <option value={20}>Y20 (2.469 kg/m)</option>
                    <option value={25}>Y25 (3.858 kg/m)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Metres Required</label>
                  <FormattedNumberInput
                    value={totalBarLength}
                    placeholder="0"
                    maxDecimals={2}
                    onChange={(val) => setTotalBarLength(val)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tonne Market Rate (₦)</label>
                  <FormattedNumberInput
                    value={steelPricePerTonne}
                    placeholder="0"
                    maxDecimals={0}
                    onChange={(val) => setSteelPricePerTonne(val)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>
            </>
          )}

          {selectedCategory === 'qs' && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  <span>Quantity Surveying Markups, Overheads &amp; VAT Engine</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Net Prime Cost (₦)</label>
                  <FormattedNumberInput
                    value={primeCost}
                    placeholder="0"
                    maxDecimals={0}
                    onChange={(val) => setPrimeCost(val)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Overheads (%)</label>
                  <input
                    type="number"
                    value={overheadsPercent === 0 ? '' : overheadsPercent}
                    placeholder="0"
                    onChange={(e) => setOverheadsPercent(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Profit (%)</label>
                  <input
                    type="number"
                    value={profitPercent === 0 ? '' : profitPercent}
                    placeholder="0"
                    onChange={(e) => setProfitPercent(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>
            </>
          )}

          {selectedCategory === 'budgeting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-amber-700" />
                    <span>Community / Outreach Project Budgeting</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Structured activity budgeting for medical missions, public health outreaches, NGO campaigns &amp; non-building interventions.
                  </p>
                </div>
              </div>

              {/* 1. General Outreach Scope */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  1. Outreach Scope &amp; Target
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Outreach Location / Community Centre</label>
                    <input
                      type="text"
                      value={outreachLocation}
                      onChange={(e) => setOutreachLocation(e.target.value)}
                      placeholder="e.g. Ikorodu PHC, Lagos"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-medium text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Target Beneficiaries</label>
                    <FormattedNumberInput
                      value={beneficiaries}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setBeneficiaries(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Number of Days</label>
                    <input
                      type="number"
                      value={outreachDays === 0 ? '' : outreachDays}
                      placeholder="0"
                      onChange={(e) => setOutreachDays(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Personnel */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  2. Medical Personnel &amp; Volunteers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Medical Personnel</label>
                    <input
                      type="number"
                      value={medicalPersonnelCount === 0 ? '' : medicalPersonnelCount}
                      placeholder="0"
                      onChange={(e) => setMedicalPersonnelCount(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Daily Rate (₦)</label>
                    <FormattedNumberInput
                      value={medicalPersonnelDailyRate}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setMedicalPersonnelDailyRate(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Volunteers</label>
                    <input
                      type="number"
                      value={volunteersCount === 0 ? '' : volunteersCount}
                      placeholder="0"
                      onChange={(e) => setVolunteersCount(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Volunteer Stipend (₦)</label>
                    <FormattedNumberInput
                      value={volunteersDailyStipend}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setVolunteersDailyStipend(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Consumables & PPE */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  3. Consumables &amp; Safety Equipment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Medical Consumables &amp; Drugs (₦)</label>
                    <FormattedNumberInput
                      value={medicalConsumablesCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setMedicalConsumablesCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">PPE &amp; Protective Gear (₦)</label>
                    <FormattedNumberInput
                      value={ppeCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setPpeCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Logistics, Venue & Power */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  4. Logistics, Venue &amp; Facilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Venue Rental / Canopies (₦)</label>
                    <FormattedNumberInput
                      value={venueHireCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setVenueHireCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Power / Generator &amp; Diesel (₦)</label>
                    <FormattedNumberInput
                      value={powerCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setPowerCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Security / Policing (₦)</label>
                    <FormattedNumberInput
                      value={securityCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setSecurityCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Clinical Waste Disposal (₦)</label>
                    <FormattedNumberInput
                      value={wasteDisposalCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setWasteDisposalCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Communication / PA System / Banners (₦)</label>
                    <FormattedNumberInput
                      value={communicationCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setCommunicationCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Transportation, Lodging & Feeding */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  5. Transportation &amp; Accommodation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Transportation &amp; Haulage (₦)</label>
                    <FormattedNumberInput
                      value={transportationCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setTransportationCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Accommodation / Lodging (₦)</label>
                    <FormattedNumberInput
                      value={accommodationCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setAccommodationCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Feeding &amp; Refreshments (₦)</label>
                    <FormattedNumberInput
                      value={feedingCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setFeedingCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Administration & Contingency */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  6. Administration &amp; Contingency
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Administration / Documentation (₦)</label>
                    <FormattedNumberInput
                      value={administrationCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setAdministrationCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Contingency Reserve (%)</label>
                    <input
                      type="number"
                      value={contingencyPercent === 0 ? '' : contingencyPercent}
                      placeholder="0"
                      onChange={(e) => setContingencyPercent(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: COMPUTED SCHEDULE & DIRECT BOQ ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Calculated Schedule
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live Result
              </span>
            </div>

            {selectedCategory === 'construction' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <div className="text-slate-600">Net Concrete Volume:</div>
                  <div className="text-2xl font-extrabold text-emerald-950 mt-0.5">{formatNumber(concreteVolumeM3)} m³</div>
                  <div className="text-[11px] text-emerald-800 mt-1">Grade 20/25 (1:2:4 batch ratio)</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Cement (50kg bags):</span>
                    <span className="font-bold text-slate-900">{formatNumber(cementBags)} bags</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Sharp Sand:</span>
                    <span className="font-bold text-slate-900">{formatNumber(sandTonnes)} tonnes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Crushed Granite (20mm):</span>
                    <span className="font-bold text-slate-900">{formatNumber(graniteTonnes)} tonnes</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                    <span>Sandcrete Blocks (9&quot;):</span>
                    <span className="font-bold text-slate-700">{formatNumber(blocksCount)} pcs</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'civil' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <div className="text-slate-600">Solid Excavation Volume:</div>
                  <div className="text-2xl font-extrabold text-blue-950 mt-0.5">{formatNumber(excavatedVolume)} m³</div>
                  <div className="text-[11px] text-blue-800 mt-1">In-situ trench cut</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Loose Bulked Volume (+25%):</span>
                    <span className="font-bold text-slate-900">{formatNumber(looseSoilVolume)} m³</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tipper Trips (5m³ body):</span>
                    <span className="font-bold text-slate-900">{formatNumber(tipperLoads)} trips</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'structural' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div className="text-slate-600">Total Steel Tonnage:</div>
                  <div className="text-2xl font-extrabold text-amber-950 mt-0.5">{formatNumber(totalRebarTonnes)} Tonnes</div>
                  <div className="text-[11px] text-amber-800 mt-1">Y{barDiameter} High Yield Deformed Bars</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Total Weight:</span>
                    <span className="font-bold text-slate-900">{formatNumber(totalRebarWeightKg)} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Standard 12m Lengths:</span>
                    <span className="font-bold text-slate-900">{formatNumber(standardLengths12m)} lengths</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Estimated Rebar Sum:</span>
                    <span className="font-extrabold text-emerald-800">{formatNaira(steelEstimatedCost)}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'qs' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <div className="text-slate-600">Gross Tender Estimate:</div>
                  <div className="text-xl font-extrabold text-emerald-950 mt-0.5">{formatNaira(grossTenderSum)}</div>
                  <div className="text-[11px] text-emerald-800 mt-1">Net cost + 10% O&amp;P + 7.5% VAT</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Waste (+5%):</span>
                    <span className="font-bold text-slate-900">{formatNaira(costWithWaste - primeCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Overhead &amp; Profit:</span>
                    <span className="font-bold text-slate-900">{formatNaira(overheadAmount + profitAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">7.5% Nigerian VAT:</span>
                    <span className="font-bold text-slate-900">{formatNaira(vatAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'budgeting' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <div className="text-slate-600 font-semibold">TOTAL PROJECT BUDGET:</div>
                  <div className="text-xl font-black text-amber-950 mt-0.5">{formatNaira(totalOutreachBudget)}</div>
                  <div className="flex items-center justify-between text-[11px] text-amber-900 mt-1 font-medium">
                    <span>{outreachDays} Days &bull; {formatNumber(beneficiaries)} Beneficiaries</span>
                    <span className="font-bold bg-amber-200/60 px-2 py-0.5 rounded">{formatNaira(costPerBeneficiary)} / person</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Personnel Cost:</span>
                    <span className="font-bold text-slate-900">{formatNaira(personnelCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Materials &amp; Consumables:</span>
                    <span className="font-bold text-slate-900">{formatNaira(materialsConsumablesCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Logistics &amp; Facilities:</span>
                    <span className="font-bold text-slate-900">{formatNaira(venueLogisticsCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Transportation:</span>
                    <span className="font-bold text-slate-900">{formatNaira(transportationCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Accommodation &amp; Feeding:</span>
                    <span className="font-bold text-slate-900">{formatNaira(accommodationCost + feedingCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Administration:</span>
                    <span className="font-bold text-slate-900">{formatNaira(administrationSubtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Contingency ({contingencyPercent}%):</span>
                    <span className="font-bold text-slate-900">{formatNaira(contingencyAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-5 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={handleOpenTransferModal}
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{selectedCategory === 'budgeting' ? 'Transfer Outreach Budget to Project BOQ' : 'Transfer Template Takeoff to BOQ'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Result Summary'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODAL: TRANSFER TAKEOFF TEMPLATE TO BOQ */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  Transfer Takeoff Template to BOQ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Persists calculated takeoff quantities and rates directly into your project bill of quantities in SQLite.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Destination Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Target Destination
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransferTarget('active')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    transferTarget === 'active'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Add to Existing Project</span>
                    {transferTarget === 'active' && <Check className="w-4 h-4 text-emerald-700" />}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1 truncate">
                    {activeProject ? activeProject.title : 'Active Project'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferTarget('new')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    transferTarget === 'new'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Create Brand New Project</span>
                    {transferTarget === 'new' && <Check className="w-4 h-4 text-emerald-700" />}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Start a fresh standalone project BOQ
                  </span>
                </button>
              </div>

              {transferTarget === 'active' && projects.length > 0 && (
                <div className="mt-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Project:</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.location})</option>
                    ))}
                  </select>
                </div>
              )}

              {transferTarget === 'new' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Project Title *</label>
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      placeholder="e.g. Community Health Outreach - Ikorodu"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={newProjectLocation}
                        onChange={(e) => setNewProjectLocation(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Project Classification</label>
                      <input
                        type="text"
                        value={newProjectType}
                        onChange={(e) => setNewProjectType(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Line Item Structure */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Itemization Detail Level
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransferDetailLevel('detailed')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    transferDetailLevel === 'detailed'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Itemized Activity Schedule</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Transfers individual constituent line items ({transferPreviewItems.length} lines)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferDetailLevel('consolidated')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    transferDetailLevel === 'consolidated'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Consolidated Summary Item</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Transfers single summary line item with exact calculated budget
                  </span>
                </button>
              </div>
            </div>

            {/* Step 3: Preview Table */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Line Items to be Added ({transferPreviewItems.length})
                </label>
                <span className="text-xs font-bold text-emerald-800">
                  Total: {formatNaira(transferTotalSum)}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Item &amp; Description</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2">Unit</th>
                      <th className="py-2 px-2 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-medium">
                    {transferPreviewItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-white transition">
                        <td className="py-1.5 px-3">
                          <span className="font-bold text-slate-800 block">{it.item}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">{it.description}</span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-700">{formatNumber(it.qty)}</td>
                        <td className="py-1.5 px-2 text-slate-500">{it.unit}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-700">{formatNaira(it.rate)}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800">{formatNaira(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isTransferring}
                onClick={handleExecuteTransfer}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{isTransferring ? 'Saving to Database...' : 'Confirm & Transfer to BOQ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

