import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DEMO_ADMIN_STATS, DEMO_USERS_TABLE, DEMO_AUDIT_LOGS } from '@/data/demo/admin';
import { useHealth } from '@/hooks/useHealth';
import {
  Users,
  ShieldCheck,
  FileText,
  HardDrive,
  Activity,
  Server,
  Database,
  Lock,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { healthData, isHealthy, isDatabaseConnected } = useHealth();

  const userColumns: Column<(typeof DEMO_USERS_TABLE)[0]>[] = [
    {
      header: 'Name',
      cell: (item) => (
        <div>
          <span className="font-serif font-bold text-forest-dark block">{item.name}</span>
          <span className="text-xs text-charcoal-muted">{item.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (item) => <span className="font-medium text-xs">{item.role}</span>,
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
    {
      header: 'Last Active',
      accessorKey: 'lastActive',
    },
    {
      header: 'Action',
      cell: () => (
        <span className="text-[11px] text-charcoal-muted italic">
          Privileged edit (Part 2)
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 text-left">
      <PageHeader
        title="Institutional Administration Console"
        subtitle="Centralized management of university accounts, access controls, library operational parameters, and audit trails."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Accounts"
          value={DEMO_ADMIN_STATS.totalUsers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          description="2,310 Students, 18 Librarians"
          isDemo={true}
        />
        <StatCard
          title="Security Roles"
          value="3 Roles"
          icon={<ShieldCheck className="h-5 w-5" />}
          description="Student, Librarian, Admin"
          isDemo={true}
        />
        <StatCard
          title="Audit Trail Entries"
          value={DEMO_ADMIN_STATS.totalAuditLogs.toLocaleString()}
          icon={<FileText className="h-5 w-5" />}
          description="Immutable security logs"
          isDemo={true}
        />
        <StatCard
          title="Catalogue Storage"
          value={DEMO_ADMIN_STATS.storageUsage}
          icon={<HardDrive className="h-5 w-5" />}
          description="Indexed metadata and cover cache"
          isDemo={true}
        />
      </div>

      {/* Live System Diagnostics Panel */}
      <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-forest" />
            <h3 className="font-serif text-base font-bold text-forest-dark">
              Live System Status & Connectivity
            </h3>
          </div>
          <span className="text-xs font-mono text-charcoal-muted">
            Environment: {healthData?.data?.environment || 'development'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-ivory-border bg-ivory/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                <Server className="h-4 w-4 text-forest" /> Flask REST API
              </span>
              <StatusBadge
                size="sm"
                status={isHealthy ? 'optimal' : 'danger'}
                label={isHealthy ? 'Connected & Healthy (200)' : 'Unreachable'}
              />
            </div>
            <p className="text-xs text-charcoal-muted font-mono">
              Endpoint: {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'}/health
            </p>
          </div>

          <div className="p-4 rounded-lg border border-ivory-border bg-ivory/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                <Database className="h-4 w-4 text-gold-dark" /> MongoDB Integration
              </span>
              <StatusBadge
                size="sm"
                status={isDatabaseConnected ? 'optimal' : 'warning'}
                label={
                  isDatabaseConnected
                    ? 'Connected'
                    : healthData?.data?.database?.status === 'driver_missing'
                    ? 'PyMongo Driver Pending'
                    : 'Unconfigured / Offline'
                }
              />
            </div>
            <p className="text-xs text-charcoal-muted">
              {healthData?.data?.database?.message ||
                'Database connectivity reported honestly from backend.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: User Directory & Audit Log Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Management Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-ivory-border p-5 shadow-scholarly space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
            <div>
              <h3 className="font-serif text-base font-bold text-forest-dark">
                User Accounts
              </h3>
              <p className="text-xs text-charcoal-muted">
                Sample patron and staff directory (demonstration records)
              </p>
            </div>
            <span className="text-[10px] font-bold text-sage-600 bg-sage-100 px-2 py-0.5 rounded border border-sage-200">
              Demo Data
            </span>
          </div>

          <DataTable
            columns={userColumns}
            data={DEMO_USERS_TABLE}
            keyExtractor={(item) => item.id}
          />
        </div>

        {/* Audit Log Feed */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-ivory-border p-5 shadow-scholarly space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
            <div>
              <h3 className="font-serif text-base font-bold text-forest-dark">
                System Audit Log
              </h3>
              <p className="text-xs text-charcoal-muted">
                Recent administrative and automated events
              </p>
            </div>
            <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 py-0.5 rounded-full">
              Live Feed Demo
            </span>
          </div>

          <div className="space-y-3">
            {DEMO_AUDIT_LOGS.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-ivory-border bg-ivory/20 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-forest-dark text-[11px]">
                    {log.action}
                  </span>
                  <span className="font-mono text-[10px] text-charcoal-muted">
                    {log.timestamp.split(' ')[1]}
                  </span>
                </div>
                <p className="text-charcoal leading-tight">{log.details}</p>
                <span className="text-[10px] text-charcoal-muted block font-mono">
                  Actor: {log.actor}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <span className="text-xs text-charcoal-muted italic flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Privileged account creation and role modification will be secured in Part 2.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
