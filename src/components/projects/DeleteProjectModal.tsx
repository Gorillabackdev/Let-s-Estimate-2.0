import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Building2, MapPin, Layers, DollarSign } from 'lucide-react';
import { Project } from '../../types';
import { formatNaira } from '../../utils/format';

interface DeleteProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (projectId: string, title: string) => Promise<void> | void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(project.id, project.title);
      onClose();
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const itemCount = (project.items || []).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Delete Project?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Project Card preview */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{project.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{project.location || 'Nigeria'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{itemCount} BOQ Items</span>
            </div>
            <div className="col-span-2 flex items-center space-x-1.5 pt-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800">
                Total: {formatNaira(project.grand_total || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/70 text-rose-800 text-xs leading-relaxed">
          <p className="font-semibold">What will be removed:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700 text-[11px]">
            <li>All {itemCount} Bill of Quantities line items</li>
            <li>Takeoff measurements &amp; linked drawing files</li>
            <li>Interim valuations, certificates, &amp; variation logs</li>
            <li>Version snapshots and project audit history</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer shadow-xs inline-flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
