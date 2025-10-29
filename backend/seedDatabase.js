require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Payment = require('./models/Payment');
const TaxRecord = require('./models/TaxRecord');
const Notification = require('./models/Notification');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/taxmate');
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Payment.deleteMany({});
    await TaxRecord.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ Cleared payments, tax records, and notifications');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'tency@example.com' });
    
    if (!testUser) {
      console.log('❌ Test user not found. Please register a user first.');
      process.exit(1);
    }

    console.log('✅ Found test user:', testUser.email);

    // Seed sample payments
    console.log('💳 Seeding sample payments...');
    const payments = [
      {
        userId: testUser._id,
        transactionId: `TXN${Date.now()}001`,
        amount: 25000,
        paymentMethod: 'credit',
        status: 'completed',
        email: testUser.email,
        phone: '9876543210',
        nameOnCard: testUser.name,
        cardLastFour: '4321',
        taxYear: 2024,
        description: 'Tax payment for year 2024'
      },
      {
        userId: testUser._id,
        transactionId: `TXN${Date.now()}002`,
        amount: 18000,
        paymentMethod: 'upi',
        status: 'completed',
        email: testUser.email,
        phone: '9876543210',
        taxYear: 2023,
        description: 'Tax payment for year 2023'
      }
    ];

    const createdPayments = await Payment.insertMany(payments);
    console.log(`✅ Created ${createdPayments.length} sample payments`);

    // Seed sample tax records
    console.log('📊 Seeding sample tax records...');
    
    // Calculate current year tax record from user's entries
    const currentYear = new Date().getFullYear();
    const totalIncome = (testUser.incomeEntries || []).reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = (testUser.deductionEntries || []).reduce((sum, e) => sum + e.amount, 0);
    
    const calculateTax = (taxable, slabs) => {
      let tax = 0;
      let remaining = taxable;
      for (const [limit, rate] of slabs) {
        const chunk = Math.min(remaining, limit);
        if (chunk <= 0) break;
        tax += chunk * rate;
        remaining -= chunk;
      }
      if (remaining > 0) tax += remaining * slabs[slabs.length - 1][1];
      return Math.max(0, Math.round(tax));
    };

    const oldRegimeTaxable = Math.max(0, totalIncome - totalDeductions);
    const oldRegimeTax = calculateTax(oldRegimeTaxable, [[250000, 0], [250000, 0.05], [500000, 0.2]]);
    const newRegimeTax = calculateTax(totalIncome, [[300000, 0], [300000, 0.05], [300000, 0.1], [300000, 0.15], [300000, 0.2]]);

    const taxRecords = [
      {
        userId: testUser._id,
        year: currentYear,
        totalIncome,
        totalDeductions,
        taxableIncome: oldRegimeTaxable,
        oldRegimeTax,
        newRegimeTax,
        selectedRegime: oldRegimeTax <= newRegimeTax ? 'Old Regime' : 'New Regime',
        taxPaid: Math.min(oldRegimeTax, newRegimeTax),
        status: 'draft',
        dueDate: new Date(currentYear, 6, 31),
        incomeBreakdown: testUser.incomeEntries.map(e => ({
          source: e.source,
          amount: e.amount
        })),
        deductionBreakdown: testUser.deductionEntries.map(e => ({
          section: e.section,
          amount: e.amount
        }))
      },
      {
        userId: testUser._id,
        year: 2023,
        totalIncome: 800000,
        totalDeductions: 150000,
        taxableIncome: 650000,
        oldRegimeTax: 62500,
        newRegimeTax: 70000,
        selectedRegime: 'Old Regime',
        taxPaid: 62500,
        status: 'paid',
        filedDate: new Date(2023, 6, 15),
        dueDate: new Date(2023, 6, 31),
        incomeBreakdown: [
          { source: 'Salary', amount: 800000 }
        ],
        deductionBreakdown: [
          { section: '80C', amount: 150000 }
        ]
      }
    ];

    for (const record of taxRecords) {
      await TaxRecord.findOneAndUpdate(
        { userId: record.userId, year: record.year },
        record,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Created/Updated ${taxRecords.length} tax records`);

    // Seed sample notifications
    console.log('🔔 Seeding sample notifications...');
    const notifications = [
      {
        userId: testUser._id,
        title: 'Welcome to TaxMate!',
        message: 'Get started by adding your income and deduction entries.',
        type: 'info',
        priority: 'high',
        isRead: false
      },
      {
        userId: testUser._id,
        title: 'Tax Filing Reminder',
        message: `Don't forget to file your taxes for FY ${currentYear}. Deadline is July 31st.`,
        type: 'reminder',
        priority: 'high',
        isRead: false,
        expiresAt: new Date(currentYear, 6, 31)
      },
      {
        userId: testUser._id,
        title: 'Payment Successful',
        message: 'Your tax payment of ₹25,000 has been processed successfully.',
        type: 'success',
        priority: 'medium',
        isRead: false
      },
      {
        userId: testUser._id,
        title: 'Tax Optimization Tip',
        message: 'You can save ₹15,000 more by utilizing Section 80D deductions for health insurance.',
        type: 'info',
        priority: 'low',
        isRead: true
      }
    ];

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Created ${createdNotifications.length} sample notifications`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - User: ${testUser.email}`);
    console.log(`   - Payments: ${createdPayments.length}`);
    console.log(`   - Tax Records: ${taxRecords.length}`);
    console.log(`   - Notifications: ${createdNotifications.length}`);
    console.log(`   - Income Entries: ${testUser.incomeEntries?.length || 0}`);
    console.log(`   - Deduction Entries: ${testUser.deductionEntries?.length || 0}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
