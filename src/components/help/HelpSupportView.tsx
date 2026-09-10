import React from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  Globe, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  Mail
} from 'lucide-react';
import { AppGlobalView } from '../../types';

interface HelpSupportViewProps {
  onNavigate: (view: AppGlobalView) => void;
}

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({ onNavigate }) => {
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
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div><strong>Email:</strong> support@estimate.ng</div>
            <div><strong>Hotline / WhatsApp:</strong> +234 815 151 2100</div>
            <div><strong>Accreditation:</strong> NIQS / BESMM4 Technical Standards Partner</div>
          </div>
        </div>

      </div>

    </div>
  );
};
