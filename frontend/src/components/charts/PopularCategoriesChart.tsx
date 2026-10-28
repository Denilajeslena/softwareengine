import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { CategoryStat } from '@/types';
import { POPULAR_CATEGORIES_DATA } from '@/data/demo/librarian';

interface PopularCategoriesChartProps {
  data?: CategoryStat[];
}

export const PopularCategoriesChart: React.FC<PopularCategoriesChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : POPULAR_CATEGORIES_DATA;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <XAxis
            type="number"
            stroke="#5A6661"
            tick={{ fontSize: 11, fill: '#5A6661' }}
            axisLine={{ stroke: '#E2D9C5' }}
            tickLine={false}
          />
          <YAxis
            dataKey="category"
            type="category"
            width={120}
            stroke="#5A6661"
            tick={{ fontSize: 11, fill: '#252B28' }}
            axisLine={{ stroke: '#E2D9C5' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2D9C5',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(val: number) => [`${val} loans`, 'Borrow Volume']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || '#183D32'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
