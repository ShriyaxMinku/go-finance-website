import { useState } from 'react';
import { X } from 'lucide-react';
import { Expense } from '../App';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  currencySymbol: string;
}

const categories = [
  { name: 'Eating Out', emoji: '🍔' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Subscription', emoji: '📱' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Leisure', emoji: '🎬' },
];

export function AddExpenseModal({ isOpen, onClose, onAdd, currencySymbol }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!amount || (!category && !customCategory)) return;

    onAdd({
      amount: parseFloat(amount),
      category: customCategory || category,
      date,
    });

    // Reset form
    setAmount('');
    setCategory('');
    setCustomCategory('');
    setShowCustomInput(false);
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2">
            ➕ Add Expense
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block mb-2 text-muted-foreground">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 text-2xl bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block mb-2 text-muted-foreground">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block mb-3 text-muted-foreground">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setCategory(cat.name);
                    setCustomCategory('');
                    setShowCustomInput(false);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    category === cat.name && !showCustomInput
                      ? 'border-primary bg-primary/10 shadow-lg scale-105'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <p className="text-sm font-medium">{cat.name}</p>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCustomInput(true);
                  setCategory('');
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  showCustomInput
                    ? 'border-secondary bg-secondary/10 shadow-lg scale-105'
                    : 'border-border hover:border-secondary/50 hover:bg-muted'
                }`}
              >
                <div className="text-2xl mb-1">✍️</div>
                <p className="text-sm font-medium">Custom</p>
              </button>
            </div>
          </div>

          {/* Custom Category Input */}
          {showCustomInput && (
            <div>
              <label className="block mb-2 text-muted-foreground">
                Custom Category Name
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter category name"
                className="w-full px-4 py-3 bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!amount || (!category && !customCategory)}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}
