import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, X, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { ProjectVariation, BESMM4_SECTIONS } from '../types';
import { formatNaira } from '../utils/format';
import { FormattedNumberInput } from './common/FormattedNumberInput';

interface ProjectVariationsModalProps {
  projectId: string;
  contractSum: number;
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export const ProjectVariationsModal: React.FC<ProjectVariationsModalProps> = ({
  projectId,
  contractSum,
  isOpen,
  onClose,
  token
}) => {
  const [variations, setVariations] = useState<ProjectVariation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [voNumber, setVoNumber] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [section, setSection] = useState<string>(BESMM4_SECTIONS[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('m2');
  const [rate, setRate] = useState<number>(0);
  const [type, setType] = useState<'addition' | 'omission'>('addition');
  const [status, setStatus] = useState<'Draft' | 'Submitted' | 'Approved' | 'Rejected'>('Approved');

  useEffect(() => {
    if (isOpen && projectId) {
      loadVariations();
    }
  }, [isOpen, projectId]);

  const loadVariations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/variations`);
      const data = await res.json();
      if (data.variations) {
        setVariations(data.variations);
        const nextNum = (data.variations.length || 0) + 1;
        setVoNumber(`VO-${String(nextNum).padStart(2, '0')}`);
      }
    } catch (err: any) {
      console.error('Failed to load variations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setSaving(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${projectId}/variations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          variation_number: voNumber,
          description: description.trim(),
          reason: reason.trim(),
          section,
          quantity: Number(quantity),
          unit,
          rate: Number(rate),
          type,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create variation');

      setShowAddForm(false);
      setDescription('');
      setReason('');
      setRate(0);
      setQuantity(1);
      loadVariations();
    } catch (err: any) {
      alert('Error creating variation: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (variationId: string, newStatus: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/projects/${projectId}/variations/${variationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      setVariations(prev => prev.map(v => v.id === variationId ? { ...v, status: newStatus as any } : v));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (variationId: string) => {
    if (!window.confirm('Delete this variation order?')) return;
    try {
      await fetch(`/api/projects/${projectId}/variations/${variationId}`, { method: 'DELETE' });
      setVariations(prev => prev.filter(v => v.id !== variationId));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Calculations
  const safeVariations = Array.isArray(variations) ? variations : [];
  const approvedVariations = safeVariations.filter(v => v?.status === 'Approved');
  const approvedAdditions = approvedVariations
    .filter(v => v?.type === 'addition')
    .reduce((sum, v) => sum + Math.abs(v?.amount || 0), 0);

  const approvedOmissions = approvedVariations
    .filter(v => v?.type === 'omission')
    .reduce((sum, v) => sum + Math.abs(v?.amount || 0), 0);

  const netVariationSum = approvedAdditions - approvedOmissions;
  const revisedContractSum = (contractSum || 0) + netVariationSum;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">Project Variations & Additions / Omissions</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {variations.length} Orders
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Track architect site instructions, structural omissions, and client-requested scope changes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Original Contract</p>
              <p className="text-sm sm:text-base font-black text-slate-900 mt-1">
                {formatNaira(contractSum)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Approved Additions</p>
              </div>
              <p className="text-sm sm:text-base font-black text-emerald-700 mt-1">
                +{formatNaira(approvedAdditions)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <p className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Approved Omissions</p>
              </div>
              <p className="text-sm sm:text-base font-black text-rose-700 mt-1">
                -{formatNaira(approvedOmissions)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Revised Contract Sum</p>
              <p className="text-sm sm:text-base font-black text-indigo-800 mt-1">
                {formatNaira(revisedContractSum)}
              </p>
            </div>
          </div>

          {/* Trigger / Add Form */}
          {!showAddForm ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Issue New Variation Order (VO)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Record addition or omission with BESMM4 rate breakdown and approval state.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Variation</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateVariation} className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Record Variation Order
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Variation Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={voNumber}
                    onChange={(e) => setVoNumber(e.target.value)}
                    placeholder="e.g. VO-01"
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trade Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    {BESMM4_SECTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('addition')}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition ${
                        type === 'addition'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      + Addition
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('omission')}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition ${
                        type === 'omission'
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      - Omission
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description of Works *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Provide and fix additional 1200x1200mm aluminium casement window in study"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Site Instruction Ref
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Architect Site Instruction SI/04 dated 14 Feb 2025"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <FormattedNumberInput
                    value={quantity}
                    onChange={(val) => setQuantity(val)}
                    maxDecimals={2}
                    placeholder="1"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="m2, m, No, m3"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate (₦)
                  </label>
                  <FormattedNumberInput
                    value={rate}
                    onChange={(val) => setRate(val)}
                    maxDecimals={2}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calculated Amount
                  </label>
                  <div className={`px-3 py-1.5 text-xs font-black rounded-lg border text-right ${
                    type === 'addition' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}>
                    {type === 'addition' ? '+' : '-'}{formatNaira(Math.abs(quantity * rate))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-semibold text-slate-600">Initial Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="text-xs font-bold px-2 py-1 rounded border border-slate-300 bg-white"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Draft">Draft</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-50"
                  >
                    {saving ? 'Recording...' : 'Add Variation Order'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Table of Variations */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Ref</th>
                    <th className="py-2.5 px-3">Trade & Description</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Rate (₦)</th>
                    <th className="py-2.5 px-3 text-right">Net Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        Loading variations...
                      </td>
                    </tr>
                  ) : variations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No variations recorded for this project yet.
                      </td>
                    </tr>
                  ) : (
                    variations.map((v) => {
                      const isAddition = v.type === 'addition';
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                            {v.variation_number}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{v.description}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                              <span className="font-medium text-slate-700">{v.section}</span>
                              {v.reason && <span>• {v.reason}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                            {v.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-medium">
                            {v.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                            {formatNaira(v.rate)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-black whitespace-nowrap ${
                            isAddition ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {isAddition ? '+' : '-'}{formatNaira(Math.abs(v.amount))}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <select
                              value={v.status}
                              onChange={(e) => handleStatusChange(v.id, e.target.value)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                v.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : v.status === 'Submitted'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : v.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-slate-100 text-slate-800 border-slate-300'
                              }`}
                            >
                              <option value="Draft">Draft</option>
                              <option value="Submitted">Submitted</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDelete(v.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete variation"
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
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Net Approved Variation: <span className="font-bold text-slate-800">{netVariationSum >= 0 ? '+' : ''}{formatNaira(netVariationSum)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
