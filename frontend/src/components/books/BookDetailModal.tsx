import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '@/types';
import { Modal } from '@/components/common/Modal';
import { BookCover } from './BookCover';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { MapPin, Calendar, Building, Hash, Star, ExternalLink } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (action: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onActionClick,
}) => {
  if (!book) return null;

  const isAvailable = book.availableCopies > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={book.title}
      description={`By ${book.author}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <Link
            to={`/books/${book.id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-shelf-forest hover:text-shelf-gold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Full Volume & Stacks View</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <SecondaryButton size="sm" onClick={onClose}>
              Close
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              disabled={!isAvailable}
              onClick={() => onActionClick && onActionClick('borrow')}
              title={isAvailable ? 'Check out volume' : 'No copies currently available'}
            >
              {isAvailable ? 'Borrow Volume' : 'Place Hold / Reserve'}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex justify-center md:justify-start shrink-0">
          <BookCover
            title={book.title}
            author={book.author}
            category={book.category}
            accentColor={book.accentColor}
            size="lg"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <StatusBadge
              status={isAvailable ? 'Available' : 'Checked Out'}
              label={
                isAvailable
                  ? `${book.availableCopies} of ${book.totalCopies} Available`
                  : 'All Copies Borrowed'
              }
            />
            <div className="flex items-center gap-1 text-gold-dark text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{book.rating.toFixed(1)} / 5.0</span>
            </div>
          </div>

          <p className="text-sm text-charcoal-light leading-relaxed">
            {book.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs border-y border-ivory-border py-3 bg-ivory/30 px-3 rounded-lg">
            <div className="flex items-center gap-1.5 text-charcoal-muted">
              <Hash className="h-3.5 w-3.5 text-forest" />
              <span className="font-mono text-charcoal">{book.isbn}</span>
            </div>
            <div className="flex items-center gap-1.5 text-charcoal-muted">
              <Calendar className="h-3.5 w-3.5 text-forest" />
              <span>Published: {book.year}</span>
            </div>
            <div className="flex items-center gap-1.5 text-charcoal-muted">
              <Building className="h-3.5 w-3.5 text-forest" />
              <span className="truncate">{book.publisher}</span>
            </div>
            <div className="flex items-center gap-1.5 text-charcoal-muted">
              <MapPin className="h-3.5 w-3.5 text-forest" />
              <span className="font-medium text-forest-dark">{book.shelfLocation}</span>
            </div>
          </div>

          {book.tags && book.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-charcoal-muted">Tags:</span>
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] bg-ivory-cream text-charcoal border border-ivory-border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

