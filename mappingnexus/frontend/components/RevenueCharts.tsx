import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Transaction } from '../types';

interface RevenueChartsProps {
  transactions: Transaction[];
}

export const RevenueCharts: React.FC<RevenueChartsProps> = ({ transactions }) => {
  // Filter out admin transactions and prepare data
  const validTransactions = transactions.filter(
    t => t.email !== 'tdhairyakumar@gmail.com' && t.status === 'Completed'
  );

  // Last 30 days line chart data
  const getLast30DaysData = () => {
    const today = new Date();
    const data: { date: string; revenue: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayRevenue = validTransactions
        .filter(t => {
          const tDate = new Date(t.transactionDate);
          return tDate.toLocaleDateString() === date.toLocaleDateString();
        })
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({ date: dateStr, revenue: dayRevenue });
    }

    return data;
  };

  // Monthly comparison data
  const getMonthlyComparison = () => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const lastMonthDate = thisMonth === 0 
      ? new Date(thisYear - 1, 11, 1) 
      : new Date(thisYear, thisMonth - 1, 1);

    const thisMonthRevenue = validTransactions
      .filter(t => {
        const tDate = new Date(t.transactionDate);
        return tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthRevenue = validTransactions
      .filter(t => {
        const tDate = new Date(t.transactionDate);
        return tDate.getMonth() === lastMonthDate.getMonth() && 
               tDate.getFullYear() === lastMonthDate.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      {
        name: `${lastMonthDate.toLocaleDateString('en-US', { month: 'short' })}`,
        revenue: lastMonthRevenue
      },
      {
        name: `${today.toLocaleDateString('en-US', { month: 'short' })}`,
        revenue: thisMonthRevenue
      }
    ];
  };

  const last30DaysData = getLast30DaysData();
  const monthlyComparisonData = getMonthlyComparison();

  const chartConfig = {
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
    backgroundColor: '#121212'
  };

  return (
    <div className="space-y-8 mb-12">
      {/* Revenue Trends - Line Chart */}
      <div className="bg-black border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Revenue Trends
          </h3>
          <span className="ml-auto text-xs text-zinc-600 font-mono">Last 30 Days</span>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last30DaysData} margin={chartConfig.margin}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#2a2a2a" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#888' }}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#888' }}
                label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#888' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ffffff" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Comparison - Bar Chart */}
      <div className="bg-black border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-zinc-400" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Monthly Comparison
          </h3>
          <span className="ml-auto text-xs text-zinc-600 font-mono">This vs Last Month</span>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparisonData} margin={chartConfig.margin}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#2a2a2a" 
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#888' }}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#888' }}
                label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#888' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Bar 
                dataKey="revenue" 
                fill="#ffffff" 
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
