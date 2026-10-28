import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import {
  User as UserIcon,
  Mail,
  Shield,
  Building,
  Calendar,
  LogOut,
  QrCode,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'librarian':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          'Full institutional system governance & policy configuration',
          'User account directory oversight & security audits',
          'Database replication & backend API telemetry monitoring',
          'Role-based access control assignment',
        ];
      case 'librarian':
        return [
          'Catalogue management & stack physical inventory audits',
          'Circulation desk processing: checkouts, returns & renewals',
          'Overdue loan notifications & holds queue management',
          'Departmental borrowing trend analytics & reports',
        ];
      case 'student':
      default:
        return [
          'Browse university library holdings & search stack locations',
          'Request borrow transactions for available texts (up to 5)',
          'Place reservation holds on checked-out volumes',
          'Personal reading lists & due date notification digest',
        ];
    }
  };

  return (
    <div className="space-y-8 text-left max-w-4xl mx-auto">
      <PageHeader
        title="Account Profile & Credentials"
        subtitle="Manage your institutional identity, verified credentials, and active system role permissions."
        actions={
          <SecondaryButton
            size="sm"
            onClick={() => setShowLogoutDialog(true)}
            leftIcon={<LogOut className="h-4 w-4 text-rose-600" />}
            className="hover:border-rose-300 hover:text-rose-700"
          >
            Sign Out
          </SecondaryButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Digital Identity Card */}
        <div className="md:col-span-5 bg-forest text-ivory p-6 rounded-2xl border border-forest-light shadow-scholarly-elevated space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-forest-light/60">
            <span className="font-serif font-bold text-sm text-gold-light">
              The Scholar's Shelf
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-ivory/70">
              Identity Pass
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-forest-dark border-2 border-gold flex items-center justify-center font-serif text-xl font-bold text-gold">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white line-clamp-1">
                {user.name}
              </h3>
              <p className="text-xs text-gold-light/90 uppercase tracking-wider font-semibold">
                Role: {user.role}
              </p>
              <p className="text-[11px] text-ivory/70 line-clamp-1">{user.department}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-forest-light/60 flex items-center justify-between">
            <div className="font-mono text-[10px] text-ivory/60">
              User ID: {user.id}
              {user.student_id && <div className="text-gold-light">Pass ID: {user.student_id}</div>}
            </div>
            <div className="p-2 bg-white rounded-md text-forest shrink-0" title="Digital Barcode / QR Identification">
              <QrCode className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Right Column: Profile Information & Permissions */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
              <h3 className="font-serif font-bold text-base text-forest-dark">
                Personal & Institutional Details
              </h3>
              <StatusBadge
                size="sm"
                status={getRoleBadgeStyle(user.role)}
                label={`Role: ${user.role.toUpperCase()}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-charcoal-muted flex items-center gap-1.5 mb-1">
                  <UserIcon className="h-3.5 w-3.5 text-forest" /> Full Name
                </span>
                <span className="font-semibold text-charcoal text-sm">{user.name}</span>
              </div>

              <div>
                <span className="text-charcoal-muted flex items-center gap-1.5 mb-1">
                  <Mail className="h-3.5 w-3.5 text-forest" /> Institutional Email
                </span>
                <span className="font-semibold text-charcoal">{user.email}</span>
              </div>

              <div>
                <span className="text-charcoal-muted flex items-center gap-1.5 mb-1">
                  <Building className="h-3.5 w-3.5 text-forest" /> Assigned Department
                </span>
                <span className="font-semibold text-charcoal">{user.department || 'University General'}</span>
              </div>

              <div>
                <span className="text-charcoal-muted flex items-center gap-1.5 mb-1">
                  <Shield className="h-3.5 w-3.5 text-forest" /> Security Standing
                </span>
                <span className="font-semibold text-forest">Active / Verified</span>
              </div>

              <div>
                <span className="text-charcoal-muted flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-forest" /> Member Since
                </span>
                <span className="font-semibold text-charcoal">
                  {user.created_at ? formatDate(user.created_at) : 'Active Session'}
                </span>
              </div>
            </div>
          </div>

          {/* Role Privileges Card */}
          <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-3">
            <h4 className="font-serif font-bold text-sm text-forest-dark flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold-dark" />
              Active System Privileges ({user.role.toUpperCase()})
            </h4>

            <ul className="space-y-2 text-xs text-charcoal">
              {getRolePermissions(user.role).map((perm, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-forest shrink-0 mt-0.5" />
                  <span className="leading-tight">{perm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out of The Scholar's Shelf"
        message="Are you sure you want to end your active session? You will be returned to the login portal."
        confirmLabel="Yes, Sign Out"
        cancelLabel="Stay Signed In"
      />
    </div>
  );
};
