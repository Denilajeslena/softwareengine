import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import {
  fetchRolesApi,
  updateRolePermissionsApi,
  RoleDefinition,
} from '@/services/admin';
import {
  ShieldCheck,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

const ALL_SYSTEM_PERMISSIONS = [
  { key: 'catalogue.read', label: 'Catalogue Search & Read Access', desc: 'Browse and inspect library volumes.' },
  { key: 'catalogue.write', label: 'Catalogue Authoring & Editing', desc: 'Create, modify, and archive volumes.' },
  { key: 'circulation.manage', label: 'Desk Checkout & Returns', desc: 'Issue physical loans and process returns.' },
  { key: 'loans.request', label: 'Self-Service Loan Borrowing', desc: 'Request borrow checkouts online.' },
  { key: 'loans.renew', label: 'Loan Renewal Extension', desc: 'Extend due dates of active loans.' },
  { key: 'reservations.create', label: 'Place Reservation Holds', desc: 'Queue holds for unavailable books.' },
  { key: 'inventory.manage', label: 'Stack Inventory Reconciliation', desc: 'Configure stacks and audit barcodes.' },
  { key: 'students.view', label: 'Student Directory & Fines', desc: 'Inspect patron circulation standing.' },
  { key: 'reports.view', label: 'Analytics & Circulation Reports', desc: 'View trend charts and CSV downloads.' },
  { key: 'reading_list.manage', label: 'Personal Reading Lists', desc: 'Manage bookmarks and reading goals.' },
  { key: 'reviews.create', label: 'Submit Academic Reviews', desc: 'Post book reviews and ratings.' },
  { key: 'study_assistant.use', label: 'BookMind AI Study Assistant', desc: 'Use AI study and concept summaries.' },
  { key: 'users.manage', label: 'User Provisioning & Status', desc: 'Provision campus accounts and toggle status.' },
  { key: 'policies.manage', label: 'Circulation Policies Management', desc: 'Update loan duration and fine rates.' },
  { key: 'roles.manage', label: 'RBAC Permission Matrix', desc: 'Configure role capabilities.' },
  { key: 'audit.view', label: 'Immutable Audit Trail', desc: 'Inspect verified security event logs.' },
  { key: 'system.analytics', label: 'Administrative System Analytics', desc: 'Institutional telemetry and metrics.' },
];

export const AdminRoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchRolesApi();
    if (res.success && res.data?.roles) {
      setRoles(res.data.roles);
    } else {
      setErrorMessage(res.message || 'Failed to retrieve role matrix.');
    }
    setLoading(false);
  };

  const handleTogglePermission = (roleKey: string, permKey: string) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleKey) return r;
        const has = r.permissions.includes(permKey);
        const updated = has
          ? r.permissions.filter((p) => p !== permKey)
          : [...r.permissions, permKey];
        return { ...r, permissions: updated };
      })
    );
  };

  const handleSaveRole = async (roleObj: RoleDefinition) => {
    setSavingRole(roleObj.role);
    setSuccessMessage(null);
    setErrorMessage(null);

    const res = await updateRolePermissionsApi(roleObj.role, roleObj.permissions);
    if (res.success) {
      setSuccessMessage(
        `Permissions for '${roleObj.title}' saved to database and actively enforced.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.message || 'Failed to update role permissions.');
    }
    setSavingRole(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
        <p className="text-sm text-charcoal-muted">Loading Role-Based Access Control matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-6xl">
      <PageHeader
        title="Role-Based Access Control (RBAC) Governance"
        subtitle="Manage capability matrices for students, library circulation staff, and institutional administrators with backend security enforcement."
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((r) => {
          const isSaving = savingRole === r.role;
          const isAdmin = r.role === 'admin';

          return (
            <div
              key={r.role}
              className="bg-white rounded-xl border border-parchment-dark/70 shadow-sm flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="p-4 bg-parchment-light/50 border-b border-parchment-dark/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-forest-dark flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-forest" />
                      {r.title}
                    </h3>
                    <p className="text-[11px] text-charcoal-muted mt-0.5">{r.description}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-gold-dark bg-parchment px-2 py-0.5 rounded border border-parchment-dark uppercase tracking-wider shrink-0">
                    {r.badge}
                  </span>
                </div>

                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-charcoal-muted">
                    Assigned Capabilities ({r.permissions.length}/{ALL_SYSTEM_PERMISSIONS.length})
                  </div>

                  <div className="space-y-2">
                    {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                      const isChecked = r.permissions.includes(perm.key);
                      // Governance protection: admin cannot remove core admin governance
                      const isProtectedAdmin =
                        isAdmin &&
                        ['users.manage', 'policies.manage', 'roles.manage', 'audit.view'].includes(
                          perm.key
                        );

                      return (
                        <label
                          key={perm.key}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-forest/5 border-forest/30 text-forest-dark'
                              : 'bg-white border-parchment-dark/40 text-charcoal-muted hover:bg-parchment-light/30'
                          } ${isProtectedAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isProtectedAdmin}
                            onChange={() => handleTogglePermission(r.role, perm.key)}
                            className="mt-0.5 rounded text-forest focus:ring-forest border-parchment-dark"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-charcoal flex items-center gap-1">
                              {perm.label}
                              {isProtectedAdmin && (
                                <span title="Core Governance Privilege">
                                  <Lock className="h-3 w-3 text-gold-dark shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-charcoal-muted">{perm.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-parchment-light/30 border-t border-parchment-dark/60 flex items-center justify-between">
                <span className="text-[11px] text-charcoal-muted flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-forest" />
                  Backend Enforced
                </span>
                <PrimaryButton
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleSaveRole(r)}
                  leftIcon={
                    isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {isSaving ? 'Saving...' : 'Save Permissions'}
                </PrimaryButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
