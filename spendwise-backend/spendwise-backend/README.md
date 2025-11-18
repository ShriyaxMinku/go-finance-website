# SpendWise Backend API

Smart Money Management Backend for young adults (18-30 age group).

## 🚀 Features

- 🔐 User Authentication (JWT)
- 💰 Expense Management (CRUD)
- 📊 Spending Analytics & Trends
- 🎯 Budget Tracking
- 📸 OCR Receipt Support
- 🔒 Secure & Rate Limited

## 📦 Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure `.env` file
4. Start MongoDB: `docker run -d -p 27017:27017 mongo:7`
5. Run: `npm start`

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `POST /api/expenses/bulk` - Bulk create (OCR)

### Analytics
- `GET /api/analytics/trends` - Week/Month trends
- `GET /api/analytics/categories` - Category breakdown

## 🌐 Deployment

Deploy to Railway, Render, or Vercel. See full documentation for details.

## 📝 License

MIT