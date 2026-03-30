// ==============================================================================
// components/dashboard/sentiment-chart.tsx - Sentiment Distribution Chart
// ==============================================================================

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Statistics } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SentimentChartProps {
  statistics: Statistics;
}

export function SentimentChart({ statistics }: SentimentChartProps) {
  const data = [
    {
      name: 'Positive',
      value: statistics.positive,
      percent: statistics.positivePercent,
      color: '#10b981',
    },
    {
      name: 'Negative',
      value: statistics.negative,
      percent: statistics.negativePercent,
      color: '#ef4444',
    },
    {
      name: 'Neutral',
      value: statistics.neutral,
      percent: statistics.neutralPercent,
      color: '#f59e0b',
    },
  ];

  interface TooltipPayload {
    payload: {
      name: string;
      value: number;
      percent: number;
      color: string;
    };
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="text-sm text-gray-600">
            {data.value} comments ({data.percent.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div className="p-2 bg-green-50 rounded-lg">
            <div className="font-bold text-green-700">{statistics.positive}</div>
            <div className="text-gray-600">Positive</div>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <div className="font-bold text-red-700">{statistics.negative}</div>
            <div className="text-gray-600">Negative</div>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <div className="font-bold text-yellow-700">{statistics.neutral}</div>
            <div className="text-gray-600">Neutral</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
