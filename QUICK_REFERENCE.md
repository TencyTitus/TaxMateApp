# TaxMate Database - Quick Reference Card

## 🚀 Quick Start

```bash
# Start MongoDB
net start MongoDB

# Start Backend
cd backend
npm start

# Seed Sample Data
npm run seed
```

---

## 📊 Database Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User accounts & profile | email, incomeEntries, deductionEntries |
| `payments` | Payment transactions | transactionId, amount, taxYear |
| `taxrecords` | Tax calculations per year | year, totalIncome, taxPaid |
| `notifications` | User alerts | title, message, isRead |

---

## 🔑 API Endpoints Cheat Sheet

### Users
```
GET    /api/user/profile?email=xxx
PUT    /api/user/profile
GET    /api/user/income-entries     [Auth]
POST   /api/user/income-entries     [Auth]
GET    /api/user/deduction-entries  [Auth]
POST   /api/user/deduction-entries  [Auth]
```

### Payments
```
GET    /api/payments                [Auth]
POST   /api/payments                [Auth]
GET    /api/payments/stats/summary  [Auth]
```

### Tax Records
```
GET    /api/tax-records             [Auth]
POST   /api/tax-records             [Auth]
GET    /api/tax-records/:year       [Auth]
```

### Notifications
```
GET    /api/notifications           [Auth]
POST   /api/notifications           [Auth]
PUT    /api/notifications/:id/read  [Auth]
```

---

## 💻 MongoDB Shell Commands

```javascript
// Connect to database
use taxmate

// View all users
db.users.find().pretty()

// Find user by email
db.users.findOne({ email: "user@example.com" })

// View payments
db.payments.find().pretty()

// View tax records
db.taxrecords.find().pretty()

// View notifications
db.notifications.find().pretty()

// Count documents
db.users.countDocuments()
db.payments.countDocuments()

// Delete all payments (careful!)
db.payments.deleteMany({})
```

---

## 📝 Sample Data Structures

### User Document
```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  password: "$2b$10$...",
  incomeEntries: [
    { source: "Salary", amount: 800000, createdAt: ISODate("...") }
  ],
  deductionEntries: [
    { section: "80C", amount: 150000, createdAt: ISODate("...") }
  ]
}
```

### Payment Document
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  transactionId: "TXN1234567890",
  amount: 25000,
  paymentMethod: "credit",
  taxYear: 2025,
  createdAt: ISODate("...")
}
```

### Tax Record Document
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  year: 2025,
  totalIncome: 1000000,
  totalDeductions: 150000,
  taxPaid: 95000,
  status: "draft"
}
```

---

## 🛠️ Common Operations

### Create Payment
```javascript
POST /api/payments
{
  "amount": 25000,
  "paymentMethod": "credit",
  "email": "user@example.com",
  "phone": "9876543210",
  "taxYear": 2025
}
```

### Add Income Entry
```javascript
POST /api/user/income-entries
{
  "source": "Salary",
  "amount": 800000
}
```

### Create Notification
```javascript
POST /api/notifications
{
  "title": "Tax Reminder",
  "message": "File your taxes by July 31st",
  "type": "reminder",
  "priority": "high"
}
```

---

## 🔐 Authentication

### Get Token
```javascript
POST /login
{
  "email": "user@example.com",
  "password": "password123"
}

Response: { "token": "eyJhbGc...", "user": {...} }
```

### Use Token in Request
```javascript
headers: {
  "Authorization": "Bearer eyJhbGc..."
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to DB | Check MongoDB is running |
| Authentication failed | Login again to get new token |
| Duplicate key error | Email/TransactionId already exists |
| User not found | Register first or check email |

---

## 📦 File Locations

```
backend/
├── models/
│   ├── User.js          ← User schema
│   ├── Payment.js       ← Payment schema
│   ├── TaxRecord.js     ← Tax record schema
│   └── Notification.js  ← Notification schema
├── routes/
│   ├── user.js          ← User APIs
│   ├── payment.js       ← Payment APIs
│   ├── taxRecord.js     ← Tax record APIs
│   └── notification.js  ← Notification APIs
├── server.js            ← Main server file
└── seedDatabase.js      ← Seed script
```

---

## ⚡ Quick Commands

```bash
# Setup
npm install                    # Install dependencies
npm start                      # Start server
npm run seed                   # Seed database

# Database
mongodump --db taxmate        # Backup database
mongorestore --db taxmate     # Restore database
mongosh                       # Open MongoDB shell

# Development
npm run dev                   # Start with nodemon
npm run setup-admin           # Create admin user
```

---

## 📊 Data Validation

### Income Entry
- ✅ source: Required (Salary, Freelance, Investments, Other)
- ✅ amount: Required, Number, > 0

### Deduction Entry
- ✅ section: Required (80C, 80D, HRA, etc.)
- ✅ amount: Required, Number, > 0

### Payment
- ✅ amount: Required, Number, > 0
- ✅ paymentMethod: Required (credit, debit, netbanking, upi)

---

## 🎯 Key Features

✅ All data persisted in MongoDB
✅ JWT authentication required
✅ Data validation on all inputs
✅ Automatic timestamps
✅ User data isolation
✅ Secure password hashing
✅ Transaction tracking
✅ Year-wise tax records

---

## 📞 Need Help?

- **Full Documentation**: See `DATABASE_STRUCTURE.md`
- **Setup Guide**: See `DATABASE_SETUP_GUIDE.md`
- **Implementation Details**: See `DATABASE_IMPLEMENTATION_SUMMARY.md`
- **Visual Diagram**: See `DATABASE_DIAGRAM.md`

---

**Version**: 1.0  
**Last Updated**: 2025-10-27
