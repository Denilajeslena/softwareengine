import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Public pages
import { LandingPage } from '@/pages/public/LandingPage';
import { ExploreCataloguePage } from '@/pages/public/ExploreCataloguePage';
import { BookDetailPage } from '@/pages/public/BookDetailPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { UserProfilePage } from '@/pages/common/UserProfilePage';

// Student pages
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage';
import { StudentBorrowedPage } from '@/pages/student/StudentBorrowedPage';
import { StudentReservationsPage } from '@/pages/student/StudentReservationsPage';
import { StudentReadingListPage } from '@/pages/student/StudentReadingListPage';
import { StudentNotificationsPage } from '@/pages/student/StudentNotificationsPage';
import { StudentProfilePage } from '@/pages/student/StudentProfilePage';
import { StudentSettingsPage } from '@/pages/student/StudentSettingsPage';
import { StudentStudyAssistantPage } from '@/pages/student/StudentStudyAssistantPage';

// Librarian pages
import { LibrarianDashboardPage } from '@/pages/librarian/LibrarianDashboardPage';
import { LibrarianManageBooksPage } from '@/pages/librarian/LibrarianManageBooksPage';
import { LibrarianInventoryPage } from '@/pages/librarian/LibrarianInventoryPage';
import { LibrarianLoansPage } from '@/pages/librarian/LibrarianLoansPage';
import { LibrarianStudentDirectoryPage } from '@/pages/librarian/LibrarianStudentDirectoryPage';
import { LibrarianReportsPage } from '@/pages/librarian/LibrarianReportsPage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUserManagementPage } from '@/pages/admin/AdminUserManagementPage';
import { AdminRoleManagementPage } from '@/pages/admin/AdminRoleManagementPage';
import { AdminLibraryConfigPage } from '@/pages/admin/AdminLibraryConfigPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminSystemAnalyticsPage } from '@/pages/admin/AdminSystemAnalyticsPage';

// Not found
import { NotFoundPage } from '@/pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalogue" element={<ExploreCataloguePage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Student Portal Routes (Accessible by Student & Admin) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <DashboardLayout role="student" />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboardPage />} />
        <Route path="catalogue" element={<ExploreCataloguePage />} />
        <Route path="borrowed" element={<StudentBorrowedPage />} />
        <Route path="reservations" element={<StudentReservationsPage />} />
        <Route path="reading-list" element={<StudentReadingListPage />} />
        <Route path="study-assistant" element={<StudentStudyAssistantPage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="settings" element={<StudentSettingsPage />} />
      </Route>

      {/* Protected Librarian Portal Routes (Accessible by Librarian & Admin only) */}
      <Route
        path="/librarian"
        element={
          <ProtectedRoute allowedRoles={['librarian', 'admin']}>
            <DashboardLayout role="librarian" />
          </ProtectedRoute>
        }
      >
        <Route index element={<LibrarianDashboardPage />} />
        <Route path="books" element={<LibrarianManageBooksPage />} />
        <Route path="inventory" element={<LibrarianInventoryPage />} />
        <Route path="loans" element={<LibrarianLoansPage />} />
        <Route path="overdue" element={<LibrarianLoansPage />} />
        <Route path="students" element={<LibrarianStudentDirectoryPage />} />
        <Route path="reports" element={<LibrarianReportsPage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="settings" element={<StudentSettingsPage />} />
      </Route>

      {/* Protected Admin Portal Routes (Accessible by Admin only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUserManagementPage />} />
        <Route path="roles" element={<AdminRoleManagementPage />} />
        <Route path="config" element={<AdminLibraryConfigPage />} />
        <Route path="audit" element={<AdminAuditLogsPage />} />
        <Route path="analytics" element={<AdminSystemAnalyticsPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="settings" element={<StudentSettingsPage />} />
      </Route>

      {/* Common Authenticated Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
