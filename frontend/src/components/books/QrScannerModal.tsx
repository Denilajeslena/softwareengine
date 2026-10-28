import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '@/components/common/Modal';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { scanCodeApi, BookDetailResponse } from '@/services/books';
import { BookCopy } from '@/types';
import { Camera, Upload, Search, CheckCircle2, AlertCircle, ArrowRight, MapPin } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookFound?: (book: BookDetailResponse, copy?: BookCopy) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onBookFound,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    book: BookDetailResponse;
    copy?: BookCopy;
    rawCode: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Clean up camera scanner on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      setLookupError(null);
      setCameraError(null);
      setManualCode('');
    }
  }, [isOpen]);

  // Start camera when tab is camera and modal is open
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No video camera detected on this device. Please use Image Upload or Manual Input.');
        return;
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          handleCodeIdentified(decodedText);
          stopCamera();
        },
        () => {
          // Continuous scan frame callback - ignore errors
        }
      );
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('Permission') || errMsg.includes('NotAllowedError')) {
        setCameraError('Camera access was denied. Please allow camera permissions or enter the code manually.');
      } else {
        setCameraError('Unable to open camera stream. Try uploading an image or entering the code manually.');
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLookupError(null);
    setLoading(true);
    try {
      const html5Qr = new Html5Qrcode('qr-upload-reader-placeholder');
      const decodedText = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      await handleCodeIdentified(decodedText);
    } catch {
      setLookupError('Could not decode QR code from this image. Please ensure the code is clear and well-lit.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeIdentified = async (code: string) => {
    if (!code || !code.trim()) return;
    setLoading(true);
    setLookupError(null);

    const res = await scanCodeApi(code.trim());
    setLoading(false);

    if (res.success && res.data?.book) {
      setScanResult({
        book: res.data.book,
        copy: res.data.matchedCopy,
        rawCode: code,
      });
      if (onBookFound) {
        onBookFound(res.data.book, res.data.matchedCopy);
      }
    } else {
      setLookupError(res.message || `No book copy found matching code: "${code}"`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeIdentified(manualCode.trim());
  };

  const handleResetScan = () => {
    setScanResult(null);
    setLookupError(null);
    setManualCode('');
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const handleViewBook = (bookId: string) => {
    onClose();
    navigate(`/books/${bookId}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Identify Book via QR / Barcode"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        {!scanResult && (
          <div className="flex border-b border-shelf-border pb-1 text-sm font-sans gap-2">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium transition-colors ${
                activeTab === 'camera'
                  ? 'bg-shelf-forest text-warm-ivory'
                  : 'text-shelf-charcoal/70 hover:text-shelf-forest hover:bg-warm-sand/40'
              }`}
            >
              <Camera className="w-4 h-4" />
              Scan Camera
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-shelf-forest text-warm-ivory'
                  : 'text-shelf-charcoal/70 hover:text-shelf-forest hover:bg-warm-sand/40'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-shelf-forest text-warm-ivory'
                  : 'text-shelf-charcoal/70 hover:text-shelf-forest hover:bg-warm-sand/40'
              }`}
            >
              <Search className="w-4 h-4" />
              Manual Input
            </button>
          </div>
        )}

        {/* Scan Result Identified View */}
        {scanResult ? (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-full mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
                  Book Identified Successfully
                </span>
                <h3 className="font-serif text-lg font-bold text-shelf-forest mt-0.5">
                  {scanResult.book.title}
                </h3>
                <p className="text-xs text-shelf-charcoal/80">
                  By {scanResult.book.author} ({scanResult.book.year || (scanResult.book as any).publicationYear})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
              <div>
                <span className="text-shelf-charcoal/60">Category:</span>
                <p className="font-medium text-shelf-forest">{scanResult.book.category}</p>
              </div>
              <div>
                <span className="text-shelf-charcoal/60">ISBN:</span>
                <p className="font-mono text-shelf-charcoal">{scanResult.book.isbn}</p>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 pt-1 border-t border-gray-100">
                <MapPin className="w-3.5 h-3.5 text-shelf-gold" />
                <span className="font-medium text-shelf-charcoal">
                  Shelf Location: {scanResult.book.shelfLocation}
                </span>
              </div>
            </div>

            {scanResult.copy ? (
              <div className="p-3 bg-warm-ivory rounded-lg border border-shelf-gold/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-shelf-forest">
                    Specific Copy: {scanResult.copy.copyId}
                  </span>
                  <StatusBadge
                    status={
                      scanResult.copy.status === 'available'
                        ? 'success'
                        : scanResult.copy.status === 'borrowed'
                        ? 'warning'
                        : 'info'
                    }
                    label={scanResult.copy.status.toUpperCase()}
                  />
                </div>
                <p className="text-xs text-shelf-charcoal/70 font-mono">
                  Barcode: {scanResult.copy.barcode}
                </p>
                {scanResult.copy.condition && (
                  <p className="text-xs text-shelf-charcoal/70">
                    Condition: <span className="capitalize font-medium">{scanResult.copy.condition}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-shelf-charcoal/70 bg-warm-sand/30 p-2 rounded">
                Matched whole title record ({scanResult.book.availableCopies} of {scanResult.book.totalCopies} copies currently available).
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
              <SecondaryButton onClick={handleResetScan} size="sm">
                Scan Another
              </SecondaryButton>
              <PrimaryButton
                onClick={() => handleViewBook(scanResult.book.id)}
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Book & Copies
              </PrimaryButton>
            </div>
          </div>
        ) : (
          /* Active Scanner Modes */
          <div className="space-y-4">
            {lookupError && (
              <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* Camera Tab */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-shelf-forest/30 bg-warm-sand/30 min-h-[260px] flex flex-col items-center justify-center p-2">
                  <div id={scannerContainerId} className="w-full max-w-[280px]" />
                  {cameraError && (
                    <div className="p-4 text-center max-w-xs space-y-2">
                      <Camera className="w-8 h-8 text-shelf-charcoal/40 mx-auto" />
                      <p className="text-xs text-shelf-charcoal/80 font-medium">{cameraError}</p>
                      <SecondaryButton size="sm" onClick={() => setActiveTab('manual')}>
                        Switch to Manual Input
                      </SecondaryButton>
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-warm-ivory/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-shelf-forest border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-shelf-forest">Looking up volume...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center text-shelf-charcoal/60">
                  Point camera at the printed copy QR code or spine sticker.
                </p>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <div id="qr-upload-reader-placeholder" className="hidden" />
                <label className="border-2 border-dashed border-shelf-forest/40 hover:border-shelf-forest bg-warm-sand/20 hover:bg-warm-sand/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-shelf-forest mb-2" />
                  <span className="text-sm font-serif font-bold text-shelf-forest">
                    Select QR code image
                  </span>
                  <span className="text-xs text-shelf-charcoal/60 mt-1">
                    PNG, JPEG, WEBP or camera snapshot
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </label>
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-shelf-forest py-2">
                    <div className="w-4 h-4 border-2 border-shelf-forest border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing barcode image...</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Input Tab */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-shelf-charcoal mb-1 font-sans">
                    Enter Copy ID, Barcode, or ISBN
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="e.g. CPY-b-001-01, SCHOLARS-COPY-..., 978-0262033848"
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-shelf-border focus:outline-none focus:ring-2 focus:ring-shelf-forest font-mono"
                      autoFocus
                    />
                    <PrimaryButton type="submit" disabled={!manualCode.trim() || loading}>
                      {loading ? 'Finding...' : 'Identify'}
                    </PrimaryButton>
                  </div>
                </div>
                <div className="bg-warm-sand/30 p-2.5 rounded-lg text-xs text-shelf-charcoal/70 space-y-1">
                  <p className="font-semibold text-shelf-forest">Quick Sample Codes for Testing:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['CPY-b-001-01', 'CPY-b-002-01', 'SCHOLARS-COPY-b-003-01', '978-0262033848'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setManualCode(code);
                          handleCodeIdentified(code);
                        }}
                        className="px-2 py-0.5 font-mono text-[11px] bg-white border border-shelf-border rounded hover:border-shelf-forest hover:text-shelf-forest"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
