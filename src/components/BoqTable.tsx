import React from 'react';
import { BoqItem } from '../types';
import { formatNaira, formatNumber } from '../utils/format';
import { Plus, Trash2, Calculator, Sparkles, RefreshCw } from 'lucide-react';

interface BoqTableProps {
  items: BoqItem[];
  onUpdateItem: (index: number, field: keyof BoqItem, value: any) => void;
  onAddItem: () => void;
  onDeleteItem: (index: number) => void;
  onApplyMarketRates: () => void;
}

export const BoqTable: React.FC<BoqTableProps> = ({
  items,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onApplyMarketRates,
}) => {
  return (
    <div id="boq-table-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Bill of Quantities (BOQ) Spreadsheet
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Edit quantities, units, and rates in Nigerian Naira (₦). Amounts auto-calculate instantly.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick autofill standard Nigerian market rates */}
          <button
            id="apply-rates-btn"
            type="button"
            onClick={onApplyMarketRates}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
            title="Auto-fill recommended current market rates for Lagos/Abuja/Port Harcourt"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Apply Market Rates</span>
          </button>

          {/* Add Row Button */}
          <button
            id="add-row-btn"
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center border-r border-emerald-700">No</th>
              <th className="py-3 px-3 w-36 border-r border-emerald-700">Bill Item</th>
              <th className="py-3 px-4 border-r border-emerald-700 min-w-[240px]">Description of Works</th>
              <th className="py-3 px-3 w-20 text-center border-r border-emerald-700">Unit</th>
              <th className="py-3 px-3 w-28 text-right border-r border-emerald-700">Qty</th>
              <th className="py-3 px-3 w-36 text-right border-r border-emerald-700">Rate ₦</th>
              <th className="py-3 px-4 w-40 text-right border-r border-emerald-700">Amount ₦</th>
              <th className="py-3 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No BOQ items yet.</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload an architectural drawing above or click "Add Row" to begin.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const qty = Number(item.qty || 0);
                const rate = Number(item.rate || 0);
                const amount = qty * rate;

                return (
                  <tr 
                    key={item.id || index}
                    id={`boq-row-${index + 1}`}
                    className="hover:bg-emerald-50/40 transition-colors group"
                  >
                    {/* Item Number */}
                    <td className="py-2.5 px-3 text-center text-xs font-bold text-slate-500 bg-slate-50/50 border-r border-slate-100">
                      {index + 1}
                    </td>

                    {/* Item Name */}
                    <td className="py-2 px-2 border-r border-slate-100">
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => onUpdateItem(index, 'item', e.target.value)}
                        placeholder="e.g. Blockwork"
                        className="w-full px-2 py-1.5 text-xs font-semibold text-slate-800 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                      />
                    </td>

                    {/* Description */}
                    <td className="py-2 px-2 border-r border-slate-100">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => onUpdateItem(index, 'description', e.target.value)}
                        placeholder="Detailed specification & location"
                        className="w-full px-2 py-1.5 text-xs text-slate-700 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-2 border-r border-slate-100 text-center">
                      <select
                        value={item.unit}
                        onChange={(e) => onUpdateItem(index, 'unit', e.target.value)}
                        className="w-full px-1 py-1.5 text-xs font-medium text-slate-700 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none bg-transparent transition text-center"
                      >
                        <option value="m2">m²</option>
                        <option value="m3">m³</option>
                        <option value="No">No</option>
                        <option value="m">m</option>
                        <option value="kg">kg</option>
                        <option value="t">tonne</option>
                        <option value="Item">Item</option>
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-2 border-r border-slate-100 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={item.qty === 0 ? '' : item.qty}
                        onChange={(e) => onUpdateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-xs font-mono font-medium text-right text-slate-900 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                      />
                    </td>

                    {/* Rate in Naira (₦) */}
                    <td className="py-2 px-2 border-r border-slate-100 text-right">
                      <div className="relative flex items-center">
                        <span className="absolute left-2 text-xs text-slate-400 font-bold">₦</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.rate === 0 ? '' : item.rate}
                          onChange={(e) => onUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-5 pr-2 py-1.5 text-xs font-mono font-semibold text-right text-slate-900 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </td>

                    {/* Amount = Qty * Rate */}
                    <td className="py-2.5 px-4 text-right border-r border-slate-100 font-mono font-bold text-xs sm:text-sm text-emerald-800 bg-emerald-50/20">
                      {formatNaira(amount)}
                    </td>

                    {/* Delete Row Action */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteItem(index)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Helper */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>{items.length} measured bill {items.length === 1 ? 'item' : 'items'} in takeoff</span>
        <span className="font-mono text-emerald-800 font-medium hidden sm:inline">
          Amount = Quantity × Unit Rate (₦)
        </span>
      </div>

    </div>
  );
};
