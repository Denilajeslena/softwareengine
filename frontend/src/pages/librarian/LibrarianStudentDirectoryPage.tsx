import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Search, RefreshCw, Loader2, Users, GraduationCap, AlertCircle } from 'lucide-react';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { fetchLibrarianStudentsApi, LibrarianStudentSummary } from '@/services/circulation';

export const LibrarianStudentDirectoryPage: React.FC = () => {
  const [students, setStudents] = useState<LibrarianStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchLibrarianStudentsApi(search.trim() || undefined);
    if (res.success && res.data?.students) {
      setStudents(res.data.students);
    } else {
      setErrorMessage(res.message || 'Failed to retrieve student directory.');
    }
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const columns: Column<LibrarianStudentSummary>[] = [
    {
      header: 'Student Scholar',
      cell: (item) => (
        <div>
          <span className="font-serif font-bold text-forest-dark block">{item.name}</span>
          <span className="text-xs text-charcoal-muted">{item.email}</span>
        </div>
      ),
    },
    {
      header: 'Student Card ID',
      accessorKey: 'studentId',
      cell: (item) => <span className="font-mono text-xs text-charcoal">{item.studentId || item.userId}</span>,
    },
    {
      header: 'Department / Faculty',
      accessorKey: 'department',
      cell: (item) => (
        <span className="text-xs text-charcoal-muted">{item.department || 'Undergraduate'}</span>
      ),
    },
    {
      header: 'Active Loans',
      cell: (item) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-forest">{item.activeLoans} Active</span>
          {item.overdueLoans > 0 && (
            <span className="text-red-700 font-semibold block text-[11px]">
              ({item.overdueLoans} Overdue)
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Fines Due',
      cell: (item) => (
        <span
          className={`font-mono text-xs font-semibold ${
            item.totalFines > 0 ? 'text-red-700' : 'text-charcoal-muted'
          }`}
        >
          ${item.totalFines.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Circulation Standing',
      cell: (item) => (
        <StatusBadge
          size="sm"
          status={item.totalFines > 0 || item.overdueLoans > 0 ? 'danger' : 'success'}
          label={item.standing}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Student Patron Directory"
        subtitle="Lookup student borrowing records, active loan quotas, overdue fines, and verified card standings."
        actions={
          <SecondaryButton
            size="sm"
            onClick={loadStudents}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh Directory
          </SecondaryButton>
        }
      />

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-parchment-dark/60 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-charcoal-muted" />
            <input
              type="text"
              placeholder="Search by student name, email, or institutional ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium text-white bg-forest hover:bg-forest-light rounded-lg transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="text-xs text-charcoal-muted flex items-center gap-1.5 shrink-0">
          <GraduationCap className="h-4 w-4 text-forest" />
          <span>{students.length} Registered Student Patrons</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-xl border border-parchment-dark/60">
          <Loader2 className="h-7 w-7 animate-spin text-forest" />
          <p className="text-xs text-charcoal-muted">Retrieving student accounts and standing...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-xl border border-parchment-dark/60 text-center">
          <Users className="h-8 w-8 text-charcoal-muted" />
          <p className="text-sm font-serif font-bold text-forest-dark">No Students Found</p>
          <p className="text-xs text-charcoal-muted max-w-sm">
            No registered students matched your search criteria.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={students} keyExtractor={(item) => item.userId || item.studentId} />
      )}
    </div>
  );
};
