import React, { useState, useEffect } from 'react';
import { History, Plus, RotateCcw, Trash2, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { EstimateVersion, Project } from '../types';
import { formatNaira } from '../utils/format';

interface EstimateVersionsModalProps {
  projectId: string;
  activeVersion?: string;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (restoredProject: Project) => void;
  token?: string | null;
  currentProject?: Project | null;
}

export const EstimateVersionsModal: React.FC<EstimateVersionsModalProps> = ({
  projectId,
  activeVersion = 'V1',
  isOpen,
  onClose,
  onRestoreVersion,
  token,
  currentProject
}) => {
  const [versions, setVersions] = useState<EstimateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [description, setDescription] = useState('');
  const [versionStatus, setVersionStatus] = useState<'Initial Draft' | 'Client Revision' | 'Tender Issue' | 'Approved Contract'>('Client Revision');
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [comparingVersion, setComparingVersion] = useState<EstimateVersion | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadVersions();
      setVersionName(`V${versions.length + 2} - Revision`);
    }
  }, [isOpen, projectId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/versions`);
      const data = await res.json();
      if (data.versions) {
        setVersions(data.versions);
        const nextNum = (data.versions.length || 0) + 1;
        setVersionName(`V${nextNum} - Revision`);
      }
    } catch (err: any) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName.trim()) return;

    try {
      setSaving(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          version_name: versionName.trim(),
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create version');

      setStatusMsg({ text: `Version snapshot "${versionName}" saved!`, type: 'success' });
      setShowCreateForm(false);
      setDescription('');
      loadVersions();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error creating snapshot', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (version: EstimateVersion) => {
    const confirmRestore = window.confirm(
      `Are you sure you want to restore "${version.version_name}"?\nThis will revert your current BOQ items and financial totals to this snapshot (Grand Total: ${formatNaira(version.grand_total)}).`
    );
    if (!confirmRestore) return;

    try {
      setRestoringId(version.id);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${projectId}/versions/${version.id}/restore`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore');

      setStatusMsg({ text: `Restored to ${version.version_name}!`, type: 'success' });
      onRestoreVersion(data.project);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      alert('Failed to restore version: ' + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (versionId: string, name: string) => {
    if (!window.confirm(`Delete version snapshot "${name}"?`)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setVersions(prev => prev.filter(v => v.id !== versionId));
        setStatusMsg({ text: `Deleted ${name}`, type: 'success' });
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">Estimate Version History</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Active: {activeVersion}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Save version snapshots (e.g. V1, V2, V3) and revert to any revision anytime.
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
          
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* New Snapshot Trigger / Form */}
          {!showCreateForm ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Save Current BOQ as a New Version
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Creates an immutable point-in-time snapshot of your quantities, rates, and totals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Snapshot</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateSnapshot} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Create Version Snapshot
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Version Name *
                </label>
                <input
                  type="text"
                  required
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g. V2 - Post-Tender Review"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Notes (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Updated blockwork rates to ₦14,500 and adjusted slab volume."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Snapshot'}
                </button>
              </div>
            </form>
          )}

          {/* Versions List */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Saved Revisions ({versions.length})
            </h4>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Loading version history...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No previous versions saved yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click "New Snapshot" above to save your first milestone estimate version.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver) => {
                  const isActive = ver.version_name === activeVersion;
                  return (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-400/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">
                            {ver.version_name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                              Active Workspace
                            </span>
                          )}
                        </div>

                        {ver.description && (
                          <p className="text-xs text-slate-600">
                            {ver.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-semibold text-emerald-800">
                            Total: {formatNaira(ver.grand_total)}
                          </span>
                          <span>•</span>
                          <span>{ver.items_count || 0} BOQ items</span>
                          <span>•</span>
                          <span>
                            {new Date(ver.created_at).toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setComparingVersion(ver)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Compare with active workspace"
                        >
                          <History className="w-3.5 h-3.5 text-slate-500" />
                          <span>Compare</span>
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleRestore(ver)}
                            disabled={restoringId === ver.id}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition"
                            title="Revert project to this version"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{restoringId === ver.id ? 'Restoring...' : 'Restore'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(ver.id, ver.version_name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete version snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compare Modal / Drawer */}
          {comparingVersion && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 animate-fade-in shadow-xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold">
                    Version Comparison: Current Workspace vs {comparingVersion.version_name}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setComparingVersion(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Close Comparison
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Active Workspace
                  </span>
                  <div className="text-lg font-black text-white">
                    {formatNaira(currentProject?.grand_total || 0)}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {(currentProject?.items || []).length} BOQ items in live session
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Snapshot: {comparingVersion.version_name}
                  </span>
                  <div className="text-lg font-black text-white">
                    {formatNaira(comparingVersion.grand_total)}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {comparingVersion.items_count || 0} BOQ items saved
                  </div>
                </div>
              </div>

              {/* Variance Analysis */}
              {(() => {
                const currentTotal = currentProject?.grand_total || 0;
                const diff = currentTotal - comparingVersion.grand_total;
                const percentDiff = comparingVersion.grand_total > 0 
                  ? ((diff / comparingVersion.grand_total) * 100).toFixed(1) 
                  : '0.0';
                return (
                  <div className="p-3 bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Total Variance: </span>
                      <span className={`font-bold ${diff > 0 ? 'text-rose-400' : diff < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {diff > 0 ? `+${formatNaira(diff)} (+${percentDiff}%)` : diff < 0 ? `${formatNaira(diff)} (${percentDiff}%)` : '₦0.00 (No change)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const v = comparingVersion;
                        setComparingVersion(null);
                        handleRestore(v);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      Restore This Version
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
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
