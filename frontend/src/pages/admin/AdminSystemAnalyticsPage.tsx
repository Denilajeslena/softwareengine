import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useHealth } from '@/hooks/useHealth';
import { Server, Database, RefreshCw, Activity } from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';

export const AdminSystemAnalyticsPage: React.FC = () => {
  const { healthData, isLoading, isHealthy, isDatabaseConnected, lastChecked, refresh } =
    useHealth(0);

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="System Analytics & Diagnostics"
        subtitle="Real-time backend telemetry, REST health status, and database connectivity inspection."
        actions={
          <PrimaryButton
            size="sm"
            onClick={refresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Poll Server Now
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Flask REST Service"
          value={isHealthy ? '200 OK' : 'Unavailable'}
          icon={<Server className="h-5 w-5" />}
          description={`Last ping: ${lastChecked.toLocaleTimeString()}`}
          isDemo={false}
        />
        <StatCard
          title="Database Status"
          value={isDatabaseConnected ? 'Active' : 'Unconfigured'}
          icon={<Database className="h-5 w-5" />}
          description={healthData?.data?.database?.database || 'scholars_shelf'}
          isDemo={false}
        />
        <StatCard
          title="Implementation Phase"
          value="Part 1 of 8"
          icon={<Activity className="h-5 w-5" />}
          description="Design System & Dashboards"
          isDemo={false}
        />
      </div>

      <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-4">
        <h3 className="font-serif font-bold text-base text-forest-dark pb-2 border-b border-ivory-cream flex items-center justify-between">
          <span>Raw Diagnostics Response (/api/health)</span>
          <StatusBadge
            size="sm"
            status={isHealthy ? 'optimal' : 'danger'}
            label={isHealthy ? 'Healthy' : 'Offline'}
          />
        </h3>

        <pre className="p-4 rounded-lg bg-ivory-darker/20 border border-ivory-border text-xs font-mono text-charcoal overflow-x-auto">
          {JSON.stringify(healthData, null, 2)}
        </pre>
      </div>
    </div>
  );
};
