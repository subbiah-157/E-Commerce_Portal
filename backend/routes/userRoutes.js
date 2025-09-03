const express = require("express");
const router = express.Router();
const { protect, verifyAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET all users (admin only)
router.get("/", protect, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    console.log("Fetched Users:", users);
    res.json(users);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});


// GET single user
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Update currency
router.put("/currency", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.currency = req.body.currency || "GBP";
    const updatedUser = await user.save();
    res.json({ currency: updatedUser.currency });
  } catch (err) {
    res.status(500).json({ message: "Failed to update currency" });
  }
});

// UPDATE user profile
router.put("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ update new regionCode + mobile separately
    user.name = req.body.name || user.name;
    user.regionCode = req.body.regionCode || user.regionCode;
    user.mobile = req.body.mobile || user.mobile;
    user.houseNumber = req.body.houseNumber || user.houseNumber;
    user.region = req.body.region || user.region;
    user.district = req.body.district || user.district;
    user.state = req.body.state || user.state;
    user.pincode = req.body.pincode || user.pincode;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" });
  }
});

module.exports = router;
