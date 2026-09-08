import React from 'react';
import { formatNaira } from '../utils/format';
import { ShieldCheck, Percent, Waves, Calculator } from 'lucide-react';

interface FinancialSummaryProps {
  subtotal: number;
  poPercent: number;
  setPoPercent: (val: number) => void;
  vatPercent: number;
  setVatPercent: (val: number) => void;
  swampPremiumPercent: number;
  setSwampPremiumPercent: (val: number) => void;
  grandTotal: number;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  subtotal,
  poPercent,
  setPoPercent,
  vatPercent,
  setVatPercent,
  swampPremiumPercent,
  setSwampPremiumPercent,
  grandTotal,
}) => {
  const swampAmount = subtotal * (swampPremiumPercent / 100);
  const adjustedSubtotal = subtotal + swampAmount;
  const poAmount = adjustedSubtotal * (poPercent / 100);
  const vatAmount = (adjustedSubtotal + poAmount) * (vatPercent / 100);

  return (
    <div id="financial-totals-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
      
      <div className="flex items-center space-x-2 mb-4">
        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
          3
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Bill Summary & Statutory Markups
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left: Statutory Markup Controls (P&O, VAT, Terrain Multiplier) */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
          <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
            Markup Parameters
          </span>

          {/* 15% Profit & Overheads */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-slate-700 font-medium flex items-center space-x-1.5">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <span>Profit & Overheads (P&O):</span>
            </label>
            <div className="flex items-center space-x-1">
              <input
                id="po-percent-input"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={poPercent}
                onChange={(e) => setPoPercent(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-right font-bold text-slate-800 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="font-bold text-slate-500">%</span>
            </div>
          </div>

          {/* 7.5% Nigerian VAT */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-slate-700 font-medium flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Nigerian VAT (Statutory):</span>
            </label>
            <div className="flex items-center space-x-1">
              <input
                id="vat-percent-input"
                type="number"
                min="0"
                max="25"
                step="0.5"
                value={vatPercent}
                onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-right font-bold text-slate-800 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="font-bold text-slate-500">%</span>
            </div>
          </div>

          {/* NICE TO HAVE: Swamp Premium % Terrain Multiplier */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
            <div>
              <label className="text-slate-700 font-medium flex items-center space-x-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-600" />
                <span>Swamp / Terrain Premium:</span>
              </label>
              <span className="text-[10px] text-slate-500 block">
                Terrain multiplier (e.g. Niger Delta / Lekki swamp)
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <input
                id="swamp-premium-input"
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={swampPremiumPercent}
                onChange={(e) => setSwampPremiumPercent(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-right font-bold text-slate-800 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
              <span className="font-bold text-slate-500">%</span>
            </div>
          </div>
        </div>

        {/* Right: Totals Ledger Calculation */}
        <div className="bg-emerald-900 text-white p-5 rounded-xl shadow-inner border border-emerald-800 space-y-2.5">
          
          {/* Sub-Total */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-200">
            <span>Measured Sub-Total:</span>
            <span className="font-mono font-semibold text-white">{formatNaira(subtotal)}</span>
          </div>

          {/* Swamp Premium Amount if > 0 */}
          {swampPremiumPercent > 0 && (
            <div className="flex items-center justify-between text-xs text-cyan-200">
              <span>Swamp / Terrain Surcharge ({swampPremiumPercent}%):</span>
              <span className="font-mono font-semibold text-cyan-100">+{formatNaira(swampAmount)}</span>
            </div>
          )}

          {/* 15% P&O */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-200">
            <span>Add {poPercent}% Profit & Overheads (P&O):</span>
            <span className="font-mono font-semibold text-emerald-100">+{formatNaira(poAmount)}</span>
          </div>

          {/* 7.5% VAT */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-200">
            <span>Add {vatPercent}% Value Added Tax (VAT):</span>
            <span className="font-mono font-semibold text-emerald-100">+{formatNaira(vatAmount)}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-emerald-700/80 my-2 pt-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                  Grand Total (BOQ Estimate)
                </span>
                <span className="text-[10px] text-emerald-300/80">
                  Total Project Construction Cost
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                  {formatNaira(grandTotal)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
