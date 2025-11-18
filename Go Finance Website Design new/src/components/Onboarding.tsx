import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { UserData } from '../App';

interface OnboardingProps {
  onComplete: (data: UserData) => void;
}

interface Country {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'EU', name: 'European Union', currency: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: '$', flag: '🇲🇽' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', flag: '🇿🇦' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr', flag: '🇸🇪' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', symbol: '₩', flag: '🇰🇷' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [income, setIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState([{ name: '', amount: '' }]);
  const [spendingHabits, setSpendingHabits] = useState<string[]>([]);

  const habits = [
    { label: 'Shopping', emoji: '🛍' },
    { label: 'Dining Out', emoji: '🍔' },
    { label: 'Coffee', emoji: '☕' },
    { label: 'Transport', emoji: '🚗' },
    { label: 'Entertainment', emoji: '🍿' },
    { label: 'Gaming', emoji: '🎮' },
    { label: 'Travel', emoji: '✈️' },
    { label: 'Groceries', emoji: '🛒' },
  ];

  const addExpenseRow = () => {
    setFixedExpenses([...fixedExpenses, { name: '', amount: '' }]);
  };

  const removeExpenseRow = (index: number) => {
    if (fixedExpenses.length > 1) {
      const newExpenses = fixedExpenses.filter((_, i) => i !== index);
      setFixedExpenses(newExpenses);
    }
  };

  const updateExpense = (index: number, field: 'name' | 'amount', value: string) => {
    const newExpenses = [...fixedExpenses];
    newExpenses[index][field] = value;
    setFixedExpenses(newExpenses);
  };

  const toggleHabit = (habit: string) => {
    if (spendingHabits.includes(habit)) {
      setSpendingHabits(spendingHabits.filter((h) => h !== habit));
    } else {
      setSpendingHabits([...spendingHabits, habit]);
    }
  };

  const handleNext = () => {
    if (step === 1 && age) {
      setStep(2);
    } else if (step === 2 && selectedCountry) {
      setStep(3);
    } else if (step === 3 && income) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleFinish = () => {
    if (!selectedCountry) return;

    const validExpenses = fixedExpenses
      .filter((exp) => exp.name && exp.amount)
      .map((exp) => ({
        name: exp.name,
        amount: parseFloat(exp.amount),
      }));

    onComplete({
      age: parseInt(age),
      country: selectedCountry.name,
      currency: selectedCountry.currency,
      currencySymbol: selectedCountry.symbol,
      income: parseFloat(income),
      fixedExpenses: validExpenses,
      spendingHabits,
    });
  };

  const canProceed = () => {
    if (step === 1) return age && parseInt(age) >= 18 && parseInt(age) <= 100;
    if (step === 2) return selectedCountry !== null;
    if (step === 3) return income && parseFloat(income) > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-full h-2 rounded-full mx-1 transition-all ${
                  s <= step
                    ? 'bg-gradient-to-r from-primary to-secondary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {step} of 5
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-card rounded-3xl shadow-2xl p-8 md:p-12 border border-border">
          {/* Step 1: Age */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="mb-2">Welcome to Go Finance! 👋</h1>
                <p className="text-muted-foreground">How old are you?</p>
              </div>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                className="w-full px-6 py-4 text-2xl text-center bg-input-background border-2 border-input rounded-2xl focus:border-primary focus:outline-none transition-colors"
                min="18"
                max="100"
              />
            </div>
          )}

          {/* Step 2: Country */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="mb-2">Where are you from? 🌍</h1>
                <p className="text-muted-foreground">Select your country</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedCountry?.code === country.code
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{country.flag}</span>
                      <div>
                        <p className="font-medium">{country.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {country.currency} ({country.symbol})
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Income */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="mb-2">What's your monthly income? 💰</h1>
                <p className="text-muted-foreground">
                  This helps us personalize your experience
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                  {selectedCountry?.symbol}
                </span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-16 pr-6 py-4 text-2xl text-center bg-input-background border-2 border-input rounded-2xl focus:border-primary focus:outline-none transition-colors"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Step 4: Fixed Expenses */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="mb-2">Let's list your fixed expenses 🧾</h1>
                <p className="text-muted-foreground">
                  Rent, subscriptions, insurance, etc.
                </p>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {fixedExpenses.map((expense, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={expense.name}
                      onChange={(e) => updateExpense(index, 'name', e.target.value)}
                      placeholder="Expense name (e.g., Rent)"
                      className="flex-1 px-4 py-3 bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {selectedCountry?.symbol}
                      </span>
                      <input
                        type="number"
                        value={expense.amount}
                        onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-input-background border-2 border-input rounded-xl focus:border-primary focus:outline-none transition-colors"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {fixedExpenses.length > 1 && (
                      <button
                        onClick={() => removeExpenseRow(index)}
                        className="p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addExpenseRow}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add another expense
              </button>
            </div>
          )}

          {/* Step 5: Spending Habits */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="mb-2">Where does your money usually go? 🤔</h1>
                <p className="text-muted-foreground">
                  Select all that apply
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {habits.map((habit) => (
                  <button
                    key={habit.label}
                    onClick={() => toggleHabit(habit.label)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      spendingHabits.includes(habit.label)
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    <div className="text-3xl mb-2">{habit.emoji}</div>
                    <p className="text-sm font-medium">{habit.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl border-2 border-border hover:bg-muted transition-colors"
              >
                Back
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-secondary text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                You're all set! Let's get your finances in order →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
