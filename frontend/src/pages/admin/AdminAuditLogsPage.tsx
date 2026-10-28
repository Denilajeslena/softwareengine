import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FileDown, Search, Filter, Loader2, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import {
  fetchAuditLogsApi,
  getAuditLogsCsvDownloadUrl,
  AuditLogEvent,
} from '@/services/admin';
import { getStoredToken } from '@/services/auth';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter, levelFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    const res = await fetchAuditLogsApi({
      page,
      limit: 20,
      search: search.trim() || undefined,
      action: actionFilter || undefined,
      level: levelFilter || undefined,
    });

    if (res.success && res.data) {
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    }
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAuditLogs();
  };

  const handleDownloadCsv = async () => {
    setExporting(true);
    const token = getStoredToken();
    const downloadUrl = getAuditLogsCsvDownloadUrl({
      search: search.trim() || undefined,
      action: actionFilter || undefined,
      level: levelFilter || undefined,
    });

    try {
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to download audit logs.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scholars_shelf_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<AuditLogEvent>[] = [
    {
      header: 'Event ID',
      accessorKey: 'id',
      cell: (item) => <span className="font-mono text-xs text-charcoal-muted">{item.id}</span>,
    },
    {
      header: 'Timestamp (UTC)',
      accessorKey: 'timestamp',
      cell: (item) => (
        <span className="font-mono text-xs text-charcoal">
          {new Date(item.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: (item) => (
        <span className="font-mono font-bold text-xs text-forest-dark bg-forest-dark/5 px-2 py-0.5 rounded border border-forest-dark/10">
          {item.action}
        </span>
      ),
    },
    {
      header: 'Actor & Role',
      cell: (item) => (
        <div>
          <div className="text-xs font-medium text-charcoal">{item.actor}</div>
          <div className="text-[10px] text-charcoal-muted uppercase tracking-wide">
            {item.role || 'System'}
          </div>
        </div>
      ),
    },
    {
      header: 'Resource',
      cell: (item) => (
        <div className="text-xs">
          <span className="font-medium text-forest">{item.resource_type}</span>
          {item.resource_id && (
            <span className="text-charcoal-muted text-[11px] block font-mono">
              {item.resource_id}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Details',
      accessorKey: 'details',
      cell: (item) => <span className="text-xs text-charcoal leading-relaxed">{item.details}</span>,
    },
    {
      header: 'Level',
      cell: (item) => {
        let badgeStatus: 'success' | 'info' | 'warning' | 'error' = 'info';
        if (item.level === 'SUCCESS') badgeStatus = 'success';
        else if (item.level === 'WARNING') badgeStatus = 'warning';
        else if (item.level === 'ERROR') badgeStatus = 'error';

        return <StatusBadge size="sm" status={badgeStatus} label={item.level} />;
      },
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Institutional Audit Trail"
        subtitle="Cryptographically verified append-only ledger capturing user authentications, catalogue changes, policy updates, and circulation desks."
        actions={
          <SecondaryButton
            size="sm"
            onClick={handleDownloadCsv}
            disabled={exporting}
            leftIcon={
              exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )
            }
          >
            {exporting ? 'Generating CSV...' : 'Export Audit Log (CSV)'}
          </SecondaryButton>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-parchment-dark/60 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-charcoal-muted" />
            <input
              type="text"
              placeholder="Search by actor email, details, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium text-white bg-forest hover:bg-forest-light rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-charcoal-muted">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs rounded-lg border border-parchment-dark bg-white focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
          >
            <option value="">All Actions</option>
            <option value="AUTH_LOGIN">Login Attempts</option>
            <option value="LOAN_REQUEST">Loan Issue</option>
            <option value="LOAN_RETURN">Loan Return</option>
            <option value="LOAN_RENEW">Loan Renewal</option>
            <option value="USER_PROVISION">Account Provision</option>
            <option value="USER_STATUS_CHANGE">User Status</option>
            <option value="POLICY_UPDATE">Policy Updates</option>
            <option value="INVENTORY_AUDIT">Inventory Audits</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs rounded-lg border border-parchment-dark bg-white focus:outline-none focus:ring-1 focus:ring-forest text-charcoal"
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      {/* Main Table or Loading/Empty States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-xl border border-parchment-dark/60">
          <Loader2 className="h-7 w-7 animate-spin text-forest" />
          <p className="text-xs text-charcoal-muted">Retrieving verified audit records...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-xl border border-parchment-dark/60 text-center">
          <ShieldAlert className="h-8 w-8 text-charcoal-muted" />
          <p className="text-sm font-serif font-bold text-forest-dark">No Audit Events Found</p>
          <p className="text-xs text-charcoal-muted max-w-sm">
            No events match your current filter criteria. Try clearing filters or performing an operation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} data={logs} keyExtractor={(item) => item.id} />

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-charcoal-muted px-2">
            <div>
              Showing <span className="font-semibold text-charcoal">{logs.length}</span> of{' '}
              <span className="font-semibold text-charcoal">{total}</span> total verified records
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-parchment-dark disabled:opacity-40 hover:bg-parchment-light transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded border border-parchment-dark disabled:opacity-40 hover:bg-parchment-light transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
