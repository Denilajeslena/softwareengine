import React, { useState } from 'react';
import { Book } from '@/types';
import { BookCover } from './BookCover';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BookDetailModal } from './BookDetailModal';
import { Star, MapPin, Eye } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BookCardProps {
  book: Book;
  onAction?: (book: Book) => void;
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onAction, className }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const isAvailable = book.availableCopies > 0;

  return (
    <>
      <div
        className={cn(
          'group relative bg-white rounded-xl border border-ivory-border p-4 shadow-scholarly transition-all duration-200 hover:shadow-scholarly-lg hover:border-gold/50 flex flex-col justify-between',
          className
        )}
      >
        <div className="flex gap-4">
          <BookCover
            title={book.title}
            author={book.author}
            category={book.category}
            accentColor={book.accentColor}
            size="md"
          />

          <div className="flex flex-col flex-1 min-w-0 justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold-dark block">
                {book.category}
              </span>
              <h3
                onClick={() => setIsDetailOpen(true)}
                className="font-serif font-bold text-forest-dark text-base leading-snug line-clamp-2 mt-1 cursor-pointer hover:text-gold-dark transition-colors"
                title={book.title}
              >
                {book.title}
              </h3>
              <p className="text-xs text-charcoal-muted line-clamp-1 italic mt-0.5">
                {book.author}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <StatusBadge
                  size="sm"
                  status={isAvailable ? 'Available' : 'Checked Out'}
                  label={
                    isAvailable
                      ? `Available (${book.availableCopies}/${book.totalCopies})`
                      : 'Checked Out (0 copies)'
                  }
                />
                <div className="flex items-center gap-0.5 text-gold-dark font-medium text-xs">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{book.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-charcoal-muted truncate">
                <MapPin className="h-3 w-3 text-forest shrink-0" />
                <span className="truncate">{book.shelfLocation}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-ivory-cream flex items-center justify-between">
          <span className="text-[10px] text-sage-600 font-mono">
            ISBN: {book.isbn.substring(0, 11)}...
          </span>

          <button
            onClick={() => {
              setIsDetailOpen(true);
              if (onAction) onAction(book);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold-dark transition-colors py-1 px-2 rounded hover:bg-ivory"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>
        </div>
      </div>

      <BookDetailModal
        book={book}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
};

