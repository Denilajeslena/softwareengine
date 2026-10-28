import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Info,
  ChevronRight,
} from 'lucide-react';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '@/services/notifications';
import { NotificationItem, UserRole } from '@/types';

interface NotificationDropdownProps {
  role: UserRole;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ role }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationReadApi(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadApi();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string, severity: string) => {
    if (severity === 'danger' || type === 'overdue') {
      return <AlertTriangle className="h-4 w-4 text-rose-600" />;
    }
    if (type === 'due_date') {
      return <Clock className="h-4 w-4 text-amber-600" />;
    }
    if (type === 'reservation_ready' || type === 'loan_approval') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    if (type === 'inventory_alert') {
      return <Bookmark className="h-4 w-4 text-gold-dark" />;
    }
    return <Info className="h-4 w-4 text-forest" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-charcoal-muted hover:text-forest hover:bg-ivory transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
        title="In-App Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-ivory-border shadow-scholarly-elevated py-2 z-50 text-xs text-charcoal animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-ivory-cream">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-forest-dark">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-forest hover:text-gold-dark"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-ivory-cream">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-charcoal-muted">
                <Bell className="h-6 w-6 text-forest mx-auto mb-1 opacity-40" />
                <p className="font-serif font-medium text-xs">All caught up!</p>
                <p className="text-[10px] text-charcoal-muted mt-0.5">No notifications pending.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.actionUrl) {
                      setIsOpen(false);
                      navigate(item.actionUrl);
                    }
                  }}
                  className={`p-3 flex items-start gap-3 hover:bg-ivory/50 cursor-pointer transition-colors ${
                    !item.read ? 'bg-gold/5' : ''
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-ivory shrink-0 mt-0.5 border border-ivory-border">
                    {getIcon(item.type, item.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-serif font-bold text-xs text-forest-dark truncate">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          title="Mark as read"
                          className="w-2 h-2 rounded-full bg-forest-600 hover:scale-125 transition-transform shrink-0"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 px-4 border-t border-ivory-cream">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(`/${role}/notifications`);
              }}
              className="w-full py-1 text-center font-semibold text-xs text-forest hover:text-gold-dark flex items-center justify-center gap-1"
            >
              <span>View All Notifications Centre</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

