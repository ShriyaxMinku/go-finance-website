import { useState } from 'react';
import { X } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Expense } from '../App';

interface SpendingTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  currencySymbol: string;
}

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

export function SpendingTrendsModal({
  isOpen,
  onClose,
  expenses,
  currencySymbol,
}: SpendingTrendsModalProps) {
  const [activeTab, setActiveTab] = useState<'bar' | 'pie'>('bar');

  if (!isOpen) return null;

  // Calculate category spending
  const categorySpending = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categorySpending).map(([category, amount]) => ({
    category,
    amount,
  })).sort((a, b) => b.amount - a.amount);

  // Calculate daily spending for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyData = last7Days.map((date) => {
    const dayExpenses = expenses.filter((e) => e.date === date);
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: total,
    };
  });

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTransactions = expenses.length;
  const avgPerDay = totalSpent / (expenses.length > 0 ? 7 : 1);

  // Prepare pie chart data with percentages
  const pieData = categoryData.map((item) => ({
    ...item,
    percentage: ((item.amount / totalSpent) * 100).toFixed(1),
  }));

  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-6xl my-8 border border-border max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2">
              📊 Spending Analysis
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No expenses yet. Start tracking to see your spending trends! 📈
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl border border-secondary/20">
                  <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-secondary">
                    {totalTransactions}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Avg per Day</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatCurrency(avgPerDay)}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-3 mb-8 p-2 bg-muted rounded-xl max-w-md mx-auto">
                <button
                  onClick={() => setActiveTab('bar')}
                  className={`flex-1 py-3 px-6 rounded-lg transition-all text-center ${
                    activeTab === 'bar'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg font-bold'
                      : 'hover:bg-card/50'
                  }`}
                >
                  📊 Bar Charts
                </button>
                <button
                  onClick={() => setActiveTab('pie')}
                  className={`flex-1 py-3 px-6 rounded-lg transition-all text-center ${
                    activeTab === 'pie'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg font-bold'
                      : 'hover:bg-card/50'
                  }`}
                >
                  🥧 Pie Chart
                </button>
              </div>

              {/* Charts */}
              {activeTab === 'bar' && (
                <div className="space-y-8">
                  {/* Category Breakdown */}
                  <div>
                    <h3 className="mb-4">Spending by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                        <XAxis 
                          dataKey="category" 
                          tick={{ fontSize: 12 }} 
                          stroke="currentColor"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} stroke="currentColor" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.5rem',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Last 7 Days */}
                  <div>
                    <h3 className="mb-4">Last 7 Days</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="currentColor" />
                        <YAxis tick={{ fontSize: 12 }} stroke="currentColor" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.5rem',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="var(--color-secondary)" 
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'pie' && (
                <div className="space-y-6">
                  {/* Pie Chart */}
                  <div>
                    <h3 className="mb-4 text-center">Category Distribution</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percentage }) => `${category}: ${percentage}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.5rem',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Breakdown */}
                  <div>
                    <h3 className="mb-4">Detailed Breakdown</h3>
                    <div className="space-y-3">
                      {pieData.map((item, index) => (
                        <div
                          key={item.category}
                          className="flex items-center justify-between p-4 bg-muted rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{item.category}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(item.amount)}</p>
                            <p className="text-sm text-muted-foreground">{item.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
