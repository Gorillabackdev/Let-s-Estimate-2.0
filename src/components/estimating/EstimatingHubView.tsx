import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  Database, 
  TrendingUp, 
  Calculator, 
  Plus, 
  Layers, 
  MapPin, 
  Download, 
  ShieldCheck, 
  Check, 
  Sliders,
  DollarSign
} from 'lucide-react';
import { EstimatingSubView, Project, BoqItem, StandardRate } from '../../types';
import { formatNaira } from '../../utils/format';
import { BoqTable } from '../BoqTable';

interface EstimatingHubViewProps {
  project?: Project | null;
  projects?: Project[];
  initialSubView?: EstimatingSubView;
  onOpenAiTakeoff: () => void;
  onOpenRateLibrary: () => void;
  onUpdateBoqItem: (index: number, field: keyof BoqItem, value: any) => void;
  onAddBoqItem: (item?: Partial<BoqItem>) => void;
  onDeleteBoqItem: (index: number) => void;
  onApplyMarketRates: () => void;
  onExportExcel: () => void;
}

export const EstimatingHubView: React.FC<EstimatingHubViewProps> = ({
  project,
  projects = [],
  initialSubView = 'boq',
  onOpenAiTakeoff,
  onOpenRateLibrary,
  onUpdateBoqItem,
  onAddBoqItem,
  onDeleteBoqItem,
  onApplyMarketRates,
  onExportExcel,
}) => {
  const [activeSubView, setActiveSubView] = useState<EstimatingSubView>(initialSubView);

  // Rate Analysis Calculator State
  const [tradeTitle, setTradeTitle] = useState('225mm Vibrated Hollow Sandcrete Blockwork');
  const [unit, setUnit] = useState('m2');
  const [materialCost, setMaterialCost] = useState(7200); // 10 blocks + cement + sand
  const [labourCost, setLabourCost] = useState(2400); // Mason + labourer gang rate per m2
  const [plantCost, setPlantCost] = useState(400); // Mixer & scaffolding
  const [transportCost, setTransportCost] = useState(500); // Haulage to site
  const [wastePercent, setWastePercent] = useState(5);
  const [overheadsPercent, setOverheadsPercent] = useState(10);
  const [profitPercent, setProfitPercent] = useState(10);

  // Build up arithmetic
  const directPrime = materialCost * (1 + wastePercent / 100) + labourCost + plantCost + transportCost;
  const overheadAmount = directPrime * (overheadsPercent / 100);
  const profitAmount = (directPrime + overheadAmount) * (profitPercent / 100);
  const compositeRate = Math.round(directPrime + overheadAmount + profitAmount);

  const items = project?.items || [];

  return (
    <div id="estimating-hub-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Estimating &amp; Quantity Takeoff Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bill of Quantities (BOQ), AI drawing takeoff, regional market rate analysis, and deterministic cost models.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenAiTakeoff}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Launch AI Takeoff</span>
          </button>
          <button
            type="button"
            onClick={onOpenRateLibrary}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Rate Library</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'boq', label: 'BOQ & Estimates', icon: FileSpreadsheet, badge: items.length },
            { id: 'takeoff', label: 'AI Quantity Takeoff', icon: Sparkles },
            { id: 'rates', label: 'Rate Library', icon: Database },
            { id: 'analysis', label: 'Rate Analysis', icon: Calculator },
            { id: 'estimate', label: 'Cost Estimate Summary', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'takeoff') {
                    onOpenAiTakeoff();
                  } else if (tab.id === 'rates') {
                    onOpenRateLibrary();
                  } else {
                    setActiveSubView(tab.id as EstimatingSubView);
                  }
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.id === 'takeoff' ? 'text-amber-400' : ''}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBVIEW 1: BOQ & ESTIMATES TABLE */}
      {activeSubView === 'boq' && (
        <div className="space-y-4">
          <BoqTable
            items={items}
            onUpdateItem={onUpdateBoqItem}
            onAddItem={onAddBoqItem}
            onDeleteItem={onDeleteBoqItem}
            onApplyMarketRates={onApplyMarketRates}
          />
        </div>
      )}

      {/* SUBVIEW 2: RATE ANALYSIS BUILD-UP */}
      {activeSubView === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Unit Rate Build-Up Engine</h3>
                <p className="text-xs text-slate-500">First-principles rate synthesis: Materials + Labour + Plant + Transport + Markups.</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                BESMM4 Methodology
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Trade Description</label>
                <input
                  type="text"
                  value={tradeTitle}
                  onChange={(e) => setTradeTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
            </div>

            {/* Direct Cost Components */}
            <div className="pt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Direct Unit Cost Inputs (₦)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Material Cost (₦)</label>
                  <input
                    type="number"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Labour Cost (₦)</label>
                  <input
                    type="number"
                    value={labourCost}
                    onChange={(e) => setLabourCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plant / Tools (₦)</label>
                  <input
                    type="number"
                    value={plantCost}
                    onChange={(e) => setPlantCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transport / Haulage (₦)</label>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Markups & Waste */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Margins &amp; Waste Allowances (%)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Material Waste (%)</label>
                  <input
                    type="number"
                    value={wastePercent}
                    onChange={(e) => setWastePercent(Number(e.target.value))}
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
                  <label className="font-bold text-slate-700 block mb-1">Profit Margin (%)</label>
                  <input
                    type="number"
                    value={profitPercent}
                    onChange={(e) => setProfitPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Rate Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Synthesized Unit Rate</span>
              <div className="mt-2 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-slate-600 block">Final Bill Rate:</span>
                <span className="text-2xl font-extrabold text-emerald-950 mt-1 block">
                  {formatNaira(compositeRate)} / {unit}
                </span>
                <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">
                  Includes {wastePercent}% waste, {overheadsPercent}% overheads, {profitPercent}% profit
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Prime Cost (Direct):</span>
                  <span className="font-bold text-slate-900">{formatNaira(directPrime)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Overhead Amount:</span>
                  <span className="font-bold text-slate-900">{formatNaira(overheadAmount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Profit Amount:</span>
                  <span className="font-bold text-slate-900">{formatNaira(profitAmount)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onAddBoqItem({
                  item: tradeTitle.split(' ')[0] + ' Item',
                  description: tradeTitle,
                  unit: unit,
                  rate: compositeRate,
                  qty: 100,
                  amount: compositeRate * 100,
                  section: 'Blockwork & Partitioning'
                });
                setActiveSubView('boq');
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Analyzed Rate into Active BOQ</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: COST ESTIMATE SUMMARY */}
      {activeSubView === 'estimate' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Comprehensive Cost Estimate Model</h3>
              <p className="text-xs text-slate-500">Deterministic project cost arithmetic including terrain multiplier and tax schedule.</p>
            </div>
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Tender Summary</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Direct Trade Breakdown</h4>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Net Subtotal (Trade Works):</span>
                <span className="font-bold">{formatNaira(project?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Profit &amp; Overheads ({project?.po_percent || 15}%):</span>
                <span className="font-bold">{formatNaira(project?.po_amount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Terrain &amp; Swamp Premium:</span>
                <span className="font-bold">+{project?.swamp_premium_percent || 0}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Value Added Tax (7.5% Nigerian VAT):</span>
                <span className="font-bold">{formatNaira(project?.vat_amount || 0)}</span>
              </div>
            </div>

            <div className="p-6 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">Total Tender Sum (Gross)</span>
                <span className="text-3xl font-black text-emerald-950 mt-1 block">
                  {formatNaira(project?.grand_total || 0)}
                </span>
                <p className="text-xs text-emerald-800 mt-2">
                  Complete commercial offer incorporating all trade sections, contractor overheads, regional freight indexing, and statutory VAT.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-emerald-200 flex items-center space-x-2 text-[11px] text-emerald-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Formulated in accordance with NIQS Practice Guidelines</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
