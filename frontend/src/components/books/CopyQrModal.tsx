import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { LoadingState } from '@/components/common/LoadingState';
import { fetchCopyQrApi, fetchBookQrApi } from '@/services/books';
import { Printer, Download } from 'lucide-react';

interface CopyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  copyId?: string;
  bookId?: string;
  bookTitle?: string;
  shelfLocation?: string;
}

export const CopyQrModal: React.FC<CopyQrModalProps> = ({
  isOpen,
  onClose,
  copyId,
  bookId,
  bookTitle = 'Library Volume',
  shelfLocation,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadQr() {
      if (copyId) {
        const res = await fetchCopyQrApi(copyId);
        if (isMounted) {
          if (res.success && res.data?.qrDataUrl) {
            setQrUrl(res.data.qrDataUrl);
            setBarcode(res.data.barcode || `SCHOLARS-COPY-${copyId}`);
          } else {
            setError(res.message || 'Failed to generate copy QR code.');
          }
          setLoading(false);
        }
      } else if (bookId) {
        const res = await fetchBookQrApi(bookId);
        if (isMounted) {
          if (res.success && res.data?.qrDataUrl) {
            setQrUrl(res.data.qrDataUrl);
            setBarcode(res.data.payload || `SCHOLARS-BOOK-${bookId}`);
          } else {
            setError(res.message || 'Failed to generate book QR code.');
          }
          setLoading(false);
        }
      }
    }

    loadQr();
    return () => {
      isMounted = false;
    };
  }, [isOpen, copyId, bookId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>The Scholar's Shelf — Copy Label (${copyId || bookId})</title>
          <style>
            body { font-family: 'Times New Roman', serif; text-align: center; padding: 20px; }
            .card { border: 2px solid #183D32; border-radius: 8px; padding: 16px; max-width: 260px; margin: auto; }
            h3 { margin: 0 0 4px; font-size: 14px; }
            p { margin: 2px 0; font-size: 11px; color: #555; }
            img { width: 140px; height: 140px; margin: 8px 0; }
            .barcode { font-family: monospace; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <h3>The Scholar's Shelf</h3>
            <p><strong>${bookTitle}</strong></p>
            <p>${shelfLocation ? 'Shelf: ' + shelfLocation : ''}</p>
            <img src="${qrUrl}" alt="QR Code" />
            <div class="barcode">${barcode}</div>
            <p style="font-size: 9px; margin-top: 6px;">Copy ID: ${copyId || bookId}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `scholars-qr-${copyId || bookId}.png`;
    a.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Copy QR Code Identification"
      description="Scan with the librarian workstation scanner to look up inventory copy status."
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-between w-full">
          <SecondaryButton size="sm" onClick={onClose}>
            Close
          </SecondaryButton>
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={handleDownload}
              disabled={loading || !qrUrl}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Save PNG
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={handlePrint}
              disabled={loading || !qrUrl}
              leftIcon={<Printer className="h-3.5 w-3.5" />}
            >
              Print Label
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="text-center space-y-4">
        {loading ? (
          <LoadingState message="Generating high-resolution QR..." />
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {error}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-3 bg-ivory-cream rounded-xl border border-ivory-border shadow-xs">
              <img
                src={qrUrl}
                alt="Copy Identification QR Code"
                className="w-48 h-48 rounded-lg border border-ivory-darker shadow-2xs"
              />
            </div>

            <div className="mt-3 space-y-1">
              <h4 className="font-serif font-bold text-sm text-forest-dark line-clamp-1">
                {bookTitle}
              </h4>
              <div className="text-xs font-mono font-semibold text-charcoal bg-ivory/60 px-2.5 py-1 rounded border border-ivory-border inline-block">
                {copyId ? `Unit: ${copyId}` : `Book: ${bookId}`}
              </div>
              {shelfLocation && (
                <p className="text-[11px] text-charcoal-muted">
                  Location: <strong className="text-forest-dark">{shelfLocation}</strong>
                </p>
              )}
              <p className="text-[10px] font-mono text-sage-600 truncate max-w-xs">
                {barcode}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
