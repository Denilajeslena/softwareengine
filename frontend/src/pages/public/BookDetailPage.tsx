import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookCover } from '@/components/books/BookCover';
import { BookCard } from '@/components/books/BookCard';
import { CopyQrModal } from '@/components/books/CopyQrModal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';
import {
  fetchBookByIdApi,
  addCopyApi,
  archiveBookApi,
  BookDetailResponse,
} from '@/services/books';
import { requestLoanApi, placeReservationApi } from '@/services/circulation';
import {
  fetchSimilarBooksApi,
  fetchAvailableAlternativesApi,
  SemanticBookResult,
} from '@/services/ai';
import {
  fetchBookReviewsApi,
  submitBookReviewApi,
  checkReadingListApi,
  saveToReadingListApi,
  removeFromReadingListApi,
} from '@/services/reading';
import { useAccessibility } from '@/context/AccessibilityContext';
import { BookCopy, BookReviewsResponse } from '@/types';
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Layers,
  Star,
  QrCode,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Bookmark,
  Volume2,
  VolumeX,
  ThumbsUp,
  Brain,
  Send,
} from 'lucide-react';

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaff = user?.role === 'librarian' || user?.role === 'admin';

  const [book, setBook] = useState<BookDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR Modal states
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Copy Addition State
  const [addingCopy, setAddingCopy] = useState(false);
  const [newShelfLocation, setNewShelfLocation] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Borrow / Reserve States
  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);

  // BookMind AI States
  const [similarBooks, setSimilarBooks] = useState<SemanticBookResult[]>([]);
  const [alternatives, setAlternatives] = useState<SemanticBookResult[]>([]);

  // Reading List & Review States
  const [isSavedInList, setIsSavedInList] = useState(false);
  const [reviewsData, setReviewsData] = useState<BookReviewsResponse | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isRecommended, setIsRecommended] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const { speak, stopSpeaking, isSpeaking } = useAccessibility();

  const loadBook = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const res = await fetchBookByIdApi(id);
    if (res.success && res.data?.book) {
      setBook(res.data.book);
      setNewShelfLocation(res.data.book.shelfLocation || '');
    } else {
      setError(res.message || 'Book record could not be loaded.');
    }
    setLoading(false);
  };

  const loadAiRecommendations = async () => {
    if (!id) return;
    const [simRes, altRes] = await Promise.all([
      fetchSimilarBooksApi(id, 4),
      fetchAvailableAlternativesApi(id, 3),
    ]);

    if (simRes.success && simRes.data) {
      setSimilarBooks(simRes.data.similarBooks);
    }
    if (altRes.success && altRes.data) {
      setAlternatives(altRes.data.alternatives);
    }
  };

  const loadReviewsAndSaved = async () => {
    if (!id) return;
    const revRes = await fetchBookReviewsApi(id);
    if (revRes.success && revRes.data) {
      setReviewsData(revRes.data);
    }
    if (user) {
      const saveRes = await checkReadingListApi(id);
      if (saveRes.success && saveRes.data) {
        setIsSavedInList(saveRes.data.isSaved);
      }
    }
  };

  useEffect(() => {
    loadBook();
    loadAiRecommendations();
    loadReviewsAndSaved();
  }, [id, user]);

  const handleToggleBookmark = async () => {
    if (!id) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (isSavedInList) {
      await removeFromReadingListApi(id);
      setIsSavedInList(false);
    } else {
      await saveToReadingListApi(id);
      setIsSavedInList(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!reviewText.trim()) return;

    setSubmittingReview(true);
    const res = await submitBookReviewApi(id, reviewRating, reviewText, isRecommended);
    setSubmittingReview(false);

    if (res.success) {
      setReviewText('');
      setReviewNotice('Thank you! Your peer book review has been published.');
      setTimeout(() => setReviewNotice(null), 4000);
      const revRes = await fetchBookReviewsApi(id);
      if (revRes.success && revRes.data) {
        setReviewsData(revRes.data);
      }
    } else {
      setReviewNotice(res.message || 'Failed to submit review.');
      setTimeout(() => setReviewNotice(null), 4000);
    }
  };

  const handleBorrow = async () => {
    if (!book) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setBorrowing(true);
    setActionMessage(null);
    const res = await requestLoanApi(book.id);
    setBorrowing(false);
    if (res.success) {
      setActionMessage({
        type: 'success',
        text: `Loan registered successfully! Due date: ${res.data?.loan?.dueDate?.substring(0, 10)}. You can monitor this in My Borrowed Books.`,
      });
      loadBook();
      loadAiRecommendations();
    } else {
      setActionMessage({
        type: 'error',
        text: res.message || 'Unable to borrow volume.',
      });
    }
  };

  const handleReserve = async () => {
    if (!book) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setReserving(true);
    setActionMessage(null);
    const res = await placeReservationApi(book.id);
    setReserving(false);
    if (res.success) {
      setActionMessage({
        type: 'success',
        text: `Hold reservation confirmed! You are #${res.data?.reservation?.queuePosition || 1} in queue. You will receive an automated notification when the volume is ready for pickup.`,
      });
      loadBook();
    } else {
      setActionMessage({
        type: 'error',
        text: res.message || 'Unable to place reservation hold.',
      });
    }
  };

  const handleAddCopy = async () => {
    if (!book) return;
    setAddingCopy(true);
    setActionMessage(null);
    const res = await addCopyApi(book.id, {
      shelfLocation: newShelfLocation || book.shelfLocation,
    });
    setAddingCopy(false);

    if (res.success) {
      setActionMessage({ type: 'success', text: 'New copy registered successfully with distinct barcode and QR code.' });
      loadBook();
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Failed to add copy.' });
    }
  };

  const handleArchiveBook = async () => {
    if (!book) return;
    if (!window.confirm(`Are you sure you want to archive "${book.title}"? It will no longer be visible to students in the catalogue.`)) {
      return;
    }

    const res = await archiveBookApi(book.id);
    if (res.success) {
      alert(`Volume "${book.title}" archived successfully.`);
      navigate(isStaff ? '/librarian/books' : '/catalogue');
    } else {
      alert(res.message || 'Failed to archive book.');
    }
  };

  const openCopyQr = (copy: BookCopy) => {
    setSelectedCopy(copy);
    setIsQrOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <LoadingState message="Retrieving volume catalogue record from library archives..." />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12 text-shelf-gold" />}
          title="Volume Not Found"
          description={error || 'The requested volume is either archived or does not exist.'}
          action={
            <Link to="/catalogue">
              <PrimaryButton leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Catalogue
              </PrimaryButton>
            </Link>
          }
        />
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-left">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shelf-border pb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-shelf-forest hover:text-shelf-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Bookmark Toggle */}
          <button
            onClick={handleToggleBookmark}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isSavedInList
                ? 'bg-forest text-warm-ivory border-forest'
                : 'border-shelf-forest/30 bg-warm-ivory text-shelf-forest hover:bg-warm-sand'
            }`}
            title={isSavedInList ? 'Saved in personal reading list' : 'Save to reading list'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSavedInList ? 'fill-gold text-gold' : 'text-shelf-forest'}`} />
            <span>{isSavedInList ? 'Saved in List' : 'Save Reference'}</span>
          </button>

          {/* AI Study Assistant Link */}
          <button
            onClick={() => navigate('/student/study-assistant')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gold/40 bg-gold/10 text-forest-dark hover:bg-gold/20 transition-colors"
            title="Open in AI Study Assistant"
          >
            <Brain className="w-3.5 h-3.5 text-gold-dark" />
            <span>Study Assistant</span>
          </button>

          {isStaff && (
            <SecondaryButton
              size="sm"
              onClick={handleArchiveBook}
              leftIcon={<Trash2 className="w-4 h-4 text-red-700" />}
            >
              Archive Volume
            </SecondaryButton>
          )}

          <button
            onClick={() => {
              setSelectedCopy(null);
              setIsQrOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-shelf-forest/30 bg-warm-ivory text-shelf-forest hover:bg-warm-sand transition-colors"
          >
            <QrCode className="w-4 h-4 text-shelf-gold" />
            Title QR Code
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Book Hero Card */}
      <div className="bg-white rounded-2xl border border-shelf-border shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Cover & Quick Badge */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center">
            <BookCover
              title={book.title}
              author={book.author}
              category={book.category}
              accentColor={book.accentColor || '#183D32'}
              size="lg"
            />
            <div className="mt-4 w-full text-center">
              <StatusBadge
                status={isAvailable ? 'success' : 'danger'}
                label={
                  isAvailable
                    ? `${book.availableCopies} of ${book.totalCopies} Copies Available`
                    : 'Currently Checked Out'
                }
              />
            </div>

            {/* Student Action Button */}
            {!isStaff && (
              <div className="w-full mt-4 space-y-2">
                {isAvailable ? (
                  <PrimaryButton
                    fullWidth
                    onClick={handleBorrow}
                    disabled={borrowing}
                    isLoading={borrowing}
                    leftIcon={<BookOpen className="w-4 h-4" />}
                  >
                    {borrowing ? 'Registering Loan...' : 'Borrow Volume (14 Days)'}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    fullWidth
                    onClick={handleReserve}
                    disabled={reserving}
                    isLoading={reserving}
                    leftIcon={<Clock className="w-4 h-4" />}
                  >
                    {reserving ? 'Joining Waitlist...' : 'Place Hold / Waitlist'}
                  </PrimaryButton>
                )}
                {!user && (
                  <p className="text-[11px] text-center text-charcoal-muted">
                    Sign in to check out or hold this volume.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Details & Metadata */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-sand text-shelf-forest border border-shelf-border">
                {book.category}
              </span>
              <span className="text-xs text-shelf-charcoal/60">
                Published {book.year || (book as any).publicationYear}
              </span>
              {book.rating && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 ml-auto">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {book.rating.toFixed(1)} / 5.0
                </span>
              )}
            </div>

            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-shelf-forest leading-tight">
                {book.title}
              </h1>
              <p className="font-sans text-base text-shelf-charcoal/80 mt-1">
                By <span className="font-semibold text-shelf-forest">{book.author}</span>
              </p>
            </div>

            {/* Metadata Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-shelf-border/70 text-xs">
              <div>
                <span className="block text-shelf-charcoal/60">ISBN</span>
                <span className="font-mono font-medium text-shelf-charcoal">{book.isbn}</span>
              </div>
              <div>
                <span className="block text-shelf-charcoal/60">Shelf Stack</span>
                <span className="font-medium text-shelf-forest flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-shelf-gold" />
                  {book.shelfLocation}
                </span>
              </div>
              <div>
                <span className="block text-shelf-charcoal/60">Total Copies</span>
                <span className="font-medium text-shelf-charcoal">{book.totalCopies} in inventory</span>
              </div>
              <div>
                <span className="block text-shelf-charcoal/60">Catalog ID</span>
                <span className="font-mono text-shelf-charcoal/80">{book.id}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-bold text-shelf-forest uppercase tracking-wider">
                  Volume Overview
                </h3>
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      speak(`${book.title}. By ${book.author}. ${book.description}`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-ivory text-forest border border-ivory-border hover:bg-forest hover:text-warm-ivory transition-colors"
                  title="Listen to volume overview with Text-to-Speech"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      <span>Stop Narration</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-forest" />
                      <span>Listen (TTS)</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-sans text-shelf-charcoal/85 leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BookMind AI: In-Stock Available Alternatives (Rendered when volume is checked out or as assistant guidance) */}
      {!isAvailable && alternatives.length > 0 && (
        <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-amber-950">
                BookMind AI: Recommended In-Stock Alternatives
              </h3>
              <p className="text-xs text-amber-900/80">
                Since all copies of "{book.title}" are currently checked out, BookMind identified these closely related titles available right now in campus stacks:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl bg-white border border-amber-200/60 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-shelf-forest uppercase tracking-wider">{alt.category}</span>
                    <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {alt.availableCopies} in stock
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-forest-dark line-clamp-1">{alt.title}</h4>
                  <p className="text-xs text-charcoal-muted italic">{alt.author}</p>
                  <p className="text-[11px] text-charcoal/80 mt-2 leading-relaxed bg-amber-50/40 p-2 rounded border border-amber-100">
                    {alt.substituteReason}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-charcoal-muted flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-shelf-gold" />
                    {alt.shelfLocation}
                  </span>
                  <Link
                    to={`/books/${alt.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold-dark transition-colors"
                  >
                    <span>View & Borrow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copies Inventory Section */}
      <div className="bg-white rounded-2xl border border-shelf-border shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shelf-border pb-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-shelf-forest flex items-center gap-2">
              <Layers className="w-5 h-5 text-shelf-gold" />
              Physical Stacks & Copy Inventory
            </h2>
            <p className="text-xs text-shelf-charcoal/70">
              Each physical volume carries a unique QR code and barcode for checkout and stock audits.
            </p>
          </div>

          {/* Librarian Add Copy Quick Form */}
          {isStaff && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Shelf (e.g. Stack C-3)"
                value={newShelfLocation}
                onChange={(e) => setNewShelfLocation(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
              <PrimaryButton
                size="sm"
                onClick={handleAddCopy}
                disabled={addingCopy}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                {addingCopy ? 'Adding...' : 'Add Copy'}
              </PrimaryButton>
            </div>
          )}
        </div>

        {/* Copy Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-shelf-border text-shelf-charcoal/60 uppercase tracking-wider text-[11px] bg-warm-sand/20">
                <th className="py-2.5 px-3">Copy ID</th>
                <th className="py-2.5 px-3">Barcode</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3 text-right">QR Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shelf-border/60">
              {book.copies && book.copies.length > 0 ? (
                book.copies.map((copy: BookCopy) => (
                  <tr key={copy.copyId} className="hover:bg-warm-sand/20 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-shelf-forest">
                      {copy.copyId}
                    </td>
                    <td className="py-3 px-3 font-mono text-shelf-charcoal/80">
                      {copy.barcode}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-shelf-charcoal">
                        <MapPin className="w-3 h-3 text-shelf-gold shrink-0" />
                        {copy.shelfLocation || book.shelfLocation}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        status={
                          copy.status === 'available'
                            ? 'success'
                            : copy.status === 'borrowed'
                            ? 'warning'
                            : 'info'
                        }
                        label={copy.status.toUpperCase()}
                      />
                    </td>
                    <td className="py-3 px-3 capitalize text-shelf-charcoal/80">
                      {copy.condition || 'Good'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openCopyQr(copy)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-shelf-border hover:border-shelf-forest hover:bg-warm-sand/40 text-shelf-forest transition-colors"
                        title="Print or view QR label"
                      >
                        <QrCode className="w-3.5 h-3.5 text-shelf-gold" />
                        <span>View QR</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-shelf-charcoal/60">
                    No physical copies currently registered for this volume.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BookMind AI: Semantically Related Volumes */}
      {similarBooks.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-shelf-border">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-forest-dark flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-shelf-gold" />
              Related Volumes (BookMind AI)
            </h3>
            <span className="text-xs text-charcoal-muted">Semantic content matching</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarBooks.map((simBook) => (
              <div key={simBook.id} className="flex flex-col space-y-2">
                <BookCard book={simBook} />
                {simBook.recommendationReason && (
                  <p className="text-[11px] text-charcoal-muted bg-white p-2.5 rounded-lg border border-ivory-border leading-relaxed">
                    {simBook.recommendationReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peer Reviews & Scholarly Ratings Section */}
      <div className="space-y-6 pt-6 border-t border-shelf-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-cream gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-forest-dark flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Peer Reviews & Scholarly Ratings
            </h3>
            <p className="text-xs text-charcoal-muted">
              Course feedback and curriculum reviews authored by registered university patrons
            </p>
          </div>

          {reviewsData && reviewsData.totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold text-forest-dark">
                {reviewsData.averageRating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${
                        s <= Math.round(reviewsData.averageRating)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-ivory-border'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-charcoal-muted">
                  {reviewsData.totalReviews} peer review{reviewsData.totalReviews === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List & Submission Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Reviews Stream (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {reviewsData?.reviews.length === 0 ? (
              <div className="p-8 text-center text-charcoal-muted bg-ivory/30 rounded-xl border border-dashed border-ivory-border">
                <Star className="h-6 w-6 text-gold mx-auto mb-1.5 opacity-60" />
                <p className="font-serif font-bold text-sm text-forest-dark">No Peer Reviews Yet</p>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Be the first scholar to review this volume for fellow students.
                </p>
              </div>
            ) : (
              reviewsData?.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-ivory-border bg-white shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif font-bold text-xs text-forest-dark block">
                        {rev.userName}
                      </span>
                      <span className="text-[10px] text-charcoal-muted">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rev.isRecommended && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <ThumbsUp className="h-2.5 w-2.5" /> Recommends
                        </span>
                      )}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-ivory-border'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal leading-relaxed whitespace-pre-line">
                    {rev.reviewText}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Review Submission Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-ivory-border p-5 shadow-scholarly space-y-4">
            <div>
              <h4 className="font-serif font-bold text-sm text-forest-dark">
                Submit Your Scholarly Review
              </h4>
              <p className="text-[11px] text-charcoal-muted mt-0.5">
                Share your evaluation of this text to guide students and course research.
              </p>
            </div>

            {reviewNotice && (
              <div className="p-3 rounded-lg text-xs bg-forest-100/70 text-forest border border-forest/30 font-medium animate-in fade-in">
                {reviewNotice}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-charcoal-muted mb-1 font-semibold">Your Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          s <= reviewRating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-ivory-border hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-mono font-bold text-forest-dark">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-charcoal-muted mb-1 font-semibold">
                  Review Commentary
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share insights on clarity, theoretical depth, exam utility..."
                  className="w-full p-2.5 rounded-lg border border-ivory-border bg-ivory/30 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold text-xs leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecommended}
                  onChange={(e) => setIsRecommended(e.target.checked)}
                  className="rounded text-forest focus:ring-gold h-4 w-4"
                />
                <span className="text-charcoal font-medium">
                  I recommend this volume for academic study
                </span>
              </label>

              <PrimaryButton
                type="submit"
                size="sm"
                fullWidth
                disabled={submittingReview || !reviewText.trim()}
                isLoading={submittingReview}
                leftIcon={<Send className="h-3.5 w-3.5" />}
              >
                {user ? 'Publish Review' : 'Sign In to Publish Review'}
              </PrimaryButton>
            </form>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <CopyQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        copyId={selectedCopy ? selectedCopy.copyId : undefined}
        bookId={!selectedCopy ? book.id : undefined}
        bookTitle={book.title}
        shelfLocation={selectedCopy ? selectedCopy.shelfLocation : book.shelfLocation}
      />
    </div>
  );
};
