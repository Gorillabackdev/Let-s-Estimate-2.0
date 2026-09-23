import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Save, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Layers
} from 'lucide-react';
import { BoqItem } from '../../types';
import { formatNaira } from '../../utils/format';

export interface TradeBudgetItem {
  id: string;
  name: string;
  budget: number;
  actual_spend?: number;
  notes?: string;
}

interface TradeBudgetTableProps {
  contractSum: number;
  subtotal: number;
  tradeBudgets: TradeBudgetItem[];
  onChange: (trades: TradeBudgetItem[]) => void;
  onSave: () => Promise<void> | void;
  boqItems?: BoqItem[];
}

export const DEFAULT_BESMM4_TRADES: Array<{ name: string; defaultPct: number; notes: string }> = [
  { name: 'Substructure & Earthworks', defaultPct: 18, notes: 'Excavation, concrete footing, hardcore, DPC & foundation blockwork' },
  { name: 'Reinforced Concrete Superstructure', defaultPct: 24, notes: 'Columns, beams, suspended slabs, lintels & RC stairs' },
  { name: 'Blockwork, Masonry & Partitions', defaultPct: 12, notes: 'Internal & external sandcrete block walls' },
  { name: 'Roof Construction & Coverings', defaultPct: 10, notes: 'Structural timber trusses, aluminium roof covering & gutters' },
  { name: 'Doors, Windows & Ironmongery', defaultPct: 8, notes: 'Glazed casement windows, flush doors & security doors' },
  { name: 'Finishes (Plaster, Screed, Tiles, Paint)', defaultPct: 15, notes: 'Internal plaster, floor screed, ceramic tiles, POP & painting' },
  { name: 'Mechanical, Electrical & Plumbing (MEP)', defaultPct: 13, notes: 'Conduits, wiring, fittings, pipes, drainage & sanitary wares' },
];

export const TradeBudgetTable: React.FC<TradeBudgetTableProps> = ({
  contractSum,
  subtotal,
  tradeBudgets,
  onChange,
  onSave,
  boqItems = []
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compute live totals
  const totalBudget = tradeBudgets.reduce((sum, t) => sum + Number(t.budget || 0), 0);
  const totalActual = tradeBudgets.reduce((sum, t) => sum + Number(t.actual_spend || 0), 0);
  const totalVariance = totalBudget - totalActual;

  const handleUpdateField = (id: string, field: keyof TradeBudgetItem, value: any) => {
    const updated = tradeBudgets.map((t) => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    });
    onChange(updated);
  };

  const handleAddTrade = () => {
    const newId = `tb-${Date.now()}`;
    const newTrade: TradeBudgetItem = {
      id: newId,
      name: 'New Trade Section',
      budget: 0,
      actual_spend: 0,
      notes: ''
    };
    onChange([...tradeBudgets, newTrade]);
  };

  const handleDeleteTrade = (id: string) => {
    onChange(tradeBudgets.filter((t) => t.id !== id));
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset trade allocations to standard BESMM4 benchmark percentages?')) return;
    const baseDirect = subtotal > 0 ? subtotal : (contractSum * 0.75);
    const resetList: TradeBudgetItem[] = DEFAULT_BESMM4_TRADES.map((d, index) => ({
      id: `tb-def-${index + 1}`,
      name: d.name,
      budget: Math.round(baseDirect * (d.defaultPct / 100)),
      actual_spend: 0,
      notes: d.notes
    }));
    onChange(resetList);
  };

  const handleSyncFromBoq = () => {
    if (!boqItems || boqItems.length === 0) {
      alert('No BOQ items found in the current project to sync.');
      return;
    }

    // Group boqItems by section
    const sectionMap = new Map<string, number>();
    boqItems.forEach((item) => {
      const sec = item.section || 'General / Unclassified';
      const amt = Number(item.amount || (Number(item.qty || 0) * Number(item.rate || 0)) || 0);
      sectionMap.set(sec, (sectionMap.get(sec) || 0) + amt);
    });

    const syncedList: TradeBudgetItem[] = Array.from(sectionMap.entries()).map(([secName, secTotal], idx) => ({
      id: `tb-sync-${idx + 1}-${Date.now()}`,
      name: secName,
      budget: Math.round(secTotal),
      actual_spend: 0,
      notes: `Aggregated from ${boqItems.filter(i => (i.section || 'General / Unclassified') === secName).length} BOQ items`
    }));

    onChange(syncedList);
  };

  const handleSaveClick = async () => {
    try {
      setIsSaving(true);
      await onSave();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900">
            Trade Section Allocation &amp; Cost Control
          </h4>
          <p className="text-xs text-slate-500">
            Every trade name, budget ceiling, and committed spend is 100% editable. Recalculates live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {boqItems.length > 0 && (
            <button
              type="button"
              onClick={handleSyncFromBoq}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              title="Auto-aggregate budget from project's actual BOQ line items"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sync from BOQ ({boqItems.length} items)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold inline-flex items-center space-x-1.5 transition cursor-pointer"
            title="Reset to standard BESMM4 reference distribution"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Standard Presets</span>
          </button>

          <button
            type="button"
            onClick={handleAddTrade}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trade</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Allocations'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 font-bold block text-[10px] uppercase">Total Trade Budget Allocated</span>
          <span className="text-base font-extrabold text-slate-900 mt-0.5 block font-mono">
            {formatNaira(totalBudget)}
          </span>
          <span className="text-[10px] text-slate-400">Sum of all trade ceilings</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 font-bold block text-[10px] uppercase">Actual Committed Expenditure</span>
          <span className="text-base font-extrabold text-slate-900 mt-0.5 block font-mono">
            {formatNaira(totalActual)}
          </span>
          <span className="text-[10px] text-slate-400">Recorded actual expenses</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          totalVariance >= 0 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase">Budget Variance Balance</span>
            {totalVariance >= 0 ? (
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-800">
                <TrendingDown className="w-3 h-3 mr-0.5" /> Under Budget
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-bold text-rose-800">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Over Budget
              </span>
            )}
          </div>
          <span className="text-base font-extrabold mt-0.5 block font-mono">
            {totalVariance >= 0 ? `+${formatNaira(totalVariance)}` : `-${formatNaira(Math.abs(totalVariance))}`}
          </span>
          <span className="text-[10px] opacity-80">
            {totalVariance >= 0 ? 'Remaining trade contingency' : 'Requires variation or cost review'}
          </span>
        </div>
      </div>

      {/* Editable Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 min-w-[200px]">Trade Section Description</th>
              <th className="p-3 text-right min-w-[140px]">Budget Ceiling (₦)</th>
              <th className="p-3 text-right min-w-[140px]">Actual Spend (₦)</th>
              <th className="p-3 text-right min-w-[130px]">Variance (₦)</th>
              <th className="p-3 min-w-[180px]">Notes / Scope</th>
              <th className="p-3 text-center w-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {tradeBudgets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No trade budget allocations yet. Click <strong>&quot;Standard Presets&quot;</strong> or <strong>&quot;Add Trade&quot;</strong> to begin.
                </td>
              </tr>
            ) : (
              tradeBudgets.map((trade) => {
                const b = Number(trade.budget || 0);
                const a = Number(trade.actual_spend || 0);
                const diff = b - a;
                const isOver = diff < 0;

                return (
                  <tr key={trade.id} className="hover:bg-slate-50/80 transition">
                    {/* Trade Name */}
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={trade.name}
                        onChange={(e) => handleUpdateField(trade.id, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-lg font-bold text-slate-900 transition"
                      />
                    </td>

                    {/* Budget Ceiling */}
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={trade.budget}
                        onChange={(e) => handleUpdateField(trade.id, 'budget', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-lg text-right font-mono font-bold text-slate-900 transition"
                      />
                    </td>

                    {/* Actual Spend */}
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={trade.actual_spend || 0}
                        onChange={(e) => handleUpdateField(trade.id, 'actual_spend', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-lg text-right font-mono font-semibold text-slate-900 transition"
                      />
                    </td>

                    {/* Live Variance */}
                    <td className="p-2.5 text-right font-mono font-bold">
                      <span className={`px-2 py-1 rounded-md text-[11px] inline-block ${
                        isOver 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {diff >= 0 ? `+${formatNaira(diff)}` : `-${formatNaira(Math.abs(diff))}`}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="p-2.5">
                      <input
                        type="text"
                        placeholder="e.g. Subcontracted to Lead RC Framer"
                        value={trade.notes || ''}
                        onChange={(e) => handleUpdateField(trade.id, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-lg text-xs text-slate-600 transition"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete this trade allocation"
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
    </div>
  );
};
