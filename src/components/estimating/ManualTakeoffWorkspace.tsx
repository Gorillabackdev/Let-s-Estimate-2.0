/**
 * Let's Estimate - Manual Takeoff Workspace
 * Wraps the RealDrawingViewer to allow QS measuring directly on the actual uploaded PDF/JPG/PNG.
 * Completely replaces all simulated mock geometry with the authentic uploaded architectural plan.
 */

import React, { useState, useRef } from 'react';
import {
  Ruler,
  Layers,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Eye,
  ChevronDown,
  ChevronUp,
  Table,
  Calculator,
  ArrowUp
} from 'lucide-react';
import { Project, ManualMeasurement, BoqItem, DrawingSheet } from '../../types';
import { RealDrawingViewer } from '../drawing/RealDrawingViewer';
import { BoqTable } from '../BoqTable';
import { formatNaira } from '../../utils/format';

interface ManualTakeoffWorkspaceProps {
  project: Project;
  onAddBoqItem: (item: Partial<BoqItem>) => void;
  onUpdateBoqItem?: (index: number, field: keyof BoqItem, value: any) => void;
  onDeleteBoqItem?: (index: number) => void;
  onApplyMarketRates?: () => void;
  onImportBoq?: () => void;
  onUpdateProjectMeasurements?: (measurements: ManualMeasurement[]) => void;
  highlightMeasurementId?: string | null;
  onRunAiTakeoff?: (file: File) => void;
}

export const ManualTakeoffWorkspace: React.FC<ManualTakeoffWorkspaceProps> = ({
  project,
  onAddBoqItem,
  onUpdateBoqItem,
  onDeleteBoqItem,
  onApplyMarketRates,
  onImportBoq,
  onUpdateProjectMeasurements,
  highlightMeasurementId,
  onRunAiTakeoff,
}) => {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const boqContainerRef = useRef<HTMLDivElement>(null);

  // Available drawing sheets from project
  const availableSheets: DrawingSheet[] = project.drawings || [];
  const [selectedSheetId, setSelectedSheetId] = useState<string>(() => {
    return availableSheets.length > 0 ? availableSheets[0].id : '';
  });

  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    highlightMeasurementId || null
  );
  const [isBoqOpen, setIsBoqOpen] = useState(true);

  const activeSheet =
    availableSheets.find((s) => s.id === selectedSheetId) ||
    (availableSheets.length > 0 ? availableSheets[0] : undefined);
  const activeUrl = activeSheet?.fileUrl || project.drawing_url || '';
  const activeName = activeSheet?.fileName || project.drawing_filename || '';

  const boqItems = project.items || [];
  const takeoffItems = boqItems.filter(
    (b) => b.source === 'MANUAL_TAKEOFF' || !!b.drawing_evidence_id
  );
  const totalBoqAmount = boqItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Handle viewing a specific takeoff measurement on the drawing viewer above
  const handleViewOnDrawing = (item: BoqItem) => {
    if (item.drawing_evidence_id) {
      setActiveHighlightId(item.drawing_evidence_id);
      viewerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll directly to BOQ table
  const handleScrollToBoq = () => {
    boqContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Safe fallback handlers for BOQ operations
  const handleUpdateItem = (index: number, field: keyof BoqItem, value: any) => {
    if (onUpdateBoqItem) {
      onUpdateBoqItem(index, field, value);
    }
  };

  const handleAddItem = (customItem?: Partial<BoqItem>) => {
    onAddBoqItem(
      customItem || {
        item: '',
        description: '',
        unit: 'm2',
        qty: 0,
        rate: 0,
        amount: 0,
        section: 'Substructure',
        source: 'MANUAL_ENTRY',
        is_confirmed: true,
      }
    );
  };

  const handleDeleteItem = (index: number) => {
    if (onDeleteBoqItem) {
      onDeleteBoqItem(index);
    }
  };

  const handleApplyRates = () => {
    if (onApplyMarketRates) {
      onApplyMarketRates();
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header & Drawing Selector */}
      <div
        ref={viewerContainerRef}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <Ruler className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Interactive Takeoff Canvas</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Real Drawing Mode
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrated linear runs, polygon areas, wall deduction calculations, and numbered counts directly on your plan.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick jump to BOQ table */}
          <button
            type="button"
            onClick={handleScrollToBoq}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-200"
            title="Jump down to Bill of Quantities table"
          >
            <Table className="w-3.5 h-3.5 text-emerald-700" />
            <span>View BOQ ({boqItems.length})</span>
          </button>

          {/* Sheet Selector if multiple sheets exist */}
          {availableSheets.length > 1 && (
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-600 pl-1">Sheet:</span>
              <select
                value={selectedSheetId}
                onChange={(e) => setSelectedSheetId(e.target.value)}
                className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800 outline-none cursor-pointer"
              >
                {availableSheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sheetNumber ? `${s.sheetNumber} - ` : ''}
                    {s.title || s.fileName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* REAL DRAWING VIEWER WORKSPACE (With multi-page PDF review suite) */}
      <RealDrawingViewer
        project={project}
        initialFileUrl={activeUrl}
        initialFileName={activeName}
        onAddBoqItem={onAddBoqItem}
        onUpdateProjectMeasurements={onUpdateProjectMeasurements}
        highlightMeasurementId={activeHighlightId}
        onSwitchToAiTakeoff={onRunAiTakeoff}
      />

      {/* BOQ TABLE SITTING DIRECTLY BENEATH THE DRAWING VIEWER */}
      <div
        ref={boqContainerRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* BOQ Section Header */}
        <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
              <Table className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Project Bill of Quantities (BOQ)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  {boqItems.length} Items
                </span>
                {takeoffItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-500/30">
                    {takeoffItems.length} from Takeoff
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live synchronization with takeoff measurements above • Calibrated to NIQS &amp; BESMM4
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-center">
            {/* Total BOQ Amount Pill */}
            <div className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 font-medium">Total:</span>
              <span className="font-mono text-sm font-black text-emerald-400">
                {formatNaira(totalBoqAmount)}
              </span>
            </div>

            {/* Scroll back up to drawing button */}
            <button
              type="button"
              onClick={() => viewerContainerRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
              title="Scroll back up to Drawing Canvas"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsBoqOpen(!isBoqOpen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
              title={isBoqOpen ? 'Collapse BOQ Table' : 'Expand BOQ Table'}
            >
              {isBoqOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* BOQ Table Content */}
        {isBoqOpen && (
          <div className="p-4 sm:p-6 bg-slate-50/50">
            <BoqTable
              items={boqItems}
              onUpdateItem={handleUpdateItem}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onApplyMarketRates={handleApplyRates}
              onViewOnDrawing={handleViewOnDrawing}
              onImportBoq={onImportBoq}
            />
          </div>
        )}
      </div>
    </div>
  );
};
