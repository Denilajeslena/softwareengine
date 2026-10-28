import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { SearchBar } from '@/components/common/SearchBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { Modal } from '@/components/common/Modal';
import { CopyQrModal } from '@/components/books/CopyQrModal';
import { QrScannerModal } from '@/components/books/QrScannerModal';
import {
  fetchBooksApi,
  createBookApi,
  updateBookApi,
  archiveBookApi,
} from '@/services/books';
import { Book } from '@/types';
import {
  Plus,
  Edit2,
  Trash2,
  QrCode,
  ScanLine,
  RefreshCw,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const LibrarianManageBooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrModalBook, setQrModalBook] = useState<Book | null>(null);

  // Selected book for editing
  const [currentBook, setCurrentBook] = useState<Book | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    publicationYear: new Date().getFullYear(),
    shelfLocation: 'Stack A-1',
    totalCopies: 3,
    description: '',
    accentColor: '#183D32',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = [
    'Computer Science',
    'Artificial Intelligence',
    'Mathematics',
    'Literature',
    'Science',
    'History',
    'Philosophy',
  ];

  const loadBooks = async () => {
    setLoading(true);
    const res = await fetchBooksApi({ search: search || undefined });
    if (res.success && res.data?.books) {
      setBooks(res.data.books);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Computer Science',
      publicationYear: new Date().getFullYear(),
      shelfLocation: 'Stack A-1',
      totalCopies: 3,
      description: '',
      accentColor: '#183D32',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setCurrentBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publicationYear: book.year || (book as any).publicationYear || new Date().getFullYear(),
      shelfLocation: book.shelfLocation,
      totalCopies: book.totalCopies,
      description: book.description,
      accentColor: book.accentColor || '#183D32',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      setFormError('Title, Author, and ISBN are required.');
      return;
    }

    if (formData.totalCopies < 1) {
      setFormError('Total copies must be at least 1.');
      return;
    }

    setFormSubmitting(true);
    const res = await createBookApi(formData);
    setFormSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setNotification({
        type: 'success',
        message: `Volume "${formData.title}" catalogued with ${formData.totalCopies} unique copies and QR codes.`,
      });
      loadBooks();
    } else {
      setFormError(res.message || 'Failed to add book record.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBook) return;
    setFormError(null);

    setFormSubmitting(true);
    const res = await updateBookApi(currentBook.id, formData);
    setFormSubmitting(false);

    if (res.success) {
      setIsEditModalOpen(false);
      setNotification({
        type: 'success',
        message: `Volume "${currentBook.title}" metadata updated successfully.`,
      });
      loadBooks();
    } else {
      setFormError(res.message || 'Failed to update book.');
    }
  };

  const handleArchive = async (book: Book) => {
    if (!window.confirm(`Are you sure you want to de-acquire or archive "${book.title}"?`)) {
      return;
    }

    const res = await archiveBookApi(book.id);
    if (res.success) {
      setNotification({
        type: 'success',
        message: `Volume "${book.title}" archived from active catalogue.`,
      });
      loadBooks();
    } else {
      setNotification({
        type: 'error',
        message: res.message || 'Failed to archive book.',
      });
    }
  };

  const columns: Column<Book>[] = [
    {
      header: 'Title & Author',
      cell: (item: Book) => (
        <div>
          <Link
            to={`/books/${item.id}`}
            className="font-serif font-bold text-forest-dark hover:text-gold-dark transition-colors line-clamp-1 inline-flex items-center gap-1"
          >
            {item.title}
            <ExternalLink className="w-3 h-3 text-shelf-gold opacity-70" />
          </Link>
          <div className="text-xs text-charcoal-muted italic">{item.author}</div>
        </div>
      ),
    },
    {
      header: 'ISBN',
      accessorKey: 'isbn',
      cell: (item: Book) => <span className="font-mono text-xs">{item.isbn}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (item: Book) => (
        <span className="px-2 py-0.5 rounded text-[11px] bg-warm-sand/60 text-shelf-forest border border-shelf-border">
          {item.category}
        </span>
      ),
    },
    {
      header: 'Shelf Stack',
      accessorKey: 'shelfLocation',
      cell: (item: Book) => (
        <span className="inline-flex items-center gap-1 text-xs text-charcoal">
          <MapPin className="w-3 h-3 text-shelf-gold" />
          {item.shelfLocation}
        </span>
      ),
    },
    {
      header: 'Copies Available',
      cell: (item: Book) => (
        <span className="font-mono text-xs font-semibold">
          {item.availableCopies} / {item.totalCopies}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item: Book) => (
        <StatusBadge
          size="sm"
          status={item.availableCopies > 0 ? 'Available' : 'Checked Out'}
          label={item.availableCopies > 0 ? 'In Stock' : 'Checked Out'}
        />
      ),
    },
    {
      header: 'Actions',
      cell: (item: Book) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setQrModalBook(item)}
            className="p-1 text-shelf-forest hover:text-shelf-gold rounded hover:bg-ivory transition-colors"
            title="Generate Volume QR Code"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1 text-charcoal-muted hover:text-forest rounded hover:bg-ivory transition-colors"
            title="Edit volume record"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleArchive(item)}
            className="p-1 text-charcoal-muted hover:text-rose-700 rounded hover:bg-rose-50 transition-colors"
            title="Archive from inventory"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <PageHeader
        title="Manage Book Catalogue & Inventory"
        subtitle="Catalogue new acquisitions, track copy stocks, print QR labels, and audit stack locations."
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={() => setIsScannerOpen(true)}
              leftIcon={<ScanLine className="h-3.5 w-3.5" />}
            >
              Scan QR / Barcode
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add New Volume
            </PrimaryButton>
          </div>
        }
      />

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Quick Metrics */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-md">
          <SearchBar
            defaultValue={search}
            onSearch={(val) => setSearch(val)}
            placeholder="Search volumes by title, author, or ISBN..."
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-charcoal-muted">
            Total Titles: <strong className="text-shelf-forest">{books.length}</strong>
          </span>
          <button
            onClick={loadBooks}
            disabled={loading}
            className="p-2 border border-shelf-border rounded-lg hover:bg-warm-sand transition-colors text-shelf-forest"
            title="Refresh table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border border-ivory-border shadow-scholarly overflow-hidden">
        <DataTable<Book>
          data={books}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No volumes catalogued"
          emptyDescription="There are currently no volumes matching this query or filter."
        />
      </div>

      {/* Add Volume Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catalogue New Volume Acquisition"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Structure and Interpretation of Computer Programs"
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest font-serif"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Author(s) *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Harold Abelson, Gerald Jay Sussman"
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">ISBN *</label>
              <input
                type="text"
                required
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="e.g. 978-0262510875"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Publication Year</label>
              <input
                type="number"
                value={formData.publicationYear}
                onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) || 2024 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Shelf Stack Location *</label>
              <input
                type="text"
                required
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                placeholder="e.g. Stack C-4, Level 2"
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Initial Copies to Mint</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
              <span className="text-[11px] text-shelf-charcoal/60">
                Will auto-generate unique barcodes & QR labels for each copy.
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Spine Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-10 h-9 p-0.5 rounded border border-shelf-border cursor-pointer"
                />
                <span className="font-mono text-xs text-shelf-charcoal/80">{formData.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs font-sans">
            <label className="font-semibold text-shelf-forest">Overview / Scholarly Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Abstract, key subject topics, and edition details..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-shelf-border">
            <SecondaryButton type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Minting Records...' : 'Save & Register Volume'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Edit Volume Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Volume Record: ${currentBook?.title || ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest font-serif"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Author(s) *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Shelf Stack Location *</label>
              <input
                type="text"
                required
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Total Copies in Inventory</label>
              <input
                type="number"
                min="1"
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-shelf-forest">Spine Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-10 h-9 p-0.5 rounded border border-shelf-border cursor-pointer"
                />
                <span className="font-mono text-xs text-shelf-charcoal/80">{formData.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs font-sans">
            <label className="font-semibold text-shelf-forest">Overview / Scholarly Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-1 focus:ring-shelf-forest"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-shelf-border">
            <SecondaryButton type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Saving Changes...' : 'Update Volume'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Copy QR Code Modal */}
      {qrModalBook && (
        <CopyQrModal
          isOpen={!!qrModalBook}
          onClose={() => setQrModalBook(null)}
          bookId={qrModalBook.id}
          bookTitle={qrModalBook.title}
          shelfLocation={qrModalBook.shelfLocation}
        />
      )}

      {/* QR & Barcode Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBookFound={() => {
          loadBooks();
        }}
      />
    </div>
  );
};
