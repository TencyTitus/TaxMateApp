const mongoose = require("mongoose");

const taxRecordSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  totalIncome: { 
    type: Number, 
    default: 0 
  },
  totalDeductions: { 
    type: Number, 
    default: 0 
  },
  taxableIncome: { 
    type: Number, 
    default: 0 
  },
  oldRegimeTax: { 
    type: Number, 
    default: 0 
  },
  newRegimeTax: { 
    type: Number, 
    default: 0 
  },
  selectedRegime: { 
    type: String, 
    enum: ['Old Regime', 'New Regime'],
    default: 'Old Regime'
  },
  taxPaid: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['draft', 'filed', 'paid', 'pending'],
    default: 'draft' 
  },
  filedDate: { type: Date },
  dueDate: { type: Date },
  incomeBreakdown: [{
    source: String,
    amount: Number
  }],
  deductionBreakdown: [{
    section: String,
    amount: Number
  }]
}, { timestamps: true });

// Compound index to ensure one record per user per year
taxRecordSchema.index({ userId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("TaxRecord", taxRecordSchema);
