import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormField } from '@/components/common/FormField';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  UserCheck,
  Shield,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, quickLoginAsRole, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'demo'>('form');

  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const destination = fromLocation || `/${user.role}`;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, fromLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide your institutional email address.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
    } else if (result.user) {
      const destination = fromLocation || `/${result.user.role}`;
      navigate(destination, { replace: true });
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    const success = await quickLoginAsRole(role);
    setIsSubmitting(false);

    if (success) {
      navigate(`/${role}`, { replace: true });
    } else {
      setError(`Failed to authenticate as ${role}. Ensure Flask backend is running on port 5000.`);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <BrandLogo variant="dark" linkTo="/" />
        </div>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-forest-dark">
            Sign in to Your Account
          </h1>
          <p className="mt-1 text-xs md:text-sm text-charcoal-muted font-sans">
            "Where Knowledge Finds Its Place." Access university library collections, holds, and circulation services.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-ivory-border shadow-scholarly-elevated space-y-6">
          {/* Tabs: Standard Sign In vs Quick Demo Profiles */}
          <div className="grid grid-cols-2 p-1 bg-ivory-cream rounded-lg border border-ivory-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-2 rounded-md transition-all ${
                activeTab === 'form'
                  ? 'bg-forest text-gold shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Credentials Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-forest text-gold shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-gold-dark" />
              <span>Quick Role Logins</span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Institutional Email" htmlFor="login-email" required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@scholars.shelf"
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-ivory-border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </FormField>

              <FormField label="Password" htmlFor="login-password" required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-ivory-border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal p-0.5 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <div className="pt-2">
                <PrimaryButton
                  type="submit"
                  size="md"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  Sign In to Library
                </PrimaryButton>
              </div>
            </form>
          ) : (
            /* Quick Role Logins Panel */
            <div className="space-y-3">
              <p className="text-xs text-charcoal-muted text-center pb-1">
                Select a verified demonstration account to sign in with one click:
              </p>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin('student')}
                className="w-full p-3 rounded-xl border border-ivory-border hover:border-gold hover:bg-ivory/50 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-forest/10 text-forest group-hover:bg-forest group-hover:text-gold transition-colors">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-forest-dark">Alexandra Vance (Student)</h4>
                    <p className="text-[11px] text-charcoal-muted font-mono">student@scholars.shelf</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-forest uppercase tracking-wider bg-forest/10 px-2 py-0.5 rounded">
                  Student
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin('librarian')}
                className="w-full p-3 rounded-xl border border-ivory-border hover:border-gold hover:bg-ivory/50 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-forest/10 text-forest group-hover:bg-forest group-hover:text-gold transition-colors">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-forest-dark">Dr. Eleanor Vance (Librarian)</h4>
                    <p className="text-[11px] text-charcoal-muted font-mono">librarian@scholars.shelf</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider bg-gold-light/20 px-2 py-0.5 rounded">
                  Librarian
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin('admin')}
                className="w-full p-3 rounded-xl border border-ivory-border hover:border-gold hover:bg-ivory/50 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-forest/10 text-forest group-hover:bg-forest group-hover:text-gold transition-colors">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-forest-dark">Sarah Connor (Administrator)</h4>
                    <p className="text-[11px] text-charcoal-muted font-mono">admin@scholars.shelf</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                  Admin
                </span>
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-ivory-border text-center text-xs text-charcoal-muted">
            <span>New university student? </span>
            <Link
              to="/register"
              className="font-bold text-forest hover:text-gold-dark hover:underline transition-colors"
            >
              Register for a Library Pass &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
