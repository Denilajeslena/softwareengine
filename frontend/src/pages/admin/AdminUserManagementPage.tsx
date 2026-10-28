import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DEMO_USERS_TABLE } from '@/data/demo/admin';
import { UserPlus, ShieldCheck, RefreshCw } from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { fetchAdminUsersApi } from '@/services/auth';

interface DisplayUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
}

export const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<DisplayUser[]>(DEMO_USERS_TABLE);
  const [loading, setLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsersApi();
      if (res.success && res.data?.users && res.data.users.length > 0) {
        const formatted: DisplayUser[] = res.data.users.map((u) => ({
          id: u.id || (u as any).studentId || (u as any).student_id || 'USR-001',
          name: u.name,
          email: u.email,
          role: u.role.toUpperCase(),
          department: u.department || 'School of Computing & Mathematical Sciences',
          status: 'Active Scholar',
        }));
        setUsers(formatted);
        setIsLiveConnected(true);
      }
    } catch {
      // Keep demo list
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<DisplayUser>[] = [
    {
      header: 'User Identifier',
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
        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20">
          {item.role}
        </span>
      ),
    },
    {
      header: 'Department / Faculty',
      accessorKey: 'department',
      cell: (item) => <span className="text-xs text-charcoal-muted">{item.department}</span>,
    },
    {
      header: 'Status',
      cell: (item) => (
        <StatusBadge
          size="sm"
          status={item.status.includes('Suspended') ? 'warning' : 'success'}
          label={item.status}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="University User Directory & Accounts"
        subtitle="Provision and audit campus library cards, faculty privileges, and librarian permissions."
        badge={
          isLiveConnected ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-forest-100 text-forest border border-forest/20 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Live DB Records ({users.length})
            </span>
          ) : undefined
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
              onClick={() => {
                setNotice('New accounts can be registered through Student Registration (/register) or by administrative grant.');
                setTimeout(() => setNotice(null), 5000);
              }}
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            >
              Provision Account
            </PrimaryButton>
          </div>
        }
      />

      {notice && (
        <div className="p-3 rounded-lg bg-forest-100/70 border border-forest/30 text-forest text-xs font-medium animate-in fade-in">
          {notice}
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};
