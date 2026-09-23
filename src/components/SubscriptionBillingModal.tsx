import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Copy, Check, Clock, AlertTriangle, ShieldCheck, 
  ExternalLink, ArrowRight, Building, Sparkles, X, RefreshCw, Smartphone
} from 'lucide-react';
import { ISAAC_BANK_DETAILS, SubscriptionPlan, PaymentTransfer, UserSubscriptionInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { safeFetchJson } from '../utils/api';

interface SubscriptionBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionBillingModal: React.FC<SubscriptionBillingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscriptionInfo | null>(null);
  const [transfers, setTransfers] = useState<PaymentTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form state for payment proof
  const [selectedPlanId, setSelectedPlanId] = useState<string>('monthly');
  const [senderName, setSenderName] = useState(user?.full_name || '');
  const [senderBank, setSenderBank] = useState('GTBank / Zenith / Access');
  const [transferRef, setTransferRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Load plans
      const { ok: okPlans, data: plansData } = await safeFetchJson<{ plans: SubscriptionPlan[] }>('/api/subscription/plans');
      if (okPlans && plansData?.plans) {
        setPlans(plansData.plans);
      }

      // 2. Load current subscription status
      const { ok: okSub, data: subData } = await safeFetchJson<{ subscription: UserSubscriptionInfo }>('/api/subscription/status', { headers });
      if (okSub && subData?.subscription) {
        setSubscription(subData.subscription);
      }

      // 3. Load past transfers
      const { ok: okTx, data: txData } = await safeFetchJson<{ transfers: PaymentTransfer[] }>('/api/subscription/transfers', { headers });
      if (okTx && txData?.transfers) {
        setTransfers(txData.transfers);
      }
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmitProof = async (e: React.FormEvent, autoApprove = false) => {
    e.preventDefault();
    if (!transferRef || !senderName) {
      setSubmitError('Please enter sender name and transaction reference.');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlanId) || plans[1];

    try {
      setSubmitting(true);
      setSubmitError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const { ok, data, error } = await safeFetchJson<{ success: boolean; message: string; error?: string }>('/api/subscription/bank-transfer', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan_id: plan.id,
          plan_name: plan.name,
          amount_naira: plan.priceNaira,
          transfer_reference: transferRef,
          sender_name: senderName,
          sender_bank: senderBank,
          notes,
          autoApprove
        })
      });

      if (!ok) {
        throw new Error(data?.error || error || 'Failed to submit payment');
      }

      setSubmitSuccess(data.message || 'Payment proof submitted successfully.');
      setTransferRef('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="subscription-modal"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-6 py-5 flex items-center justify-between border-b border-emerald-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Subscription, Licensing & Bank Transfer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400 text-slate-950">
                  Access Bank
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Official billing account of lead consultant Isaac Emmanuel (081515121)
              </p>
            </div>
          </div>
          <button
            id="close-subscription-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* 7-Day Free Trial & Current Status Card */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-900">Your Current Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    subscription?.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {subscription?.tier === 'lifetime_license' ? 'Enterprise Lifetime License' :
                     subscription?.tier === 'monthly' ? 'Professional Monthly' :
                     subscription?.tier === 'yearly' ? 'Corporate Annual' :
                     subscription?.isTrial ? (subscription.trialExpired ? 'Trial Expired' : '7-Day Free Trial') : 'Active Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {subscription?.isTrial ? (
                    subscription.trialExpired ? (
                      <span className="text-red-700 font-semibold">Your 7-day free trial has expired. Subscribe to continue generating full AI BOQs.</span>
                    ) : (
                      <span>You have <strong className="text-emerald-700 font-bold">{subscription.trialDaysRemaining} days remaining</strong> on your complimentary trial period.</span>
                    )
                  ) : subscription?.tier === 'lifetime_license' ? (
                    <span className="text-emerald-700 font-semibold">Perpetual License Active: {subscription.licenseKey || 'LE-2026-QS-PERMANENT'}</span>
                  ) : (
                    <span>Subscription active until: <strong>{subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Active'}</strong></span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Official Bank Account Details Box (Isaac Emmanuel) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-amber-800" />
                <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                  Bank Transfer Payment Information (Nigeria)
                </h3>
              </div>
              <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                Instant / Fast Bank Verification
              </span>
            </div>

            <p className="text-xs text-amber-900/90 mt-2.5">
              Make a direct bank transfer or USSD payment from any Nigerian bank (GTBank, Zenith, FirstBank, Kuda, OPay, UBA) to:
            </p>

            {/* 3 Copyable Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {/* Bank Name */}
              <div className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bank Name</span>
                  <span className="text-sm font-bold text-slate-900">{ISAAC_BANK_DETAILS.bankName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ISAAC_BANK_DETAILS.bankName, 'bank')}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition"
                  title="Copy Bank"
                >
                  {copiedField === 'bank' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Account Number */}
              <div className="bg-white p-3 rounded-lg border-2 border-emerald-600/70 bg-emerald-50/30 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Account Number</span>
                  <span className="text-base font-extrabold text-emerald-950 tracking-wider font-mono">
                    {ISAAC_BANK_DETAILS.accountNumber}
                  </span>
                </div>
                <button
                  type="button"
                  id="copy-account-number-btn"
                  onClick={() => copyToClipboard(ISAAC_BANK_DETAILS.accountNumber, 'account')}
                  className="px-2 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition flex items-center space-x-1"
                  title="Copy Account Number"
                >
                  {copiedField === 'account' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'account' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Account Name */}
              <div className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Beneficiary Name</span>
                  <span className="text-sm font-bold text-slate-900">{ISAAC_BANK_DETAILS.accountName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ISAAC_BANK_DETAILS.accountName, 'name')}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition"
                  title="Copy Account Name"
                >
                  {copiedField === 'name' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <span>Select Subscription or Licensing Plan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`cursor-pointer rounded-xl p-4 border transition flex flex-col justify-between relative ${
                      isSelected 
                        ? 'border-2 border-emerald-600 bg-emerald-50/40 shadow-md ring-1 ring-emerald-500' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-2xs">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-xl sm:text-2xl font-black text-slate-900">
                          ₦{p.priceNaira.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          /{p.billingInterval === 'single' ? 'boq' : p.billingInterval === 'lifetime' ? 'once' : p.billingInterval}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                        {p.description}
                      </p>

                      <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                        {p.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="text-[11px] text-slate-700 flex items-start space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-2">
                      <div className={`w-full py-1.5 rounded-lg text-xs font-bold text-center transition ${
                        isSelected 
                          ? 'bg-emerald-700 text-white' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}>
                        {isSelected ? 'Plan Selected' : 'Choose Plan'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to submit bank transfer proof */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Submit Proof of Bank Transfer
                </h4>
                <p className="text-xs text-slate-500">
                  After transferring ₦{currentPlan?.priceNaira.toLocaleString() || '0'} to Access Bank (081515121), enter your transaction reference below:
                </p>
              </div>
            </div>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleSubmitProof(e, false)} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sender Full Name (as on your bank account) *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Emmanuel Isaac"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sender Bank *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    placeholder="e.g. GTBank / Zenith / FirstBank"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Reference / Session ID / Narration *
                  </label>
                  <input
                    type="text"
                    required
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="e.g. TRF-81515121-09823 or Session ID"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Notes or WhatsApp Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. +234 803 000 0000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500">
                  Transfers are reviewed by Lead QS Isaac Emmanuel. For urgent activation, notify directly via WhatsApp.
                </p>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  {/* Instant Verification Button (for instant testing/activation) */}
                  <button
                    type="button"
                    onClick={(e) => handleSubmitProof(e, true)}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition shrink-0"
                    title="Simulate instant verification for testing"
                  >
                    Instant Activate
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 shadow-sm transition flex items-center justify-center space-x-1.5"
                  >
                    {submitting ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <span>Submit Bank Proof</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Past Transactions / Transfers History */}
          {transfers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Your Payment History
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Amount (₦)</th>
                      <th className="px-3 py-2">Reference</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-900">{t.plan_name}</td>
                        <td className="px-3 py-2 font-mono">₦{t.amount_naira.toLocaleString()}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{t.transfer_reference}</td>
                        <td className="px-3 py-2 text-[11px] text-slate-500">{t.transfer_date || t.created_at?.split('T')[0]}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : t.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Let's Estimate • Access Bank Account: 081515121 (Isaac Emmanuel)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
