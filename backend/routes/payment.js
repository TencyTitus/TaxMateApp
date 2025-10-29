const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const authenticateToken = require("../middleware/auth");
const { createPaymentNotification } = require("../utils/notificationHelper");

// ADMIN: GET all payments (for admin dashboard) - MUST BE FIRST
router.get("/all-payments", async (req, res) => {
  try {
    // In production, add admin authentication check here
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all payments for authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single payment by transaction ID
router.get("/:transactionId", authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      transactionId: req.params.transactionId,
      userId: req.user.id 
    });
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create new payment
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { 
      amount, 
      paymentMethod, 
      email, 
      phone, 
      nameOnCard,
      cardNumber,
      taxYear,
      description 
    } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    
    if (!paymentMethod || !['credit', 'debit', 'netbanking', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ error: "Valid payment method is required" });
    }
    
    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Extract last 4 digits of card if provided
    let cardLastFour = null;
    if (cardNumber && cardNumber.length >= 4) {
      cardLastFour = cardNumber.slice(-4);
    }
    
    const payment = new Payment({
      userId: req.user.id,
      transactionId,
      amount: Number(amount),
      paymentMethod,
      status: 'completed',
      email,
      phone,
      nameOnCard,
      cardLastFour,
      taxYear: taxYear || new Date().getFullYear(),
      description: description || `Tax payment for year ${taxYear || new Date().getFullYear()}`
    });
    
    await payment.save();
    
    // Create notification for successful payment
    await createPaymentNotification(req.user.id, Number(amount), taxYear || new Date().getFullYear());
    
    res.status(201).json({ 
      message: "Payment processed successfully",
      payment 
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET payment statistics for user
router.get("/stats/summary", authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id });
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalTransactions = payments.length;
    const lastPayment = payments.length > 0 ? payments[0] : null;
    
    res.json({
      totalPaid,
      totalTransactions,
      lastPayment,
      paymentsByYear: payments.reduce((acc, p) => {
        const year = p.taxYear || new Date(p.createdAt).getFullYear();
        acc[year] = (acc[year] || 0) + p.amount;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
