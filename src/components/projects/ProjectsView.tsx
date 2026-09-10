import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  User, 
  Calendar, 
  FolderKanban, 
  MoreVertical, 
  Copy, 
  Archive, 
  Trash2, 
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  HeartPulse,
  HeartHandshake
} from 'lucide-react';
import { Project } from '../../types';
import { formatNaira } from '../../utils/format';

interface ProjectsViewProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onDuplicateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
}

type ProjectFilterTab = 'all' | 'active' | 'draft' | 'completed' | 'archived';

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  loading,
  onOpenProject,
  onNewProject,
  onDuplicateProject,
  onDeleteProject,
  onArchiveProject,
}) => {
  const [activeTab, setActiveTab] = useState<ProjectFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    // Tab filter
    const status = (p.status || 'Draft').toLowerCase();
    if (activeTab === 'active' && (status === 'in progress' || status === 'submitted' || status === 'approved')) {
      // match
    } else if (activeTab === 'draft' && status === 'draft') {
      // match
    } else if (activeTab === 'completed' && status === 'approved') {
      // match
    } else if (activeTab === 'archived' && status === 'archived') {
      // match
    } else if (activeTab !== 'all') {
      return false;
    }

    // Type filter
    if (selectedType !== 'All') {
      const type = (p.project_type || '').toLowerCase();
      if (!type.includes(selectedType.toLowerCase())) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchLoc = (p.location || '').toLowerCase().includes(q);
      const matchClient = (p.client_name || '').toLowerCase().includes(q);
      const matchRef = (p.reference || '').toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchClient && !matchRef) return false;
    }

    return true;
  });

  const getCategoryIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('health') || t.includes('clinic') || t.includes('hospital')) {
      return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
    }
    if (t.includes('ngo') || t.includes('community') || t.includes('humanitarian')) {
      return <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />;
    }
    if (t.includes('road') || t.includes('drainage') || t.includes('civil') || t.includes('bridge')) {
      return <Layers className="w-3.5 h-3.5 text-blue-600" />;
    }
    return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
  };

  return (
    <div id="projects-centre-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of all quantity surveying estimates, cost control records, and project files.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {(['all', 'active', 'draft', 'completed', 'archived'] as ProjectFilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                activeTab === tab
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'all' ? `All Projects (${projects.length})` : tab}
            </button>
          ))}
        </div>

        {/* Search & Sector Type Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location, client, or contract reference..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by Sector / Project Type"
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-semibold cursor-pointer"
            >
              <option value="All">All Sectors &amp; Types</option>
              <option value="Residential">Residential Buildings</option>
              <option value="Commercial">Commercial &amp; Offices</option>
              <option value="Civil">Civil &amp; Infrastructure</option>
              <option value="Road">Roads &amp; Drainage</option>
              <option value="Healthcare">Healthcare / Clinics / Hospitals</option>
              <option value="Community">Community &amp; NGO / WASH</option>
            </select>
          </div>
        </div>

      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-slate-500">Loading project database...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No matching projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery 
              ? 'Try modifying your search or clearing active filters.' 
              : 'Create your first project to start generating estimates, takeoffs, and valuations.'}
          </p>
          <button
            type="button"
            onClick={onNewProject}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const itemCount = (project.items || []).length;
            const progress = project.status === 'Approved' ? 100 : project.status === 'Submitted' ? 75 : project.status === 'In Progress' ? 50 : 25;

            return (
              <div
                key={project.id}
                className="bg-white hover:bg-slate-50/70 rounded-2xl border border-slate-200 p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between relative group"
              >
                <div>
                  {/* Card Header: Type Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {getCategoryIcon(project.project_type)}
                      <span>{project.project_type || 'Building'}</span>
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'Approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : project.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {project.status || 'Draft'}
                    </span>
                  </div>

                  {/* Title & Ref */}
                  <h2 
                    onClick={() => onOpenProject(project.id)}
                    className="text-base font-bold text-slate-900 line-clamp-1 hover:text-emerald-800 cursor-pointer transition"
                    title={project.title}
                  >
                    {project.title}
                  </h2>
                  {project.reference && (
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      REF: {project.reference}
                    </span>
                  )}

                  {/* Metadata: Location, Client, Contractor */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.location || 'Nigeria'}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.client_name || 'Private Client'}</span>
                    </div>

                    {project.contractor && (
                      <div className="flex items-center space-x-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Contractor: {project.contractor}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Estimating Progress</span>
                      <span className="font-bold text-slate-700">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Contract Sum / Estimate
                    </span>
                    <span className="text-base font-extrabold text-emerald-800">
                      {formatNaira(project.grand_total)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onOpenProject(project.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center space-x-1"
                    >
                      <span>Workspace</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
