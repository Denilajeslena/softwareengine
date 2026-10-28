import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  linkTo?: string;
  variant?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  className,
  linkTo = '/',
  variant = 'dark',
}) => {
  const isDark = variant === 'dark';

  return (
    <Link
      to={linkTo}
      className={cn(
        'group flex items-center gap-3 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gold rounded-md p-1',
        className
      )}
      title="The Scholar's Shelf — Where Knowledge Finds Its Place."
    >
      {/* Refined emblem */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform group-hover:scale-105',
          isDark
            ? 'bg-forest border-forest-light text-gold'
            : 'bg-white border-ivory-border text-forest'
        )}
      >
        <BookOpen className="h-5 w-5" strokeWidth={2.2} />
      </div>

      {!collapsed && (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              'font-serif text-lg font-bold tracking-tight leading-tight',
              isDark ? 'text-charcoal' : 'text-white'
            )}
          >
            The Scholar's Shelf
          </span>
          <span
            className={cn(
              'text-[10px] uppercase tracking-widest font-medium',
              isDark ? 'text-forest' : 'text-gold-light'
            )}
          >
            College Library
          </span>
        </div>
      )}
    </Link>
  );
};

