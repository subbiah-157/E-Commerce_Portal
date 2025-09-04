const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = [
      {
        name: "Admin",
        email: "admin@gmail.com",
        password: await bcrypt.hash("admin@123", 10),
        isAdmin: true,
        role: "admin",
      },
      {
        name: "Shipping",
        email: "shipping@gmail.com",
        password: await bcrypt.hash("ship@123", 10),
        role: "shipping",
      },
      {
        name: "Delivery",
        email: "delivery@gmail.com",
        password: await bcrypt.hash("deli@123", 10),
        role: "delivery",
      },
      {
        name: "Support",
        email: "support@gmail.com",
        password: await bcrypt.hash("support@123", 10),
        role: "support",
      },
    ];

    for (const user of users) {
      const result = await User.updateOne(
        { email: user.email },   // filter
        { $set: user },          // update fields
        { upsert: true }         // create if not exist
      );
      console.log(`User ${user.email} seeded/updated ✅`, result);
    }

    console.log("🎉 All users seeded/updated");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
};

seedUsers();
