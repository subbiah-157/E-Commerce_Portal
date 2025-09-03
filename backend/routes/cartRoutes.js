const express = require("express");
const router = express.Router();
const { getCart, addToCart, removeFromCart, updateQty } = require("../controllers/cartController");
const { protect, verifyAdmin } = require("../middleware/authMiddleware");

// ===== Existing cart routes =====
router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/update", protect, updateQty);
router.delete("/remove", protect, removeFromCart);

// ===== Admin route to view all users' cart items =====
router.get("/admin/all", protect, verifyAdmin, async (req, res) => {
  try {
    const Cart = require("../models/Cart");
    const carts = await Cart.find()
      .populate("user", "name email")       // populate user info
      .populate("products.product");        // populate product details

    const allCartItems = [];
    carts.forEach(cart => {
      cart.products.forEach(item => {
        if (item.product) { // ✅ Only include if product exists
          allCartItems.push({
            user: { id: cart.user._id, name: cart.user.name, email: cart.user.email },
            product: item.product,
            qty: item.qty,
            selectedSize: item.selectedSize || ""
          });
        }
      });
    });

    res.json(allCartItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch all carts" });
  }
});

module.exports = router;