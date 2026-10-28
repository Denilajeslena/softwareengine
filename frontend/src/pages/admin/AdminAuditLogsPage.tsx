import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { DEMO_AUDIT_LOGS } from '@/data/demo/admin';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FileDown } from 'lucide-react';
import { SecondaryButton } from '@/components/common/SecondaryButton';

export const AdminAuditLogsPage: React.FC = () => {
  const downloadAuditCsv = () => {
    const headers = ['Event ID', 'Timestamp', 'Actor', 'Action', 'Details', 'Level'];
    const rows = DEMO_AUDIT_LOGS.map((log) => [
      log.id,
      log.timestamp,
      log.actor,
      log.action,
      log.details,
      log.level,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scholars_shelf_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<(typeof DEMO_AUDIT_LOGS)[0]>[] = [
    {
      header: 'Log ID',
      accessorKey: 'id',
      cell: (item) => <span className="font-mono text-xs">{item.id}</span>,
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: (item) => <span className="font-mono text-xs">{item.timestamp}</span>,
    },
    {
      header: 'Event Action',
      accessorKey: 'action',
      cell: (item) => <span className="font-mono font-bold text-xs text-forest-dark">{item.action}</span>,
    },
    {
      header: 'Actor',
      accessorKey: 'actor',
      cell: (item) => <span className="text-xs text-charcoal">{item.actor}</span>,
    },
    {
      header: 'Details',
      accessorKey: 'details',
    },
    {
      header: 'Level',
      cell: (item) => (
        <StatusBadge
          size="sm"
          status={item.level === 'SUCCESS' ? 'success' : 'info'}
          label={item.level}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Institutional Audit Trail"
        subtitle="Cryptographically verified event ledger capturing authentication, catalog modifications, and system configuration changes."
        actions={
          <SecondaryButton
            size="sm"
            onClick={downloadAuditCsv}
            leftIcon={<FileDown className="h-3.5 w-3.5" />}
          >
            Export Audit Log (CSV)
          </SecondaryButton>
        }
      />

      <DataTable
        columns={columns}
        data={DEMO_AUDIT_LOGS}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};

