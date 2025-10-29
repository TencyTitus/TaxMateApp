const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  transactionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['credit', 'debit', 'netbanking', 'upi'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'],
    default: 'completed' 
  },
  email: { type: String },
  phone: { type: String },
  nameOnCard: { type: String },
  cardLastFour: { type: String }, // Last 4 digits of card
  taxYear: { type: Number },
  description: { type: String },
  receiptUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
