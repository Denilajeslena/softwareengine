import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { TopNavigation } from '@/components/dashboard/TopNavigation';
import { MobileNavigation } from '@/components/dashboard/MobileNavigation';
import { UserRole } from '@/types';
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
} from 'lucide-react';

interface DashboardLayoutProps {
  role: UserRole;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getMobileNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { label: 'Overview', path: '/student', icon: LayoutDashboard },
          { label: 'Catalogue', path: '/student/catalogue', icon: BookOpen },
          { label: 'My Borrowed Books', path: '/student/borrowed', icon: Bookmark, badge: '3' },
          { label: 'Reservations', path: '/student/reservations', icon: CalendarCheck, badge: '1' },
          { label: 'Reading List', path: '/student/reading-list', icon: ListChecks, badge: '8' },
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

  return (
    <div className="flex h-screen bg-ivory text-charcoal overflow-hidden font-sans">
      {/* Desktop App Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <AppSidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Offcanvas Navigation */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        role={role}
        navItems={getMobileNavItems()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopNavigation
          role={role}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-ivory/60">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
