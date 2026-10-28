import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  UserPlus,
  ShieldCheck,
  RefreshCw,
  Power,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import {
  fetchAdminUsersApi,
  provisionUserApi,
  updateUserStatusApi,
  deleteUserApi,
} from '@/services/auth';
import { User } from '@/types';

export const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'librarian' | 'admin',
    department: 'School of Computing & Mathematical Sciences',
    studentId: '',
  });

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchAdminUsersApi(roleFilter || undefined);
      if (res.success && res.data?.users) {
        setUsers(res.data.users);
      } else {
        setErrorMessage(res.message || 'Failed to retrieve registered users.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error loading users.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const isCurrentlyActive = (user as any).status !== 'suspended';
    const newStatus = isCurrentlyActive ? 'suspended' : 'active';
    try {
      const res = await updateUserStatusApi(user.id, newStatus);
      if (res.success) {
        setActionNotice(`Account status for ${user.name} changed to '${newStatus}'.`);
        setTimeout(() => setActionNotice(null), 4000);
        loadUsers();
      } else {
        setErrorMessage(res.message || 'Failed to toggle account status.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating user status.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to permanently delete account '${user.name}' (${user.email})?`)) {
      return;
    }

    try {
      const res = await deleteUserApi(user.id);
      if (res.success) {
        setActionNotice(`User account '${user.name}' deleted successfully.`);
        setTimeout(() => setActionNotice(null), 4000);
        loadUsers();
      } else {
        setErrorMessage(res.message || 'Failed to delete user.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error deleting user.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    setErrorMessage(null);

    const res = await provisionUserApi(formData);
    if (res.success) {
      setActionNotice(`Successfully provisioned ${formData.role.toUpperCase()} account for ${formData.name}.`);
      setTimeout(() => setActionNotice(null), 5000);
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: 'School of Computing & Mathematical Sciences',
        studentId: '',
      });
      loadUsers();
    } else {
      setErrorMessage(res.message || 'Failed to provision account.');
    }
    setProvisioning(false);
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const columns: Column<User>[] = [
    {
      header: 'Identifier',
      accessorKey: 'id',
      cell: (item) => <span className="font-mono text-xs text-charcoal">{item.id}</span>,
    },
    {
      header: 'Full Name',
      accessorKey: 'name',
      cell: (item) => <span className="font-serif font-bold text-forest-dark">{item.name}</span>,
    },
    {
      header: 'Institutional Email',
      accessorKey: 'email',
    },
    {
      header: 'Assigned Role',
      cell: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20 uppercase">
          {item.role}
        </span>
      ),
    },
    {
      header: 'Department / Faculty',
      cell: (item) => (
        <span className="text-xs text-charcoal-muted">
          {item.department || 'General Campus'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => {
        const isSuspended = (item as any).status === 'suspended';
        return (
          <StatusBadge
            size="sm"
            status={isSuspended ? 'warning' : 'success'}
            label={isSuspended ? 'Suspended' : 'Active Scholar'}
          />
        );
      },
    },
    {
      header: 'Actions',
      cell: (item) => {
        const isSuspended = (item as any).status === 'suspended';
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              title={isSuspended ? 'Activate Account' : 'Suspend Account'}
              onClick={() => handleToggleStatus(item)}
              className={`p-1.5 rounded transition-colors ${
                isSuspended
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Delete Account"
              onClick={() => handleDeleteUser(item)}
              className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="University User Directory & Governance"
        subtitle="Provision and audit campus digital library cards, librarian credentials, and administrative accounts."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-forest-100 text-forest border border-forest/20 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Verified DB Records ({users.length})
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={loadUsers}
              isLoading={loading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh Directory
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={() => setShowModal(true)}
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            >
              Provision Account
            </PrimaryButton>
          </div>
        }
      />

      {actionNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-parchment-dark/60 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Filter by name, institutional email, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-charcoal-muted">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-parchment-dark bg-white focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="librarian">Librarians</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredUsers} keyExtractor={(item) => item.id} />

      {/* Account Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-parchment-dark/80 max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-parchment-light/60 border-b border-parchment-dark/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-forest" />
                <h3 className="font-serif font-bold text-sm text-forest-dark">
                  Provision New Campus Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-charcoal-muted hover:text-charcoal p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. arthur.pendelton@scholars.shelf"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as 'student' | 'librarian' | 'admin',
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                  >
                    <option value="student">Student Patron</option>
                    <option value="librarian">Librarian Staff</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Department / Faculty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Department of Physics"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              {formData.role === 'student' && (
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Student ID Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STU-2026-9042"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-parchment-dark/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-parchment-dark hover:bg-parchment-light transition-colors"
                >
                  Cancel
                </button>
                <PrimaryButton size="sm" type="submit" disabled={provisioning}>
                  {provisioning ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Provisioning...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
