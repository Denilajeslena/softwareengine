import React, { useState } from 'react';
import { Activity, Database, Server, RefreshCw, ChevronDown } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/utils/cn';

export const SystemHealthBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { healthData, isLoading, isHealthy, isDatabaseConnected, refresh } = useHealth(15000);
  const [expanded, setExpanded] = useState(false);

  const dbStatus = healthData?.data?.database?.status || 'unreachable';

  if (compact) {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-ivory-border bg-white shadow-2xs hover:bg-ivory transition-colors"
          title="Click to view live Flask and MongoDB connectivity details"
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            )}
          />
          <span className="text-charcoal font-mono text-[11px]">
            API: {isHealthy ? 'Online' : 'Offline'}
          </span>
          <ChevronDown className="h-3 w-3 text-charcoal-muted" />
        </button>

        {expanded && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-ivory-border shadow-scholarly-elevated p-4 z-50 text-xs text-charcoal">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-ivory-border">
              <span className="font-serif font-bold text-forest-dark">System Connectivity</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refresh();
                }}
                disabled={isLoading}
                className="text-sage-600 hover:text-forest p-1 rounded hover:bg-ivory-cream"
                title="Refresh Health Check"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-charcoal-muted">
                  <Server className="h-3.5 w-3.5" /> Flask REST API
                </span>
                <StatusBadge
                  size="sm"
                  status={isHealthy ? 'optimal' : 'danger'}
                  label={isHealthy ? 'Healthy (200)' : 'Unreachable'}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-charcoal-muted">
                  <Database className="h-3.5 w-3.5" /> MongoDB
                </span>
                <StatusBadge
                  size="sm"
                  status={
                    isDatabaseConnected
                      ? 'optimal'
                      : dbStatus === 'driver_missing' || dbStatus === 'unconfigured'
                      ? 'warning'
                      : 'danger'
                  }
                  label={
                    isDatabaseConnected
                      ? 'Connected'
                      : dbStatus === 'driver_missing'
                      ? 'Driver Pending'
                      : dbStatus === 'unconfigured'
                      ? 'Unconfigured'
                      : 'Unavailable'
                  }
                />
              </div>
            </div>

            {healthData?.data?.database?.message && (
              <p className="mt-3 text-[11px] text-charcoal-muted bg-ivory/60 p-2 rounded border border-ivory-border font-mono leading-tight">
                {healthData.data.database.message}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-ivory-border bg-white/80 shadow-2xs text-xs">
      <div className="flex items-center gap-1.5">
        <Activity className={cn('h-3.5 w-3.5', isHealthy ? 'text-forest' : 'text-rose-600')} />
        <span className="text-charcoal font-medium">Backend:</span>
        <span className={cn('font-mono font-medium', isHealthy ? 'text-forest' : 'text-rose-600')}>
          {isHealthy ? 'Live (GET /api/health)' : 'Disconnected'}
        </span>
      </div>

      <span className="text-ivory-darker">|</span>

      <div className="flex items-center gap-1.5">
        <Database className="h-3.5 w-3.5 text-gold-dark" />
        <span className="text-charcoal font-medium">Database:</span>
        <span className="text-charcoal-muted font-mono capitalize">
          {isDatabaseConnected ? 'Connected' : dbStatus.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};

