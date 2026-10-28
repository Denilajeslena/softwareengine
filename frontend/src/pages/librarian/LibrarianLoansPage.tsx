import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { Modal } from '@/components/common/Modal';
import { LoadingState } from '@/components/common/LoadingState';
import { SearchBar } from '@/components/common/SearchBar';
import {
  fetchAllLoansApi,
  issueBookApi,
  returnBookApi,
} from '@/services/circulation';
import { fetchBooksApi } from '@/services/books';
import { BorrowRecord, Book } from '@/types';
import { formatDaysRemaining } from '@/utils/formatters';
import {
  BookOpen,
  CheckSquare,
  Clock,
  DollarSign,
  RotateCcw,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  MapPin,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const LibrarianLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Issue Book Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueData, setIssueData] = useState({
    studentIdentifier: 'student@scholars.shelf',
    bookId: '',
    durationDays: 14,
  });
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Return Processing State
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadLoans = async () => {
    setLoading(true);
    const res = await fetchAllLoansApi({
      status: activeTab === 'all' ? undefined : activeTab,
    });
    if (res.success && res.data?.loans) {
      setLoans(res.data.loans);
    }
    setLoading(false);
  };

  const loadBooksForSelect = async () => {
    const res = await fetchBooksApi({ available: true });
    if (res.success && res.data?.books) {
      setBooksList(res.data.books);
      if (res.data.books.length > 0 && !issueData.bookId) {
        setIssueData((prev) => ({ ...prev, bookId: res.data.books[0].id }));
      }
    }
  };

  useEffect(() => {
    loadLoans();
  }, [activeTab]);

  useEffect(() => {
    loadBooksForSelect();
  }, []);

  const handleReturn = async (loan: BorrowRecord) => {
    setProcessingId(loan.id);
    setNotification(null);
    const res = await returnBookApi(loan.id);
    setProcessingId(null);

    if (res.success) {
      setNotification({
        type: 'success',
        message: res.message || `Volume "${loan.bookTitle}" returned to library circulation.`,
      });
      loadLoans();
    } else {
      setNotification({
        type: 'error',
        message: res.message || 'Failed to process book return.',
      });
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError(null);

    if (!issueData.studentIdentifier.trim() || !issueData.bookId) {
      setIssueError('Student email/ID and book selection are required.');
      return;
    }

    setIssueSubmitting(true);
    const res = await issueBookApi(issueData);
    setIssueSubmitting(false);

    if (res.success) {
      setIsIssueModalOpen(false);
      setNotification({
        type: 'success',
        message: `Volume issued successfully! Record #${res.data?.loan?.id}.`,
      });
      loadLoans();
    } else {
      setIssueError(res.message || 'Failed to issue volume.');
    }
  };

  // Filtered by local search query
  const filteredLoans = loans.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const titleMatch = l.bookTitle?.toLowerCase().includes(q);
    const nameMatch = (l.userName || l.borrowerName || '').toLowerCase().includes(q);
    const emailMatch = (l.userEmail || '').toLowerCase().includes(q);
    const idMatch = l.id.toLowerCase().includes(q);
    const copyMatch = (l.copyId || '').toLowerCase().includes(q);
    return titleMatch || nameMatch || emailMatch || idMatch || copyMatch;
  });

  const activeCount = loans.filter((l) => l.status === 'active').length;
  const overdueCount = loans.filter((l) => l.status === 'overdue').length;
  const totalFines = loans.reduce((acc, l) => acc + (l.fineAmount || 0), 0);

  const columns: Column<BorrowRecord>[] = [
    {
      header: 'Txn / Loan ID',
      accessorKey: 'id',
      cell: (item) => <span className="font-mono text-xs text-charcoal">{item.id}</span>,
    },
    {
      header: 'Volume Title & Copy',
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
            <span className="font-mono font-medium">{item.copyId || item.barcode}</span>
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
      header: 'Patron',
      cell: (item) => (
        <div>
          <span className="font-medium text-xs text-charcoal block">
            {item.userName || item.borrowerName || 'Student Patron'}
          </span>
          <span className="font-mono text-[10px] text-charcoal-muted block">
            {item.userEmail || item.studentId || item.userId}
          </span>
        </div>
      ),
    },
    {
      header: 'Due Date',
      cell: (item) => {
        const { days, isOverdue } = formatDaysRemaining(item.dueDate);
        const isReturned = item.status === 'returned';

        return (
          <div>
            <span className="font-mono text-xs block">{item.dueDate ? item.dueDate.substring(0, 10) : '—'}</span>
            {!isReturned && (
              <span className={`text-[10px] font-semibold ${isOverdue ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isOverdue ? `${days}d Overdue` : `${days}d Left`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (item) => {
        if (item.status === 'returned') {
          return <StatusBadge size="sm" status="success" label="RETURNED" />;
        }
        if (item.status === 'overdue') {
          return <StatusBadge size="sm" status="danger" label="OVERDUE" />;
        }
        return <StatusBadge size="sm" status="neutral" label="ACTIVE LOAN" />;
      },
    },
    {
      header: 'Fine',
      cell: (item) => (
        <span className={`font-mono text-xs font-semibold ${item.fineAmount && item.fineAmount > 0 ? 'text-rose-700' : 'text-charcoal'}`}>
          {item.fineAmount && item.fineAmount > 0 ? `$${item.fineAmount.toFixed(2)}` : '$0.00'}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: (item) => {
        const isReturned = item.status === 'returned';
        const isCurrentProcessing = processingId === item.id;

        if (isReturned) {
          return <span className="text-[11px] text-charcoal-muted italic">Processed</span>;
        }

        return (
          <button
            onClick={() => handleReturn(item)}
            disabled={isCurrentProcessing}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold-dark px-2.5 py-1 rounded bg-ivory-cream hover:bg-ivory border border-ivory-border transition-colors disabled:opacity-50"
            title="Check volume back into stacks"
          >
            <RotateCcw className={cn('h-3 w-3', isCurrentProcessing && 'animate-spin')} />
            <span>{isCurrentProcessing ? 'Processing...' : 'Return'}</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <PageHeader
        title="Circulation Desk & Loan Management"
        subtitle="Issue books to patrons, process incoming returns, track overdue loans, and assess circulation fines."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadLoans}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-shelf-border text-shelf-forest hover:bg-warm-sand transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
            <PrimaryButton
              size="sm"
              onClick={() => setIsIssueModalOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Issue Volume
            </PrimaryButton>
          </div>
        }
      />

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline ml-4 hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      {/* Circulation KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-ivory-border shadow-scholarly flex items-center gap-3">
          <div className="p-3 bg-forest/10 text-forest rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-charcoal-muted">Active Checked Out</span>
            <div className="font-serif text-xl font-bold text-forest-dark">{activeCount}</div>
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
          <div className={`p-3 rounded-lg ${totalFines > 0 ? 'bg-amber-50 text-amber-800' : 'bg-forest/10 text-forest'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-charcoal-muted">Circulation Fines</span>
            <div className={`font-serif text-xl font-bold ${totalFines > 0 ? 'text-amber-900' : 'text-forest-dark'}`}>
              ${totalFines.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-ivory-border shadow-scholarly flex items-center gap-3">
          <div className="p-3 bg-forest/10 text-forest rounded-lg">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-charcoal-muted">Total Recorded Loans</span>
            <div className="font-serif text-xl font-bold text-forest-dark">{loans.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-ivory-border pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              activeTab === 'all'
                ? 'bg-forest text-white'
                : 'bg-white border border-ivory-border text-charcoal hover:bg-ivory'
            )}
          >
            All Loans ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              activeTab === 'active'
                ? 'bg-forest text-white'
                : 'bg-white border border-ivory-border text-charcoal hover:bg-ivory'
            )}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              activeTab === 'overdue'
                ? 'bg-rose-800 text-white'
                : 'bg-white border border-ivory-border text-rose-800 hover:bg-rose-50'
            )}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setActiveTab('returned')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              activeTab === 'returned'
                ? 'bg-forest text-white'
                : 'bg-white border border-ivory-border text-charcoal hover:bg-ivory'
            )}
          >
            Returned
          </button>
        </div>

        <div className="w-full sm:max-w-xs">
          <SearchBar
            defaultValue={search}
            onSearch={(val) => setSearch(val)}
            placeholder="Search by title, patron, or copy ID..."
          />
        </div>
      </div>

      {/* Loans Table */}
      {loading ? (
        <div className="py-12">
          <LoadingState message="Loading circulation transactions..." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ivory-border shadow-scholarly overflow-hidden">
          <DataTable<BorrowRecord>
            columns={columns}
            data={filteredLoans}
            keyExtractor={(item) => item.id}
            emptyTitle="No Circulation Records"
            emptyDescription="There are currently no active or historic loan transactions in this category."
          />
        </div>
      )}

      {/* Issue Book Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Circulation Desk: Issue Book Volume"
        maxWidth="md"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs font-sans">
          {issueError && (
            <div className="p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{issueError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-shelf-forest">Patron Institutional Email or ID *</label>
            <input
              type="text"
              required
              value={issueData.studentIdentifier}
              onChange={(e) => setIssueData({ ...issueData, studentIdentifier: e.target.value })}
              placeholder="e.g. student@scholars.shelf or STU-2024-8841"
              className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-shelf-forest">Select Volume from Stacks *</label>
            <select
              value={issueData.bookId}
              onChange={(e) => setIssueData({ ...issueData, bookId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest bg-white"
            >
              {booksList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — ({b.availableCopies} available at {b.shelfLocation})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-shelf-forest">Standard Loan Period (Days)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={issueData.durationDays}
              onChange={(e) => setIssueData({ ...issueData, durationDays: parseInt(e.target.value) || 14 })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-shelf-border">
            <SecondaryButton type="button" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={issueSubmitting}>
              {issueSubmitting ? 'Issuing Volume...' : 'Issue Volume to Patron'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
