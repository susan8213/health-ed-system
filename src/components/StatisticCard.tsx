import React from 'react';

interface StatisticCardProps {
  title: string;
  count: number | string;
}

export default function StatisticCard({ title, count }: StatisticCardProps) {
  return (
    <div className="statistic-card">
      <div className="statistic-title">{title}</div>
      <div className="statistic-count">{count}</div>
    </div>
  );
}
