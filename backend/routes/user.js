const express = require("express");
const router = express.Router();
const User = require("../models/User");
const TaxRecord = require("../models/TaxRecord");
const Payment = require("../models/Payment");
const authenticateToken = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const { 
  createDocumentUploadNotification,
  createIncomeEntryNotification,
  createDeductionEntryNotification,
  createProfileUpdateNotification
} = require("../utils/notificationHelper");

// Multer storage for documents/images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  }
});

// GET user profile (for demo, get by email from query param)
router.get("/profile", async (req, res) => {
  const email = req.query.email || "tency@example.com";
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    name: user.name,
    email: user.email,
    pan: user.pan,
    aadhaar: user.aadhaar,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    occupation: user.occupation,
    bank: user.bank,
    contact: user.contact,
    taxDocs: user.taxDocs,
    preferences: user.preferences,
    lastLogin: user.lastLogin,
    registeredOn: user._id.getTimestamp(),
    incomeEntries: user.incomeEntries || [],
    deductionEntries: user.deductionEntries || [],
  });
});

// GET authenticated user profile (with JWT)
router.get("/profile/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({
      name: user.name,
      email: user.email,
      pan: user.pan,
      aadhaar: user.aadhaar,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      occupation: user.occupation,
      bank: user.bank,
      contact: user.contact,
      taxDocs: user.taxDocs || [],
      preferences: user.preferences,
      lastLogin: user.lastLogin,
      registeredOn: user._id.getTimestamp(),
      incomeEntries: user.incomeEntries || [],
      deductionEntries: user.deductionEntries || [],
    });
  } catch (error) {
    console.error("Error fetching authenticated profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update user profile (for demo, update by email)
router.put("/profile", async (req, res) => {
  const email = req.body.email;
  const updateFields = {
    name: req.body.name,
    pan: req.body.pan,
    aadhaar: req.body.aadhaar,
    dateOfBirth: req.body.dateOfBirth,
    gender: req.body.gender,
    occupation: req.body.occupation,
    bank: req.body.bank,
    contact: req.body.contact,
  };
  
  // Update preferences if provided
  if (req.body.preferences) {
    updateFields.preferences = req.body.preferences;
  }
  
  const user = await User.findOneAndUpdate(
    { email },
    updateFields,
    { new: true }
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    name: user.name,
    email: user.email,
    pan: user.pan,
    aadhaar: user.aadhaar,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    occupation: user.occupation,
    bank: user.bank,
    contact: user.contact,
    taxDocs: user.taxDocs,
    preferences: user.preferences,
    registeredOn: user._id.getTimestamp(),
  });
});

// POST upload tax document (dummy, no file storage)
router.post("/tax-docs", upload.single('file'), async (req, res) => {
  try {
    const { email, docType } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = req.file.originalname;
    const fileUrl = `/uploads/${req.file.filename}`;
    const doc = { docType, fileName, fileUrl, uploadedAt: new Date() };
    user.taxDocs.push(doc);
    await user.save();
    
    // Create notification for document upload
    await createDocumentUploadNotification(user._id, docType);
    
    return res.json(doc);
  } catch (err) {
    console.error('Upload failed', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// GET all tax documents
router.get("/tax-docs", async (req, res) => {
  const email = req.query.email || "tency@example.com";
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user.taxDocs || []);
});

// GET tax summary for a user
router.get("/tax-summary", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Calculate total income from tax documents (example: sum of all document amounts)
    const totalIncome = user.taxDocs?.reduce((sum, doc) => sum + (doc.amount || 0), 0) || 0;
    
    // Calculate tax (simplified calculation - replace with your actual tax logic)
    let tax = 0;
    if (totalIncome > 500000) tax = totalIncome * 0.2; // Example: 20% tax for income > 5L
    else if (totalIncome > 250000) tax = totalIncome * 0.1; // 10% for income > 2.5L
    
    res.json({
      income: totalIncome,
      taxPaid: tax,
      lastUpdated: user.updatedAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in tax-summary:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET tax history for a user
router.get("/history", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Try to fetch from TaxRecord collection first
    const taxRecords = await TaxRecord.find({ userId: user._id }).sort({ year: -1 });
    
    if (taxRecords.length > 0) {
      // Return data from TaxRecord collection
      const history = taxRecords.map(record => ({
        year: record.year,
        income: record.totalIncome,
        tax: record.taxPaid,
        status: record.status,
        regime: record.selectedRegime
      }));
      return res.json(history);
    }
    
    // Fallback: Calculate from user's income/deduction entries for current year
    const totalIncome = (user.incomeEntries || []).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    const totalDeductions = (user.deductionEntries || []).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    
    // Tax calculation function
    const computeSlabTax = (taxable, slabs) => {
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
    
    // Calculate tax for old regime (with deductions)
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    const taxPaid = computeSlabTax(taxableIncome, [[250000, 0], [250000, 0.05], [500000, 0.2]]);
    
    // Return current year's data only if there's data
    if (totalIncome > 0 || taxPaid > 0) {
      const currentYear = new Date().getFullYear();
      const history = [
        {
          year: currentYear,
          income: totalIncome,
          tax: taxPaid
        }
      ];
      return res.json(history);
    }
    
    // No data at all
    res.json([]);
    
  } catch (error) {
    console.error("Error in tax history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// GET all users (Admin only)
router.get("/", async (req, res) => {
  try {
    // In production, add admin authentication middleware here
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.json({
      users: users.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        status: user.status || 'active',
        // Personal Details
        pan: user.pan,
        aadhaar: user.aadhaar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        occupation: user.occupation,
        // Contact Details
        contact: user.contact,
        // Bank Details
        bank: user.bank,
        // Tax Documents
        taxDocs: user.taxDocs,
        // Income and Deductions
        incomeEntries: user.incomeEntries,
        deductionEntries: user.deductionEntries,
        // Preferences
        preferences: user.preferences,
        // Timestamps
        lastLogin: user.lastLogin,
        createdAt: user.createdAt || user._id.getTimestamp(),
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE user by ID (Admin only)
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent deleting admin users
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }
    
    await User.findByIdAndDelete(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update user status (Admin only)
router.put("/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "Status updated successfully", user });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// AUTHENTICATED USER DATA ENDPOINTS
// ============================================

// GET user's income entries (authenticated)
router.get("/income-entries", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    let entries = user.incomeEntries || [];
    
    // Filter by year if provided
    if (year) {
      entries = entries.filter(e => (e.year || new Date(e.createdAt).getFullYear()) === year);
    }
    
    res.json({ incomeEntries: entries });
  } catch (error) {
    console.error("Error fetching income entries:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST add income entry (authenticated)
router.post("/income-entries", authenticateToken, async (req, res) => {
  try {
    const { source, amount, year } = req.body;
    
    if (!source || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid source and amount are required" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const entry = {
      source,
      amount: Number(amount),
      year: Number(year) || new Date().getFullYear(),
      createdAt: new Date()
    };
    
    user.incomeEntries.push(entry);
    await user.save();
    
    // Create notification for income entry
    await createIncomeEntryNotification(req.user.id, source, Number(amount), entry.year);
    
    res.status(201).json({ message: "Income entry added", entry });
  } catch (error) {
    console.error("Error adding income entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET user's deduction entries (authenticated)
router.get("/deduction-entries", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    let entries = user.deductionEntries || [];
    
    // Filter by year if provided
    if (year) {
      entries = entries.filter(e => (e.year || new Date(e.createdAt).getFullYear()) === year);
    }
    
    res.json({ deductionEntries: entries });
  } catch (error) {
    console.error("Error fetching deduction entries:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST add deduction entry (authenticated)
router.post("/deduction-entries", authenticateToken, async (req, res) => {
  try {
    const { section, amount, year } = req.body;
    
    if (!section || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid section and amount are required" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const entry = {
      section,
      amount: Number(amount),
      year: Number(year) || new Date().getFullYear(),
      createdAt: new Date()
    };
    
    user.deductionEntries.push(entry);
    await user.save();
    
    // Create notification for deduction entry
    await createDeductionEntryNotification(req.user.id, section, Number(amount), entry.year);
    
    res.status(201).json({ message: "Deduction entry added", entry });
  } catch (error) {
    console.error("Error adding deduction entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update income entry (authenticated)
router.put("/income-entries/:index", authenticateToken, async (req, res) => {
  try {
    const { index } = req.params;
    const { source, amount } = req.body;
    
    if (!source || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid source and amount are required" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const idx = parseInt(index);
    if (idx < 0 || idx >= user.incomeEntries.length) {
      return res.status(404).json({ error: "Income entry not found" });
    }
    
    user.incomeEntries[idx].source = source;
    user.incomeEntries[idx].amount = Number(amount);
    await user.save();
    
    res.json({ message: "Income entry updated", entry: user.incomeEntries[idx] });
  } catch (error) {
    console.error("Error updating income entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE income entry (authenticated)
router.delete("/income-entries/:index", authenticateToken, async (req, res) => {
  try {
    const { index } = req.params;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const idx = parseInt(index);
    if (idx < 0 || idx >= user.incomeEntries.length) {
      return res.status(404).json({ error: "Income entry not found" });
    }
    
    user.incomeEntries.splice(idx, 1);
    await user.save();
    
    res.json({ message: "Income entry deleted" });
  } catch (error) {
    console.error("Error deleting income entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update deduction entry (authenticated)
router.put("/deduction-entries/:index", authenticateToken, async (req, res) => {
  try {
    const { index } = req.params;
    const { section, amount } = req.body;
    
    if (!section || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid section and amount are required" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const idx = parseInt(index);
    if (idx < 0 || idx >= user.deductionEntries.length) {
      return res.status(404).json({ error: "Deduction entry not found" });
    }
    
    user.deductionEntries[idx].section = section;
    user.deductionEntries[idx].amount = Number(amount);
    await user.save();
    
    res.json({ message: "Deduction entry updated", entry: user.deductionEntries[idx] });
  } catch (error) {
    console.error("Error updating deduction entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE deduction entry (authenticated)
router.delete("/deduction-entries/:index", authenticateToken, async (req, res) => {
  try {
    const { index } = req.params;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const idx = parseInt(index);
    if (idx < 0 || idx >= user.deductionEntries.length) {
      return res.status(404).json({ error: "Deduction entry not found" });
    }
    
    user.deductionEntries.splice(idx, 1);
    await user.save();
    
    res.json({ message: "Deduction entry deleted" });
  } catch (error) {
    console.error("Error deleting deduction entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET tax optimization data (authenticated)
router.get("/tax-optimization", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Calculate totals from user's entries
    const totalIncome = (user.incomeEntries || []).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    const totalDeductions = (user.deductionEntries || []).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    
    // Tax calculation logic (simplified - can be enhanced)
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
    
    // Old regime (with deductions)
    const oldRegimeTaxable = Math.max(0, totalIncome - totalDeductions);
    const oldRegimeTax = calculateTax(oldRegimeTaxable, [[250000, 0], [250000, 0.05], [500000, 0.2]]);
    
    // New regime (no deductions)
    const newRegimeTaxable = Math.max(0, totalIncome);
    const newRegimeTax = calculateTax(newRegimeTaxable, [[300000, 0], [300000, 0.05], [300000, 0.1], [300000, 0.15], [300000, 0.2]]);
    
    const recommendation = oldRegimeTax <= newRegimeTax ? "Old Regime" : "New Regime";
    const savings = Math.abs(oldRegimeTax - newRegimeTax);
    
    res.json({
      totalIncome,
      totalDeductions,
      oldRegime: {
        taxableIncome: oldRegimeTaxable,
        tax: oldRegimeTax
      },
      newRegime: {
        taxableIncome: newRegimeTaxable,
        tax: newRegimeTax
      },
      recommendation,
      savings
    });
  } catch (error) {
    console.error("Error calculating tax optimization:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
