import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User as UserIcon, Check, ChevronDown, Sparkles, LogOut } from 'lucide-react';
import { SystemHealthBadge } from '@/components/common/SystemHealthBadge';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { cn } from '@/utils/cn';

interface TopNavigationProps {
  role: UserRole;
  onOpenMobileMenu: () => void;
  className?: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  role,
  onOpenMobileMenu,
  className,
}) => {
  const navigate = useNavigate();
  const { user, logout, quickLoginAsRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const rolesList: { role: UserRole; label: string; path: string }[] = [
    { role: 'student', label: 'Student Portal', path: '/student' },
    { role: 'librarian', label: 'Librarian Portal', path: '/librarian' },
    { role: 'admin', label: 'Admin Portal', path: '/admin' },
  ];

  const handleRoleSelect = async (targetRole: UserRole, path: string) => {
    setRoleMenuOpen(false);
    // If authenticated user already has this role, just navigate
    if (user?.role === targetRole) {
      navigate(path);
      return;
    }
    // Otherwise use quick switch for demo convenience
    const success = await quickLoginAsRole(targetRole);
    if (success) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user ? user.name : 'Guest Scholar';
  const displayRole = user ? user.role : role;
  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'GS';

  return (
    <header
      className={cn(
        'h-16 px-4 md:px-6 bg-white border-b border-ivory-border flex items-center justify-between sticky top-0 z-20 shadow-2xs',
        className
      )}
    >
      {/* Left: Mobile Toggle & Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-ivory-cream focus:outline-none focus:ring-2 focus:ring-gold"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs uppercase tracking-wider font-semibold text-charcoal-muted">
            The Scholar's Shelf
          </span>
          <h2 className="font-serif text-sm md:text-base font-bold text-forest-dark truncate">
            {role === 'student' && 'Student Learning & Circulation Workspace'}
            {role === 'librarian' && 'Library Operations & Collections Control'}
            {role === 'admin' && 'Centralized Institution Governance'}
          </h2>
        </div>
      </div>

      {/* Right: Quick Switcher, Health Badge, Profile */}
      <div className="flex items-center gap-3">
        {/* Live Flask/Mongo Health Badge */}
        <SystemHealthBadge compact />

        {/* Role Switcher Pill Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-ivory-cream border border-ivory-border text-forest-dark hover:bg-ivory hover:border-gold/50 transition-colors"
            title="Switch Dashboard Role View"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-dark" />
            <span className="capitalize hidden md:inline">Portal:</span>
            <span className="font-serif capitalize text-forest font-bold">{displayRole}</span>
            <ChevronDown className="h-3 w-3 text-charcoal-muted" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-ivory-border shadow-scholarly-elevated py-1.5 z-40 text-xs text-charcoal animate-in fade-in">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-charcoal-muted border-b border-ivory-border">
                Switch Active Role
              </div>
              {rolesList.map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role, item.path)}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-ivory transition-colors"
                >
                  <span className={cn(displayRole === item.role ? 'font-bold text-forest' : '')}>
                    {item.label}
                  </span>
                  {displayRole === item.role && <Check className="h-3.5 w-3.5 text-forest" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown Centre */}
        <NotificationDropdown role={displayRole} />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-ivory transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
            aria-label="Open user profile menu"
          >
            <div className="h-8 w-8 rounded-full bg-forest text-gold flex items-center justify-center font-serif font-bold text-xs shadow-xs border border-forest-light">
              {initials}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-charcoal leading-tight line-clamp-1">
                {displayName}
              </span>
              <span className="text-[10px] text-charcoal-muted capitalize">{displayRole}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-charcoal-muted hidden xl:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-ivory-border shadow-scholarly-elevated py-2 z-40 text-xs text-charcoal animate-in fade-in">
              <div className="px-4 py-2 border-b border-ivory-border">
                <p className="font-semibold text-forest-dark line-clamp-1">{displayName}</p>
                <p className="text-[11px] text-charcoal-muted truncate">{user?.email || 'Authenticated'}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-forest bg-forest/10 px-1.5 py-0.5 rounded capitalize">
                  {displayRole}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(`/${role}/profile`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-ivory flex items-center gap-2 text-charcoal"
                >
                  <UserIcon className="h-3.5 w-3.5 text-forest" />
                  <span>Account Profile & Pass</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
