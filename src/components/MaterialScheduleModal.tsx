import React, { useState, useEffect, useMemo } from 'react';
import { BoqItem } from '../types';
import { formatNaira } from '../utils/format';
import { safeFetchJson } from '../utils/api';
import { calculateMaterialBreakdown } from '../utils/excelExport';
import { 
  X, Package, Truck, Layers, FileSpreadsheet, Copy, Check, Printer, 
  ArrowDownToLine, DollarSign, Info, ShieldCheck, CheckCircle2, Filter
} from 'lucide-react';

interface MaterialScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  items: BoqItem[];
}

interface MaterialData {
  cementBags: number;
  sandTonnes: number;
  graniteTonnes: number;
  rebarTonnes: number;
  blocks225: number;
  blocks150: number;
  roofingSqm: number;
  totalCost: number;
  depotRates: {
    cement: number;
    sand: number;
    granite: number;
    rebar: number;
    block225: number;
    block150: number;
    roofing: number;
  };
}

export const MaterialScheduleModal: React.FC<MaterialScheduleModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  items,
}) => {
  const [data, setData] = useState<MaterialData | null>(null);
  const [serverProjectTotal, setServerProjectTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const availableSections = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return Array.from(new Set(items.map(it => (it.section || 'General Works').trim()).filter(Boolean)));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (selectedSection === 'all') return items;
    return items.filter(it => (it.section || 'General Works').trim().toLowerCase() === selectedSection.toLowerCase());
  }, [items, selectedSection]);

  // Calculate gross sum of filtered BOQ items for benchmark comparison
  const boqDirectTotal = useMemo(() => {
    if (!Array.isArray(filteredItems) || filteredItems.length === 0) return 0;
    return filteredItems.reduce((acc, it) => acc + (Number(it.qty || 0) * Number(it.rate || 0)), 0);
  }, [filteredItems]);

  const effectiveBoqTotal = serverProjectTotal || (boqDirectTotal > 0 ? boqDirectTotal * 1.236 : 0); // With standard P&O + VAT

  useEffect(() => {
    if (isOpen) {
      if (projectId && selectedSection === 'all') {
        setLoading(true);
        safeFetchJson<{ summary: MaterialData; projectTotal?: number }>(`/api/projects/${projectId}/materials`)
          .then(({ ok, data: resData }) => {
            if (ok && resData?.summary) {
              setData(resData.summary);
              if (resData.projectTotal) setServerProjectTotal(resData.projectTotal);
            } else if (filteredItems && filteredItems.length > 0) {
              setData(calculateMaterialBreakdown(filteredItems));
            }
            setLoading(false);
          })
          .catch(() => {
            if (filteredItems && filteredItems.length > 0) {
              setData(calculateMaterialBreakdown(filteredItems));
            }
            setLoading(false);
          });
      } else if (filteredItems && filteredItems.length > 0) {
        setData(calculateMaterialBreakdown(filteredItems));
        setLoading(false);
      } else {
        setData(calculateMaterialBreakdown([]));
        setLoading(false);
      }
    }
  }, [isOpen, projectId, filteredItems, selectedSection]);

  if (!isOpen) return null;

  const handleCopyRequisition = () => {
    if (!data) return;
    const memo = `
SITE MATERIAL REQUISITION & PROCUREMENT ORDER
Project: ${projectTitle}
Date: ${new Date().toLocaleDateString('en-GB')}
--------------------------------------------------
1. Portland Cement (50kg bags): ${data.cementBags.toLocaleString()} bags @ ₦${data.depotRates.cement.toLocaleString()} = ₦${(data.cementBags * data.depotRates.cement).toLocaleString()}
2. Sharp River Sand: ${data.sandTonnes.toLocaleString()} tonnes (approx. ${Math.ceil(data.sandTonnes / 20)} tipper trips of 20t) @ ₦${data.depotRates.sand.toLocaleString()}/t = ₦${(data.sandTonnes * data.depotRates.sand).toLocaleString()}
3. Granite (20mm Aggregate): ${data.graniteTonnes.toLocaleString()} tonnes (approx. ${Math.ceil(data.graniteTonnes / 30)} trips of 30t) @ ₦${data.depotRates.granite.toLocaleString()}/t = ₦${(data.graniteTonnes * data.depotRates.granite).toLocaleString()}
4. High-Yield Rebars (Y10-Y20): ${data.rebarTonnes.toLocaleString()} tonnes @ ₦${data.depotRates.rebar.toLocaleString()}/t = ₦${(data.rebarTonnes * data.depotRates.rebar).toLocaleString()}
5. 225mm Vibrated Sandcrete Blocks: ${data.blocks225.toLocaleString()} units @ ₦${data.depotRates.block225.toLocaleString()} = ₦${(data.blocks225 * data.depotRates.block225).toLocaleString()}
6. 150mm Sandcrete Blocks: ${data.blocks150.toLocaleString()} units @ ₦${data.depotRates.block150.toLocaleString()} = ₦${(data.blocks150 * data.depotRates.block150).toLocaleString()}
7. Aluminium Roofing Sheets: ${data.roofingSqm.toLocaleString()} m² @ ₦${data.depotRates.roofing.toLocaleString()}/m² = ₦${(data.roofingSqm * data.depotRates.roofing).toLocaleString()}
--------------------------------------------------
ESTIMATED DIRECT MATERIALS BUDGET: ₦${data.totalCost.toLocaleString()}
Prepared via Let's Estimate (Nigerian Construction SaaS)
    `.trim();

    navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const materialList = data
    ? [
        {
          name: 'Portland Cement (50kg bags)',
          spec: 'Grade 42.5N Ordinary Portland Cement (Dangote / BUA / Elephant)',
          qty: `${data.cementBags.toLocaleString()} bags`,
          unit: 'Bags',
          rate: data.depotRates.cement,
          amount: data.cementBags * data.depotRates.cement,
          iconColor: 'bg-slate-100 text-slate-700',
        },
        {
          name: 'Sharp River Sand (Clean Coarse)',
          spec: `Concrete & Mortar aggregate (${Math.ceil(data.sandTonnes / 20)} x 20-tonne tipper loads)`,
          qty: `${data.sandTonnes.toLocaleString()} tonnes`,
          unit: 'Tonnes',
          rate: data.depotRates.sand,
          amount: data.sandTonnes * data.depotRates.sand,
          iconColor: 'bg-amber-100 text-amber-800',
        },
        {
          name: '20mm Granite (Crushed Stone)',
          spec: `Clean quarry aggregate (${Math.ceil(data.graniteTonnes / 30)} x 30-tonne tipper loads)`,
          qty: `${data.graniteTonnes.toLocaleString()} tonnes`,
          unit: 'Tonnes',
          rate: data.depotRates.granite,
          amount: data.graniteTonnes * data.depotRates.granite,
          iconColor: 'bg-blue-100 text-blue-800',
        },
        {
          name: 'High-Yield Reinforcement Rebars',
          spec: 'High-yield deformed steel rods (mix of Y10, Y12, Y16, Y20 & binding wire)',
          qty: `${data.rebarTonnes.toLocaleString()} tonnes`,
          unit: 'Tonnes',
          rate: data.depotRates.rebar,
          amount: data.rebarTonnes * data.depotRates.rebar,
          iconColor: 'bg-red-100 text-red-800',
        },
        {
          name: '225mm Vibrated Hollow Sandcrete Blocks',
          spec: '9" Standard perimeter wall blocks with 5% breakage allowance included',
          qty: `${data.blocks225.toLocaleString()} blocks`,
          unit: 'Blocks',
          rate: data.depotRates.block225,
          amount: data.blocks225 * data.depotRates.block225,
          iconColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          name: '150mm Sandcrete Partition Blocks',
          spec: '6" Internal room dividing blocks with 5% breakage allowance included',
          qty: `${data.blocks150.toLocaleString()} blocks`,
          unit: 'Blocks',
          rate: data.depotRates.block150,
          amount: data.blocks150 * data.depotRates.block150,
          iconColor: 'bg-teal-100 text-teal-800',
        },
        {
          name: 'Aluminium Step-Tile Roofing Sheets',
          spec: '0.55mm heavy gauge standing seam roofing with laps and ridge caps',
          qty: `${data.roofingSqm.toLocaleString()} m²`,
          unit: 'm²',
          rate: data.depotRates.roofing,
          amount: data.roofingSqm * data.depotRates.roofing,
          iconColor: 'bg-indigo-100 text-indigo-800',
        },
      ]
    : [];

  const materialRatio = data && effectiveBoqTotal > 0
    ? Math.round((data.totalCost / effectiveBoqTotal) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Material Procurement Schedule &amp; Site Budget
                </h3>
                <span className="text-[10px] bg-emerald-800 text-emerald-100 font-semibold px-2 py-0.5 rounded-full border border-emerald-700">
                  Site Logistics
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Automated bill conversion: cement bags, tonnes of sand &amp; granite, rebar and block counts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Context & Top Stats */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project:</span>
              <h4 className="text-sm font-bold text-slate-900">{projectTitle}</h4>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyRequisition}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Requisition Copied!' : 'Copy Site Order Memo'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Schedule</span>
              </button>
            </div>
          </div>

          {/* Trade Scope Filter Bar */}
          {availableSections.length > 1 && (
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-emerald-700" />
                <span>Filter Trade Scope:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSection('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedSection === 'all'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                All Trades ({items.length})
              </button>
              {availableSections.map((sec) => {
                const count = items.filter(it => (it.section || 'General Works').trim() === sec).length;
                const isSelected = selectedSection.toLowerCase() === sec.toLowerCase();
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {sec} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {selectedSection !== 'all' && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Showing material schedule strictly for: <strong>{selectedSection}</strong> ({filteredItems.length} measured item{filteredItems.length > 1 ? 's' : ''}). Non-relevant materials (such as rebar, granite, or roofing) are excluded.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSection('all')}
                className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer ml-3 shrink-0"
              >
                Show All Trades
              </button>
            </div>
          )}
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Calculating material schedule from active bill dimensions...
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No material data available. Please verify the project BOQ contains items.
            </div>
          ) : (
            <>
              {/* Grand Total Budget Banner & Benchmark Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 col-span-1 md:col-span-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-emerald-700 text-white">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block">
                        Direct Factory &amp; Depot Materials Budget
                      </span>
                      <h4 className="text-2xl font-mono font-bold text-emerald-950 mt-0.5">
                        {formatNaira(data.totalCost)}
                      </h4>
                    </div>
                  </div>
                  {materialRatio !== null && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        BOQ Materials Ratio
                      </span>
                      <span className="text-lg font-bold text-emerald-800 font-mono">
                        {materialRatio}% of BOQ
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Realistic NIQS Benchmark</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Direct raw materials account for <strong>40% – 60%</strong> of total civil tender value. Site labour, plant, formwork, overheads (15%), and VAT (7.5%) comprise the rest.
                    </p>
                  </div>
                </div>
              </div>

              {/* Material Items Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-3">Material Item</th>
                      <th className="py-3 px-3">Technical Specification</th>
                      <th className="py-3 px-3 text-right">Required Quantity</th>
                      <th className="py-3 px-3 text-right">Estimated Depot Rate</th>
                      <th className="py-3 px-3 text-right">Subtotal (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {materialList.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${m.iconColor.split(' ')[0]}`} />
                          <span>{m.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs">{m.spec}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{m.qty}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatNaira(m.rate)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatNaira(m.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Technical Conversion Factors Footer */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Engineering Conversion Standards &amp; Calculation Audit Trail:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-500">
                  <li><strong>Concrete (Grade 25 1:2:4):</strong> 6.6 bags cement (330kg/m³), 0.68t sharp sand, 1.25t 20mm granite per m³. Earthwork and bulk excavations are strictly excluded.</li>
                  <li><strong>Reinforcement Rebars:</strong> Calculated strictly from measured rebar line items in kg/tonnes. No artificial duplication or double-counting onto concrete items.</li>
                  <li><strong>Sandcrete Blockwork:</strong> 10.5 blocks/m² with 5% breakage allowance; 0.22 bags cement and 0.035t sand for bedding mortar (225mm wall).</li>
                  <li><strong>Plastering &amp; Screed:</strong> 15mm 1:4 rendering at 0.12 bags cement/m²; floor screed at 0.25 bags cement/m².</li>
                  <li><strong>Depot Wholesale Rates:</strong> Direct factory/depot wholesale supply rates excluding contractor profit/overheads, equipment rental, and artisanal site wages.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>* Quantities derived mathematically from measured BOQ item dimensions.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
