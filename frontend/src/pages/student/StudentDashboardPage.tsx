import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { SearchBar } from '@/components/common/SearchBar';
import { BookCard } from '@/components/books/BookCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { DEMO_BOOKS } from '@/data/demo/books';
import { DEMO_STUDENT_NOTIFICATIONS } from '@/data/demo/student';
import { fetchMyLoansApi, fetchMyReservationsApi, renewLoanApi } from '@/services/circulation';
import { fetchPersonalizedRecommendationsApi, SemanticBookResult } from '@/services/ai';
import { BorrowRecord, Reservation } from '@/types';
import { formatDaysRemaining } from '@/utils/formatters';
import {
  Bookmark,
  CalendarCheck,
  Clock,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Info,
  RotateCcw,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const studentName = user ? user.name : 'Alexandra Vance';
  const studentId = user?.student_id || 'STU-2024-8841';

  const [activeLoans, setActiveLoans] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [finesTotal, setFinesTotal] = useState(0);
  const [aiRecs, setAiRecs] = useState<SemanticBookResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewNotice, setRenewNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [loansRes, resRes, recsRes] = await Promise.all([
      fetchMyLoansApi(),
      fetchMyReservationsApi(),
      fetchPersonalizedRecommendationsApi(4),
    ]);

    if (loansRes.success && loansRes.data) {
      setActiveLoans(loansRes.data.activeLoans);
      setFinesTotal(loansRes.data.totalFines);
    }
    if (resRes.success && resRes.data) {
      setReservations(resRes.data.reservations);
    }
    if (recsRes.success && recsRes.data?.recommendations) {
      setAiRecs(recsRes.data.recommendations);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRenew = async (loan: BorrowRecord) => {
    setRenewingId(loan.id);
    setRenewNotice(null);
    const res = await renewLoanApi(loan.id);
    setRenewingId(null);
    if (res.success) {
      setRenewNotice({
        type: 'success',
        text: `Volume "${loan.bookTitle}" renewed until ${res.data?.loan?.dueDate?.substring(0, 10)}!`,
      });
      loadData();
    } else {
      setRenewNotice({
        type: 'error',
        text: res.message || 'Renewal declined by circulation rules.',
      });
    }
    setTimeout(() => setRenewNotice(null), 5000);
  };

  const handleSearch = (query: string) => {
    navigate(`/catalogue?search=${encodeURIComponent(query)}`);
  };

  const overdueCount = activeLoans.filter((l) => l.status === 'overdue').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {renewNotice && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            renewNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {renewNotice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{renewNotice.text}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-ivory-border shadow-scholarly flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Student Circulation Workspace &bull; Active Session</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-forest-dark">
            Welcome back, {studentName}
          </h1>
          <p className="text-xs md:text-sm text-charcoal-muted leading-relaxed font-sans">
            You currently hold <strong className="text-forest-dark">{activeLoans.length} active loans</strong> in library standing.{' '}
            {overdueCount > 0 ? (
              <span className="text-red-700 font-semibold">{overdueCount} volume is past due.</span>
            ) : (
              'All loans are currently on schedule.'
            )}
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-2">
          <SecondaryButton
            size="sm"
            onClick={() => navigate('/student/borrowed')}
          >
            My Loans
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={() => navigate('/catalogue')}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            Browse Catalogue
          </PrimaryButton>
        </div>
      </div>

      {/* Prominent Catalogue Search Bar */}
      <div className="bg-ivory-cream/80 p-4 rounded-xl border border-ivory-border">
        <div className="max-w-2xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1.5 text-left">
            Quick Stack Search
          </label>
          <SearchBar
            placeholder="Search catalogue by title, author, subject, or ISBN..."
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Currently Borrowed"
          value={activeLoans.length}
          icon={<Bookmark className="h-5 w-5" />}
          description="Max allowed: 5 books"
        />
        <StatCard
          title="Active Holds"
          value={reservations.length}
          icon={<CalendarCheck className="h-5 w-5" />}
          description={reservations.length > 0 ? `${reservations.length} holds queued` : 'No active holds'}
        />
        <StatCard
          title="Overdue Notices"
          value={overdueCount}
          icon={<Clock className="h-5 w-5" />}
          description={overdueCount > 0 ? `${overdueCount} books overdue` : 'All loans on schedule'}
        />
        <StatCard
          title="Circulation Fines"
          value={`$${finesTotal.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5" />}
          description={finesTotal > 0 ? 'Outstanding balance' : 'Account in good standing'}
        />
      </div>

      {/* Grid: Currently Borrowed & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Currently Borrowed Books Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-ivory-border p-5 shadow-scholarly space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
            <div>
              <h3 className="font-serif text-base font-bold text-forest-dark">
                My Currently Borrowed Volumes
              </h3>
              <p className="text-xs text-charcoal-muted">
                {activeLoans.length} active loan cards currently issued to ID: {studentId}
              </p>
            </div>
            <SecondaryButton
              size="sm"
              onClick={() => navigate('/student/borrowed')}
            >
              View Full History
            </SecondaryButton>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-6 text-center text-xs text-charcoal-muted">
                Loading your active loans...
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="p-6 text-center text-xs text-charcoal-muted">
                You have no active loans. Visit the catalogue to borrow a volume.
              </div>
            ) : (
              activeLoans.map((record) => {
                const { days, isOverdue } = formatDaysRemaining(record.dueDate);
                const isCurrentRenewing = renewingId === record.id;
                const canRenew = (record.renewalsCount || 0) < 2;

                return (
                  <div
                    key={record.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-ivory-border hover:bg-ivory/40 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="p-2 rounded bg-forest/10 text-forest shrink-0 mt-0.5">
                        <Bookmark className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          to={`/books/${record.bookId}`}
                          className="font-serif font-bold text-sm text-forest-dark hover:text-gold-dark transition-colors line-clamp-1"
                        >
                          {record.bookTitle}
                        </Link>
                        <p className="text-xs text-charcoal-muted">
                          Borrowed {record.borrowDate ? record.borrowDate.substring(0, 10) : ''} &bull; Due by{' '}
                          <strong className="text-forest-dark">
                            {record.dueDate ? record.dueDate.substring(0, 10) : ''}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center justify-between sm:justify-end">
                      <StatusBadge
                        size="sm"
                        status={isOverdue ? 'danger' : 'success'}
                        label={isOverdue ? `${days}d Overdue` : `${days} days left`}
                      />
                      <button
                        onClick={() => handleRenew(record)}
                        disabled={!canRenew || isCurrentRenewing}
                        className="text-xs font-semibold text-forest hover:text-gold-dark px-2.5 py-1 rounded bg-ivory-cream border border-ivory-border hover:bg-ivory disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className={`h-3 w-3 ${isCurrentRenewing ? 'animate-spin' : ''}`} />
                        <span>{isCurrentRenewing ? 'Renewing...' : 'Renew'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 text-xs text-charcoal-muted flex items-center gap-1.5 italic">
            <Info className="h-3.5 w-3.5 text-gold-dark" />
            Automatic email reminders are dispatched 3 days prior to due dates.
          </div>
        </div>

        {/* Right: Notifications & Quick Academic Alerts */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-ivory-border p-5 shadow-scholarly space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
            <h3 className="font-serif text-base font-bold text-forest-dark">
              Library Alerts
            </h3>
            <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 py-0.5 rounded-full">
              2 Unread
            </span>
          </div>

          <div className="space-y-3">
            {DEMO_STUDENT_NOTIFICATIONS.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-lg border border-ivory-border bg-ivory/20 text-left space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-forest-dark">{notif.title}</h4>
                  <span className="text-[10px] text-charcoal-muted">{notif.date}</span>
                </div>
                <p className="text-xs text-charcoal-light leading-relaxed">{notif.message}</p>
              </div>
            ))}
          </div>

          <SecondaryButton
            size="sm"
            fullWidth
            onClick={() => navigate('/student/notifications')}
          >
            All Notifications
          </SecondaryButton>
        </div>
      </div>

      {/* Recommended Stacks for Student's Curriculum (BookMind AI) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-ivory-border">
          <div>
            <h3 className="font-serif text-xl font-bold text-forest-dark flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-dark" />
              Personalized Reading Recommendations (BookMind AI)
            </h3>
            <p className="text-xs text-charcoal-muted">
              Dynamically synthesized from your active loans and curriculum research interests.
            </p>
          </div>
          <SecondaryButton
            size="sm"
            onClick={() => navigate('/catalogue?mode=ai')}
          >
            Explore BookMind AI
          </SecondaryButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(aiRecs.length > 0 ? aiRecs : DEMO_BOOKS.slice(0, 4)).map((book: any) => (
            <div key={book.id} className="flex flex-col space-y-2">
              <BookCard book={book} />
              {book.affinityReason && (
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed">
                  <div className="flex items-center gap-1 font-semibold text-emerald-900 mb-0.5">
                    <Sparkles className="w-3 h-3 text-shelf-gold shrink-0" />
                    <span>Why Recommended</span>
                  </div>
                  <p>{book.affinityReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
