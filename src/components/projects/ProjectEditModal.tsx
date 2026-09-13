import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  Save, 
  MapPin, 
  User, 
  Briefcase, 
  Hash, 
  Phone, 
  FileText, 
  Layers, 
  Percent, 
  ShieldAlert, 
  CheckCircle2, 
  Droplets,
  HelpCircle
} from 'lucide-react';
import { Project } from '../../types';

interface ProjectEditModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Partial<Project>) => Promise<void> | void;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    client_contact: '',
    reference: '',
    location: '',
    state: 'Lagos',
    project_type: 'Residential',
    contractor: '',
    status: 'In Progress',
    gfa: 350,
    number_of_floors: 2,
    is_swamp_terrain: false,
    swamp_premium_percent: 15,
    po_percent: 15,
    vat_percent: 7.5,
    description: '',
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        client_name: project.client_name || '',
        client_contact: project.client_contact || '',
        reference: project.reference || '',
        location: project.location || '',
        state: project.state || 'Lagos',
        project_type: project.project_type || 'Residential',
        contractor: project.contractor || '',
        status: project.status || 'In Progress',
        gfa: project.gfa || 350,
        number_of_floors: project.number_of_floors || 2,
        is_swamp_terrain: (project.swamp_premium_percent || 0) > 0,
        swamp_premium_percent: project.swamp_premium_percent || 15,
        po_percent: project.po_percent ?? 15,
        vat_percent: project.vat_percent ?? 7.5,
        description: project.description || '',
        notes: project.notes || '',
      });
      setErrorMessage(null);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMessage('Project title is required.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const finalSwamp = formData.is_swamp_terrain ? Number(formData.swamp_premium_percent || 15) : 0;

      await onSave({
        id: project.id,
        title: formData.title.trim(),
        client_name: formData.client_name.trim(),
        client_contact: formData.client_contact.trim(),
        reference: formData.reference.trim(),
        location: formData.location.trim(),
        state: formData.state.trim(),
        project_type: formData.project_type,
        contractor: formData.contractor.trim(),
        status: formData.status as any,
        gfa: Number(formData.gfa) || 0,
        number_of_floors: Number(formData.number_of_floors) || 1,
        swamp_premium_percent: finalSwamp,
        po_percent: Number(formData.po_percent) || 0,
        vat_percent: Number(formData.vat_percent) || 0,
        description: formData.description.trim(),
        notes: formData.notes.trim(),
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update project details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Project Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update contract metadata, client details, location, and statutory markups.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Proposed 4-Bedroom Duplex with Gatehouse"
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contract / Ref #
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="e.g. REF-2026-001"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Sector / Type
                </label>
                <select
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white cursor-pointer"
                >
                  <option value="Residential">Residential Buildings</option>
                  <option value="Commercial">Commercial &amp; Offices</option>
                  <option value="Civil">Civil &amp; Infrastructure</option>
                  <option value="Road">Roads &amp; Drainage</option>
                  <option value="Healthcare">Healthcare &amp; Clinics</option>
                  <option value="Educational">Educational &amp; Schools</option>
                  <option value="Community">Community &amp; NGO / WASH</option>
                  <option value="Industrial">Industrial &amp; Warehousing</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white cursor-pointer"
                >
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Client & Contractor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Name / Employer
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="e.g. Chief Dr. T. A. Adeleke"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Contact (Phone / Email)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.client_contact}
                  onChange={(e) => setFormData({ ...formData, client_contact: e.target.value })}
                  placeholder="e.g. +234 803 456 7890"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Site Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contractor / Builder (Optional)
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.contractor}
                  onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                  placeholder="e.g. Julius Berger / Direct Labour"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Physical Geometry & Terrain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gross Floor Area (m²)
              </label>
              <input
                type="number"
                min="10"
                step="1"
                value={formData.gfa}
                onChange={(e) => setFormData({ ...formData, gfa: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Number of Storeys
              </label>
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={formData.number_of_floors}
                onChange={(e) => setFormData({ ...formData, number_of_floors: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                P&amp;O Markup (%)
              </label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.po_percent}
                  onChange={(e) => setFormData({ ...formData, po_percent: Number(e.target.value) || 0 })}
                  className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Swamp Terrain & VAT Settings */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_swamp_terrain}
                  onChange={(e) => setFormData({ ...formData, is_swamp_terrain: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span className="flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Swamp / Waterlogged Ground Terrain (Riverine Surcharge)</span>
                </span>
              </label>

              {formData.is_swamp_terrain && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-semibold text-slate-600">Surcharge:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={formData.swamp_premium_percent}
                    onChange={(e) => setFormData({ ...formData, swamp_premium_percent: Number(e.target.value) || 15 })}
                    className="w-16 px-2 py-1 text-xs font-bold text-slate-900 bg-white rounded-lg border border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">%</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">Nigerian Statutory VAT:</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={formData.vat_percent}
                  onChange={(e) => setFormData({ ...formData, vat_percent: Number(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-xs font-bold text-slate-900 bg-white rounded-lg border border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">%</span>
              </div>
            </div>
          </div>

          {/* Section 4: Notes / Scope */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project Description / Scope of Work Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of structural system, specifications, or employer requirements..."
              className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.title.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs inline-flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Details...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Project Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
