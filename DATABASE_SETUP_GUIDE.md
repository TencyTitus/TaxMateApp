# TaxMate Database Setup Guide

## Quick Start

Follow these steps to set up the TaxMate database with all important data correctly stored.

---

## Prerequisites

✅ MongoDB installed and running
✅ Node.js and npm installed
✅ Backend dependencies installed (`npm install` in backend folder)

---

## Step 1: Start MongoDB

### Windows:
```bash
# Start MongoDB service
net start MongoDB

# Or if installed locally
mongod
```

### Mac/Linux:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or
brew services start mongodb-community
```

---

## Step 2: Verify Database Connection

The backend automatically connects to MongoDB when started.

Check `backend/server.js` for the connection string:
```javascript
mongoose.connect("mongodb://127.0.0.1:27017/taxmate")
```

---

## Step 3: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
✅ Connected to MongoDB
🚀 Server is running on http://localhost:5000
```

---

## Step 4: Register a User

1. **Open the frontend** (http://localhost:5173)
2. **Go to Register page** (/register)
3. **Create an account** with:
   - Name: Your name
   - Email: your@email.com
   - Password: Your password

This creates your user in the database.

---

## Step 5: Add Income & Deduction Data

### Add Income Entries:
1. Login to your account
2. Go to **Add Income** page
3. Add your income sources:
   - Salary: ₹800,000
   - Freelance: ₹200,000
   - etc.

### Add Deduction Entries:
1. Go to **Add Deduction** page
2. Add your deductions:
   - 80C: ₹150,000
   - 80D: ₹25,000
   - etc.

---

## Step 6: Seed Sample Data (Optional)

To populate with sample payments, tax records, and notifications:

```bash
cd backend
node seedDatabase.js
```

This will create:
- ✅ 2 sample payments
- ✅ 2 tax records (current year + 2023)
- ✅ 4 sample notifications

**Note:** Run this AFTER creating a user account.

---

## Step 7: Verify Database

You can verify the database using MongoDB Compass or the MongoDB shell:

```bash
# Connect to MongoDB shell
mongosh

# Switch to taxmate database
use taxmate

# Check collections
show collections

# View users
db.users.find().pretty()

# View payments
db.payments.find().pretty()

# View tax records
db.taxrecords.find().pretty()

# View notifications
db.notifications.find().pretty()
```

---

## Database Collections Created

After setup, you'll have these collections:

### 1. **users** - User accounts and profile data
- ✅ User credentials (email, password)
- ✅ Profile information (PAN, Aadhaar, bank details)
- ✅ Income entries (embedded array)
- ✅ Deduction entries (embedded array)
- ✅ Tax documents
- ✅ User preferences

### 2. **payments** - Payment transactions
- ✅ Transaction ID
- ✅ Amount paid
- ✅ Payment method
- ✅ Tax year
- ✅ Payment status
- ✅ Timestamps

### 3. **taxrecords** - Tax calculations per year
- ✅ Year-wise tax data
- ✅ Total income & deductions
- ✅ Old vs New regime comparison
- ✅ Tax paid amount
- ✅ Filing status
- ✅ Income/deduction breakdown

### 4. **notifications** - User notifications
- ✅ Notification messages
- ✅ Read/unread status
- ✅ Priority levels
- ✅ Expiry dates
- ✅ Action URLs

---

## Testing the Database

### Test User Profile:
```bash
GET http://localhost:5000/api/user/profile?email=your@email.com
```

### Test Income Entries:
```bash
GET http://localhost:5000/api/user/income-entries
# Requires authentication token
```

### Test Payments:
```bash
GET http://localhost:5000/api/payments
# Requires authentication token
```

### Test Tax Records:
```bash
GET http://localhost:5000/api/tax-records
# Requires authentication token
```

### Test Notifications:
```bash
GET http://localhost:5000/api/notifications
# Requires authentication token
```

---

## Data Flow

Here's how data flows through the application:

1. **User Registration** → Creates user in `users` collection
2. **Add Income/Deductions** → Stores in `users.incomeEntries` and `users.deductionEntries`
3. **Make Payment** → Creates record in `payments` collection
4. **Calculate Tax** → Creates/updates record in `taxrecords` collection
5. **System Alerts** → Creates records in `notifications` collection

---

## Important Features

### ✅ Data Persistence
- All user data stored in MongoDB (not localStorage)
- Survives browser cache clearing
- Accessible across devices

### ✅ Data Relationships
- Payments linked to users via `userId`
- Tax records linked to users via `userId`
- Notifications linked to users via `userId`

### ✅ Data Security
- Passwords hashed with bcrypt
- JWT authentication for API access
- Card numbers never stored (only last 4 digits)

### ✅ Data Integrity
- Unique email addresses
- One tax record per user per year
- Validation on all input fields

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Ensure MongoDB service is running
- Check connection string in `backend/server.js`
- Verify MongoDB is installed correctly

### Issue: "User not found" when seeding
**Solution:**
- Create a user account first via the Register page
- The seed script looks for `tency@example.com` by default

### Issue: "Duplicate key error"
**Solution:**
- Email already exists in database
- Transaction ID already exists
- Tax record for that year already exists

### Issue: "Authentication failed"
**Solution:**
- Login again to get a fresh JWT token
- Check if token is stored in localStorage
- Verify token is being sent in API requests

---

## Backup Your Database

### Create a backup:
```bash
mongodump --db taxmate --out ./backup
```

### Restore from backup:
```bash
mongorestore --db taxmate ./backup/taxmate
```

---

## Next Steps

1. ✅ Database is set up
2. ✅ Sample data loaded (optional)
3. ✅ Collections created
4. ✅ APIs working

Now you can:
- Make payments (stored in database)
- View tax history (from database)
- Receive notifications (from database)
- Track all financial data in one place

---

## Support

For more details, see:
- `DATABASE_STRUCTURE.md` - Complete schema documentation
- `backend/models/` - Mongoose model definitions
- `backend/routes/` - API endpoint implementations

---

**Database Version:** 1.0  
**Last Updated:** 2025-10-27
