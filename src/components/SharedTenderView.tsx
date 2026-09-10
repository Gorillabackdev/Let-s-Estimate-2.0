import React, { useState, useEffect } from 'react';
import { Project, BoqItem } from '../types';
import { formatNaira } from '../utils/format';
import { 
  Building2, MapPin, HardHat, FileSpreadsheet, Printer, Download, 
  ShieldCheck, CheckCircle2, Lock, AlertCircle, Calendar
} from 'lucide-react';

interface SharedTenderViewProps {
  shareToken: string;
  onBackToApp?: () => void;
}

export const SharedTenderView: React.FC<SharedTenderViewProps> = ({
  shareToken,
  onBackToApp,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [passcodeRequired, setPasscodeRequired] = useState(false);

  useEffect(() => {
    fetchSharedProject();
  }, [shareToken]);

  const fetchSharedProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/${shareToken}`);
      const data = await res.json();
      if (res.ok && data.project) {
        setProject(data.project);
      } else {
        setError(data.error || 'Project not found or link has expired.');
      }
    } catch (err: any) {
      setError('Unable to load shared estimate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center shadow-lg animate-pulse mb-4">
          <HardHat className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Loading Client Tender Document...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted or Expired</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'This shared estimate link is inactive or no longer valid. Please contact the Quantity Surveyor.'}
          </p>
          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-xs shadow-sm transition"
            >
              Back to Let's Estimate
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Top Header */}
      <header className="bg-emerald-900 text-white shadow-md border-b border-emerald-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-white block">
                Let's Estimate
              </span>
              <span className="text-[10px] text-emerald-200 block">
                Client Tender & Bill of Quantities Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold shadow-xs transition"
              >
                App Workspace
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Tender Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Official Bill of Quantities (BOQ)
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {project.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                {project.client_name && (
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">Client:</span> {project.client_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{project.location || 'Nigeria'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date().toLocaleDateString('en-GB')}</span>
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Tender Sum</span>
              <div className="text-2xl font-bold font-mono text-emerald-950">
                {formatNaira(project.grand_total)}
              </div>
              <span className="text-[10px] text-emerald-800 font-medium">Includes 7.5% VAT & Contingency</span>
            </div>
          </div>

          {/* Project Summary Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Building Type</span>
              <span className="font-semibold text-slate-800">{project.project_type || 'Residential'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Floor Area (GFA)</span>
              <span className="font-semibold text-slate-800">{project.gfa ? `${project.gfa} m²` : 'Measured from Plans'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pricing Standard</span>
              <span className="font-semibold text-slate-800">NIQS / BESMM4 Standard</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tender Currency</span>
              <span className="font-semibold text-slate-800">Nigerian Naira (₦)</span>
            </div>
          </div>
        </div>

        {/* BOQ Items Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">Measured Works Schedule</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium font-mono">
              {project.items?.length || 0} Measured Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-12 text-center">Item</th>
                  <th className="py-3 px-3">Trade / Description</th>
                  <th className="py-3 px-2 text-center w-16">Unit</th>
                  <th className="py-3 px-3 text-right w-24">Quantity</th>
                  <th className="py-3 px-3 text-right w-32">Unit Rate (₦)</th>
                  <th className="py-3 px-3 text-right w-36">Total Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {project.items && project.items.length > 0 ? (
                  project.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{item.item}</div>
                        <div className="text-[11px] text-slate-500 max-w-xl">{item.description}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium text-slate-700">{item.unit}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800">{item.qty?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">{formatNaira(item.rate)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatNaira(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No items in this BOQ schedule.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Grand Summary Section */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Certified Quantity Surveying Estimate</span>
              </div>
              <p>Generated via Let's Estimate SaaS for Nigerian Construction Professionals.</p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Measured Works:</span>
                <span className="font-mono font-medium text-slate-900">{formatNaira(project.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Profit & Overheads ({project.po_percent || 15}%):</span>
                <span className="font-mono text-slate-900">{formatNaira(project.po_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Value Added Tax (7.5% VAT):</span>
                <span className="font-mono text-slate-900">{formatNaira(project.vat_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-300 text-sm">
                <span>GRAND TENDER TOTAL:</span>
                <span className="font-mono text-emerald-900">{formatNaira(project.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Let's Estimate - Nigerian Quantity Surveying & BOQ Platform</span>
          <span className="text-slate-400">NIQS / BESMM4 Standard Compliant</span>
        </div>
      </footer>
    </div>
  );
};
