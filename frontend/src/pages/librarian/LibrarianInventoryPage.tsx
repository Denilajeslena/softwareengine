import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import {
  Boxes,
  MapPin,
  CheckCircle,
  Plus,
  Barcode,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck2,
  BookOpen,
} from 'lucide-react';
import {
  fetchInventoryOverviewApi,
  saveStackApi,
  submitInventoryAuditApi,
  InventoryOverviewData,
  InventoryAuditReport,
} from '@/services/inventory';

export const LibrarianInventoryPage: React.FC = () => {
  const [data, setData] = useState<InventoryOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add Stack Modal
  const [showStackModal, setShowStackModal] = useState(false);
  const [savingStack, setSavingStack] = useState(false);
  const [stackForm, setStackForm] = useState({
    name: '',
    category: 'Computer Science',
    floorLevel: 'Level 1',
    capacity: 800,
    description: '',
  });

  // Audit Reconciliation Modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedStackId, setSelectedStackId] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [auditing, setAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<InventoryAuditReport | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchInventoryOverviewApi();
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.stacks.length > 0 && !selectedStackId) {
        setSelectedStackId(res.data.stacks[0].id);
      }
    } else {
      setErrorMessage(res.message || 'Failed to retrieve physical stack inventory.');
    }
    setLoading(false);
  };

  const handleCreateStack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStack(true);
    setErrorMessage(null);

    const res = await saveStackApi(stackForm);
    if (res.success) {
      setSuccessMessage(`Stack section '${stackForm.name}' configured successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setShowStackModal(false);
      setStackForm({
        name: '',
        category: 'Computer Science',
        floorLevel: 'Level 1',
        capacity: 800,
        description: '',
      });
      loadInventory();
    } else {
      setErrorMessage(res.message || 'Failed to configure stack.');
    }
    setSavingStack(false);
  };

  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuditing(true);
    setErrorMessage(null);

    const barcodes = barcodeInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const res = await submitInventoryAuditApi(selectedStackId, barcodes, auditNotes);
    if (res.success && res.data?.auditReport) {
      setAuditReport(res.data.auditReport);
      setSuccessMessage(
        `Audit completed: ${res.data.auditReport.outcome} with ${res.data.auditReport.matchRate}% match rate.`
      );
      loadInventory();
    } else {
      setErrorMessage(res.message || 'Inventory audit execution failed.');
    }
    setAuditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
        <p className="text-sm text-charcoal-muted">Retrieving physical shelf inventory records...</p>
      </div>
    );
  }

  const stacks = data?.stacks || [];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Physical Stack & Inventory Control"
        subtitle="Live shelf capacity monitoring, manual/barcode reconciliation audits, and physical stack distribution."
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={() => {
                setAuditReport(null);
                setBarcodeInput('');
                setShowAuditModal(true);
              }}
              leftIcon={<Barcode className="h-3.5 w-3.5" />}
            >
              Run Inventory Audit
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={() => setShowStackModal(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Stack Section
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Shelf Units"
          value={`${data?.totalStacks || stacks.length} Stacks`}
          icon={<Boxes className="h-5 w-5" />}
          description={`Total capacity: ${data?.totalCapacity || 0} volumes`}
          isDemo={false}
        />
        <StatCard
          title="Physical Copies Catalogued"
          value={`${data?.totalPhysicalCopies || 0} Units`}
          icon={<BookOpen className="h-5 w-5" />}
          description={`${data?.availableCopies || 0} available on shelves`}
          isDemo={false}
        />
        <StatCard
          title="Average Utilization"
          value={`${data?.averageUtilization || 0}%`}
          icon={<MapPin className="h-5 w-5" />}
          description="Derived dynamically from catalog records"
          isDemo={false}
        />
        <StatCard
          title="Last Physical Audit"
          value={data?.lastAuditDate ? new Date(data.lastAuditDate).toLocaleDateString() : 'Pending'}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Barcode reconciliation logged in audit ledger"
          isDemo={false}
        />
      </div>

      {/* Stack Breakdown Cards */}
      <div className="bg-white rounded-xl border border-parchment-dark/70 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-parchment-dark/50">
          <h3 className="font-serif font-bold text-base text-forest-dark">
            Physical Campus Stack Distribution
          </h3>
          <span className="text-xs text-charcoal-muted font-medium">
            {stacks.length} Active Storage Locations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stacks.map((st) => (
            <div
              key={st.id}
              className="p-4 rounded-xl border border-parchment-dark/60 bg-parchment-light/30 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-forest-dark">{st.name}</h4>
                  <p className="text-xs text-charcoal-muted">
                    {st.floorLevel} • {st.category}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20">
                  {st.status}
                </span>
              </div>

              <p className="text-xs text-charcoal leading-relaxed">{st.description}</p>

              {/* Utilization Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-charcoal-muted">
                  <span>
                    {st.totalCopies} / {st.capacity} Volumes ({st.availableCopies} available, {st.borrowedCopies} loaned)
                  </span>
                  <span className="font-semibold text-charcoal">{st.utilizationRate}% Full</span>
                </div>
                <div className="w-full bg-parchment-dark/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-forest h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, st.utilizationRate)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStackId(st.id);
                    setAuditReport(null);
                    setBarcodeInput('');
                    setShowAuditModal(true);
                  }}
                  className="text-xs font-medium text-forest hover:text-forest-dark flex items-center gap-1 hover:underline"
                >
                  <Barcode className="h-3.5 w-3.5" />
                  Audit Stack Barcodes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Stack Modal */}
      {showStackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-parchment-dark/80 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 bg-parchment-light/60 border-b border-parchment-dark/50 flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-forest-dark flex items-center gap-2">
                <Plus className="h-4 w-4 text-forest" />
                Configure Physical Stack Section
              </h3>
              <button
                type="button"
                onClick={() => setShowStackModal(false)}
                className="text-charcoal-muted hover:text-charcoal p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStack} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Stack Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stack 7 (Rare Manuscripts & Archives)"
                  value={stackForm.name}
                  onChange={(e) => setStackForm({ ...stackForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. History"
                    value={stackForm.category}
                    onChange={(e) => setStackForm({ ...stackForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Floor Level</label>
                  <select
                    value={stackForm.floorLevel}
                    onChange={(e) => setStackForm({ ...stackForm, floorLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                  >
                    <option value="Level 1">Level 1 (Ground)</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                    <option value="Basement Stacks">Basement Archive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Physical Shelf Capacity (Volumes)
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={stackForm.capacity}
                  onChange={(e) =>
                    setStackForm({ ...stackForm, capacity: parseInt(e.target.value) || 500 })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Stack Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Primary academic subject matter and collection boundaries..."
                  value={stackForm.description}
                  onChange={(e) => setStackForm({ ...stackForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div className="pt-3 border-t border-parchment-dark/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStackModal(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-parchment-dark hover:bg-parchment-light transition-colors"
                >
                  Cancel
                </button>
                <PrimaryButton size="sm" type="submit" disabled={savingStack}>
                  {savingStack ? 'Saving...' : 'Save Stack Section'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-parchment-dark/80 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-parchment-light/60 border-b border-parchment-dark/50 flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-forest-dark flex items-center gap-2">
                <Barcode className="h-4 w-4 text-forest" />
                Physical Stack Barcode Audit
              </h3>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-charcoal-muted hover:text-charcoal p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {!auditReport ? (
                <form onSubmit={handleSubmitAudit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Target Stack Unit *
                    </label>
                    <select
                      value={selectedStackId}
                      onChange={(e) => setSelectedStackId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark bg-white focus:outline-none focus:ring-1 focus:ring-forest"
                    >
                      {stacks.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.totalCopies} copies catalogued)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Scanned Physical Barcodes (One per line) *
                    </label>
                    <p className="text-[11px] text-charcoal-muted mb-1.5">
                      Enter or scan barcodes using a handheld barcode reader or manual entry.
                    </p>
                    <textarea
                      rows={5}
                      required
                      placeholder={`SCHOLARS-COPY-b-001-01\nSCHOLARS-COPY-b-001-02\nSCHOLARS-COPY-b-002-01`}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Auditor Notes / Shelf Inspection Details
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Routine bi-weekly shelf reconciliation scan"
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div className="pt-3 border-t border-parchment-dark/50 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAuditModal(false)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-parchment-dark hover:bg-parchment-light transition-colors"
                    >
                      Cancel
                    </button>
                    <PrimaryButton size="sm" type="submit" disabled={auditing}>
                      {auditing ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying Copies...
                        </span>
                      ) : (
                        'Submit & Reconcile'
                      )}
                    </PrimaryButton>
                  </div>
                </form>
              ) : (
                /* Reconciliation Results Display */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-forest/5 border border-forest/20 text-center space-y-1">
                    <FileCheck2 className="h-8 w-8 text-forest mx-auto" />
                    <h4 className="font-serif font-bold text-sm text-forest-dark">
                      Audit Outcome: {auditReport.outcome}
                    </h4>
                    <p className="text-xs text-charcoal-muted">
                      Audit Reference: <span className="font-mono">{auditReport.id}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 bg-white rounded-lg border border-parchment-dark">
                      <div className="text-charcoal-muted text-[10px]">Scanned Copies</div>
                      <div className="font-mono font-bold text-sm text-charcoal mt-1">
                        {auditReport.totalScanned}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-emerald-700 text-[10px]">Matched Expected</div>
                      <div className="font-mono font-bold text-sm text-emerald-800 mt-1">
                        {auditReport.matchedCount}
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-amber-700 text-[10px]">Match Rate</div>
                      <div className="font-mono font-bold text-sm text-amber-800 mt-1">
                        {auditReport.matchRate}%
                      </div>
                    </div>
                  </div>

                  {auditReport.missingItems && auditReport.missingItems.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-red-700">
                        Missing or Unscanned Volumes ({auditReport.missingCount}):
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {auditReport.missingItems.map((m, i) => (
                          <div
                            key={i}
                            className="text-xs p-2 rounded bg-red-50/50 border border-red-200 flex justify-between"
                          >
                            <span className="font-mono text-[11px]">{m.barcode}</span>
                            <span className="text-charcoal-muted text-[11px]">
                              {m.bookTitle || m.copyId || 'Expected in Stack'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-parchment-dark/50 flex justify-end">
                    <PrimaryButton size="sm" onClick={() => setShowAuditModal(false)}>
                      Close & Finish
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
