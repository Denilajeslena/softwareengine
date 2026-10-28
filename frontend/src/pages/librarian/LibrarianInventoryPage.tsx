import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Boxes, MapPin, CheckCircle } from 'lucide-react';

export const LibrarianInventoryPage: React.FC = () => {
  const stackSummary = [
    { stack: 'Stack 1 (Physics & Chemistry)', total: 680, capacity: '85% Full', status: 'Optimal' },
    { stack: 'Stack 2 (Mathematics & Logic)', total: 740, capacity: '92% Full', status: 'Near Capacity' },
    { stack: 'Stack 3 (Computer Science)', total: 1120, capacity: '96% Full', status: 'Expansion Required' },
    { stack: 'Stack 4 (Artificial Intelligence)', total: 890, capacity: '78% Full', status: 'Optimal' },
    { stack: 'Stack 5 (World History & Civilizations)', total: 950, capacity: '88% Full', status: 'Optimal' },
    { stack: 'Stack 6 (Literature & Arts)', total: 860, capacity: '82% Full', status: 'Optimal' },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Physical Stack & Inventory Control"
        subtitle="Shelf capacity monitoring, RFID inventory audits, and physical stack distribution."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Shelf Units"
          value="48 Stacks"
          icon={<Boxes className="h-5 w-5" />}
          description="Main library floor levels 1, 2, and 3"
          isDemo={true}
        />
        <StatCard
          title="Average Utilization"
          value="86.8%"
          icon={<MapPin className="h-5 w-5" />}
          description="High density in STEM sections"
          isDemo={true}
        />
        <StatCard
          title="Last Physical Audit"
          value="Oct 14, 2026"
          icon={<CheckCircle className="h-5 w-5" />}
          description="99.4% RFID tag match rate"
          isDemo={true}
        />
      </div>

      <div className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-4">
        <h3 className="font-serif font-bold text-base text-forest-dark pb-2 border-b border-ivory-cream">
          Campus Stack Utilization Summary
        </h3>

        <div className="space-y-3">
          {stackSummary.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-ivory-border bg-ivory/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <h4 className="font-semibold text-sm text-forest-dark">{item.stack}</h4>
                <p className="text-xs text-charcoal-muted">Holding {item.total} physical copies</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold">{item.capacity}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
