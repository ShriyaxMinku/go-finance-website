const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spendwise';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    console.log(`📊 Database: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`); // Hide credentials in log
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('💡 Make sure MongoDB is running or use MongoDB Atlas (cloud)');
    console.error('💡 Update MONGODB_URI in .env file if using cloud database');
  });

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  name: { type: String, required: true, trim: true },
  currency: { type: String, default: '₹' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    required: true,
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Other']
  },
  description: { type: String, required: true, trim: true },
  date: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  source: { type: String, enum: ['manual', 'ocr'], default: 'manual' }
});

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, timestamp: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Other', 'Total']
  },
  limit: { type: Number, required: true, min: 0 },
  period: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
  createdAt: { type: Date, default: Date.now }
});

budgetSchema.index({ userId: 1, category: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

// Authentication Middleware
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, email: user.email, name: user.name, currency: user.currency }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, currency: user.currency }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Expense Routes
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const query = { userId: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (category) {
      query.category = category;
    }
    
    const expenses = await Expense.find(query).sort({ timestamp: -1 });
    res.json({ expenses });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { amount, category, description, date, source } = req.body;
    
    if (!amount || !category || !description || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const expense = new Expense({
      userId: req.userId,
      amount,
      category,
      description,
      date,
      source: source || 'manual'
    });
    
    await expense.save();
    res.status(201).json({ message: 'Expense created successfully', expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.post('/api/expenses/bulk', authMiddleware, async (req, res) => {
  try {
    const { expenses } = req.body;
    
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ error: 'Invalid expenses data' });
    }
    
    const expensesWithUser = expenses.map(exp => ({
      ...exp,
      userId: req.userId,
      source: 'ocr'
    }));
    
    const createdExpenses = await Expense.insertMany(expensesWithUser);
    res.status(201).json({
      message: `${createdExpenses.length} expenses created successfully`,
      expenses: createdExpenses
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Failed to create expenses' });
  }
});

app.put('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { amount, category, description, date },
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ message: 'Expense updated successfully', expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Analytics Routes
app.get('/api/analytics/trends', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    
    // Current week
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - now.getDay());
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    
    const currentWeekExpenses = await Expense.find({
      userId: req.userId,
      timestamp: { $gte: startOfCurrentWeek }
    });
    
    // Last week
    const startOfLastWeek = new Date(startOfCurrentWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfCurrentWeek);
    
    const lastWeekExpenses = await Expense.find({
      userId: req.userId,
      timestamp: { $gte: startOfLastWeek, $lt: endOfLastWeek }
    });
    
    // Current month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentMonthExpenses = await Expense.find({
      userId: req.userId,
      timestamp: { $gte: startOfCurrentMonth }
    });
    
    // Last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthExpenses = await Expense.find({
      userId: req.userId,
      timestamp: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });
    
    const currentWeekTotal = currentWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const weekChange = lastWeekTotal > 0 ? ((currentWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;
    const monthChange = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    
    res.json({
      week: {
        current: currentWeekTotal,
        last: lastWeekTotal,
        change: weekChange,
        difference: currentWeekTotal - lastWeekTotal
      },
      month: {
        current: currentMonthTotal,
        last: lastMonthTotal,
        change: monthChange,
        difference: currentMonthTotal - lastMonthTotal
      }
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

app.get('/api/analytics/categories', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const expenses = await Expense.find(query);
    
    const categoryData = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = { total: 0, count: 0, transactions: [] };
      }
      acc[exp.category].total += exp.amount;
      acc[exp.category].count += 1;
      acc[exp.category].transactions.push({
        amount: exp.amount,
        description: exp.description,
        date: exp.date
      });
      return acc;
    }, {});
    
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const categories = Object.entries(categoryData).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
      avgPerTransaction: data.count > 0 ? data.total / data.count : 0,
      topExpenses: data.transactions.sort((a, b) => b.amount - a.amount).slice(0, 5)
    }));
    
    res.json({
      categories: categories.sort((a, b) => b.total - a.total),
      totalSpent,
      totalTransactions: expenses.length
    });
  } catch (error) {
    console.error('Category insights error:', error);
    res.status(500).json({ error: 'Failed to fetch category insights' });
  }
});

// Budget Routes
app.get('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.json({ budgets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

app.post('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const { category, limit, period } = req.body;
    
    if (!category || !limit || !period) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, category, period },
      { limit },
      { new: true, upsert: true }
    );
    
    res.json({ message: 'Budget saved successfully', budget });
  } catch (error) {
    console.error('Budget error:', error);
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

app.delete('/api/budgets/:id', authMiddleware, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

app.get('/api/budgets/status', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = budget.period === 'monthly' ? startOfMonth : startOfWeek;
        
        const expenses = await Expense.find({
          userId: req.userId,
          category: budget.category === 'Total' ? { $exists: true } : budget.category,
          timestamp: { $gte: startDate }
        });
        
        const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const remaining = budget.limit - spent;
        const percentage = (spent / budget.limit) * 100;
        
        return {
          budget: budget.toObject(),
          spent,
          remaining,
          percentage,
          isOverBudget: spent > budget.limit
        };
      })
    );
    
    res.json({ budgetStatus });
  } catch (error) {
    console.error('Budget status error:', error);
    res.status(500).json({ error: 'Failed to fetch budget status' });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SpendWise Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});