import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Save, Check, Loader2 } from 'lucide-react';
import { Project, BoqItem } from '../types';

interface ExportActionsProps {
  project: Project;
  items: BoqItem[];
  onSaveProject: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  project,
  items,
  onSaveProject,
  isSaving,
  hasUnsavedChanges,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setExportFeedback(msg);
    setTimeout(() => setExportFeedback(null), 4000);
  };

  const handleExportExcel = async () => {
    if (items.length === 0) {
      alert('Please add or detect at least one BOQ item before exporting.');
      return;
    }

    setIsExportingExcel(true);
    try {
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.title,
          location: project.location,
          clientName: project.client_name,
          poPercent: project.po_percent,
          vatPercent: project.vat_percent,
          swampPremiumPercent: project.swamp_premium_percent,
          items: items,
        }),
      });

      if (!response.ok) throw new Error('Excel export failed.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (project.title || 'BOQ_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showFeedback('Excel spreadsheet downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (items.length === 0) {
      alert('Please add or detect at least one BOQ item before exporting.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.title,
          location: project.location,
          clientName: project.client_name,
          poPercent: project.po_percent,
          vatPercent: project.vat_percent,
          swampPremiumPercent: project.swamp_premium_percent,
          items: items,
        }),
      });

      if (!response.ok) throw new Error('PDF export failed.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (project.title || 'BOQ_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showFeedback('PDF Bill of Quantities downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to export PDF document. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div id="export-actions-bar" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Left Status & Feedback */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              4
            </span>
            <h3 className="font-bold text-slate-900 text-base">
              Save & Export Bill of Quantities
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Export ready-to-print documents with official Nigerian contractor header or store in SQLite database.
          </p>
          {exportFeedback && (
            <p className="text-xs font-semibold text-emerald-700 flex items-center space-x-1 animate-fade-in pt-1">
              <Check className="w-3.5 h-3.5" />
              <span>{exportFeedback}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Save to SQLite */}
          <button
            id="save-project-btn"
            type="button"
            disabled={isSaving}
            onClick={onSaveProject}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border shadow-sm ${
              hasUnsavedChanges
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Project to SQLite' : 'Saved in SQLite'}</span>
          </button>

          {/* Export Excel (.xlsx) */}
          <button
            id="export-excel-btn"
            type="button"
            disabled={isExportingExcel}
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {isExportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            )}
            <span>Export Excel</span>
          </button>

          {/* Export PDF (.pdf) */}
          <button
            id="export-pdf-btn"
            type="button"
            disabled={isExportingPdf}
            onClick={handleExportPdf}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-700 hover:bg-rose-800 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-200" />
            ) : (
              <FileText className="w-4 h-4 text-rose-200" />
            )}
            <span>Export PDF</span>
          </button>

        </div>

      </div>
    </div>
  );
};
