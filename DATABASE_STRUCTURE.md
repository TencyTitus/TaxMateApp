# TaxMate Database Structure

This document describes the complete database structure for the TaxMate application.

## Collections

### 1. Users Collection (`users`)

Stores user account information, profile details, income/deduction entries.

**Schema Fields:**
- `name` (String, required) - User's full name
- `email` (String, required, unique) - User's email address
- `password` (String, required) - Hashed password
- `isAdmin` (Boolean, default: false) - Admin status flag
- `status` (String, enum: ['active', 'inactive', 'pending', 'suspended']) - Account status
- `pan` (String) - PAN number
- `aadhaar` (String) - Aadhaar number
- `dateOfBirth` (Date) - Date of birth
- `gender` (String, enum: ['male', 'female', 'other']) - Gender
- `occupation` (String) - Current occupation
- `bank` (Object) - Bank account details
  - `accountNumber` (String)
  - `ifsc` (String)
  - `bankName` (String)
  - `branch` (String)
- `contact` (Object) - Contact information
  - `phone` (String)
  - `address` (String)
  - `city` (String)
  - `state` (String)
  - `pincode` (String)
- `taxDocs` (Array) - Tax documents uploaded
  - `docType` (String) - Document type (e.g., Salary Slip, Form 16)
  - `fileName` (String) - Original file name
  - `fileUrl` (String) - Path to uploaded file
  - `uploadedAt` (Date) - Upload timestamp
- `incomeEntries` (Array) - Income entries
  - `source` (String, required) - Income source (Salary, Freelance, Investments, Other)
  - `amount` (Number, required) - Income amount
  - `description` (String) - Optional description
  - `createdAt` (Date) - Entry creation date
- `deductionEntries` (Array) - Deduction entries
  - `section` (String, required) - Tax section (80C, 80D, HRA, etc.)
  - `amount` (Number, required) - Deduction amount
  - `description` (String) - Optional description
  - `createdAt` (Date) - Entry creation date
- `preferences` (Object) - User preferences
  - `emailNotifications` (Boolean, default: true)
  - `smsNotifications` (Boolean, default: false)
  - `taxRegime` (String, enum: ['Old Regime', 'New Regime'])
- `lastLogin` (Date) - Last login timestamp
- `resetPasswordToken` (String) - Password reset token
- `resetPasswordExpires` (Date) - Token expiry time
- `createdAt` (Date, auto) - Account creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

**Important Data:**
- User credentials and authentication details
- Complete profile information
- Income and deduction entries for tax calculation
- Tax documents and proofs
- User preferences

---

### 2. Payments Collection (`payments`)

Stores all payment transactions made by users.

**Schema Fields:**
- `userId` (ObjectId, required, ref: 'User') - Reference to user
- `transactionId` (String, required, unique) - Unique transaction identifier
- `amount` (Number, required) - Payment amount
- `paymentMethod` (String, required, enum: ['credit', 'debit', 'netbanking', 'upi']) - Payment method used
- `status` (String, enum: ['pending', 'completed', 'failed'], default: 'completed') - Payment status
- `email` (String) - Email used for payment
- `phone` (String) - Phone number used for payment
- `nameOnCard` (String) - Cardholder name
- `cardLastFour` (String) - Last 4 digits of card (for receipt)
- `taxYear` (Number) - Tax year for which payment was made
- `description` (String) - Payment description
- `receiptUrl` (String) - Link to receipt (if generated)
- `createdAt` (Date, auto) - Payment timestamp
- `updatedAt` (Date, auto) - Last update timestamp

**Important Data:**
- Complete payment transaction history
- Payment method details (without storing sensitive card data)
- Tax year linkage
- Receipt generation data

**API Endpoints:**
- `GET /api/payments` - Get all payments for authenticated user
- `GET /api/payments/:transactionId` - Get specific payment
- `POST /api/payments` - Create new payment
- `GET /api/payments/stats/summary` - Get payment statistics

---

### 3. Tax Records Collection (`taxrecords`)

Stores calculated tax records for each user per year.

**Schema Fields:**
- `userId` (ObjectId, required, ref: 'User') - Reference to user
- `year` (Number, required) - Tax year
- `totalIncome` (Number, default: 0) - Total income for the year
- `totalDeductions` (Number, default: 0) - Total deductions claimed
- `taxableIncome` (Number, default: 0) - Income after deductions
- `oldRegimeTax` (Number, default: 0) - Tax calculated under old regime
- `newRegimeTax` (Number, default: 0) - Tax calculated under new regime
- `selectedRegime` (String, enum: ['Old Regime', 'New Regime']) - Chosen tax regime
- `taxPaid` (Number, default: 0) - Actual tax paid
- `status` (String, enum: ['draft', 'filed', 'paid', 'pending']) - Filing status
- `filedDate` (Date) - Date when tax was filed
- `dueDate` (Date) - Tax filing due date
- `incomeBreakdown` (Array) - Detailed income breakdown
  - `source` (String)
  - `amount` (Number)
- `deductionBreakdown` (Array) - Detailed deduction breakdown
  - `section` (String)
  - `amount` (Number)
- `createdAt` (Date, auto) - Record creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

**Unique Index:** `userId + year` (one record per user per year)

**Important Data:**
- Year-wise tax calculations
- Tax regime comparison
- Filing status tracking
- Complete income/deduction breakdown

**API Endpoints:**
- `GET /api/tax-records` - Get all tax records
- `GET /api/tax-records/:year` - Get specific year record
- `POST /api/tax-records` - Create/update tax record
- `PUT /api/tax-records/:year/status` - Update filing status
- `DELETE /api/tax-records/:year` - Delete tax record

---

### 4. Notifications Collection (`notifications`)

Stores user notifications and reminders.

**Schema Fields:**
- `userId` (ObjectId, required, ref: 'User') - Reference to user
- `title` (String, required) - Notification title
- `message` (String, required) - Notification message
- `type` (String, enum: ['info', 'warning', 'success', 'error', 'reminder'], default: 'info') - Notification type
- `isRead` (Boolean, default: false) - Read status
- `priority` (String, enum: ['low', 'medium', 'high'], default: 'medium') - Priority level
- `actionUrl` (String) - Optional action link
- `expiresAt` (Date) - Expiration date for time-sensitive notifications
- `createdAt` (Date, auto) - Creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

**Important Data:**
- User notifications and alerts
- Tax filing reminders
- Payment confirmations
- System updates

**API Endpoints:**
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread/count` - Get unread count
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read/all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/read/all` - Delete all read

---

## Database Setup

### Initial Setup

1. **Install MongoDB** (if not already installed)
2. **Start MongoDB** service
3. **Run the application** - Database will be auto-created

### Seeding Sample Data

To populate the database with sample data:

```bash
cd backend
node seedDatabase.js
```

This will create:
- Sample payments
- Tax records for current and previous year
- Sample notifications

### Database Connection

Connection string: `mongodb://127.0.0.1:27017/taxmate`

Configured in: `backend/server.js`

---

## Important Notes

### Data Relationships

1. **Users ↔ Payments**: One-to-Many (One user can have multiple payments)
2. **Users ↔ Tax Records**: One-to-Many (One user can have multiple tax records, one per year)
3. **Users ↔ Notifications**: One-to-Many (One user can have multiple notifications)

### Data Security

- **Passwords**: Stored using bcrypt hashing
- **Card Numbers**: Only last 4 digits stored, full numbers never saved
- **Authentication**: JWT tokens for API access
- **Sensitive Data**: PAN, Aadhaar stored as strings (should be encrypted in production)

### Data Integrity

- **Unique Constraints**: Email (users), transactionId (payments), userId+year (tax records)
- **Required Fields**: Marked in schema definitions
- **Validation**: Enum types for status fields, payment methods, etc.

### Backup Recommendations

1. **Daily backups** of entire database
2. **Before tax filing season** - full backup
3. **After major updates** - incremental backup
4. Keep backups for at least **7 years** (as per tax regulations)

---

## Migration from localStorage

If you have data in localStorage that needs to be migrated to the database:

1. User income/deduction entries are already stored in the User collection
2. Payments should be created via the payment API endpoint
3. Notifications can be bulk-created via the notification API
4. Tax records will be auto-generated from user's income/deduction data

---

## Monitoring and Maintenance

### Indexes

Current indexes:
- Users: email (unique)
- Payments: userId, transactionId (unique)
- Tax Records: userId + year (compound unique)
- Notifications: userId, isRead

### Cleanup Tasks

1. **Delete expired notifications** (where expiresAt < current date)
2. **Archive old tax records** (older than 7 years)
3. **Clean up orphaned documents** (if any)

### Performance Tips

1. Add indexes on frequently queried fields
2. Use pagination for large result sets
3. Cache frequently accessed data
4. Regular database optimization

---

## Schema Version

Current Version: **1.0**
Last Updated: 2025-10-27

For questions or issues, refer to the API documentation in each route file.
