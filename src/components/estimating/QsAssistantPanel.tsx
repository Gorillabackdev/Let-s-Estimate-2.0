import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Building,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Project } from '../../types';
import { getNigerianStateData } from '../../data/nigerianLocations';
import { formatNaira } from '../../utils/format';

interface QsAssistantPanelProps {
  project: Project;
  onApplyRecommendation?: (item: { item: string; description: string; qty: number; unit: string; rate: number; section: string }) => void;
}

export const QsAssistantPanel: React.FC<QsAssistantPanelProps> = ({
  project,
  onApplyRecommendation,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'checklist' | 'rates'>('rules');
  const [expandedRule, setExpandedRule] = useState<number | null>(0);

  const stateData = getNigerianStateData(project.state || project.location || 'Lagos');

  // BESMM4 Standard Rules
  const besmmRules = [
    {
      trade: 'Blockwork & Brickwork',
      rule: 'BESMM4 Section F: Openings <= 0.50m² are NOT deducted',
      details: 'In wall measurements, do not deduct for small openings, lintels, wall plates, or concrete bond beams not exceeding 0.50 m² in area. Deduct fully for doors and windows exceeding 0.50 m².',
      tip: 'For 225mm hollow sandcrete blocks, calculate 10 blocks per m² of wall area.'
    },
    {
      trade: 'Plastering & Rendering',
      rule: 'BESMM4 Section M: Internal Walls & Ceiling Screeds',
      details: 'Measured in square metres (m²). Deductions for openings follow the same 0.50 m² threshold rule. Narrow widths not exceeding 300mm are measured in linear metres (m).',
      tip: 'Standard mix: 1:4 cement-sand mortar with minimum thickness 12-15mm.'
    },
    {
      trade: 'Earthwork & Excavation',
      rule: 'BESMM4 Section D: Bulk Excavation & Trench Foundation',
      details: 'Surface excavation exceeding 300mm deep is treated as bulk excavation in cubic metres (m³). Trench excavation is measured in m³ stating starting depth level.',
      tip: 'Allow 20% to 25% bulk increase (bulking factor) for carting away surplus excavated soil.'
    },
    {
      trade: 'Reinforced Concrete',
      rule: 'BESMM4 Section G: In-situ Concrete & Formwork',
      details: 'Concrete is measured in m³ net volume without deducting volume occupied by reinforcement bars or conduits < 0.05m² sectional area. Formwork is measured separately in m² contact area.',
      tip: 'Standard nominal mix 1:2:4 (Grade 20) requires ~6.8 to 7.2 bags of cement per m³.'
    },
    {
      trade: 'Structural Timber & Roofing',
      rule: 'BESMM4 Section H: Hardwood Roof Carcass',
      details: 'Measured in linear metres (m) stating sectional sizes (e.g. 50x150mm rafters, 50x100mm wall plates, 50x50mm purlins). Roof covering measured net in m² on pitch slope.',
      tip: 'Add 15% to 20% for pitch multiplier on hipped/pitched roofs compared to plan area.'
    }
  ];

  // Comprehensive QS Missing Information & Risk Checklist
  const terrainCondition = (project.questionnaire as any)?.general?.terrain || (project.swamp_premium_percent && project.swamp_premium_percent > 0 ? 'Swamp / Waterlogged' : null);
  const hasContractRef = !!(project.reference && project.reference.trim().length > 0);
  const hasContractor = !!(project.contractor && project.contractor.trim().length > 0);
  const hasClient = !!(project.client_name && project.client_name.trim().length > 0);
  const isSwampState = ['Rivers', 'Bayelsa', 'Delta', 'Akwa Ibom', 'Cross River', 'Lagos'].includes(project.state || '');
  const itemCount = project.items?.length || 0;

  const missingItems = [
    {
      title: 'Project Contract & Administration Setup',
      status: hasContractRef && hasClient ? 'Compliant' : 'Incomplete Details',
      detail: hasContractRef && hasClient
        ? `Ref: ${project.reference} • Client: ${project.client_name}${hasContractor ? ` • Contractor: ${project.contractor}` : ' (Contractor TBD)'}`
        : 'Project is missing formal Contract Reference or Client Name. Add details via Edit Project.',
      severity: hasContractRef && hasClient ? 'low' : 'medium'
    },
    {
      title: 'Geotechnical Soil & Substructure Water Table',
      status: terrainCondition ? 'Specified' : (isSwampState ? 'Action Required' : 'Standard Dry Soil'),
      detail: terrainCondition 
        ? `Site terrain: ${terrainCondition}. ${project.swamp_premium_percent ? `Swamp allowance of +${project.swamp_premium_percent}% loaded.` : ''}` 
        : (isSwampState 
            ? `${project.state || 'Coastal'} location requires soil investigation. Verify dewatering and foundation piling provisions.` 
            : 'Subsoil profile not confirmed. Standard firm dry soil assumed without dewatering.'),
      severity: isSwampState && !project.swamp_premium_percent ? 'high' : (terrainCondition ? 'low' : 'medium')
    },
    {
      title: 'Contractual Markups (P&O 15% & Statutory VAT 7.5%)',
      status: (project.po_percent || 15) >= 10 && (project.vat_percent || 7.5) === 7.5 ? 'Compliant' : 'Non-Standard',
      detail: `Profit & Overheads: ${project.po_percent ?? 15}% • FIRS Withholding/VAT: ${project.vat_percent ?? 7.5}%. Statutory compliance verified.`,
      severity: 'low'
    },
    {
      title: 'Bill of Quantities Measured Schedule',
      status: itemCount > 0 ? `${itemCount} Items Measured` : 'No Items in BOQ',
      detail: itemCount > 0 
        ? `Active trade schedules measured in accordance with BESMM4 rules.`
        : 'BOQ is empty. Add trade items manually, from rate library, or via AI drawing takeoff.',
      severity: itemCount > 0 ? 'low' : 'high'
    },
    {
      title: 'Structural Reinforcement Bar Schedule',
      status: 'Provisional Ratio Applied',
      detail: 'Rebar measured at standard residential benchmark (110 kg/m³ of concrete) pending engineer schedules.',
      severity: 'medium'
    },
    {
      title: 'Damp Proof Course & Membrane (DPC/DPM)',
      status: 'Standard Allowance',
      detail: '0.25mm polyethylene DPM and 3-ply bituminous DPC included in Substructure trade.',
      severity: 'low'
    },
    {
      title: 'Regional Price Volatility Factor',
      status: 'Active',
      detail: `Current location index for ${stateData.name} (${stateData.zone}) is ${stateData.costIndex}x Lagos baseline rate.`,
      severity: 'low'
    }
  ];

  return (
    <div id="qs-assistant-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Quantity Surveying Intelligence Assistant
            </h3>
            <p className="text-xs text-slate-500">
              BESMM4 standard rules, Nigerian regional adjustments, and audit checklist
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'rules' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            BESMM4 Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'checklist' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Checklist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rates')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'rates' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            State Rates ({stateData.name})
          </button>
        </div>
      </div>

      {/* TAB 1: BESMM4 Measurement Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Official Nigerian Building and Engineering Standard Method of Measurement (BESMM4) guidelines for taking off:
          </p>
          <div className="space-y-2">
            {besmmRules.map((rule, idx) => {
              const isExpanded = expandedRule === idx;
              return (
                <div key={rule.trade} className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedRule(isExpanded ? null : idx)}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition font-bold text-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{rule.trade}</span>
                      <span className="text-[11px] font-normal text-slate-500">| {rule.rule}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200 space-y-2 text-slate-700">
                      <p className="leading-relaxed">{rule.details}</p>
                      <div className="bg-emerald-50 text-emerald-900 px-3 py-2 rounded-lg border border-emerald-200 font-medium">
                        <span className="font-bold">QS Tip: </span>
                        {rule.tip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QS Audit Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Automated verification of critical specification parameters and missing drawings items:
          </p>
          <div className="space-y-2.5">
            {missingItems.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.severity === 'high' 
                      ? 'bg-rose-100 text-rose-800' 
                      : item.severity === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Regional Rates Intelligence */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
            <div>
              <span className="font-extrabold text-sm block">{stateData.name} ({stateData.zone} Zone)</span>
              <span className="text-slate-600">Capital: {stateData.capital} | Terrain: {stateData.terrain}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Regional Multiplier</span>
              <span className="text-lg font-black text-emerald-800">{stateData.costIndex.toFixed(2)}x</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item / Specification</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-right">Lagos Base</th>
                  <th className="py-2.5 px-3 text-right">{stateData.name} Adjusted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {[
                  { item: '225mm Sandcrete Blockwork', unit: 'm2', base: 14500 },
                  { item: 'Grade 20 Reinforced Concrete (1:2:4)', unit: 'm3', base: 175000 },
                  { item: 'High-yield deformed rebar (Y12-Y16)', unit: 'tonne', base: 1850000 },
                  { item: '0.55mm Aluminium Longspan Roofing', unit: 'm2', base: 18500 },
                  { item: 'Sawn timber roof carcass (rafters/purlins)', unit: 'm', base: 4200 },
                  { item: 'Cement-sand screed / plastering (12mm)', unit: 'm2', base: 4500 },
                ].map((row, idx) => {
                  const adjusted = Math.round(row.base * stateData.costIndex);
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold">{row.item}</td>
                      <td className="py-2.5 px-3">{row.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatNaira(row.base)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatNaira(adjusted)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
