import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { fetchMyReservationsApi, cancelReservationApi } from '@/services/circulation';
import { Reservation } from '@/types';
import { CalendarCheck, Info, CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export const StudentReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadReservations = async () => {
    setLoading(true);
    const res = await fetchMyReservationsApi();
    if (res.success && res.data?.reservations) {
      setReservations(res.data.reservations);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCancel = async (item: Reservation) => {
    if (!window.confirm(`Are you sure you want to cancel your hold reservation for "${item.bookTitle}"?`)) {
      return;
    }

    setCancellingId(item.id);
    setNotification(null);
    const res = await cancelReservationApi(item.id);
    setCancellingId(null);

    if (res.success) {
      setNotification({
        type: 'success',
        text: `Hold reservation for "${item.bookTitle}" has been cancelled.`,
      });
      loadReservations();
    } else {
      setNotification({
        type: 'error',
        text: res.message || 'Failed to cancel reservation.',
      });
    }
  };

  const columns: Column<Reservation>[] = [
    {
      header: 'Reserved Volume',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-forest shrink-0" />
          <Link
            to={`/books/${item.bookId}`}
            className="font-serif font-bold text-forest-dark hover:text-gold-dark transition-colors line-clamp-1"
          >
            {item.bookTitle}
          </Link>
        </div>
      ),
    },
    {
      header: 'Hold Requested',
      cell: (item) => (
        <span className="text-xs text-charcoal">
          {item.reservedAt ? item.reservedAt.substring(0, 10) : '—'}
        </span>
      ),
    },
    {
      header: 'Status & Queue',
      cell: (item) => {
        if (item.status === 'ready') {
          return <StatusBadge size="sm" status="success" label="Ready for Pickup at Desk" />;
        }
        if (item.status === 'pending') {
          return (
            <StatusBadge
              size="sm"
              status="warning"
              label={`Queued (#${item.queuePosition || 1} in Line)`}
            />
          );
        }
        return <StatusBadge size="sm" status="neutral" label={item.status.toUpperCase()} />;
      },
    },
    {
      header: 'Pickup Window',
      cell: (item) => (
        <span className="text-xs font-mono text-charcoal">
          {item.pickupDeadline ? `${item.pickupDeadline.substring(0, 10)} (48 hrs)` : 'Awaiting return'}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: (item) => {
        const isCurrentCancelling = cancellingId === item.id;
        const canCancel = item.status === 'pending' || item.status === 'ready';

        if (!canCancel) return <span className="text-xs text-charcoal-muted">—</span>;

        return (
          <button
            onClick={() => handleCancel(item)}
            disabled={isCurrentCancelling}
            className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isCurrentCancelling ? 'Cancelling...' : 'Cancel Hold'}</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <PageHeader
        title="Reservations & Hold Queues"
        subtitle="Track volumes on waitlist or awaiting your pickup at the library circulation desk."
        actions={
          <button
            onClick={loadReservations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-shelf-border text-shelf-forest hover:bg-warm-sand transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline ml-4 hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      <div className="p-4 bg-ivory-cream rounded-xl border border-ivory-border text-xs text-charcoal flex items-start gap-3">
        <Info className="h-4 w-4 text-gold-dark shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-shelf-forest">Circulation Hold Protocols:</p>
          <p className="text-charcoal-muted leading-relaxed">
            When a checked-out volume is returned by another student, the library system automatically allocates the copy to the next patron in queue. A <strong>48-hour hold window</strong> is granted to retrieve the physical volume at the circulation desk before it passes to the next patron.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <LoadingState message="Checking campus waitlist queues..." />
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-8 h-8 text-forest" />}
          title="No Active Reservations"
          description="You do not currently have any hold reservations queued. When all copies of a required volume are checked out, you can reserve your place in line."
          action={
            <Link to="/catalogue">
              <PrimaryButton size="sm">Explore Catalogue</PrimaryButton>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-ivory-border shadow-scholarly overflow-hidden">
          <DataTable<Reservation>
            columns={columns}
            data={reservations}
            keyExtractor={(item) => item.id}
          />
        </div>
      )}
    </div>
  );
};
