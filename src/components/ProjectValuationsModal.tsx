import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, X, CheckCircle2, Printer, Building2, Calendar, DollarSign, FileCheck } from 'lucide-react';
import { ProjectValuation, Project } from '../types';
import { formatNaira } from '../utils/format';

interface ProjectValuationsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export const ProjectValuationsModal: React.FC<ProjectValuationsModalProps> = ({
  project,
  isOpen,
  onClose,
  token
}) => {
  const [valuations, setValuations] = useState<ProjectValuation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ProjectValuation | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [valNumber, setValNumber] = useState('');
  const [valDate, setValDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [prevValuation, setPrevValuation] = useState<number>(0);
  const [currentValuation, setCurrentValuation] = useState<number>(0);
  const [retentionPct, setRetentionPct] = useState<number>(5.0);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(0);
  const [prevPayments, setPrevPayments] = useState<number>(0);
  const [status, setStatus] = useState<'Draft' | 'Certified' | 'Paid'>('Certified');

  useEffect(() => {
    if (isOpen && project?.id) {
      loadValuations();
    }
  }, [isOpen, project?.id]);

  const loadValuations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${project.id}/valuations`);
      const data = await res.json();
      if (data.valuations) {
        setValuations(data.valuations);
        const nextNum = (data.valuations.length || 0) + 1;
        setValNumber(`IPC-${String(nextNum).padStart(2, '0')}`);

        // Set previous valuation and payments from last certificate if exists
        if (Array.isArray(data.valuations) && data.valuations.length > 0) {
          const last = data.valuations[data.valuations.length - 1];
          setPrevValuation(last?.cumulative_value || 0);
          setPrevPayments(
            data.valuations.reduce((sum: number, v: ProjectValuation) => sum + (v?.amount_due || 0), 0)
          );
        }
      }
    } catch (err: any) {
      console.error('Failed to load valuations:', err);
    } finally {
      setLoading(false);
    }
  };

  const cumulativeValue = Number(prevValuation || 0) + Number(currentValuation || 0);
  const retentionAmount = cumulativeValue * (Number(retentionPct || 0) / 100);
  const calculatedDue = Math.max(0, cumulativeValue - retentionAmount - Number(advanceDeduction || 0) - Number(prevPayments || 0));

  const handleCreateValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentValuation || currentValuation <= 0) {
      alert('Please specify the value of work executed in this valuation period.');
      return;
    }

    try {
      setSaving(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${project.id}/valuations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          valuation_number: valNumber,
          valuation_date: valDate,
          description: description.trim() || `Interim Valuation for ${project.title}`,
          previous_valuation: Number(prevValuation),
          current_valuation: Number(currentValuation),
          retention_percent: Number(retentionPct),
          advance_payment_deduction: Number(advanceDeduction),
          previous_payments: Number(prevPayments),
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create valuation');

      setShowAddForm(false);
      setDescription('');
      setCurrentValuation(0);
      loadValuations();
    } catch (err: any) {
      alert('Error creating valuation: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (valuationId: string, newStatus: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/projects/${project.id}/valuations/${valuationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      setValuations(prev => prev.map(v => v.id === valuationId ? { ...v, status: newStatus as any } : v));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (valId: string) => {
    if (!window.confirm('Delete this interim valuation?')) return;
    try {
      await fetch(`/api/projects/${project.id}/valuations/${valId}`, { method: 'DELETE' });
      setValuations(prev => prev.filter(v => v.id !== valId));
      if (selectedCertificate?.id === valId) setSelectedCertificate(null);
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">Interim Valuations & Payment Certificates</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  NIQS / FIDIC Standard
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate professional interim valuations with automated 5% retention and advance payment recovery.
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
          
          {/* Certificate View Modal / Drawer if one is selected */}
          {selectedCertificate ? (
            <div className="border border-emerald-300 rounded-2xl p-6 bg-slate-50 relative shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Official Interim Payment Certificate
                  </span>
                  <h4 className="text-xl font-black text-slate-900 mt-2">
                    {selectedCertificate.valuation_number}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Date of Valuation: {selectedCertificate.valuation_date}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCertificate(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Certificate Details Sheet */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Project Name</span>
                    <span className="font-bold text-slate-800">{project.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Client / Employer</span>
                    <span className="font-bold text-slate-800">{project.client_name || 'Alhaji Ibrahim Bello'}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">1. Cumulative Value of Work Done Previously</span>
                    <span className="font-semibold text-slate-800">{formatNaira(selectedCertificate.previous_valuation)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">2. Value of Work Executed in Current Period</span>
                    <span className="font-semibold text-emerald-700">+{formatNaira(selectedCertificate.current_valuation)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200 font-bold bg-slate-50 px-2 rounded">
                    <span className="text-slate-800">3. Total Cumulative Gross Work Completed</span>
                    <span className="text-slate-900">{formatNaira(selectedCertificate.cumulative_value)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                    <span>4. Less: Retention Deduction ({selectedCertificate.retention_percent}%)</span>
                    <span className="font-semibold">-{formatNaira(selectedCertificate.retention_amount)}</span>
                  </div>
                  {selectedCertificate.advance_payment_deduction > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                      <span>5. Less: Advance Payment Recovery</span>
                      <span className="font-semibold">-{formatNaira(selectedCertificate.advance_payment_deduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>6. Less: Previous Cumulative Payments Certified</span>
                    <span className="font-semibold text-rose-700">-{formatNaira(selectedCertificate.previous_payments)}</span>
                  </div>
                  <div className="flex justify-between pt-3 pb-1 text-sm font-black text-emerald-900 bg-emerald-50 px-3 rounded-lg border border-emerald-200">
                    <span>NET AMOUNT CERTIFIED PAYABLE TO CONTRACTOR</span>
                    <span className="text-base text-emerald-700">{formatNaira(selectedCertificate.amount_due)}</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-bold text-slate-800">Quantity Surveyor</p>
                    <p className="text-[10px] text-slate-400">NIQS Reg. Certified Stamp</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-bold text-slate-800">Supervising Architect</p>
                    <p className="text-[10px] text-slate-400">Signature & Date</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-bold text-slate-800">Client / Employer</p>
                    <p className="text-[10px] text-slate-400">Approval for Payment</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Trigger / New Valuation Form */}
          {!showAddForm ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Generate Interim Payment Valuation
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Calculate cumulative work, apply 5% retention, and produce certifiable contractor valuations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Interim Certificate</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateValuation} className="p-5 rounded-xl bg-slate-50 border border-slate-300 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Issue Interim Valuation (IPC)
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
                    Certificate Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={valNumber}
                    onChange={(e) => setValNumber(e.target.value)}
                    placeholder="e.g. IPC-01"
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valuation Date
                  </label>
                  <input
                    type="date"
                    value={valDate}
                    onChange={(e) => setValDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Certified">Certified</option>
                    <option value="Draft">Draft</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valuation Description / Work Scope Covered
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Substructure excavation, raft foundation concrete casting, and ground floor blockwork to lintel."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              {/* Valuation Financial Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Previous Valuation (₦)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={prevValuation}
                    onChange={(e) => setPrevValuation(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">
                    Current Period Work (₦) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={currentValuation}
                    onChange={(e) => setCurrentValuation(Number(e.target.value))}
                    placeholder="e.g. 8500000"
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50/40 text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Retention % (Standard 5%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={retentionPct}
                    onChange={(e) => setRetentionPct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Payment Recovery (₦)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={advanceDeduction}
                    onChange={(e) => setAdvanceDeduction(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Calculated Summary Callout */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-emerald-900">
                  <span>Gross Cumulative: <strong className="font-bold">{formatNaira(cumulativeValue)}</strong></span>
                  <span className="mx-2">•</span>
                  <span>Retention ({retentionPct}%): <strong className="font-bold">-{formatNaira(retentionAmount)}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-600 block">Net Amount Due to Contractor:</span>
                  <span className="text-base font-black text-emerald-700">{formatNaira(calculatedDue)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
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
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
                >
                  {saving ? 'Issuing...' : 'Issue Payment Certificate'}
                </button>
              </div>
            </form>
          )}

          {/* Valuations Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Cert #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Current Work</th>
                    <th className="py-2.5 px-3 text-right">Cumulative</th>
                    <th className="py-2.5 px-3 text-right">Retention (5%)</th>
                    <th className="py-2.5 px-3 text-right">Amount Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        Loading valuations...
                      </td>
                    </tr>
                  ) : valuations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No interim valuations issued for this project yet.
                      </td>
                    </tr>
                  ) : (
                    valuations.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {v.valuation_number}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {v.valuation_date}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                          {formatNaira(v.current_valuation)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                          {formatNaira(v.cumulative_value)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-rose-600">
                          -{formatNaira(v.retention_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                          {formatNaira(v.amount_due)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <select
                            value={v.status}
                            onChange={(e) => handleStatusChange(v.id, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              v.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : v.status === 'Certified'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value="Certified">Certified</option>
                            <option value="Paid">Paid</option>
                            <option value="Draft">Draft</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCertificate(v)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                            >
                              View / Print
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(v.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete valuation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
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
