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
import { CalculatorCategory } from '../../types';
import { formatNaira } from '../../utils/format';

interface CalculatorsHubViewProps {
  onApplyToBoq?: (item: { item: string; description: string; qty: number; unit: string; section?: string }) => void;
}

export const CalculatorsHubView: React.FC<CalculatorsHubViewProps> = ({ onApplyToBoq }) => {
  const [selectedCategory, setSelectedCategory] = useState<CalculatorCategory>('construction');
  const [activeCalcId, setActiveCalcId] = useState<string>('concrete_volume');
  const [copied, setCopied] = useState(false);

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
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thickness / Depth (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={thickness}
                    onChange={(e) => setThickness(Number(e.target.value))}
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
                      value={wallLength}
                      onChange={(e) => setWallLength(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Wall Height (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={wallHeight}
                      onChange={(e) => setWallHeight(Number(e.target.value))}
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
                    value={trenchLength}
                    onChange={(e) => setTrenchLength(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trench Width (m)</label>
                  <input
                    type="number"
                    step="0.025"
                    value={trenchWidth}
                    onChange={(e) => setTrenchWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Excavation Depth (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={trenchDepth}
                    onChange={(e) => setTrenchDepth(Number(e.target.value))}
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
                  <input
                    type="number"
                    value={totalBarLength}
                    onChange={(e) => setTotalBarLength(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tonne Market Rate (₦)</label>
                  <input
                    type="number"
                    step="50000"
                    value={steelPricePerTonne}
                    onChange={(e) => setSteelPricePerTonne(Number(e.target.value))}
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
                  <input
                    type="number"
                    value={primeCost}
                    onChange={(e) => setPrimeCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Overheads (%)</label>
                  <input
                    type="number"
                    value={overheadsPercent}
                    onChange={(e) => setOverheadsPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Profit (%)</label>
                  <input
                    type="number"
                    value={profitPercent}
                    onChange={(e) => setProfitPercent(Number(e.target.value))}
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
                    <input
                      type="number"
                      value={beneficiaries}
                      onChange={(e) => setBeneficiaries(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Number of Days</label>
                    <input
                      type="number"
                      value={outreachDays}
                      onChange={(e) => setOutreachDays(Number(e.target.value))}
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
                      value={medicalPersonnelCount}
                      onChange={(e) => setMedicalPersonnelCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Daily Rate (₦)</label>
                    <input
                      type="number"
                      value={medicalPersonnelDailyRate}
                      onChange={(e) => setMedicalPersonnelDailyRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Volunteers</label>
                    <input
                      type="number"
                      value={volunteersCount}
                      onChange={(e) => setVolunteersCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Volunteer Stipend (₦)</label>
                    <input
                      type="number"
                      value={volunteersDailyStipend}
                      onChange={(e) => setVolunteersDailyStipend(Number(e.target.value))}
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
                    <input
                      type="number"
                      value={medicalConsumablesCost}
                      onChange={(e) => setMedicalConsumablesCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">PPE &amp; Protective Gear (₦)</label>
                    <input
                      type="number"
                      value={ppeCost}
                      onChange={(e) => setPpeCost(Number(e.target.value))}
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
                    <input
                      type="number"
                      value={venueHireCost}
                      onChange={(e) => setVenueHireCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Power / Generator &amp; Diesel (₦)</label>
                    <input
                      type="number"
                      value={powerCost}
                      onChange={(e) => setPowerCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Security / Policing (₦)</label>
                    <input
                      type="number"
                      value={securityCost}
                      onChange={(e) => setSecurityCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Clinical Waste Disposal (₦)</label>
                    <input
                      type="number"
                      value={wasteDisposalCost}
                      onChange={(e) => setWasteDisposalCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Communication / PA System / Banners (₦)</label>
                    <input
                      type="number"
                      value={communicationCost}
                      onChange={(e) => setCommunicationCost(Number(e.target.value))}
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
                    <input
                      type="number"
                      value={transportationCost}
                      onChange={(e) => setTransportationCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Accommodation / Lodging (₦)</label>
                    <input
                      type="number"
                      value={accommodationCost}
                      onChange={(e) => setAccommodationCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Feeding &amp; Refreshments (₦)</label>
                    <input
                      type="number"
                      value={feedingCost}
                      onChange={(e) => setFeedingCost(Number(e.target.value))}
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
                    <input
                      type="number"
                      value={administrationCost}
                      onChange={(e) => setAdministrationCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Contingency Reserve (%)</label>
                    <input
                      type="number"
                      value={contingencyPercent}
                      onChange={(e) => setContingencyPercent(Number(e.target.value))}
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
                  <div className="text-2xl font-extrabold text-emerald-950 mt-0.5">{concreteVolumeM3} m³</div>
                  <div className="text-[11px] text-emerald-800 mt-1">Grade 20/25 (1:2:4 batch ratio)</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Cement (50kg bags):</span>
                    <span className="font-bold text-slate-900">{cementBags} bags</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Sharp Sand:</span>
                    <span className="font-bold text-slate-900">{sandTonnes} tonnes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Crushed Granite (20mm):</span>
                    <span className="font-bold text-slate-900">{graniteTonnes} tonnes</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                    <span>Sandcrete Blocks (9&quot;):</span>
                    <span className="font-bold text-slate-700">{blocksCount} pcs</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'civil' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <div className="text-slate-600">Solid Excavation Volume:</div>
                  <div className="text-2xl font-extrabold text-blue-950 mt-0.5">{excavatedVolume} m³</div>
                  <div className="text-[11px] text-blue-800 mt-1">In-situ trench cut</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Loose Bulked Volume (+25%):</span>
                    <span className="font-bold text-slate-900">{looseSoilVolume} m³</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tipper Trips (5m³ body):</span>
                    <span className="font-bold text-slate-900">{tipperLoads} trips</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'structural' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div className="text-slate-600">Total Steel Tonnage:</div>
                  <div className="text-2xl font-extrabold text-amber-950 mt-0.5">{totalRebarTonnes} Tonnes</div>
                  <div className="text-[11px] text-amber-800 mt-1">Y{barDiameter} High Yield Deformed Bars</div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Total Weight:</span>
                    <span className="font-bold text-slate-900">{totalRebarWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Standard 12m Lengths:</span>
                    <span className="font-bold text-slate-900">{standardLengths12m} lengths</span>
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
                    <span>{outreachDays} Days &bull; {beneficiaries} Beneficiaries</span>
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
            {onApplyToBoq && (
              <button
                type="button"
                onClick={() => {
                  if (selectedCategory === 'construction') {
                    onApplyToBoq({
                      item: 'Reinforced Concrete Grade 20/25',
                      description: `Vibrated reinforced concrete Grade 20/25 in beams/slabs. Mix 1:2:4 (${cementBags} bags cement)`,
                      qty: concreteVolumeM3,
                      unit: 'm3',
                      section: 'Reinforced Concrete Frame'
                    });
                  } else if (selectedCategory === 'civil') {
                    onApplyToBoq({
                      item: 'Excavation in Foundation Trenches',
                      description: `Excavation not exceeding 1.5m deep in trenches, width ${trenchWidth}m`,
                      qty: excavatedVolume,
                      unit: 'm3',
                      section: 'Substructure'
                    });
                  } else if (selectedCategory === 'structural') {
                    onApplyToBoq({
                      item: `High Yield Steel Rebar Y${barDiameter}`,
                      description: `High yield deformed steel rebar Y${barDiameter} including cutting, bending & placing`,
                      qty: totalRebarWeightKg,
                      unit: 'kg',
                      section: 'Reinforced Concrete Frame'
                    });
                  } else if (selectedCategory === 'budgeting') {
                    onApplyToBoq({
                      item: `Community Health Outreach (${outreachDays} Days)`,
                      description: `Outreach at ${outreachLocation} targeting ${beneficiaries} beneficiaries. Includes personnel, consumables, logistics, lodging and ${contingencyPercent}% contingency.`,
                      qty: beneficiaries,
                      unit: 'beneficiary',
                      section: 'Project Outreach Budget'
                    });
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{selectedCategory === 'budgeting' ? 'Apply Outreach Budget to Project' : 'Apply Quantity to Active BOQ'}</span>
              </button>
            )}

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

    </div>
  );
};
