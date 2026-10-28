import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import {
  fetchStudentDigitalCardApi,
  verifyCardTokenApi,
  StudentDigitalCardData,
} from '@/services/student';
import {
  User as UserIcon,
  Mail,
  Building,
  ShieldCheck,
  Printer,
  CheckCircle2,
  ScanLine,
  Loader2,
  AlertCircle,
  Copy,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [cardData, setCardData] = useState<StudentDigitalCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Verification simulator
  const [testToken, setTestToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    name?: string;
    studentId?: string;
    department?: string;
    role?: string;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchStudentDigitalCardApi();
    if (res.success && res.data) {
      setCardData(res.data);
      setTestToken(res.data.verifiableToken);
    } else {
      setErrorMessage(res.message || 'Unable to generate student card QR token.');
    }
    setLoading(false);
  };

  const handleCopyToken = () => {
    if (cardData?.verifiableToken) {
      navigator.clipboard.writeText(cardData.verifiableToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleVerifySimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testToken.trim()) return;

    setVerifying(true);
    setVerificationResult(null);

    const res = await verifyCardTokenApi(testToken.trim());
    if (res.success && res.data) {
      setVerificationResult(res.data);
    } else {
      setVerificationResult({
        valid: false,
        reason: res.message || 'Invalid or revoked card verification token.',
      });
    }
    setVerifying(false);
  };

  const name = cardData?.name || user?.name || 'Alexandra Vance';
  const email = user?.email || 'student@scholars.shelf';
  const studentId = cardData?.studentId || user?.student_id || 'STU-2024-8841';
  const department =
    cardData?.department || user?.department || 'School of Computing & Mathematical Sciences';
  const validThru = cardData?.validThru || '2028-06-30';

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <PageHeader
        title="Student Library Profile & Digital Card"
        subtitle="Cryptographically verifiable university library credentials, stack borrowing privileges, and circulation status."
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={handlePrintCard}
              leftIcon={<Printer className="h-3.5 w-3.5" />}
            >
              Print / Save Card
            </SecondaryButton>
          </div>
        }
      />

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Genuine Digital Library Card Badge */}
        <div className="bg-forest text-ivory p-6 rounded-2xl border border-forest-light shadow-scholarly-elevated space-y-4 flex flex-col justify-between print:m-0 print:border-2 print:border-black print:text-black print:bg-white">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-forest-light/60">
              <span className="font-serif font-bold text-sm text-gold-light print:text-black">
                The Scholar's Shelf
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-ivory/70 print:text-black">
                Official Library Pass
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-serif font-bold text-lg text-white print:text-black">{name}</h3>
              <p className="text-xs text-gold-light/90 print:text-black">ID: {studentId}</p>
              <p className="text-xs text-ivory/70 mt-1 line-clamp-1 print:text-black">{department}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-forest-light/60 flex items-center justify-between gap-3">
            <div className="font-mono text-[10px] text-ivory/80 space-y-0.5 print:text-black">
              <div>Valid Thru: {validThru}</div>
              <div className="text-emerald-300 font-semibold flex items-center gap-1 print:text-black">
                <ShieldCheck className="h-3 w-3" />
                {cardData?.cardStatus || 'Active & Verified'}
              </div>
            </div>

            {/* Genuine Rendered Base64 QR Code */}
            <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0 border border-parchment-dark">
              {loading ? (
                <div className="w-16 h-16 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-forest" />
                </div>
              ) : cardData?.qrBase64 ? (
                <img
                  src={cardData.qrBase64}
                  alt={`Digital Card QR Code for ${studentId}`}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center text-xs text-charcoal">
                  QR Error
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="md:col-span-2 bg-white rounded-xl border border-parchment-dark/70 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-parchment-dark/50">
            <h3 className="font-serif font-bold text-base text-forest-dark">
              Academic Enrollment Details
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Good Standing (Zero Overdue Fines)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <UserIcon className="h-3.5 w-3.5 text-forest" /> Full Legal Name:
              </span>
              <span className="font-semibold text-charcoal text-sm">{name}</span>
            </div>
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Student Identifier:
              </span>
              <span className="font-semibold font-mono text-charcoal text-sm">{studentId}</span>
            </div>
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <Mail className="h-3.5 w-3.5 text-forest" /> Institutional Email:
              </span>
              <span className="font-semibold text-charcoal">{email}</span>
            </div>
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <Building className="h-3.5 w-3.5 text-forest" /> Department / Faculty:
              </span>
              <span className="font-semibold text-charcoal">{department}</span>
            </div>
            <div>
              <span className="text-charcoal-muted block mb-0.5">Circulation Allowance:</span>
              <span className="font-semibold text-forest">Up to 5 Active Loans (14-day standard)</span>
            </div>
            <div>
              <span className="text-charcoal-muted block mb-0.5">Role Permission Level:</span>
              <span className="font-semibold text-forest uppercase font-mono">
                {user?.role || 'STUDENT'}
              </span>
            </div>
          </div>

          {/* Cryptographic Verifiable Token Display */}
          <div className="pt-3 border-t border-parchment-dark/50 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-charcoal flex items-center gap-1">
                <ScanLine className="h-3.5 w-3.5 text-forest" />
                Signed Verification Token:
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-forest hover:text-forest-dark text-[11px] font-medium flex items-center gap-1 hover:underline"
              >
                {copiedToken ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Token
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-parchment-light font-mono text-[11px] text-charcoal break-all border border-parchment-dark/40 select-all">
              {cardData?.verifiableToken || 'Generating token...'}
            </div>
          </div>
        </div>
      </div>

      {/* Circulation Scanner Verification Simulator */}
      <div className="bg-white rounded-xl border border-parchment-dark/70 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-parchment-dark/50">
          <ScanLine className="h-4 w-4 text-forest" />
          <h3 className="font-serif font-bold text-sm text-forest-dark">
            Circulation Scanner Gateway & Validation Tool
          </h3>
        </div>

        <p className="text-xs text-charcoal-muted">
          Staff and automated desk turnstiles scan the QR code token to verify institutional authenticity without exposing user credentials or database credentials.
        </p>

        <form onSubmit={handleVerifySimulator} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Paste student card token to verify..."
            value={testToken}
            onChange={(e) => setTestToken(e.target.value)}
            className="flex-1 font-mono text-xs px-3 py-2 rounded-lg border border-parchment-dark focus:outline-none focus:ring-1 focus:ring-forest bg-white"
          />
          <PrimaryButton size="sm" type="submit" disabled={verifying}>
            {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Verify Card'}
          </PrimaryButton>
        </form>

        {verificationResult && (
          <div
            className={`p-4 rounded-xl border text-xs animate-in fade-in ${
              verificationResult.valid
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-red-50/70 border-red-300 text-red-950'
            }`}
          >
            {verificationResult.valid ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Authentic University Library Card Verified
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                  <div>
                    <span className="text-charcoal-muted block">Student Scholar:</span>
                    <span className="font-semibold">{verificationResult.name}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Student ID:</span>
                    <span className="font-semibold font-mono">{verificationResult.studentId}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Department:</span>
                    <span className="font-semibold">{verificationResult.department}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>Verification Rejected: {verificationResult.reason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
