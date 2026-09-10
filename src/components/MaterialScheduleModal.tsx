import React, { useState, useEffect } from 'react';
import { BoqItem } from '../types';
import { formatNaira } from '../utils/format';
import { safeFetchJson } from '../utils/api';
import { 
  X, Package, Truck, Layers, FileSpreadsheet, Copy, Check, Printer, 
  ArrowDownToLine, DollarSign, Info
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
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      safeFetchJson<{ summary: MaterialData }>(`/api/projects/${projectId}/materials`)
        .then(({ ok, data: resData }) => {
          if (ok && resData?.summary) {
            setData(resData.summary);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, projectId, items]);

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
                  Material Procurement Schedule & Site Budget
                </h3>
                <span className="text-[10px] bg-emerald-800 text-emerald-100 font-semibold px-2 py-0.5 rounded-full border border-emerald-700">
                  Site Logistics
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Automated bill conversion: cement bags, tonnes of sand & granite, rebar and block counts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Context & Top Stats */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project:</span>
            <h4 className="text-sm font-bold text-slate-900">{projectTitle}</h4>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyRequisition}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Requisition Copied!' : 'Copy Site Order Memo'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
              {/* Grand Total Budget Banner */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-emerald-700 text-white">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                      Estimated Direct Materials Budget
                    </span>
                    <h4 className="text-xl font-mono font-bold text-emerald-950">
                      {formatNaira(data.totalCost)}
                    </h4>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
                  Depot wholesale benchmarks calibrated for Nigerian supply chains
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
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Engineering Conversion Factors Applied:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-500">
                  <li>Concrete (Grade 25 1:1.5:3): 7.2 bags cement, 0.72t sharp sand, 1.35t 20mm granite, ~120kg rebar per m³</li>
                  <li>Sandcrete Blockwork: 10 blocks/m² + 5% breakage allowance, 0.28 bags cement & 0.05t sand for bedding mortar</li>
                  <li>Plastering & Screed: 15mm thick 1:4 mix at 0.15 bags cement and 0.025t sand per m²</li>
                  <li>Longspan Step-tile: 1.15 multiplier accounting for side/end overlaps, ridges, and valley gutters</li>
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
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
