const express = require("express");
const router = express.Router();
const TaxRecord = require("../models/TaxRecord");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");
const { createTaxRecordNotification } = require("../utils/notificationHelper");

// Tax calculation helper function
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

// ADMIN: GET all tax records (for admin dashboard) - MUST BE FIRST
router.get("/all-tax-records", async (req, res) => {
  try {
    // In production, add admin authentication check here
    const records = await TaxRecord.find({}).sort({ year: -1, createdAt: -1 });
    res.json({ records });
  } catch (error) {
    console.error("Error fetching all tax records:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all tax records for authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const records = await TaxRecord.find({ userId: req.user.id })
      .sort({ year: -1 });
    res.json({ records });
  } catch (error) {
    console.error("Error fetching tax records:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET tax record for specific year
router.get("/:year", authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const record = await TaxRecord.findOne({ 
      userId: req.user.id,
      year 
    });
    
    if (!record) {
      return res.status(404).json({ error: "Tax record not found for this year" });
    }
    
    res.json(record);
  } catch (error) {
    console.error("Error fetching tax record:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST/PUT create or update tax record for a year
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { year } = req.body;
    
    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }
    
    // Fetch user data
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const y = parseInt(year);
    
    // Filter entries for the requested year (fallback to createdAt year if 'year' field missing)
    const incomeEntriesByYear = (user.incomeEntries || []).filter(
      e => (e.year || new Date(e.createdAt).getFullYear()) === y
    );
    const deductionEntriesByYear = (user.deductionEntries || []).filter(
      e => (e.year || new Date(e.createdAt).getFullYear()) === y
    );
    
    // Calculate totals from year-filtered entries
    const totalIncome = incomeEntriesByYear.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalDeductions = deductionEntriesByYear.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    // Calculate taxes for both regimes
    const oldRegimeTaxable = Math.max(0, totalIncome - totalDeductions);
    const oldRegimeTax = calculateTax(oldRegimeTaxable, 
      [[250000, 0], [250000, 0.05], [500000, 0.2]]);
    
    const newRegimeTaxable = Math.max(0, totalIncome);
    const newRegimeTax = calculateTax(newRegimeTaxable, 
      [[300000, 0], [300000, 0.05], [300000, 0.1], [300000, 0.15], [300000, 0.2]]);
    
    const selectedRegime = oldRegimeTax <= newRegimeTax ? "Old Regime" : "New Regime";
    const taxPaid = Math.min(oldRegimeTax, newRegimeTax);
    
    // Create income and deduction breakdowns for the specific year
    const incomeBreakdown = incomeEntriesByYear.map(e => ({
      source: e.source,
      amount: e.amount
    }));
    
    const deductionBreakdown = deductionEntriesByYear.map(e => ({
      section: e.section,
      amount: e.amount
    }));
    
    // Update or create tax record for the year
    const taxRecord = await TaxRecord.findOneAndUpdate(
      { userId: req.user.id, year: y },
      {
        totalIncome,
        totalDeductions,
        taxableIncome: oldRegimeTaxable,
        oldRegimeTax,
        newRegimeTax,
        selectedRegime,
        taxPaid,
        incomeBreakdown,
        deductionBreakdown,
        status: 'draft',
        dueDate: new Date(y, 6, 31) // July 31st of the year
      },
      { new: true, upsert: true }
    );
    
    // Create notification for tax record saved
    await createTaxRecordNotification(req.user.id, y, taxPaid);
    
    res.json({ 
      message: "Tax record saved successfully",
      record: taxRecord 
    });
  } catch (error) {
    console.error("Error saving tax record:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update tax record status
router.put("/:year/status", authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const { status } = req.body;
    
    if (!['draft', 'filed', 'paid', 'pending'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const updateData = { status };
    if (status === 'filed') {
      updateData.filedDate = new Date();
    }
    
    const record = await TaxRecord.findOneAndUpdate(
      { userId: req.user.id, year },
      updateData,
      { new: true }
    );
    
    if (!record) {
      return res.status(404).json({ error: "Tax record not found" });
    }
    
    res.json({ 
      message: "Status updated successfully",
      record 
    });
  } catch (error) {
    console.error("Error updating tax record:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE tax record
router.delete("/:year", authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    const record = await TaxRecord.findOneAndDelete({ 
      userId: req.user.id, 
      year 
    });
    
    if (!record) {
      return res.status(404).json({ error: "Tax record not found" });
    }
    
    res.json({ message: "Tax record deleted successfully" });
  } catch (error) {
    console.error("Error deleting tax record:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
