require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const taxRecordRoutes = require("./routes/taxRecord");
const notificationRoutes = require("./routes/notification");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// ✅ MongoDB connection (cleaned up)
mongoose
  .connect("mongodb://127.0.0.1:27017/taxmate")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// ✅ Routes
app.use("/", authRoutes);
app.use("/api/user", userRoutes);
app.use("/users", userRoutes); // Admin route for fetching all users
app.use("/api/payments", paymentRoutes); // Includes admin route /api/payments/all-payments
app.use("/api/tax-records", taxRecordRoutes); // Includes admin route /api/tax-records/all-tax-records
app.use("/api/notifications", notificationRoutes);

// Admin-specific routes (mapped to the routes above)
app.use("/api/admin", paymentRoutes); // /api/admin/all-payments
app.use("/api/admin", taxRecordRoutes); // /api/admin/all-tax-records

// ✅ Tax calculation endpoint
app.post("/calculate-tax", (req, res) => {
  const { income } = req.body;
  let tax = 0;

  if (income <= 250000) tax = 0;
  else if (income <= 500000) tax = (income - 250000) * 0.05;
  else if (income <= 1000000) tax = 250000 * 0.05 + (income - 500000) * 0.2;
  else tax = 250000 * 0.05 + 500000 * 0.2 + (income - 1000000) * 0.3;

  res.json({ tax });
});

// ✅ Server listener
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
