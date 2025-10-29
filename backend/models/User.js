const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'suspended'], default: 'active' },
  pan: { type: String },
  aadhaar: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  occupation: { type: String },
  bank: {
    accountNumber: { type: String },
    ifsc: { type: String },
    bankName: { type: String },
    branch: { type: String },
  },
  contact: {
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  taxDocs: [
    {
      docType: String, // e.g., Salary Slip, Form 16, etc.
      fileName: String,
      fileUrl: String,
      uploadedAt: Date,
    }
  ],
  incomeEntries: [
    {
      source: { type: String, required: true }, // e.g., Salary, Freelance, Investments
      amount: { type: Number, required: true },
      description: { type: String },
      year: { type: Number }, // Associate entry with a tax year
      createdAt: { type: Date, default: Date.now }
    }
  ],
  deductionEntries: [
    {
      section: { type: String, required: true }, // e.g., 80C, 80D
      amount: { type: Number, required: true },
      description: { type: String },
      year: { type: Number }, // Associate entry with a tax year
      createdAt: { type: Date, default: Date.now }
    }
  ],
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    taxRegime: { type: String, enum: ['Old Regime', 'New Regime'], default: 'Old Regime' },
  },
  lastLogin: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
