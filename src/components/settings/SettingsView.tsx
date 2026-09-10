import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Building2, 
  DollarSign, 
  MapPin, 
  Save, 
  Check, 
  CreditCard 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SettingsViewProps {
  onOpenSubscriptionModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenSubscriptionModal }) => {
  const { user } = useAuth();
  const [defaultVat, setDefaultVat] = useState(7.5);
  const [defaultPo, setDefaultPo] = useState(15);
  const [defaultWaste, setDefaultWaste] = useState(5);
  const [firmName, setFirmName] = useState('Emmanuel & Associates Consulting Quantity Surveyors');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div id="system-settings-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System &amp; Practice Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure baseline QS markups, regional terrain indexing, practice credentials, and subscription status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Configuration Inputs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Practice &amp; Firm Information</h3>
            <p className="text-xs text-slate-500 mb-4">Printed on official BOQ headers, IPCs, and audit packs.</p>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Practice / Firm Name</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead QS Name</label>
                  <input
                    type="text"
                    defaultValue={user?.full_name || 'Isaac Emmanuel'}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIQS / QSRBN Reg. No.</label>
                  <input
                    type="text"
                    defaultValue="NIQS-RQS-4819"
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Standard Cost Multipliers &amp; Tax</h3>
            <p className="text-xs text-slate-500 mb-4">Applied to new projects automatically.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Default Profit &amp; Overheads (%)</label>
                <input
                  type="number"
                  value={defaultPo}
                  onChange={(e) => setDefaultPo(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Default Material Waste (%)</label>
                <input
                  type="number"
                  value={defaultWaste}
                  onChange={(e) => setDefaultWaste(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nigerian VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={defaultVat}
                  onChange={(e) => setDefaultVat(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Changes persist in application state.</span>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-xs"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Practice Settings'}</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Subscription Plan Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Professional Practice Tier</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Full access to AI Vision takeoff measurements, unlimited BOQ line items, interim payment certificates, and bank transfer manual billing.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="font-bold">Account: {user?.email || 'Active Estimator'}</div>
              <div>License: NIQS Verified Professional</div>
              <div>Status: Active</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center space-x-2 shadow-2xs"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Manage Billing &amp; Bank Plans</span>
          </button>
        </div>

      </div>

    </div>
  );
};
