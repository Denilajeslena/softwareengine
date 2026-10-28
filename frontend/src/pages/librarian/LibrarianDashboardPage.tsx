import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { BorrowingTrendChart } from '@/components/charts/BorrowingTrendChart';
import { PopularCategoriesChart } from '@/components/charts/PopularCategoriesChart';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { QrScannerModal } from '@/components/books/QrScannerModal';
import {
  DEMO_LIBRARIAN_STATS,
  RECENT_TRANSACTIONS,
  LOW_INVENTORY_ALERTS,
} from '@/data/demo/librarian';
import {
  BookOpen,
  Boxes,
  ArrowLeftRight,
  Clock,
  AlertTriangle,
  PlusCircle,
  ScanLine,
  BarChart3,
} from 'lucide-react';
import {
  fetchAnalyticsOverviewApi,
  fetchBorrowingTrendsApi,
  fetchCategoryStatsApi,
  fetchLowStockAlertsApi,
} from '@/services/analytics';
import {
  AnalyticsOverview,
  BorrowingTrendPoint,
  CategoryStat,
  LowStockAlert,
} from '@/types';

export const LibrarianDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<BorrowingTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    loadLiveDashboardData();
  }, []);

  const loadLiveDashboardData = async () => {
    try {
      const [ovRes, trRes, catRes, alertRes] = await Promise.all([
        fetchAnalyticsOverviewApi(),
        fetchBorrowingTrendsApi(),
        fetchCategoryStatsApi(),
        fetchLowStockAlertsApi(),
      ]);

      if (ovRes.success && ovRes.data && ovRes.data.totalBooks > 0) {
        setOverview(ovRes.data);
        setIsLiveConnected(true);
      }
      if (trRes.success && trRes.data?.trends?.length) {
        setTrends(trRes.data.trends);
      }
      if (catRes.success && catRes.data?.categories?.length) {
        setCategories(catRes.data.categories);
      }
      if (alertRes.success && alertRes.data?.alerts) {
        setLowStockAlerts(alertRes.data.alerts);
      }
    } catch (e) {
      console.warn('Dashboard using demo baselines:', e);
    }
  };

  const transactionColumns: Column<(typeof RECENT_TRANSACTIONS)[0]>[] = [
    {
      header: 'Txn ID',
      accessorKey: 'id',
      cell: (item) => <span className="font-mono text-xs text-charcoal">{item.id}</span>,
    },
    {
      header: 'Book Title',
      cell: (item) => (
        <span className="font-serif font-bold text-forest-dark line-clamp-1">{item.bookTitle}</span>
      ),
    },
    {
      header: 'Patron',
      cell: (item) => (
        <div>
          <div className="font-medium text-xs text-charcoal">{item.studentName}</div>
          <div className="font-mono text-[10px] text-charcoal-muted">{item.studentId}</div>
        </div>
      ),
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: (item) => (
        <span className="font-medium text-xs text-forest">{item.action}</span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'date',
    },
    {
      header: 'Status',
      cell: (item) => (
        <StatusBadge
          size="sm"
          status={item.status === 'Flagged' ? 'danger' : 'success'}
          label={item.status}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8 text-left">
      <PageHeader
        title="Librarian Workstation & Analytics"
        subtitle="Manage library inventory, oversee loan circulation, handle returns, and monitor stock levels."
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={() => navigate('/librarian/reports')}
              leftIcon={<BarChart3 className="h-3.5 w-3.5" />}
            >
              Intelligence Reports
            </SecondaryButton>
            <SecondaryButton
              size="sm"
              onClick={() => setIsScannerOpen(true)}
              leftIcon={<ScanLine className="h-3.5 w-3.5" />}
            >
              Scan QR / Barcode
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              onClick={() => navigate('/librarian/books')}
              leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
            >
              Manage / Add Volumes
            </PrimaryButton>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Holdings"
          value={overview ? overview.totalCopies.toLocaleString() : DEMO_LIBRARIAN_STATS.totalCopies.toLocaleString()}
          icon={<Boxes className="h-5 w-5" />}
          description={
            overview
              ? `${overview.totalBooks} unique catalogued titles`
              : `${DEMO_LIBRARIAN_STATS.totalTitles} unique catalogued titles`
          }
          isDemo={!isLiveConnected}
        />
        <StatCard
          title="Available On Shelf"
          value={overview ? overview.availableCopies.toLocaleString() : DEMO_LIBRARIAN_STATS.availableCopies.toLocaleString()}
          icon={<BookOpen className="h-5 w-5" />}
          description="Ready for immediate loan"
          isDemo={!isLiveConnected}
        />
        <StatCard
          title="Active Loans"
          value={overview ? overview.activeLoans.toLocaleString() : DEMO_LIBRARIAN_STATS.activeLoans.toLocaleString()}
          icon={<ArrowLeftRight className="h-5 w-5" />}
          description="In circulation across campus"
          trend={{ value: overview ? `${overview.utilizationRate}% utilization` : '+12% this month', isPositive: true }}
          isDemo={!isLiveConnected}
        />
        <StatCard
          title="Overdue Loans"
          value={overview ? overview.overdueLoans : DEMO_LIBRARIAN_STATS.overdueLoans}
          icon={<Clock className="h-5 w-5" />}
          description="Past due date notice queue"
          trend={{ value: `${overview ? overview.overdueLoans : 28} notices active`, isPositive: false }}
          isDemo={!isLiveConnected}
        />
      </div>

      {/* Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ChartCard
            title="Monthly Circulation Trends"
            subtitle="Comparing student checkouts versus returned copies across the academic semester"
            isDemo={!isLiveConnected}
            action={
              isLiveConnected ? (
                <span className="text-[10px] font-semibold text-forest-700 bg-forest-100/70 px-1.5 py-0.5 rounded border border-forest-200">
                  Live DB Feed
                </span>
              ) : undefined
            }
          >
            <BorrowingTrendChart data={trends} />
          </ChartCard>
        </div>

        <div className="lg:col-span-5">
          <ChartCard
            title="Most Requested Disciplines"
            subtitle="Circulation volume by university academic department"
            isDemo={!isLiveConnected}
            action={
              isLiveConnected ? (
                <span className="text-[10px] font-semibold text-forest-700 bg-forest-100/70 px-1.5 py-0.5 rounded border border-forest-200">
                  Live DB Feed
                </span>
              ) : undefined
            }
          >
            <PopularCategoriesChart data={categories} />
          </ChartCard>
        </div>
      </div>

      {/* Bottom Grid: Low Inventory Alert Panel & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Inventory Alert Panel */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-ivory-border p-5 shadow-scholarly flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="font-serif text-base font-bold text-forest-dark">
                  Low Inventory Alerts
                </h3>
              </div>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Action Recommended
              </span>
            </div>

            <p className="text-xs text-charcoal-muted mt-2 mb-4 leading-relaxed">
              Titles with high reservation queues or critical shelf shortages requiring restocking or recall requests.
            </p>

            <div className="space-y-3">
              {(lowStockAlerts.length > 0 ? lowStockAlerts : LOW_INVENTORY_ALERTS).map((alertItem: any) => (
                <div
                  key={alertItem.bookId || alertItem.id}
                  className="p-3 rounded-lg border border-ivory-border bg-ivory/20 flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="font-serif font-bold text-sm text-forest-dark">
                      {alertItem.bookTitle || alertItem.title}
                    </h4>
                    <p className="text-xs text-charcoal-muted italic">{alertItem.author}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-rose-700">
                      {alertItem.urgency ? `${alertItem.urgency} Shortage` : alertItem.status}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block font-mono text-sm font-bold text-forest-dark">
                      {alertItem.availableCopies ?? alertItem.available} / {alertItem.totalCopies ?? alertItem.total}
                    </span>
                    <span className="text-[10px] text-charcoal-muted">
                      {alertItem.activeHolds ?? alertItem.queue} in waitlist
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-ivory-cream flex items-center justify-between">
            <span className="text-xs text-charcoal-muted">
              {lowStockAlerts.length || 3} critical titles flagged
            </span>
            <button
              onClick={() => navigate('/librarian/reports')}
              className="text-xs font-semibold text-forest hover:text-gold-dark hover:underline"
            >
              View Full ML Demand Forecast &rarr;
            </button>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-ivory-border p-5 shadow-scholarly space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ivory-cream">
            <div>
              <h3 className="font-serif text-base font-bold text-forest-dark">
                Recent Circulation Transactions
              </h3>
              <p className="text-xs text-charcoal-muted">
                Real-time checkout, return, and renewal desk logs
              </p>
            </div>
            <span className="text-[10px] font-medium text-sage-600 bg-sage-100 px-2 py-0.5 rounded border border-sage-200">
              Circulation Desk
            </span>
          </div>

          <DataTable
            columns={transactionColumns}
            data={RECENT_TRANSACTIONS}
            keyExtractor={(item) => item.id}
          />
        </div>
      </div>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
