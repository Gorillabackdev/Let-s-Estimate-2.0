/**
 * Let's Estimate - Authentication Modal Component
 * Modern, accessible modal for Registration, Login, Google Sign-in, and Password Recovery.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { safeFetchJson } from '../../utils/api';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Building2, 
  Briefcase, 
  MapPin, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Lagos', 'Rivers (Port Harcourt)', 'Abuja (FCT)', 'Delta (Warri/Asaba)',
  'Edo (Benin)', 'Akwa Ibom (Uyo)', 'Enugu', 'Anambra (Onitsha/Awka)',
  'Oyo (Ibadan)', 'Kano', 'Kaduna', 'Ogun', 'Imo (Owerri)', 'Other State'
];

const PROFESSIONS = [
  'Registered Quantity Surveyor (NIQS)',
  'Building Contractor / Estimator',
  'Civil / Structural Engineer',
  'Architect',
  'Project Manager',
  'Real Estate Developer / Investor',
  'Subcontractor / Tradesman'
];

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    authModalView, 
    closeAuthModal, 
    openAuthModal, 
    login, 
    register, 
    loginWithGoogle, 
    quickDemoLogin 
  } = useAuth();

  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'verify'>(authModalView);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProfession, setRegProfession] = useState(PROFESSIONS[0]);
  const [regCompany, setRegCompany] = useState('');
  const [regState, setRegState] = useState('Lagos');

  // Verify / Reset code
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedDemoCode, setGeneratedDemoCode] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Sync modal view when triggered from context
  React.useEffect(() => {
    setView(authModalView);
    setError(null);
    setSuccessMsg(null);
  }, [authModalView, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const res = await login(loginEmail, loginPassword);
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setIsSubmitting(true);
    const res = await register({
      full_name: regFullName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      profession: regProfession,
      company: regCompany,
      state: regState,
      country: 'Nigeria',
    });
    setIsSubmitting(false);
    if (res.success) {
      if (res.verificationCode) {
        setGeneratedDemoCode(res.verificationCode);
        setVerifyEmail(regEmail);
        setView('verify');
        setSuccessMsg(`Account created! Your verification PIN is ${res.verificationCode}.`);
      }
    } else {
      setError(res.error || 'Failed to create account.');
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    setIsSubmitting(true);
    // Simulate real Google Identity click with account confirmation
    const emailPrompt = prompt('Enter your Google email for instant sign-in:', 'emmanuelisaac888@gmail.com');
    if (!emailPrompt) {
      setIsSubmitting(false);
      return;
    }
    const namePrompt = prompt('Enter your full name:', 'Emmanuel Isaac, MNIQS');
    const res = await loginWithGoogle(emailPrompt, namePrompt || 'Google User');
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Google sign in failed');
    }
  };

  const handleDemoQSLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await quickDemoLogin();
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Demo login failed');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<{ success: boolean; error?: string }>('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail || regEmail, code: verificationCode }),
      });
      setIsSubmitting(false);
      if (ok && data?.success) {
        setSuccessMsg('Email verified successfully! You can now use all features.');
        setTimeout(() => {
          closeAuthModal();
        }, 1500);
      } else {
        setError(data?.error || fetchErr || 'Invalid code');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Verification failed');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<{ success: boolean; resetCode?: string; error?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
      setIsSubmitting(false);
      if (ok && data?.success) {
        setSuccessMsg(`Reset code sent! Use code: ${data.resetCode || '123456'}`);
        setGeneratedDemoCode(data.resetCode || '123456');
        setVerificationCode(data.resetCode || '123456');
      } else {
        setError(data?.error || fetchErr || 'Failed to request reset');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Request failed');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<{ success: boolean; error?: string }>('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          code: verificationCode,
          newPassword: resetNewPassword,
        }),
      });
      setIsSubmitting(false);
      if (ok && data?.success) {
        setSuccessMsg('Password updated! Please sign in.');
        setTimeout(() => {
          setView('login');
          setSuccessMsg(null);
        }, 1500);
      } else {
        setError(data?.error || fetchErr || 'Password reset failed');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Reset failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8"
        id="auth-modal-card"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 text-white border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
              ₦
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight leading-none text-white">
                {view === 'login' && 'Sign In to Let\'s Estimate'}
                {view === 'register' && 'Create Estimator Account'}
                {view === 'forgot' && 'Reset Your Password'}
                {view === 'verify' && 'Verify Email Address'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                AI-Powered Construction Cost Estimating for Nigeria
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            id="close-auth-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo QS Banner (Only for quick testing) */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs text-amber-900 font-medium">
              Demo QS Account Available: <strong>emmanuelisaac888@gmail.com</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleDemoQSLogin}
            disabled={isSubmitting}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-300/80 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
            id="quick-qs-demo-btn"
          >
            <Zap className="w-3 h-3 fill-amber-600 text-amber-600" />
            Quick Demo Sign In
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="qs.estimator@company.ng"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    id="login-email-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-xs text-amber-700 hover:text-amber-800 font-medium"
                    id="forgot-password-link"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    id="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                id="submit-login-btn"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-neutral-500 font-medium">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2.5"
                id="google-signin-btn"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.4 7.5 23.5 12 23.5z" />
                </svg>
                Sign in with Google
              </button>

              <div className="pt-2 text-center text-xs text-neutral-600">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="font-bold text-amber-700 hover:text-amber-800"
                  id="switch-to-register-btn"
                >
                  Create one here
                </button>
              </div>
            </form>
          )}

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name & Titles
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Emmanuel Isaac, MNIQS"
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    id="register-fullname-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="qs@firm.ng"
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      id="register-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      id="register-phone-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Profession / Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={regProfession}
                    onChange={(e) => setRegProfession(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    id="register-profession-select"
                  >
                    {PROFESSIONS.map((prof) => (
                      <option key={prof} value={prof}>
                        {prof}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Company / Firm Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="e.g. Niger Delta Cost Consult"
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      id="register-company-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Primary State / Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                      id="register-state-select"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Create Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-10 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    id="register-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regPassword && (
                  <div className="mt-1.5">
                    <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength <= 25 ? 'bg-red-500 w-1/4' : strength <= 50 ? 'bg-amber-500 w-2/4' : strength <= 75 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">
                      Strength: {strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-neutral-500 leading-tight">
                By registering, you agree to the Quantity Surveying code of ethics and Let's Estimate Terms of Service.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                id="submit-register-btn"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <div className="pt-1 text-center text-xs text-neutral-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="font-bold text-amber-700 hover:text-amber-800"
                  id="switch-to-login-btn"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Enter Your Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="qs.estimator@company.ng"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    id="forgot-email-input"
                  />
                </div>
              </div>

              {!generatedDemoCode ? (
                <button
                  type="button"
                  onClick={handleForgotPasswordSubmit}
                  disabled={isSubmitting || !loginEmail}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                  id="request-reset-code-btn"
                >
                  {isSubmitting ? 'Requesting...' : 'Send 6-Digit Reset Code'}
                </button>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3 pt-2">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    Reset code generated: <strong>{generatedDemoCode}</strong>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-center font-mono tracking-widest text-lg"
                      id="reset-code-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      id="new-password-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !verificationCode || !resetNewPassword}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                    id="confirm-password-reset-btn"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password & Sign In'}
                  </button>
                </form>
              )}

              <div className="pt-2 text-center text-xs text-neutral-600">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="font-semibold text-neutral-700 hover:text-neutral-900"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* VIEW: EMAIL VERIFICATION */}
          {view === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-neutral-900">Verify Your Email Address</h4>
                <p className="text-xs text-neutral-600 mt-1">
                  We issued a verification code to <strong>{verifyEmail || regEmail}</strong>.
                </p>
                {generatedDemoCode && (
                  <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
                    Generated PIN: <strong>{generatedDemoCode}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 text-center text-xl font-mono tracking-widest border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  id="email-verification-code-input"
                />
              </div>

              {generatedDemoCode && (
                <button
                  type="button"
                  onClick={() => setVerificationCode(generatedDemoCode)}
                  className="w-full text-xs text-amber-700 font-semibold hover:underline"
                >
                  Auto-fill code ({generatedDemoCode})
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !verificationCode}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                id="submit-verify-code-btn"
              >
                {isSubmitting ? 'Verifying...' : 'Confirm Verification & Continue'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
