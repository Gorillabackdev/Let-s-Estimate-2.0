/**
 * Let's Estimate - User Profile & Security Settings Modal
 * Complete profile editor, password management, active sessions, and security audit log.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SessionItem } from '../../types';
import { 
  X, 
  User as UserIcon, 
  Shield, 
  Key, 
  Laptop, 
  History, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Building,
  MapPin,
  Coins,
  Trash2
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Lagos', 'Rivers (Port Harcourt)', 'Abuja (FCT)', 'Delta (Warri/Asaba)',
  'Edo (Benin)', 'Akwa Ibom (Uyo)', 'Enugu', 'Anambra (Onitsha/Awka)',
  'Oyo (Ibadan)', 'Kano', 'Kaduna', 'Ogun', 'Imo (Owerri)', 'Other State'
];

export const UserProfileModal: React.FC = () => {
  const { 
    user, 
    isProfileModalOpen, 
    closeProfileModal, 
    updateProfile, 
    logout, 
    token 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'sessions' | 'logs'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profession, setProfession] = useState(user?.profession || 'Quantity Surveyor');
  const [company, setCompany] = useState(user?.company || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [state, setState] = useState(user?.state || 'Lagos');
  const [currency, setCurrency] = useState(user?.currency || 'NGN');
  const [measurementSystem, setMeasurementSystem] = useState(user?.measurement_system || 'Metric');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sessions and History
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setProfession(user.profession || 'Quantity Surveyor');
      setCompany(user.company || '');
      setJobTitle(user.job_title || '');
      setState(user.state || 'Lagos');
      setCurrency(user.currency || 'NGN');
      setMeasurementSystem(user.measurement_system || 'Metric');
    }
  }, [user]);

  const loadSessionsAndLogs = async () => {
    if (!token) return;
    setIsLoadingAudit(true);
    try {
      const [resSess, resLogs] = await Promise.all([
        fetch('/api/auth/sessions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/auth/login-history', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resSess.ok) {
        const d = await resSess.json();
        setSessions(d.sessions || []);
      }
      if (resLogs.ok) {
        const d = await resLogs.json();
        setLoginHistory(d.history || []);
      }
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isProfileModalOpen && (activeTab === 'sessions' || activeTab === 'logs')) {
      loadSessionsAndLogs();
    }
  }, [isProfileModalOpen, activeTab]);

  if (!isProfileModalOpen || !user) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    const res = await updateProfile({
      full_name: fullName,
      phone,
      profession,
      company,
      job_title: jobTitle,
      state,
      currency,
      measurement_system: measurementSystem,
    });
    setIsSaving(false);
    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Profile updated successfully.' });
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      setIsSaving(false);
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch (err: any) {
      setIsSaving(false);
      setStatusMsg({ type: 'error', text: err.message || 'Change password error' });
    }
  };

  const handleRevokeSession = async (sessionToken: string) => {
    try {
      await fetch(`/api/auth/sessions/${sessionToken}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadSessionsAndLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to sign out from all browsers and devices?')) {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Are you sure you want to delete your Let\'s Estimate account and projects? This cannot be undone.')) {
      await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8"
        id="user-profile-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 text-white border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-lg shadow-sm">
              {user.full_name?.charAt(0) || 'Q'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{user.full_name}</h3>
                {Boolean(user.email_verified) ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified QS
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">{user.email} • {user.profession || 'Quantity Surveyor'}</p>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            id="close-profile-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 px-6 bg-neutral-50/70 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('profile'); setStatusMsg(null); }}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-amber-600 text-amber-900 bg-white shadow-xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Profile & Organization
          </button>
          <button
            onClick={() => { setActiveTab('password'); setStatusMsg(null); }}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'password'
                ? 'border-amber-600 text-amber-900 bg-white shadow-xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Security & Password
          </button>
          <button
            onClick={() => { setActiveTab('sessions'); setStatusMsg(null); }}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sessions'
                ? 'border-amber-600 text-amber-900 bg-white shadow-xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Active Sessions
          </button>
          <button
            onClick={() => { setActiveTab('logs'); setStatusMsg(null); }}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'logs'
                ? 'border-amber-600 text-amber-900 bg-white shadow-xs'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Login History
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {statusMsg && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Full Name & Title
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    id="profile-fullname-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    WhatsApp / Official Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    id="profile-phone-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Professional Role / Discipline
                  </label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    id="profile-profession-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Company / Firm Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    id="profile-company-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    State / Region
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Default Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="NGN">NGN (₦ Nigerian Naira)</option>
                    <option value="USD">USD ($ United States Dollar)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Unit Measurement
                  </label>
                  <select
                    value={measurementSystem}
                    onChange={(e) => setMeasurementSystem(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Metric">Metric (m, m², m³, kg)</option>
                    <option value="Imperial">Imperial (ft, sq ft, cu yd)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-neutral-200">
                <button
                  type="button"
                  onClick={logout}
                  className="px-3.5 py-2 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                  id="profile-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  id="save-profile-btn"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  id="current-password-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  id="new-password-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  id="confirm-new-password-input"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  id="submit-password-change-btn"
                >
                  {isSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-600">
                  Manage active browser sessions across your devices.
                </p>
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-md border border-red-200 transition-colors"
                >
                  Log Out All Other Devices
                </button>
              </div>

              {isLoadingAudit ? (
                <div className="py-8 text-center text-xs text-neutral-500">Loading active sessions...</div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((sess, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-700">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900">
                              {sess.user_agent?.includes('Mac') ? 'Mac OS' : sess.user_agent?.includes('Windows') ? 'Windows PC' : 'Web Device'}
                            </span>
                            {sess.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Current Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500">
                            IP: {sess.ip_address || 'Localhost'} • Last active: {new Date(sess.last_active).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.token)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200">
                <h4 className="text-xs font-bold text-red-700 mb-1">Danger Zone</h4>
                <p className="text-[11px] text-neutral-500 mb-2">
                  Permanently delete your account and all associated projects and custom rates.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LOGIN AUDIT HISTORY */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-600">
                Security audit trail of recent sign-in attempts for your account.
              </p>
              {isLoadingAudit ? (
                <div className="py-8 text-center text-xs text-neutral-500">Loading audit trail...</div>
              ) : loginHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">No recent logs recorded.</div>
              ) : (
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                      <tr>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Date & Time</th>
                        <th className="py-2 px-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {loginHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.status.includes('success')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-neutral-600">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-neutral-500 font-mono">
                            {item.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
