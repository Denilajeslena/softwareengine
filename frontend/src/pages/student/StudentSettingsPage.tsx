import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { CheckCircle2 } from 'lucide-react';

export const StudentSettingsPage: React.FC = () => {
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSave = () => {
    setSavedNotice('Communication preferences and notification thresholds updated successfully.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 text-left max-w-3xl">
      <PageHeader
        title="Account Preferences"
        subtitle="Manage communication preferences, circulation alert frequencies, and reading interests."
      />

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-6">
        <h3 className="font-serif font-bold text-base text-forest-dark pb-2 border-b border-ivory-cream">
          Notification Preferences
        </h3>

        <div className="space-y-4 text-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="rounded text-forest focus:ring-gold h-4 w-4"
            />
            <div>
              <span className="font-semibold text-charcoal block">Email Due Date Reminders</span>
              <span className="text-charcoal-muted">Receive email notices 3 days prior to due dates</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="rounded text-forest focus:ring-gold h-4 w-4"
            />
            <div>
              <span className="font-semibold text-charcoal block">Hold Arrival Alerts</span>
              <span className="text-charcoal-muted">Immediate notification when a requested book is ready at circulation</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="rounded text-forest focus:ring-gold h-4 w-4"
            />
            <div>
              <span className="font-semibold text-charcoal block">New Acquisitions Digest</span>
              <span className="text-charcoal-muted">Monthly digest of new volumes added to your enrolled disciplines</span>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-ivory-cream flex items-center justify-between">
          <span className="text-xs text-charcoal-muted italic">Preferences sync to your active profile</span>
          <PrimaryButton
            size="sm"
            onClick={handleSave}
          >
            Save Preferences
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
