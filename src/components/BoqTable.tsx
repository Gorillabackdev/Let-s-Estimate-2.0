import React, { useState } from 'react';
import { BoqItem, BESMM4_SECTIONS } from '../types';
import { formatNaira } from '../utils/format';
import { Plus, Trash2, Calculator, Sparkles, Filter, BookmarkPlus, Check } from 'lucide-react';

interface BoqTableProps {
  items: BoqItem[];
  onUpdateItem: (index: number, field: keyof BoqItem, value: any) => void;
  onAddItem: (customItem?: Partial<BoqItem>) => void;
  onDeleteItem: (index: number) => void;
  onApplyMarketRates: () => void;
}

// BESMM4 Standard Nigerian Trade Presets
const BESMM4_PRESETS: Array<{
  section: string;
  item: string;
  description: string;
  unit: string;
  rate: number;
}> = [
  {
    section: 'Substructure',
    item: 'Excavation',
    description: 'Excavate foundation trenches not exceeding 1.50m deep starting from ground level',
    unit: 'm3',
    rate: 3800
  },
  {
    section: 'Substructure',
    item: 'Hardcore Filling',
    description: '300mm Thick consolidated granite/laterite hardcore filling under floor bed',
    unit: 'm2',
    rate: 4500
  },
  {
    section: 'Substructure',
    item: 'Damp Proof Membrane',
    description: '0.25mm Thick polythene damp-proof membrane (DPM) laid on sand blinding',
    unit: 'm2',
    rate: 1800
  },
  {
    section: 'Reinforced Concrete Frame',
    item: 'RC Columns & Beams',
    description: 'Vibrated reinforced in-situ concrete Grade 25 in columns, lintels, and floor beams',
    unit: 'm3',
    rate: 115000
  },
  {
    section: 'Reinforced Concrete Frame',
    item: 'High Yield Rebar',
    description: 'High yield deformed steel reinforcement bars (Y12, Y16, Y20) including cutting, bending & tying wire',
    unit: 'kg',
    rate: 1450
  },
  {
    section: 'Reinforced Concrete Frame',
    item: 'Sawn Formwork',
    description: 'Marine timber formwork to sides of beams, columns, and soffit of slabs',
    unit: 'm2',
    rate: 8500
  },
  {
    section: 'Blockwork & Partitioning',
    item: '225mm Sandcrete Blocks',
    description: '225mm Vibrated hollow sandcrete blockwork bedded and jointed in cement-sand mortar (1:4)',
    unit: 'm2',
    rate: 13500
  },
  {
    section: 'Blockwork & Partitioning',
    item: '150mm Sandcrete Blocks',
    description: '150mm Vibrated sandcrete blocks in internal non-loadbearing partition walls',
    unit: 'm2',
    rate: 11500
  },
  {
    section: 'Roofing & Rainwater Goods',
    item: 'Aluminium Longspan Roof',
    description: '0.55mm Thickness step-tile aluminium longspan roofing sheets fixed to hardwood rafters and purlins',
    unit: 'm2',
    rate: 14800
  },
  {
    section: 'Carpentry, Doors & Windows',
    item: 'Aluminium Sliding Window',
    description: 'Glazed anodized aluminium sliding windows (1200x1200mm) with 5mm tinted glass and burglar bar',
    unit: 'No',
    rate: 48000
  },
  {
    section: 'Carpentry, Doors & Windows',
    item: 'Solid Core Flush Door',
    description: '45mm Thick solid core panelled hardwood door (900x2100mm) including 3-lever mortice lockset and hinges',
    unit: 'No',
    rate: 85000
  },
  {
    section: 'Finishes (Plastering, Tiling & Screed)',
    item: 'Internal Wall Plaster',
    description: '15mm Thick cement and sand (1:4) rendering finished smooth with steel trowel to receive emulsion paint',
    unit: 'm2',
    rate: 3400
  },
  {
    section: 'Finishes (Plastering, Tiling & Screed)',
    item: 'Porcelain Floor Tiles',
    description: '600x600mm Glazed vitrified porcelain floor tiles laid on 25mm screeded bed with matching grout',
    unit: 'm2',
    rate: 16500
  },
  {
    section: 'Finishes (Plastering, Tiling & Screed)',
    item: 'POP Ceiling Finishing',
    description: 'Plaster of Paris (POP) cast suspended ceiling sheets with decorative cornice moulding',
    unit: 'm2',
    rate: 9500
  }
];

export const BoqTable: React.FC<BoqTableProps> = ({
  items = [],
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onApplyMarketRates,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];

  // Filter items if section is selected
  const filteredIndices = safeItems
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => {
      if (selectedSection === 'All') return true;
      return (item?.section || 'Unclassified') === selectedSection;
    });

  // Calculate grand subtotal of all items
  const grandBillSubtotal = safeItems.reduce((sum, item) => sum + ((item?.qty || 0) * (item?.rate || 0)), 0);

  // Calculate current filtered section subtotal
  const filteredSubtotal = filteredIndices.reduce((sum, { item }) => sum + ((item?.qty || 0) * (item?.rate || 0)), 0);
  const sectionPercentage = grandBillSubtotal > 0 ? ((filteredSubtotal / grandBillSubtotal) * 100).toFixed(1) : '0.0';

  const handleAddPreset = (preset: typeof BESMM4_PRESETS[0]) => {
    onAddItem({
      item: preset.item,
      description: preset.description,
      unit: preset.unit,
      qty: 10,
      rate: preset.rate,
      section: preset.section,
      amount: 10 * preset.rate
    });
    setShowPresetDropdown(false);
  };

  return (
    <div id="boq-table-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Bill of Quantities (BOQ) Spreadsheet
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            BESMM4 trade itemization with instant live recalculation in Nigerian Naira (₦).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Insertion Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-2xs"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Insert BESMM4 Preset</span>
            </button>

            {showPresetDropdown && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-30 max-h-96 overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Trade Item to Insert
                </div>
                {BESMM4_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs text-slate-800 flex flex-col transition border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{preset.item}</span>
                      <span className="font-semibold text-emerald-700 text-[11px]">{formatNaira(preset.rate)} / {preset.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5">{preset.description}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{preset.section}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
            onClick={() => onAddItem()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Trade Section Filter Bar */}
      <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
        <div className="flex items-center space-x-1 text-slate-500 mr-1 shrink-0 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Trade Section:</span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedSection('All')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
            selectedSection === 'All'
              ? 'bg-emerald-800 text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          All ({items.length})
        </button>

        {BESMM4_SECTIONS.map((sec) => {
          const count = items.filter(i => i.section === sec).length;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                selectedSection === sec
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              {sec.split(' ')[0]} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Section Subtotal Callout if filtered */}
      {selectedSection !== 'All' && (
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-950">
            Section: {selectedSection} ({filteredIndices.length} items)
          </span>
          <span className="font-semibold text-emerald-800">
            Section Subtotal: <strong>{formatNaira(filteredSubtotal)}</strong> ({sectionPercentage}% of Total Bill)
          </span>
        </div>
      )}

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[840px]">
          <thead>
            <tr className="bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center border-r border-emerald-700">No</th>
              <th className="py-3 px-3 w-40 border-r border-emerald-700">Section / Trade</th>
              <th className="py-3 px-3 w-36 border-r border-emerald-700">Bill Item</th>
              <th className="py-3 px-4 border-r border-emerald-700 min-w-[220px]">Description of Works</th>
              <th className="py-3 px-3 w-20 text-center border-r border-emerald-700">Unit</th>
              <th className="py-3 px-3 w-28 text-right border-r border-emerald-700">Qty</th>
              <th className="py-3 px-3 w-36 text-right border-r border-emerald-700">Rate ₦</th>
              <th className="py-3 px-4 w-40 text-right border-r border-emerald-700">Amount ₦</th>
              <th className="py-3 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filteredIndices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No items found in this section.</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click "Add Row" or "Insert BESMM4 Preset" to add items to {selectedSection === 'All' ? 'the bill' : selectedSection}.
                  </p>
                </td>
              </tr>
            ) : (
              filteredIndices.map(({ item, idx }) => {
                const qty = Number(item.qty || 0);
                const rate = Number(item.rate || 0);
                const amount = qty * rate;

                return (
                  <tr 
                    key={item.id || idx}
                    id={`boq-row-${idx + 1}`}
                    className="hover:bg-emerald-50/40 transition-colors group"
                  >
                    {/* Item Number */}
                    <td className="py-2.5 px-3 text-center text-xs font-bold text-slate-500 bg-slate-50/50 border-r border-slate-100">
                      {idx + 1}
                    </td>

                    {/* Section Selector */}
                    <td className="py-2 px-2 border-r border-slate-100">
                      <select
                        value={item.section || 'Superstructure'}
                        onChange={(e) => onUpdateItem(idx, 'section', e.target.value)}
                        className="w-full px-1.5 py-1 text-[11px] font-medium text-slate-700 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none bg-transparent transition truncate"
                      >
                        {BESMM4_SECTIONS.map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </td>

                    {/* Item Name */}
                    <td className="py-2 px-2 border-r border-slate-100">
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => onUpdateItem(idx, 'item', e.target.value)}
                        placeholder="e.g. Blockwork"
                        className="w-full px-2 py-1.5 text-xs font-semibold text-slate-800 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                      />
                    </td>

                    {/* Description */}
                    <td className="py-2 px-2 border-r border-slate-100">
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => onUpdateItem(idx, 'description', e.target.value)}
                          placeholder="Detailed specification & location"
                          className="w-full px-2 py-1.5 text-xs text-slate-700 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                        />
                        {Boolean(item.is_ai_generated) && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300" title="Detected via AI Takeoff Vision">
                            AI
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-2 border-r border-slate-100 text-center">
                      <select
                        value={item.unit}
                        onChange={(e) => onUpdateItem(idx, 'unit', e.target.value)}
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
                        onChange={(e) => onUpdateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => onUpdateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-5 pr-2 py-1.5 text-xs font-mono font-semibold text-right text-slate-900 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </td>

                    {/* Amount = Qty * Rate */}
                    <td className="py-2.5 px-4 text-right border-r border-slate-100 font-mono font-bold text-xs sm:text-sm text-emerald-800 bg-emerald-50/20 whitespace-nowrap">
                      {formatNaira(amount)}
                    </td>

                    {/* Delete Row Action */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteItem(idx)}
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
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span>{items.length} total bill {items.length === 1 ? 'item' : 'items'} in takeoff</span>
          <span>•</span>
          <span className="font-semibold text-emerald-800">
            Grand Bill Total: {formatNaira(grandBillSubtotal)}
          </span>
        </div>
        <span className="font-mono text-emerald-800 font-medium">
          Amount = Quantity × Unit Rate (₦)
        </span>
      </div>

    </div>
  );
};
