import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { fetchMyLoansApi, renewLoanApi, StudentLoansSummary } from '@/services/circulation';
import { BorrowRecord } from '@/types';
import { formatDaysRemaining } from '@/utils/formatters';
import {
  Bookmark,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  DollarSign,
  History,
  Layers,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const StudentBorrowedPage: React.FC = () => {
  const [data, setData] = useState<StudentLoansSummary>({
    activeLoans: [],
    history: [],
    pendingRequests: [],
    activeCount: 0,
    totalCount: 0,
    totalFines: 0,
    remainingAllowance: 5,
    maxAllowance: 5,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLoans = async () => {
    setLoading(true);
    const res = await fetchMyLoansApi();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleRenew = async (loan: BorrowRecord) => {
    setRenewingId(loan.id);
    setMessage(null);
    const res = await renewLoanApi(loan.id);
    setRenewingId(null);

    if (res.success) {
      setMessage({
        type: 'success',
        text: `"${loan.bookTitle}" renewed successfully! New due date: ${res.data?.loan?.dueDate?.substring(0, 10)}.`,
      });
      loadLoans();
    } else {
      setMessage({
        type: 'error',
        text: res.message || 'Renewal was declined by library circulation policy.',
      });
    }
  };

  const overdueCount = data.activeLoans.filter((l) => l.status === 'overdue').length;

  const activeColumns: Column<BorrowRecord>[] = [
    {
      header: 'Volume & Copy',
      cell: (item) => (
        <div>
          <Link
            to={`/books/${item.bookId}`}
            className="font-serif font-bold text-forest-dark hover:text-gold-dark transition-colors line-clamp-1 inline-flex items-center gap-1.5"
          >
            <Bookmark className="h-3.5 w-3.5 text-forest shrink-0" />
            <span>{item.bookTitle}</span>
          </Link>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-charcoal-muted">
            <span className="font-mono">{item.copyId || item.barcode}</span>
            {item.shelfLocation && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 text-shelf-gold" />
                {item.shelfLocation}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Borrowed On',
      cell: (item) => <span className="text-xs text-charcoal">{item.borrowDate ? item.borrowDate.substring(0, 10) : '—'}</span>,
    },
    {
      header: 'Due Date',
      cell: (item) => (
        <span className="font-mono text-xs font-semibold text-shelf-forest">
          {item.dueDate ? item.dueDate.substring(0, 10) : '—'}
        </span>
      ),
    },
    {
      header: 'Status & Time Left',
      cell: (item) => {
        const { days, isOverdue } = formatDaysRemaining(item.dueDate);
        return (
          <div className="space-y-0.5">
            <StatusBadge
              size="sm"
              status={isOverdue ? 'danger' : 'success'}
              label={isOverdue ? `${days} Days Overdue` : `${days} Days Left`}
            />
            {item.fineAmount && item.fineAmount > 0 ? (
              <span className="block text-[10px] font-bold text-red-700">
                Late Fine: ${item.fineAmount.toFixed(2)}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      header: 'Renewals',
      cell: (item) => {
        const used = item.renewalsCount || 0;
        return (
          <span className="text-xs font-medium text-charcoal">
            {used} of 2 used
          </span>
        );
      },
    },
    {
      header: 'Actions',
      cell: (item) => {
        const used = item.renewalsCount || 0;
        const canRenew = used < 2;
        const isCurrentRenewing = renewingId === item.id;

        return (
          <button
            onClick={() => handleRenew(item)}
            disabled={!canRenew || isCurrentRenewing}
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded transition-colors',
              canRenew
                ? 'bg-ivory-cream text-forest hover:bg-gold-light/40 border border-ivory-border'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            )}
            title={canRenew ? 'Renew volume for 14 more days' : 'Maximum renewal limit reached'}
          >
            <RotateCcw className={cn('h-3 w-3', isCurrentRenewing && 'animate-spin')} />
            <span>{isCurrentRenewing ? 'Renewing...' : canRenew ? 'Renew' : 'Max Renewed'}</span>
          </button>
        );
      },
    },
  ];

  const historyColumns: Column<BorrowRecord>[] = [
    {
      header: 'Volume Title',
      cell: (item) => (
        <Link
          to={`/books/${item.bookId}`}
          className="font-serif font-bold text-forest-dark hover:text-gold-dark transition-colors line-clamp-1 inline-flex items-center gap-1.5"
        >
          <BookOpen className="h-3.5 w-3.5 text-forest shrink-0" />
          <span>{item.bookTitle}</span>
        </Link>
      ),
    },
    {
      header: 'Borrowed',
      cell: (item) => <span className="text-xs">{item.borrowDate ? item.borrowDate.substring(0, 10) : '—'}</span>,
    },
    {
      header: 'Returned',
      cell: (item) => (
        <span className="text-xs font-medium text-emerald-800">
          {item.returnDate ? item.returnDate.substring(0, 10) : 'Returned'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: () => <StatusBadge size="sm" status="success" label="Returned to Stacks" />,
    },
    {
      header: 'Fine Assessed',
      cell: (item) => (
        <span className="font-mono text-xs">
          {item.fineAmount && item.fineAmount > 0 ? `$${item.fineAmount.toFixed(2)}` : '$0.00'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <PageHeader
        title="My Borrowed Books & Circulation"
        subtitle="Review your active loans, track upcoming due dates, request renewals, and inspect circulation history."
        actions={
          <button
            onClick={loadLoans}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-shelf-border text-shelf-forest hover:bg-warm-sand transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        }
      />

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline ml-4 hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      {/* Circulation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-ivory-border shadow-scholarly flex items-center gap-3">
          <div className="p-3 bg-forest/10 text-forest rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-charcoal-muted">Active Loans</span>
            <div className="font-serif text-xl font-bold text-forest-dark">
              {data.activeCount} <span className="text-xs font-sans text-charcoal-muted font-normal">/ {data.maxAllowance} max</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-ivory-border shadow-scholarly flex items-center gap-3">
          <div className={`p-3 rounded-lg ${overdueCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-charcoal-muted">Overdue Volumes</span>
            <div className={`font-serif text-xl font-bold ${overdueCount > 0 ? 'text-rose-700' : 'text-forest-dark'}`}>
              {overdueCount}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-ivory-border shadow-scholarly flex items-center gap-3">
          <div className={`p-3 rounded-lg ${data.totalFines > 0 ? 'bg-amber-50 text-amber-800' : 'bg-forest/10 text-forest'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-charcoal-muted">Accumulated Fines</span>
            <div className={`font-serif text-xl font-bold ${data.totalFines > 0 ? 'text-amber-900' : 'text-forest-dark'}`}>
              ${data.totalFines.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-ivory-border shadow-scholarly flex items-center gap-3">
          <div className="p-3 bg-forest/10 text-forest rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-charcoal-muted">Available Slots</span>
            <div className="font-serif text-xl font-bold text-forest-dark">
              {data.remainingAllowance} books
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Navigation */}
      <div className="flex border-b border-ivory-border gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5',
            activeTab === 'active'
              ? 'bg-white border-t border-x border-ivory-border text-forest'
              : 'text-charcoal-muted hover:text-forest'
          )}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Active Loans ({data.activeCount})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5',
            activeTab === 'history'
              ? 'bg-white border-t border-x border-ivory-border text-forest'
              : 'text-charcoal-muted hover:text-forest'
          )}
        >
          <History className="w-3.5 h-3.5" />
          Borrowing History ({data.history.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12">
          <LoadingState message="Retrieving your circulation records from library database..." />
        </div>
      ) : activeTab === 'active' ? (
        data.activeLoans.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-forest" />}
            title="No Active Loans"
            description="You do not have any books currently checked out. Browse the catalogue to discover your next study read."
            action={
              <Link to="/catalogue">
                <PrimaryButton size="sm">Explore Library Catalogue</PrimaryButton>
              </Link>
            }
          />
        ) : (
          <div className="bg-white rounded-xl border border-ivory-border shadow-scholarly overflow-hidden">
            <DataTable<BorrowRecord>
              columns={activeColumns}
              data={data.activeLoans}
              keyExtractor={(item) => item.id}
            />
          </div>
        )
      ) : data.history.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-forest" />}
          title="No Borrowing History Yet"
          description="Completed returns will appear here with timestamps and past circulation logs."
        />
      ) : (
        <div className="bg-white rounded-xl border border-ivory-border shadow-scholarly overflow-hidden">
          <DataTable<BorrowRecord>
            columns={historyColumns}
            data={data.history}
            keyExtractor={(item) => item.id}
          />
        </div>
      )}
    </div>
  );
};
