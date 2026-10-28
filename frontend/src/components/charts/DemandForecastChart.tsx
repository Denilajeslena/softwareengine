import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ForecastDataPoint } from '@/types';

interface DemandForecastChartProps {
  data: ForecastDataPoint[];
}

export const DemandForecastChart: React.FC<DemandForecastChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EFE8D9" vertical={false} />
          <XAxis
            dataKey="period"
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
            formatter={(value: any, name: string) => {
              if (value === null || value === undefined) return ['N/A', name];
              return [`${value} loans`, name];
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-charcoal font-medium">
                {value === 'actual' ? 'Actual Historical Loans' : 'ML Projected Demand (Ridge)'}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="actual"
            stroke="#183D32"
            strokeWidth={3}
            dot={{ r: 4, fill: '#183D32', strokeWidth: 1 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="predicted"
            stroke="#C3A66B"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#C3A66B', strokeWidth: 1 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

