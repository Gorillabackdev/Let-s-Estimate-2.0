import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  Globe, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  Mail,
  Download,
  CheckCircle,
  Loader2,
  FolderArchive
} from 'lucide-react';
import { AppGlobalView } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HelpSupportViewProps {
  onNavigate: (view: AppGlobalView) => void;
}

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [downloadingGuide, setDownloadingGuide] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const userEmail = user?.email || 'emmanuelisaac888@gmail.com';
  const userPhone = user?.phone || '';

  const handleDownloadGuide = async () => {
    try {
      setDownloadingGuide(true);
      const params = new URLSearchParams();
      if (userEmail) params.append('email', userEmail);
      if (userPhone) params.append('phone', userPhone);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/guide/pdf${queryString}`);
      if (!res.ok) throw new Error('Failed to download guide');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Lets_Estimate_2.0_User_Guide.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error downloading guide:', err);
      alert('Failed to download user guide. Please try again.');
    } finally {
      setDownloadingGuide(false);
    }
  };

  return (
    <div id="help-support-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Help, Standards &amp; Professional Practice Guide
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            BESMM4 measurement guidelines, AI Vision takeoff best practices, and official support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Project Source ZIP Button */}
          <button
            id="download-project-zip-btn"
            type="button"
            onClick={() => window.open('/api/download/project-zip', '_blank')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-2 shadow-xs transition active:scale-95 cursor-pointer"
            title="Download Complete Source Code (ZIP)"
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>Download Project (ZIP)</span>
          </button>

          {/* Download User Guide PDF Button */}
          <button
            id="download-user-guide-btn"
            type="button"
            onClick={handleDownloadGuide}
            disabled={downloadingGuide}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-2 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {downloadingGuide ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
            ) : downloadSuccess ? (
              <CheckCircle className="w-4 h-4 text-emerald-300" />
            ) : (
              <Download className="w-4 h-4 text-emerald-300" />
            )}
            <span>{downloadingGuide ? 'Generating PDF...' : downloadSuccess ? 'Downloaded!' : 'Download User Guide (PDF)'}</span>
          </button>

          {/* Section 2: Public Website Link in Help Menu */}
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 inline-flex items-center space-x-2 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Visit Public Website</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* New User Onboarding Highlight Box */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>New User Quick-Start Manual</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Comprehensive Field Guide &amp; BESMM4 Onboarding Manual
          </h2>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            Need a printed handbook for your team or site office? Download the official 3-page Let&apos;s Estimate 2.0 User Manual explaining AI takeoff steps, regional cost index multipliers (Lagos, Abuja, PH), Niger Delta swamp adjustments, and interim valuations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadGuide}
          disabled={downloadingGuide}
          className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-md transition active:scale-95 inline-flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          {downloadingGuide ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 text-slate-950" />
          )}
          <span>{downloadingGuide ? 'Building PDF...' : 'Get Official User Guide (PDF)'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: BESMM4 Measurement Reference */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>BESMM4 Standard Sections Reference</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Let&apos;s Estimate strictly organizes bills of quantities according to the Nigerian Institute of Quantity Surveyors (NIQS) BESMM4 fourth edition:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700">
            <li><strong>A. Preliminaries:</strong> Site setup, water, power, insurance &amp; contractor obligations.</li>
            <li><strong>B. Substructure:</strong> Site clearance, trench excavation, hardcore, DPM, foundation concrete &amp; sandcrete blockwork.</li>
            <li><strong>C. Reinforced Concrete Frame:</strong> Vibrated columns, lintels, suspended beams, high-yield rebar &amp; formwork.</li>
            <li><strong>D. Roofing &amp; Rainwater Goods:</strong> Aluminium longspan/stone-coated tiles, hardwood trusses, fascia &amp; gutters.</li>
            <li><strong>E. Finishes:</strong> Cement-sand plastering, screed, vitrified ceramic &amp; polished porcelain tiling.</li>
          </ul>
        </div>

        {/* Card 2: AI Takeoff Best Practices */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-amber-700 font-extrabold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Drawing Takeoff Guidelines</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            For maximum accuracy with the Gemini 2.5 Flash drawing analysis engine:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700">
            <li><strong>Scale Bar &amp; Dimensions:</strong> Ensure dimension strings and title block scales (e.g. 1:100) are legible.</li>
            <li><strong>Full Elevation &amp; Floor Plans:</strong> Upload ground and upper floor plans together with foundation trench sections.</li>
            <li><strong>Unlimited Extraction:</strong> Let&apos;s Estimate extracts all architectural elements dynamically without hardcoded limits.</li>
            <li><strong>Review Screen:</strong> Always verify detected quantities against the interactive review screen before finalizing rates.</li>
          </ul>
        </div>

        {/* Card 3: Construction Terminology Notice */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Contract Administration &amp; Payment Terms</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Standard construction contracts (JCT / FIDIC / Federal Ministry of Works) distinguish between:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700">
            <li><strong>Interim Payment Certificate (IPC):</strong> Progressive monthly payment certificate based on gross valuation minus retention and advance deductions.</li>
            <li><strong>Certificate of Practical Completion:</strong> Issued when the project is substantially completed and fit for occupation.</li>
            <li><strong>Certificate of Making Good Defects:</strong> Issued after the expiration of the Defects Liability Period (typically 6 months).</li>
            <li><strong>Final Payment Certificate:</strong> Concludes the contract sum after final account agreement.</li>
          </ul>
        </div>

        {/* Card 4: Support Contact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Technical Support &amp; Enquiries</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Need customized enterprise rates, multi-user license keys, or technical assistance with your drawings?
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Official Contact Email</span>
              <a href={`mailto:${userEmail}`} className="font-bold text-emerald-700 hover:underline">
                {userEmail}
              </a>
            </div>
            {userPhone ? (
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Hotline / WhatsApp</span>
                <span className="font-bold text-slate-900">{userPhone}</span>
              </div>
            ) : null}
            <div className="pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 block text-[11px] font-medium">Lead Consultant &amp; Practice</span>
              <span className="font-bold text-slate-900">{user?.full_name || 'Emmanuel Isaac, MNIQS'} • Estimate with Isaac</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Accreditation</span>
              <span className="font-semibold text-emerald-800">NIQS / BESMM4 Technical Standards Partner</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
