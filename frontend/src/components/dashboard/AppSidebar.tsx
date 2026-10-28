import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Bookmark,
  CalendarCheck,
  ListChecks,
  Bell,
  User,
  Settings,
  BookMarked,
  Boxes,
  ArrowLeftRight,
  Clock,
  Users,
  BarChart3,
  ShieldCheck,
  Sliders,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { UserRole } from '@/types';
import { cn } from '@/utils/cn';

interface AppSidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  role,
  collapsed,
  onToggleCollapse,
  className,
}) => {
  const location = useLocation();

  // Navigation sets based on active dashboard role
  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { label: 'Overview', path: '/student', icon: LayoutDashboard },
          { label: 'Catalogue', path: '/student/catalogue', icon: BookOpen },
          { label: 'My Borrowed Books', path: '/student/borrowed', icon: Bookmark, badge: '3' },
          { label: 'Reservations', path: '/student/reservations', icon: CalendarCheck, badge: '1' },
          { label: 'Reading List', path: '/student/reading-list', icon: ListChecks, badge: '8' },
          { label: 'AI Study Assistant', path: '/student/study-assistant', icon: Sparkles },
          { label: 'Notifications', path: '/student/notifications', icon: Bell, badge: '2' },
          { label: 'My Profile', path: '/student/profile', icon: User },
          { label: 'Settings', path: '/student/settings', icon: Settings },
        ];
      case 'librarian':
        return [
          { label: 'Overview', path: '/librarian', icon: LayoutDashboard },
          { label: 'Manage Books', path: '/librarian/books', icon: BookMarked },
          { label: 'Inventory', path: '/librarian/inventory', icon: Boxes },
          { label: 'Loans & Returns', path: '/librarian/loans', icon: ArrowLeftRight, badge: '1120' },
          { label: 'Overdue & Fines', path: '/librarian/overdue', icon: Clock, badge: '28' },
          { label: 'Student Directory', path: '/librarian/students', icon: Users },
          { label: 'Reports & Analytics', path: '/librarian/reports', icon: BarChart3 },
          { label: 'Notifications', path: '/librarian/notifications', icon: Bell, badge: '4' },
          { label: 'Settings', path: '/librarian/settings', icon: Settings },
        ];
      case 'admin':
        return [
          { label: 'Overview', path: '/admin', icon: LayoutDashboard },
          { label: 'User Management', path: '/admin/users', icon: Users, badge: '2.4k' },
          { label: 'Role Management', path: '/admin/roles', icon: ShieldCheck },
          { label: 'Library Config', path: '/admin/config', icon: Sliders },
          { label: 'Audit Logs', path: '/admin/audit', icon: FileText },
          { label: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
          { label: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={cn(
        'relative bg-forest-dark text-ivory border-r border-forest-light/60 flex flex-col justify-between transition-all duration-300 z-30 select-none shadow-scholarly-lg',
        collapsed ? 'w-18' : 'w-64',
        className
      )}
    >
      {/* Top Header Logo */}
      <div className="p-4 border-b border-forest-light/40 flex items-center justify-between">
        <BrandLogo collapsed={collapsed} variant="light" linkTo="/" />
      </div>

      {/* Role Pill */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-forest/70 border-b border-forest-light/30 flex items-center justify-between text-xs">
          <span className="text-ivory/60 uppercase tracking-widest text-[10px] font-semibold">
            Portal Mode:
          </span>
          <span className="capitalize font-serif font-bold text-gold-light bg-forest-dark px-2 py-0.5 rounded border border-forest-light">
            {role}
          </span>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-forest text-gold border border-gold/40 shadow-xs'
                  : 'text-ivory/80 hover:bg-forest/50 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-gold' : 'text-ivory/70 group-hover:text-gold-light'
                )}
              />
              {!collapsed && (
                <span className="flex-1 truncate text-left">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                    isActive
                      ? 'bg-gold text-forest-dark'
                      : 'bg-forest border border-forest-light text-ivory/90'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions: Public Site Link & Toggle Collapse */}
      <div className="p-3 border-t border-forest-light/40 space-y-2 bg-forest-dark/80">
        <NavLink
          to="/"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-ivory/70 hover:text-white hover:bg-forest/50 transition-colors',
            collapsed && 'justify-center'
          )}
          title="Return to Public Landing Page"
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-gold-light" />
          {!collapsed && <span>Public Landing</span>}
        </NavLink>

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-ivory/60 hover:text-white hover:bg-forest/40 transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gold" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 text-gold" />
              <span className="text-[11px] uppercase tracking-wider">Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
