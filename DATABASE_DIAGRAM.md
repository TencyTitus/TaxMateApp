# TaxMate Database Architecture Diagram

## Database Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB - taxmate                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   USERS          │       │   PAYMENTS       │
│  Collection      │◄──────┤  Collection      │
├──────────────────┤  1:N  ├──────────────────┤
│ _id (ObjectId)   │       │ _id              │
│ name             │       │ userId (FK)      │
│ email (unique)   │       │ transactionId    │
│ password         │       │ amount           │
│ isAdmin          │       │ paymentMethod    │
│ status           │       │ status           │
│ pan              │       │ taxYear          │
│ aadhaar          │       │ cardLastFour     │
│ dateOfBirth      │       │ createdAt        │
│ gender           │       │ updatedAt        │
│ occupation       │       └──────────────────┘
│ bank {}          │
│ contact {}       │       ┌──────────────────┐
│ taxDocs []       │       │  TAX RECORDS     │
│ incomeEntries [] │◄──────┤  Collection      │
│ deductionEntries │  1:N  ├──────────────────┤
│ preferences {}   │       │ _id              │
│ lastLogin        │       │ userId (FK)      │
│ createdAt        │       │ year (unique)    │
│ updatedAt        │       │ totalIncome      │
└──────────────────┘       │ totalDeductions  │
                           │ taxableIncome    │
        │                  │ oldRegimeTax     │
        │                  │ newRegimeTax     │
        │ 1:N              │ selectedRegime   │
        │                  │ taxPaid          │
        ▼                  │ status           │
┌──────────────────┐       │ filedDate        │
│ NOTIFICATIONS    │       │ dueDate          │
│  Collection      │       │ incomeBreakdown[]│
├──────────────────┤       │ deductionBrkdwn[]│
│ _id              │       │ createdAt        │
│ userId (FK)      │       │ updatedAt        │
│ title            │       └──────────────────┘
│ message          │
│ type             │
│ isRead           │
│ priority         │
│ actionUrl        │
│ expiresAt        │
│ createdAt        │
│ updatedAt        │
└──────────────────┘
```

---

## Relationships

### 1. Users → Payments (One-to-Many)
```
One User can have multiple Payments
Each Payment belongs to one User
FK: payments.userId → users._id
```

### 2. Users → Tax Records (One-to-Many)
```
One User can have multiple Tax Records (one per year)
Each Tax Record belongs to one User
FK: taxrecords.userId → users._id
Unique Constraint: userId + year
```

### 3. Users → Notifications (One-to-Many)
```
One User can have multiple Notifications
Each Notification belongs to one User
FK: notifications.userId → users._id
```

---

## Data Flow Diagram

```
┌────────────┐
│   USER     │
│ Registers  │
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ Create User     │──────► users collection
│ in Database     │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Add Income &    │
│ Deductions      │──────► users.incomeEntries[]
└─────┬───────────┘        users.deductionEntries[]
      │
      ▼
┌─────────────────┐
│ Calculate Tax   │──────► taxrecords collection
│ (Auto-creates   │        (year-wise records)
│  Tax Record)    │
└─────┬───────────┘
      │
      ├────────────────┐
      │                │
      ▼                ▼
┌─────────────┐  ┌──────────────┐
│ Make Payment│  │ Receive      │
│             │  │ Notification │
└─────┬───────┘  └──────┬───────┘
      │                 │
      ▼                 ▼
┌─────────────┐  ┌──────────────┐
│  payments   │  │notifications │
│ collection  │  │  collection  │
└─────────────┘  └──────────────┘
```

---

## API Endpoint Structure

```
┌─────────────────────────────────────────┐
│           API ENDPOINTS                 │
├─────────────────────────────────────────┤
│                                         │
│  /api/user/                             │
│    ├─ profile (GET/PUT)                 │
│    ├─ income-entries (GET/POST/PUT/DEL) │
│    ├─ deduction-entries (GET/POST/...)  │
│    ├─ tax-optimization (GET)            │
│    ├─ tax-summary (GET)                 │
│    └─ history (GET)                     │
│                                         │
│  /api/payments/                         │
│    ├─ / (GET/POST)                      │
│    ├─ /:transactionId (GET)             │
│    └─ stats/summary (GET)               │
│                                         │
│  /api/tax-records/                      │
│    ├─ / (GET/POST)                      │
│    ├─ /:year (GET/DELETE)               │
│    └─ /:year/status (PUT)               │
│                                         │
│  /api/notifications/                    │
│    ├─ / (GET/POST)                      │
│    ├─ unread/count (GET)                │
│    ├─ /:id/read (PUT)                   │
│    ├─ read/all (PUT/DELETE)             │
│    └─ /:id (DELETE)                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Collection Sizes (Estimated)

```
Collection         Average Doc Size    Max Docs/User
─────────────────────────────────────────────────────
users              ~2 KB               1
payments           ~500 bytes          Unlimited
taxrecords         ~1 KB               1 per year
notifications      ~300 bytes          100 (auto-cleanup)
```

---

## Indexes

```
users:
  - email (unique)
  - _id (auto)

payments:
  - userId (indexed)
  - transactionId (unique)
  - _id (auto)

taxrecords:
  - userId + year (compound unique)
  - userId (indexed)
  - _id (auto)

notifications:
  - userId (indexed)
  - isRead (indexed)
  - _id (auto)
```

---

## Data Security Layers

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  - JWT Authentication                   │
│  - Authorization Middleware             │
│  - Input Validation                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Database Layer                  │
│  - Schema Validation                    │
│  - Unique Constraints                   │
│  - Required Fields                      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Storage Layer                   │
│  - Password Hashing (bcrypt)            │
│  - Sensitive Data Protection            │
│  - Encrypted Connections (TLS)          │
└─────────────────────────────────────────┘
```

---

## Data Lifecycle

```
User Registration
      │
      ▼
┌─────────────┐
│ Create User │
│   Record    │
└─────┬───────┘
      │
      ▼
Add Income/Deductions
      │
      ▼
┌─────────────┐
│ Calculate   │
│    Tax      │
└─────┬───────┘
      │
      ▼
Create Tax Record
      │
      ▼
Make Payment
      │
      ▼
┌─────────────┐
│ Update Tax  │
│   Status    │
└─────┬───────┘
      │
      ▼
File Tax Return
      │
      ▼
┌─────────────┐
│  Archive    │
│ (7 years)   │
└─────────────┘
```

---

## Backup Strategy

```
Daily Backups
     ├─ Full Database Dump
     ├─ Store for 30 days
     └─ Compress and Archive

Weekly Backups
     ├─ Full Database Dump
     ├─ Store for 1 year
     └─ Off-site Storage

Monthly Backups
     ├─ Full Database Dump
     ├─ Store for 7 years
     └─ Multiple Locations
```

---

This diagram provides a visual overview of how data is structured and flows through the TaxMate application.
