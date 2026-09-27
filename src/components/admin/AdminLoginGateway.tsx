/**
 * Let's Estimate - Dedicated Separate Admin Portal Gateway
 * Secure access gateway for Emmanuel Isaac (Lead QS) and platform administrators.
 * Isolated from public customer authentication routes.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  Mail,
  ShieldAlert
} from 'lucide-react';

interface AdminLoginGatewayProps {
  onBackToApp: () => void;
  onAdminAuthenticated: () => void;
}

export const AdminLoginGateway: React.FC<AdminLoginGatewayProps> = ({
  onBackToApp,
  onAdminAuthenticated
}) => {
  const { loginWithAdminKey, login } = useAuth();
  const [authMode, setAuthMode] = useState<'key' | 'credentials'>('key');
  const [adminKey, setAdminKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setError('Please enter your Master Super Admin Key.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await loginWithAdminKey(adminKey.trim());
      setIsLoading(false);
      if (res.success) {
        setSuccess('Master Admin Access Granted. Redirecting to Command Center...');
        setTimeout(() => {
          onAdminAuthenticated();
        }, 800);
      } else {
        setError(res.error || 'Access Denied: Invalid Master Admin Key.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Authentication error.');
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter admin email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      setIsLoading(false);
      if (res.success) {
        if (res.user?.role === 'superadmin' || res.user?.role === 'admin' || res.user?.email === 'emmanuelisaac888@gmail.com') {
          setSuccess('Administrator Authenticated. Loading Dashboard...');
          setTimeout(() => {
            onAdminAuthenticated();
          }, 800);
        } else {
          setError('Access Denied: Account lacks administrative privileges.');
        }
      } else {
        setError(res.error || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background cyber grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Top Header & Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Restricted Internal Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Command Gateway
          </h1>
          <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
            Segregated administrative portal for Lead QS Isaac Emmanuel. Unauthorized access attempts are monitored and recorded.
          </p>
        </div>

        {/* Security Box */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMode('key'); setError(null); }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                authMode === 'key' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Master Admin Key</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('credentials'); setError(null); }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                authMode === 'credentials' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Credentials</span>
            </button>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="font-mono">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* FORM: MASTER ADMIN KEY */}
          {authMode === 'key' ? (
            <form onSubmit={handleKeyLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Enter Master Super Admin Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    required
                    autoFocus
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="QS-MASTER-KEY-2026-..."
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Cryptographic Master Key issued exclusively to Principal QS Isaac Emmanuel.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !adminKey.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying Security Key...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Unlock Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORM: CREDENTIALS */
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="emmanuelisaac888@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Authorize Admin Session</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onBackToApp}
              className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Let&apos;s Estimate Platform</span>
            </button>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div className="mt-8 text-center text-[11px] text-slate-500">
          <p>Let&apos;s Estimate Construction Platform &bull; Security Level 4 &bull; End-to-End Encrypted</p>
          <p className="mt-1 text-slate-600">Session IP and hardware signatures are recorded upon authorization.</p>
        </div>

      </div>
    </div>
  );
};
