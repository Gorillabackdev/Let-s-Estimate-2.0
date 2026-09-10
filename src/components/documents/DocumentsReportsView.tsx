import React, { useState } from 'react';
import { 
  Files, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  ShieldCheck, 
  FolderKanban, 
  Search, 
  Filter,
  ExternalLink,
  Award
} from 'lucide-react';
import { Project } from '../../types';
import { formatNaira } from '../../utils/format';

interface DocumentsReportsViewProps {
  projects: Project[];
  activeProject?: Project | null;
  onOpenDossier: () => void;
  onExportExcel: () => void;
}

export const DocumentsReportsView: React.FC<DocumentsReportsViewProps> = ({
  projects,
  activeProject,
  onOpenDossier,
  onExportExcel,
}) => {
  const [filterType, setFilterType] = useState('All');

  const sampleReports = [
    {
      title: 'Executive QS Project Dossier & Audit Pack',
      category: 'Dossier',
      format: 'PDF / Audit Report',
      project: activeProject?.title || 'Federal Ministry Highway / Residential',
      date: 'March 2026',
      action: onOpenDossier,
      actionLabel: 'Generate Dossier'
    },
    {
      title: 'Official BESMM4 Bill of Quantities (Priced Tender)',
      category: 'BOQ',
      format: 'Excel (.xlsx)',
      project: activeProject?.title || 'Active Project BOQ',
      date: 'March 2026',
      action: onExportExcel,
      actionLabel: 'Download Excel'
    },
    {
      title: 'Interim Payment Certificate (IPC 002)',
      category: 'Certificate',
      format: 'PDF Printable',
      project: activeProject?.title || 'Active Project',
      date: 'March 2026',
      action: () => window.print(),
      actionLabel: 'Print Certificate'
    },
    {
      title: 'Contract Variation Summary Schedule',
      category: 'Variation',
      format: 'PDF',
      project: activeProject?.title || 'Active Project',
      date: 'March 2026',
      action: onExportExcel,
      actionLabel: 'Export Schedule'
    }
  ];

  return (
    <div id="documents-reports-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Documents &amp; Reports Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export formal QS dossiers, priced tender bills, interim certificates, and contract audit packs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenDossier}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-2 shadow-2xs"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Executive QS Dossier</span>
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sampleReports.map((report, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {report.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {report.format}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-1">
                {report.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Project: <strong className="text-slate-700">{report.project}</strong>
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Generated: {report.date}</span>
              <button
                type="button"
                onClick={report.action}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{report.actionLabel}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
