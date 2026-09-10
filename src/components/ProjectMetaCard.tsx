import React, { useState } from 'react';
import { Building2, MapPin, User, FileText, CheckCircle2, ChevronDown, ChevronUp, Calculator, Calendar, Phone, Percent } from 'lucide-react';
import { Project } from '../types';
import { formatNaira } from '../utils/format';

interface ProjectMetaCardProps {
  project: Project;
  onChange: (field: keyof Project, val: any) => void;
  grandTotal?: number;
}

const NIGERIAN_STATES = [
  'Lagos', 'Abuja FCT', 'Rivers', 'Ogun', 'Oyo', 'Enugu', 'Anambra', 
  'Delta', 'Edo', 'Kano', 'Kaduna', 'Akwa Ibom', 'Imo', 'Ondo', 'Abia'
];

export const ProjectMetaCard: React.FC<ProjectMetaCardProps> = ({ project, onChange, grandTotal = 0 }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Compute Cost / m2 GFA benchmark
  const gfa = Number(project.gfa || 0);
  const costPerSqm = gfa > 0 && grandTotal > 0 ? Math.round(grandTotal / gfa) : null;

  return (
    <div id="project-meta-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
            <Building2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Project Specification</h2>
            <p className="text-[11px] text-slate-500">Site location, client information, and benchmark parameters</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Version badge */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            {project.active_version || 'V1'}
          </span>

          {/* Status selector */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs font-semibold text-slate-500">Status:</label>
            <select
              id="project-status-select"
              value={project.status || 'Draft'}
              onChange={(e) => onChange('status', e.target.value)}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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

      {/* Primary 3-column input grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Project Title *
          </label>
          <input
            id="project-title-input"
            type="text"
            value={project.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="e.g. 4-Bedroom Duplex Lekki Phase 1"
            className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Project Location & State */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Site Location & State</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            <input
              id="project-location-input"
              type="text"
              value={project.location}
              onChange={(e) => onChange('location', e.target.value)}
              placeholder="e.g. Lekki Phase 1"
              className="col-span-3 px-3 py-2 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            <select
              value={project.state || 'Lagos'}
              onChange={(e) => onChange('state', e.target.value)}
              className="col-span-2 px-2 py-2 text-xs font-semibold text-slate-800 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Client Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Client / Employer</span>
          </label>
          <input
            id="project-client-input"
            type="text"
            value={project.client_name}
            onChange={(e) => onChange('client_name', e.target.value)}
            placeholder="e.g. Alhaji Ibrahim Bello"
            className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Advanced Specifications Accordion Toggle */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{showAdvanced ? 'Hide Technical Parameters & Markups' : 'Show GFA, Cost/m² Benchmark & Contract Allowances'}</span>
        </button>

        {costPerSqm && (
          <div className="text-xs font-semibold text-slate-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            Cost Benchmark: <span className="font-black text-emerald-800">{formatNaira(costPerSqm)} / m² GFA</span>
          </div>
        )}
      </div>

      {/* Advanced Technical Details */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          
          {/* Row 1: Building Parameters & GFA */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Building Type
              </label>
              <select
                value={project.project_type || 'Residential'}
                onChange={(e) => onChange('project_type', e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white"
              >
                <option value="Residential">Residential (Duplex/Flats)</option>
                <option value="Commercial">Commercial Office / Mall</option>
                <option value="Institutional">Institutional / School / Hospital</option>
                <option value="Industrial">Industrial / Warehouse</option>
                <option value="Mixed-Use">Mixed-Use Complex</option>
                <option value="Infrastructure">Civil Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gross Floor Area (GFA m²)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={project.gfa || ''}
                onChange={(e) => onChange('gfa', Number(e.target.value))}
                placeholder="e.g. 420"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Storeys
              </label>
              <select
                value={project.number_of_floors || 1}
                onChange={(e) => onChange('number_of_floors', Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value={1}>1 Storey (Bungalow)</option>
                <option value={2}>2 Storeys (Duplex / Ground + 1)</option>
                <option value={3}>3 Storeys (Ground + 2)</option>
                <option value={4}>4 Storeys (Ground + 3)</option>
                <option value={5}>5+ Storeys (High Rise)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client Contact / Phone
              </label>
              <input
                type="text"
                value={project.client_contact || ''}
                onChange={(e) => onChange('client_contact', e.target.value)}
                placeholder="+234 803 000 0000"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Row 2: Contract Allowances (Waste, Contingency, Inflation, Swamp Premium) */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-700" />
              <span>Nigerian Construction Allowances & Risk Provisions</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Material Waste %
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={project.waste_percent !== undefined ? project.waste_percent : 5.0}
                    onChange={(e) => onChange('waste_percent', Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 bg-white"
                  />
                  <span className="text-xs text-slate-500 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">BESMM4 standard: 5%</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Contingencies %
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={project.contingency_percent !== undefined ? project.contingency_percent : 5.0}
                    onChange={(e) => onChange('contingency_percent', Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 bg-white"
                  />
                  <span className="text-xs text-slate-500 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Unforeseen site risks</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Price Inflation / Fluctuation %
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={project.inflation_percent || 0}
                    onChange={(e) => onChange('inflation_percent', Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 bg-white"
                  />
                  <span className="text-xs text-slate-500 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Cement/rebar volatility</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Swamp Terrain Premium %
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={project.swamp_premium_percent || 0}
                    onChange={(e) => onChange('swamp_premium_percent', Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 bg-white"
                  />
                  <span className="text-xs text-slate-500 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Lekki/PH high water table</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
