const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['info', 'warning', 'success', 'error', 'reminder'],
    default: 'info' 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium' 
  },
  actionUrl: { type: String },
  expiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
