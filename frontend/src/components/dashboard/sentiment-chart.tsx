'use client';

// ==============================================================================
// src/components/dashboard/sentiment-chart.tsx - Sentiment Distribution Chart
// ==============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentStatistics } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  type PieLabelRenderProps,
} from 'recharts';

interface SentimentChartProps {
  statistics: SentimentStatistics;
}

const COLORS = {
  positive: '#22c55e', // green-500
  negative: '#ef4444', // red-500
};

export function SentimentChart({ statistics }: SentimentChartProps) {
  const data = [
    {
      name: 'Positive',
      value: statistics.positive_count,
      percentage: statistics.positive_percentage,
    },
    {
      name: 'Negative',
      value: statistics.negative_count,
      percentage: statistics.negative_percentage,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={(props: PieLabelRenderProps) => {
                  const { name, index } = props;
                  const pct = data[index as number]?.percentage ?? 0;
                  return `${name ?? ''}: ${pct.toFixed(1)}%`;
                }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Positive' ? COLORS.positive : COLORS.negative}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${value} comments`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {statistics.positive_count}
            </div>
            <div className="text-sm text-green-700">Positive</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {statistics.negative_count}
            </div>
            <div className="text-sm text-red-700">Negative</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
