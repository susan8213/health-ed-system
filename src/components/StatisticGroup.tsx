import React from 'react';

interface StatisticGroupProps {
  children: React.ReactNode;
}

export default function StatisticGroup({ children }: StatisticGroupProps) {
  return (
    <div className="statistic-group">
      {children}
    </div>
  );
}
