import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import {
  fetchCirculationPolicyApi,
  updateCirculationPolicyApi,
  CirculationPolicy,
} from '@/services/admin';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  BookOpen,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

export const AdminLibraryConfigPage: React.FC = () => {
  const [policy, setPolicy] = useState<CirculationPolicy>({
    loan_duration_days: 14,
    max_active_loans: 5,
    renewal_limit: 2,
    renewal_duration_days: 14,
    overdue_fine_per_day: 0.5,
    reservation_hold_days: 3,
    pickup_window_hours: 48,
    max_reservations_per_student: 3,
  });

  const [initialPolicy, setInitialPolicy] = useState<CirculationPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchCirculationPolicyApi();
    if (res.success && res.data?.policy) {
      setPolicy(res.data.policy);
      setInitialPolicy(res.data.policy);
    } else {
      setErrorMessage(res.message || 'Failed to retrieve active circulation policy.');
    }
    setLoading(false);
  };

  const handleInputChange = (field: keyof CirculationPolicy, value: number) => {
    setPolicy((prev) => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value,
    }));
  };

  const handleReset = () => {
    if (initialPolicy) {
      setPolicy(initialPolicy);
      setSuccessMessage('Policy form reset to last saved server values.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await updateCirculationPolicyApi(policy);
    if (res.success && res.data?.policy) {
      setPolicy(res.data.policy);
      setInitialPolicy(res.data.policy);
      setSuccessMessage(
        `Circulation policy updated and persistently enforced in database (Updated by ${res.data.policy.updated_by || 'Admin'}).`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setErrorMessage(res.message || 'Failed to update circulation policy.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
        <p className="text-sm text-charcoal-muted font-sans">
          Loading library circulation parameters...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-5xl">
      <PageHeader
        title="Library Circulation Rules & Policy"
        subtitle="Global governance rules governing loan durations, renewal limits, overdue fine rates, and reservation queues."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-parchment-dark text-xs font-medium text-forest hover:bg-parchment-light transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Saved
            </button>
            <PrimaryButton
              size="sm"
              onClick={handleSave}
              disabled={saving}
              leftIcon={
                saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )
              }
            >
              {saving ? 'Saving...' : 'Save Circulation Policy'}
            </PrimaryButton>
          </div>
        }
      />

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Loan Term Section */}
        <div className="bg-white rounded-xl border border-parchment-dark/70 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-parchment-light/40 border-b border-parchment-dark/50 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-forest" />
            <h2 className="text-sm font-serif font-bold text-forest-dark">
              Standard Loan & Concurrent Borrowing Allowance
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Standard Loan Duration (Days)
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Default checkout period for undergraduate and postgraduate student patrons.
              </p>
              <input
                type="number"
                min="1"
                max="90"
                value={policy.loan_duration_days}
                onChange={(e) => handleInputChange('loan_duration_days', parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Maximum Active Loans Per Student
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Maximum physical volumes a single scholar can have checked out concurrently.
              </p>
              <input
                type="number"
                min="1"
                max="20"
                value={policy.max_active_loans}
                onChange={(e) => handleInputChange('max_active_loans', parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Renewals and Fines */}
        <div className="bg-white rounded-xl border border-parchment-dark/70 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-parchment-light/40 border-b border-parchment-dark/50 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-forest" />
            <h2 className="text-sm font-serif font-bold text-forest-dark">
              Renewal Limits & Overdue Penalties
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Max Allowed Renewals
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Times an active loan can be extended if no reservations exist.
              </p>
              <input
                type="number"
                min="0"
                max="5"
                value={policy.renewal_limit}
                onChange={(e) => handleInputChange('renewal_limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Renewal Duration (Days)
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Days added to due date per approved renewal operation.
              </p>
              <input
                type="number"
                min="1"
                max="30"
                value={policy.renewal_duration_days}
                onChange={(e) =>
                  handleInputChange('renewal_duration_days', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Overdue Fine Rate ($/Day)
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Daily penalty assessed per overdue volume.
              </p>
              <input
                type="number"
                step="0.05"
                min="0"
                max="10"
                value={policy.overdue_fine_per_day}
                onChange={(e) =>
                  handleInputChange('overdue_fine_per_day', parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Hold and Reservations Queue */}
        <div className="bg-white rounded-xl border border-parchment-dark/70 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-parchment-light/40 border-b border-parchment-dark/50 flex items-center gap-2">
            <Clock className="h-4 w-4 text-forest" />
            <h2 className="text-sm font-serif font-bold text-forest-dark">
              Reservation Queue & Desk Hold Window
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Hold Duration (Days)
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Days a returned item is held at circulation desk for the next student.
              </p>
              <input
                type="number"
                min="1"
                max="14"
                value={policy.reservation_hold_days}
                onChange={(e) =>
                  handleInputChange('reservation_hold_days', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Pickup Window (Hours)
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Grace period notification window before releasing hold to the next in queue.
              </p>
              <input
                type="number"
                min="12"
                max="168"
                value={policy.pickup_window_hours}
                onChange={(e) =>
                  handleInputChange('pickup_window_hours', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Max Concurrent Holds
              </label>
              <p className="text-[11px] text-charcoal-muted mb-2">
                Maximum active reservations a single student can place.
              </p>
              <input
                type="number"
                min="1"
                max="10"
                value={policy.max_reservations_per_student}
                onChange={(e) =>
                  handleInputChange('max_reservations_per_student', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Policy Metadata Footer */}
        <div className="p-4 rounded-xl bg-forest-dark/5 border border-forest-dark/10 flex items-center justify-between text-xs text-charcoal-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-forest" />
            <span>
              Governance State: Persistent DB Storage (MongoDB with automatic in-memory fallback)
            </span>
          </div>
          <div>
            {policy.updated_at && (
              <span>Last updated: {new Date(policy.updated_at).toLocaleString()}</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
