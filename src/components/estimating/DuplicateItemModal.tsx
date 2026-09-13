import React from 'react';
import { AlertTriangle, GitMerge, RefreshCw, CopyPlus, X, Check, ArrowRight } from 'lucide-react';
import { BoqItem } from '../../types';
import { formatNaira } from '../../utils/format';

export interface DuplicatePromptData {
  existingItem: BoqItem;
  incomingItem: BoqItem;
  onResolve: (action: 'merge' | 'replace' | 'keep_both' | 'cancel') => void;
}

interface DuplicateItemModalProps {
  data: DuplicatePromptData | null;
  onClose: () => void;
}

export const DuplicateItemModal: React.FC<DuplicateItemModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  const { existingItem, incomingItem, onResolve } = data;

  const existingQty = Number(existingItem.qty || 0);
  const incomingQty = Number(incomingItem.qty || 0);
  const mergedQty = Math.round((existingQty + incomingQty) * 100) / 100;
  const mergedAmount = Math.round(mergedQty * (existingItem.rate || incomingItem.rate || 0));

  const handleAction = (action: 'merge' | 'replace' | 'keep_both' | 'cancel') => {
    onResolve(action);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Similar BOQ Item Already Exists
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                A line item with the same trade section, description, unit, and source is already in this project.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAction('cancel')}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Cancel and close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Existing Item Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Existing in Bill
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                Item #{existingItem.item_number || 1}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 line-clamp-2">
                {existingItem.description || existingItem.item}
              </p>
              <p className="text-[11px] text-slate-500">
                Section: <span className="font-semibold text-slate-700">{existingItem.section || 'General'}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Quantity</span>
                <span className="font-bold text-slate-800">{existingQty.toLocaleString()} {existingItem.unit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Rate</span>
                <span className="font-bold text-slate-800">{formatNaira(existingItem.rate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Amount</span>
                <span className="font-bold text-slate-900">{formatNaira(existingItem.amount)}</span>
              </div>
            </div>

            {existingItem.source && (
              <div className="text-[10px] text-slate-500 pt-1">
                Source: <span className="font-medium text-slate-700">{existingItem.source}</span>
              </div>
            )}
          </div>

          {/* Incoming Item Card */}
          <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Incoming Candidate
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-semibold">
                New Add
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-950 line-clamp-2">
                {incomingItem.description || incomingItem.item}
              </p>
              <p className="text-[11px] text-emerald-800">
                Section: <span className="font-semibold text-emerald-900">{incomingItem.section || 'General'}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-200/80 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-emerald-700 block">Quantity</span>
                <span className="font-bold text-emerald-950">+{incomingQty.toLocaleString()} {incomingItem.unit}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 block">Rate</span>
                <span className="font-bold text-emerald-950">{formatNaira(incomingItem.rate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 block">Amount</span>
                <span className="font-bold text-emerald-950">{formatNaira(incomingItem.amount)}</span>
              </div>
            </div>

            {incomingItem.source && (
              <div className="text-[10px] text-emerald-800 pt-1">
                Source: <span className="font-medium text-emerald-900">{incomingItem.source}</span>
              </div>
            )}
          </div>
        </div>

        {/* Preview of Merge Result */}
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <GitMerge className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              If you <strong className="font-bold">Merge</strong>, quantity becomes <strong className="font-extrabold">{mergedQty.toLocaleString()} {existingItem.unit}</strong>
            </span>
          </div>
          <span className="font-extrabold text-amber-950">
            {formatNaira(mergedAmount)}
          </span>
        </div>

        {/* 4 Action Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {/* 1. Merge */}
          <button
            type="button"
            onClick={() => handleAction('merge')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-600 bg-emerald-800 hover:bg-emerald-700 text-white transition text-center shadow-xs cursor-pointer group"
          >
            <GitMerge className="w-4 h-4 mb-1 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Merge</span>
            <span className="text-[10px] text-emerald-200 mt-0.5">Sum quantities</span>
          </button>

          {/* 2. Replace */}
          <button
            type="button"
            onClick={() => handleAction('replace')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition text-center shadow-2xs cursor-pointer group"
          >
            <RefreshCw className="w-4 h-4 mb-1 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Replace</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Overwrite existing</span>
          </button>

          {/* 3. Keep Both */}
          <button
            type="button"
            onClick={() => handleAction('keep_both')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition text-center shadow-2xs cursor-pointer group"
          >
            <CopyPlus className="w-4 h-4 mb-1 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Keep Both</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Add separate row</span>
          </button>

          {/* 4. Cancel */}
          <button
            type="button"
            onClick={() => handleAction('cancel')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-center cursor-pointer"
          >
            <X className="w-4 h-4 mb-1 text-slate-500" />
            <span className="text-xs font-bold">Cancel</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Do not add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
