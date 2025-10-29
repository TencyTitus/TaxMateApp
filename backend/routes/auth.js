const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTPEmail, sendPasswordResetConfirmation } = require("../config/email");
const { createWelcomeNotification } = require("../utils/notificationHelper");

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin || false
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Register route
router.post("/register", async (req, res) => {
  // Accept both 'fullName' and 'name' from frontend
  const name = req.body.fullName ? req.body.fullName : req.body.name;
  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    // Create welcome notification for new user
    await createWelcomeNotification(user._id, name);

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email, 
        isAdmin: user.isAdmin || false 
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Forgot Password - Request OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (10 minutes)
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { otp, expiresAt: expirationTime });

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
      
      res.json({ 
        message: "OTP sent to your email. Please check your inbox."
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      
      // Still return success since OTP was shown in console (fallback)
      res.json({ 
        message: "OTP sent. Please check your email or contact support."
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if OTP exists
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return res.status(400).json({ error: "No OTP request found. Please request a new OTP." });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Verify OTP again before resetting password
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return res.status(400).json({ error: "No OTP request found. Please start the process again." });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    // Clear OTP from store
    otpStore.delete(email);

    // Send confirmation email
    try {
      await sendPasswordResetConfirmation(email, user.name);
    } catch (emailError) {
      // Don't fail the request if confirmation email fails
      console.error("Confirmation email failed:", emailError);
    }

    console.log(`\n=================================`);
    console.log(`✅ Password reset successful for: ${email}`);
    console.log(`=================================\n`);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
