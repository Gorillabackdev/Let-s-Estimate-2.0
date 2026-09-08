import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Cpu
} from 'lucide-react';

interface DrawingUploaderProps {
  onTakeoffSuccess: (items: any[], filename: string, provider: string, summary?: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const DrawingUploader: React.FC<DrawingUploaderProps> = ({
  onTakeoffSuccess,
  isProcessing,
  setIsProcessing,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [takeoffProgressText, setTakeoffProgressText] = useState('Initializing Gemini Vision...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
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

  // Helper to load bundled architectural sample drawing for instant test
  const handleLoadSampleDrawing = async (type: 'bungalow' | 'hostel') => {
    setErrorMsg(null);
    setIsProcessing(true);
    setTakeoffProgressText(
      type === 'bungalow' 
        ? 'Scanning 4-Bedroom Nigerian Bungalow Drawing with Gemini 2.5 Flash Vision...' 
        : 'Analyzing Multi-Storey Student Hostel Blueprint with Gemini 2.5 Flash Vision...'
    );

    try {
      // Create a canvas drawing representing an authentic architectural blueprint
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Blueprint blue background with architectural grid
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(0, 0, 1200, 800);
        ctx.strokeStyle = '#2d5a88';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1200; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 800);
          ctx.stroke();
        }
        for (let y = 0; y < 800; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1200, y);
          ctx.stroke();
        }

        // Title Block
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(
          type === 'bungalow' ? '4-BEDROOM CONTEMPORARY BUNGALOW - LAGOS' : '2-STOREY HOSTEL BLOCK - PORT HARCOURT',
          80,
          70
        );
        ctx.font = '16px Arial';
        ctx.fillStyle = '#94c2ed';
        ctx.fillText('SCALE: 1:100 | SPECIFICATION: 225MM SANDCRETE BLOCKS, RC SLAB 150MM, LONGSPAN ROOFING', 80, 100);

        // Building layout outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(100, 150, 1000, 560);

        // Room partitions
        ctx.lineWidth = 2.5;
        // Master Bedroom
        ctx.strokeRect(100, 150, 450, 280);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('MASTER BEDROOM (4500 x 4200)', 140, 280);
        ctx.font = '12px Arial';
        ctx.fillText('WINDOW W1 (1500x1200) | DOOR D1 (900x2100)', 140, 310);

        // Living Room & Dinning
        ctx.strokeRect(550, 150, 550, 340);
        ctx.fillText('LIVING ROOM & DINING (6500 x 5200)', 620, 300);

        // Kitchen & Store
        ctx.strokeRect(100, 430, 450, 280);
        ctx.fillText('KITCHEN & PANTRY (4500 x 3600)', 140, 560);

        // Bedroom 2 & 3
        ctx.strokeRect(550, 490, 275, 220);
        ctx.fillText('BEDROOM 2 (3600 x 3600)', 570, 600);
        ctx.strokeRect(825, 490, 275, 220);
        ctx.fillText('BEDROOM 3 (3600 x 3600)', 845, 600);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }

        const sampleName = type === 'bungalow' ? '4_bedroom_bungalow_lekki.png' : '2_storey_hostel_portharcourt.png';
        const file = new File([blob], sampleName, { type: 'image/png' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));

        // Submit to backend
        const formData = new FormData();
        formData.append('drawing', file);

        const response = await fetch('/api/takeoff', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'AI Takeoff failed');

        onTakeoffSuccess(data.items, file.name, data.provider, data.drawingSummary);
      }, 'image/png');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to analyze sample drawing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadAndRunTakeoff = async () => {
    if (!selectedFile) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setTakeoffProgressText('Uploading drawing and initializing Gemini 2.5 Flash Vision...');

    try {
      const formData = new FormData();
      formData.append('drawing', selectedFile);

      // Simulation of progress status for better UX
      const timer = setTimeout(() => {
        setTakeoffProgressText('Gemini detecting Walls m2, RC Slab m3, Blockwork m2, Doors, Windows, Roofing...');
      }, 1500);

      const response = await fetch('/api/takeoff', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timer);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI takeoff failed.');
      }

      onTakeoffSuccess(data.items, selectedFile.name, data.provider, data.drawingSummary);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during AI Takeoff. Please verify your file or try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="drawing-uploader-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Upload Architectural Drawing
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accepts floor plans, elevations, sections (.jpg, .png, .pdf). Google Gemini Vision automatically measures and extracts core BOQ items.
          </p>
        </div>

        {/* AI Engine Badge */}
        <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto text-xs font-semibold text-emerald-800">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>Google Gemini 2.5 Flash Vision</span>
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
              <div className="relative mb-3 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex flex-col items-center">
                <FileText className="w-12 h-12 mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">PDF Drawing Loaded</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-rose-200 hover:bg-rose-600 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-slate-800 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{selectedFile.name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Gemini Vision Takeoff
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-2 text-xs text-emerald-700 hover:underline font-medium"
              >
                Choose another file
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-3 shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Click to select or drag & drop drawing here
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-3">
              Supports single architectural plans in <strong>.JPG, .PNG, or .PDF</strong> (up to 25MB)
            </p>

            {/* Supported Quantities Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-600">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium">
                Walls m²
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium">
                RC Slab m³
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium">
                Blockwork m²
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium">
                Doors No
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium">
                Windows No
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 font-medium">
                Roofing m²
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Preset Drawings */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 font-medium">Don't have a blueprint file handy? Try a demo plan:</span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleLoadSampleDrawing('bungalow')}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium border border-slate-200 transition disabled:opacity-50"
          >
            Demo: 4-Bedroom Bungalow
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleLoadSampleDrawing('hostel')}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium border border-slate-200 transition disabled:opacity-50"
          >
            Demo: Student Hostel Block
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* BIG "Upload Drawing & Run AI Takeoff" Action Button */}
      <div className="mt-5">
        <button
          id="run-takeoff-btn"
          type="button"
          disabled={!selectedFile || isProcessing}
          onClick={handleUploadAndRunTakeoff}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-base shadow-md transition flex items-center justify-center space-x-3 ${
            !selectedFile || isProcessing
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white active:scale-[0.99]'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{takeoffProgressText}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <span>Run AI Takeoff with Google Gemini 2.5 Flash</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
