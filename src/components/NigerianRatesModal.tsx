import React, { useState, useEffect } from 'react';
import { StandardRate } from '../types';
import { formatNaira } from '../utils/format';
import { X, Search, MapPin, Database, Sparkles, Check } from 'lucide-react';

interface NigerianRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRate?: (rateItem: StandardRate, region: 'lagos' | 'abuja' | 'ph') => void;
}

export const NigerianRatesModal: React.FC<NigerianRatesModalProps> = ({
  isOpen,
  onClose,
  onSelectRate,
}) => {
  const [rates, setRates] = useState<StandardRate[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<'lagos' | 'abuja' | 'ph'>('lagos');
  const [search, setSearch] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && rates.length === 0) {
      fetch('/api/rates/standard')
        .then((res) => res.json())
        .then((data) => {
          if (data.rates) setRates(data.rates);
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen, rates.length]);

  if (!isOpen) return null;

  const filteredRates = rates.filter(
    (r) =>
      r.item.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.spec.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Modal Top */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Nigerian Construction Cost & Unit Rate Index
              </h3>
              <p className="text-xs text-emerald-200">
                Current market rates in Nigerian Naira (₦) for Substructure, Superstructure, Roofing & Finishes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-2 rounded-lg hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region Selector & Filter */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Region Tabs */}
          <div className="flex items-center space-x-2 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedRegion('lagos')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedRegion === 'lagos'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lagos State
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('abuja')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedRegion === 'abuja'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Abuja FCT
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion('ph')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedRegion === 'ph'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Port Harcourt (Rivers)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by item or spec..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Trade / Item</th>
                <th className="py-2.5 px-3">Specification</th>
                <th className="py-2.5 px-2 text-center w-16">Unit</th>
                <th className="py-2.5 px-3 text-right w-28">
                  {selectedRegion === 'lagos' ? 'Lagos ₦' : selectedRegion === 'abuja' ? 'Abuja ₦' : 'Port Harcourt ₦'}
                </th>
                {onSelectRate && <th className="py-2.5 px-3 text-center w-24">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRates.map((r, idx) => {
                const regionalRate = r[selectedRegion];
                return (
                  <tr key={idx} className="hover:bg-emerald-50/40">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{r.item}</div>
                      <span className="text-[10px] text-emerald-700 font-medium px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-sm">{r.spec}</td>
                    <td className="py-3 px-2 text-center font-mono font-medium text-slate-800">{r.unit}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                      {formatNaira(regionalRate)}
                    </td>
                    {onSelectRate && (
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectRate(r, selectedRegion);
                            setCopiedIdx(idx);
                            setTimeout(() => setCopiedIdx(null), 1500);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] shadow-sm transition"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 mx-auto" /> : 'Use Rate'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>* Market indices gathered from active building projects in Lagos, Abuja & Port Harcourt.</span>
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
