import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Clock, User, CheckCircle2, Activity } from 'lucide-react';
import { ProjectActivity } from '../types';

interface ProjectAuditDrawerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectAuditDrawer: React.FC<ProjectAuditDrawerProps> = ({
  projectId,
  isOpen,
  onClose
}) => {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadActivities();
    }
  }, [isOpen, projectId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/activities`);
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (err: any) {
      console.error('Failed to load project audit activities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Project Audit Trail</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Chronological log of changes, versions, status updates, and valuations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Loading activity logs...
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              No recorded activity yet for this project.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activities.map((act) => (
                <div key={act.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(act.created_at).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </span>
                    </div>

                    {act.details && (
                      <p className="text-xs text-slate-600">
                        {act.details}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{act.user_name || 'QS Estimator'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
