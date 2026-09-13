/**
 * Let's Estimate - Manual Takeoff Workspace
 * Wraps the RealDrawingViewer to allow QS measuring directly on the actual uploaded PDF/JPG/PNG.
 * Completely replaces all simulated mock geometry with the authentic uploaded architectural plan.
 */

import React, { useState } from 'react';
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
  Eye
} from 'lucide-react';
import { Project, ManualMeasurement, BoqItem, DrawingSheet } from '../../types';
import { RealDrawingViewer } from '../drawing/RealDrawingViewer';

interface ManualTakeoffWorkspaceProps {
  project: Project;
  onAddBoqItem: (item: Partial<BoqItem>) => void;
  onUpdateProjectMeasurements?: (measurements: ManualMeasurement[]) => void;
  highlightMeasurementId?: string | null;
  onRunAiTakeoff?: (file: File) => void;
}

export const ManualTakeoffWorkspace: React.FC<ManualTakeoffWorkspaceProps> = ({
  project,
  onAddBoqItem,
  onUpdateProjectMeasurements,
  highlightMeasurementId,
  onRunAiTakeoff,
}) => {
  // Available drawing sheets from project
  const availableSheets: DrawingSheet[] = project.drawings || [];
  const [selectedSheetId, setSelectedSheetId] = useState<string>(() => {
    return availableSheets.length > 0 ? availableSheets[0].id : '';
  });

  const activeSheet = availableSheets.find((s) => s.id === selectedSheetId) || (availableSheets.length > 0 ? availableSheets[0] : undefined);
  const activeUrl = activeSheet?.fileUrl || project.drawing_url || '';
  const activeName = activeSheet?.fileName || project.drawing_filename || '';

  return (
    <div className="space-y-6">
      {/* Workspace Header & Drawing Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  {s.sheetNumber ? `${s.sheetNumber} - ` : ''}{s.title || s.fileName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* REAL DRAWING VIEWER WORKSPACE */}
      <RealDrawingViewer
        project={project}
        initialFileUrl={activeUrl}
        initialFileName={activeName}
        onAddBoqItem={onAddBoqItem}
        onUpdateProjectMeasurements={onUpdateProjectMeasurements}
        highlightMeasurementId={highlightMeasurementId}
        onSwitchToAiTakeoff={onRunAiTakeoff}
      />
    </div>
  );
};
