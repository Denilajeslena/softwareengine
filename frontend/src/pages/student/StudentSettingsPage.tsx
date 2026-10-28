import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import {
  fetchStudentPreferencesApi,
  saveStudentPreferencesApi,
  StudentPreferences,
} from '@/services/student';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
  Bell,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export const StudentSettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<StudentPreferences>({
    emailDueReminders: true,
    holdArrivalAlerts: true,
    acquisitionsDigest: false,
    fontSize: 'medium',
    theme: 'dark-emerald',
  });

  const [initialPreferences, setInitialPreferences] = useState<StudentPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchStudentPreferencesApi();
    if (res.success && res.data?.preferences) {
      setPreferences(res.data.preferences);
      setInitialPreferences(res.data.preferences);
    } else {
      setErrorMessage(res.message || 'Failed to load preferences from library profile.');
    }
    setLoading(false);
  };

  const handleReset = () => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
      setSavedNotice('Preferences reset to saved server profile.');
      setTimeout(() => setSavedNotice(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedNotice(null);

    const res = await saveStudentPreferencesApi(preferences);
    if (res.success && res.data?.preferences) {
      setPreferences(res.data.preferences);
      setInitialPreferences(res.data.preferences);
      setSavedNotice('Communication and display preferences saved to your university account.');
      setTimeout(() => setSavedNotice(null), 4000);
    } else {
      setErrorMessage(res.message || 'Failed to save preferences.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
        <p className="text-sm text-charcoal-muted">Retrieving patron account preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-3xl">
      <PageHeader
        title="Account Preferences & Settings"
        subtitle="Manage communication preferences, circulation alert notifications, and catalog reading display options."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-parchment-dark text-xs font-medium text-forest hover:bg-parchment-light transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
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
              {saving ? 'Saving...' : 'Save Preferences'}
            </PrimaryButton>
          </div>
        }
      />

      {savedNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-parchment-dark/70 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-parchment-dark/50">
            <Bell className="h-4 w-4 text-forest" />
            <h3 className="font-serif font-bold text-sm text-forest-dark">
              Circulation Notices & Delivery Channels
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-parchment-light/30 transition-colors">
              <input
                type="checkbox"
                checked={preferences.emailDueReminders}
                onChange={(e) =>
                  setPreferences({ ...preferences, emailDueReminders: e.target.checked })
                }
                className="mt-0.5 rounded text-forest focus:ring-forest border-parchment-dark h-4 w-4"
              />
              <div>
                <span className="font-semibold text-charcoal block">Email Due Date Reminders</span>
                <span className="text-charcoal-muted">
                  Receive automated email notices 3 days and 24 hours prior to loan expiry.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-parchment-light/30 transition-colors">
              <input
                type="checkbox"
                checked={preferences.holdArrivalAlerts}
                onChange={(e) =>
                  setPreferences({ ...preferences, holdArrivalAlerts: e.target.checked })
                }
                className="mt-0.5 rounded text-forest focus:ring-forest border-parchment-dark h-4 w-4"
              />
              <div>
                <span className="font-semibold text-charcoal block">Hold Arrival Desk Alerts</span>
                <span className="text-charcoal-muted">
                  Immediate dispatch when a reserved volume is returned and ready for pickup at circulation.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-parchment-light/30 transition-colors">
              <input
                type="checkbox"
                checked={preferences.acquisitionsDigest}
                onChange={(e) =>
                  setPreferences({ ...preferences, acquisitionsDigest: e.target.checked })
                }
                className="mt-0.5 rounded text-forest focus:ring-forest border-parchment-dark h-4 w-4"
              />
              <div>
                <span className="font-semibold text-charcoal block">New Acquisitions Digest</span>
                <span className="text-charcoal-muted">
                  Monthly digest of newly catalogued volumes in your enrolled department or faculty.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Display & Accessibility Preferences */}
        <div className="bg-white rounded-xl border border-parchment-dark/70 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-parchment-dark/50">
            <Eye className="h-4 w-4 text-forest" />
            <h3 className="font-serif font-bold text-sm text-forest-dark">
              Display & Reading Aesthetics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-charcoal mb-1">Text Font Size</label>
              <select
                value={preferences.fontSize}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    fontSize: e.target.value as 'small' | 'medium' | 'large',
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-parchment-dark bg-white focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="small">Standard (Compact)</option>
                <option value="medium">Medium (Comfortable)</option>
                <option value="large">Large (High Legibility)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-charcoal mb-1">Catalogue Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    theme: e.target.value as 'dark-emerald' | 'warm-gold' | 'monochrome',
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-parchment-dark bg-white focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="dark-emerald">Deep Forest & Warm Ivory</option>
                <option value="warm-gold">Scholar's Antique Gold</option>
                <option value="monochrome">Academic High-Contrast</option>
              </select>
            </div>
          </div>
        </div>

        {/* Persistence Status */}
        <div className="p-4 rounded-xl bg-forest-dark/5 border border-forest-dark/10 flex items-center justify-between text-xs text-charcoal-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-forest" />
            <span>Persisted to Student Account in Database across sessions</span>
          </div>
          <PrimaryButton size="sm" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};
