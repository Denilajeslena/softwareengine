import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BorrowingTrendPoint } from '@/types';
import { BORROWING_TREND_DATA } from '@/data/demo/librarian';

interface BorrowingTrendChartProps {
  data?: BorrowingTrendPoint[];
}

export const BorrowingTrendChart: React.FC<BorrowingTrendChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : BORROWING_TREND_DATA;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#183D32" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#183D32" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C3A66B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C3A66B" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EFE8D9" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#5A6661"
            tick={{ fontSize: 12, fill: '#5A6661' }}
            axisLine={{ stroke: '#E2D9C5' }}
            tickLine={false}
          />
          <YAxis
            stroke="#5A6661"
            tick={{ fontSize: 12, fill: '#5A6661' }}
            axisLine={{ stroke: '#E2D9C5' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2D9C5',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(24, 61, 50, 0.08)',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-charcoal font-medium">
                {value === 'loans' ? 'Borrowing Checkouts' : 'Returns Processed'}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="loans"
            stroke="#183D32"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLoans)"
            name="loans"
          />
          <Area
            type="monotone"
            dataKey="returns"
            stroke="#C3A66B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorReturns)"
            name="returns"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
