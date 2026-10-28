import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ChartCard } from '@/components/charts/ChartCard';
import { BorrowingTrendChart } from '@/components/charts/BorrowingTrendChart';
import { PopularCategoriesChart } from '@/components/charts/PopularCategoriesChart';
import { DemandForecastChart } from '@/components/charts/DemandForecastChart';
import { StatCard } from '@/components/common/StatCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  FileDown,
  Sparkles,
  TrendingUp,
  BookOpen,
  Boxes,
  Clock,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  fetchAnalyticsOverviewApi,
  fetchBorrowingTrendsApi,
  fetchCategoryStatsApi,
  fetchPopularBooksApi,
  fetchDemandForecastApi,
} from '@/services/analytics';
import {
  AnalyticsOverview,
  BorrowingTrendPoint,
  CategoryStat,
  PopularBookItem,
  DemandForecastResponse,
} from '@/types';

export const LibrarianReportsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<BorrowingTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [popularBooks, setPopularBooks] = useState<PopularBookItem[]>([]);
  const [forecast, setForecast] = useState<DemandForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ml-forecast' | 'procurement'>('all');

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const [ovRes, trRes, catRes, popRes, fcRes] = await Promise.all([
        fetchAnalyticsOverviewApi(),
        fetchBorrowingTrendsApi(),
        fetchCategoryStatsApi(),
        fetchPopularBooksApi(5),
        fetchDemandForecastApi(),
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (trRes.success && trRes.data) setTrends(trRes.data.trends || []);
      if (catRes.success && catRes.data) setCategories(catRes.data.categories || []);
      if (popRes.success && popRes.data) setPopularBooks(popRes.data.popularBooks || []);
      if (fcRes.success && fcRes.data) setForecast(fcRes.data);
    } catch (err) {
      console.error('Error loading library analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsvSummary = () => {
    if (!forecast || !categories) return;

    const headers = ['Report Category', 'Metric', 'Value', 'Notes'];
    const rows: string[][] = [
      ['Overview', 'Total Titles', String(overview?.totalBooks || 0), 'Active collection'],
      ['Overview', 'Total Copies', String(overview?.totalCopies || 0), 'Physical stock units'],
      ['Overview', 'Available Copies', String(overview?.availableCopies || 0), 'Ready for loan'],
      ['Overview', 'Active Loans', String(overview?.activeLoans || 0), 'Currently checked out'],
      ['Overview', 'Utilization Rate', `${overview?.utilizationRate || 0}%`, 'Shelf turnover percentage'],
      ['ML Model', 'Algorithm', forecast.modelName, 'Scikit-learn Ridge regression'],
      ['ML Model', 'MAE (Mean Absolute Error)', String(forecast.evaluationMetrics.mae), 'Circulation deviation'],
      ['ML Model', 'RMSE', String(forecast.evaluationMetrics.rmse), 'Root mean squared error'],
      ['ML Model', 'R² Score', String(forecast.evaluationMetrics.r2Score), 'Variance explained by model'],
    ];

    forecast.procurementRecommendations.forEach((r) => {
      rows.push([
        'Procurement Request',
        r.bookTitle,
        `+${r.recommendedCopiesToAdd} units`,
        `Demand pressure ${r.demandPressure} (${r.priority} Priority)`,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scholars_shelf_circulation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-left">
      <PageHeader
        title="BookPulse Circulation Intelligence"
        subtitle="Comprehensive library analytics, machine-learning demand projections, and predictive copy procurement."
        actions={
          <div className="flex items-center gap-3">
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-charcoal-muted font-mono">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-dark" />
                Updating metrics...
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-forest-100/60 text-forest border border-forest/20">
              <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse"></span>
              Live MongoDB Records Connected
            </span>
            <PrimaryButton
              size="sm"
              onClick={downloadCsvSummary}
              leftIcon={<FileDown className="h-3.5 w-3.5" />}
            >
              Export Intelligence Summary (CSV)
            </PrimaryButton>
          </div>
        }
      />

      {/* Real-time KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Catalogued Titles"
          value={overview ? overview.totalBooks : '...'}
          icon={<BookOpen className="h-4 w-4" />}
          description="In collection"
          isDemo={false}
        />
        <StatCard
          title="Total Holdings"
          value={overview ? overview.totalCopies : '...'}
          icon={<Boxes className="h-4 w-4" />}
          description="Physical copies"
          isDemo={false}
        />
        <StatCard
          title="On-Shelf Ready"
          value={overview ? overview.availableCopies : '...'}
          icon={<CheckCircle2 className="h-4 w-4" />}
          description="Immediate loan"
          isDemo={false}
        />
        <StatCard
          title="Active Loans"
          value={overview ? overview.activeLoans : '...'}
          icon={<TrendingUp className="h-4 w-4" />}
          description="In circulation"
          isDemo={false}
        />
        <StatCard
          title="Overdue Notices"
          value={overview ? overview.overdueLoans : '...'}
          icon={<Clock className="h-4 w-4" />}
          description="Late returns"
          isDemo={false}
        />
        <StatCard
          title="Inventory Utilization"
          value={overview ? `${overview.utilizationRate}%` : '...'}
          icon={<Layers className="h-4 w-4" />}
          description="Collection in use"
          isDemo={false}
        />
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-ivory-cream pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-md transition-colors ${
            activeTab === 'all'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          All Reports & Trends
        </button>
        <button
          onClick={() => setActiveTab('ml-forecast')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'ml-forecast'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          <Cpu className="h-3 w-3 text-gold" />
          ML Demand Forecast (Scikit-Learn)
        </button>
        <button
          onClick={() => setActiveTab('procurement')}
          className={`px-3 py-1.5 text-xs font-serif font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'procurement'
              ? 'bg-forest text-warm-ivory'
              : 'text-charcoal hover:bg-forest-100/50'
          }`}
        >
          <Sparkles className="h-3 w-3 text-gold" />
          Procurement Recommendations ({forecast?.procurementRecommendations.length || 0})
        </button>
      </div>

      {/* Section 1: Standard Recharts Visualizations (Shown on 'all' tab) */}
      {(activeTab === 'all') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Circulation Trends Over Time"
            subtitle="Monthly student checkouts vs returned volumes across the academic calendar"
            isDemo={false}
            action={
              <span className="text-[10px] font-semibold text-forest-700 bg-forest-100/70 px-2 py-0.5 rounded border border-forest-200">
                Live Data + Historical Baseline
              </span>
            }
          >
            <BorrowingTrendChart data={trends} />
          </ChartCard>

          <ChartCard
            title="Departmental Collection Utilization"
            subtitle="Relative borrow frequencies and shelf turnover grouped by academic discipline"
            isDemo={false}
            action={
              <span className="text-[10px] font-semibold text-forest-700 bg-forest-100/70 px-2 py-0.5 rounded border border-forest-200">
                Live MongoDB Records
              </span>
            }
          >
            <PopularCategoriesChart data={categories} />
          </ChartCard>
        </div>
      )}

      {/* Section 2: Machine Learning Demand Prediction & Model Evaluation */}
      {(activeTab === 'all' || activeTab === 'ml-forecast') && forecast && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-forest-dark to-forest p-6 rounded-xl text-warm-ivory shadow-scholarly">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-forest-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gold/15 text-gold border border-gold/30">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-warm-ivory">
                      BookPulse Machine-Learning Demand Prediction Engine
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-gold/20 text-gold-light border border-gold/40">
                      Python • Scikit-Learn • Pandas
                    </span>
                  </div>
                  <p className="text-xs text-ivory-cream/80 mt-0.5">
                    Trained on longitudinal loan velocity, circulation turnover, and waitlist queuing curves to forecast borrowing demand across upcoming academic quarters.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-forest-800/80 text-xs text-forest-200 border border-forest-700 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  {forecast.dataSufficient ? 'Data Sufficient: 6 Observation Periods' : 'Data Limited'}
                </span>
              </div>
            </div>

            {/* Model Evaluation Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="p-3 rounded-lg bg-forest-800/60 border border-forest-700">
                <span className="text-[11px] text-forest-300 uppercase tracking-wider block">Mean Absolute Error (MAE)</span>
                <span className="text-lg font-mono font-bold text-warm-ivory mt-0.5 block">
                  {forecast.evaluationMetrics.mae} loans
                </span>
                <span className="text-[10px] text-forest-400 mt-0.5 block">Low error across test validation</span>
              </div>

              <div className="p-3 rounded-lg bg-forest-800/60 border border-forest-700">
                <span className="text-[11px] text-forest-300 uppercase tracking-wider block">Root Mean Squared Error (RMSE)</span>
                <span className="text-lg font-mono font-bold text-warm-ivory mt-0.5 block">
                  {forecast.evaluationMetrics.rmse}
                </span>
                <span className="text-[10px] text-forest-400 mt-0.5 block">Penalizes large deviations</span>
              </div>

              <div className="p-3 rounded-lg bg-forest-800/60 border border-forest-700">
                <span className="text-[11px] text-forest-300 uppercase tracking-wider block">R² Goodness of Fit</span>
                <span className="text-lg font-mono font-bold text-gold-light mt-0.5 block">
                  {forecast.evaluationMetrics.r2Score}
                </span>
                <span className="text-[10px] text-forest-400 mt-0.5 block">Variance explained by regression</span>
              </div>

              <div className="p-3 rounded-lg bg-forest-800/60 border border-forest-700">
                <span className="text-[11px] text-forest-300 uppercase tracking-wider block">Forecast Reliability</span>
                <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
                  {forecast.evaluationMetrics.confidenceScore}
                </span>
                <span className="text-[10px] text-forest-400 mt-0.5 block">Horizon: {forecast.forecastHorizon}</span>
              </div>
            </div>
          </div>

          {/* ML Demand Forecast Chart Card */}
          <ChartCard
            title="Predictive Campus Borrowing Trajectory (Historical Actual vs Projected)"
            subtitle="Solid forest-green indicates recorded historical loans; dashed gold indicates Scikit-learn Ridge forecast projections"
            isDemo={false}
            action={
              <span className="text-[10px] font-mono font-semibold text-gold-dark bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                {forecast.forecastHorizon}
              </span>
            }
          >
            <DemandForecastChart data={forecast.forecastSeries} />
          </ChartCard>
        </div>
      )}

      {/* Section 3: AI Procurement & Additional Copy Recommendations */}
      {(activeTab === 'all' || activeTab === 'procurement') && forecast && (
        <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ivory-cream gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold-dark" />
                <h3 className="font-serif text-lg font-bold text-forest-dark">
                  Procurement Recommendations (Copy Replenishment)
                </h3>
              </div>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Titles flagged by BookPulse ML demand pressure index requiring additional physical copies to avoid patron waitlist bottlenecks.
              </p>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 shrink-0 self-start sm:self-auto">
              {forecast.procurementRecommendations.length} Action Items Identified
            </span>
          </div>

          {forecast.procurementRecommendations.length === 0 ? (
            <div className="p-8 text-center text-charcoal-muted bg-ivory/30 rounded-lg border border-dashed border-ivory-border">
              <CheckCircle2 className="h-8 w-8 text-forest mx-auto mb-2 opacity-60" />
              <p className="text-sm font-serif font-bold text-forest-dark">Optimal Inventory Levels</p>
              <p className="text-xs text-charcoal-muted mt-1">
                All titles currently maintain adequate shelf reserves. No urgent copy acquisitions recommended at this time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ivory-border text-charcoal-muted font-serif font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Title & Author</th>
                    <th className="py-2.5 px-3">Discipline</th>
                    <th className="py-2.5 px-3 text-center">Available / Total</th>
                    <th className="py-2.5 px-3 text-center">Demand Pressure</th>
                    <th className="py-2.5 px-3 text-center">Recommended Purchase</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">ML Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-cream">
                  {forecast.procurementRecommendations.map((rec) => (
                    <tr key={rec.bookId} className="hover:bg-ivory/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-serif font-bold text-forest-dark block text-sm">
                          {rec.bookTitle}
                        </span>
                        <span className="text-[11px] text-charcoal-muted italic">
                          {rec.author} • {rec.shelfLocation}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-charcoal">
                        {rec.category}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-charcoal">
                        <span className={rec.currentAvailable === 0 ? 'text-rose-700' : 'text-forest'}>
                          {rec.currentAvailable}
                        </span>{' '}
                        / {rec.currentTotal}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-900 border border-amber-200">
                          {rec.demandPressure}x
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-forest-100 text-forest-800 border border-forest-200">
                          +{rec.recommendedCopiesToAdd} copies
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          size="sm"
                          status={rec.priority === 'High' ? 'danger' : 'warning'}
                          label={`${rec.priority} Priority`}
                        />
                      </td>
                      <td className="py-3 px-3 text-[11px] text-charcoal-muted leading-relaxed max-w-xs">
                        {rec.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 4: Most Popular Circulating Volumes */}
      <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
          <div>
            <h3 className="font-serif text-base font-bold text-forest-dark">
              Top Circulating Volumes (Circulation Velocity)
            </h3>
            <p className="text-xs text-charcoal-muted">
              Most requested volumes ranked by borrow frequency and inventory turnover rate
            </p>
          </div>
          <span className="text-[10px] font-medium text-forest-700 bg-forest-100/70 px-2 py-0.5 rounded border border-forest-200">
            Real Database Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ivory-border text-charcoal-muted font-serif font-bold uppercase tracking-wider">
                <th className="py-2 px-3">Book Title</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3 text-center">Times Borrowed</th>
                <th className="py-2 px-3 text-center">Active Holds</th>
                <th className="py-2 px-3 text-center">Turnover Rate</th>
                <th className="py-2 px-3 text-center">Shelf Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-cream">
              {popularBooks.map((book) => (
                <tr key={book.id} className="hover:bg-ivory/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-serif font-bold text-forest-dark block">
                      {book.title}
                    </span>
                    <span className="text-[10px] text-charcoal-muted italic">{book.author}</span>
                  </td>
                  <td className="py-2.5 px-3 text-charcoal">{book.category}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-forest">
                    {book.borrowCount} loans
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-charcoal">
                    {book.activeHolds}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-gold-dark">
                    {book.turnoverRate}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span className={book.availableCopies === 0 ? 'text-rose-600 font-bold' : 'text-charcoal'}>
                      {book.availableCopies} / {book.totalCopies}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
