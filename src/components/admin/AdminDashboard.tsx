/**
 * Let's Estimate - Super Admin Command Center & QS Operations Dashboard
 * Grants Emmanuel Isaac (Lead QS) full administrative control:
 * - User Directory & Access Restriction (Restrict/Allow user access)
 * - Granular Service Permissions by Payment Plan / User
 * - Login Activities & Security Audit Logs (IP, timestamps, device, status)
 * - Payment System & Bank Transfer Approvals (Approve/Reject user payments)
 * - Colleague Testing Invitations & Subscription Rules
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { safeFetchJson } from '../../utils/api';
import { 
  ShieldCheck, 
  Key, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Share2, 
  RefreshCw, 
  Trash2, 
  Award, 
  Mail, 
  Building2, 
  MapPin, 
  Lock, 
  Unlock, 
  Check, 
  Briefcase,
  Activity,
  Sliders,
  X,
  FileCheck2,
  Calendar,
  Monitor,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { User } from '../../types';

interface AdminMetrics {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  plans: {
    trial: number;
    per_boq: number;
    monthly: number;
    yearly: number;
    lifetime: number;
  };
  totalProjects: number;
}

interface AdminData {
  metrics: AdminMetrics;
  recentUsers: any[];
  masterAdminKey: string;
  systemInfo: {
    serverTime: string;
    database: string;
    version: string;
    leadQs: string;
  };
}

interface LoginActivity {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  ip_address: string;
  user_agent: string;
  status: string;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: string;
  plan_name: string;
  amount_naira: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  transfer_reference: string;
  sender_name: string;
  sender_bank: string;
  transfer_date: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  current_user_name?: string;
  current_user_tier?: string;
}

export const AdminDashboard: React.FC<{ onBackToWorkspace?: () => void }> = ({ onBackToWorkspace }) => {
  const { user, token } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Tabs: users | payments | logins | invite
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'logins' | 'invite'>('users');

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'unverified'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free_trial' | 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [invitePresetPlan, setInvitePresetPlan] = useState<'free_trial' | 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license'>('free_trial');

  // Service Permissions Modal State
  const [serviceModalUser, setServiceModalUser] = useState<User | null>(null);
  const [serviceForm, setServiceForm] = useState({
    can_ai_takeoff: 1,
    can_valuations: 1,
    can_variations: 1,
    can_export_pdf_excel: 1,
    can_rates_library: 1,
    can_team_collab: 1,
    max_projects: 10
  });
  const [isSavingServices, setIsSavingServices] = useState(false);

  const handleForceSync = async () => {
    if (!token) return;
    setIsSyncing(true);
    setError(null);
    try {
      const { ok, data: resData, error: syncErr } = await safeFetchJson<{ success: boolean; message: string; error?: string }>(
        '/api/admin/sync',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (ok && resData?.success) {
        setActionSuccess(resData.message);
        await fetchAdminData();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setError(resData?.error || syncErr || 'Database sync failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Sync operation failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, usersRes, loginsRes, paymentsRes] = await Promise.all([
        safeFetchJson<{ success: boolean; error?: string } & AdminData>('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        safeFetchJson<{ success: boolean; users: User[]; error?: string }>('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        safeFetchJson<{ success: boolean; activities: LoginActivity[]; error?: string }>('/api/admin/login-history', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        safeFetchJson<{ success: boolean; payments: PaymentRecord[]; error?: string }>('/api/admin/payments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (overviewRes.ok && overviewRes.data?.success) {
        setData(overviewRes.data);
      } else if (!overviewRes.ok && overviewRes.error) {
        setError(overviewRes.data?.error || overviewRes.error);
      }
      if (usersRes.ok && usersRes.data?.users) {
        setUsers(usersRes.data.users);
      } else if (!usersRes.ok && usersRes.error) {
        setError(usersRes.data?.error || usersRes.error);
      }
      if (loginsRes.ok && loginsRes.data?.activities) {
        setLoginActivities(loginsRes.data.activities);
      }
      if (paymentsRes.ok && paymentsRes.data?.payments) {
        setPayments(paymentsRes.data.payments);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to admin services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // Update User Access Status (Active vs Suspended / Restricted)
  const handleUpdateAccess = async (userId: string, newStatus: 'active' | 'pending' | 'suspended') => {
    if (!token) return;
    try {
      const { ok, data: resData, error: err } = await safeFetchJson<{ success: boolean; message?: string; error?: string }>(
        `/api/admin/users/${userId}/access`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ access_status: newStatus }),
        }
      );

      if (ok && resData?.success) {
        setActionSuccess(`User access updated to ${newStatus === 'suspended' ? 'RESTRICTED / SUSPENDED' : 'ACTIVE'}.`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, access_status: newStatus } : u));
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(resData?.error || err || 'Failed to update user access');
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  // Update User Subscription Plan
  const handleUpdateSubscription = async (userId: string, tier: 'free_trial' | 'per_boq' | 'monthly' | 'yearly' | 'lifetime_license') => {
    if (!token) return;
    try {
      const duration = tier === 'monthly' ? 30 : tier === 'yearly' ? 365 : tier === 'lifetime_license' ? 3650 : 30;
      const credits = tier === 'lifetime_license' ? 9999 : tier === 'yearly' ? 500 : tier === 'monthly' ? 100 : tier === 'per_boq' ? 1 : 10;

      const { ok, data: resData, error: err } = await safeFetchJson<{ success: boolean; error?: string }>(
        `/api/admin/users/${userId}/subscription`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tier,
            status: 'active',
            duration_days: duration,
            boq_credits: credits,
          }),
        }
      );

      if (ok && resData?.success) {
        setActionSuccess(`Subscription plan set to ${tier.replace('_', ' ').toUpperCase()}`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_tier: tier, subscription_status: 'active' } : u));
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(resData?.error || err || 'Failed to update subscription');
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  // Open Service Limit Modal
  const openServiceModal = (targetUser: User) => {
    setServiceModalUser(targetUser);
    setServiceForm({
      can_ai_takeoff: targetUser.can_ai_takeoff !== undefined ? targetUser.can_ai_takeoff : 1,
      can_valuations: targetUser.can_valuations !== undefined ? targetUser.can_valuations : 1,
      can_variations: targetUser.can_variations !== undefined ? targetUser.can_variations : 1,
      can_export_pdf_excel: targetUser.can_export_pdf_excel !== undefined ? targetUser.can_export_pdf_excel : 1,
      can_rates_library: targetUser.can_rates_library !== undefined ? targetUser.can_rates_library : 1,
      can_team_collab: targetUser.can_team_collab !== undefined ? targetUser.can_team_collab : 1,
      max_projects: targetUser.max_projects || 10
    });
  };

  // Save Service Permissions for User
  const handleSaveServices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModalUser || !token) return;
    setIsSavingServices(true);
    try {
      const { ok, data: resData, error: err } = await safeFetchJson<{ success: boolean; message?: string; user?: User }>(
        `/api/admin/users/${serviceModalUser.id}/services`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(serviceForm)
        }
      );

      setIsSavingServices(false);
      if (ok && resData?.success) {
        setActionSuccess(`Service limitations saved for ${serviceModalUser.full_name}`);
        setUsers(prev => prev.map(u => u.id === serviceModalUser.id ? { ...u, ...serviceForm } : u));
        setServiceModalUser(null);
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(resData?.message || err || 'Failed to update service limits.');
      }
    } catch (err: any) {
      setIsSavingServices(false);
      alert(err.message || 'Error updating services');
    }
  };

  // Verify Email Manually
  const handleVerifyEmailManually = async (userId: string) => {
    if (!token) return;
    try {
      const { ok, data: resData } = await safeFetchJson<{ success: boolean }>(
        `/api/admin/users/${userId}/verify-email`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (ok && resData?.success) {
        setActionSuccess('User email manually verified.');
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, email_verified: 1 } : u));
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to verify email');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to permanently delete user "${email}" and all associated data?`)) {
      return;
    }

    try {
      const { ok, data: resData, error: err } = await safeFetchJson<{ success: boolean; error?: string }>(
        `/api/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (ok && resData?.success) {
        setActionSuccess(`User "${email}" removed from database.`);
        setUsers(prev => prev.filter(u => u.id !== userId));
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(resData?.error || err || 'Failed to delete user');
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  // Approve Payment Transfer
  const handleApprovePayment = async (paymentId: string) => {
    if (!token) return;
    if (!confirm('Approve this payment and immediately activate the plan for this user?')) return;

    try {
      const { ok, data: resData, error: err } = await safeFetchJson<{ success: boolean; message?: string; payment?: PaymentRecord }>(
        `/api/admin/payments/${paymentId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ notes: 'Verified and approved by Lead QS Emmanuel Isaac' })
        }
      );

      if (ok && resData?.success) {
        setActionSuccess(resData.message || 'Payment approved and user plan activated!');
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'approved' } : p));
        fetchAdminData();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(resData?.message || err || 'Failed to approve payment.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve payment');
    }
  };

  // Reject Payment Transfer
  const handleRejectPayment = async (paymentId: string) => {
    if (!token) return;
    const reason = prompt('Enter rejection reason / note (optional):', 'Payment reference unverified');
    if (reason === null) return;

    try {
      const { ok, data: resData } = await safeFetchJson<{ success: boolean; message?: string }>(
        `/api/admin/payments/${paymentId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ notes: reason })
        }
      );

      if (ok && resData?.success) {
        setActionSuccess('Payment marked as rejected.');
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected' } : p));
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment');
    }
  };

  const copyMasterKey = () => {
    navigator.clipboard.writeText(data?.masterAdminKey || 'QS-MASTER-KEY-2026-EMMANUEL-ADMIN');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const getColleagueInviteLink = () => {
    if (typeof window === 'undefined') {
      return 'https://ais-pre-sg3ad57pt3vb2iqfgsf2ku-391264280807.europe-west1.run.app/#register';
    }
    let origin = window.location.origin;
    // When in dev container (ais-dev-...), convert to shared preview container (ais-pre-...) so colleagues can access it without AI Studio login
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return `${origin}/#register?plan=${invitePresetPlan}`;
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getColleagueInviteLink());
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.company?.toLowerCase().includes(q) ||
        u.profession?.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = u.access_status === 'active' || !u.access_status;
      if (statusFilter === 'pending') matchesStatus = u.access_status === 'pending';
      if (statusFilter === 'suspended') matchesStatus = u.access_status === 'suspended';
      if (statusFilter === 'unverified') matchesStatus = !u.email_verified || u.email_verified === 0;

      let matchesPlan = true;
      if (planFilter !== 'all') {
        matchesPlan = (u.subscription_tier || 'free_trial') === planFilter;
      }

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [users, searchQuery, statusFilter, planFilter]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (paymentStatusFilter === 'all') return true;
      return p.status === paymentStatusFilter;
    });
  }, [payments, paymentStatusFilter]);

  const pendingPaymentsCount = useMemo(() => {
    return payments.filter(p => p.status === 'pending').length;
  }, [payments]);

  const suspendedUsersCount = useMemo(() => {
    return users.filter(u => u.access_status === 'suspended').length;
  }, [users]);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl border border-emerald-800/40 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Super Admin Command Center
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 tracking-wide uppercase">
                    Master Access
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  Manage user permissions, approve plan payments, review login activities, and enforce service restrictions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleForceSync}
              disabled={isSyncing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-xs font-semibold text-emerald-100 border border-emerald-600/60 transition active:scale-95 cursor-pointer shadow-xs"
              title="Pull all users from Google Cloud Firestore and push local accounts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Database'}</span>
            </button>

            <button
              onClick={fetchAdminData}
              disabled={isLoading || isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            {onBackToWorkspace && (
              <button
                onClick={onBackToWorkspace}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>Return to Workspace</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Super Admin Key Notice */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-amber-500/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 shrink-0 mt-0.5 border border-amber-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Your Master Admin Key (Segregated Gateway)</h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.2 rounded-full font-mono">
                    Direct Portal URL: #/admin-portal
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Use your secret URL <code className="text-amber-300">#/admin-portal</code> on any browser to access the administrative gateway. Public login screens have zero admin links for hacker defense.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <code className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                {data?.masterAdminKey || 'QS-MASTER-KEY-2026-EMMANUEL-ADMIN'}
              </code>
              <button
                onClick={copyMasterKey}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Copy Master Key to clipboard"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action alert */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI CARDS (NO BOQ TOTAL AMOUNTS AS REQUESTED BY USER) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered QS Users</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white">{data?.metrics.totalUsers ?? users.length}</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span className="text-emerald-400 font-semibold">{data?.metrics.activeUsers ?? users.filter(u => u.access_status !== 'suspended').length} Active</span>
                <span>•</span>
                <span className="text-amber-400">{data?.metrics.pendingUsers ?? 0} Pending</span>
                <span>•</span>
                <span className="text-red-400">{suspendedUsersCount} Suspended</span>
              </div>
            </div>
          </div>

          {/* Card 2: Email Verified Accounts */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Verified Accounts</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white">{data?.metrics.verifiedUsers ?? users.filter(u => u.email_verified).length}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {users.length ? (
                  <span className="text-emerald-400 font-semibold">
                    {Math.round(((users.filter(u => u.email_verified).length) / (users.length || 1)) * 100)}% Verified
                  </span>
                ) : 'All verified'}
              </div>
            </div>
          </div>

          {/* Card 3: Restricted Users */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Restricted / Suspended</span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-red-400">{suspendedUsersCount}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {suspendedUsersCount === 0 ? 'No accounts blocked' : 'Access blocked by Admin'}
              </div>
            </div>
          </div>

          {/* Card 4: Payment Approvals Pending */}
          <div 
            onClick={() => setActiveTab('payments')}
            className="bg-slate-900/80 hover:bg-slate-900 rounded-2xl p-5 border border-slate-800/80 shadow-xs flex flex-col justify-between cursor-pointer transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Payment Approvals</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-amber-400">{pendingPaymentsCount}</div>
              <div className="text-[11px] text-amber-300 mt-1 flex items-center justify-between">
                <span>{pendingPaymentsCount === 0 ? 'All caught up' : 'Awaiting confirmation'}</span>
                <span className="text-xs font-bold underline">Review &rarr;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Tabs Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>List of Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment System &amp; Approvals {pendingPaymentsCount > 0 && `(${pendingPaymentsCount})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('logins')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'logins'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Login Activities ({loginActivities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invite')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'invite'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Colleague Invite &amp; Plans</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: LIST OF USERS & RESTRICTIONS */}
        {/* ================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter Controls */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, firm, or phone..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <span className="px-2 text-slate-500 text-[11px] font-semibold">Status:</span>
                  {(['all', 'active', 'suspended', 'unverified'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs capitalize font-medium transition cursor-pointer ${
                        statusFilter === st ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'suspended' ? 'Restricted' : st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <span className="px-2 text-slate-500 text-[11px] font-semibold">Plan:</span>
                  {(['all', 'free_trial', 'per_boq', 'monthly', 'yearly', 'lifetime_license'] as const).map((pl) => (
                    <button
                      key={pl}
                      onClick={() => setPlanFilter(pl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        planFilter === pl ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pl === 'all' 
                        ? 'All' 
                        : pl === 'free_trial' 
                        ? 'Trial (30d)' 
                        : pl === 'per_boq'
                        ? 'Per BOQ (₦3k)'
                        : pl === 'monthly'
                        ? 'Monthly (₦50k)'
                        : pl === 'yearly'
                        ? 'Annual (₦400k)'
                        : 'Lifetime (₦2M)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User &amp; Profession</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Location / Firm</th>
                      <th className="py-3 px-4">Email Status</th>
                      <th className="py-3 px-4">Access Status</th>
                      <th className="py-3 px-4">Assigned Plan</th>
                      <th className="py-3 px-4">Service Permissions</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No users matched your filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSuperAdmin = u.role === 'superadmin' || u.email?.toLowerCase() === 'emmanuelisaac888@gmail.com';
                        const isVerified = u.email_verified === 1 || u.email_verified === true;
                        const isSuspended = u.access_status === 'suspended';
                        const tier = u.subscription_tier || 'free_trial';

                        return (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* User & Profession */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-800/60 border border-emerald-600/40 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                  {u.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{u.full_name}</span>
                                    {isSuperAdmin && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                                        SUPER ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Briefcase className="w-3 h-3 text-slate-500" />
                                    <span>{u.profession || 'Quantity Surveyor'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact Info */}
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              <div className="text-slate-200">{u.email}</div>
                              {u.phone && <div className="text-slate-400 text-[10px] mt-0.5">{u.phone}</div>}
                            </td>

                            {/* Location / Firm */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-200 font-medium">{u.company || 'Private Practice'}</div>
                              <div className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>{u.state || 'Lagos'}, Nigeria</span>
                              </div>
                            </td>

                            {/* Email Status */}
                            <td className="py-3.5 px-4">
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Verified
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Clock className="w-3 h-3" />
                                    Unverified
                                  </span>
                                  <button
                                    onClick={() => handleVerifyEmailManually(u.id)}
                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                                    title="Manually verify email"
                                  >
                                    Verify
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Access Status (Allow vs Restrict) */}
                            <td className="py-3.5 px-4">
                              {isSuspended ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                  <Ban className="w-3 h-3" />
                                  RESTRICTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            {/* Assigned Plan */}
                            <td className="py-3.5 px-4">
                              <select
                                value={tier}
                                disabled={isSuperAdmin}
                                onChange={(e) => handleUpdateSubscription(u.id, e.target.value as any)}
                                className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-950 text-slate-200 border border-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="free_trial">30-Day Free Trial (₦0)</option>
                                <option value="per_boq">Single BOQ Pass (₦3,000)</option>
                                <option value="monthly">Professional Monthly (₦50,000)</option>
                                <option value="yearly">Corporate Annual (₦400,000)</option>
                                <option value="lifetime_license">Enterprise Lifetime (₦2,000,000)</option>
                              </select>
                            </td>

                            {/* Service Limits */}
                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => openServiceModal(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition cursor-pointer"
                              >
                                <Sliders className="w-3 h-3 text-emerald-400" />
                                <span>Limit Services</span>
                              </button>
                            </td>

                            {/* Actions (Allow/Restrict & Delete) */}
                            <td className="py-3.5 px-4 text-right">
                              {!isSuperAdmin && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {isSuspended ? (
                                    <button
                                      onClick={() => handleUpdateAccess(u.id, 'active')}
                                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                      title="Unrestrict user"
                                    >
                                      <Unlock className="w-3 h-3" />
                                      <span>Allow</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateAccess(u.id, 'suspended')}
                                      className="px-2.5 py-1 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs border border-red-700/60"
                                      title="Restrict user from using system"
                                    >
                                      <Ban className="w-3 h-3" />
                                      <span>Restrict</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    className="p-1.5 bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 rounded-lg transition cursor-pointer"
                                    title="Delete account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: PAYMENT SYSTEM & APPROVALS */}
        {/* ================================================================= */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {/* Top filter bar */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Incoming Payment Submissions &amp; Plan Activations</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify bank transfer receipts, confirm credit to Access Bank (Isaac Emmanuel: 081515121), and approve plans.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="px-2 text-slate-500 text-[11px] font-semibold">Filter:</span>
                {(['all', 'pending', 'approved', 'rejected'] as const).map((pst) => (
                  <button
                    key={pst}
                    onClick={() => setPaymentStatusFilter(pst)}
                    className={`px-3 py-1 rounded-lg text-xs capitalize font-medium transition cursor-pointer ${
                      paymentStatusFilter === pst ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pst}
                  </button>
                ))}
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Plan Requested</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Transfer Reference</th>
                      <th className="py-3 px-4">Sender Details</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="font-semibold text-slate-400">No payment records found.</p>
                          <p className="text-[11px] text-slate-500 mt-1">Users submitting bank transfers via Subscription Billing will appear here for verification.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => {
                        const isPending = p.status === 'pending';
                        const isApproved = p.status === 'approved';

                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* User */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white">{p.user_name || p.current_user_name || 'QS User'}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.user_email}</div>
                            </td>

                            {/* Plan Requested */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-emerald-400">{p.plan_name}</span>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.plan_id}</div>
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                              {formatNaira(p.amount_naira)}
                            </td>

                            {/* Transfer Reference */}
                            <td className="py-3.5 px-4 font-mono text-xs">
                              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 select-all">
                                {p.transfer_reference}
                              </span>
                            </td>

                            {/* Sender Details */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-200 font-medium">{p.sender_name}</div>
                              <div className="text-slate-400 text-[10px]">{p.sender_bank}</div>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {p.transfer_date || (p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent')}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  APPROVED
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3" />
                                  PENDING APPROVAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                  REJECTED
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleApprovePayment(p.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(p.id)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">
                                  {p.verified_by ? `By ${p.verified_by}` : 'Completed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: LOGIN ACTIVITIES AUDIT LOG */}
        {/* ================================================================= */}
        {activeTab === 'logins' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time User Login Activities &amp; Security Audits</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete audit log of authentication timestamps, IP addresses, client devices, and authorization statuses.
                </p>
              </div>

              <button
                onClick={fetchAdminData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Device &amp; Browser</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {loginActivities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                          No login history records found in database.
                        </td>
                      </tr>
                    ) : (
                      loginActivities.map((act) => {
                        const isSuccess = act.status?.toLowerCase().includes('success');
                        const isMasterKey = act.status?.includes('master_admin_key');

                        return (
                          <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Timestamp */}
                            <td className="py-3 px-4 text-slate-400">
                              {act.created_at ? new Date(act.created_at).toLocaleString() : 'Recent'}
                            </td>

                            {/* User Name */}
                            <td className="py-3 px-4 font-sans font-bold text-white">
                              {act.user_name || 'QS User'}
                            </td>

                            {/* Email */}
                            <td className="py-3 px-4 text-emerald-400">
                              {act.user_email}
                            </td>

                            {/* IP */}
                            <td className="py-3 px-4 text-slate-300">
                              {act.ip_address || '127.0.0.1 (Local)'}
                            </td>

                            {/* User Agent */}
                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={act.user_agent}>
                              <div className="flex items-center gap-1.5 font-sans">
                                <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{act.user_agent ? act.user_agent.slice(0, 45) + '...' : 'Browser Client'}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-right font-sans">
                              {isMasterKey ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  MASTER KEY ACCESS
                                </span>
                              ) : isSuccess ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  SUCCESS
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                  {act.status.toUpperCase()}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: COLLEAGUE INVITE & SUBSCRIPTION RULES */}
        {/* ================================================================= */}
        {activeTab === 'invite' && (
          <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                Colleague Testing &amp; Feedback Link Generator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Share this direct onboarding link with your quantity surveying colleagues so they can immediately sign up, test their estimating workflows, and report feedbacks directly to you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div
                onClick={() => setInvitePresetPlan('free_trial')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  invitePresetPlan === 'free_trial'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-emerald-400">30-Day Free Trial</div>
                <div className="text-[11px] font-mono text-white mt-0.5">₦0 / 30 Days</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">Allows full evaluation and reviewing BOQ generation speed.</div>
              </div>

              <div
                onClick={() => setInvitePresetPlan('per_boq')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  invitePresetPlan === 'per_boq'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-blue-400">Single BOQ Pass</div>
                <div className="text-[11px] font-mono text-white mt-0.5">₦3,000 / Project</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">One-off full AI drawing takeoff &amp; BOQ export pass.</div>
              </div>

              <div
                onClick={() => setInvitePresetPlan('monthly')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  invitePresetPlan === 'monthly'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-emerald-300">Professional Monthly</div>
                <div className="text-[11px] font-mono text-white mt-0.5">₦50,000 / Month</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">Unlimited BOQs, IPCs, valuations, and rate database.</div>
              </div>

              <div
                onClick={() => setInvitePresetPlan('yearly')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  invitePresetPlan === 'yearly'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-amber-400">Corporate Annual</div>
                <div className="text-[11px] font-mono text-white mt-0.5">₦400,000 / Year</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">Full enterprise suite with NIQS stamp &amp; executive dossier.</div>
              </div>

              <div
                onClick={() => setInvitePresetPlan('lifetime_license')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  invitePresetPlan === 'lifetime_license'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-purple-400">Enterprise Lifetime</div>
                <div className="text-[11px] font-mono text-white mt-0.5">₦2,000,000 Once</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">Permanent perpetual license with zero recurring renewals.</div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-400 block">Generated Testing Invitation URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getColleagueInviteLink()}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none select-all"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedInvite ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Important: Official Live Cloud Web Address</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your live application is securely deployed on Google Cloud Run. Please ensure colleagues click the exact copied URL above. Do <strong>not</strong> manually type or share <code>letsestimate.ai.studio</code>, as <code>.ai.studio</code> is not a valid hosting domain and will cause a &quot;Page not found&quot; error.
                </p>
              </div>

              <p className="text-[11px] text-slate-500">
                Tip: Send this link via WhatsApp, LinkedIn, or Email. When colleagues register through this URL, their selected plan is provisioned.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ================================================================= */}
      {/* MODAL: GRANULAR SERVICE LIMITATIONS PER USER */}
      {/* ================================================================= */}
      {serviceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Service Permissions &amp; Limits</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure feature restrictions for <strong>{serviceModalUser.full_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setServiceModalUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServices} className="space-y-4">
              
              {/* Feature Toggles */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                
                {/* AI Takeoff */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-200">AI Drawing Takeoff &amp; OCR</span>
                    <p className="text-[11px] text-slate-500">Extracts quantities from PDF &amp; image architectural plans</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.can_ai_takeoff === 1}
                    onChange={(e) => setServiceForm({ ...serviceForm, can_ai_takeoff: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                {/* Valuations */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-900">
                  <div>
                    <span className="font-bold text-slate-200">Valuation Certificates &amp; Payments</span>
                    <p className="text-[11px] text-slate-500">Certify interim contractor valuations &amp; retention</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.can_valuations === 1}
                    onChange={(e) => setServiceForm({ ...serviceForm, can_valuations: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                {/* Variations */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-900">
                  <div>
                    <span className="font-bold text-slate-200">Variations &amp; Site Change Orders</span>
                    <p className="text-[11px] text-slate-500">Track omission &amp; addition variation orders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.can_variations === 1}
                    onChange={(e) => setServiceForm({ ...serviceForm, can_variations: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                {/* PDF/Excel Export */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-900">
                  <div>
                    <span className="font-bold text-slate-200">Official PDF &amp; Excel Exports</span>
                    <p className="text-[11px] text-slate-500">Generate certified NIQS bills and spreadsheets</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.can_export_pdf_excel === 1}
                    onChange={(e) => setServiceForm({ ...serviceForm, can_export_pdf_excel: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                {/* Rates Library */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-900">
                  <div>
                    <span className="font-bold text-slate-200">Full BESMM4 Rates Engine</span>
                    <p className="text-[11px] text-slate-500">Access Lagos, Port Harcourt, and Abuja market price libraries</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.can_rates_library === 1}
                    onChange={(e) => setServiceForm({ ...serviceForm, can_rates_library: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                {/* Team Collaboration */}
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-900">
                  <div>
                    <span className="font-bold text-slate-200">Team Collaboration &amp; Client Shares</span>
                    <p className="text-[11px] text-slate-500">Invite reviewer colleagues and share tenders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={serviceForm.can_team_collab === 1}
                    onChange={(e) => setServiceForm({ ...serviceForm, can_team_collab: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>
              </div>

              {/* Max Projects Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maximum Concurrent Projects Allowed
                </label>
                <select
                  value={serviceForm.max_projects}
                  onChange={(e) => setServiceForm({ ...serviceForm, max_projects: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={3}>3 Projects (Trial limit)</option>
                  <option value={10}>10 Projects (Standard)</option>
                  <option value={25}>25 Projects (Professional)</option>
                  <option value={100}>100 Projects (Corporate)</option>
                  <option value={9999}>Unlimited (Enterprise / VIP)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceModalUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingServices}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSavingServices ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
