import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Plus, 
  MapPin, 
  User, 
  Briefcase, 
  Layers, 
  Percent, 
  Droplets,
  DollarSign,
  Calendar,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { Project } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Partial<Project>) => Promise<void> | void;
}

const NIGERIAN_STATES = [
  'Lagos', 'Abuja FCT', 'Rivers', 'Oyo', 'Kano', 'Kaduna', 
  'Edo', 'Delta', 'Anambra', 'Enugu', 'Ogun', 'Ondo', 'Akwa Ibom', 'Cross River', 'Imo', 'Abia'
];

const PROJECT_TYPES = [
  'Residential', 'Commercial', 'Industrial', 'Civil / Infrastructure',
  'Institutional / Public', 'Educational', 'Healthcare', 'Hospitality'
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [contractor, setContractor] = useState('');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [state, setState] = useState('Lagos');
  const [projectType, setProjectType] = useState('Residential');
  const [numberOfFloors, setNumberOfFloors] = useState<number>(2);
  const [gfa, setGfa] = useState<number>(350);
  const [isSwampTerrain, setIsSwampTerrain] = useState(false);
  const [swampPremiumPercent, setSwampPremiumPercent] = useState<number>(10);
  const [poPercent, setPoPercent] = useState<number>(15);
  const [contingencyPercent, setContingencyPercent] = useState<number>(5);
  const [vatPercent, setVatPercent] = useState<number>(7.5);
  const [targetBudget, setTargetBudget] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a project title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const newProjData: Partial<Project> = {
        title: title.trim(),
        client_name: clientName.trim(),
        contractor: contractor.trim(),
        location: location.trim(),
        state,
        project_type: projectType,
        number_of_floors: Number(numberOfFloors) || 1,
        gfa: Number(gfa) || 0,
        swamp_premium_percent: isSwampTerrain ? Number(swampPremiumPercent) : 0,
        po_percent: Number(poPercent) || 15,
        contingency_percent: Number(contingencyPercent) || 5,
        vat_percent: Number(vatPercent) || 7.5,
        subtotal: Number(targetBudget) > 0 ? Number(targetBudget) : 0,
        grand_total: Number(targetBudget) > 0 ? Number(targetBudget) : 0,
        description: description.trim(),
        status: 'Draft',
        items: []
      };

      await onCreateProject(newProjData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Create New Project
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up a new construction estimate, configure location, budget parameters, and contract standards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Basic Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 4-Bedroom Luxury Duplex Lekki Phase 1"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client / Employer Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Chevron Staff Cooperative / Private Client"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Main Contractor (Optional)
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    placeholder="e.g. Julius Berger / Cappa & D'Alberto"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lekki, Lagos"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Economic Region / State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-semibold"
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Typology
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-semibold"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Physical & Budget Parameters */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Scale &amp; Cost Markup Parameters</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Floors</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numberOfFloors}
                  onChange={(e) => setNumberOfFloors(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">GFA (m²)</label>
                <input
                  type="number"
                  min="10"
                  value={gfa}
                  onChange={(e) => setGfa(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">P&amp;O Markup (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={poPercent}
                  onChange={(e) => setPoPercent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contingency (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="30"
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Target Budget & Swamp Terrain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Target Budget / Baseline Sum (₦ Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={targetBudget || ''}
                    onChange={(e) => setTargetBudget(Number(e.target.value))}
                    placeholder="e.g. 85000000"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Swamp / Delta Terrain</span>
                    <span className="text-[10px] text-slate-500">Applies foundation piling/raft allowance</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSwampTerrain}
                    onChange={(e) => setIsSwampTerrain(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Description / Scope Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of works, scope of architectural drawings, or specific client directives..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Project...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
