import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Building2, 
  ExternalLink, 
  Plus, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TeamClientsViewProps {
  onOpenTenderPortal?: () => void;
}

export const TeamClientsView: React.FC<TeamClientsViewProps> = ({ onOpenTenderPortal }) => {
  const { user } = useAuth();

  const [teamMembers, setTeamMembers] = useState([
    {
      name: user?.full_name || 'Emmanuel Isaac, MNIQS',
      role: 'Lead Quantity Surveyor & Principal Partner',
      email: user?.email || 'emmanuelisaac888@gmail.com',
      status: 'Active',
      regNo: 'NIQS-RQS-4819'
    },
    {
      name: 'Engr. Babatunde Adeyemi',
      role: 'Consulting Civil / Structural Engineer',
      email: 'babatunde.adeyemi@consulting.ng',
      status: 'Active',
      regNo: 'COREN R-38102'
    },
    {
      name: 'Arch. Fatima Al-Hassan',
      role: 'Project Architect & Specs Reviewer',
      email: 'fatima@al-hassan.design',
      status: 'Active',
      regNo: 'ARCON F-1902'
    }
  ]);

  return (
    <div id="team-clients-workspace" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Team, Consultants &amp; Client Stakeholders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage project team collaborators, assign role-based estimating permissions, and configure client review portals.
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Registered Professional Team</h3>
        
        <div className="divide-y divide-slate-100">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                  {member.name[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{member.name}</div>
                  <div className="text-[11px] text-slate-500">{member.role}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-mono text-slate-400 text-[11px]">{member.regNo}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Portal Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Subcontractor Tender Comparison Portal</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Share an external web link with client representatives or tender bidders for real-time bid comparison.
          </p>
        </div>
        {onOpenTenderPortal && (
          <button
            type="button"
            onClick={onOpenTenderPortal}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs"
          >
            <span>Open Tender Matrix</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};
