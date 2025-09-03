const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    regionCode: { type: String, default: "+91" }, // ✅ country code
    mobile: { type: String },
    houseNumber: { type: String },
    region: { type: String },
    district: { type: String },
    state: { type: String },
    pincode: { type: String },
    isAdmin: { type: Boolean, default: false },
    currency: { type: String, default: "GBP" },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    role: { type: String, default: "user" }, // ✅ Added role field
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
