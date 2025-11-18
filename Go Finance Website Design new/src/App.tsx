import { useState, useEffect } from 'react';
import { Moon, Sun, Plus, TrendingUp, Target, X, BarChart3 } from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';
import { Onboarding } from './components/Onboarding';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AddGoalModal } from './components/AddGoalModal';
import { SpendingTrendsModal } from './components/SpendingTrendsModal';
import { Calendar } from './components/Calendar';
import logoImage from 'figma:asset/9523b593b9924fb4699bd243188154c7d20b9207.png';

export interface UserData {
  age: number;
  country: string;
  currency: string;
  currencySymbol: string;
  income: number;
  fixedExpenses: Array<{ name: string; amount: number }>;
  spendingHabits: string[];
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

  // Load saved data
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedOnboarding = localStorage.getItem('onboardingComplete');
    const savedUserData = localStorage.getItem('userData');
    const savedExpenses = localStorage.getItem('expenses');
    const savedGoals = localStorage.getItem('savingGoals');
    const hasSeenGuide = localStorage.getItem('hasSeenFirstTimeGuide');

    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    if (savedOnboarding === 'true') {
      setOnboardingComplete(true);
      // Show guide only if user hasn't seen it and has no expenses
      if (!hasSeenGuide) {
        setShowFirstTimeGuide(true);
      }
    }

    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    }

    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses);
      setExpenses(parsedExpenses);
      // Don't show guide if user already has expenses
      if (parsedExpenses.length > 0) {
        setShowFirstTimeGuide(false);
      }
    }

    if (savedGoals) {
      setSavingGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Save data
  useEffect(() => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }, [userData]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('savingGoals', JSON.stringify(savingGoals));
  }, [savingGoals]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
    setOnboardingComplete(true);
    localStorage.setItem('onboardingComplete', 'true');
  };

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses([...expenses, newExpense]);
    setShowFirstTimeGuide(false);
    localStorage.setItem('hasSeenFirstTimeGuide', 'true');
  };

  const handleEditExpense = (id: string, updatedExpense: Omit<Expense, 'id'>) => {
    setExpenses(expenses.map(exp => exp.id === id ? { ...updatedExpense, id } : exp));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const handleAddGoal = (goal: Omit<SavingGoal, 'id' | 'currentAmount'>) => {
    const newGoal = {
      ...goal,
      id: Date.now().toString(),
      currentAmount: 0,
    };
    setSavingGoals([...savingGoals, newGoal]);
  };

  const handleCloseGuide = () => {
    setShowFirstTimeGuide(false);
    localStorage.setItem('hasSeenFirstTimeGuide', 'true');
  };

  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Calculate spending trends
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailySpending = last7Days.map((date) => {
    const dayExpenses = expenses.filter((e) => e.date === date);
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: total,
    };
  });

  const thisWeekTotal = dailySpending.reduce((sum, day) => sum + day.amount, 0);
  const lastWeekTotal = expenses
    .filter((e) => {
      const expenseDate = new Date(e.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return expenseDate >= twoWeeksAgo && expenseDate < weekAgo;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const percentChange = lastWeekTotal > 0 
    ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return `${userData?.currencySymbol}${amount.toFixed(2)}`;
  };

  // Calculate monthly summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  const totalMonthlyExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyIncome = userData?.income || 0;
  const leftToSpend = monthlyIncome - totalMonthlyExpenses;

  // Calculate daily average spending this month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const avgDailySpending = monthlyExpenses.length > 0 ? totalMonthlyExpenses / currentDay : 0;
  const daysRemaining = daysInMonth - currentDay;
  const predictedSpending = avgDailySpending * daysRemaining;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="Go Finance Logo" 
                className="h-12 w-12 rounded-full object-cover"
              />
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* First Time Guide Modal */}
      {showFirstTimeGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-8 border-2 border-primary">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">💡</div>
              <h2 className="text-2xl font-bold">Add your expenses here</h2>
              <p className="text-muted-foreground">
                Start tracking your spending by adding your first expense!
              </p>
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => {
                    setIsExpenseModalOpen(true);
                    setShowFirstTimeGuide(false);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  ➕ Add Expense
                </button>
                <button
                  onClick={handleCloseGuide}
                  className="w-full py-3 px-4 rounded-xl border-2 border-border hover:bg-muted transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Monthly Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Monthly Income */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>

          {/* Expenses This Month */}
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-6 border-2 border-secondary/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Expenses This Month</p>
              <span className="text-2xl">💸</span>
            </div>
            <p className="text-3xl font-bold text-secondary">
              {formatCurrency(totalMonthlyExpenses)}
            </p>
          </div>

          {/* Left to Spend */}
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-6 border-2 border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Left to Spend</p>
              <span className="text-2xl">💵</span>
            </div>
            <p className={`text-3xl font-bold ${leftToSpend >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatCurrency(leftToSpend)}
            </p>
          </div>

          {/* Predicted Spending */}
          <div className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 rounded-2xl p-6 border-2 border-chart-4/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Predicted Spending</p>
              <span className="text-2xl">🔮</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-chart-4)' }}>
              {formatCurrency(predictedSpending)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {daysRemaining} days left
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar - Main Section */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <h2 className="mb-6 flex items-center gap-2">
                📅 Your Calendar
              </h2>
              <Calendar 
                expenses={expenses} 
                currencySymbol={userData?.currencySymbol || '$'}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            </div>
          </div>

          {/* Widgets */}
          <div className="space-y-6">
            {/* Spending Trends */}
            <div 
              className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:border-primary transition-all cursor-pointer group"
              onClick={() => setIsTrendsModalOpen(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2">
                  📊 Spending Trends
                </h3>
                <BarChart3 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </div>
              
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={dailySpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="currentColor" />
                  <YAxis tick={{ fontSize: 12 }} stroke="currentColor" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)', 
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--color-primary)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                {percentChange !== 0 ? (
                  <p className="text-sm">
                    {percentChange < 0 ? (
                      <>
                        <span className="text-green-500">↓ {Math.abs(percentChange).toFixed(1)}%</span> from last week. Great job! 👍
                      </>
                    ) : (
                      <>
                        <span className="text-orange-500">↑ {percentChange.toFixed(1)}%</span> from last week. Watch your spending! 👀
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-sm">Start tracking to see your trends! 📈</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Click to view detailed analysis
              </p>
            </div>

            {/* Saving Goals */}
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2">
                  🎯 Saving Goals
                </h3>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {savingGoals.length === 0 ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-primary text-primary hover:bg-primary/10 transition-colors"
                  >
                    + Short-Term Goal
                  </button>
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-secondary text-secondary hover:bg-secondary/10 transition-colors"
                  >
                    + Long-Term Goal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savingGoals.map((goal) => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    return (
                      <div key={goal.id} className="p-4 bg-muted rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{goal.name}</h4>
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>{formatCurrency(goal.currentAmount)}</span>
                            <span>{formatCurrency(goal.targetAmount)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpenseModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
        aria-label="Add expense"
      >
        <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform" />
      </button>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAdd={handleAddExpense}
        currencySymbol={userData?.currencySymbol || '$'}
      />

      <AddGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onAdd={handleAddGoal}
        currencySymbol={userData?.currencySymbol || '$'}
      />

      <SpendingTrendsModal
        isOpen={isTrendsModalOpen}
        onClose={() => setIsTrendsModalOpen(false)}
        expenses={expenses}
        currencySymbol={userData?.currencySymbol || '$'}
      />
    </div>
  );
}
