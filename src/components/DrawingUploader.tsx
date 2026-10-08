import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Cpu,
  Sliders,
  Building,
  Check,
  RotateCcw,
  Ruler,
  AlertTriangle,
  ArrowRight,
  Calculator,
  ShieldAlert
} from 'lucide-react';
import { ProjectQuestionnaire } from '../types';
import { safeFetchJson } from '../utils/api';

interface DrawingUploaderProps {
  onTakeoffSuccess: (items: any[], filename: string, provider: string, summary?: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  questionnaire?: ProjectQuestionnaire;
  onOpenQuestionnaire?: () => void;
  onOpenManualTakeoff?: () => void;
  onOpenBtlEstimator?: () => void;
}

export const DrawingUploader: React.FC<DrawingUploaderProps> = ({
  onTakeoffSuccess,
  isProcessing,
  setIsProcessing,
  questionnaire,
  onOpenQuestionnaire,
  onOpenManualTakeoff,
  onOpenBtlEstimator,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisFailure, setAnalysisFailure] = useState<{
    title: string;
    reason: string;
    recommendation: string;
  } | null>(null);
  const [takeoffProgressText, setTakeoffProgressText] = useState('Initializing Gemini Vision...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setAnalysisFailure(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const hasValidExt = file.name.match(/\.(jpg|jpeg|png|pdf)$/i);

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setErrorMsg('Invalid file format. Please upload an architectural drawing in .jpg, .png, or .pdf format.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File is too large (max 25MB).');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // PDF icon representation
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAndRunTakeoff = async () => {
    if (!selectedFile) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setTakeoffProgressText('Uploading drawing and analyzing authentic linework with Gemini Vision...');

    try {
      const formData = new FormData();
      formData.append('drawing', selectedFile);

      if (questionnaire) {
        formData.append('questionnaire', JSON.stringify(questionnaire));
      }

      // Simulation of progress status for better UX
      const timer = setTimeout(() => {
        setTakeoffProgressText('Gemini measuring Substructure, Masonry, Concrete, Roofing, Finishes & Services...');
      }, 1500);

      const { ok, data, error } = await safeFetchJson<{ items: any[]; provider: string; drawingSummary?: string; error?: string }>('/api/takeoff', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timer);

      if (!ok || !data?.items || data.items.length === 0) {
        throw new Error(data?.error || error || 'AI could not confidently measure this drawing.');
      }

      setAnalysisFailure(null);
      onTakeoffSuccess(data.items, selectedFile.name, data.provider, data.drawingSummary);
    } catch (err: any) {
      const isResolutionIssue = (err?.message || '').toLowerCase().includes('resolution') ||
                                (err?.message || '').toLowerCase().includes('scanned') ||
                                (err?.message || '').toLowerCase().includes('scale');
      setAnalysisFailure({
        title: isResolutionIssue ? 'Drawing analysis failed.' : 'AI could not confidently measure this drawing.',
        reason: isResolutionIssue 
          ? 'PDF contains scanned pages with insufficient resolution or unscaled details.'
          : 'Drawing layout lacks legible dimensional gridlines, high contrast scale, or readable room dimensions.',
        recommendation: 'Upload a higher-resolution drawing or use Smart Takeoff Studio to calibrate scale and verify dimensions.',
      });
      setErrorMsg(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="drawing-uploader-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Architectural Drawing & Pre-Estimation Setup
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accepts floor plans, elevations, sections (.jpg, .png, .pdf). Gemini Vision extracts all trades matching your questionnaire specs.
          </p>
        </div>

        {/* AI Engine Badge */}
        <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto text-xs font-semibold text-emerald-800">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>Dynamic BESMM4 Vision Engine</span>
        </div>
      </div>

      {/* Top Advisory Note & Prominent Specifications Questionnaire */}
      <div className="mb-5 rounded-xl bg-slate-50 border border-slate-200 p-3.5 sm:p-4 text-xs space-y-3">
        {/* Note / Tip Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-slate-600 leading-relaxed text-xs">
              <span className="font-bold text-slate-800">Note:</span> AI-generated BOQs are preliminary and depend on details provided in the questionnaire. Please review your BOQ, and use the <span className="font-semibold text-emerald-800">BTL Estimator</span> for even better and more accurate results.
            </p>
          </div>
          {onOpenBtlEstimator && (
            <button
              type="button"
              onClick={onOpenBtlEstimator}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition cursor-pointer flex items-center space-x-1"
            >
              <span>Try BTL Estimator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Prominent Questionnaire Access Bar */}
        <div className="pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white/60 p-2.5 rounded-lg border border-slate-200/60">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Project Specs Questionnaire:</span>
                <span className="text-emerald-700 font-semibold">
                  {questionnaire?.general?.buildingType || 'Standard Building'} ({questionnaire?.general?.numberOfFloors || 1} Floor)
                </span>
              </div>
              <p className="text-slate-500 truncate max-w-md mt-0.5 text-[11px]">
                {questionnaire?.substructure?.foundationType || 'Strip foundation'} • {questionnaire?.superstructure?.structuralSystem || 'Load-bearing masonry'} • {questionnaire?.roofing?.roofType || 'Timber roof'}
              </p>
            </div>
          </div>

          {onOpenQuestionnaire && (
            <button
              type="button"
              onClick={onOpenQuestionnaire}
              className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shrink-0 shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{questionnaire ? 'Review / Edit Specs Questionnaire' : 'Open Questionnaire'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="drawing-file-input"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />

      {/* Drag & Drop Zone */}
      <div
        id="drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!selectedFile) fileInputRef.current?.click();
        }}
        className={`relative rounded-xl border-2 border-dashed transition p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50/60'
            : selectedFile
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
        }`}
      >
        {selectedFile ? (
          <div className="w-full flex flex-col items-center">
            {previewUrl ? (
              <div className="relative mb-3 max-h-56 max-w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
                <img
                  src={previewUrl}
                  alt="Blueprint Preview"
                  className="max-h-56 object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mb-3 p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center space-x-2">
                <FileText className="w-8 h-8" />
                <span className="font-semibold text-sm">{selectedFile.name} (PDF Document)</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            
            <p className="text-xs text-slate-400 mt-1">Ready for measurement. Click below to analyze.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Drag & drop architectural blueprint here, or <span className="text-emerald-700 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPEG, PNG, WEBP, and PDF floor plans up to 25MB
            </p>
          </div>
        )}
      </div>

      {/* PART 48 & 49: Structured Error Handling & AI Failure Fallback */}
      {analysisFailure && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-slate-800 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-800" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-amber-950">
                {analysisFailure.title}
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold">Possible reason:</strong> {analysisFailure.reason}
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold">Recommended action:</strong> {analysisFailure.recommendation}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-amber-200">
            <button
              type="button"
              onClick={() => {
                setAnalysisFailure(null);
                handleUploadAndRunTakeoff();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs transition inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
            {onOpenManualTakeoff && (
              <button
                type="button"
                onClick={() => {
                  onOpenManualTakeoff();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Smart Takeoff</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Supported Formats:</span>
          <span>Architectural PDF, High-Res PNG, JPEG, WEBP plans</span>
        </div>

        {/* Execute Button */}
        <div className="w-full sm:w-auto flex items-center space-x-3">
          {selectedFile && (
            <>
              <button
                type="button"
                onClick={handleClear}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
              >
                Clear
              </button>

              {onOpenManualTakeoff && (
                <button
                  type="button"
                  onClick={onOpenManualTakeoff}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer"
                >
                  Open in Drawing Viewer
                </button>
              )}
            </>
          )}

          <button
            type="button"
            id="run-takeoff-button"
            onClick={handleUploadAndRunTakeoff}
            disabled={!selectedFile || isProcessing}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition ${
              !selectedFile || isProcessing
                ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">{takeoffProgressText}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Takeoff</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

