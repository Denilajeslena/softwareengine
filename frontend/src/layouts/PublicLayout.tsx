import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { SystemHealthBadge } from '@/components/common/SystemHealthBadge';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, ArrowRight, LogIn, UserPlus, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore Books', path: '/catalogue' },
    { label: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-charcoal">
      {/* Top University Announcement Bar */}
      <div className="bg-forest-dark text-ivory/80 text-[11px] py-1.5 px-4 border-b border-forest-light text-center flex items-center justify-between">
        <span className="hidden sm:inline italic">
          "Where Knowledge Finds Its Place." &mdash; University Central Library Catalogue
        </span>
        <span className="sm:hidden italic">The Scholar's Shelf &bull; College Library</span>
        <div className="flex items-center gap-3 ml-auto">
          <SystemHealthBadge compact />
        </div>
      </div>

      {/* Main Public Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-ivory-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <BrandLogo variant="dark" linkTo="/" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'transition-colors py-1 relative',
                    isActive
                      ? 'text-forest font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold'
                      : 'text-charcoal-light hover:text-forest'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <SecondaryButton
              size="sm"
              onClick={() => navigate('/catalogue')}
            >
              Browse Catalogue
            </SecondaryButton>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <PrimaryButton
                  size="sm"
                  onClick={() => navigate(`/${user.role}`)}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  My {user.role.toUpperCase()} Workspace
                </PrimaryButton>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-charcoal-muted hover:text-rose-700 hover:bg-rose-50"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SecondaryButton
                  size="sm"
                  onClick={() => navigate('/register')}
                  leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                >
                  Register
                </SecondaryButton>
                <PrimaryButton
                  size="sm"
                  onClick={() => navigate('/login')}
                  rightIcon={<LogIn className="h-3.5 w-3.5" />}
                >
                  Sign In
                </PrimaryButton>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-charcoal hover:bg-ivory-cream focus:outline-none focus:ring-2 focus:ring-gold"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-ivory-border bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-ivory transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-3 border-t border-ivory-border flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <PrimaryButton
                    size="md"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(`/${user.role}`);
                    }}
                  >
                    Open {user.role.toUpperCase()} Workspace
                  </PrimaryButton>
                  <SecondaryButton
                    size="md"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                  >
                    Sign Out
                  </SecondaryButton>
                </>
              ) : (
                <>
                  <PrimaryButton
                    size="md"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    Sign In
                  </PrimaryButton>
                  <SecondaryButton
                    size="md"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/register');
                    }}
                  >
                    Register as Student
                  </SecondaryButton>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Slot */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-forest-dark text-ivory border-t border-forest-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-4">
              <BrandLogo variant="light" linkTo="/" />
              <p className="text-sm text-ivory/80 max-w-sm leading-relaxed font-sans">
                Where Knowledge Finds Its Place. The Scholar's Shelf is a dedicated academic library management environment designed for curious minds, researchers, and university staff.
              </p>
              <p className="text-xs text-gold-light/90 font-serif italic">
                Preserving timeless wisdom, empowering tomorrow's breakthroughs.
              </p>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-gold-light mb-3">
                Portal Access
              </h4>
              <ul className="space-y-2 text-xs text-ivory/80">
                <li>
                  <Link to="/login" className="hover:text-gold transition-colors font-semibold">
                    Sign In to Portal
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-gold transition-colors">
                    Student Registration
                  </Link>
                </li>
                <li>
                  <Link to="/student" className="hover:text-gold transition-colors">
                    Student Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/librarian" className="hover:text-gold transition-colors">
                    Librarian Workstation
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-gold transition-colors">
                    Institution Administration
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-gold-light mb-3">
                Security & Roles
              </h4>
              <ul className="space-y-2 text-xs text-ivory/80">
                <li>Three Roles: Student, Librarian, Admin</li>
                <li>Password Hashing: Werkzeug PBKDF2</li>
                <li>Session Protocol: JWT Bearer</li>
                <li>Backend RBAC Enforced</li>
                <li className="pt-2">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-forest border border-forest-light text-gold">
                    Auth: Implemented (Part 2)
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-forest-light/40 flex flex-col sm:flex-row items-center justify-between text-xs text-ivory/60 gap-4">
            <p>&copy; {new Date().getFullYear()} The Scholar's Shelf. All rights reserved.</p>
            <p className="italic">"Where Knowledge Finds Its Place."</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
