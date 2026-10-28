import React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BookCoverProps {
  title: string;
  author: string;
  category?: string;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  author,
  category,
  accentColor = '#183D32',
  size = 'md',
  className,
}) => {
  const dimensions = {
    sm: 'w-20 h-28 text-[9px] p-2',
    md: 'w-32 h-44 text-xs p-3',
    lg: 'w-44 h-60 text-sm p-4',
  };

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-md shadow-md overflow-hidden flex flex-col justify-between border select-none transition-transform duration-200 group-hover:-translate-y-1',
        dimensions[size],
        className
      )}
      style={{
        backgroundColor: accentColor,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        color: '#F8F5EC',
      }}
    >
      {/* Vintage Book Spine Effect */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/25 border-r border-white/10" />

      {/* Decorative Gold Filigree lines */}
      <div className="pl-3.5 pr-1 pt-1">
        {category && (
          <span className="block text-[8px] uppercase tracking-wider font-semibold text-gold-light/90 truncate">
            {category}
          </span>
        )}
        <div className="mt-1 border-t border-gold/30 pt-1">
          <h4 className="font-serif font-bold leading-snug line-clamp-3 text-white">
            {title}
          </h4>
        </div>
      </div>

      <div className="pl-3.5 pr-1 pb-1 mt-auto">
        <div className="flex items-center justify-between border-t border-white/15 pt-1.5">
          <span className="text-[9px] font-sans text-ivory/80 line-clamp-1 italic">
            {author}
          </span>
          <BookOpen className="h-3 w-3 text-gold-light/70 shrink-0 ml-1" />
        </div>
      </div>
    </div>
  );
};

