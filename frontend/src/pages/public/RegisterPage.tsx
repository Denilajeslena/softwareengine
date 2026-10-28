import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormField } from '@/components/common/FormField';
import {
  User as UserIcon,
  Mail,
  Lock,
  Building,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('School of Computing & Mathematical Sciences');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'School of Computing & Mathematical Sciences',
    'Faculty of Artificial Intelligence & Robotics',
    'Department of Pure & Applied Mathematics',
    'Department of Physics & Astronomy',
    'Faculty of Literature, Languages & History',
    'School of Social Sciences & Philosophy',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Full name must be at least 2 characters long.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid institutional email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      department,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
    } else {
      navigate('/student', { replace: true });
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
            Student Registration
          </h1>
          <p className="mt-1 text-xs md:text-sm text-charcoal-muted font-sans">
            "Where Knowledge Finds Its Place." Enroll for your digital college library card and stack borrowing privileges.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-ivory-border shadow-scholarly-elevated space-y-6">
          {/* Security policy notice */}
          <div className="p-3 bg-forest/5 rounded-xl border border-forest/15 flex items-start gap-2.5 text-xs text-forest-dark">
            <ShieldCheck className="h-4 w-4 shrink-0 text-forest mt-0.5" />
            <p className="leading-tight">
              <strong>Academic Policy: </strong>
              Public registration solely provisions verified Student accounts. Staff & Administrator workstations require institutional assignment.
            </p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" htmlFor="reg-name" required>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted pointer-events-none" />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alexandra Vance"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-ivory-border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </FormField>

            <FormField label="Institutional Email" htmlFor="reg-email" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.vance@student.university.edu"
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-ivory-border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </FormField>

            <FormField label="Academic Faculty / Department" htmlFor="reg-department">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted pointer-events-none" />
                <select
                  id="reg-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-ivory-border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {departments.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            <FormField label="Password" htmlFor="reg-password" helperText="Must be at least 6 characters" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted pointer-events-none" />
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-ivory-border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </FormField>

            <FormField label="Confirm Password" htmlFor="reg-confirm" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted pointer-events-none" />
                <input
                  id="reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-ivory-border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </FormField>

            <div className="pt-2">
              <PrimaryButton
                type="submit"
                size="md"
                fullWidth
                isLoading={isSubmitting}
                leftIcon={<GraduationCap className="h-4 w-4" />}
              >
                Register & Issue Library Pass
              </PrimaryButton>
            </div>
          </form>

          <div className="pt-4 border-t border-ivory-border text-center text-xs text-charcoal-muted">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-bold text-forest hover:text-gold-dark hover:underline transition-colors"
            >
              Sign In Here &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
