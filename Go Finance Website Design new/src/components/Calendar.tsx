import { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { Expense } from '../App';

interface CalendarProps {
  expenses: Expense[];
  currencySymbol: string;
  onEditExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export function Calendar({ expenses, currencySymbol, onEditExpense, onDeleteExpense }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
  };

  const getExpensesForDate = (date: string) => {
    return expenses.filter((expense) => expense.date === date);
  };

  const getTotalForDate = (date: string) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayExpenses = getExpensesForDate(date);
    const total = getTotalForDate(date);
    const isToday = date === new Date().toISOString().split('T')[0];
    const isSelected = date === selectedDate;

    days.push(
      <button
        key={day}
        onClick={() => setSelectedDate(isSelected ? null : date)}
        className={`aspect-square p-2 rounded-xl border-2 transition-all relative group ${
          isSelected
            ? 'border-primary bg-primary/10 shadow-lg scale-105'
            : isToday
            ? 'border-accent bg-accent/10'
            : 'border-transparent hover:border-primary/30 hover:bg-muted'
        }`}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm ${isSelected || isToday ? 'font-bold' : ''}`}>
            {day}
          </span>
          {dayExpenses.length > 0 && (
            <div className="mt-auto space-y-1">
              <div className="flex flex-wrap gap-1 justify-center">
                {dayExpenses.slice(0, 3).map((expense, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary"
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-primary truncate">
                {currencySymbol}{total.toFixed(0)}
              </p>
            </div>
          )}
        </div>
      </button>
    );
  }

  const selectedExpenses = selectedDate ? getExpensesForDate(selectedDate) : [];
  const selectedTotal = selectedDate ? getTotalForDate(selectedDate) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-sm font-medium text-muted-foreground py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <p className="text-lg font-bold text-primary">
              Total: {currencySymbol}{selectedTotal.toFixed(2)}
            </p>
          </div>
          
          {selectedExpenses.length > 0 ? (
            <div className="space-y-2">
              {selectedExpenses.map((expense) => (
                <div key={expense.id}>
                  {editingExpense?.id === expense.id ? (
                    <div className="p-4 bg-card rounded-xl border-2 border-primary space-y-3">
                      <input
                        type="number"
                        value={editingExpense.amount}
                        onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-input-background border-2 border-input rounded-lg focus:border-primary focus:outline-none"
                        placeholder="Amount"
                      />
                      <input
                        type="text"
                        value={editingExpense.category}
                        onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                        className="w-full px-3 py-2 bg-input-background border-2 border-input rounded-lg focus:border-primary focus:outline-none"
                        placeholder="Category"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onEditExpense(editingExpense.id, {
                              amount: editingExpense.amount,
                              category: editingExpense.category,
                              date: editingExpense.date,
                            });
                            setEditingExpense(null);
                          }}
                          className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingExpense(null)}
                          className="flex-1 py-2 border-2 border-border rounded-lg hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border group hover:border-primary/50 transition-all">
                      <span className="font-medium">{expense.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">
                          {currencySymbol}{expense.amount.toFixed(2)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            aria-label="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this expense?')) {
                                onDeleteExpense(expense.id);
                              }
                            }}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No expenses for this day
            </p>
          )}
        </div>
      )}
    </div>
  );
}
