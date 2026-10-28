import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { BookCard } from '@/components/books/BookCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import {
  fetchReadingListApi,
  removeFromReadingListApi,
  fetchReadingGoalsApi,
  updateReadingGoalApi,
} from '@/services/reading';
import { Book, ReadingGoalsResponse } from '@/types';
import {
  Bookmark,
  Target,
  Award,
  BookOpen,
  Clock,
  Sparkles,
  TrendingUp,
  Star,
  Flame,
  CheckCircle2,
  Lock,
  Edit3,
} from 'lucide-react';

export const StudentReadingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [goalsData, setGoalsData] = useState<ReadingGoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newTarget, setNewTarget] = useState(10);
  const [activeTab, setActiveTab] = useState<'list' | 'goals-badges'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, goalsRes] = await Promise.all([
        fetchReadingListApi(),
        fetchReadingGoalsApi(),
      ]);

      if (listRes.success && listRes.data) {
        setBooks(listRes.data.books || []);
      }
      if (goalsRes.success && goalsRes.data) {
        setGoalsData(goalsRes.data);
        setNewTarget(goalsRes.data.goal.targetBooks);
      }
    } catch (e) {
      console.warn('Error loading reading list/goals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    await removeFromReadingListApi(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleSaveGoal = async () => {
    const res = await updateReadingGoalApi(newTarget);
    if (res.success && res.data) {
      setGoalsData(res.data);
      setIsEditingGoal(false);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="h-5 w-5" />;
      case 'Clock':
        return <Clock className="h-5 w-5" />;
      case 'Bookmark':
        return <Bookmark className="h-5 w-5" />;
      case 'TrendingUp':
        return <TrendingUp className="h-5 w-5" />;
      case 'Star':
        return <Star className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto">
      <PageHeader
        title="Scholarly Reading List & Milestone Goals"
        subtitle="Saved research references, curriculum syllabi bookmarks, semester reading targets, and academic achievement badges."
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest-100/70 text-forest border border-forest/20">
            {books.length} Saved Volume{books.length === 1 ? '' : 's'}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={() => setActiveTab(activeTab === 'list' ? 'goals-badges' : 'list')}
              leftIcon={<Award className="h-3.5 w-3.5 text-gold-dark" />}
            >
              {activeTab === 'list' ? 'View Goals & Badges' : 'View Saved Volumes'}
            </SecondaryButton>
          </div>
        }
      />

      {/* Semester Goal Highlight Card */}
      {goalsData && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-forest-dark to-forest text-warm-ivory shadow-scholarly flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 flex-1 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gold-light flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {goalsData.goal.academicTerm} Reading Goal
              </span>
              <button
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="text-[11px] text-ivory-cream/80 hover:text-gold-light flex items-center gap-1 font-semibold"
              >
                <Edit3 className="h-3 w-3" />
                Adjust Target
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-2xl font-bold text-warm-ivory">
                {goalsData.goal.completedBooks}{' '}
                <span className="text-sm font-sans font-normal text-ivory-cream/75">
                  of {goalsData.goal.targetBooks} volumes completed
                </span>
              </h3>
              <span className="text-sm font-bold text-gold font-mono">
                ({goalsData.goal.progressPercentage}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-forest-900/80 rounded-full h-3 border border-forest-700/60 overflow-hidden">
              <div
                className="bg-gradient-to-r from-gold to-gold-light h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, goalsData.goal.progressPercentage)}%` }}
              />
            </div>

            {/* Edit Goal Input */}
            {isEditingGoal && (
              <div className="pt-2 flex items-center gap-2 animate-in fade-in">
                <span className="text-xs text-ivory-cream">Target:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newTarget}
                  onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1 text-xs rounded text-forest font-bold bg-white"
                />
                <button
                  onClick={handleSaveGoal}
                  className="px-3 py-1 text-xs font-bold bg-gold-dark text-white rounded hover:bg-gold"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Streak & Active Stats */}
          <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-forest-700 pt-4 md:pt-0 md:pl-6">
            <div className="text-center px-3">
              <span className="flex items-center justify-center gap-1 text-amber-300 font-bold text-lg font-mono">
                <Flame className="h-5 w-5 text-amber-400 animate-pulse" />
                {goalsData.goal.streakWeeks} wks
              </span>
              <span className="text-[10px] text-ivory-cream/75 uppercase tracking-wider block">
                Reading Streak
              </span>
            </div>

            <div className="text-center px-3">
              <span className="text-warm-ivory font-bold text-lg font-mono block">
                {goalsData.badges.filter((b) => b.unlocked).length} / {goalsData.badges.length}
              </span>
              <span className="text-[10px] text-ivory-cream/75 uppercase tracking-wider block">
                Badges Earned
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-ivory-cream pb-3">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'list'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          <Bookmark className="h-3.5 w-3.5 text-gold" />
          Saved Reading List ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('goals-badges')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'goals-badges'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          <Award className="h-3.5 w-3.5 text-gold" />
          Academic Badges & Achievements
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading your reading references and achievements..." />
      ) : activeTab === 'list' ? (
        books.length === 0 ? (
          <EmptyState
            title="Your Reading List is Empty"
            description="Explore our university stacks and bookmark titles to organize your semester syllabi and research papers."
            action={
              <PrimaryButton size="sm" onClick={() => navigate('/catalogue')}>
                Explore Library Catalogue
              </PrimaryButton>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div key={book.id} className="relative group">
                  <BookCard book={book} />
                  <button
                    onClick={() => handleRemoveBook(book.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-charcoal-muted hover:text-rose-700 hover:bg-rose-50 shadow-xs border border-ivory-border opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Remove from saved reading list"
                  >
                    <Bookmark className="h-3.5 w-3.5 fill-forest text-forest" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Academic Badges Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="font-serif font-bold text-base text-forest-dark">
                Scholar Achievement Badges
              </h3>
              <p className="text-xs text-charcoal-muted">
                Earn recognition for consistent scholarly inquiry, timely circulation returns, and peer reviews.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalsData?.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-scholarly ${
                  badge.unlocked
                    ? 'bg-white border-gold/40'
                    : 'bg-ivory/40 border-ivory-border opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        badge.unlocked
                          ? 'bg-gold/15 text-gold-dark border-gold/30'
                          : 'bg-charcoal/10 text-charcoal-muted border-charcoal/20'
                      }`}
                    >
                      {getBadgeIcon(badge.icon)}
                    </div>
                    {badge.unlocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-charcoal-muted bg-ivory px-2 py-0.5 rounded-full border border-ivory-border">
                        <Lock className="h-3 w-3" /> In Progress
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-sm text-forest-dark">{badge.name}</h4>
                  <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-ivory-cream flex items-center justify-between text-[11px]">
                  <span className="font-medium text-forest">{badge.category}</span>
                  <span className="font-mono text-charcoal-muted">{badge.progress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
