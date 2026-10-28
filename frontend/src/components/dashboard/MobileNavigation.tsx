import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { UserRole } from '@/types';
import { cn } from '@/utils/cn';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  navItems: { label: string; path: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[];
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  role,
  navItems,
}) => {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-dark/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-forest-dark text-ivory p-4 shadow-scholarly-elevated flex flex-col justify-between z-10">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-forest-light/40">
            <BrandLogo variant="light" linkTo="/" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-ivory/70 hover:text-white hover:bg-forest focus:outline-none focus:ring-2 focus:ring-gold"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="py-2.5 text-xs text-ivory/60 border-b border-forest-light/20 flex items-center justify-between">
            <span className="uppercase tracking-wider text-[10px]">Active Portal:</span>
            <span className="capitalize font-serif text-gold font-bold">{role}</span>
          </div>

          <nav className="mt-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-forest text-gold border border-gold/40'
                      : 'text-ivory/80 hover:bg-forest/50 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-gold-light" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-forest border border-forest-light text-ivory">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-forest-light/40 space-y-2">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 text-xs text-ivory/70 hover:text-white rounded-lg hover:bg-forest/50"
          >
            <ExternalLink className="h-4 w-4 text-gold-light" />
            <span>Public Home Page</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
