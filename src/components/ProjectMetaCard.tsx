import React from 'react';
import { Building2, MapPin, User, FileText } from 'lucide-react';
import { Project } from '../types';

interface ProjectMetaCardProps {
  project: Project;
  onChange: (field: keyof Project, val: any) => void;
}

export const ProjectMetaCard: React.FC<ProjectMetaCardProps> = ({ project, onChange }) => {
  return (
    <div id="project-meta-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Building2 className="w-5 h-5 text-emerald-700" />
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Project Details</h2>
      </div>

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

        {/* Project Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Site Location</span>
          </label>
          <input
            id="project-location-input"
            type="text"
            value={project.location}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder="e.g. Port Harcourt, Rivers State"
            className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
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
    </div>
  );
};
