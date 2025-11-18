import { useState } from 'react';
import { X } from 'lucide-react';
import { SavingGoal } from '../App';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Omit<SavingGoal, 'id' | 'currentAmount'>) => void;
  currencySymbol: string;
}

export function AddGoalModal({ isOpen, onClose, onAdd, currencySymbol }: AddGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = () => {
    if (!name || !targetAmount || !targetDate) return;

    onAdd({
      name,
      targetAmount: parseFloat(targetAmount),
      targetDate,
    });

    // Reset form
    setName('');
    setTargetAmount('');
    setTargetDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2">
            🎯 Add Saving Goal
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Goal Name */}
          <div>
            <label className="block mb-2 text-muted-foreground">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Laptop, Vacation Fund"
              className="w-full px-4 py-3 bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block mb-2 text-muted-foreground">Target Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 text-xl bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block mb-2 text-muted-foreground">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!name || !targetAmount || !targetDate}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Goal
          </button>
        </div>
      </div>
    </div>
  );
}
