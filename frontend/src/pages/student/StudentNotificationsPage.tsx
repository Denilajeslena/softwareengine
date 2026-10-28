import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Trash2,
  ExternalLink,
  Info,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  dismissNotificationApi,
} from '@/services/notifications';
import { NotificationItem } from '@/types';

export const StudentNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'due' | 'reservations'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
      }
    } catch (e) {
      console.warn('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationReadApi(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadApi();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dismissNotificationApi(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'due') return n.type === 'due_date' || n.type === 'overdue';
    if (activeFilter === 'reservations') return n.type === 'reservation_ready';
    return true;
  });

  const getIcon = (type: string, severity: string) => {
    if (severity === 'danger' || type === 'overdue') {
      return <AlertTriangle className="h-5 w-5 text-rose-600" />;
    }
    if (type === 'due_date') {
      return <Clock className="h-5 w-5 text-amber-600" />;
    }
    if (type === 'reservation_ready' || type === 'loan_approval') {
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    }
    if (type === 'inventory_alert') {
      return <Bookmark className="h-5 w-5 text-gold-dark" />;
    }
    return <Info className="h-5 w-5 text-forest" />;
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <PageHeader
        title="In-App Notification Centre"
        subtitle="Real-time alerts for impending due dates, overdue fines, hold reservation arrivals, and circulation approvals."
        badge={
          unreadCount > 0 ? (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              {unreadCount} Unread Alerts
            </span>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <SecondaryButton
                size="sm"
                onClick={handleMarkAllRead}
                leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
              >
                Mark All As Read
              </SecondaryButton>
            )}
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-ivory-cream pb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors ${
            activeFilter === 'all'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors ${
            activeFilter === 'unread'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveFilter('due')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors ${
            activeFilter === 'due'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          Due Dates & Overdue
        </button>
        <button
          onClick={() => setActiveFilter('reservations')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors ${
            activeFilter === 'reservations'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          Reservations & Holds
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="p-12 text-center text-charcoal-muted">
          <Loader2 className="h-6 w-6 animate-spin text-forest mx-auto mb-2" />
          <p className="text-xs font-mono">Syncing live library notices...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center text-charcoal-muted bg-white rounded-2xl border border-ivory-border shadow-scholarly">
          <Bell className="h-8 w-8 text-forest mx-auto mb-2 opacity-40" />
          <p className="font-serif font-bold text-base text-forest-dark">No Notifications Found</p>
          <p className="text-xs text-charcoal-muted mt-1">
            You are completely up to date with your library circulation and holds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.read) handleMarkAsRead(item.id);
                if (item.actionUrl) navigate(item.actionUrl);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 shadow-scholarly ${
                !item.read
                  ? 'bg-white border-gold/40 ring-1 ring-gold/20'
                  : 'bg-white/70 border-ivory-border opacity-90'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-ivory shrink-0 border border-ivory-border">
                {getIcon(item.type, item.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-sm text-forest-dark">
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] text-charcoal-muted shrink-0">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-charcoal mt-1.5 leading-relaxed">{item.message}</p>

                <div className="pt-3 mt-3 border-t border-ivory-cream flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      size="sm"
                      status={
                        item.severity === 'danger'
                          ? 'danger'
                          : item.severity === 'warning'
                          ? 'warning'
                          : 'success'
                      }
                      label={item.type.replace('_', ' ').toUpperCase()}
                    />
                    {item.actionUrl && (
                      <span className="text-[11px] font-semibold text-forest hover:text-gold-dark flex items-center gap-1">
                        Go to Action <ExternalLink className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDismiss(item.id, e)}
                    className="p-1 text-charcoal-muted hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    title="Dismiss notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
