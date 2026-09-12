'use client';

import React from 'react';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ScoreHistoryChartProps {
  data: { label: string; score: number }[];
}

/**
 * Thin styling layer over the charting library for Score History.
 * A single Indigo line, no gridlines beyond the essential axes.
 */
export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <ReLineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#747D74' }}
          axisLine={{ stroke: '#D8D6C6' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tick={{ fontSize: 11, fill: '#747D74' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: '#D8D6C6' }}
          contentStyle={{
            border: '1px solid #D8D6C6',
            borderRadius: 2,
            fontSize: 12,
            background: '#FFFFFF',
            color: '#1E2A1F',
          }}
          formatter={(val: number | string) => [`${Number(val).toFixed(1)} / 100`, 'Score']}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#2F3E5C"
          strokeWidth={2}
          dot={{ r: 3, fill: '#2F3E5C', strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
}