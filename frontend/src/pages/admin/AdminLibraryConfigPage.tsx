import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { DEMO_LIBRARY_CONFIG } from '@/data/demo/admin';
import { Save, CheckCircle2 } from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';

export const AdminLibraryConfigPage: React.FC = () => {
  const configList = DEMO_LIBRARY_CONFIG;
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSave = () => {
    setSavedNotice('Library circulation parameters and policies saved to active operational configuration.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const columns: Column<(typeof DEMO_LIBRARY_CONFIG)[0]>[] = [
    {
      header: 'Configuration Key',
      accessorKey: 'key',
      cell: (item) => <span className="font-serif font-bold text-forest-dark">{item.key}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'category',
    },
    {
      header: 'Active Value',
      accessorKey: 'value',
      cell: (item) => <span className="font-mono text-xs font-semibold text-forest">{item.value}</span>,
    },
    {
      header: 'Policy Rule Details',
      cell: () => (
        <span className="text-xs text-charcoal-muted">
          Active institutional parameter enforced across all loan transactions
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Library Circulation Rules & Policy"
        subtitle="Global settings governing loan terms, maximum concurrent books, fine rates, and notification lead times."
        actions={
          <PrimaryButton
            size="sm"
            onClick={handleSave}
            leftIcon={<Save className="h-3.5 w-3.5" />}
          >
            Save Rules Policy
          </PrimaryButton>
        }
      />

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={configList}
        keyExtractor={(item) => item.key}
      />
    </div>
  );
};
