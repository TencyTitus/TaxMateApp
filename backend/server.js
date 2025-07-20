const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/taxmate", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", authRoutes);

app.post("/calculate-tax", (req, res) => {
  const { income } = req.body;
  let tax = 0;

  if (income <= 250000) tax = 0;
  else if (income <= 500000) tax = (income - 250000) * 0.05;
  else if (income <= 1000000) tax = 250000 * 0.05 + (income - 500000) * 0.2;
  else tax = 250000 * 0.05 + 500000 * 0.2 + (income - 1000000) * 0.3;

  res.json({ tax });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
