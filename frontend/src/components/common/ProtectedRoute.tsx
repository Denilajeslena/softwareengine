import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { LoadingState } from '@/components/common/LoadingState';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <LoadingState message="Verifying session and role permissions..." />
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleWorkstationPath = `/${user.role}`;

    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-ivory-border p-8 shadow-scholarly-elevated text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 text-rose-700 mx-auto flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-rose-800">
              Access Restricted &bull; HTTP 403 Forbidden
            </span>
            <h2 className="font-serif text-2xl font-bold text-forest-dark">
              Insufficient Role Permissions
            </h2>
            <p className="text-xs md:text-sm text-charcoal-muted leading-relaxed">
              You are currently signed in as <strong className="text-forest-dark uppercase">{user.name} ({user.role})</strong>.
              This workstation requires one of the following roles: <span className="font-semibold text-forest">{allowedRoles.join(', ')}</span>.
            </p>
          </div>

          <div className="p-3.5 bg-ivory-cream/80 rounded-xl border border-ivory-border text-xs text-charcoal text-left">
            <span className="font-semibold text-forest-dark block mb-1">Enforced Security Boundary:</span>
            <span>Students cannot access staff or administration consoles. To access this workstation, please sign in with an authorized staff credential.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <SecondaryButton
              size="sm"
              onClick={() => navigate('/login')}
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Sign In as Another Role
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={() => navigate(roleWorkstationPath)}
              rightIcon={<ArrowLeft className="h-4 w-4 rotate-180" />}
            >
              Go to My {user.role.toUpperCase()} Portal
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
