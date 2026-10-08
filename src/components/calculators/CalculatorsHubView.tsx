import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Layers, 
  Sparkles,
  Check, 
  Copy, 
  FileSpreadsheet,
  ArrowRight,
  Package,
  Droplets,
  GraduationCap,
  Stethoscope,
  Info
} from 'lucide-react';
import { Project } from '../../types';
import { formatNaira, formatNumber } from '../../utils/format';
import { FormattedNumberInput } from '../common/FormattedNumberInput';
import { MeasuredWorksTakeOff } from './MeasuredWorksTakeOff';
import { BtlEstimator } from '../estimating/BtlEstimator';

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
  initialSubView?: string;
}

interface OutreachPreset {
  id: string;
  name: string;
  icon: any;
  location: string;
  beneficiaries: number;
  outreachDays: number;
  medicalPersonnelCount: number;
  medicalPersonnelDailyRate: number;
  volunteersCount: number;
  volunteersDailyStipend: number;
  medicalConsumablesCost: number;
  ppeCost: number;
  venueHireCost: number;
  powerCost: number;
  securityCost: number;
  wasteDisposalCost: number;
  communicationCost: number;
  transportationCost: number;
  accommodationCost: number;
  feedingCost: number;
  administrationCost: number;
  contingencyPercent: number;
}

const PRESETS: OutreachPreset[] = [
  {
    id: 'medical',
    name: 'Free Medical Health Mission',
    icon: Stethoscope,
    location: 'Ikorodu Community Health Centre, Lagos',
    beneficiaries: 750,
    outreachDays: 3,
    medicalPersonnelCount: 6,
    medicalPersonnelDailyRate: 35000,
    volunteersCount: 10,
    volunteersDailyStipend: 8000,
    medicalConsumablesCost: 1250000,
    ppeCost: 180000,
    venueHireCost: 150000,
    powerCost: 95000,
    securityCost: 60000,
    wasteDisposalCost: 45000,
    communicationCost: 80000,
    transportationCost: 35000,
    accommodationCost: 240000,
    feedingCost: 288000,
    administrationCost: 120000,
    contingencyPercent: 7.5,
  },
  {
    id: 'relief',
    name: 'Disaster Relief & Food Aid',
    icon: Package,
    location: 'IDP Resettlement Camp, Benue State',
    beneficiaries: 1500,
    outreachDays: 2,
    medicalPersonnelCount: 4,
    medicalPersonnelDailyRate: 25000,
    volunteersCount: 20,
    volunteersDailyStipend: 6000,
    medicalConsumablesCost: 3800000, // Food packs & nutrition rations
    ppeCost: 220000,
    venueHireCost: 200000,
    powerCost: 75000,
    securityCost: 120000,
    wasteDisposalCost: 30000,
    communicationCost: 50000,
    transportationCost: 650000,
    accommodationCost: 180000,
    feedingCost: 320000,
    administrationCost: 85000,
    contingencyPercent: 5.0,
  },
  {
    id: 'wash',
    name: 'WASH & Community Sanitation',
    icon: Droplets,
    location: 'Epe Rural Communities, Lagos State',
    beneficiaries: 600,
    outreachDays: 2,
    medicalPersonnelCount: 3,
    medicalPersonnelDailyRate: 30000,
    volunteersCount: 8,
    volunteersDailyStipend: 7500,
    medicalConsumablesCost: 950000, // Water purification & chlorination kits
    ppeCost: 320000,
    venueHireCost: 80000,
    powerCost: 50000,
    securityCost: 30000,
    wasteDisposalCost: 35000,
    communicationCost: 65000,
    transportationCost: 180000,
    accommodationCost: 120000,
    feedingCost: 160000,
    administrationCost: 50000,
    contingencyPercent: 5.0,
  },
  {
    id: 'training',
    name: 'Vocational Skills & Workshop',
    icon: GraduationCap,
    location: 'Community Youth Centre, Ibadan',
    beneficiaries: 200,
    outreachDays: 5,
    medicalPersonnelCount: 4, // Lead trainers & facilitators
    medicalPersonnelDailyRate: 40000,
    volunteersCount: 5,
    volunteersDailyStipend: 6000,
    medicalConsumablesCost: 1400000, // Training toolkits & materials
    ppeCost: 110000,
    venueHireCost: 250000,
    powerCost: 140000,
    securityCost: 45000,
    wasteDisposalCost: 25000,
    communicationCost: 75000,
    transportationCost: 220000,
    accommodationCost: 200000,
    feedingCost: 450000,
    administrationCost: 160000,
    contingencyPercent: 5.0,
  }
];

export const CalculatorsHubView: React.FC<CalculatorsHubViewProps> = ({ 
  onApplyToBoq, 
  onApplyBulkToBoq,
  activeProject,
  projects = [],
  initialSubView
}) => {
  const [viewMode, setViewMode] = useState<'btl_estimator' | 'measured_takeoff' | 'general_aids'>('btl_estimator');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('medical');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!initialSubView) return;
    if (initialSubView === 'btl' || initialSubView === 'btl_estimator') {
      setViewMode('btl_estimator');
    } else if (initialSubView === 'measured' || initialSubView === 'measured_takeoff') {
      setViewMode('measured_takeoff');
    } else {
      // Any budgeting / outreach / general_aids / conversion maps directly to Project Budgeting / NGO
      setViewMode('general_aids');
    }
  }, [initialSubView]);

  // Transfer to BOQ Modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<'active' | 'new'>('active');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || '');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('Lagos, Nigeria');
  const [newProjectType, setNewProjectType] = useState('NGO / Healthcare Outreach');
  const [transferDetailLevel, setTransferDetailLevel] = useState<'detailed' | 'consolidated'>('detailed');
  const [isTransferring, setIsTransferring] = useState(false);

  // NGO / Community / Healthcare Outreach Budget state
  const [beneficiaries, setBeneficiaries] = useState<number>(750);
  const [outreachDays, setOutreachDays] = useState<number>(3);
  const [outreachLocation, setOutreachLocation] = useState<string>('Ikorodu Community Health Centre, Lagos');
  
  // Personnel
  const [medicalPersonnelCount, setMedicalPersonnelCount] = useState<number>(6);
  const [medicalPersonnelDailyRate, setMedicalPersonnelDailyRate] = useState<number>(35000);
  const [volunteersCount, setVolunteersCount] = useState<number>(10);
  const [volunteersDailyStipend, setVolunteersDailyStipend] = useState<number>(8000);

  // Materials & Consumables
  const [medicalConsumablesCost, setMedicalConsumablesCost] = useState<number>(1250000);
  const [ppeCost, setPpeCost] = useState<number>(180000);

  // Logistics & Venue
  const [venueHireCost, setVenueHireCost] = useState<number>(150000);
  const [powerCost, setPowerCost] = useState<number>(95000);
  const [securityCost, setSecurityCost] = useState<number>(60000);
  const [wasteDisposalCost, setWasteDisposalCost] = useState<number>(45000);
  const [communicationCost, setCommunicationCost] = useState<number>(80000);

  // Transportation & Accommodation
  const [transportationCost, setTransportationCost] = useState<number>(350000);
  const [accommodationCost, setAccommodationCost] = useState<number>(240000);
  const [feedingCost, setFeedingCost] = useState<number>(288000);

  // Administration & Contingency
  const [administrationCost, setAdministrationCost] = useState<number>(120000);
  const [contingencyPercent, setContingencyPercent] = useState<number>(7.5);

  const applyPreset = (preset: OutreachPreset) => {
    setSelectedPresetId(preset.id);
    setOutreachLocation(preset.location);
    setBeneficiaries(preset.beneficiaries);
    setOutreachDays(preset.outreachDays);
    setMedicalPersonnelCount(preset.medicalPersonnelCount);
    setMedicalPersonnelDailyRate(preset.medicalPersonnelDailyRate);
    setVolunteersCount(preset.volunteersCount);
    setVolunteersDailyStipend(preset.volunteersDailyStipend);
    setMedicalConsumablesCost(preset.medicalConsumablesCost);
    setPpeCost(preset.ppeCost);
    setVenueHireCost(preset.venueHireCost);
    setPowerCost(preset.powerCost);
    setSecurityCost(preset.securityCost);
    setWasteDisposalCost(preset.wasteDisposalCost);
    setCommunicationCost(preset.communicationCost);
    setTransportationCost(preset.transportationCost);
    setAccommodationCost(preset.accommodationCost);
    setFeedingCost(preset.feedingCost);
    setAdministrationCost(preset.administrationCost);
    setContingencyPercent(preset.contingencyPercent);
  };

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
  const dailyRunRate = outreachDays > 0 ? Math.round(totalOutreachBudget / outreachDays) : 0;

  // Helper to compile items for transfer to BOQ
  const getCalculatedItems = (): TemplateBoqItem[] => {
    if (transferDetailLevel === 'detailed') {
      const items: TemplateBoqItem[] = [];
      if (medicalPersonnelCount > 0) {
        items.push({
          item: `Lead Officers & Technical Personnel (${medicalPersonnelCount} Staff)`,
          description: `Provision of specialized technical and professional personnel for ${outreachDays} days activity at ${outreachLocation}`,
          qty: medicalPersonnelCount * outreachDays,
          unit: 'man-day',
          rate: medicalPersonnelDailyRate,
          amount: medicalPersonnelCount * medicalPersonnelDailyRate * outreachDays,
          section: 'Personnel & Field Staff'
        });
      }
      if (volunteersCount > 0) {
        items.push({
          item: `Community Field Volunteers (${volunteersCount} Volunteers)`,
          description: `Field coordination, crowd orientation, mobilization and support for ${outreachDays} days`,
          qty: volunteersCount * outreachDays,
          unit: 'volunteer-day',
          rate: volunteersDailyStipend,
          amount: volunteersCount * volunteersDailyStipend * outreachDays,
          section: 'Personnel & Field Staff'
        });
      }
      if (medicalConsumablesCost > 0) {
        items.push({
          item: 'Direct Consumables & Field Supplies',
          description: `Procurement of essential intervention materials, kits, supplies and diagnostic inputs for ${outreachLocation}`,
          qty: 1,
          unit: 'sum',
          rate: medicalConsumablesCost,
          amount: medicalConsumablesCost,
          section: 'Materials & Field Supplies'
        });
      }
      if (ppeCost > 0) {
        items.push({
          item: 'PPE, Protective & Safety Equipment',
          description: 'Protective gear, gloves, masks, sanitizers, and site safety materials',
          qty: 1,
          unit: 'sum',
          rate: ppeCost,
          amount: ppeCost,
          section: 'Materials & Field Supplies'
        });
      }
      if (venueHireCost > 0) {
        items.push({
          item: 'Venue Canopy, Seating & Partition Hire',
          description: 'Erection of canopies, seating chairs, registration desks and consultation partitions',
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
          description: 'Generator plant hire and fueling for refrigeration, electronics and lighting',
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
          description: 'Local policing and community security detail for crowd safety and orderliness',
          qty: 1,
          unit: 'sum',
          rate: securityCost,
          amount: securityCost,
          section: 'Venue, Logistics & Power'
        });
      }
      if (wasteDisposalCost > 0) {
        items.push({
          item: 'Field Waste Collection & Certified Disposal',
          description: 'Biohazard containment, containment bags and waste disposal service',
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
          description: 'Pre-outreach town mobilization, publicity banners, flyers and site sound system',
          qty: 1,
          unit: 'sum',
          rate: communicationCost,
          amount: communicationCost,
          section: 'Venue, Logistics & Power'
        });
      }
      if (transportationCost > 0) {
        items.push({
          item: 'Logistics Fleet & Field Transportation',
          description: 'Personnel commuting hire, logistics haulage vehicles and standby transport',
          qty: 1,
          unit: 'sum',
          rate: transportationCost,
          amount: transportationCost,
          section: 'Travel, Lodging & Catering'
        });
      }
      if (accommodationCost > 0) {
        items.push({
          item: 'Non-Local Team Field Lodging',
          description: 'Hotel accommodation and field lodging for non-resident team members',
          qty: 1,
          unit: 'sum',
          rate: accommodationCost,
          amount: accommodationCost,
          section: 'Travel, Lodging & Catering'
        });
      }
      if (feedingCost > 0) {
        items.push({
          item: 'Team Catering, Potable Bottled Water & Hydration',
          description: 'Breakfast, lunch, safe drinking water and refreshments for team personnel and volunteers',
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
          description: 'Stakeholder clearance permits, ID badges, printing attendee materials and post-intervention report',
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
        item: `Community Intervention Outreach (${outreachDays} Days)`,
        description: `Complete activity intervention at ${outreachLocation} serving ${beneficiaries} beneficiaries. Full personnel, supplies, venue, logistics and ${contingencyPercent}% contingency.`,
        qty: beneficiaries,
        unit: 'beneficiary',
        rate: costPerBeneficiary,
        amount: totalOutreachBudget,
        section: 'Project Outreach Budget'
      }];
    }
  };

  const handleOpenTransferModal = () => {
    setNewProjectTitle(`Community Project - ${outreachLocation.split(',')[0]}`);
    setNewProjectLocation(outreachLocation);
    setNewProjectType('Community / NGO');
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

  const handleCopySummary = () => {
    const summaryText = `PROJECT / NGO OUTREACH BUDGET SUMMARY
Location: ${outreachLocation}
Duration: ${outreachDays} Days
Beneficiaries: ${formatNumber(beneficiaries)} persons

FINANCIAL BREAKDOWN:
- Personnel Honoraria: ${formatNaira(personnelCost)}
- Materials & Consumables: ${formatNaira(materialsConsumablesCost)}
- Venue & Utilities: ${formatNaira(venueLogisticsCost)}
- Transport, Lodging & Catering: ${formatNaira(travelLodgingCost)}
- Administration: ${formatNaira(administrationSubtotal)}
- Contingency (${contingencyPercent}%): ${formatNaira(contingencyAmount)}
---------------------------------------------
TOTAL BUDGET: ${formatNaira(totalOutreachBudget)}
Cost Per Beneficiary: ${formatNaira(costPerBeneficiary)} / person
Daily Run Rate: ${formatNaira(dailyRunRate)} / day`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="calculators-tools-hub" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top System Mode Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Take-Off &amp; Budgeting System
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            BESMM4 Measured Works Take-Off System &amp; Project Budgeting / NGO Activity Aids
          </p>
        </div>

        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto gap-1">
          <button
            type="button"
            onClick={() => setViewMode('btl_estimator')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'btl_estimator'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>BTL Estimator 2.0 (Build Mode)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('measured_takeoff')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'measured_takeoff'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Measured Works Take-Off (BESMM4)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('general_aids')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'general_aids'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
            <span>Project Budgeting / NGO</span>
          </button>
        </div>
      </div>

      {viewMode === 'btl_estimator' ? (
        <BtlEstimator
          activeProject={activeProject}
          projects={projects}
          onApplyToBoq={onApplyToBoq}
          onApplyBulkToBoq={onApplyBulkToBoq}
        />
      ) : viewMode === 'measured_takeoff' ? (
        <MeasuredWorksTakeOff
          activeProject={activeProject}
          projects={projects}
          onApplyToBoq={onApplyToBoq}
          onApplyBulkToBoq={onApplyBulkToBoq}
        />
      ) : (
        <>
          {/* Quick Presets Selector Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  <span>Activity Presets &amp; Templates</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select a template to instantly pre-populate activity line items and realistic Nigerian benchmark allowances.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full self-start sm:self-auto border border-emerald-200">
                Non-Construction Estimating Aid
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => {
                const IconComponent = p.icon;
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-xs truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Calculator Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Inputs and Modular Sections */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-amber-700" />
                    <span>Project Budgeting &amp; NGO Activity Costing</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Itemized operational costing for medical missions, humanitarian aid, public health campaigns and community interventions.
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
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setOutreachDays(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Personnel */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  2. Personnel &amp; Field Honoraria
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Technical / Medical Staff</label>
                    <input
                      type="number"
                      value={medicalPersonnelCount === 0 ? '' : medicalPersonnelCount}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMedicalPersonnelCount(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Staff Daily Rate (₦)</label>
                    <FormattedNumberInput
                      value={medicalPersonnelDailyRate}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setMedicalPersonnelDailyRate(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Field Volunteers</label>
                    <input
                      type="number"
                      value={volunteersCount === 0 ? '' : volunteersCount}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
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

              {/* 3. Consumables & Direct Supplies */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  3. Consumables, Materials &amp; Safety Equipment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Direct Supplies, Drugs &amp; Consumables (₦)</label>
                    <FormattedNumberInput
                      value={medicalConsumablesCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setMedicalConsumablesCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">PPE &amp; Protective Safety Gear (₦)</label>
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
                    <label className="font-semibold text-slate-700 block mb-1">Power / Generator &amp; Fuel (₦)</label>
                    <FormattedNumberInput
                      value={powerCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setPowerCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Security / Policing Detail (₦)</label>
                    <FormattedNumberInput
                      value={securityCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setSecurityCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Clinical / Solid Waste Disposal (₦)</label>
                    <FormattedNumberInput
                      value={wasteDisposalCost}
                      placeholder="0"
                      maxDecimals={0}
                      onChange={(val) => setWasteDisposalCost(val)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Public Address / Mobilization / Banners (₦)</label>
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
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setContingencyPercent(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: COMPUTED SCHEDULE & DIRECT BOQ ACTIONS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Budget Schedule
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Dynamic Summary
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/80 shadow-2xs">
                    <div className="text-slate-600 font-semibold text-xs">TOTAL ESTIMATED BUDGET</div>
                    <div className="text-2xl font-black text-amber-950 mt-1">{formatNaira(totalOutreachBudget)}</div>
                    <div className="flex items-center justify-between text-[11px] text-amber-900 mt-2 font-medium pt-2 border-t border-amber-200/50">
                      <span>{outreachDays} Days &bull; {formatNumber(beneficiaries)} Beneficiaries</span>
                      <span className="font-bold bg-amber-200/60 px-2 py-0.5 rounded">{formatNaira(costPerBeneficiary)} / person</span>
                    </div>
                    <div className="text-[10px] text-amber-800/80 mt-1">
                      Daily Operational Rate: <span className="font-bold">{formatNaira(dailyRunRate)} / day</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-[11px]">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Personnel &amp; Field Staff:</span>
                      <span className="font-bold text-slate-900">{formatNaira(personnelCost)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Direct Supplies &amp; Consumables:</span>
                      <span className="font-bold text-slate-900">{formatNaira(materialsConsumablesCost)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Logistics &amp; Facilities:</span>
                      <span className="font-bold text-slate-900">{formatNaira(venueLogisticsCost)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Transportation:</span>
                      <span className="font-bold text-slate-900">{formatNaira(transportationCost)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Accommodation &amp; Feeding:</span>
                      <span className="font-bold text-slate-900">{formatNaira(accommodationCost + feedingCost)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Administration:</span>
                      <span className="font-bold text-slate-900">{formatNaira(administrationSubtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Contingency ({contingencyPercent}%):</span>
                      <span className="font-bold text-slate-900">{formatNaira(contingencyAmount)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] text-slate-500 flex items-start space-x-1.5 mt-2">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Costing formulas automatically calculate man-days, logistics allowance and emergency margins aligned with donor grant standards.</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-5 border-t border-slate-100 space-y-2 mt-4">
                <button
                  type="button"
                  onClick={handleOpenTransferModal}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Transfer Outreach Budget to Project BOQ</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
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
                      Transfer Outreach Budget to BOQ
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Persists calculated activity quantities and rates directly into your project bill of quantities in SQLite.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
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
        </>
      )}

    </div>
  );
};
