const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/taxmate";

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Admin credentials
    const adminEmail = "admin@taxmate.com";
    const adminPassword = "Admin@123";
    const adminName = "TaxMate Admin";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("Email:", adminEmail);
      
      // Update existing user to be admin
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log("✅ Updated existing user to admin role");
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true
      });

      await adminUser.save();
      console.log("✅ Admin user created successfully!");
      console.log("\n📧 Admin Login Credentials:");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
      console.log("\n⚠️  IMPORTANT: Change the admin password after first login!\n");
    }

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up admin:", error);
    process.exit(1);
  }
}

// Run the setup
setupAdmin();
