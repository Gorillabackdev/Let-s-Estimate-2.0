import React, { useState, useEffect } from 'react';
import { ProjectCollaborator } from '../types';
import { 
  X, Share2, Link2, Copy, Check, Users, UserPlus, Trash2, 
  Shield, Eye, Lock, Globe, Mail, UserCheck
} from 'lucide-react';

interface ProjectShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

export const ProjectShareModal: React.FC<ProjectShareModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'shareLink' | 'collaborators'>('shareLink');
  
  // Share Link State
  const [shareToken, setShareToken] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<'viewer' | 'reviewer'>('viewer');
  const [passcode, setPasscode] = useState('');
  const [isShareActive, setIsShareActive] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingShare, setIsSavingShare] = useState(false);

  // Collaborators State
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Lead QS' | 'Estimator' | 'Reviewer' | 'Client'>('Reviewer');
  const [isAddingCollab, setIsAddingCollab] = useState(false);
  const [collabNotice, setCollabNotice] = useState('');

  // Fetch current share settings
  const fetchShareInfo = () => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/share`)
      .then((res) => res.json())
      .then((data) => {
        if (data.share) {
          setShareToken(data.share.share_token || '');
          setAccessLevel(data.share.access_level || 'viewer');
          setPasscode(data.share.passcode || '');
          setIsShareActive(Number(data.share.is_active) === 1);
        }
      })
      .catch((err) => console.error(err));
  };

  // Fetch collaborators
  const fetchCollaborators = () => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/collaborators`)
      .then((res) => res.json())
      .then((data) => {
        if (data.collaborators) {
          setCollaborators(data.collaborators);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchShareInfo();
      fetchCollaborators();
    }
  }, [isOpen, projectId]);

  // Save / Update Share Link
  const handleSaveShareConfig = async () => {
    setIsSavingShare(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessLevel,
          passcode,
          isActive: isShareActive,
        }),
      });
      const data = await res.json();
      if (data.share) {
        setShareToken(data.share.shareToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingShare(false);
    }
  };

  // Copy share URL
  const getShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/share/${shareToken || 'preview'}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Add collaborator
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;

    setIsAddingCollab(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewEmail('');
        setCollabNotice(`Invitation granted to ${newEmail}`);
        setTimeout(() => setCollabNotice(''), 3000);
        fetchCollaborators();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingCollab(false);
    }
  };

  // Delete collaborator
  const handleDeleteCollaborator = async (collabId: string, email: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${collabId}?userEmail=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-inner">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Share Estimate & Team Collaboration
              </h3>
              <p className="text-xs text-slate-300">
                Generate secure client tender review links & manage QS team roles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 bg-slate-100 border-b border-slate-200 flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('shareLink')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'shareLink'
                ? 'bg-white text-emerald-900 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Client Tender Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collaborators')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'collaborators'
                ? 'bg-white text-emerald-900 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Team Members & Roles ({collaborators.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: CLIENT TENDER LINK */}
          {activeTab === 'shareLink' && (
            <div className="space-y-4">
              
              {/* Active Toggle */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Public Tender Review Link</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Allow clients, developers, or subcontractors to inspect the BOQ without an account.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isShareActive}
                    onChange={(e) => {
                      setIsShareActive(e.target.checked);
                      handleSaveShareConfig();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Share URL Box */}
              {isShareActive && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">Shareable Review URL</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-mono text-slate-700 truncate select-all">
                      {getShareUrl()}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition shrink-0"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>

                  {/* Access Level & Security Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Access Level</label>
                      <select
                        value={accessLevel}
                        onChange={(e) => {
                          setAccessLevel(e.target.value as any);
                          handleSaveShareConfig();
                        }}
                        className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="viewer">Client View-Only (Tender Summary & BOQ)</option>
                        <option value="reviewer">Reviewer (View & Export PDF/Excel)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Passcode Protection</label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. QS-PORT-2026"
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          onBlur={handleSaveShareConfig}
                          className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Information Note */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">Security & Privacy Assurance:</span>
                <p>
                  Shared links do not expose your internal cost analysis margins or audit logs. Clients only receive the formal client-facing Bill of Quantities.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: TEAM COLLABORATORS */}
          {activeTab === 'collaborators' && (
            <div className="space-y-4">
              
              {/* Invite Form */}
              <form onSubmit={handleAddCollaborator} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                  <span>Invite Project Collaborator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <input
                      type="email"
                      required
                      placeholder="Colleague or Client email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Lead QS">Lead QS</option>
                      <option value="Estimator">Estimator</option>
                      <option value="Reviewer">Reviewer</option>
                      <option value="Client">Client</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isAddingCollab}
                      className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      Invite
                    </button>
                  </div>
                </div>

                {collabNotice && (
                  <p className="text-xs font-semibold text-emerald-700 animate-fade-in">
                    {collabNotice}
                  </p>
                )}
              </form>

              {/* Collaborators List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Active Team Members:
                </span>

                {collaborators.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No additional team members invited yet. You are currently the sole Project Lead.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {collaborators.map((c) => (
                      <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {c.user_email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{c.user_email}</div>
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {c.role}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCollaborator(c.id, c.user_email)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Revoke access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Role-Based Access Control (RBAC)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
